-- Add referred_by column to profiles table
ALTER TABLE public.profiles ADD COLUMN referred_by TEXT;

-- Update the handle_new_user function to capture referrer info from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin, referred_by)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
    CASE WHEN COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email') = 'justinsmaxwell722@gmail.com' THEN true ELSE false END,
    NEW.raw_user_meta_data ->> 'referred_by'
  );
  RETURN NEW;
END;
$function$;