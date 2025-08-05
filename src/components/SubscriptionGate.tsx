import { useAuth } from '@/contexts/AuthContext';
import { PromoGate } from './PromoGate';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const { user, subscription, loading, checkSubscription } = useAuth();

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

  if (!user) {
    return null; // This should be handled by ProtectedRoute
  }

  // Show signup/payment options if not subscribed
  if (!subscription?.subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to Dacker</CardTitle>
            <CardDescription>
              Choose your access option to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Sign Up & Pay ($1.99/month)
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Demo for a Day (Free)
            </Button>
            <div className="text-center">
              <Button 
                variant="link"
                onClick={() => window.location.href = '/auth'} 
                className="text-sm"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if subscription has ended
  if (subscription && subscription.subscription_end) {
    const endDate = new Date(subscription.subscription_end);
    const now = new Date();
    
    if (now > endDate) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
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
                onClick={() => window.open('https://checkout.stripe.com', '_blank')} 
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

  // User has active subscription, show the app
  return <>{children}</>;
};