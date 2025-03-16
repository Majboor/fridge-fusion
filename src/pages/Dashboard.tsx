
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, CheckCircle, AlertCircle, Crown, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, hasActiveSubscription, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generationCount, setGenerationCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Get all user subscriptions for this user
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id);

        if (subError) throw subError;
        
        // Find a subscribed record if it exists
        const activeSubscription = subData?.find(sub => sub.is_subscribed === true);
        
        if (activeSubscription) {
          setSubscription(activeSubscription);
          setGenerationCount(0); // For subscribed users
        } else {
          // Find a record with free_trial_used flag
          const trialUsed = subData?.some(sub => sub.free_trial_used === true);
          setGenerationCount(trialUsed ? 0 : 1);
          
          // Set the latest subscription record
          if (subData && subData.length > 0) {
            // Sort by created_at descending and get the latest
            const latestSub = [...subData].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            setSubscription(latestSub);
          }
        }
        
        // Get subscription details if needed
        if (hasActiveSubscription) {
          const { data: activeSubData, error: activeSubError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!activeSubError && activeSubData) {
            setSubscription(activeSubData);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate, toast, hasActiveSubscription]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            {hasActiveSubscription && (
              <Badge className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1 py-1">
                <Crown className="h-3.5 w-3.5" />
                <span>Premium</span>
              </Badge>
            )}
          </div>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className={hasActiveSubscription ? "border-purple-200 bg-purple-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Subscription Status</CardTitle>
              {hasActiveSubscription && <Star className="h-5 w-5 text-purple-600 fill-purple-600" />}
            </CardHeader>
            <CardContent className="flex items-center space-x-4 pt-6">
              {hasActiveSubscription ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 flex items-center">
                      Premium Subscription
                      <Badge className="ml-2 bg-green-500 hover:bg-green-600">Active</Badge>
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires on: {formatDate(subscription?.expires_at || subscription?.subscription_end_date)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="font-medium text-gray-900">No Active Subscription</p>
                    <p className="text-sm text-gray-500">
                      Upgrade for unlimited recipes
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {!hasActiveSubscription && (
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => navigate("/#pricing")}
                >
                  Upgrade Now
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Recipes Generated:</p>
                  <p className="font-medium text-gray-900">{generationCount}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Plan:</p>
                  <p className="font-medium flex items-center">
                    {hasActiveSubscription ? (
                      <>
                        <span className="text-purple-700">Premium</span>
                        <Crown className="ml-1 h-4 w-4 text-purple-600" />
                      </>
                    ) : (
                      "Free Trial"
                    )}
                  </p>
                </div>
                {!hasActiveSubscription && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700">Free Generations Remaining:</p>
                    <p className="font-medium text-gray-900">
                      {generationCount === 0 ? "0" : "1"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Generate New Recipe
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
