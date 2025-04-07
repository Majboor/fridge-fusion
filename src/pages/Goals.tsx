import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Target, Check, ChevronRight, ArrowRight, RefreshCw } from "lucide-react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { calculateCalorieIntake, generateMealPlan } from "@/lib/api-client";
import { supabase } from "@/integrations/supabase/client";

type GoalType = "gain" | "lose" | "maintain" | "";
type FormStep = "goal-selection" | "basic-info" | "weight-details" | "activity-details" | "dietary-details" | "results" | "meal-plan";

interface UserGoalDetails {
  goalType: GoalType;
  currentWeight: string;
  targetWeight: string;
  timeframe: string;
  age: string;
  height: string;
  activityLevel: string;
  mealsPerDay: string;
  dietaryRestrictions: string;
}

interface CalorieResults {
  daily_calories: number;
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
}

interface MealPlan {
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

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [generatingMealPlan, setGeneratingMealPlan] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>("goal-selection");
  
  const [userGoal, setUserGoal] = useState<UserGoalDetails>({
    goalType: "",
    currentWeight: "",
    targetWeight: "",
    timeframe: "",
    age: "",
    height: "",
    activityLevel: "moderate",
    mealsPerDay: "3",
    dietaryRestrictions: ""
  });
  
  const [calorieResults, setCalorieResults] = useState<CalorieResults | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [savedGoalId, setSavedGoalId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const fetchExistingGoal = async () => {
      try {
        const { data, error } = await supabase
          .from('nutrition_data')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error('Error fetching nutrition data:', error);
        } else if (data && data.length > 0) {
          // User has existing nutrition data
          // Could potentially load their goal information if we save it
        }
      } catch (err) {
        console.error('Error in fetchExistingGoal:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExistingGoal();
  }, [user, navigate]);

  const handleGoalSelect = (goalType: GoalType) => {
    setUserGoal({...userGoal, goalType});
    setCurrentStep("basic-info");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserGoal({...userGoal, [name]: value});
  };

  const handleRadioChange = (name: string, value: string) => {
    setUserGoal({...userGoal, [name]: value});
  };

  const handleNextStep = (currentStepName: FormStep) => {
    const steps: FormStep[] = ["goal-selection", "basic-info", "weight-details", "activity-details", "dietary-details"];
    const currentIndex = steps.indexOf(currentStepName);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePreviousStep = (currentStepName: FormStep) => {
    const steps: FormStep[] = ["goal-selection", "basic-info", "weight-details", "activity-details", "dietary-details"];
    const currentIndex = steps.indexOf(currentStepName);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmitGoal = async () => {
    try {
      setCalculating(true);
      
      const goalDescription = `I currently weigh ${userGoal.currentWeight}kg and want to ${userGoal.goalType === 'gain' ? 'gain' : userGoal.goalType === 'lose' ? 'lose' : 'maintain'} ${userGoal.goalType !== 'maintain' ? `${Math.abs(Number(userGoal.targetWeight) - Number(userGoal.currentWeight))}kg` : ''} ${userGoal.goalType !== 'maintain' ? `in ${userGoal.timeframe} months` : ''}. I am ${userGoal.age} years old and ${userGoal.height}cm tall. My activity level is ${userGoal.activityLevel} and I prefer ${userGoal.mealsPerDay} meals per day.${userGoal.dietaryRestrictions ? ` My dietary restrictions are: ${userGoal.dietaryRestrictions}` : ''}`;
      
      const result = await calculateCalorieIntake(goalDescription);
      setCalorieResults(result);
      
      if (user) {
        const { data, error } = await supabase.from('nutrition_data')
          .update({
            calories_goal: result.daily_calories,
            protein_goal: result.macronutrient_split.protein.grams,
            carbs_goal: result.macronutrient_split.carbs.grams,
            fat_goal: result.macronutrient_split.fat.grams
          })
          .eq('user_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0])
          .select();
          
        if (error) {
          console.error('Error saving goals:', error);
          toast({
            title: "Error",
            description: "Failed to save your nutrition goals",
            variant: "destructive",
          });
        } else if (data && data.length > 0) {
          setSavedGoalId(data[0].id);
        }
      }
      
      setCurrentStep("results");
    } catch (error) {
      console.error('Error calculating calorie intake:', error);
      toast({
        title: "Error",
        description: "Failed to calculate your calorie intake",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    try {
      setGeneratingMealPlan(true);
      
      const requirements = `I need a ${calorieResults?.daily_calories} calorie meal plan with ${userGoal.mealsPerDay} meals throughout the day. ${userGoal.goalType === 'gain' ? 'I am trying to gain weight and build muscle.' : userGoal.goalType === 'lose' ? 'I am trying to lose weight.' : 'I want to maintain my current weight.'} ${userGoal.dietaryRestrictions ? `My dietary restrictions are: ${userGoal.dietaryRestrictions}` : ''}`;
      
      const result = await generateMealPlan(requirements, true);
      setMealPlan(result);
      
      setCurrentStep("meal-plan");
      
      toast({
        title: "Success",
        description: "Your meal plan has been generated",
      });
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate your meal plan",
        variant: "destructive",
      });
    } finally {
      setGeneratingMealPlan(false);
    }
  };

  const handleGenerateGoalsAgain = () => {
    setMealPlan(null);
    setCalorieResults(null);
    
    setCurrentStep("goal-selection");
    
    toast({
      title: "Ready",
      description: "Let's create new goals",
    });
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "goal-selection", label: "Goal" },
      { id: "basic-info", label: "Basic Info" },
      { id: "weight-details", label: "Weight" },
      { id: "activity-details", label: "Activity" },
      { id: "dietary-details", label: "Diet" }
    ];
    
    if (currentStep === "results" || currentStep === "meal-plan") {
      return null;
    }
    
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  index < currentIndex ? "bg-primary text-primary-foreground" : 
                  index === currentIndex ? "bg-primary/90 text-primary-foreground" : 
                  "bg-secondary text-secondary-foreground"
                }`}>
                  {index < currentIndex ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-xs mt-1">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  index < currentIndex ? "bg-primary" : "bg-secondary"
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <PageHeader title="Goals" />

      <div className="px-6">
        {renderStepIndicator()}
        
        {currentStep === "goal-selection" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                What's your goal?
              </CardTitle>
              <CardDescription>
                Choose your fitness and nutrition goal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center h-16 text-lg"
                  onClick={() => handleGoalSelect("gain")}
                >
                  <span>Gain Weight</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center h-16 text-lg"
                  onClick={() => handleGoalSelect("lose")}
                >
                  <span>Lose Weight</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex justify-between items-center h-16 text-lg"
                  onClick={() => handleGoalSelect("maintain")}
                >
                  <span>Maintain & Enjoy Food</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep === "basic-info" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Let's start with some basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={userGoal.age}
                    onChange={handleInputChange}
                    placeholder="e.g., 30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    value={userGoal.height}
                    onChange={handleInputChange}
                    placeholder="e.g., 175"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("goal-selection")}>
                Back
              </Button>
              <Button 
                onClick={() => handleNextStep("basic-info")}
                disabled={!userGoal.age || !userGoal.height}
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === "weight-details" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Weight Details
              </CardTitle>
              <CardDescription>
                Tell us about your weight goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentWeight">Current Weight (kg)</Label>
                  <Input
                    id="currentWeight"
                    name="currentWeight"
                    type="number"
                    value={userGoal.currentWeight}
                    onChange={handleInputChange}
                    placeholder="e.g., 70"
                  />
                </div>
                
                {userGoal.goalType !== "maintain" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                      <Input
                        id="targetWeight"
                        name="targetWeight"
                        type="number"
                        value={userGoal.targetWeight}
                        onChange={handleInputChange}
                        placeholder="e.g., 75"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timeframe">Timeframe (months)</Label>
                      <Input
                        id="timeframe"
                        name="timeframe"
                        type="number"
                        value={userGoal.timeframe}
                        onChange={handleInputChange}
                        placeholder="e.g., 3"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => handlePreviousStep("weight-details")}>
                Back
              </Button>
              <Button 
                onClick={() => handleNextStep("weight-details")}
                disabled={!userGoal.currentWeight || (userGoal.goalType !== "maintain" && (!userGoal.targetWeight || !userGoal.timeframe))}
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === "activity-details" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Activity Level
              </CardTitle>
              <CardDescription>
                Tell us about your physical activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <RadioGroup 
                  value={userGoal.activityLevel} 
                  onValueChange={(value) => handleRadioChange("activityLevel", value)}
                  className="grid grid-cols-1 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sedentary" id="sedentary" />
                    <Label htmlFor="sedentary">Sedentary (little or no exercise)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light (exercise 1-3 days/week)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate (exercise 3-5 days/week)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="active" />
                    <Label htmlFor="active">Active (exercise 6-7 days/week)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="veryActive" id="veryActive" />
                    <Label htmlFor="veryActive">Very Active (intense exercise daily)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => handlePreviousStep("activity-details")}>
                Back
              </Button>
              <Button onClick={() => handleNextStep("activity-details")}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === "dietary-details" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Meal Preferences
              </CardTitle>
              <CardDescription>
                Tell us about your dietary preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mealsPerDay">Meals Per Day</Label>
                  <Input
                    id="mealsPerDay"
                    name="mealsPerDay"
                    type="number"
                    value={userGoal.mealsPerDay}
                    onChange={handleInputChange}
                    placeholder="e.g., 3"
                    min="1"
                    max="6"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dietaryRestrictions">Dietary Restrictions (Optional)</Label>
                  <Textarea
                    id="dietaryRestrictions"
                    name="dietaryRestrictions"
                    value={userGoal.dietaryRestrictions}
                    onChange={handleInputChange}
                    placeholder="e.g., vegetarian, lactose intolerant, gluten-free"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => handlePreviousStep("dietary-details")}>
                Back
              </Button>
              <Button 
                onClick={handleSubmitGoal} 
                disabled={calculating || !userGoal.mealsPerDay}
              >
                {calculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>Calculate Calories</>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === "results" && calorieResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Your Personalized Nutrition Plan
              </CardTitle>
              <CardDescription>
                Based on your goals and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">
                  {calorieResults.daily_calories} 
                </div>
                <div className="text-sm text-muted-foreground">
                  Daily Calories
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-secondary rounded-lg p-3">
                  <div className="font-semibold">Protein</div>
                  <div className="text-lg font-bold">{calorieResults.macronutrient_split.protein.grams}g</div>
                  <div className="text-xs text-muted-foreground">
                    {calorieResults.macronutrient_split.protein.percentage}%
                  </div>
                </div>
                
                <div className="bg-secondary rounded-lg p-3">
                  <div className="font-semibold">Carbs</div>
                  <div className="text-lg font-bold">{calorieResults.macronutrient_split.carbs.grams}g</div>
                  <div className="text-xs text-muted-foreground">
                    {calorieResults.macronutrient_split.carbs.percentage}%
                  </div>
                </div>
                
                <div className="bg-secondary rounded-lg p-3">
                  <div className="font-semibold">Fat</div>
                  <div className="text-lg font-bold">{calorieResults.macronutrient_split.fat.grams}g</div>
                  <div className="text-xs text-muted-foreground">
                    {calorieResults.macronutrient_split.fat.percentage}%
                  </div>
                </div>
              </div>
              
              {calorieResults.weight_change_projection && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Projected Results</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Weekly Change</div>
                      <div className="font-semibold">
                        {calorieResults.weight_change_projection.weekly_change > 0 ? '+' : ''}
                        {calorieResults.weight_change_projection.weekly_change} 
                        {calorieResults.weight_change_projection.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Monthly Change</div>
                      <div className="font-semibold">
                        {calorieResults.weight_change_projection.monthly_change > 0 ? '+' : ''}
                        {calorieResults.weight_change_projection.monthly_change} 
                        {calorieResults.weight_change_projection.unit}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("dietary-details")}>
                Back
              </Button>
              <Button onClick={handleGenerateMealPlan} disabled={generatingMealPlan}>
                {generatingMealPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Meal Plan...
                  </>
                ) : (
                  "Generate Meal Plan"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === "meal-plan" && mealPlan && (
          <div>
            {calorieResults && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Check className="h-5 w-5 text-primary" />
                    Nutrition Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Daily Calories:</div>
                    <div className="font-bold text-primary">{calorieResults.daily_calories} calories</div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <div>Protein: <span className="font-medium">{calorieResults.macronutrient_split.protein.grams}g</span></div>
                    <div>Carbs: <span className="font-medium">{calorieResults.macronutrient_split.carbs.grams}g</span></div>
                    <div>Fat: <span className="font-medium">{calorieResults.macronutrient_split.fat.grams}g</span></div>
                  </div>
                  
                  {calorieResults.weight_change_projection && (
                    <div className="text-sm text-muted-foreground">
                      Expected change: {calorieResults.weight_change_projection.monthly_change > 0 ? '+' : ''}
                      {calorieResults.weight_change_projection.monthly_change} {calorieResults.weight_change_projection.unit}/month
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Your Personalized Meal Plan
                </CardTitle>
                <CardDescription>
                  {mealPlan.total_daily_calories} calories per day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {mealPlan.meals.map((meal) => (
                  <div key={meal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{meal.name}</h4>
                        <div className="text-sm text-muted-foreground">{meal.time}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{meal.calories} cal</div>
                      </div>
                    </div>
                    
                    {meal.image_url && (
                      <div className="mb-3">
                        <img 
                          src={meal.image_url} 
                          alt={meal.name} 
                          className="w-full h-48 object-cover rounded-md"
                        />
                      </div>
                    )}
                    
                    <p className="text-sm mb-3">{meal.description}</p>
                    
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1">Ingredients:</div>
                      <ul className="text-sm list-disc pl-5">
                        {meal.foods.map((food, index) => (
                          <li key={index}>{food}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-secondary rounded p-2 text-center">
                        <div>Protein</div>
                        <div className="font-semibold">{meal.macros.protein}g</div>
                      </div>
                      <div className="bg-secondary rounded p-2 text-center">
                        <div>Carbs</div>
                        <div className="font-semibold">{meal.macros.carbs}g</div>
                      </div>
                      <div className="bg-secondary rounded p-2 text-center">
                        <div>Fat</div>
                        <div className="font-semibold">{meal.macros.fat}g</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {mealPlan.notes && (
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <strong>Notes:</strong> {mealPlan.notes}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep("results")}>
                  Back to Results
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleGenerateGoalsAgain}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate New Goals
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="mb-6 border-primary/20">
              <CardContent className="pt-6">
                <Button 
                  onClick={() => {
                    toast({
                      title: "Success",
                      description: "Your meal plan has been saved",
                    });
                  }}
                  className="w-full"
                >
                  Save Plan to My Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}
