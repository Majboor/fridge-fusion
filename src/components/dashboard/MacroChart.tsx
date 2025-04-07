
import React from 'react';

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroChart({ protein, carbs, fat }: MacroChartProps) {
  // If all values are zero, show a default distribution
  const hasData = protein > 0 || carbs > 0 || fat > 0;
  
  // Use actual values or fallback to some visual default if all are zero
  const proteinValue = hasData ? protein : 1;
  const carbsValue = hasData ? carbs : 1;
  const fatValue = hasData ? fat : 1;
  
  const total = proteinValue + carbsValue + fatValue; // Should never be zero now
  const proteinPercentage = (proteinValue / total) * 100;
  const carbsPercentage = (carbsValue / total) * 100;
  const fatPercentage = (fatValue / total) * 100;

  // Calculate the strokeDasharray values for the SVG circle
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  const proteinDash = (proteinPercentage / 100) * circumference;
  const carbsDash = (carbsPercentage / 100) * circumference;
  const fatDash = (fatPercentage / 100) * circumference;
  
  // Calculate the stroke-dashoffset for positioning each segment correctly
  const proteinOffset = 0;
  const carbsOffset = proteinDash;
  const fatOffset = proteinDash + carbsDash;

  return (
    <div className="relative flex justify-center items-center w-32 h-32 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle for empty state */}
        {!hasData && (
          <circle 
            cx="64" 
            cy="64" 
            r={radius} 
            fill="transparent"
            stroke="#f3f4f6" 
            strokeWidth="12"
          />
        )}
        
        {/* Protein segment (green) */}
        <circle 
          cx="64" 
          cy="64" 
          r={radius} 
          fill="transparent"
          stroke="#4ade80" 
          strokeWidth="12"
          strokeDasharray={`${proteinDash} ${circumference - proteinDash}`}
          strokeDashoffset={proteinOffset}
        />
        
        {/* Carbs segment (yellow) */}
        <circle 
          cx="64" 
          cy="64" 
          r={radius} 
          fill="transparent"
          stroke="#facc15" 
          strokeWidth="12"
          strokeDasharray={`${carbsDash} ${circumference - carbsDash}`}
          strokeDashoffset={-carbsOffset}
        />
        
        {/* Fat segment (blue) */}
        <circle 
          cx="64" 
          cy="64" 
          r={radius} 
          fill="transparent"
          stroke="#60a5fa" 
          strokeWidth="12"
          strokeDasharray={`${fatDash} ${circumference - fatDash}`}
          strokeDashoffset={-fatOffset}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center text-center">
        <div className="font-semibold text-sm text-gray-900">
          {protein}g P
        </div>
        <div className="text-primary text-base font-bold">
          {carbs}g C
        </div>
        <div className="font-semibold text-sm text-blue-500">
          {fat}g F
        </div>
      </div>
    </div>
  );
}
