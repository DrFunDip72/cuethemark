import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PromoGate } from './PromoGate';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const { user, session, subscription, loading, checkSubscription, isAdmin } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

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
        const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        if (checkoutError) {
          console.error('Checkout error:', checkoutError);
          toast({
            title: "Payment Setup Failed",
            description: "Account created but payment setup failed. Please try again from your profile.",
            variant: "destructive"
          });
          return;
        }

        if (checkout.url) {
          window.open(checkout.url, '_blank');
          toast({
            title: "Account Created!",
            description: "Complete your subscription setup in the new tab.",
          });
        }
      } else {
        toast({
          title: "Welcome to MarkTapDance!",
          description: "Please check your email to confirm your account, then sign in.",
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

  const handleDemoSignup = async () => {
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
        const { error: demoError } = await supabase.functions.invoke('create-demo-subscription', {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        if (demoError) {
          console.error('Demo creation error:', demoError);
          toast({
            title: "Demo Setup Failed",
            description: "Account created but demo setup failed. Please contact support.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Demo Account Created!",
            description: "You have 1 day of free access. Upgrade anytime from your profile.",
          });
          await checkSubscription();
        }
      } else {
        toast({
          title: "Demo Account Created!",
          description: "Please check your email to confirm your account, then sign in for your 1-day demo.",
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
      
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully"
      });
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
              {isLogin ? 'Welcome Back to MarkTapDance!' : 'Welcome to MarkTapDance'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to continue using the application'
                : 'Choose your access option to get started'
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
              <>
                <Button 
                  onClick={handleSignUp}
                  className="w-full"
                  disabled={authLoading}
                >
                  {authLoading ? 'Creating account...' : 'Sign Up & Pay ($1.99/month)'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDemoSignup}
                  className="w-full"
                  disabled={authLoading}
                >
                  {authLoading ? 'Creating demo...' : 'Demo for a Day (Free)'}
                </Button>
              </>
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
      return (
        <div className="min-h-screen flex items-center justify-center text-[hsl(var(--hero-foreground))] bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>
                {subscription.subscription_tier === 'Demo' ? 'Demo Expired' : 'Subscription Expired'}
              </CardTitle>
              <CardDescription>
                {subscription.subscription_tier === 'Demo' 
                  ? 'Your 1-day demo has ended. Upgrade to continue using the application.'
                  : 'Your subscription has ended. Please renew to continue using the application.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
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
                className="w-full"
              >
                Upgrade Now ($1.99/month)
              </Button>
              <Button 
                variant="outline"
                onClick={checkSubscription}
                className="w-full"
              >
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Show subscription options for authenticated users without subscription
  if (!subscription?.subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[hsl(var(--hero-foreground))] bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              Choose your subscription to access MarkTapDance
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
            {subscription?.subscription_tier === 'Demo' && subscription?.subscription_end && (new Date(subscription.subscription_end) < new Date()) ? (
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                Demo expired — please subscribe
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={async () => {
                  setAuthLoading(true);
                  try {
                    const { error: demoError } = await supabase.functions.invoke('create-demo-subscription', {
                      headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                      },
                    });

                    if (demoError) {
                      console.error('Demo creation error:', demoError);
                      toast({
                        title: "Demo Setup Failed",
                        description: "Failed to setup demo. Please contact support.",
                        variant: "destructive"
                      });
                    } else {
                      toast({
                        title: "Demo Account Activated!",
                        description: "You now have 1 day of free access. Upgrade anytime from your profile.",
                      });
                      checkSubscription(); // Refresh the subscription status
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
                {authLoading ? 'Setting up demo...' : 'Try Demo (Free for 1 Day)'}
              </Button>
            )}
            
            
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