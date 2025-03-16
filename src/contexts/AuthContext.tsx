
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

type AuthContextType = {
  session: Session | null;
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
  hasActiveSubscription: boolean;
  hasUsedFreeGeneration: boolean;
  setHasUsedFreeGeneration: (value: boolean) => void;
  markFreeTrialAsUsed: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [hasUsedFreeGeneration, setHasUsedFreeGeneration] = useState(false);

  useEffect(() => {
    // We'll only use localStorage for anonymous users
    // For logged-in users, we'll always check the database
    if (!user) {
      const storedHasUsed = localStorage.getItem('hasUsedFreeGeneration');
      if (storedHasUsed) {
        setHasUsedFreeGeneration(true);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkSubscriptionStatus(session.user.id);
        checkGenerationUsage(session.user.id);
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          checkSubscriptionStatus(session.user.id);
          checkGenerationUsage(session.user.id);
        } else {
          setHasActiveSubscription(false);
          
          // Check localStorage for anonymous users
          const storedHasUsed = localStorage.getItem('hasUsedFreeGeneration');
          if (storedHasUsed) {
            setHasUsedFreeGeneration(true);
          } else {
            setHasUsedFreeGeneration(false);
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSubscriptionStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking subscription status:', error);
        setHasActiveSubscription(false);
        return;
      }

      if (data && data.is_active && new Date(data.expires_at) > new Date()) {
        setHasActiveSubscription(true);
        console.log('User has active subscription until:', data.expires_at);
      } else {
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
      setHasActiveSubscription(false);
    }
  };

  const checkGenerationUsage = async (userId: string) => {
    try {
      console.log("Checking generation usage for user:", userId);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking user subscriptions:', error);
        return;
      }

      // If we have a record AND free_trial_used is true, mark trial as used
      if (data && data.free_trial_used === true) {
        console.log("User has used their free generation:", userId);
        setHasUsedFreeGeneration(true);
      } else {
        console.log("User has not used their free generation:", userId);
        setHasUsedFreeGeneration(false);
      }
    } catch (error) {
      console.error('Error in checkGenerationUsage:', error);
    }
  };

  // New method to mark free trial as used for logged-in users
  const markFreeTrialAsUsed = async () => {
    if (!user) {
      // For anonymous users, use localStorage
      localStorage.setItem('hasUsedFreeGeneration', 'true');
      setHasUsedFreeGeneration(true);
      return;
    }

    try {
      // For logged-in users, update the database
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({ 
          user_id: user.id, 
          free_trial_used: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error recording free trial usage:", error);
        toast({
          title: "Error",
          description: "Could not record your free trial usage.",
          variant: "destructive",
        });
        return;
      }

      setHasUsedFreeGeneration(true);
      console.log("Successfully recorded free trial usage for user:", user.id);
    } catch (error) {
      console.error("Error in markFreeTrialAsUsed:", error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    hasActiveSubscription,
    hasUsedFreeGeneration,
    setHasUsedFreeGeneration,
    markFreeTrialAsUsed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
