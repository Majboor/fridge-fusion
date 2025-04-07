
import { ThemeProvider } from "@/components/ThemeProvider"
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner"
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import MicronutrientTracking from "@/pages/MicronutrientTracking";
import Recipes from "@/pages/Recipes";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import NotFound from "@/pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Auth />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/micronutrients",
    element: <MicronutrientTracking />,
  },
  {
    path: "/micronutrient-tracking",
    element: <MicronutrientTracking />,
  },
  {
    path: "/recipes",
    element: <Recipes />,
  },
   {
    path: "/goals",
    element: <Goals />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <NotificationsProvider>
          <RouterProvider router={router} />
          <Toaster />
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
