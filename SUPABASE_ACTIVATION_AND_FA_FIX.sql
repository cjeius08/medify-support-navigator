-- Run once in Supabase Dashboard > SQL Editor.
-- Makes the activation-page initials list readable before sign-in and lets the
-- creator remove FA (or any unused initials). JA stays protected.
begin;

drop policy if exists "agent initials: public activation reads" on public.medify_agent_initials;
create policy "agent initials: public activation reads"
on public.medify_agent_initials for select to anon using (true);
grant select on public.medify_agent_initials to anon;

create or replace function public.medify_set_agent_initial_active(p_initials text,p_active boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.medify_is_creator() then raise exception 'Creator access required.'; end if;
 if upper(trim(p_initials)) = 'JA' and not p_active then raise exception 'JA must remain active.'; end if;
 update public.medify_agent_initials set active=p_active where initials=upper(trim(p_initials));
 return found;
end; $$;

create or replace function public.medify_delete_agent_initial(p_initials text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v text:=upper(trim(p_initials)); used_count integer; active_codes integer;
begin
 if not public.medify_is_creator() then raise exception 'Creator access required.'; end if;
 if v = 'JA' then raise exception 'JA is the creator initials and cannot be removed.'; end if;
 select count(*) into used_count from public.medify_profiles where initials=v;
 if used_count > 0 then raise exception 'This initials entry is assigned to an existing user. Deactivate it instead to preserve history.'; end if;
 select count(*) into active_codes from public.medify_invite_codes where assigned_initials=v and used_at is null and revoked_at is null and deactivated_at is null;
 if active_codes > 0 then raise exception 'Revoke or delete the active access code assigned to this initials entry first.'; end if;
 delete from public.medify_agent_initials where initials=v;
 return found;
end; $$;

grant execute on function public.medify_set_agent_initial_active(text,boolean) to authenticated;
grant execute on function public.medify_delete_agent_initial(text) to authenticated;

commit;
