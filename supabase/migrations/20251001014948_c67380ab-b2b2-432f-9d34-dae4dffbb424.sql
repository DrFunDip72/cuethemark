-- Create notification template types
CREATE TYPE notification_template AS ENUM ('share', 'feedback', 'rating', 'announcement');

-- Create notification status types
CREATE TYPE notification_status AS ENUM ('draft', 'scheduled', 'sent', 'archived');

-- Create target audience types
CREATE TYPE target_audience AS ENUM ('all_users', 'subscribed', 'trial', 'new_users', 'custom');

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  template_type notification_template NOT NULL,
  status notification_status DEFAULT 'draft' NOT NULL,
  target_audience target_audience DEFAULT 'all_users' NOT NULL,
  custom_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Template-specific data stored as JSONB for flexibility
  template_data JSONB DEFAULT '{}'::jsonb,
  
  -- Analytics counters
  total_sent INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  total_dismissals INTEGER DEFAULT 0
);

-- Create notification_interactions table
CREATE TABLE public.notification_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Interaction tracking
  viewed_at TIMESTAMP WITH TIME ZONE,
  interacted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Response data (ratings, feedback, etc.)
  response_type TEXT,
  response_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Ensure one interaction record per user per notification
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (user_is_admin(auth.uid()));

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (user_is_admin(auth.uid()));

CREATE POLICY "Admins can update notifications"
  ON public.notifications FOR UPDATE
  USING (user_is_admin(auth.uid()));

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  USING (user_is_admin(auth.uid()));

-- RLS Policies for notification_interactions
CREATE POLICY "Users can view their own interactions"
  ON public.notification_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
  ON public.notification_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON public.notification_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions"
  ON public.notification_interactions FOR SELECT
  USING (user_is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_notifications_sent ON public.notifications(sent_at);
CREATE INDEX idx_notification_interactions_user ON public.notification_interactions(user_id);
CREATE INDEX idx_notification_interactions_notification ON public.notification_interactions(notification_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();