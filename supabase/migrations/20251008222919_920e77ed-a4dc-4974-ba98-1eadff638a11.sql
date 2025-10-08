-- Add admin view policies for audio_tracks and audio_labels
-- This allows admins to see all tracks and labels for analytics purposes

-- Allow admins to view all tracks
CREATE POLICY "Admins can view all tracks"
ON public.audio_tracks
FOR SELECT
TO authenticated
USING (user_is_admin(auth.uid()));

-- Allow admins to view all labels
CREATE POLICY "Admins can view all labels"
ON public.audio_labels
FOR SELECT
TO authenticated
USING (user_is_admin(auth.uid()));