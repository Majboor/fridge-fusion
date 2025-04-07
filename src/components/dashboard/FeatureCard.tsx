
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
  route?: string;
  routeState?: Record<string, any>;
  activeTab?: string; // Added for tab selection
  view?: string; // Added for view parameter (for goals page)
}

export function FeatureCard({ 
  title, 
  icon: Icon, 
  onClick, 
  route, 
  routeState,
  activeTab,
  view
}: FeatureCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (route) {
      // Check if this is the micronutrient route and fix it
      const finalRoute = route === "/micronutrient-tracking" ? "/micronutrients" : route;
      
      // Combine all navigation state parameters
      const state = {
        ...routeState
      };
      
      // Add activeTab if provided
      if (activeTab) {
        state.activeTab = activeTab;
      }
      
      // Add view if provided (for goals page)
      if (view) {
        state.view = view;
      }
        
      navigate(finalRoute, { state });
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      className="flex flex-col items-center justify-center p-5 cursor-pointer transition-all hover:bg-accent hover:shadow-md"
      onClick={handleClick}
    >
      <Icon className="h-8 w-8 text-primary mb-3" />
      <span className="text-sm font-medium text-center">{title}</span>
    </Card>
  );
}
