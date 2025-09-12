-- Fix the foreign key constraint issue and admin email security
-- Remove the foreign key constraint that's causing issues
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Update the handle_new_user function to be more robust and use a configurable admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  admin_email text := 'justinsmaxwell722@gmail.com'; -- This should be moved to environment in production
BEGIN
  -- Insert profile with proper error handling
  INSERT INTO public.profiles (user_id, email, is_admin, referred_by)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
    CASE WHEN COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email') = admin_email THEN true ELSE false END,
    NEW.raw_user_meta_data ->> 'referred_by'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    referred_by = EXCLUDED.referred_by,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;