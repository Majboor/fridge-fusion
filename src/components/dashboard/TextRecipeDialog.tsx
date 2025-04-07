
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RecipeFlashCards } from "./RecipeFlashCards";

interface TextRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface WeightGoal {
  type: "lose" | "maintain" | "gain";
  label: string;
}

interface CalorieOption {
  value: number;
  label: string;
}

interface RecipeCard {
  card: number;
  content: string;
}

interface RecipeResponse {
  fridge_contents: {
    ingredients: string[];
  };
  recipe: {
    cards: RecipeCard[];
    recipe_image: string;
  };
}

export function TextRecipeDialog({ open, onOpenChange, onSuccess }: TextRecipeDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [weightGoal, setWeightGoal] = useState<WeightGoal["type"]>("maintain");
  const [calories, setCalories] = useState<number>(2000);
  const [customCalories, setCustomCalories] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [recipeResponse, setRecipeResponse] = useState<RecipeResponse | null>(null);
  
  const weightGoals: WeightGoal[] = [
    { type: "lose", label: "Lose weight" },
    { type: "maintain", label: "Maintain weight" },
    { type: "gain", label: "Gain weight" },
  ];
  
  const calorieOptions: CalorieOption[] = [
    { value: 1500, label: "1500 calories (low)" },
    { value: 2000, label: "2000 calories (medium)" },
    { value: 2500, label: "2500 calories (high)" },
    { value: 3000, label: "3000 calories (very high)" },
  ];
  
  const handleCalorieChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setCalories(numValue);
    }
  };
  
  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create recipes",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Combine all form data into a comprehensive text description
      const finalCalories = customCalories ? parseInt(customCalories) : calories;
      const textPrompt = `Create a recipe that is suitable for someone who wants to ${weightGoal} weight with a calorie intake of approximately ${finalCalories} calories. ${description}`;

      // Call the API to generate the recipe
      const response = await fetch("https://mealplan.techrealm.online/api/text-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textPrompt }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      setRecipeResponse(data);
      
      // Extract recipe information
      const recipeTitle = data.recipe.cards[0].content;
      const recipeSteps = data.recipe.cards.slice(1).map((card: RecipeCard) => card.content);
      const recipeImageUrl = data.recipe.recipe_image;
      const ingredients = data.fridge_contents.ingredients || [];

      // Save recipe to Supabase
      const { error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: recipeTitle,
          image_url: recipeImageUrl,
          ingredients: ingredients,
          steps: recipeSteps,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Recipe created successfully",
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("Error generating recipe:", error);
      toast({
        title: "Error",
        description: "Failed to generate recipe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setWeightGoal("maintain");
    setCalories(2000);
    setCustomCalories("");
    setDescription("");
    setRecipeResponse(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recipe From Description</DialogTitle>
          <DialogDescription>
            Tell us about your nutritional goals and what ingredients you have
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              Generating your personalized recipe...
            </p>
          </div>
        ) : recipeResponse ? (
          <RecipeFlashCards 
            recipeCards={recipeResponse.recipe.cards}
            recipeImage={recipeResponse.recipe.recipe_image}
            onClose={handleClose}
          />
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">What is your weight goal?</h3>
                  <RadioGroup value={weightGoal} onValueChange={(value) => setWeightGoal(value as WeightGoal["type"])}>
                    {weightGoals.map((goal) => (
                      <div key={goal.type} className="flex items-center space-x-2">
                        <RadioGroupItem value={goal.type} id={goal.type} />
                        <Label htmlFor={goal.type}>{goal.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Select your daily calorie target:</h3>
                  <RadioGroup value={calories.toString()} onValueChange={handleCalorieChange}>
                    {calorieOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value.toString()} id={option.value.toString()} />
                        <Label htmlFor={option.value.toString()}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="mt-4">
                    <Label htmlFor="custom-calories">Or enter custom calories:</Label>
                    <Input 
                      id="custom-calories" 
                      type="number" 
                      placeholder="Enter custom calories" 
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Describe your recipe requirements:</h3>
                  <p className="text-sm text-muted-foreground">
                    Include ingredients you have, dietary restrictions, cuisine preferences, or any specific requirements.
                  </p>
                  <Textarea 
                    placeholder="E.g., I have chicken, rice, and vegetables. I want a healthy dinner that's gluten-free and Mediterranean-inspired."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button onClick={handleSubmit}>Generate Recipe</Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
