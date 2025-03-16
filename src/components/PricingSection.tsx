
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const PricingSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    toast({
      title: "Authentication Required",
      description: "Please sign in to continue with the purchase.",
    });
    navigate("/auth");
  };

  const handleSubscribe = async () => {
    if (!user) {
      handleLoginRedirect();
      return;
    }

    if (hasActiveSubscription) {
      toast({
        title: "Already Subscribed",
        description: "You already have an active subscription.",
      });
      navigate("/dashboard");
      return;
    }

    setIsLoading(true);
    try {
      const fallbackUrl = `${window.location.origin}/payment-fallback`;
      const callbackUrl = `${window.location.origin}/payment-callback`;

      console.log(`Creating payment with callback: ${callbackUrl} and fallback: ${fallbackUrl}`);

      const response = await fetch('https://pay.techrealm.pk/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 5141,
          redirection_url: callbackUrl,
          fallback_url: fallbackUrl,
          metadata: {
            user_id: user.id,
            email: user.email,
            created_at: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Payment initiation failed:', errorData || response.statusText);
        throw new Error('Payment initiation failed');
      }

      const data = await response.json();
      console.log('Payment response:', data);

      if (data.payment_url) {
        try {
          await supabase
            .from('payment_transactions')
            .insert({
              user_id: user.id,
              transaction_id: data.id || 'pending',
              amount: 14,
              currency: 'USD',
              status: 'pending',
              payment_reference: data.id || 'pending',
              payment_data: {
                initiated_at: new Date().toISOString(),
                payment_url: data.payment_url
              }
            });
        } catch (dbError) {
          console.error('Error recording payment attempt:', dbError);
        }

        window.location.href = data.payment_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your cooking journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Free Trial</h3>
              <div className="text-4xl font-bold mb-6">$0</div>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>1 Recipe Generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Basic Recipe Details</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>AI-Powered Ingredient Analysis</span>
                </li>
              </ul>
              <Button 
                disabled={true} 
                className="w-full" 
                variant="outline"
              >
                {!user ? "Sign Up to Start" : "Current Plan"}
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-amber-50 border-amber-200">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Starter Package</h3>
              <div className="text-4xl font-bold mb-6">$14</div>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Unlimited Recipe Generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Detailed Recipe Instructions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Advanced AI Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              {hasActiveSubscription ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleDashboardClick}
                >
                  View Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700" 
                  onClick={user ? handleSubscribe : handleLoginRedirect}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : user ? "Upgrade Now" : "Sign In to Upgrade"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
