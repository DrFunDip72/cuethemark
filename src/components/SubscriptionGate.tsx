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

  // If user doesn't have an active subscription, show promo gate
  if (!subscription?.subscribed) {
    return (
      <PromoGate 
        onSuccess={() => {
          // Refresh subscription status after successful promo code activation
          setTimeout(() => {
            checkSubscription();
          }, 2000);
        }} 
      />
    );
  }

  // Show subscription expired message if subscription has ended
  if (subscription.subscription_end && new Date(subscription.subscription_end) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Subscription Expired</CardTitle>
            <CardDescription>
              Your subscription has expired. Please contact support for renewal options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
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

  // User has active subscription, show the app
  return <>{children}</>;
};