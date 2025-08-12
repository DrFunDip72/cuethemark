-- Security hardening migration
-- 1) Helper functions to avoid recursive RLS lookups
CREATE OR REPLACE FUNCTION public.user_is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = _user_id), false);
$$;

CREATE OR REPLACE FUNCTION public.check_is_admin_unchanged(_new_is_admin boolean)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_new_is_admin, false) = COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()), false);
$$;

-- 2) Lock down overly permissive policies
-- profiles
DROP POLICY IF EXISTS "Edge functions can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate constrained update policy preventing self-admin escalation
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND public.check_is_admin_unchanged(is_admin)
);

-- Allow users to insert their own profile but never as admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id AND is_admin = false)
    $$;
  END IF;
END$$;

-- subscribers
DROP POLICY IF EXISTS "Edge functions can manage subscriptions" ON public.subscribers;

-- promo_code_usage
DROP POLICY IF EXISTS "Edge functions can manage promo usage" ON public.promo_code_usage;

-- seeded_templates
DROP POLICY IF EXISTS "Edge functions can manage seeded templates" ON public.seeded_templates;
-- Users can only view their own seeded templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'seeded_templates' AND policyname = 'Users can view their own seeded templates'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view their own seeded templates"
      ON public.seeded_templates
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid())
    $$;
  END IF;
END$$;

-- promo_codes: remove public listing of active promo codes
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;

-- 3) Storage hardening: scope reads to user folder for audio-files bucket
DROP POLICY IF EXISTS "Users can view audio files" ON storage.objects;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view their own audio files'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can view their own audio files"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'audio-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
    $$;
  END IF;
END$$;
