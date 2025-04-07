
import { Progress } from "@/components/ui/progress";

interface NutrientProgressProps {
  consumed: number;
  goal: number;
  label: string;
  color?: string;
}

export function NutrientProgress({ consumed, goal, label, color = "bg-primary" }: NutrientProgressProps) {
  const percentage = Math.min(Math.round((consumed / goal) * 100), 100);
  
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{consumed}g of {goal}g</span>
      </div>
      <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color} rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
