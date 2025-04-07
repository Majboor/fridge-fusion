import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  PieChart, 
  Pill, 
  Utensils, 
  CalendarCheck, 
  Plus, 
  Loader2,
  UtensilsCrossed,
  Dna,
  Calculator
} from "lucide-react";

import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NutrientProgress } from "@/components/dashboard/NutrientProgress";
import { MacroChart } from "@/components/dashboard/MacroChart";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { NutritionDialog } from "@/components/dashboard/NutritionDialog";
import { FeatureSelectionDialog } from "@/components/dashboard/FeatureSelectionDialog";
import { useNotifications } from "@/contexts/NotificationsContext";
import { CalorieGauge } from "@/components/dashboard/CalorieGauge";

interface NutritionData {
  id: string;
  user_id: string;
  date: string;
  calories_consumed: number;
  calories_goal: number;
  carbs_consumed: number;
  carbs_goal: number;
  protein_consumed: number;
  protein_goal: number;
  fat_consumed: number;
  fat_goal: number;
  weekly_progress: number;
  created_at: string;
  updated_at: string;
}

interface NutritionResponseData {
  calorie_count: number;
  macronutrients: {
    protein: { value: number; unit: string; percentage: number };
    carbs: { value: number; unit: string; percentage: number };
    fat: { value: number; unit: string; percentage: number };
    fiber: { value: number; unit: string; percentage: number };
  };
  micronutrients: {
    vitamin_a: { value: number; unit: string; percentage: number };
    vitamin_c: { value: number; unit: string; percentage: number };
    calcium: { value: number; unit: string; percentage: number };
    iron: { value: number; unit: string; percentage: number };
    potassium: { value: number; unit: string; percentage: number };
    sodium: { value: number; unit: string; percentage: number };
  };
  food_items: string[];
  item_breakdown: {
    name: string;
    calories: number;
    percentage: number;
  }[];
  serving_size: string;
}

interface MicronutrientData {
  vitamin_c: number;
  iron: number;
  calcium: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [nutritionAnalysis, setNutritionAnalysis] = useState<NutritionResponseData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [micronutrientData, setMicronutrientData] = useState<MicronutrientData>({
    vitamin_c: 0,
    iron: 0,
    calcium: 0
  });
  const { fetchNotifications } = useNotifications();

