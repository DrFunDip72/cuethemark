-- Supabase pauses free-tier projects after 7 days with no activity, which takes the
-- public site down until someone clicks "restore" in the dashboard. A Vercel cron
-- (api/keep-alive.ts, daily) calls record_heartbeat() so the project never goes idle.
-- Deleting this table/function, or the cron, re-introduces the weekly outage.
-- See CLAUDE.md > Database.
create table public.heartbeats (
  id smallint primary key default 1 check (id = 1),
  last_ping timestamptz not null default now(),
  ping_count bigint not null default 0
);
insert into public.heartbeats (id) values (1);

alter table public.heartbeats enable row level security; -- no policies: reachable only via the function below

create or replace function public.record_heartbeat() returns timestamptz
language sql volatile security definer set search_path = '' as $$
  update public.heartbeats
     set last_ping = now(), ping_count = ping_count + 1
   where id = 1
  returning last_ping
$$;
revoke all on function public.record_heartbeat() from public;
grant execute on function public.record_heartbeat() to anon, authenticated;
