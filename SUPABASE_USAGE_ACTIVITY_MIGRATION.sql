-- Run once in Supabase Dashboard > SQL Editor. Stores only activity metadata.
begin;
create table if not exists public.medify_user_presence (user_id uuid primary key references public.medify_profiles(id) on delete cascade, last_seen timestamptz not null default now(), last_activity timestamptz, active_view text, updated_at timestamptz not null default now());
alter table public.medify_user_presence add column if not exists last_activity timestamptz;
alter table public.medify_user_presence add column if not exists active_view text;
alter table public.medify_user_presence add column if not exists updated_at timestamptz not null default now();
create table if not exists public.medify_usage_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.medify_profiles(id) on delete cascade, client_session_id uuid not null unique, started_at timestamptz not null default now(), first_opened timestamptz not null default now(), last_activity timestamptz, last_seen timestamptz not null default now(), active_seconds integer not null default 0 check (active_seconds >= 0), last_tool_used text, tool_counts jsonb not null default '{}'::jsonb, ended_at timestamptz);
create index if not exists medify_usage_sessions_user_started_idx on public.medify_usage_sessions (user_id, started_at desc);
alter table public.medify_user_presence enable row level security; alter table public.medify_usage_sessions enable row level security;
drop policy if exists "presence: own write" on public.medify_user_presence; drop policy if exists "presence: creator reads" on public.medify_user_presence;
create policy "presence: own write" on public.medify_user_presence for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "presence: creator reads" on public.medify_user_presence for select to authenticated using (public.medify_is_creator());
drop policy if exists "usage: own or creator reads" on public.medify_usage_sessions;
create policy "usage: own or creator reads" on public.medify_usage_sessions for select to authenticated using (user_id = auth.uid() or public.medify_is_creator());
create or replace function public.medify_usage_heartbeat(p_session_key uuid, p_active boolean, p_tool text default null, p_view text default null) returns void language plpgsql security definer set search_path = public as $$
declare v_session public.medify_usage_sessions; v_now timestamptz := now(); v_extra integer := 0; v_counts jsonb;
begin
 if auth.uid() is null then raise exception 'You must be signed in.'; end if; if p_session_key is null then raise exception 'Usage session is required.'; end if;
 if p_tool is not null and p_tool not in ('Call Notes','Swapped Filter Subscription','Order Codes / Replacement','UPS Claim','Email / General Case Notes') then raise exception 'Invalid usage tool.'; end if;
 select * into v_session from public.medify_usage_sessions where client_session_id=p_session_key and user_id=auth.uid() for update;
 if v_session.id is null then insert into public.medify_usage_sessions(user_id,client_session_id,last_activity,last_tool_used,tool_counts) values(auth.uid(),p_session_key,case when p_active then v_now else null end,p_tool,case when p_tool is null then '{}'::jsonb else jsonb_build_object(p_tool,1) end);
 else
  if p_active and v_session.last_activity is not null and v_session.last_activity >= v_now - interval '5 minutes' then v_extra:=least(60,greatest(0,floor(extract(epoch from(v_now-v_session.last_seen)))::integer)); end if;
  v_counts:=v_session.tool_counts; if p_tool is not null then v_counts:=jsonb_set(v_counts,array[p_tool],to_jsonb(coalesce((v_counts->>p_tool)::integer,0)+1),true); end if;
  update public.medify_usage_sessions set last_seen=v_now,last_activity=case when p_active then v_now else last_activity end,active_seconds=active_seconds+v_extra,last_tool_used=coalesce(p_tool,last_tool_used),tool_counts=v_counts,ended_at=null where id=v_session.id;
 end if;
 insert into public.medify_user_presence(user_id,last_seen,last_activity,active_view,updated_at) values(auth.uid(),v_now,case when p_active then v_now else null end,p_view,v_now) on conflict(user_id) do update set last_seen=excluded.last_seen,last_activity=coalesce(excluded.last_activity,medify_user_presence.last_activity),active_view=excluded.active_view,updated_at=excluded.updated_at;
end; $$;
create or replace function public.medify_end_usage_session(p_session_key uuid) returns void language plpgsql security definer set search_path=public as $$ begin if auth.uid() is null or p_session_key is null then return; end if; update public.medify_usage_sessions set ended_at=now(),last_seen=now() where client_session_id=p_session_key and user_id=auth.uid(); end; $$;
grant select,insert,update on public.medify_user_presence to authenticated; grant select on public.medify_usage_sessions to authenticated;
grant execute on function public.medify_usage_heartbeat(uuid,boolean,text,text) to authenticated; grant execute on function public.medify_end_usage_session(uuid) to authenticated;
commit;
