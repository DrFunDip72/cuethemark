
-- Add notes column to audio_tracks table
ALTER TABLE public.audio_tracks 
ADD COLUMN notes TEXT;
