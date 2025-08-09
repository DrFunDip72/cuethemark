-- Create table to track seeding status per user/template
create table if not exists public.seeded_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template_track_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, template_track_id)
);

-- Enable RLS
alter table public.seeded_templates enable row level security;

-- Edge functions can manage seeded templates
create policy "Edge functions can manage seeded templates"
  on public.seeded_templates
  for all
  using (true)
  with check (true);
