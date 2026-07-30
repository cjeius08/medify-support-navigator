-- Medify Support Navigator: secure team accounts and private call reports.
-- Run once in Supabase Dashboard > SQL Editor. Change the creator code first.

create extension if not exists pgcrypto;

create type public.medify_role as enum ('creator', 'agent');

create table public.medify_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$'),
  initials text not null default 'JA' check (initials in ('JA', 'FA')),
  role public.medify_role not null default 'agent',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.medify_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,
  role public.medify_role not null default 'agent',
  created_by uuid references public.medify_profiles(id) on delete set null,
  used_by uuid unique references public.medify_profiles(id) on delete set null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.medify_call_reports (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.medify_profiles(id) on delete cascade,
  started_at timestamptz not null,
  stopped_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  call_driver text not null,
  note_fields jsonb not null,
  imported_from_browser boolean not null default false,
  created_at timestamptz not null default now()
);

create index medify_reports_agent_date on public.medify_call_reports(agent_id, stopped_at desc);

alter table public.medify_profiles enable row level security;
alter table public.medify_invite_codes enable row level security;
alter table public.medify_call_reports enable row level security;

create or replace function public.medify_is_creator()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.medify_profiles where id = auth.uid() and role = 'creator' and is_active) $$;

create policy "profiles: own or creator" on public.medify_profiles for select to authenticated
using (id = auth.uid() or public.medify_is_creator());
create policy "profiles: creator updates" on public.medify_profiles for update to authenticated
using (public.medify_is_creator()) with check (public.medify_is_creator());

create policy "reports: own or creator reads" on public.medify_call_reports for select to authenticated
using (agent_id = auth.uid() or public.medify_is_creator());
create policy "reports: own inserts" on public.medify_call_reports for insert to authenticated
with check (agent_id = auth.uid() and exists (select 1 from public.medify_profiles where id = auth.uid() and is_active));
create policy "reports: own deletes or creator" on public.medify_call_reports for delete to authenticated
using (agent_id = auth.uid() or public.medify_is_creator());
create policy "reports: own updates or creator" on public.medify_call_reports for update to authenticated
using (agent_id = auth.uid() or public.medify_is_creator())
with check (agent_id = auth.uid() or public.medify_is_creator());

create or replace function public.medify_redeem_invite(p_code text, p_username text, p_initials text)
returns public.medify_profiles language plpgsql security definer set search_path = public
as $$
declare code_row public.medify_invite_codes; profile_row public.medify_profiles;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  if p_username !~ '^[a-z0-9_]{3,24}$' then raise exception 'Use 3-24 lowercase letters, numbers, or underscores.'; end if;
  if p_initials not in ('JA', 'FA') then raise exception 'Choose a valid initials option.'; end if;
  select * into code_row from public.medify_invite_codes
    where used_at is null and revoked_at is null and crypt(p_code, code_hash) = code_hash
    limit 1 for update;
  if code_row.id is null then raise exception 'That access code is invalid, used, or revoked.'; end if;
  insert into public.medify_profiles (id, username, initials, role)
    values (auth.uid(), p_username, p_initials, code_row.role)
    returning * into profile_row;
  update public.medify_invite_codes set used_by = auth.uid(), used_at = now() where id = code_row.id;
  return profile_row;
end;
$$;

create or replace function public.medify_create_invite(p_code text, p_initials text default 'FA')
returns uuid language plpgsql security definer set search_path = public
as $$ declare invite_id uuid;
begin
  if not public.medify_is_creator() then raise exception 'Creator access required.'; end if;
  if length(trim(p_code)) < 8 then raise exception 'Use an access code with at least 8 characters.'; end if;
  if p_initials not in ('JA', 'FA') then raise exception 'Choose a valid initials option.'; end if;
  insert into public.medify_invite_codes (code_hash, role, created_by)
    values (crypt(p_code, gen_salt('bf')), 'agent', auth.uid()) returning id into invite_id;
  return invite_id;
end;
$$;

revoke all on public.medify_profiles, public.medify_invite_codes, public.medify_call_reports from anon;
grant select, insert, update on public.medify_profiles to authenticated;
grant select, insert, update, delete on public.medify_call_reports to authenticated;
grant execute on function public.medify_redeem_invite(text, text, text) to authenticated;
grant execute on function public.medify_create_invite(text, text) to authenticated;

-- IMPORTANT: choose a private Creator code, then replace CHANGE_THIS_CREATOR_CODE before running.
insert into public.medify_invite_codes (code_hash, role)
values (crypt('CHANGE_THIS_CREATOR_CODE', gen_salt('bf')), 'creator');
