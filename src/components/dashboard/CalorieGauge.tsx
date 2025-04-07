
import { ProgressRing } from "./ProgressRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalorieGaugeProps {
  calories: number;
  dailyGoal?: number;
}

export function CalorieGauge({ calories, dailyGoal = 2000 }: CalorieGaugeProps) {
  const percentage = Math.min(Math.round((calories / dailyGoal) * 100), 100);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Calories</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ProgressRing 
          progress={percentage}
          size={150}
          strokeWidth={12}
          title={`${calories}`}
          subtitle={`of ${dailyGoal} cal`}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {percentage < 50 ? "Light meal" : percentage < 80 ? "Moderate meal" : "Heavy meal"}
        </p>
      </CardContent>
    </Card>
  );
}
