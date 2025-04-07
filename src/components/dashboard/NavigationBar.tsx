
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart2, Camera, Goal, BookOpen, Radar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FeatureSelectionDialog } from "./FeatureSelectionDialog";
import { NotificationBell } from "./NotificationBell";

export function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleCameraClick = () => {
    setFeatureDialogOpen(true);
  };
  
  return (
    <>
      <div className="fixed top-0 right-0 z-50 bg-background p-2 flex items-center gap-2">
        <NotificationBell />
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 px-4">
        <div className="flex justify-around items-center">
          <NavItem 
            icon={<Home className={`w-6 h-6 ${isActive('/dashboard') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Home" 
            onClick={() => navigate('/dashboard')} 
            active={isActive('/dashboard')}
          />
          <NavItem 
            icon={<Radar className={`w-6 h-6 ${isActive('/micronutrients') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Nutrients" 
            onClick={() => navigate('/micronutrients')} 
            active={isActive('/micronutrients')}
          />
          <div className="relative flex flex-col items-center justify-center">
            <button 
              className="bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-5"
              onClick={handleCameraClick}
            >
              <Camera className="w-7 h-7" />
            </button>
          </div>
          <NavItem 
            icon={<BookOpen className={`w-6 h-6 ${isActive('/recipes') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Recipes" 
            onClick={() => navigate('/recipes')} 
            active={isActive('/recipes')}
          />
          <NavItem 
            icon={<Goal className={`w-6 h-6 ${isActive('/goals') ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />} 
            label="Goals" 
            onClick={() => navigate('/goals')} 
            active={isActive('/goals')}
          />
        </div>
      </div>
      
      <FeatureSelectionDialog 
        open={featureDialogOpen} 
        onOpenChange={setFeatureDialogOpen}
      />
    </>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
}

function NavItem({ icon, label, onClick, active }: NavItemProps) {
  return (
    <button 
      className="flex flex-col items-center justify-center w-16" 
      onClick={onClick}
    >
      {icon}
      <span className={`text-xs mt-1 ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </button>
  );
}
