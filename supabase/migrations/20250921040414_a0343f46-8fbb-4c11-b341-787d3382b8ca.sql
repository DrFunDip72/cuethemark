-- Fix security issue: Add comprehensive RLS policies for subscribers table
-- Currently the table only has SELECT policy, leaving INSERT/UPDATE/DELETE operations vulnerable

-- Policy 1: Allow service role (edge functions) to INSERT subscription records
-- This is needed for functions like create-demo-subscription and check-subscription
CREATE POLICY "Service role can insert subscribers" 
ON public.subscribers 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Policy 2: Allow service role (edge functions) to UPDATE subscription records  
-- This is needed for functions like check-subscription to update subscription status
CREATE POLICY "Service role can update subscribers" 
ON public.subscribers 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Allow service role to DELETE subscription records (for cleanup/admin operations)
CREATE POLICY "Service role can delete subscribers" 
ON public.subscribers 
FOR DELETE 
TO service_role
USING (true);

-- Policy 4: Prevent authenticated users from directly inserting subscription records
-- Users should only create subscriptions through edge functions, not directly
CREATE POLICY "Authenticated users cannot insert subscribers" 
ON public.subscribers 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Policy 5: Prevent authenticated users from directly updating subscription records
-- Subscription updates should only happen through edge functions  
CREATE POLICY "Authenticated users cannot update subscribers" 
ON public.subscribers 
FOR UPDATE 
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 6: Prevent authenticated users from deleting subscription records
CREATE POLICY "Authenticated users cannot delete subscribers" 
ON public.subscribers 
FOR DELETE 
TO authenticated
USING (false);