  const fetchNutritionData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_or_create_todays_nutrition_data', {
        user_uuid: user.id
      });
      
      if (error) {
        console.error('Error fetching nutrition data:', error);
        toast({
          title: "Error",
          description: "Failed to load your nutrition data",
          variant: "destructive",
        });
      } else if (data && data.length > 0) {
        setNutritionData(data[0] as NutritionData);
      }
    } catch (error) {
      console.error('Error in fetchNutritionData:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMicronutrientData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('steps')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching micronutrient data:', error);
        return;
      }
      
      let vitaminC = 0;
      let iron = 0;
      let calcium = 0;
      let foundMicronutrients = false;
      
      if (data && data.length > 0) {
        for (const recipe of data) {
          if (recipe.steps && Array.isArray(recipe.steps)) {
            for (const step of recipe.steps) {
              const vitaminCMatch = step.match(/Vitamin C:?\s*\d+\.?\d*\s*mg\s*\((\d+)%\)/i);
              if (vitaminCMatch && !vitaminC) {
                vitaminC = parseInt(vitaminCMatch[1]);
                foundMicronutrients = true;
              }
              
              const ironMatch = step.match(/Iron:?\s*\d+\.?\d*\s*mg\s*\((\d+)%\)/i);
              if (ironMatch && !iron) {
                iron = parseInt(ironMatch[1]);
                foundMicronutrients = true;
              }
              
              const calciumMatch = step.match(/Calcium:?\s*\d+\.?\d*\s*mg\s*\((\d+)%\)/i);
              if (calciumMatch && !calcium) {
                calcium = parseInt(calciumMatch[1]);
                foundMicronutrients = true;
              }
            }
          }
          
          if (vitaminC && iron && calcium) {
            break;
          }
        }
      }
      
      if (foundMicronutrients) {
        setMicronutrientData({
          vitamin_c: vitaminC,
          iron: iron,
          calcium: calcium
        });
      }
    } catch (error) {
      console.error('Error in fetchMicronutrientData:', error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchNutritionData();
    fetchMicronutrientData();
    
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleAddMeal = () => {
    const mockNutritionData: NutritionResponseData = {
      calorie_count: 450,
      macronutrients: {
        protein: { value: 25, unit: "g", percentage: 35 },
        carbs: { value: 40, unit: "g", percentage: 25 },
        fat: { value: 15, unit: "g", percentage: 30 },
        fiber: { value: 8, unit: "g", percentage: 10 },
      },
      micronutrients: {
        vitamin_a: { value: 400, unit: "mcg", percentage: 45 },
        vitamin_c: { value: 50, unit: "mg", percentage: 55 },
        calcium: { value: 150, unit: "mg", percentage: 12 },
        iron: { value: 2, unit: "mg", percentage: 10 },
        potassium: { value: 800, unit: "mg", percentage: 20 },
        sodium: { value: 500, unit: "mg", percentage: 22 },
      },
      food_items: ["Grilled Chicken", "Brown Rice", "Steamed Broccoli"],
      item_breakdown: [
        { name: "Grilled Chicken", calories: 250, percentage: 55 },
        { name: "Brown Rice", calories: 150, percentage: 33 },
        { name: "Steamed Broccoli", calories: 50, percentage: 12 },
      ],
      serving_size: "1 serving (approx. 250g)"
    };
    
    setNutritionAnalysis(mockNutritionData);
    setIsDialogOpen(true);
  };

  const handleOpenCalorieCounter = () => {
    setFeatureDialogOpen(true);
  };

  const handleViewMealPlan = () => {
    navigate("/goals", { state: { view: "saved" } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const dailyData = {
    calories: { 
      consumed: nutritionData?.calories_consumed || 0, 
      goal: nutritionData?.calories_goal || 2000 
    },
    carbs: { 
      consumed: nutritionData?.carbs_consumed || 0, 
      goal: nutritionData?.carbs_goal || 250 
    },
    protein: { 
      consumed: nutritionData?.protein_consumed || 0, 
      goal: nutritionData?.protein_goal || 150 
    },
    fat: { 
      consumed: nutritionData?.fat_consumed || 0, 
      goal: nutritionData?.fat_goal || 65 
    },
    weeklyProgress: nutritionData?.weekly_progress || 0,
  };

  const firstName = user?.email?.split('@')[0] || 'User';
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="bg-background pb-20">
      <PageHeader title={`Welcome back, ${capitalizedName}!`} />

      <div className="px-6">
        <h2 className="text-2xl font-semibold mb-3">Daily Summary</h2>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-3xl font-bold">{dailyData.calories.consumed}</h3>
            <p className="text-sm text-muted-foreground">of {dailyData.calories.goal} calories</p>
            
            <div className="mt-4 space-y-3">
              <NutrientProgress 
                consumed={dailyData.carbs.consumed} 
                goal={dailyData.carbs.goal} 
                label="Carbs" 
                color="bg-yellow-400"
              />
              <NutrientProgress 
                consumed={dailyData.protein.consumed} 
                goal={dailyData.protein.goal} 
                label="Protein" 
                color="bg-green-500"
              />
              <NutrientProgress 
                consumed={dailyData.fat.consumed} 
                goal={dailyData.fat.goal} 
                label="Fat" 
                color="bg-blue-400"
              />
            </div>
          </div>
          
          <div className="ml-4">
            <MacroChart 
              protein={dailyData.protein.consumed}
              carbs={dailyData.carbs.consumed}
              fat={dailyData.fat.consumed}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Micronutrient Highlights</h3>
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-secondary border-0">
              <CardContent className="p-2 text-center">
                <span className="text-xs">Vitamin C</span>
                <p className="text-sm font-bold text-green-600">
                  {micronutrientData.vitamin_c}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-secondary border-0">
              <CardContent className="p-2 text-center">
                <span className="text-xs">Iron</span>
                <p className="text-sm font-bold text-amber-600">
                  {micronutrientData.iron}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-secondary border-0">
              <CardContent className="p-2 text-center">
                <span className="text-xs">Calcium</span>
                <p className="text-sm font-bold text-red-600">
                  {micronutrientData.calcium}%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="px-6 mb-8">
        <Button 
          className="w-full py-6 text-lg flex items-center justify-center gap-2" 
          onClick={() => setFeatureDialogOpen(true)}
        >
          <Plus className="h-5 w-5" /> Try AI
        </Button>
      </div>

      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard 
            title="Calorie Counter" 
            icon={Calculator} 
            onClick={handleOpenCalorieCounter}
          />
          <FeatureCard 
            title="Daily Meal Suggestions" 
            icon={UtensilsCrossed} 
            route="/goals"
            routeState={{ view: "saved" }}
          />
          <FeatureCard 
            title="Micronutrient Tracking" 
            icon={Dna} 
            route="/micronutrient-tracking"
            activeTab="micro"
          />
          <FeatureCard 
            title="Macronutrient Balance" 
            icon={PieChart} 
            route="/micronutrient-tracking"
            activeTab="macro"
          />
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <ProgressRing 
              progress={dailyData.weeklyProgress} 
              title={`${dailyData.weeklyProgress}%`}
              subtitle="Weekly Progress" 
            />
            <p className="text-sm text-muted-foreground mt-2">Based on your goals</p>
          </div>
          
          <div>
            <NotificationCard message="Welcome to nutrition tracking! Add your first meal to get started." />
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={handleViewMealPlan}
              >
                <CalendarCheck className="h-4 w-4" />
                View Meal Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <NutritionDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        nutritionData={nutritionAnalysis}
        onMealLogged={fetchNutritionData} 
      />

      <FeatureSelectionDialog 
        open={featureDialogOpen}
        onOpenChange={setFeatureDialogOpen}
      />

      <NavigationBar />
    </div>
  );
}
