import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PromoGate } from './PromoGate';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Sparkles } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const { user, session, subscription, loading, checkSubscription, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const { toast } = useToast();

  // Fetch user's name from profiles
  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.email) {
          // Extract first name from email (everything before @ and before any dots/numbers)
          const emailParts = profile.email.split('@')[0];
          const firstName = emailParts.split(/[^a-zA-Z]/)[0];
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1) || 'there');
        }
      }
    };
    fetchUserName();
  }, [user]);

  // Proactively fetch subscription when user exists but subscription is not yet loaded
  useEffect(() => {
    if (user && !isAdmin && subscription === null && session) {
      checkSubscription();
    }
  }, [user, isAdmin, subscription, session, checkSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading subscription status...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password", 
        variant: "destructive"
      });
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      await checkSubscription();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // While subscription is being resolved, avoid showing the paywall
  if (user && !isAdmin && subscription === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking your access…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
        <Card className="w-full max-w-md border-0 shadow-xl" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
          <CardHeader className="text-center">
            <CardTitle style={{ color: "hsl(var(--landing-text))" }}>Welcome Back to CueTheMark!</CardTitle>
            <CardDescription style={{ color: "hsl(var(--landing-text-muted))" }}>
              Sign in to continue using the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" style={{ color: "hsl(var(--landing-text))" }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={authLoading}
                style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }}
              />
            </div>
            <div>
              <Label htmlFor="password" style={{ color: "hsl(var(--landing-text))" }}>Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={authLoading}
                minLength={6}
                style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }}
              />
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full rounded-full"
              style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
              disabled={authLoading}
            >
              {authLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="text-center">
              <Button asChild variant="link" className="text-lg font-medium rounded-full" style={{ color: "hsl(var(--landing-text-muted))" }}>
                <Link to="/get-started">New here? Start your free trial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin users bypass subscription requirements
  if (isAdmin) {
    return <>{children}</>;
  }

  // If subscription has ended (including expired demos), show upgrade prompt
  if (subscription && subscription.subscription_end && !isAdmin) {
    const endDate = new Date(subscription.subscription_end);
    if (new Date() > endDate) {
      const isTrialExpired = subscription.subscription_tier === 'Trial';
      const displayName = userName || 'friend';
      
      return (
        <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
          
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-lg text-center space-y-8 animate-enter">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
                  <Sparkles className="w-8 h-8" style={{ color: "hsl(var(--landing-accent))" }} />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "hsl(var(--landing-text))" }}>
                  {isTrialExpired ? `Hey ${displayName}!` : `Welcome back, ${displayName}!`}
                </h1>
                
                <p className="text-xl md:text-2xl leading-relaxed" style={{ color: "hsl(var(--landing-text-muted))" }}>
                  {isTrialExpired 
                    ? `Your free trial was pretty great, wasn't it? 🎵 Ready to keep the music flowing for just $6.99/month?`
                    : `Time to get back to making those perfect cues! Your subscription expired, but we've saved all your work. 🎯`
                  }
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={async () => {
                    try {
                      const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
                        headers: { Authorization: `Bearer ${session?.access_token}` },
                      });
                      if (checkoutError) {
                        toast({ title: 'Payment Setup Failed', description: 'Please try again.', variant: 'destructive' });
                        return;
                      }
                      if (checkout?.url) window.open(checkout.url, '_blank');
                    } catch (e: any) {
                      toast({ title: 'Error', description: e.message, variant: 'destructive' });
                    }
                  }} 
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-semibold w-full max-w-sm"
                  style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
                >
                  {isTrialExpired ? 'Continue for $6.99/month' : 'Renew Subscription'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={checkSubscription}
                  size="lg"
                  className="rounded-full px-8 py-3 w-full max-w-sm"
                  style={{ borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text-muted))", backgroundColor: "hsl(var(--landing-surface))" }}
                >
                  Check Status Again
                </Button>
              </div>

              <p className="text-sm mt-8" style={{ color: "hsl(var(--landing-text-muted))" }}>
                Questions? We're here to help! 💙
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Show subscription options for authenticated users without subscription
  if (!subscription?.subscribed) {
    const displayName = userName || 'friend';
    
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-lg text-center space-y-8 animate-enter">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
                <Sparkles className="w-8 h-8" style={{ color: "hsl(var(--landing-accent))" }} />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "hsl(var(--landing-text))" }}>
                Hey {displayName}!
              </h1>
              
              <p className="text-xl md:text-2xl leading-relaxed" style={{ color: "hsl(var(--landing-text-muted))" }}>
                Ready to unlock all the power of CueTheMark? 🎵 Start your subscription for just $6.99/month!
              </p>
              
              <div className="flex items-center justify-center gap-2 mt-4 text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>
                <User className="h-4 w-4" />
                <span>Logged in as: {user?.email}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={async () => {
                  setAuthLoading(true);
                  try {
                    const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
                      headers: { Authorization: `Bearer ${session?.access_token}` },
                    });
                    if (checkoutError) {
                      toast({ title: 'Payment Setup Failed', description: 'Please try again.', variant: 'destructive' });
                      return;
                    }
                    if (checkout?.url) window.open(checkout.url, '_blank');
                  } catch (e: any) {
                    toast({ title: 'Error', description: e.message, variant: 'destructive' });
                  } finally {
                    setAuthLoading(false);
                  }
                }} 
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold w-full max-w-sm"
                style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
                disabled={authLoading}
              >
                {authLoading ? 'Setting up payment...' : 'Subscribe for $6.99/month'}
              </Button>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline"
                  onClick={checkSubscription}
                  size="lg"
                  className="rounded-full px-8 py-3"
                  style={{ borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text-muted))", backgroundColor: "hsl(var(--landing-surface))" }}
                >
                  Check Status Again
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast({
                      title: "Logged out",
                      description: "You've been logged out successfully."
                    });
                  }}
                  className="rounded-full px-8 py-3"
                  style={{ borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text-muted))", backgroundColor: "hsl(var(--landing-surface))" }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            <p className="text-sm mt-8" style={{ color: "hsl(var(--landing-text-muted))" }}>
              Questions? We're here to help! 💙
            </p>
          </div>
        </div>
      </div>
    );
  }


  // User has active subscription, show the app
  return <>{children}</>;
};