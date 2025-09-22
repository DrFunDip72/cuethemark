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

const ProfilePage = () => {
  const { user, session, subscription, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [subscriber, setSubscriber] = useState<{ stripe_customer_id: string | null; subscription_end: string | null; subscription_tier: string | null } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle billing success
  useEffect(() => {
    if (searchParams.get('billing') === 'success') {
      toast({
        title: "Billing Updated",
        description: "Your subscription has been successfully updated.",
      });
      // Remove the query parameter
      setSearchParams({});
      // Refresh subscription status
      checkSubscription();
    }
  }, [searchParams, setSearchParams, checkSubscription, toast]);

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Account Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div>
              <Label>User ID</Label>
              <Input value={user?.id || ''} disabled className="font-mono text-sm" />
            </div>
            <div>
              <Label>Account Created</Label>
              <Input 
                value={user?.created_at ? format(new Date(user.created_at), 'PPP') : ''} 
                disabled 
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
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
                />
              </div>
            )}
            
            {subscription?.subscription_end && subscription.subscription_tier !== 'lifetime' && (
              <div>
                <Label>{isDemo() ? 'Demo ends on' : 'Next Billing Date'}</Label>
                <Input 
                  value={format(new Date(subscription.subscription_end), 'PPP')} 
                  disabled 
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={checkSubscription} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                Refresh Status
              </Button>
              
              {subscription?.subscribed && subscription.subscription_tier !== 'lifetime' && !isDemo() && (
                <Button 
                  onClick={handleManageBilling}
                  disabled={loading}
                  size="sm"
                >
                  Manage Billing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
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
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading || !newPassword.trim()}
                className="w-full"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleLogout(navigate)} 
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Need to cancel your subscription or delete your account? Use the "Manage Billing" button above to access all account management options.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
