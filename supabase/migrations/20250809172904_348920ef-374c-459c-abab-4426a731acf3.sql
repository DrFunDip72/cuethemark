-- Ensure created_by is automatically set to the current user on insert
ALTER TABLE public.promo_codes
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Allow users to view their own promo codes (active or inactive)
CREATE POLICY "Users can view their own promo codes"
ON public.promo_codes
FOR SELECT
USING (created_by = auth.uid());

-- Allow admins to view all promo codes
CREATE POLICY "Admins can view all promo codes"
ON public.promo_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  )
);

-- Allow admins to update any promo code (activate/deactivate, edit, etc.)
CREATE POLICY "Admins can update any promo code"
ON public.promo_codes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  )
);
