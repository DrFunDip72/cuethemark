
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully"
        });
        
        // Check if user is admin and redirect accordingly
        if (email === 'justinsmaxwell722@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        // Regular signup - create account and redirect to Stripe
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          // User is immediately signed in, redirect to checkout
          const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
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
            navigate('/');
            return;
          }

          if (checkout.url) {
            window.open(checkout.url, '_blank');
            toast({
              title: "Account Created!",
              description: "Complete your subscription setup in the new tab.",
            });
            navigate('/');
          }
        } else {
          toast({
            title: "Welcome to Dacker!",
            description: "Please check your email to confirm your account, then sign in.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignup = async () => {
    setLoading(true);

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
        // Create demo subscription
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
        }
        navigate('/');
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Dacker</h1>
          
          {isLogin ? (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-primary mb-2">Welcome Back!</h2>
              <p className="text-gray-600">
                Sign in to continue marking your dance tracks
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-green-600 mb-2">Join Us!</h2>
              <p className="text-gray-600">
                Create your account to start marking dance tracks and organizing your music
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
            />
          </div>

          {isLogin ? (
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Please wait...' : 'Sign Up & Pay ($1.99/month)'}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleDemoSignup}
              >
                Demo for a Day (Free)
              </Button>
            </div>
          )}
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;
