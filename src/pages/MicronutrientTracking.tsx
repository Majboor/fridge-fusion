
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MacronutrientPieChart } from "@/components/dashboard/MacronutrientPieChart";
import { MicronutrientRadarChart } from "@/components/dashboard/MicronutrientRadarChart";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { CameraOptionsDialog } from "@/components/dashboard/CameraOptionsDialog";
import { supabase } from "@/integrations/supabase/client";

interface NutrientData {
  day: string;
  averageData: {
    micronutrients: {
      vitamin_a: { value: number; unit: string; percentage: number };
      vitamin_c: { value: number; unit: string; percentage: number };
      calcium: { value: number; unit: string; percentage: number };
      iron: { value: number; unit: string; percentage: number };
      potassium: { value: number; unit: string; percentage: number };
      sodium: { value: number; unit: string; percentage: number };
    };
    macronutrients: {
      protein: { value: number; unit: string; percentage: number };
      carbs: { value: number; unit: string; percentage: number };
      fat: { value: number; unit: string; percentage: number };
      fiber: { value: number; unit: string; percentage: number };
    };
  };
  meals: Array<{
    id: string;
    timestamp: string;
    micronutrients: {
      vitamin_a: { value: number; unit: string; percentage: number };
      vitamin_c: { value: number; unit: string; percentage: number };
      calcium: { value: number; unit: string; percentage: number };
      iron: { value: number; unit: string; percentage: number };
      potassium: { value: number; unit: string; percentage: number };
      sodium: { value: number; unit: string; percentage: number };
    };
    macronutrients: {
      protein: { value: number; unit: string; percentage: number };
      carbs: { value: number; unit: string; percentage: number };
      fat: { value: number; unit: string; percentage: number };
      fiber: { value: number; unit: string; percentage: number };
    };
  }>;
}

