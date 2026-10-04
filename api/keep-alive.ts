/**
 * Keeps the Supabase project from pausing.
 *
 * WHY THIS EXISTS: Supabase pauses free-tier projects after 7 consecutive days
 * with no activity. A paused project means sign-in, uploads and every share link
 * return errors until someone manually restores it from the dashboard. CueTheMark
 * is a public portfolio app that can sit untouched for weeks, so it needs a
 * heartbeat. Vercel Cron calls this endpoint once a day (see vercel.json) and it
 * writes a row in Postgres, which counts as activity and resets the 7-day clock.
 *
 * If you remove this endpoint, its cron entry, or public.record_heartbeat(), the
 * site WILL go down about a week later. Upgrading to Supabase Pro removes the
 * pausing behaviour and makes this unnecessary. See CLAUDE.md > Database.
 */
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set,
  // so the endpoint can't be used by anyone else to hammer the database.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'missing Supabase env vars' });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc('record_heartbeat');

  if (error) {
    console.error('keep-alive failed', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
  return res.status(200).json({ ok: true, last_ping: data });
}
