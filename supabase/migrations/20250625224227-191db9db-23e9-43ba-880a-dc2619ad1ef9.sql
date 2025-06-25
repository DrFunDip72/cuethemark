
-- Add order column to audio_tracks table
ALTER TABLE public.audio_tracks 
ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Set initial order values for existing tracks based on upload date
DO $$
DECLARE
    track_record RECORD;
    current_order INTEGER;
BEGIN
    -- For each user, update tracks in upload order
    FOR track_record IN 
        SELECT DISTINCT user_id FROM public.audio_tracks WHERE "order" IS NULL
    LOOP
        current_order := 1;
        -- Update each track for this user in upload order
        FOR track_record IN 
            SELECT id FROM public.audio_tracks 
            WHERE user_id = track_record.user_id AND "order" IS NULL
            ORDER BY uploaded_at
        LOOP
            UPDATE public.audio_tracks 
            SET "order" = current_order 
            WHERE id = track_record.id;
            current_order := current_order + 1;
        END LOOP;
    END LOOP;
END $$;

-- Add a default value for new tracks
ALTER TABLE public.audio_tracks 
ALTER COLUMN "order" SET DEFAULT 1;
