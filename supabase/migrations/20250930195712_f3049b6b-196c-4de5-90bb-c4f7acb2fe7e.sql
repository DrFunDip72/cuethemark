-- Create upload_errors table for detailed error tracking
CREATE TABLE public.upload_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  step_failed TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upload_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own upload errors"
  ON public.upload_errors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own upload errors"
  ON public.upload_errors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all upload errors"
  ON public.upload_errors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create index for better query performance
CREATE INDEX idx_upload_errors_user_id ON public.upload_errors(user_id);
CREATE INDEX idx_upload_errors_created_at ON public.upload_errors(created_at DESC);