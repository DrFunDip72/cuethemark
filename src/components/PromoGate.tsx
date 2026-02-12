import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PromoGateProps {
  onSuccess: () => void;
}

export const PromoGate = ({ onSuccess }: PromoGateProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim() || !session) return;

    setLoading(true);
    try {
      // Validate promo code
      const { data: validation, error: validationError } = await supabase.functions.invoke('validate-promo-code', {
        body: { 
          code: promoCode.trim(),
          userId: session.user.id 
        },
      });

      if (validationError || !validation.valid) {
        toast({
          title: "Invalid Promo Code",
          description: validation?.error || "Please check your promo code and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create checkout session with promo code
      const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: { promoCodeId: validation.promoCode.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (checkoutError) throw checkoutError;

      // Open checkout in new tab
      if (checkout.url) {
        window.open(checkout.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Complete your subscription setup in the new tab.",
        });
        onSuccess();
      }

    } catch (error) {
      console.error('Error processing promo code:', error);
      toast({
        title: "Error",
        description: "Failed to process promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
      <Card className="w-full max-w-md border-0 shadow-xl" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
        <CardHeader className="text-center">
          <CardTitle style={{ color: "hsl(var(--landing-text))" }}>Welcome to Audio Labeling Tool</CardTitle>
          <CardDescription style={{ color: "hsl(var(--landing-text-muted))" }}>
            Enter a valid promo code to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePromoSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={loading}
                className="text-center"
                autoFocus
                style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !promoCode.trim()}
              style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
            >
              {loading ? 'Validating...' : 'Activate Access'}
            </Button>
          </form>
          <div className="mt-6 space-y-2 text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>
            <p className="text-center font-medium">Access Types:</p>
            <ul className="space-y-1">
              <li>• <strong>Demo codes:</strong> 1-day trial</li>
              <li>• <strong>Monthly codes:</strong> 1 month free</li>
              <li>• <strong>Lifetime codes:</strong> Permanent access</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};