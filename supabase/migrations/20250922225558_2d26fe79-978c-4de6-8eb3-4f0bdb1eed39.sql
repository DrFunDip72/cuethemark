-- Clean up duplicate seeded template records
-- Keep the older record (from original admin template) and delete the newer duplicate

-- Delete the newer seeded_templates records that were created with the new system template ID
DELETE FROM seeded_templates 
WHERE template_track_id = '00000000-0000-0000-0000-000000000001';

-- Now update the original records to point to the new system template ID
UPDATE seeded_templates 
SET template_track_id = '00000000-0000-0000-0000-000000000001'
WHERE template_track_id = '08185e53-8aba-48e3-8f16-c515a7a79782';

-- Log what we did
DO $$
DECLARE
    updated_count integer;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Successfully updated % seeded_templates records to prevent future duplicate seeding', updated_count;
END $$;