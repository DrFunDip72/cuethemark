-- Fix the handle_new_user function to properly create profiles with email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
    CASE WHEN COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email') = 'justinsmaxwell722@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$;