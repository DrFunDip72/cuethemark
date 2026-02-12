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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
      <Card
        className="w-full max-w-md text-center"
        style={{
          backgroundColor: "hsl(var(--landing-surface))",
          borderColor: "hsl(var(--landing-border))",
        }}
      >
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "hsl(var(--landing-accent) / 0.2)" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "hsl(var(--landing-accent))" }} />
          </div>
          <CardTitle className="text-2xl">Welcome to CueTheMark!</CardTitle>
          <CardDescription className="text-[hsl(var(--landing-text-muted))]">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[hsl(var(--landing-text-muted))]">
            You now have full access to all features. Start uploading and labeling your audio files.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
              <Link to="/app/tracks">Start Using the App</Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full border-[hsl(var(--landing-border))] text-[hsl(var(--landing-text-muted))] hover:bg-[hsl(var(--landing-surface-hover))] hover:text-[hsl(var(--landing-text))]">
              <Link to="/app/profile">View Account Details</Link>
            </Button>
          </div>
          
          <div className="pt-4 text-xs text-[hsl(var(--landing-text-muted))]">
            <p>Questions? Contact our support team for assistance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;