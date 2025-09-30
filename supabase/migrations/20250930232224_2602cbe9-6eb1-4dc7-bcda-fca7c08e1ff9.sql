-- Add display name fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update handle_new_user function to extract display name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  admin_email text := 'justinsmaxwell722@gmail.com';
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin, referred_by, first_name, last_name, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
    CASE WHEN COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email') = admin_email THEN true ELSE false END,
    NEW.raw_user_meta_data ->> 'referred_by',
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      CONCAT_WS(' ', NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name')
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    referred_by = EXCLUDED.referred_by,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Function to backfill display names from auth.users metadata
CREATE OR REPLACE FUNCTION public.backfill_display_names()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT 
      au.id,
      au.raw_user_meta_data
    FROM auth.users au
    INNER JOIN public.profiles p ON p.user_id = au.id
    WHERE p.display_name IS NULL
  LOOP
    UPDATE public.profiles
    SET 
      display_name = COALESCE(
        user_record.raw_user_meta_data ->> 'display_name',
        user_record.raw_user_meta_data ->> 'full_name',
        CONCAT_WS(' ', 
          user_record.raw_user_meta_data ->> 'first_name', 
          user_record.raw_user_meta_data ->> 'last_name'
        )
      ),
      first_name = user_record.raw_user_meta_data ->> 'first_name',
      last_name = user_record.raw_user_meta_data ->> 'last_name',
      updated_at = now()
    WHERE user_id = user_record.id;
  END LOOP;
END;
$$;

-- Run the backfill
SELECT public.backfill_display_names();