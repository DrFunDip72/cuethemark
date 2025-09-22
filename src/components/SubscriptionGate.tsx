import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  const [isLogin, setIsLogin] = useState(false);
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

  const handleSignUp = async () => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      if (data.session) {
        const { error: trialError } = await supabase.functions.invoke('create-trial-subscription', {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        if (trialError) {
          console.error('Trial creation error:', trialError);
          toast({
            title: "Trial Setup Failed",
            description: "Account created but trial setup failed. Please try again from your profile.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Welcome to CueTheMark!",
          description: "Your 30-day free trial has started. Enjoy full access!",
        });
        await checkSubscription();
      } else {
        toast({
          title: "Welcome to CueTheMark!",
          description: "Please check your email to confirm your account, then sign in to start your trial.",
        });
      }
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>
              {isLogin ? 'Welcome Back to CueTheMark!' : 'Welcome to CueTheMark'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to continue using the application'
                : 'Sign up to start your 30-day free trial'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={authLoading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={authLoading}
                minLength={6}
              />
            </div>
            
            {isLogin ? (
              <Button 
                onClick={handleLogin}
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            ) : (
              <Button 
                onClick={handleSignUp}
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? 'Creating account...' : 'Start 30-Day Free Trial'}
              </Button>
            )}
            
            <div className="text-center">
              <Button 
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-lg font-medium"
                disabled={authLoading}
              >
                {isLogin 
                  ? 'New here? Create an account' 
                  : 'Already have an account? Sign in'
                }
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
        <div className="min-h-screen relative overflow-hidden text-[hsl(var(--hero-foreground))]">
          {/* Vibrant gradient backdrop matching landing page */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]" />
          
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-lg text-center space-y-8 animate-enter">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  {isTrialExpired ? `Hey ${displayName}!` : `Welcome back, ${displayName}!`}
                </h1>
                
                <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
                  {isTrialExpired 
                    ? `Your free trial was pretty great, wasn't it? 🎵 Ready to keep the music flowing for just $1.99/month?`
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
                >
                  {isTrialExpired ? 'Continue for $1.99/month' : 'Renew Subscription'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={checkSubscription}
                  size="lg"
                  className="rounded-full px-8 py-3 w-full max-w-sm bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                >
                  Check Status Again
                </Button>
              </div>

              <p className="text-sm opacity-70 mt-8">
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              Start your subscription to access CueTheMark
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Logged in as: {user?.email}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={async () => {
                setAuthLoading(true);
                try {
                  const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
                    headers: {
                      Authorization: `Bearer ${session?.access_token}`,
                    },
                  });

                  if (checkoutError) {
                    console.error('Checkout error:', checkoutError);
                    toast({
                      title: "Payment Setup Failed",
                      description: "Failed to setup payment. Please try again.",
                      variant: "destructive"
                    });
                    return;
                  }

                  if (checkout.url) {
                    window.open(checkout.url, '_blank');
                    toast({
                      title: "Redirecting to Payment",
                      description: "Complete your subscription setup in the new tab.",
                    });
                  }
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                  });
                } finally {
                  setAuthLoading(false);
                }
              }}
              className="w-full"
              disabled={authLoading}
            >
              {authLoading ? 'Setting up payment...' : 'Subscribe ($1.99/month)'}
            </Button>
            
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={checkSubscription}
                className="flex-1"
              >
                Refresh Status
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast({
                    title: "Logged out",
                    description: "You've been logged out successfully."
                  });
                }}
                className="shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  // User has active subscription, show the app
  return <>{children}</>;
};