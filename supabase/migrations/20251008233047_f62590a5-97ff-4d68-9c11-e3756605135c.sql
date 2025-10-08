-- Create enums for features
CREATE TYPE public.feature_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.feature_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create features table
CREATE TABLE public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority feature_priority NOT NULL DEFAULT 'medium',
  status feature_status NOT NULL DEFAULT 'not_started',
  created_by uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  linked_error_id uuid REFERENCES application_errors(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins
CREATE POLICY "Admins can view all features"
  ON public.features
  FOR SELECT
  USING (user_is_admin(auth.uid()));

CREATE POLICY "Admins can create features"
  ON public.features
  FOR INSERT
  WITH CHECK (user_is_admin(auth.uid()));

CREATE POLICY "Admins can update features"
  ON public.features
  FOR UPDATE
  USING (user_is_admin(auth.uid()));

CREATE POLICY "Admins can delete features"
  ON public.features
  FOR DELETE
  USING (user_is_admin(auth.uid()));

-- Add linked_feature_id to notifications
ALTER TABLE public.notifications
ADD COLUMN linked_feature_id uuid REFERENCES features(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_features_status ON public.features(status);
CREATE INDEX idx_features_created_at ON public.features(created_at DESC);
CREATE INDEX idx_features_order_index ON public.features(order_index);
CREATE INDEX idx_features_linked_error ON public.features(linked_error_id) WHERE linked_error_id IS NOT NULL;
CREATE INDEX idx_notifications_linked_feature ON public.notifications(linked_feature_id) WHERE linked_feature_id IS NOT NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();