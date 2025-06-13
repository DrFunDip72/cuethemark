
-- Add order column to audio_labels table
ALTER TABLE public.audio_labels 
ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Create a temporary sequence for ordering existing labels
DO $$
DECLARE
    label_record RECORD;
    current_order INTEGER;
BEGIN
    -- For each track, update labels in timestamp order
    FOR label_record IN 
        SELECT DISTINCT track_id FROM public.audio_labels WHERE "order" IS NULL
    LOOP
        current_order := 1;
        -- Update each label for this track in timestamp order
        FOR label_record IN 
            SELECT id FROM public.audio_labels 
            WHERE track_id = label_record.track_id AND "order" IS NULL
            ORDER BY timestamp_seconds
        LOOP
            UPDATE public.audio_labels 
            SET "order" = current_order 
            WHERE id = label_record.id;
            current_order := current_order + 1;
        END LOOP;
    END LOOP;
END $$;

-- Add a default value for new labels
ALTER TABLE public.audio_labels 
ALTER COLUMN "order" SET DEFAULT 1;
