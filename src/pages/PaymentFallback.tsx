
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { PremiumBadge } from "@/components/PremiumIndicator";

export default function PaymentFallback() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // This fallback key would normally be stored as an environment variable
  const FALLBACK_KEY = "payment-fallback-2024";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const paymentId = searchParams.get("ref") || searchParams.get("payment_id");
    const status = searchParams.get("status") || searchParams.get("result");
    
    console.log("Payment fallback received params:", { paymentId, status });
    
    if (!paymentId) {
      setError("No payment reference found in the URL");
      setIsLoading(false);
      return;
    }

    // If status is explicitly successful, attempt auto-verification
    if (status === "success" || status === "Success" || status === "1" || status === "true") {
      console.log("Status indicates success, auto-processing payment");
      handleProcessPayment(paymentId);
    } else {
      // Just verify the parameters but don't process automatically
      setIsLoading(false);
    }
  }, [user, searchParams, navigate]);

  const handleProcessPayment = async (paymentIdOverride?: string) => {
    try {
      setIsProcessing(true);
      
      const paymentId = paymentIdOverride || searchParams.get("ref") || searchParams.get("payment_id");
      
      if (!paymentId || !user) {
        setError("Missing payment information or user not authenticated");
        setIsProcessing(false);
        return;
      }

      console.log(`Processing fallback payment for user: ${user.id} with paymentId: ${paymentId}`);

      // Call the fallback endpoint
      const { data, error } = await supabase.functions.invoke("payment-fallback", {
        body: { 
          paymentId, 
          userId: user.id,
          fallbackKey: FALLBACK_KEY
        },
      });

      if (error) {
        console.error("Error calling payment-fallback function:", error);
        setIsSuccess(false);
        setError("Error verifying payment. Please contact support.");
        setIsProcessing(false);
        return;
      }

      console.log("Fallback processing result:", data);

      if (data.success) {
        setIsSuccess(true);
        toast({
          title: "Payment Successfully Processed",
          description: "Your subscription has been activated. Enjoy unlimited recipes!",
        });
      } else {
        setIsSuccess(false);
        setError(data.message || "Payment verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error in payment verification:", error);
      setIsSuccess(false);
      setError("An unexpected error occurred. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        {isLoading ? (
          <div className="py-8">
            <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checking Payment Details</h2>
            <p className="text-gray-600">Please wait while we verify your payment information...</p>
          </div>
        ) : isProcessing ? (
          <div className="py-8">
            <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">Please wait while we activate your subscription...</p>
          </div>
        ) : isSuccess ? (
          <div className="py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <div className="mb-2 flex justify-center">
              <PremiumBadge className="text-sm" />
            </div>
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
            {error ? (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-amber-600" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error ? "Payment Issue" : "Payment Verification Required"}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {error || "We need to complete the payment process. Click the button below to finalize your subscription."}
            </p>
            
            <div className="space-y-3">
              {!error && (
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleProcessPayment()}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Finalize Subscription"}
                </Button>
              )}
              
              <Button 
                variant={error ? "default" : "outline"} 
                className={`w-full ${error ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                onClick={() => navigate(error ? "/#pricing" : "/")}
              >
                {error ? "Try Again" : "Return to Homepage"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
