
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PaymentCallback() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const verifyPayment = async () => {
      try {
        console.log("Verifying payment with query params:", location.search);
        const queryParams = new URLSearchParams(location.search);
        const success = queryParams.get("success") === "true";
        const paymentId = queryParams.get("id") || queryParams.get("payment_id");

        if (!paymentId) {
          console.error("No payment ID found in redirect URL");
          setIsSuccess(false);
          setError("Payment verification failed. No payment reference found.");
          setIsLoading(false);
          return;
        }

        // Even if success param is false, we'll still verify the payment with our backend
        // since sometimes the redirect params can be incorrect
        console.log(`Verifying payment ID: ${paymentId} for user: ${user.id}`);

        // Call the Supabase Edge Function to verify and record the payment
        const { data, error: verifyError } = await supabase.functions.invoke("verify-payment", {
          body: { paymentId, userId: user.id },
        });

        if (verifyError) {
          console.error("Error calling verify-payment function:", verifyError);
          setIsSuccess(false);
          setError("Error verifying payment. Please contact support.");
          setIsLoading(false);
          return;
        }

        console.log("Verification result:", data);

        if (data.success) {
          try {
            // Record the payment in the database
            const { error: dbError } = await supabase
              .from('payment_transactions')
              .insert({
                user_id: user.id,
                transaction_id: paymentId,
                amount: 14,
                currency: 'USD',
                status: 'success',
                payment_data: data
              });
    
            if (dbError) {
              console.error("Error recording payment transaction:", dbError);
              // Continue anyway, as the subscription is already activated
            }
            
            setIsSuccess(true);
            toast({
              title: "Payment Successful",
              description: "Your subscription has been activated. Enjoy unlimited recipes!",
            });
          } catch (dbError) {
            console.error("Database error:", dbError);
            // Even if DB insert fails, the payment was successful
            setIsSuccess(true);
          }
        } else {
          console.error("Payment verification failed:", data.message);
          setIsSuccess(false);
          setError(data.message || "Payment verification failed. Please try again.");
        }
      } catch (error) {
        console.error("Error in payment verification:", error);
        setIsSuccess(false);
        setError("An unexpected error occurred. Please try again or contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [user, location.search, navigate, toast]);

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        {isLoading ? (
          <div className="py-8">
            <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </div>
        ) : isSuccess ? (
          <div className="py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your premium subscription has been activated. You now have unlimited access to our recipe generation service.
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => navigate("/")}
              >
                Start Creating Recipes
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/dashboard")}
              >
                View My Subscription
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              {error || "There was an issue processing your payment. Please try again."}
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => navigate("/#pricing")}
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
