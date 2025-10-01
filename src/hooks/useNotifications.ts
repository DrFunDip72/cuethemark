import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  content: string;
  template_type: "share" | "feedback" | "rating" | "announcement";
}

export const useNotifications = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkForNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's subscription status
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("subscribed, subscription_tier")
        .eq("user_id", user.id)
        .single();

      // Get user's profile for signup date
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("user_id", user.id)
        .single();

      // Determine user segment
      const isNewUser = profile?.created_at 
        ? new Date(profile.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : false;

      // Get notifications that haven't been viewed yet
      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("status", "sent")
        .is("scheduled_for", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!notifications || notifications.length === 0) return;

      const notif = notifications[0];

      // Check targeting
      const shouldShow = 
        notif.target_audience === "all_users" ||
        (notif.target_audience === "subscribed" && subscriber?.subscribed) ||
        (notif.target_audience === "trial" && subscriber?.subscription_tier === "trial") ||
        (notif.target_audience === "new_users" && isNewUser) ||
        (notif.target_audience === "custom" && notif.custom_user_ids?.includes(user.id));

      if (!shouldShow) return;

      // Check if user has already interacted with this notification
      const { data: interaction } = await supabase
        .from("notification_interactions")
        .select("*")
        .eq("notification_id", notif.id)
        .eq("user_id", user.id)
        .single();

      if (interaction) return; // Already seen

      setNotification({
        id: notif.id,
        title: notif.title,
        content: notif.content,
        template_type: notif.template_type,
      });
      setIsOpen(true);
    };

    checkForNotifications();

    // Check for new notifications every minute
    const interval = setInterval(checkForNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const closeNotification = () => {
    setIsOpen(false);
    setNotification(null);
  };

  return {
    notification,
    isOpen,
    closeNotification,
  };
};
