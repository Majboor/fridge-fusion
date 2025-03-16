
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ApiTesting from "./pages/ApiTesting";
import Dashboard from "./pages/Dashboard";
import PaymentCallback from "./pages/PaymentCallback";
import PaymentFallback from "./pages/PaymentFallback";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <div className="min-h-screen w-full">
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/payment-callback" element={<PaymentCallback />} />
              <Route path="/payment-fallback" element={<PaymentFallback />} />
              <Route path="/api-testing" element={<ApiTesting />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
