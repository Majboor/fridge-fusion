
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, Utensils, UtensilsCrossed, Camera, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CameraOptionsDialog } from "@/components/dashboard/CameraOptionsDialog";
import { TextRecipeDialog } from "@/components/dashboard/TextRecipeDialog";
import { RecipeDetailsDialog } from "@/components/dashboard/RecipeDetailsDialog";
import { RecipeSharingButtons } from "@/components/dashboard/RecipeSharingButtons";
import { supabase } from "@/integrations/supabase/client";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  ingredients: string[];
  steps: string[];
  created_at: string;
}

export default function Recipes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [textRecipeDialogOpen, setTextRecipeDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"camera" | "text" | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDetailsOpen, setRecipeDetailsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key to force re-fetching

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchRecipes();
    
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
          console.log("Recipe changed, refreshing...");
          fetchRecipes();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, refreshKey]);

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setRecipes(data as Recipe[] || []);
      
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load recipes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const handleOptionSelect = (option: "camera" | "text") => {
    setSelectedOption(option);
    if (option === "camera") {
      setCameraDialogOpen(true);
    } else {
      setTextRecipeDialogOpen(true);
    }
  };
  
  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setRecipeDetailsOpen(true);
  };
  
  const handleSuccessfulAction = () => {
    // Force refresh by updating refresh key
    setRefreshKey(prev => prev + 1);
    fetchRecipes();
  };
  
  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header */}
      <PageHeader title="Recipes" />

      <div className="px-6">
        {/* Add Recipe Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button 
            className="py-6 text-lg flex items-center justify-center gap-2" 
            onClick={() => handleOptionSelect("camera")}
          >
            <Camera className="h-5 w-5" /> Use Camera
          </Button>
          <Button 
            className="py-6 text-lg flex items-center justify-center gap-2"
            variant="secondary" 
            onClick={() => handleOptionSelect("text")}
          >
            <FileText className="h-5 w-5" /> Text Recipe
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden">
                {recipe.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{recipe.title}</CardTitle>
                  <CardDescription>
                    {recipe.ingredients.length} ingredients • {recipe.steps.length} steps
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <h4 className="text-sm font-medium mb-2">Ingredients:</h4>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
                      <span key={idx} className="bg-muted text-xs px-2 py-1 rounded">
                        {ingredient}
                      </span>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <span className="bg-muted text-xs px-2 py-1 rounded">
                        +{recipe.ingredients.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleViewRecipe(recipe)}>
                    View Recipe
                  </Button>
                  <RecipeSharingButtons 
                    recipeId={recipe.id} 
                    recipeTitle={recipe.title} 
                    size="icon"
                    variant="ghost"
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="bg-muted/50 p-8 rounded-full mb-4">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No recipes yet</h2>
            <p className="text-muted-foreground text-center mt-2 mb-6">
              Create your first recipe by using the camera feature or adding a recipe manually
            </p>
          </div>
        )}
      </div>

      {/* Camera Options Dialog */}
      <CameraOptionsDialog 
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onSuccess={handleSuccessfulAction}
        featureType="recipe"
      />

      {/* Text Recipe Dialog */}
      <TextRecipeDialog
        open={textRecipeDialogOpen}
        onOpenChange={setTextRecipeDialogOpen}
        onSuccess={handleSuccessfulAction}
      />

      {/* Recipe Details Dialog */}
      <RecipeDetailsDialog
        recipe={selectedRecipe}
        open={recipeDetailsOpen}
        onOpenChange={setRecipeDetailsOpen}
      />

      {/* Navigation Bar */}
      <NavigationBar />
    </div>
  );
}
