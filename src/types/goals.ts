
export interface UserGoal {
  id?: string;
  user_id: string;
  goal_type: "gain" | "lose" | "maintain";
  current_weight: number;
  target_weight?: number;
  timeframe?: number;
  age: number;
  height: number;
  activity_level: string;
  meals_per_day: number;
  dietary_restrictions?: string;
  created_at?: string;
}

export interface CalorieCalculation {
  daily_calories: number;
  weekly_plan: {
    calories_per_day: number;
    total_weekly_calories: number;
  };
  monthly_plan: {
    calories_per_day: number;
    total_monthly_calories: number;
  };
  macronutrient_split: {
    protein: { percentage: number; grams: number };
    carbs: { percentage: number; grams: number };
    fat: { percentage: number; grams: number };
  };
  weight_change_projection?: {
    weekly_change: number;
    monthly_change: number;
    unit: string;
  };
  notes: string;
}

export interface Meal {
  id: number;
  name: string;
  time: string;
  calories: number;
  description: string;
  foods: string[];
  macros: { 
    protein: number; 
    carbs: number; 
    fat: number 
  };
  image_url?: string;
  completed?: boolean;
}

export interface MealPlan {
  id?: string;
  user_id: string;
  goal_id?: string;
  total_daily_calories: number;
  meals: Meal[];
  notes?: string;
  created_at?: string;
  start_date?: string;
  end_date?: string;
}