export default function MicronutrientTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [nutrientHistory, setNutrientHistory] = useState<NutrientData[]>([]);
  
  // Force refresh when scanning food
  const handleScanSuccess = useCallback(() => {
    console.log("Scan successful, refreshing nutrient data");
    setRefreshKey(prev => prev + 1);
  }, []);

  // Fetch nutrient data from recipes with steps containing nutrient info
  const fetchNutrientData = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log("Running fetchNutrientData with refreshKey:", refreshKey);
      setLoading(true);
      console.log("Fetching nutrient data...");
      
      // Fetch all recipe data that contains nutrition information
      const { data: recipesData, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      console.log("Fetched", recipesData?.length || 0, "recipes for nutrient data");
      
      if (!recipesData || recipesData.length === 0) {
        setNutrientHistory([]);
        setLoading(false);
        return;
      }
      
      // Process recipe data to extract nutrient information
      const dailyData = new Map<string, NutrientData>();
      console.log("Processing recipes:", recipesData.length);
      
      // Process each recipe to extract nutrient information
      recipesData.forEach(recipe => {
        // Check if recipe has steps that contain nutrient data
        if (!recipe.steps || recipe.steps.length === 0) return;
        
        console.log("Processing recipe", recipe.id, "with", recipe.steps.length, "steps");
        
        // Initialize nutrient data objects
        const micronutrients: any = {
          vitamin_a: { value: 0, unit: 'mcg', percentage: 0 },
          vitamin_c: { value: 0, unit: 'mg', percentage: 0 },
          calcium: { value: 0, unit: 'mg', percentage: 0 },
          iron: { value: 0, unit: 'mg', percentage: 0 },
          potassium: { value: 0, unit: 'mg', percentage: 0 },
          sodium: { value: 0, unit: 'mg', percentage: 0 }
        };
        
        const macronutrients: any = {
          protein: { value: 0, unit: 'g', percentage: 0 },
          carbs: { value: 0, unit: 'g', percentage: 0 },
          fat: { value: 0, unit: 'g', percentage: 0 },
          fiber: { value: 0, unit: 'g', percentage: 0 }
        };
        
        // Extract nutrient information from recipe steps
        recipe.steps.forEach(step => {
          // Extract Vitamin A
          const vitaminAMatch = step.match(/Vitamin A: (\d+)mcg \((\d+)%\)/i);
          if (vitaminAMatch) {
            micronutrients.vitamin_a = {
              value: parseInt(vitaminAMatch[1]),
              unit: 'mcg',
              percentage: parseInt(vitaminAMatch[2])
            };
          }
          
          // Extract Vitamin C
          const vitaminCMatch = step.match(/Vitamin C: (\d+)mg \((\d+)%\)/i);
          if (vitaminCMatch) {
            micronutrients.vitamin_c = {
              value: parseInt(vitaminCMatch[1]),
              unit: 'mg',
              percentage: parseInt(vitaminCMatch[2])
            };
          }
          
          // Extract Calcium
          const calciumMatch = step.match(/Calcium: (\d+)mg \((\d+)%\)/i);
          if (calciumMatch) {
            micronutrients.calcium = {
              value: parseInt(calciumMatch[1]),
              unit: 'mg',
              percentage: parseInt(calciumMatch[2])
            };
          }
          
          // Extract Iron
          const ironMatch = step.match(/Iron: (\d+)mg \((\d+)%\)/i);
          if (ironMatch) {
            micronutrients.iron = {
              value: parseInt(ironMatch[1]),
              unit: 'mg',
              percentage: parseInt(ironMatch[2])
            };
          }
          
          // Extract Potassium
          const potassiumMatch = step.match(/Potassium: (\d+)mg \((\d+)%\)/i);
          if (potassiumMatch) {
            micronutrients.potassium = {
              value: parseInt(potassiumMatch[1]),
              unit: 'mg',
              percentage: parseInt(potassiumMatch[2])
            };
          }
          
          // Extract Sodium
          const sodiumMatch = step.match(/Sodium: (\d+)mg \((\d+)%\)/i);
          if (sodiumMatch) {
            micronutrients.sodium = {
              value: parseInt(sodiumMatch[1]),
              unit: 'mg',
              percentage: parseInt(sodiumMatch[2])
            };
          }
          
          // Extract Protein
          const proteinMatch = step.match(/Protein: (\d+)g \((\d+)%\)/i);
          if (proteinMatch) {
            macronutrients.protein = {
              value: parseInt(proteinMatch[1]),
              unit: 'g',
              percentage: parseInt(proteinMatch[2])
            };
          }
          
          // Extract Carbs
          const carbsMatch = step.match(/Carbs: (\d+)g \((\d+)%\)/i);
          if (carbsMatch) {
            macronutrients.carbs = {
              value: parseInt(carbsMatch[1]),
              unit: 'g',
              percentage: parseInt(carbsMatch[2])
            };
          }
          
          // Extract Fat
          const fatMatch = step.match(/Fat: (\d+)g \((\d+)%\)/i);
          if (fatMatch) {
            macronutrients.fat = {
              value: parseInt(fatMatch[1]),
              unit: 'g',
              percentage: parseInt(fatMatch[2])
            };
          }
          
          // Extract Fiber
          const fiberMatch = step.match(/Fiber: (\d+)g \((\d+)%\)/i);
          if (fiberMatch) {
            macronutrients.fiber = {
              value: parseInt(fiberMatch[1]),
              unit: 'g',
              percentage: parseInt(fiberMatch[2])
            };
          }
        });
        
        // Check if we extracted any nutrient data
        const hasNutrientData = 
          micronutrients.vitamin_a.value > 0 || 
          micronutrients.vitamin_c.value > 0 ||
          micronutrients.calcium.value > 0 ||
          micronutrients.iron.value > 0 ||
          micronutrients.potassium.value > 0 ||
          micronutrients.sodium.value > 0 ||
          macronutrients.protein.value > 0 ||
          macronutrients.carbs.value > 0 ||
          macronutrients.fat.value > 0 ||
          macronutrients.fiber.value > 0;
        
        if (!hasNutrientData) return;
        
        // Group by date
        const date = new Date(recipe.created_at);
        const dayKey = format(date, 'yyyy-MM-dd');
        
        if (!dailyData.has(dayKey)) {
          dailyData.set(dayKey, {
            day: format(date, 'MMM d'),
            averageData: {
              micronutrients: { ...micronutrients },
              macronutrients: { ...macronutrients }
            },
            meals: []
          });
        }
        
        // Add this meal to the day's data
        dailyData.get(dayKey)?.meals.push({
          id: recipe.id,
          timestamp: format(date, 'h:mm a'),
          micronutrients: { ...micronutrients },
          macronutrients: { ...macronutrients }
        });
      });
      
      console.log("Daily data map size:", dailyData.size);
      
      // Process the daily data to calculate averages
      const nutrientHistoryData: NutrientData[] = [];
      dailyData.forEach(dayData => {
        // For average data calculation, we'll use the most recent meal's data for now
        // In a real app, you might want to aggregate all meals for the day
        if (dayData.meals.length > 0) {
          nutrientHistoryData.push({
            day: dayData.day,
            averageData: {
              micronutrients: { ...dayData.meals[0].micronutrients },
              macronutrients: { ...dayData.meals[0].macronutrients }
            },
            meals: dayData.meals
          });
        }
      });
      
      console.log("Processed microhistory entries:", nutrientHistoryData.length);
      
      // Sort by date (newest first)
      nutrientHistoryData.sort((a, b) => {
        // Assuming day format is "MMM d"
        const dateA = new Date(`${a.day} 2025`);
        const dateB = new Date(`${b.day} 2025`);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Update state with the processed data
      setNutrientHistory(nutrientHistoryData);
      
      // If we have data, log the first entry to verify
      if (nutrientHistoryData.length > 0) {
        console.log("Setting averages:", 
          nutrientHistoryData[0].averageData.micronutrients,
          nutrientHistoryData[0].averageData.macronutrients
        );
      }
      
      console.log("Fetch completed successfully");
    } catch (error) {
      console.error("Error fetching nutrient data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);
  
  // Initialize Supabase realtime subscription for recipes updates
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchNutrientData();
    
    // Set up real-time subscription for recipes table
    const channel = supabase
      .channel('recipes_changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'recipes'
        },
        (payload) => {
          console.log("Recipe table changed, refreshing nutrient data:", payload);
          fetchNutrientData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, fetchNutrientData]);

  const renderNoDataMessage = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <p className="text-muted-foreground text-center mb-4">
        No nutrient data available yet. Scan your food to start tracking!
      </p>
      <Button onClick={() => setCameraDialogOpen(true)} className="flex items-center gap-2">
        <Camera className="h-4 w-4" /> Scan Food
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Micronutrient Tracking" />
      
      <div className="container px-4 py-6 max-w-6xl">
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="history">Tracking History</TabsTrigger>
            <TabsTrigger value="micro">Micronutrient History</TabsTrigger>
            <TabsTrigger value="macro">Macronutrient History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Nutrition History</h2>
              <Button onClick={() => setCameraDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Scan Food
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : nutrientHistory.length > 0 ? (
              <div className="space-y-6">
                {nutrientHistory.map((day, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg">{day.day}</CardTitle>
                      <CardDescription>
                        {day.meals.length} {day.meals.length === 1 ? 'meal' : 'meals'} tracked
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-3">Macronutrients Summary</h4>
                          <MacronutrientPieChart data={day.averageData.macronutrients} />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-3">Micronutrients Summary</h4>
                          <MicronutrientRadarChart 
                            data={day.averageData.micronutrients}
                            showScanButton={false}
                          />
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-3 mt-6">Individual Meals</h4>
                      <div className="space-y-4">
                        {day.meals.map((meal, mealIndex) => (
                          <Card key={mealIndex} className="border border-border/50">
                            <CardHeader className="py-3">
                              <CardTitle className="text-base">Meal at {meal.timestamp}</CardTitle>
                            </CardHeader>
                            <CardContent className="py-3">
                              <div className="grid md:grid-cols-2 gap-4">
                                <MicronutrientRadarChart 
                                  data={meal.micronutrients}
                                  showScanButton={false}
                                  clickable={true}
                                />
                                <MacronutrientPieChart data={meal.macronutrients} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : renderNoDataMessage()}
          </TabsContent>
          
          <TabsContent value="micro">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Micronutrient History</h2>
              <Button onClick={() => setCameraDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Scan Food
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : nutrientHistory.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {nutrientHistory.map((day, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{day.day}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MicronutrientRadarChart 
                        data={day.averageData.micronutrients}
                        showScanButton={false}
                        clickable={true}
                        scanDate={day.day}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : renderNoDataMessage()}
          </TabsContent>
          
          <TabsContent value="macro">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Macronutrient History</h2>
              <Button onClick={() => setCameraDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Scan Food
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : nutrientHistory.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {nutrientHistory.map((day, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{day.day}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MacronutrientPieChart data={day.averageData.macronutrients} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : renderNoDataMessage()}
          </TabsContent>
        </Tabs>
      </div>
      
      <CameraOptionsDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        featureType="calorie"
        onSuccess={handleScanSuccess}
      />
      
      <NavigationBar />
    </div>
  );
}
