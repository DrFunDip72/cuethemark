-- First, allow NULL user_id for system templates in both tables
ALTER TABLE audio_tracks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE audio_labels ALTER COLUMN user_id DROP NOT NULL;

-- Create system template track independent of admin account
DO $$
DECLARE
    existing_template_id uuid := '08185e53-8aba-48e3-8f16-c515a7a79782';
    system_template_id uuid := '00000000-0000-0000-0000-000000000001'; -- predictable system template ID
BEGIN
    -- Check if system template already exists
    IF NOT EXISTS (SELECT 1 FROM audio_tracks WHERE id = system_template_id) THEN
        -- Copy the track to create system template
        INSERT INTO audio_tracks (
            id, user_id, filename, url, notes, created_at, updated_at, uploaded_at, "order"
        )
        SELECT 
            system_template_id,
            NULL, -- system template has no user
            filename,
            url,
            'System template - ' || COALESCE(notes, 'Starter track'),
            now(),
            now(),
            now(),
            "order"
        FROM audio_tracks 
        WHERE id = existing_template_id;
        
        -- Copy all labels for the system template
        INSERT INTO audio_labels (
            id, user_id, track_id, label_name, timestamp_seconds, 
            playback_offset_seconds, notes, "order", created_at, updated_at
        )
        SELECT 
            gen_random_uuid(),
            NULL, -- system template labels have no user
            system_template_id,
            label_name,
            timestamp_seconds,
            playback_offset_seconds,
            notes,
            "order",
            now(),
            now()
        FROM audio_labels 
        WHERE track_id = existing_template_id;
        
        RAISE NOTICE 'Created system template track with ID: %', system_template_id;
    ELSE
        RAISE NOTICE 'System template already exists with ID: %', system_template_id;
    END IF;
END $$;