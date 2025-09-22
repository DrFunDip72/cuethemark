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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleLogout } from '@/lib/utils';
import { User } from 'lucide-react';

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
    <div className="min-h-screen relative overflow-hidden text-[hsl(var(--hero-foreground))]">
      {/* Vibrant gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]" />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Account Profile</h1>
          <p className="text-xl opacity-90">Manage your CueTheMark account</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <div
            className="rounded-2xl p-[1.5px] shadow-xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(var(--gradient-hero-start)), hsl(var(--gradient-hero-mid)) 40%, hsl(var(--gradient-hero-end)))",
            }}
          >
            <Card className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/40">
              <CardHeader>
                <CardTitle className="text-foreground">Account Information</CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-white/10 border-white/20" />
                </div>
                <div>
                  <Label>User ID</Label>
                  <Input value={user?.id || ''} disabled className="font-mono text-sm bg-white/10 border-white/20" />
                </div>
                <div>
                  <Label>Account Created</Label>
                  <Input 
                    value={user?.created_at ? format(new Date(user.created_at), 'PPP') : ''} 
                    disabled 
                    className="bg-white/10 border-white/20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Status */}
          <div
            className="rounded-2xl p-[1.5px] shadow-xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(var(--gradient-hero-start)), hsl(var(--gradient-hero-mid)) 40%, hsl(var(--gradient-hero-end)))",
            }}
          >
            <Card className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/40">
              <CardHeader>
                <CardTitle className="text-foreground">Subscription Status</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
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
                      value={subscription.subscription_tier === 'lifetime' ? 'Lifetime Access' : (isDemo() ? 'Demo (1 day trial)' : 'Monthly ($1.99/month)')} 
                      disabled 
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                )}
                
                {subscription?.subscription_end && subscription.subscription_tier !== 'lifetime' && (
                  <div>
                    <Label>{isDemo() ? 'Demo ends on' : 'Next Billing Date'}</Label>
                    <Input 
                      value={format(new Date(subscription.subscription_end), 'PPP')} 
                      disabled 
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={checkSubscription} 
                    variant="green"
                    size="sm"
                    disabled={loading}
                  >
                    Refresh Status
                  </Button>
                  
                  {subscription?.subscribed && subscription.subscription_tier !== 'lifetime' && !isDemo() && subscriber?.stripe_customer_id && (
                    <Button 
                      onClick={handleManageBilling}
                      disabled={loading}
                      size="sm"
                      variant="purple"
                    >
                      Manage Billing
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings */}
          <div
            className="rounded-2xl p-[1.5px] shadow-xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(var(--gradient-hero-start)), hsl(var(--gradient-hero-mid)) 40%, hsl(var(--gradient-hero-end)))",
            }}
          >
            <Card className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/40">
              <CardHeader>
                <CardTitle className="text-foreground">Security</CardTitle>
                <CardDescription>Update your account security settings</CardDescription>
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
                      className="bg-white/10 border-white/20 placeholder:opacity-50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !newPassword.trim()}
                    className="w-full"
                    variant="default"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Account Actions */}
          <div
            className="rounded-2xl p-[1.5px] shadow-xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(var(--gradient-hero-start)), hsl(var(--gradient-hero-mid)) 40%, hsl(var(--gradient-hero-end)))",
            }}
          >
            <Card className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/40">
              <CardHeader>
                <CardTitle className="text-foreground">Account Actions</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleLogout(navigate)} 
                  variant="destructive"
                  className="w-full"
                >
                  Sign Out
                </Button>
                
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm opacity-70 mb-2">
                    Need to cancel your subscription or delete your account? Use the "Manage Billing" button above to access all account management options.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  </div>
  );
};

export default ProfilePage;
