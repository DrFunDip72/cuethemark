-- Rename upload_errors to application_errors and enhance schema
ALTER TABLE public.upload_errors RENAME TO application_errors;

-- Add new columns for comprehensive error tracking
ALTER TABLE public.application_errors 
ADD COLUMN component text NOT NULL DEFAULT 'unknown',
ADD COLUMN action text NOT NULL DEFAULT 'unknown',
ADD COLUMN url text,
ADD COLUMN user_agent text,
ADD COLUMN request_id text;

-- Update existing rows to set component and action based on the old data
UPDATE public.application_errors 
SET component = 'AudioUpload',
    action = 'upload_track'
WHERE component = 'unknown';

-- Drop old file-specific columns (data will be in context jsonb)
-- First, migrate existing file data to context
UPDATE public.application_errors
SET context = jsonb_build_object(
  'file_name', file_name,
  'file_size', file_size,
  'file_type', file_type
) || COALESCE(context, '{}'::jsonb)
WHERE file_name IS NOT NULL OR file_size IS NOT NULL OR file_type IS NOT NULL;

-- Now drop the columns
ALTER TABLE public.application_errors
DROP COLUMN file_name,
DROP COLUMN file_size,
DROP COLUMN file_type;

-- Update RLS policies to use new table name (they reference the table)
-- The policies are already correct, just need to ensure they work with renamed table

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_application_errors_component ON public.application_errors(component);
CREATE INDEX IF NOT EXISTS idx_application_errors_action ON public.application_errors(action);
CREATE INDEX IF NOT EXISTS idx_application_errors_error_type ON public.application_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_application_errors_created_at ON public.application_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_errors_resolved ON public.application_errors(resolved);

-- Add comment to table
COMMENT ON TABLE public.application_errors IS 'Tracks all application errors across the entire app for monitoring and debugging';