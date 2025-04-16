
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Award, Utensils, Trophy, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  date?: string;
}

interface AchievementBadgesProps {
  className?: string;
}

export function AchievementBadges({ className }: AchievementBadgesProps) {
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUserAchievements() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Define all possible achievements
        const allAchievements: AchievementBadge[] = [
          {
            id: "first-recipe",
            name: "Recipe Creator",
            description: "Created your first recipe",
            icon: <Utensils className="h-5 w-5" />,
            earned: false
          },
          {
            id: "five-recipes",
            name: "Recipe Enthusiast",
            description: "Created 5 recipes",
            icon: <Award className="h-5 w-5" />,
            earned: false
          },
          {
            id: "nutrition-master",
            name: "Nutrition Master",
            description: "Tracked nutrition for 7 consecutive days",
            icon: <Trophy className="h-5 w-5" />,
            earned: false
          },
          {
            id: "premium-member",
            name: "Premium Member",
            description: "Subscribed to premium plan",
            icon: <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />,
            earned: false
          }
        ];
        
        // Check for recipes created
        const { data: recipes, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', user.id);
          
        if (recipesError) throw recipesError;
        
        // Update achievement status based on user data
        const updatedAchievements = [...allAchievements];
        
        if (recipes && recipes.length > 0) {
          // First recipe achievement
          const firstRecipe = updatedAchievements.find(a => a.id === "first-recipe");
          if (firstRecipe) {
            firstRecipe.earned = true;
            firstRecipe.date = recipes[0].created_at;
          }
          
          // Five recipes achievement
          if (recipes.length >= 5) {
            const fiveRecipes = updatedAchievements.find(a => a.id === "five-recipes");
            if (fiveRecipes) {
              fiveRecipes.earned = true;
              // Use the creation date of the 5th recipe
              fiveRecipes.date = recipes[4].created_at;
            }
          }
        }
        
        // Check for premium membership
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
          
        if (!subError && subscription) {
          const premiumBadge = updatedAchievements.find(a => a.id === "premium-member");
          if (premiumBadge) {
            premiumBadge.earned = true;
            premiumBadge.date = subscription.created_at;
          }
        }
        
        // Check for nutrition tracking
        // This would require more complex logic looking at consecutive days
        // For now, we'll leave this as unearned
        
        setAchievements(updatedAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        toast({
          title: "Error",
          description: "Failed to load your achievements",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserAchievements();
  }, [user]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((badge) => (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg text-center
                      ${badge.earned 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-muted/50 border border-border opacity-60'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-full mb-2
                      ${badge.earned ? 'bg-primary/20' : 'bg-muted'}
                    `}>
                      {badge.icon}
                    </div>
                    <span className="text-xs font-medium line-clamp-1">{badge.name}</span>
                    {badge.earned && badge.date && (
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {new Date(badge.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{badge.description}</p>
                  {badge.earned 
                    ? <p className="text-xs text-muted-foreground">Earned on {new Date(badge.date || "").toLocaleDateString()}</p>
                    : <p className="text-xs text-muted-foreground">Not yet earned</p>
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
