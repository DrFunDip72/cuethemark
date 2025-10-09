-- Add archived column to features table
ALTER TABLE public.features
ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Create index for faster queries on archived features
CREATE INDEX idx_features_archived ON public.features(archived);

-- Update the RLS policies to handle archived features (they should still be viewable by admins)
-- The existing policies already work since they check user_is_admin(auth.uid())