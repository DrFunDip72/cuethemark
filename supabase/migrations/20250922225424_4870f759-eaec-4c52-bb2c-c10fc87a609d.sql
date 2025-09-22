-- Update existing seeded_templates records to point to the new system template ID
-- This prevents duplicate seeding when we switched from admin template to system template

UPDATE seeded_templates 
SET template_track_id = '00000000-0000-0000-0000-000000000001'
WHERE template_track_id = '08185e53-8aba-48e3-8f16-c515a7a79782';

-- Log the number of records updated
DO $$
DECLARE
    updated_count integer;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % seeded_templates records to use new system template ID', updated_count;
END $$;