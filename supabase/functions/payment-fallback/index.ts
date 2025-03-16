
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

const EXPECTED_FALLBACK_KEY = Deno.env.get("PAYMENT_FALLBACK_KEY") || "payment-fallback-2024";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, userId, fallbackKey } = await req.json();
    
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

    // Verify fallback key (simple security measure)
    if (fallbackKey !== EXPECTED_FALLBACK_KEY) {
      console.error("Invalid fallback key provided");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Unauthorized access" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 401 
      });
    }

    console.log(`Processing fallback payment for userId: ${userId} with paymentId: ${paymentId}`);
    
    // Check if we've already processed this payment
    const { data: existingTransaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', paymentId)
      .maybeSingle();
    
    if (existingTransaction) {
      console.log(`Payment ${paymentId} has already been processed`);
      
      // Check if user has active subscription
      const { data: subscriptionCheck } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (subscriptionCheck) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Subscription is already active",
          alreadyProcessed: true,
          expiresAt: subscriptionCheck.expires_at
        }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        });
      }
    }
    
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
          is_active: true,
          status: 'active'
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
    
    // Record the payment transaction if not already processed
    if (!existingTransaction) {
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          transaction_id: paymentId,
          amount: 14,
          currency: 'USD',
          status: 'success',
          payment_reference: paymentId,
          payment_data: { method: 'fallback', processedAt: now.toISOString() }
        });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subscription activated successfully via fallback",
      expiresAt: expiresAt.toISOString()
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    });
  } catch (error) {
    console.error("Error processing payment fallback:", error);
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
