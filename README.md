# CueTheMark

Mark the routine once. Every dancer practices the right section.

Instructors upload a rehearsal track, tap to mark sections while it plays, and share one link or QR code. Dancers open it on their phones — no account — and tap a section, loop it with a count-in, or slow it down. Edits (and re-cut music) reach everyone on the same link.

See [REVIVAL_PLAN.md](./REVIVAL_PLAN.md) and [BUSINESS-MODEL.md](./BUSINESS-MODEL.md) for strategy.

## Stack

- React + Vite + Tailwind/shadcn, deployed on Vercel as a static SPA (`vercel.json` rewrites all routes to `index.html`)
- Supabase (`cuethemark`, ref `icjveadwjulpmkcahcok`): auth, Postgres, private `audio` storage bucket
- Schema: [`supabase/migrations/20260921000000_init_routines.sql`](./supabase/migrations/20260921000000_init_routines.sql)

## Routes

| Path | What |
|---|---|
| `/` | Landing page |
| `/login` | Instructor sign up / sign in |
| `/app` | Your routines (upload a track to create one) |
| `/app/routines/:id` | Editor: mark sections, rename/nudge, share, replace audio |
| `/r/:shareId` | Public dancer practice view |

## How sharing stays private

Audio lives in a private bucket. `get_shared_routine(share_id)` returns a routine only while `sharing_enabled` is on, and a storage policy lets anyone create a signed URL only for audio belonging to a currently shared routine. Turning sharing off or generating a new link cuts off old links.

## Funnel events

`public.events` records `signup_completed`, `routine_created`, `marker_created`, `marker_played`, `share_link_copied`, `shared_routine_opened`, and `shared_marker_played` (the primary activation metric). Query it in the Supabase SQL editor:

```sql
select name, count(*), count(distinct coalesce(user_id::text, visitor_id)) as people
from events where created_at > now() - interval '7 days' group by name order by 2 desc;
```

## Local development

```sh
cp .env.example .env   # fill in the Supabase URL + publishable key
npm install
npm run dev            # http://localhost:8080
```

`npm run build`, `npm run typecheck`, and `npm run lint` should all pass before deploying.
