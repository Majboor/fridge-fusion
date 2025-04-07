
interface CalorieCalculatorResponse {
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
  weight_change_projection: {
    weekly_change: number;
    monthly_change: number;
    unit: string;
  };
  notes: string;
}

interface MealPlanResponse {
  total_daily_calories: number;
  meals: {
    id: number;
    name: string;
    time: string;
    calories: number;
    description: string;
    foods: string[];
    macros: { protein: number; carbs: number; fat: number };
    image_url?: string;
  }[];
  notes: string;
}

const BASE_URL = "https://mealplan.techrealm.online/api";

export async function calculateCalorieIntake(goal: string): Promise<CalorieCalculatorResponse> {
  const response = await fetch(`${BASE_URL}/calorie-calculator`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ goal }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}

export async function generateMealPlan(
  requirements: string,
  includeImages: boolean = false
): Promise<MealPlanResponse> {
  const response = await fetch(`${BASE_URL}/meal-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requirements, include_images: includeImages }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}
