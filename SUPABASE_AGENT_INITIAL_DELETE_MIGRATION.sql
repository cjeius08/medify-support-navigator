-- Safe follow-up migration. Run this only after SUPABASE_DYNAMIC_INITIALS_MIGRATION.sql.
-- It adds creator-only deletion for unused initials and preserves historical references.
create or replace function public.medify_delete_agent_initial(p_initials text)
returns boolean language plpgsql security definer set search_path=public as $$
declare
  v text := upper(trim(p_initials));
  used_count integer;
begin
  if not public.medify_is_creator() then
    raise exception 'Creator access required.';
  end if;
  if v in ('JA','FA') then
    raise exception 'JA and FA must remain.';
  end if;
  select count(*) into used_count from public.medify_profiles where initials=v;
  if used_count > 0 then
    raise exception 'This initials entry is assigned to an existing user. Deactivate it instead to preserve history.';
  end if;
  delete from public.medify_agent_initials where initials=v;
  return found;
end;
$$;

grant execute on function public.medify_delete_agent_initial(text) to authenticated;
