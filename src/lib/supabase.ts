import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const AUDIO_BUCKET = 'audio';

export type Routine = {
  id: string;
  owner_id: string;
  title: string;
  audio_path: string | null;
  share_id: string;
  sharing_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Marker = {
  id: string;
  name: string;
  time_seconds: number;
  preroll_seconds: number;
};

export type SharedRoutine = {
  id: string;
  title: string;
  audio_path: string | null;
  updated_at: string;
  markers: Marker[];
};

// Postgres numerics come back as strings; normalize once at the edge.
export const toMarker = (row: { id: string; name: string; time_seconds: number | string; preroll_seconds: number | string }): Marker => ({
  id: row.id,
  name: row.name,
  time_seconds: Number(row.time_seconds),
  preroll_seconds: Number(row.preroll_seconds),
});

export const signedAudioUrl = async (path: string) => {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(path, 60 * 60 * 6);
  if (error) throw error;
  return data.signedUrl;
};

export const shareUrl = (shareId: string) => `${window.location.origin}/r/${shareId}`;
