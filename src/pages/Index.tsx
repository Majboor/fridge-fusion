
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  Camera, 
  UtensilsCrossed, 
  ChevronRight, 
  Globe, 
  FileImage,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Define types for API response
interface RecipeCard {
  card: number;
  content: string;
}

interface ApiResponse {
  fridge_contents: {
    ingredients: string[];
  };
  recipe: {
    cards: RecipeCard[];
    recipe_image: string;
  };
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recipeData, setRecipeData] = useState<ApiResponse | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };

  const handleDemoImage = () => {
    toast({
      title: "Demo image selected",
      description: "We've loaded a sample image for you to try."
    });
    setPreviewUrl("https://www.cameronskitchen.com.au/app/uploads/2020/11/The-Importance-of-Healthy-High-Quality-Ingredients-In-Your-Diet.jpeg");
  };

  const handleNextCard = () => {
    if (recipeData && currentCardIndex < recipeData.recipe.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const closeFlashcards = () => {
    setShowFlashcards(false);
    setCurrentCardIndex(0);
  };

  const handleSubmit = async () => {
    if (!file && !previewUrl) {
      toast({
        title: "No image selected",
        description: "Please upload a photo of your fridge or use our demo image.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      toast({
        title: "Processing your ingredients",
        description: "Our AI is analyzing your fridge contents... This may take up to 30 seconds."
      });
      
      // Create FormData object to send to the API
      const formData = new FormData();
      
      if (file) {
        formData.append('image', file);
      } else if (previewUrl) {
        // For demo image, we need to fetch it and convert to a file
        try {
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          formData.append('image', blob, 'demo-image.jpg');
        } catch (error) {
          console.error("Error converting demo image to blob:", error);
          throw new Error("Failed to process demo image");
        }
      }
      
      console.log("Sending request to API...");
      // Send request to the API
      const response = await fetch('https://mealplan.techrealm.online/api/recipe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate recipe';
        try {
          const errorData = await response.json();
          console.error("API error:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMessage);
      }
      
      console.log("API response received, parsing...");
      const data: ApiResponse = await response.json();
      console.log("API response parsed:", data);
      
      setRecipeData(data);
      setShowFlashcards(true);
      
      toast({
        title: "Recipe generated!",
        description: "Check out your personalized recipe cards."
      });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Flashcard Modal */}
      <AnimatePresence>
        {showFlashcards && recipeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden relative"
            >
              <div className="flex justify-end p-4 absolute top-0 right-0 z-10">
                <button
                  onClick={closeFlashcards}
                  className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 h-full">
                {/* First card always shows the recipe image */}
                {currentCardIndex === 0 && (
                  <div className="h-full max-h-96 md:max-h-full overflow-hidden">
                    <img 
                      src={recipeData.recipe.recipe_image}
                      alt="Recipe" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                
                {/* For subsequent cards, show ingredients on the left */}
                {currentCardIndex > 0 && (
                  <div className="bg-amber-50 p-6 flex flex-col justify-center">
                    <h4 className="text-lg font-medium text-amber-800 mb-4">Ingredients:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      {recipeData.fridge_contents.ingredients.map((ingredient, i) => (
                        <li key={i} className="text-gray-700">{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Recipe card content */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="mb-4">
                    <span className="text-xs font-medium text-amber-600">
                      Card {currentCardIndex + 1} of {recipeData.recipe.cards.length}
                    </span>
                  </div>
                  
                  <h3 className={`text-2xl font-bold text-gray-800 mb-4 ${currentCardIndex === 0 ? "text-center" : ""}`}>
                    {recipeData.recipe.cards[currentCardIndex].content}
                  </h3>
                  
                  {currentCardIndex === 0 && (
                    <p className="text-gray-600 text-center mb-4">
                      Ready to cook? Swipe through the cards to see the recipe steps.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 flex justify-between items-center">
                <Button
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                  variant="outline"
                  className={`${currentCardIndex === 0 ? 'opacity-50' : ''}`}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                
                <div className="flex space-x-1">
                  {recipeData.recipe.cards.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === currentCardIndex ? 'bg-amber-600' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
                
                <Button
                  onClick={handleNextCard}
                  disabled={currentCardIndex === recipeData.recipe.cards.length - 1}
                  variant="outline"
                  className={`${currentCardIndex === recipeData.recipe.cards.length - 1 ? 'opacity-50' : ''}`}
                >
                  Next <ChevronRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=2070')] bg-cover bg-center opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
              Introducing Fridge-to-Feast
            </span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6"
            >
              Transform Your <span className="text-amber-600">Fridge Contents</span> Into Delicious Meals
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
            >
              Upload a photo of what's in your fridge, and our AI will generate personalized recipes 
              tailored to the ingredients you already have. No waste, endless possibilities.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto"
            >
              <div className="text-left mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Upload your fridge photo</h3>
                <p className="text-gray-500">JPEG or PNG, up to 20MB</p>
              </div>
              
              <div className="mb-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fridge-photo" className="text-gray-700">Choose an image</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 h-52 flex flex-col items-center justify-center text-center transition-all hover:border-amber-300 cursor-pointer">
                      <Input
                        type="file"
                        id="fridge-photo"
                        className="hidden"
                        accept="image/jpeg, image/png"
                        onChange={handleFileChange}
                      />
                      <Label 
                        htmlFor="fridge-photo" 
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="h-10 w-10 text-amber-500 mb-3" />
                        <span className="text-gray-800 font-medium">
                          {file ? file.name : "Drag & drop or click to browse"}
                        </span>
                        <span className="text-sm text-gray-500 mt-1">
                          {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Or use our demo image"}
                        </span>
                      </Label>
                    </div>
                    <button 
                      onClick={handleDemoImage}
                      className="text-sm text-amber-600 hover:text-amber-800 font-medium flex items-center justify-center mx-auto mt-2"
                    >
                      <FileImage className="w-4 h-4 mr-1" /> Use demo image instead
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700">Preview</Label>
                    <div className="border border-gray-200 rounded-xl h-52 flex items-center justify-center bg-gray-50 overflow-hidden">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="text-gray-400 text-center p-4">
                          <Camera className="h-10 w-10 mx-auto mb-2" />
                          <p>Image preview will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-6 text-lg font-medium bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isLoading ? (
                  "Processing your ingredients... (This may take 30+ seconds)"
                ) : (
                  <span className="flex items-center justify-center">
                    Generate Recipes <ChevronRightIcon className="ml-2" />
                  </span>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              The Process
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Culinary Magic in Three Steps</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our innovative technology transforms random ingredients into chef-quality recipes in minutes.
            </p>
          </motion.div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto"
          >
            {[
              {
                icon: <Camera className="h-8 w-8 text-amber-600" />,
                title: "Capture Your Ingredients",
                description: "Take a photo of your fridge or pantry contents using your smartphone or upload an existing image."
              },
              {
                icon: <UtensilsCrossed className="h-8 w-8 text-amber-600" />,
                title: "AI Recipe Creation",
                description: "Our advanced AI identifies ingredients and generates personalized recipes based on what you have."
              },
              {
                icon: <Globe className="h-8 w-8 text-amber-600" />,
                title: "Cook & Enjoy",
                description: "Follow our step-by-step recipe cards to create delicious meals from ingredients you already have."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={item}
                className="bg-amber-50 rounded-2xl p-8 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Creations Section */}
      <section className="py-24 bg-amber-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
              Fan Favorites
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Top Kitchen Creations</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the most popular recipes our users are creating with ingredients from their fridges.
            </p>
          </motion.div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {[
              {
                title: "Quick Pasta Primavera",
                image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=580",
                ingredients: "Pasta, bell peppers, zucchini, cherry tomatoes"
              },
              {
                title: "Veggie Stir Fry",
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=580",
                ingredients: "Broccoli, carrots, bell peppers, soy sauce"
              },
              {
                title: "Chicken & Rice Bowl",
                image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=580",
                ingredients: "Chicken breast, rice, avocado, lime"
              },
              {
                title: "Simple Breakfast Hash",
                image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=580",
                ingredients: "Potatoes, eggs, bell peppers, onions"
              }
            ].map((recipeItem, index) => (
              <motion.div
                key={index}
                variants={item}
                className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <div className="h-52 overflow-hidden">
                  <img 
                    src={recipeItem.image} 
                    alt={recipeItem.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{recipeItem.title}</h3>
                  <p className="text-gray-600 text-sm">{recipeItem.ingredients}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Cultural Cuisine Section */}
      <section className="py-24 bg-gradient-to-br from-white to-amber-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              Global Flavors
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Culinary Journey Around the World</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore diverse cuisines and cooking techniques from different cultures using your everyday ingredients.
            </p>
          </motion.div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10">
              {[
                {
                  culture: "Italian",
                  title: "Mediterranean Magic",
                  description: "Transform simple ingredients into authentic Italian dishes with our specialized recipe algorithms.",
                  dishes: ["Pasta Carbonara", "Margherita Pizza", "Risotto"],
                  image: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?q=80&w=2070"
                },
                {
                  culture: "Asian",
                  title: "Eastern Delights",
                  description: "Discover the balanced flavors and techniques of various Asian cuisines using ingredients from your kitchen.",
                  dishes: ["Stir-Fry", "Curry", "Spring Rolls"],
                  image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=2070"
                }
              ].map((culture, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.7 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="h-64 overflow-hidden">
                    <img 
                      src={culture.image} 
                      alt={culture.culture} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-8">
                    <span className="text-sm font-medium text-amber-600 mb-2 block">{culture.culture} Cuisine</span>
                    <h3 className="text-2xl font-bold mb-3 text-gray-800">{culture.title}</h3>
                    <p className="text-gray-600 mb-4">{culture.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {culture.dishes.map((dish, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                        >
                          {dish}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="grid md:grid-cols-3 gap-6 mt-10"
            >
              {[
                {
                  culture: "Mexican",
                  dishes: ["Tacos", "Enchiladas", "Guacamole"],
                  image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=680"
                },
                {
                  culture: "Middle Eastern",
                  dishes: ["Falafel", "Hummus", "Tabbouleh"],
                  image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=680"
                },
                {
                  culture: "Indian",
                  dishes: ["Curry", "Biryani", "Naan"],
                  image: "https://images.unsplash.com/photo-1585937421612-70a008356c36?q=80&w=680"
                }
              ].map((culture, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={culture.image} 
                      alt={culture.culture} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">{culture.culture} Cuisine</h3>
                    <div className="flex flex-wrap gap-2">
                      {culture.dishes.map((dish, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                        >
                          {dish}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-amber-600 text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Cooking Experience?</h2>
            <p className="text-xl mb-8 text-amber-100">
              Stop wasting ingredients and discover delicious recipes tailored to what you already have.
            </p>
            <Button className="bg-white text-amber-600 hover:bg-amber-50 hover:text-amber-700 text-lg py-6 px-8">
              Upload Your Fridge Photo Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Fridge-to-Feast</h3>
            <p className="mb-8 max-w-md mx-auto">
              AI-powered recipe generation from your fridge contents. 
              No more food waste, no more boring meals.
            </p>
            <div className="flex justify-center space-x-4 mb-8">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} Fridge-to-Feast. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
