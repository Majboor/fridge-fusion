
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Award, Utensils, Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  // These would typically come from the database
  const achievements: AchievementBadge[] = [
    {
      id: "first-recipe",
      name: "Recipe Creator",
      description: "Created your first recipe",
      icon: <Utensils className="h-5 w-5" />,
      earned: true,
      date: "2023-04-01"
    },
    {
      id: "five-recipes",
      name: "Recipe Enthusiast",
      description: "Created 5 recipes",
      icon: <Award className="h-5 w-5" />,
      earned: true,
      date: "2023-04-05"
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

  return (
    <Card className={className}>
      <CardContent className="pt-6">
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
