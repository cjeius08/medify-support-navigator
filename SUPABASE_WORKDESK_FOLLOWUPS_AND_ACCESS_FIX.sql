-- SAFE, NON-DESTRUCTIVE MEDIFY WORKDESK FOLLOW-UP + ACCESS CODE FIX
-- Run manually in Supabase Dashboard > SQL Editor AFTER
-- SUPABASE_DYNAMIC_INITIALS_MIGRATION.sql. Do not run this automatically.
--
-- This only adds nullable follow-up data and replaces two RPC definitions.
-- It does not delete or reset users, reports, invite codes, JA, FA, or historical data.

begin;

-- Supabase normally places pgcrypto in the extensions schema.  Keeping it
-- explicitly on the function search path fixes: function gen_salt(unknown)
-- does not exist.
create extension if not exists pgcrypto with schema extensions;

alter table public.medify_call_reports
  add column if not exists follow_up_needed boolean not null default false,
  add column if not exists follow_up_date date,
  add column if not exists follow_up_note text;

create index if not exists medify_call_reports_follow_up_date_idx
  on public.medify_call_reports (follow_up_date)
  where follow_up_needed = true;

create or replace function public.medify_create_invite(
  p_code text,
  p_initials text default 'FA'
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  invite_id uuid;
  v text := upper(trim(p_initials));
begin
  if not public.medify_is_creator() then
    raise exception 'Creator access required.';
  end if;
  if length(trim(p_code)) < 8 then
    raise exception 'Use an access code with at least 8 characters.';
  end if;
  if not exists (
    select 1 from public.medify_agent_initials where initials = v and active
  ) then
    raise exception 'Choose an active initials option.';
  end if;
  insert into public.medify_invite_codes
    (code_value, code_hash, role, created_by, assigned_initials)
  values
    (trim(p_code), extensions.crypt(p_code, extensions.gen_salt('bf')),
     'agent', auth.uid(), v)
  returning id into invite_id;
  return invite_id;
end;
$$;

create or replace function public.medify_redeem_invite(
  p_code text,
  p_username text,
  p_initials text
) returns public.medify_profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c public.medify_invite_codes;
  p public.medify_profiles;
  v text := upper(trim(p_initials));
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  if p_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'Use 3-24 lowercase letters, numbers, or underscores.';
  end if;
  select * into c
  from public.medify_invite_codes
  where used_at is null
    and revoked_at is null
    and deactivated_at is null
    and extensions.crypt(p_code, code_hash) = code_hash
  limit 1
  for update;
  if c.id is null then
    raise exception 'That access code is invalid, used, or revoked.';
  end if;
  if c.assigned_initials is not null and c.assigned_initials <> v then
    raise exception 'Use the initials assigned to this access code.';
  end if;
  if not exists (
    select 1 from public.medify_agent_initials where initials = v and active
  ) then
    raise exception 'Choose an active initials option.';
  end if;
  insert into public.medify_profiles(id, username, initials, role)
  values (auth.uid(), p_username, v, c.role)
  returning * into p;
  update public.medify_invite_codes set used_by = auth.uid(), used_at = now()
  where id = c.id;
  return p;
end;
$$;

-- This is intentionally limited to unused initials.  Existing user/profile
-- history is never altered; use Deactivate for initials with a user.
create or replace function public.medify_delete_agent_initial(p_initials text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v text := upper(trim(p_initials));
  used_count integer;
begin
  if not public.medify_is_creator() then
    raise exception 'Creator access required.';
  end if;
  if v in ('JA', 'FA') then
    raise exception 'JA and FA must remain.';
  end if;
  select count(*) into used_count from public.medify_profiles where initials = v;
  if used_count > 0 then
    raise exception 'This initials entry is assigned to an existing user. Deactivate it instead to preserve history.';
  end if;
  delete from public.medify_agent_initials where initials = v;
  return found;
end;
$$;

grant execute on function public.medify_create_invite(text, text) to authenticated;
grant execute on function public.medify_redeem_invite(text, text, text) to authenticated;
grant execute on function public.medify_delete_agent_initial(text) to authenticated;

commit;
