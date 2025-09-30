-- Add resolved tracking fields to upload_errors table
ALTER TABLE public.upload_errors
ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS error_number bigint;

-- Create sequence for auto-incrementing error numbers
CREATE SEQUENCE IF NOT EXISTS upload_errors_number_seq;

-- Set error_number to use the sequence for new rows
ALTER TABLE public.upload_errors 
ALTER COLUMN error_number SET DEFAULT nextval('upload_errors_number_seq');

-- Backfill error_numbers for existing rows
UPDATE public.upload_errors 
SET error_number = nextval('upload_errors_number_seq')
WHERE error_number IS NULL;

-- Make error_number NOT NULL after backfill
ALTER TABLE public.upload_errors 
ALTER COLUMN error_number SET NOT NULL;

-- Add context field for flexible additional data beyond upload-specific fields
ALTER TABLE public.upload_errors
ADD COLUMN IF NOT EXISTS context jsonb;

-- Create index on resolved status for faster queries
CREATE INDEX IF NOT EXISTS idx_upload_errors_resolved ON public.upload_errors(resolved);

-- Create index on error_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_upload_errors_number ON public.upload_errors(error_number);

-- Update RLS policy to allow admins to update errors (for resolving)
CREATE POLICY "Admins can update upload errors"
ON public.upload_errors
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Enable realtime for the upload_errors table
ALTER TABLE public.upload_errors REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upload_errors;