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
    <div className="min-h-screen relative overflow-hidden">
      {/* Vibrant gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]" />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <User className="w-8 h-8 text-[hsl(var(--hero-foreground))]" />
          </div>
          <h1 className="text-4xl font-bold text-[hsl(var(--hero-foreground))] mb-2">Account Profile</h1>
          <p className="text-xl opacity-90 text-[hsl(var(--hero-foreground))]">Manage your CueTheMark account</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--hero-foreground))]">Account Information</CardTitle>
            <CardDescription className="text-[hsl(var(--hero-foreground))]/70">Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[hsl(var(--hero-foreground))]">Email</Label>
              <Input value={user?.email || ''} disabled className="bg-white/10 border-white/20 text-[hsl(var(--hero-foreground))]" />
            </div>
            <div>
              <Label className="text-[hsl(var(--hero-foreground))]">User ID</Label>
              <Input value={user?.id || ''} disabled className="font-mono text-sm bg-white/10 border-white/20 text-[hsl(var(--hero-foreground))]" />
            </div>
            <div>
              <Label className="text-[hsl(var(--hero-foreground))]">Account Created</Label>
              <Input 
                value={user?.created_at ? format(new Date(user.created_at), 'PPP') : ''} 
                disabled 
                className="bg-white/10 border-white/20 text-[hsl(var(--hero-foreground))]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--hero-foreground))]">Subscription Status</CardTitle>
            <CardDescription className="text-[hsl(var(--hero-foreground))]/70">Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-[hsl(var(--hero-foreground))]">Status:</Label>
              <Badge variant={getSubscriptionBadgeVariant()} className="bg-white/20 text-[hsl(var(--hero-foreground))] border-white/20">
                {getSubscriptionStatus()}
              </Badge>
            </div>
            
            {subscription?.subscription_tier && (
              <div>
                <Label className="text-[hsl(var(--hero-foreground))]">Plan</Label>
                <Input 
                  value={subscription.subscription_tier === 'lifetime' ? 'Lifetime Access' : (isDemo() ? 'Demo (1 day trial)' : 'Monthly ($1.99/month)')} 
                  disabled 
                  className="bg-white/10 border-white/20 text-[hsl(var(--hero-foreground))]"
                />
              </div>
            )}
            
            {subscription?.subscription_end && subscription.subscription_tier !== 'lifetime' && (
              <div>
                <Label className="text-[hsl(var(--hero-foreground))]">{isDemo() ? 'Demo ends on' : 'Next Billing Date'}</Label>
                <Input 
                  value={format(new Date(subscription.subscription_end), 'PPP')} 
                  disabled 
                  className="bg-white/10 border-white/20 text-[hsl(var(--hero-foreground))]"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={checkSubscription} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-[hsl(var(--hero-foreground))]"
              >
                Refresh Status
              </Button>
              
              {subscription?.subscribed && subscription.subscription_tier !== 'lifetime' && !isDemo() && subscriber?.stripe_customer_id && (
                <Button 
                  onClick={handleManageBilling}
                  disabled={loading}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-[hsl(var(--hero-foreground))]"
                >
                  Manage Billing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--hero-foreground))]">Security</CardTitle>
            <CardDescription className="text-[hsl(var(--hero-foreground))]/70">Update your account security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-[hsl(var(--hero-foreground))]">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  className="bg-white/10 border-white/20 text-[hsl(var(--hero-foreground))] placeholder:text-[hsl(var(--hero-foreground))]/50"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading || !newPassword.trim()}
                className="w-full bg-white/20 hover:bg-white/30 text-[hsl(var(--hero-foreground))] border-white/20"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--hero-foreground))]">Account Actions</CardTitle>
            <CardDescription className="text-[hsl(var(--hero-foreground))]/70">Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleLogout(navigate)} 
              variant="outline"
              className="w-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-[hsl(var(--hero-foreground))]"
            >
              Sign Out
            </Button>
            
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-[hsl(var(--hero-foreground))]/70 mb-2">
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
