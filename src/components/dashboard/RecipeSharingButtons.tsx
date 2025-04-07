
import React from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecipeSharingButtonsProps {
  recipeId: string;
  recipeTitle: string;
  className?: string;
  size?: "default" | "sm" | "icon";
  variant?: "outline" | "ghost";
}

export function RecipeSharingButtons({ 
  recipeId, 
  recipeTitle,
  className = "",
  size = "sm",
  variant = "outline"
}: RecipeSharingButtonsProps) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/recipe/${recipeId}`;
  const shareText = `Check out this amazing recipe: ${recipeTitle}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeTitle,
          text: shareText,
          url: shareUrl
        });
        toast({
          title: "Shared successfully",
          description: "Recipe shared successfully",
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast({
            title: "Error sharing",
            description: "There was an error sharing this recipe",
            variant: "destructive",
          });
        }
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support native sharing",
      });
    }
  };

  const shareToFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToInstagram = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Instagram doesn't have a direct share URL, so we'll show a toast with instructions
    toast({
      title: "Instagram Sharing",
      description: "Copy the recipe link to share on Instagram",
    });
    navigator.clipboard.writeText(shareUrl);
  };

  const shareToWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ": " + shareUrl)}`, '_blank');
  };

  return (
    <div className={`flex gap-2 ${className}`} onClick={e => e.stopPropagation()}>
      <Button variant={variant} size={size} onClick={shareToFacebook} title="Share to Facebook">
        <Facebook className="h-4 w-4" />
      </Button>
      <Button variant={variant} size={size} onClick={shareToInstagram} title="Share to Instagram">
        <Instagram className="h-4 w-4" />
      </Button>
      <Button variant={variant} size={size} onClick={shareToWhatsapp} title="Share to WhatsApp">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
          <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
          <path d="M9.5 13.5c.5 1.5 2.5 2 4 1" />
        </svg>
      </Button>
    </div>
  );
}
