-- Safe, non-destructive migration for dynamic Medify agent initials.
-- Run manually in Supabase Dashboard > SQL Editor. This does not delete data.
begin;
create table if not exists public.medify_agent_initials (
  id uuid primary key default gen_random_uuid(),
  initials text not null unique check (initials = upper(initials) and initials ~ '^[A-Z0-9]{1,4}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.medify_profiles(id) on delete set null
);
insert into public.medify_agent_initials (initials, active) values ('JA',true),('FA',true) on conflict (initials) do nothing;
alter table public.medify_profiles drop constraint if exists medify_profiles_initials_check;
alter table public.medify_profiles add constraint medify_profiles_initials_format_check check (initials=upper(initials) and initials ~ '^[A-Z0-9]{1,4}$') not valid;
alter table public.medify_profiles validate constraint medify_profiles_initials_format_check;
alter table public.medify_invite_codes add column if not exists assigned_initials text;
update public.medify_invite_codes set assigned_initials='FA' where assigned_initials is null;
alter table public.medify_invite_codes add constraint medify_invite_codes_assigned_initials_format_check check (assigned_initials is null or (assigned_initials=upper(assigned_initials) and assigned_initials ~ '^[A-Z0-9]{1,4}$')) not valid;
alter table public.medify_invite_codes validate constraint medify_invite_codes_assigned_initials_format_check;
alter table public.medify_agent_initials enable row level security;
drop policy if exists "agent initials: authenticated reads" on public.medify_agent_initials;
create policy "agent initials: authenticated reads" on public.medify_agent_initials for select to authenticated using (true);
create or replace function public.medify_add_agent_initial(p_initials text) returns text language plpgsql security definer set search_path=public as $$
declare v text:=upper(trim(p_initials)); begin
 if not public.medify_is_creator() then raise exception 'Creator access required.'; end if;
 if v !~ '^[A-Z0-9]{1,4}$' then raise exception 'Use 1-4 letters or numbers only.'; end if;
 insert into public.medify_agent_initials(initials,active,created_by) values(v,true,auth.uid()); return v;
exception when unique_violation then raise exception 'That initials entry already exists.'; end; $$;
create or replace function public.medify_set_agent_initial_active(p_initials text,p_active boolean) returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.medify_is_creator() then raise exception 'Creator access required.'; end if;
 if upper(trim(p_initials)) in ('JA','FA') and not p_active then raise exception 'JA and FA must remain active.'; end if;
 update public.medify_agent_initials set active=p_active where initials=upper(trim(p_initials)); return found;
end; $$;
create or replace function public.medify_delete_agent_initial(p_initials text) returns boolean language plpgsql security definer set search_path=public as $$
declare v text:=upper(trim(p_initials)); used_count integer;
begin
 if not public.medify_is_creator() then raise exception 'Creator access required.'; end if;
 if v in ('JA','FA') then raise exception 'JA and FA must remain.'; end if;
 select count(*) into used_count from public.medify_profiles where initials=v;
 if used_count>0 then raise exception 'This initials entry is assigned to an existing user. Deactivate it instead to preserve history.'; end if;
 delete from public.medify_agent_initials where initials=v;
 return found;
end; $$;
create or replace function public.medify_create_invite(p_code text,p_initials text default 'FA') returns uuid language plpgsql security definer set search_path=public as $$
declare invite_id uuid; v text:=upper(trim(p_initials)); begin
 if not public.medify_is_creator() then raise exception 'Creator access required.'; end if;
 if length(trim(p_code))<8 then raise exception 'Use an access code with at least 8 characters.'; end if;
 if not exists(select 1 from public.medify_agent_initials where initials=v and active) then raise exception 'Choose an active initials option.'; end if;
 insert into public.medify_invite_codes(code_value,code_hash,role,created_by,assigned_initials) values(trim(p_code),crypt(p_code,gen_salt('bf')),'agent',auth.uid(),v) returning id into invite_id; return invite_id;
end; $$;
create or replace function public.medify_redeem_invite(p_code text,p_username text,p_initials text) returns public.medify_profiles language plpgsql security definer set search_path=public as $$
declare c public.medify_invite_codes; p public.medify_profiles; v text:=upper(trim(p_initials)); begin
 if auth.uid() is null then raise exception 'You must be signed in.'; end if;
 if p_username !~ '^[a-z0-9_]{3,24}$' then raise exception 'Use 3-24 lowercase letters, numbers, or underscores.'; end if;
 select * into c from public.medify_invite_codes where used_at is null and revoked_at is null and deactivated_at is null and crypt(p_code,code_hash)=code_hash limit 1 for update;
 if c.id is null then raise exception 'That access code is invalid, used, or revoked.'; end if;
 if c.assigned_initials is not null and c.assigned_initials<>v then raise exception 'Use the initials assigned to this access code.'; end if;
 if not exists(select 1 from public.medify_agent_initials where initials=v and active) then raise exception 'Choose an active initials option.'; end if;
 insert into public.medify_profiles(id,username,initials,role) values(auth.uid(),p_username,v,c.role) returning * into p;
 update public.medify_invite_codes set used_by=auth.uid(),used_at=now() where id=c.id; return p;
end; $$;
grant select on public.medify_agent_initials to authenticated;
grant execute on function public.medify_add_agent_initial(text) to authenticated;
grant execute on function public.medify_set_agent_initial_active(text,boolean) to authenticated;
grant execute on function public.medify_delete_agent_initial(text) to authenticated;
grant execute on function public.medify_create_invite(text,text) to authenticated;
grant execute on function public.medify_redeem_invite(text,text,text) to authenticated;
commit;
