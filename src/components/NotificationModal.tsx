import { useState } from "react";
import { X, Star, Copy, Share2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NotificationModalProps {
  notification: {
    id: string;
    title: string;
    content: string;
    template_type: "share" | "feedback" | "rating" | "announcement";
  };
  open: boolean;
  onClose: () => void;
}

export const NotificationModal = ({ notification, open, onClose }: NotificationModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleView = async () => {
    if (notification.id === "preview") return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notification_interactions")
      .upsert({
        notification_id: notification.id,
        user_id: user.id,
        viewed_at: new Date().toISOString(),
      }, {
        onConflict: "notification_id,user_id",
        ignoreDuplicates: false,
      });

    // Update view count
    const { data: notif } = await supabase
      .from("notifications")
      .select("total_views")
      .eq("id", notification.id)
      .single();

    if (notif) {
      await supabase
        .from("notifications")
        .update({ total_views: (notif.total_views || 0) + 1 })
        .eq("id", notification.id);
    }
  };

  const handleInteraction = async () => {
    if (notification.id === "preview") return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notification_interactions")
      .upsert({
        notification_id: notification.id,
        user_id: user.id,
        interacted_at: new Date().toISOString(),
      }, {
        onConflict: "notification_id,user_id",
        ignoreDuplicates: false,
      });
  };

  const handleCopyLink = async () => {
    await handleInteraction();
    await navigator.clipboard.writeText(window.location.origin);
    toast.success("Link copied to clipboard!");
  };

  const handleShare = async () => {
    await handleInteraction();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this app!",
          text: notification.content,
          url: window.location.origin,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (notification.id === "preview") {
      toast.success("Preview mode - rating not saved");
      onClose();
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notification_interactions")
      .upsert({
        notification_id: notification.id,
        user_id: user.id,
        completed_at: new Date().toISOString(),
        response_type: "rating",
        response_data: { rating },
      }, {
        onConflict: "notification_id,user_id",
        ignoreDuplicates: false,
      });

    toast.success("Thank you for your rating!");
    setIsSubmitting(false);
    onClose();
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    if (notification.id === "preview") {
      toast.success("Preview mode - feedback not saved");
      onClose();
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save to feedback table
    await supabase.from("feedback").insert({
      user_id: user.id,
      type: "notification_response",
      message: feedback,
    });

    // Track interaction
    await supabase
      .from("notification_interactions")
      .upsert({
        notification_id: notification.id,
        user_id: user.id,
        completed_at: new Date().toISOString(),
        response_type: "feedback",
        response_data: { feedback },
      }, {
        onConflict: "notification_id,user_id",
        ignoreDuplicates: false,
      });

    toast.success("Thank you for your feedback!");
    setIsSubmitting(false);
    onClose();
  };

  const handleDismiss = async () => {
    if (notification.id !== "preview") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("notification_interactions")
          .upsert({
            notification_id: notification.id,
            user_id: user.id,
            dismissed_at: new Date().toISOString(),
          }, {
            onConflict: "notification_id,user_id",
            ignoreDuplicates: false,
          });
      }
    }

    onClose();
  };

  const renderContent = () => {
    switch (notification.template_type) {
      case "share":
        return (
          <div className="space-y-4">
            <p className="text-white/90">{notification.content}</p>
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} className="flex-1 bg-white text-primary hover:bg-white/90">
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button onClick={handleShare} className="flex-1 bg-white text-primary hover:bg-white/90">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        );

      case "feedback":
        return (
          <div className="space-y-4">
            <p className="text-white/90">{notification.content}</p>
            <Textarea
              placeholder="Enter your feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
            <Button onClick={handleFeedbackSubmit} disabled={isSubmitting} className="w-full bg-white text-primary hover:bg-white/90">
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </div>
        );

      case "rating":
        return (
          <div className="space-y-4">
            <p className="text-white/90">{notification.content}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-300 text-yellow-300"
                        : "text-white/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Button onClick={handleRatingSubmit} disabled={isSubmitting || rating === 0} className="w-full bg-white text-primary hover:bg-white/90">
              Submit Rating
            </Button>
          </div>
        );

      case "announcement":
        return (
          <div className="space-y-4">
            <p className="text-white/90 whitespace-pre-wrap">{notification.content}</p>
            <Button onClick={handleDismiss} className="w-full bg-white text-primary hover:bg-white/90">
              Got it
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent 
        className="sm:max-w-md border-0 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))] text-white shadow-2xl" 
        onOpenAutoFocus={handleView}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {notification.title}
          </DialogTitle>
        </DialogHeader>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
