
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { paymentId, userId } = await req.json();
    
    // Validate required parameters
    if (!paymentId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Missing required parameters" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 400 
      });
    }

    console.log(`Processing payment verification for userId: ${userId} with paymentId: ${paymentId}`);
    
    // For a real implementation, you would make a request to your payment provider API
    // to verify the payment status using the paymentId
    // For example: const paymentVerification = await fetch('https://pay.techrealm.pk/api/verify-payment/' + paymentId)
    
    // For this demo, we'll assume the payment is successful based on the paymentId being provided
    const paymentSuccess = true;
    
    if (paymentSuccess) {
      // Create or update subscription in the database
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription
      
      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (existingSubscription) {
        console.log(`User ${userId} already has an active subscription. Extending it.`);
        // If subscription exists, extend it
        const newExpiresAt = new Date(existingSubscription.expires_at);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            updated_at: now.toISOString(),
            expires_at: newExpiresAt.toISOString(),
            payment_reference: paymentId,
          })
          .eq('id', existingSubscription.id);
        
        if (updateError) {
          console.error("Error updating subscription:", updateError);
          throw new Error("Error extending subscription");
        }
      } else {
        // Create new subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            is_active: true,
            payment_reference: paymentId,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            amount: 14, // $14
            status: 'active'
          });
        
        if (subscriptionError) {
          console.error("Error creating subscription:", subscriptionError);
          throw new Error("Error creating subscription");
        }
      }
      
      // Also update the user_subscriptions record
      const { data: userSubData, error: userSubFetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (userSubFetchError) {
        console.error("Error fetching user subscription:", userSubFetchError);
      }
      
      // Determine if we need to insert or update
      if (userSubData) {
        // Update existing record
        const { error: userSubError } = await supabase
          .from('user_subscriptions')
          .update({
            is_subscribed: true,
            payment_reference: paymentId,
            subscription_start_date: now.toISOString(),
            subscription_end_date: expiresAt.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);
        
        if (userSubError) {
          console.error("Error updating user subscription record:", userSubError);
        }
      } else {
        // Insert new record
        const { error: userSubError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            is_subscribed: true,
            payment_reference: paymentId,
            subscription_start_date: now.toISOString(),
            subscription_end_date: expiresAt.toISOString(),
            updated_at: now.toISOString()
          });
        
        if (userSubError) {
          console.error("Error creating user subscription record:", userSubError);
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Subscription activated successfully",
        expiresAt: expiresAt.toISOString()
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment verification failed" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      });
    }
  } catch (error) {
    console.error("Error processing payment verification:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Server error",
      error: error.message
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500 
    });
  }
});
