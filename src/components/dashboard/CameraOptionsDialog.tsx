
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RecipeFlashCards } from "./RecipeFlashCards";
import { NutritionDialog } from "./NutritionDialog";

interface CameraOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  featureType: "calorie" | "recipe" | null;
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

interface NutritionResponse {
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

export function CameraOptionsDialog({
  open,
  onOpenChange,
  onSuccess,
  featureType
}: CameraOptionsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<"camera" | "upload" | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipeResponse, setRecipeResponse] = useState<RecipeResponse | null>(null);
  const [nutritionResponse, setNutritionResponse] = useState<NutritionResponse | null>(null);
  const [nutritionDialogOpen, setNutritionDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSelectOption = (option: "camera" | "upload") => {
    setSelectedOption(option);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImageFile(files[0]);
      handleUploadImage(files[0]);
    }
  };

  const handleCaptureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImageFile(files[0]);
      handleUploadImage(files[0]);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use this feature",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create object URL for the image to display in UI
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      
      if (featureType === "calorie") {
        // Handle calorie scanning
        const formData = new FormData();
        formData.append("image", file);

        console.log("Sending request to nutrition API...");
        const response = await fetch("https://mealplan.techrealm.online/api/nutrition", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data: NutritionResponse = await response.json();
        console.log("Nutrition API response:", data);
        setNutritionResponse(data);
        
        // Show nutrition dialog
        onOpenChange(false); // Close the current dialog
        setNutritionDialogOpen(true);
        
      } else {
        // Continue with recipe generation
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("https://mealplan.techrealm.online/api/recipe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data: RecipeResponse = await response.json();
        setRecipeResponse(data);
        
        // Extract recipe information
        const recipeTitle = data.recipe.cards[0].content;
        const recipeSteps = data.recipe.cards.slice(1).map(card => card.content);
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
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setImageFile(null);
    setRecipeResponse(null);
    setNutritionResponse(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    onOpenChange(false);
  };

  const handleNutritionLogSuccess = () => {
    console.log("Nutrition logged successfully, calling onSuccess");
    // Refresh data in parent components
    if (onSuccess) {
      onSuccess();
    }
  };

  const getDialogTitle = () => {
    if (featureType === "calorie") {
      return "Scan Food for Calories";
    }
    return "Create Recipe From Image";
  };

  const getDialogDescription = () => {
    if (featureType === "calorie") {
      return "Take a photo of your food to log calories";
    }
    return "Take a photo of your fridge or ingredients to generate a recipe";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {getDialogDescription()}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                {featureType === "calorie" ? "Analyzing your food..." : "Analyzing your ingredients and creating a recipe..."}
              </p>
            </div>
          ) : recipeResponse ? (
            <RecipeFlashCards 
              recipeCards={recipeResponse.recipe.cards}
              recipeImage={recipeResponse.recipe.recipe_image}
              onClose={handleClose}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <Button
                className={`flex flex-col items-center justify-center h-32 ${
                  selectedOption === "camera" ? "ring-2 ring-primary" : ""
                }`}
                variant="outline"
                onClick={() => handleSelectOption("camera")}
              >
                <Camera className="h-10 w-10 mb-2" />
                <span>Take Photo</span>
                {selectedOption === "camera" && (
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCaptureImage}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                )}
              </Button>

              <Button
                className={`flex flex-col items-center justify-center h-32 ${
                  selectedOption === "upload" ? "ring-2 ring-primary" : ""
                }`}
                variant="outline"
                onClick={() => handleSelectOption("upload")}
              >
                <Upload className="h-10 w-10 mb-2" />
                <span>Upload Image</span>
                {selectedOption === "upload" && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nutrition Dialog */}
      <NutritionDialog
        open={nutritionDialogOpen}
        onOpenChange={setNutritionDialogOpen}
        nutritionData={nutritionResponse}
        imageUrl={imageUrl || undefined}
        onMealLogged={handleNutritionLogSuccess}
      />
    </>
  );
}
