
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Utensils } from "lucide-react";
import { CameraOptionsDialog } from "./CameraOptionsDialog";

interface FeatureSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureSelectionDialog({
  open,
  onOpenChange
}: FeatureSelectionDialogProps) {
  const [selectedFeature, setSelectedFeature] = useState<"calorie" | "recipe" | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

  const handleSelectFeature = (feature: "calorie" | "recipe") => {
    setSelectedFeature(feature);
    setCameraDialogOpen(true);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>What would you like to do?</DialogTitle>
            <DialogDescription>
              Select a feature to continue
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Button
              className="flex flex-col items-center justify-center h-32"
              variant="outline"
              onClick={() => handleSelectFeature("calorie")}
            >
              <Calculator className="h-10 w-10 mb-2" />
              <span>Calorie Scanner</span>
              <span className="text-xs text-muted-foreground mt-1">Scan food to log calories</span>
            </Button>

            <Button
              className="flex flex-col items-center justify-center h-32"
              variant="outline"
              onClick={() => handleSelectFeature("recipe")}
            >
              <Utensils className="h-10 w-10 mb-2" />
              <span>Recipe Generator</span>
              <span className="text-xs text-muted-foreground mt-1">Generate recipes from ingredients</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CameraOptionsDialog 
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        featureType={selectedFeature}
      />
    </>
  );
}
