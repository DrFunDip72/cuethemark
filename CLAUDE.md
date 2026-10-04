# CueTheMark — working notes

A public portfolio app as well as a product: the live site is shown to employers, so
**the deployed site must work at any moment, with no account and no warm-up.**

## Database (read this before touching Supabase or the cron)

Supabase project `cuethemark`, ref `icjveadwjulpmkcahcok` (us-west-1), **free tier**.

Free-tier projects **pause after 7 consecutive days of no activity**. A paused project
breaks sign-in, uploads, and every `/r/:shareId` share link until someone clicks
"restore" in the Supabase dashboard — which already happened once on this project.

Two things keep that from happening, and both must stay in place:

1. **`api/keep-alive.ts` + the `crons` entry in `vercel.json`.** Vercel Cron hits the
   endpoint daily; it calls `public.record_heartbeat()`, which writes to
   `public.heartbeats`. A write is real database activity, so the 7-day idle clock
   never runs out. The endpoint checks `Authorization: Bearer $CRON_SECRET`
   (`CRON_SECRET` is set in Vercel's production environment).
2. **`/demo` does not touch the database at all.** `src/pages/DemoPage.tsx` uses a
   static MP3 in `public/demo/` and keeps the visitor's markers in `localStorage`. It
   is the zero-friction entry point for employers and reviewers, and it keeps working
   even if the database is cold or down. Don't "improve" it by loading demo data from
   Supabase.

### If you change any of this

- Removing the cron, the endpoint, `public.heartbeats`, or `record_heartbeat()` brings
  back the weekly outage. If you remove them deliberately, say so in the commit
  message and remove this section.
- Vercel's rewrite rule in `vercel.json` sends everything to `index.html` so the SPA
  can handle client-side routes. It **must** keep excluding `api/` (and `assets/`,
  `demo/`), or the cron endpoint gets swallowed by the SPA fallback and silently
  returns HTML instead of running.
- Vercel's Hobby plan allows cron runs **once per day at most**; don't set a finer
  schedule than `0 11 * * *` expecting it to fire.
- Upgrading to Supabase Pro ($25/mo) removes the pausing behaviour entirely, at which
  point the cron and heartbeat table can go.

### Checking it works

```sh
# Is the project awake, and when did the cron last run?
# (Supabase SQL editor)
select * from public.heartbeats;
```

`last_ping` should never be more than ~48 hours old. If it is, check the Vercel
project's cron logs. Vercel Cron only runs against **production** deployments.

## Architecture

Static Vite SPA on Vercel, talking straight to Supabase from the browser. There is no
application server; `api/keep-alive.ts` is the only serverless function, and it exists
only for the cron.

Authorization is enforced in Postgres with row-level security, not in app code:

- `routines` / `markers`: owner-only via `auth.uid()`.
- Public sharing goes through `get_shared_routine(share_id)` (security definer), which
  returns a routine only while `sharing_enabled` is true.
- Audio lives in a **private** storage bucket. Anonymous dancers can create a signed
  URL only for audio belonging to a currently-shared routine, via the storage policy
  that calls `private.is_shared_audio(path)`. Turning sharing off or rotating
  `share_id` revokes access immediately.

So: when adding a feature that reads data, prefer an RLS policy or a security-definer
function over trusting the client. Schema lives in `supabase/migrations/`; apply
changes as migrations, don't hand-edit tables in the dashboard.

## Product scope

Deliberately one workflow: upload a track → mark sections while it plays → share one
link → dancers loop/slow sections with no account. Admin dashboards, referrals,
notifications, feature tracking, and Stripe billing were all removed on purpose
(see `REVIVAL_PLAN.md`); don't reintroduce them without being asked. Billing is
handled manually with payment links until there are paying studios.

`public.events` records the activation funnel; `shared_marker_played` is the metric
that matters.

## Conventions

- `npm run build`, `npm run typecheck`, `npm run lint` must pass before deploying.
- Deploys are manual: `npx vercel deploy --prod`. The repo is **not** git-connected to
  Vercel, so pushing to GitHub does not deploy, and `vercel deploy` ships your working
  tree including uncommitted files.
- Numerics from Postgres arrive as strings; normalize at the edge with `toMarker()` in
  `src/lib/supabase.ts`.
- Audio playback logic is shared: `PracticePlayer` serves the editor, `/demo`, and the
  public dancer view. Change it once, check all three.
