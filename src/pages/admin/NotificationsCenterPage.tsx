import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { NotificationModal } from "@/components/NotificationModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Send, Clock, Save, BarChart3, CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";

const NotificationsCenterPage = () => {
  const [templateType, setTemplateType] = useState<"share" | "feedback" | "rating" | "announcement">("announcement");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all_users" | "subscribed" | "trial" | "new_users" | "admin" | "custom">("all_users");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
    loadNotifications();

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, first_name, last_name, is_admin")
      .order("created_at", { ascending: false });
    
    if (data) setUsers(data);
  };

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setNotifications(data);
  };

  const handleSend = async (saveAsDraft = false) => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (targetAudience === "custom" && selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsSubmitting(true);

    const status = saveAsDraft ? "draft" : scheduledDate ? "scheduled" : "sent";

    const { error } = await supabase
      .from("notifications")
      .insert({
        title,
        content,
        template_type: templateType,
        target_audience: targetAudience,
        custom_user_ids: targetAudience === "custom" ? selectedUserIds : [],
        scheduled_for: scheduledDate?.toISOString(),
        sent_at: !saveAsDraft && !scheduledDate ? new Date().toISOString() : null,
        status,
      });

    if (error) {
      toast.error("Failed to create notification");
      console.error(error);
    } else {
      toast.success(
        saveAsDraft 
          ? "Notification saved as draft" 
          : scheduledDate 
          ? "Notification scheduled" 
          : "Notification sent!"
      );
      
      // Reset form
      setTitle("");
      setContent("");
      setTemplateType("announcement");
      setTargetAudience("all_users");
      setScheduledDate(undefined);
      setSelectedUserIds([]);
      
      loadNotifications();
    }

    setIsSubmitting(false);
  };

  const getTemplatePlaceholder = () => {
    switch (templateType) {
      case "share":
        return "We'd love for you to share this app with your friends! Help us grow our community.";
      case "feedback":
        return "We value your opinion! Please let us know how we can improve your experience.";
      case "rating":
        return "How are you enjoying the app so far? Please rate your experience!";
      case "announcement":
        return "Check out our new feature that makes your workflow even better...";
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getUserDisplayName = (user: any) => {
    if (user.display_name) return user.display_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`.trim();
    return user.email;
  };

  const filteredUsers = users.filter(user => {
    const displayName = getUserDisplayName(user);
    const email = user.email || "";
    const search = searchQuery.toLowerCase();
    return displayName.toLowerCase().includes(search) || email.toLowerCase().includes(search);
  });

  const handlePreview = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in title and content to preview");
      return;
    }
    setShowPreview(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      scheduled: "outline",
      sent: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const calculateEngagementRate = (notif: any) => {
    if (notif.total_views === 0) return "0%";
    const rate = ((notif.total_interactions / notif.total_views) * 100).toFixed(1);
    return `${rate}%`;
  };

  const calculateViewRate = (notif: any) => {
    if (notif.total_sent === 0) return "0%";
    const rate = ((notif.total_views / notif.total_sent) * 100).toFixed(1);
    return `${rate}%`;
  };

  return (
    <AdminLayout
      title="Notifications Center"
      description="Send announcements and updates to users"
    >
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Create Notification</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Notification</CardTitle>
              <CardDescription>
                Choose a template and customize your message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="share">Share App</SelectItem>
                    <SelectItem value="feedback">Request Feedback</SelectItem>
                    <SelectItem value="rating">Request Rating</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder={getTemplatePlaceholder()}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="subscribed">Subscribed Users</SelectItem>
                    <SelectItem value="trial">Trial Users</SelectItem>
                    <SelectItem value="new_users">New Users (Last 7 days)</SelectItem>
                    <SelectItem value="admin">Admin Users</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetAudience === "custom" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Select Users</CardTitle>
                    <CardDescription>
                      {selectedUserIds.length} user(s) selected
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
                      {filteredUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No users found
                        </p>
                      ) : (
                        filteredUsers.map((user) => (
                          <div key={user.user_id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedUserIds.includes(user.user_id)}
                              onCheckedChange={() => toggleUserSelection(user.user_id)}
                            />
                            <label className="text-sm cursor-pointer flex-1">
                              {getUserDisplayName(user)} {user.is_admin && <Badge variant="secondary" className="ml-1 text-xs">Admin</Badge>}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Schedule (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Send immediately"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSend(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {scheduledDate ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Schedule
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleSend(true)}
                  disabled={isSubmitting}
                  variant="outline"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={isSubmitting}
                  variant="secondary"
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card key={notif.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{notif.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {notif.content}
                      </CardDescription>
                    </div>
                    {getStatusBadge(notif.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Template</div>
                      <div className="font-medium capitalize">{notif.template_type}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Audience</div>
                      <div className="font-medium capitalize">{notif.target_audience.replace("_", " ")}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Audience Size</div>
                      <div className="font-medium">{notif.total_sent || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Views</div>
                      <div className="font-medium">{notif.total_views || 0} ({calculateViewRate(notif)})</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Interactions</div>
                      <div className="font-medium">{notif.total_interactions || 0} ({calculateEngagementRate(notif)})</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.reduce((sum, n) => sum + (n.total_sent || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.reduce((sum, n) => sum + (n.total_views || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.reduce((sum, n) => sum + (n.total_interactions || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <CardDescription className="text-xs">Interactions / Views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalViews = notifications.reduce((sum, n) => sum + (n.total_views || 0), 0);
                    const totalInteractions = notifications.reduce((sum, n) => sum + (n.total_interactions || 0), 0);
                    return totalViews > 0 ? `${((totalInteractions / totalViews) * 100).toFixed(1)}%` : "0%";
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notification Performance</CardTitle>
              <CardDescription>Detailed analytics for sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.filter(n => n.status === "sent").length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No sent notifications yet</p>
                ) : (
                  notifications.filter(n => n.status === "sent").map((notif) => (
                    <div key={notif.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{notif.title}</div>
                          <div className="text-xs text-muted-foreground capitalize">{notif.template_type}</div>
                        </div>
                        <Badge variant="outline">
                          {calculateEngagementRate(notif)} engagement
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Audience</div>
                          <div className="font-medium">{notif.total_sent || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Views</div>
                          <div className="font-medium">{notif.total_views || 0}</div>
                          <div className="text-xs text-muted-foreground">{calculateViewRate(notif)} view rate</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Interactions</div>
                          <div className="font-medium">{notif.total_interactions || 0}</div>
                          <div className="text-xs text-muted-foreground">{calculateEngagementRate(notif)} of viewers</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Completions</div>
                          <div className="font-medium">{notif.total_completions || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Dismissals</div>
                          <div className="font-medium">{notif.total_dismissals || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NotificationModal
        notification={{
          id: "preview",
          title,
          content,
          template_type: templateType,
        }}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </AdminLayout>
  );
};

export default NotificationsCenterPage;
