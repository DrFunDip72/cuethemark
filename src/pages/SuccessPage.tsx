import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SuccessPage = () => {
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Check subscription status after successful payment
    const timer = setTimeout(() => {
      checkSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Audio Labeling Tool!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You now have full access to all features. Start uploading and labeling your audio files.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/">Start Using the App</Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/profile">View Account Details</Link>
            </Button>
          </div>
          
          <div className="pt-4 text-xs text-muted-foreground">
            <p>Questions? Contact our support team for assistance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;