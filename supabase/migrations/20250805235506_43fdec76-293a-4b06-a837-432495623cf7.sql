-- Create profiles table for additional user information including admin status
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can manage profiles" 
ON public.profiles 
FOR ALL 
USING (true);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, is_admin)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE WHEN NEW.email = 'justinsmaxwell722@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set justinsmaxwell722@gmail.com as admin if they already exist
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'justinsmaxwell722@gmail.com';

-- If the user doesn't exist in profiles yet, insert them as admin
INSERT INTO public.profiles (user_id, email, is_admin)
SELECT id, email, true
FROM auth.users 
WHERE email = 'justinsmaxwell722@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'justinsmaxwell722@gmail.com');

-- Add trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();