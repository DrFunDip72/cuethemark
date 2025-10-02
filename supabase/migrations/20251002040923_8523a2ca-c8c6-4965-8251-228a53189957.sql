-- Add 'admin' option to target_audience enum
ALTER TYPE target_audience ADD VALUE IF NOT EXISTS 'admin';

-- Update the admin user's display name
UPDATE public.profiles
SET display_name = 'Admin'
WHERE is_admin = true AND (display_name IS NULL OR display_name = '');