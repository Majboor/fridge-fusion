
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { RecipeFlashCards } from "./RecipeFlashCards";
import { RecipeSharingButtons } from "./RecipeSharingButtons";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  ingredients: string[];
  steps: string[];
  created_at: string;
}

interface RecipeDetailsDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailsDialog({ recipe, open, onOpenChange }: RecipeDetailsDialogProps) {
  if (!recipe) return null;
  
  const [currentTab, setCurrentTab] = useState<"ingredients" | "instructions" | "tutorial">("ingredients");
  
  // Reset to ingredients view when a new recipe is opened
  useEffect(() => {
    if (open) {
      setCurrentTab("ingredients");
    }
  }, [open, recipe?.id]);
  
  // Prepare data for tutorial format
  const flashCardData = recipe ? [
    { card: 1, content: recipe.title },
    ...recipe.steps.map((step, index) => ({
      card: index + 2,
      content: step
    }))
  ] : [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            View recipe details below
          </DialogDescription>
        </DialogHeader>
        
        {recipe.image_url && (
          <div className="w-full h-48 overflow-hidden">
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        {/* Navigation tabs */}
        <Tabs 
          value={currentTab} 
          onValueChange={(value) => setCurrentTab(value as any)} 
          className="w-full flex-1 flex flex-col"
        >
          <div className="sticky top-0 bg-background z-10 border-b">
            <TabsList className="grid grid-cols-3 w-full rounded-none">
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="ingredients" className="m-0 h-full">
              <ScrollArea className="h-[300px]">
                <div className="p-6">
                  <ul className="list-disc pl-5 mb-6 space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="instructions" className="m-0 h-full">
              <ScrollArea className="h-[300px]">
                <div className="p-6">
                  <ol className="list-decimal pl-5 space-y-4">
                    {recipe.steps.map((step, index) => (
                      <li key={index} className="pl-2">{step}</li>
                    ))}
                  </ol>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="tutorial" className="m-0 p-0 h-full flex flex-col">
              <div className="h-[300px] p-4">
                <RecipeFlashCards 
                  recipeCards={flashCardData} 
                  recipeImage={recipe.image_url || ""} 
                  onClose={() => setCurrentTab("ingredients")}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="p-4 border-t mt-auto flex justify-between items-center">
          <RecipeSharingButtons 
            recipeId={recipe.id} 
            recipeTitle={recipe.title} 
            variant="ghost"
          />
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
