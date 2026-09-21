-- CueTheMark schema: instructors own routines (a track + markers) and share them by link.

-- Routines: one rehearsal track owned by an instructor, shareable by link.
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  audio_path text,
  share_id text not null unique default replace(translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/', '-_'), '=', ''),
  sharing_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routines_owner_idx on public.routines(owner_id);

create table public.markers (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  time_seconds numeric(8,2) not null check (time_seconds >= 0),
  preroll_seconds numeric(5,2) not null default 2 check (preroll_seconds between 0 and 30),
  created_at timestamptz not null default now()
);
create index markers_routine_idx on public.markers(routine_id, time_seconds);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

create trigger routines_touch before update on public.routines
for each row execute function public.touch_updated_at();

alter table public.routines enable row level security;
alter table public.markers enable row level security;

create policy "owners manage routines" on public.routines
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owners manage markers" on public.markers
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.owner_id = (select auth.uid())));

-- Public practice view: anyone with the share link gets the routine + markers.
create or replace function public.get_shared_routine(p_share_id text) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'id', r.id,
    'title', r.title,
    'audio_path', r.audio_path,
    'updated_at', r.updated_at,
    'markers', coalesce((
      select json_agg(json_build_object(
        'id', m.id, 'name', m.name,
        'time_seconds', m.time_seconds, 'preroll_seconds', m.preroll_seconds
      ) order by m.time_seconds)
      from public.markers m where m.routine_id = r.id
    ), '[]'::json)
  )
  from public.routines r
  where r.share_id = p_share_id and r.sharing_enabled
$$;
grant execute on function public.get_shared_routine(text) to anon, authenticated;

-- Storage-policy helper, kept out of the exposed API schema.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_shared_audio(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.routines r where r.audio_path = p_path and r.sharing_enabled)
$$;
revoke all on function private.is_shared_audio(text) from public;
grant execute on function private.is_shared_audio(text) to anon, authenticated;

-- Private audio bucket. Owners write to their own folder; shared tracks are readable via signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', false, 52428800,
        array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mp4', 'audio/x-m4a', 'audio/aac']);

create policy "owners read own audio" on storage.objects for select to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners upload own audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners update own audio" on storage.objects for update to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners delete own audio" on storage.objects for delete to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "anyone reads shared audio" on storage.objects for select to anon, authenticated
  using (bucket_id = 'audio' and private.is_shared_audio(name));

-- Activation funnel events (write-only from the client).
create table public.events (
  id bigint generated always as identity primary key,
  name text not null check (name in (
    'signup_completed', 'routine_created', 'marker_created', 'marker_played',
    'share_link_copied', 'shared_routine_opened', 'shared_marker_played'
  )),
  routine_id uuid references public.routines(id) on delete set null,
  user_id uuid default auth.uid(),
  visitor_id text check (char_length(visitor_id) <= 64),
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;

create or replace function public.log_event(p_name text, p_routine_id uuid default null, p_visitor_id text default null)
returns void language sql volatile security definer set search_path = '' as $$
  insert into public.events (name, routine_id, user_id, visitor_id)
  values (p_name, p_routine_id, auth.uid(), left(p_visitor_id, 64))
$$;
grant execute on function public.log_event(text, uuid, text) to anon, authenticated;
