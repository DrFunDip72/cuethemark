-- Function to calculate target audience size
CREATE OR REPLACE FUNCTION calculate_audience_size(
  p_target_audience target_audience,
  p_custom_user_ids uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audience_count integer;
BEGIN
  CASE p_target_audience
    WHEN 'all_users' THEN
      SELECT COUNT(*) INTO audience_count FROM profiles;
    
    WHEN 'subscribed' THEN
      SELECT COUNT(*) INTO audience_count 
      FROM subscribers 
      WHERE subscribed = true 
        AND (subscription_end IS NULL OR subscription_end > now());
    
    WHEN 'trial' THEN
      SELECT COUNT(*) INTO audience_count 
      FROM subscribers 
      WHERE subscription_tier = 'trial' 
        AND subscribed = true
        AND (subscription_end IS NULL OR subscription_end > now());
    
    WHEN 'new_users' THEN
      SELECT COUNT(*) INTO audience_count 
      FROM profiles 
      WHERE created_at >= now() - interval '7 days';
    
    WHEN 'admin' THEN
      SELECT COUNT(*) INTO audience_count 
      FROM profiles 
      WHERE is_admin = true;
    
    WHEN 'custom' THEN
      audience_count := array_length(p_custom_user_ids, 1);
    
    ELSE
      audience_count := 0;
  END CASE;
  
  RETURN COALESCE(audience_count, 0);
END;
$$;

-- Trigger function to set total_sent when notification status changes to 'sent'
CREATE OR REPLACE FUNCTION set_notification_total_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update total_sent when status changes to 'sent' and total_sent is still 0
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') AND NEW.total_sent = 0 THEN
    NEW.total_sent := calculate_audience_size(NEW.target_audience, NEW.custom_user_ids);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for notifications
DROP TRIGGER IF EXISTS trigger_set_notification_total_sent ON notifications;
CREATE TRIGGER trigger_set_notification_total_sent
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_total_sent();

-- Function to increment notification counters based on interaction changes
CREATE OR REPLACE FUNCTION update_notification_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT: Increment appropriate counter
  IF TG_OP = 'INSERT' THEN
    -- Increment total_views when viewed_at is set
    IF NEW.viewed_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_views = total_views + 1 
      WHERE id = NEW.notification_id;
    END IF;
    
    -- Increment total_interactions when interacted_at is set
    IF NEW.interacted_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_interactions = total_interactions + 1 
      WHERE id = NEW.notification_id;
    END IF;
    
    -- Increment total_completions when completed_at is set
    IF NEW.completed_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_completions = total_completions + 1 
      WHERE id = NEW.notification_id;
    END IF;
    
    -- Increment total_dismissals when dismissed_at is set
    IF NEW.dismissed_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_dismissals = total_dismissals + 1 
      WHERE id = NEW.notification_id;
    END IF;
  
  -- Handle UPDATE: Only increment if value changed from NULL to non-NULL
  ELSIF TG_OP = 'UPDATE' THEN
    -- Increment total_views if viewed_at changed from NULL to non-NULL
    IF OLD.viewed_at IS NULL AND NEW.viewed_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_views = total_views + 1 
      WHERE id = NEW.notification_id;
    END IF;
    
    -- Increment total_interactions if interacted_at changed from NULL to non-NULL
    IF OLD.interacted_at IS NULL AND NEW.interacted_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_interactions = total_interactions + 1 
      WHERE id = NEW.notification_id;
    END IF;
    
    -- Increment total_completions if completed_at changed from NULL to non-NULL
    IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_completions = total_completions + 1 
      WHERE id = NEW.notification_id;
    END IF;
    
    -- Increment total_dismissals if dismissed_at changed from NULL to non-NULL
    IF OLD.dismissed_at IS NULL AND NEW.dismissed_at IS NOT NULL THEN
      UPDATE notifications 
      SET total_dismissals = total_dismissals + 1 
      WHERE id = NEW.notification_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for notification_interactions
DROP TRIGGER IF EXISTS trigger_update_notification_counters ON notification_interactions;
CREATE TRIGGER trigger_update_notification_counters
  AFTER INSERT OR UPDATE ON notification_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_counters();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;