-- Add policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_is_admin(auth.uid()));