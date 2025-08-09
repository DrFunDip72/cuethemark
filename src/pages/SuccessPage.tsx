import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SuccessPage = () => {
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Update SEO and refresh subscription
    document.title = "Subscription Success – MarkTapDance";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Subscription activated. Start labeling your audio files.');
    }

    const timer = setTimeout(() => {
      checkSubscription();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <div className="min-h-screen relative flex items-center justify-center text-[hsl(var(--hero-foreground))] bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))] px-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-primary/10">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to MarkTapDance!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You now have full access to all features. Start uploading and labeling your audio files.
          </p>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/app/tracks">Start Using the App</Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link to="/app/profile">View Account Details</Link>
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