import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { handleLogout } from '@/lib/utils';
import { User, MessageSquare } from 'lucide-react';

const ProfilePage = () => {
  const { user, session, subscription, checkSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [subscriber, setSubscriber] = useState<{ stripe_customer_id: string | null; subscription_end: string | null; subscription_tier: string | null } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }; 

  useEffect(() => {
    const fetchSubscriber = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('subscribers')
        .select('stripe_customer_id, subscription_end, subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      setSubscriber(data);
    };
    fetchSubscriber();
  }, [user?.id]);

  // Handle successful checkout
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated. Refreshing your account status...",
      });
      checkSubscription();
      // Clean up URL
      navigate('/app/profile', { replace: true });
    }
  }, [searchParams, checkSubscription, navigate, toast]);

  const isDemo = () => {
    if (!subscription?.subscribed) return false;
    const endStr = subscriber?.subscription_end || subscription?.subscription_end;
    if (!endStr) return false;
    const hoursLeft = (new Date(endStr).getTime() - Date.now()) / 36e5;
    const noStripe = !subscriber?.stripe_customer_id;
    return subscription.subscription_tier === 'monthly' && noStripe && hoursLeft <= 48;
  };

  const getSubscriptionBadgeVariant = () => {
    if (!subscription?.subscribed) return "destructive";
    if (subscription.subscription_tier === "lifetime") return "default";
    if (isDemo()) return "secondary";
    return "secondary";
  };

  const getSubscriptionStatus = () => {
    if (!subscription?.subscribed) return "Inactive";
    if (subscription.subscription_tier === "lifetime") return "Lifetime Access";
    if (isDemo()) return "Active Demo";
    return "Active Monthly";
  };


  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
      <div className="container mx-auto px-4 pt-6 pb-8 max-w-4xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
            <User className="w-8 h-8" style={{ color: "hsl(var(--landing-text))" }} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Account Profile</h1>
          <p className="text-base" style={{ color: "hsl(var(--landing-text-muted))" }}>Manage your CueTheMark account</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <Card
            className="rounded-2xl"
            style={{
              backgroundColor: "hsl(var(--landing-surface))",
              borderColor: "hsl(var(--landing-border))",
            }}
          >
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription className="text-[hsl(var(--landing-text-muted))]">Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  style={{
                    backgroundColor: "hsl(var(--landing-bg))",
                    borderColor: "hsl(var(--landing-border))",
                    color: "hsl(var(--landing-text))",
                  }}
                />
              </div>
              <div>
                <Label>Account Created</Label>
                <Input
                  value={user?.created_at ? format(new Date(user.created_at), 'PPP') : ''}
                  disabled
                  style={{
                    backgroundColor: "hsl(var(--landing-bg))",
                    borderColor: "hsl(var(--landing-border))",
                    color: "hsl(var(--landing-text))",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card
            className="rounded-2xl"
            style={{
              backgroundColor: "hsl(var(--landing-surface))",
              borderColor: "hsl(var(--landing-border))",
            }}
          >
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription className="text-[hsl(var(--landing-text-muted))]">Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Badge variant={getSubscriptionBadgeVariant()}>
                  {getSubscriptionStatus()}
                </Badge>
              </div>
              
              {subscription?.subscription_tier && (
                <div>
                  <Label>Plan</Label>
                  <Input
                    value={subscription.subscription_tier === 'lifetime' ? 'Lifetime Access' : (isDemo() ? 'Demo (1 day trial)' : 'Monthly ($6.99/month)')}
                    disabled
                    style={{
                      backgroundColor: "hsl(var(--landing-bg))",
                      borderColor: "hsl(var(--landing-border))",
                      color: "hsl(var(--landing-text))",
                    }}
                  />
                </div>
              )}
              
              {subscription?.subscription_end && subscription.subscription_tier !== 'lifetime' && (
                <div>
                  <Label>{isDemo() ? 'Demo ends on' : 'Next Billing Date'}</Label>
                  <Input
                    value={format(new Date(subscription.subscription_end), 'PPP')}
                    disabled
                    style={{
                      backgroundColor: "hsl(var(--landing-bg))",
                      borderColor: "hsl(var(--landing-border))",
                      color: "hsl(var(--landing-text))",
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={checkSubscription}
                  size="sm"
                  disabled={loading}
                  style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
                >
                  Refresh Status
                </Button>
                
                {subscription?.subscribed && subscription.subscription_tier !== 'lifetime' && !isDemo() && subscriber?.stripe_customer_id && (
                  <Button
                    onClick={handleManageBilling}
                    disabled={loading}
                    size="sm"
                    variant="green"
                  >
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card
            className="rounded-2xl"
            style={{
              backgroundColor: "hsl(var(--landing-surface))",
              borderColor: "hsl(var(--landing-border))",
            }}
          >
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription className="text-[hsl(var(--landing-text-muted))]">Update your account security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    style={{
                      backgroundColor: "hsl(var(--landing-bg))",
                      borderColor: "hsl(var(--landing-border))",
                      color: "hsl(var(--landing-text))",
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !newPassword.trim()}
                  className="w-full"
                  style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card
            className="rounded-2xl"
            style={{
              backgroundColor: "hsl(var(--landing-surface))",
              borderColor: "hsl(var(--landing-border))",
            }}
          >
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription className="text-[hsl(var(--landing-text-muted))]">Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                asChild
                variant="outline"
                className="w-full border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-[hsl(var(--landing-text))] hover:bg-[hsl(var(--landing-border))] hover:text-[hsl(var(--landing-text))]"
              >
                <Link to={`/app/feedback?from=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Feedback
                </Link>
              </Button>
              <Button
                onClick={() => handleLogout(navigate)}
                variant="destructive"
                className="w-full"
              >
                Sign Out
              </Button>
              
              <div className="pt-4" style={{ borderTop: "1px solid hsl(var(--landing-border))" }}>
                <p className="text-sm mb-2" style={{ color: "hsl(var(--landing-text-muted))" }}>
                  Need to cancel your subscription or delete your account? Use the "Manage Billing" button above to access all account management options.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
