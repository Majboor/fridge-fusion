
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface Notification {
  id: string;
  message: string;
  time?: string;
  type: "goal" | "meal" | "system";
  isRead: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, "id" | "isRead" | "createdAt">) => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Helper to check if a notification was already sent today
  const hasNotificationByTypeToday = (type: string) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return notifications.some(n => 
      n.type === type && 
      new Date(n.createdAt).toISOString().split('T')[0] === today
    );
  };

  // Helper to check if a specific notification ID already exists
  const hasNotificationWithId = (id: string) => {
    return notifications.some(n => n.id === id);
  };

  // Helper to check if user has any meal plans
  const hasMealPlans = async (userId: string) => {
    if (!userId) return false;
    
    try {
      const { count, error } = await supabase
        .from('meal_plans')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error checking meal plans:', error);
        return false;
      }
      
      return count !== null && count > 0;
    } catch (e) {
      console.error('Exception checking meal plans:', e);
      return false;
    }
  };

  // Helper to check if user has any goals
  const hasGoals = async (userId: string) => {
    if (!userId) return false;
    
    try {
      const { count, error } = await supabase
        .from('user_goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error checking goals:', error);
        return false;
      }
      
      return count !== null && count > 0;
    } catch (e) {
      console.error('Exception checking goals:', e);
      return false;
    }
  };

  // Fetch notifications from local storage initially and then from Supabase
  useEffect(() => {
    const loadLocalNotifications = () => {
      const savedNotifications = localStorage.getItem('userNotifications');
      if (savedNotifications) {
        try {
          // For new users, clear any existing notifications
          if (!hasInitialized) {
            localStorage.removeItem('userNotifications');
          } else {
            setNotifications(JSON.parse(savedNotifications));
          }
        } catch (e) {
          console.error("Error loading notifications from local storage", e);
          localStorage.removeItem('userNotifications');
        }
      }
      setHasInitialized(true);
    };

    loadLocalNotifications();
    
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Generate time-based notifications
  useEffect(() => {
    if (!user || !hasInitialized) return;
    
    const generateTimeBasedNotifications = async () => {
      try {
        // Check if user has any meal plans before generating meal-related notifications
        const userHasMealPlans = await hasMealPlans(user.id);
        const userHasGoals = await hasGoals(user.id);
        
        // If this is a new user (no meal plans), only show a welcome notification
        if (!userHasMealPlans) {
          const welcomeNotifId = `welcome-${user.id}`;
          
          if (!hasNotificationWithId(welcomeNotifId)) {
            addNotification({
              id: welcomeNotifId,
              message: "Welcome! Start by creating your nutrition goals and meal plans.",
              type: "system"
            });
          }
          return; // Don't show meal-specific notifications for new users
        }
        
        const hour = new Date().getHours();
        
        try {
          // Fetch the most recent meal plan for this user
          const { data: mealPlans, error } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (error) {
            console.error('Error fetching meal plans:', error);
            return;
          }
          
          if (mealPlans && mealPlans.length > 0 && mealPlans[0].meals) {
            const meals = mealPlans[0].meals as any[];
            
            if (Array.isArray(meals)) {
              // Process all meals in the meal plan
              for (const meal of meals) {
                if (typeof meal === 'object' && meal !== null && 'name' in meal && 'time' in meal && 'foods' in meal) {
                  // Generate a unique ID for this meal notification
                  const mealName = meal.name.toLowerCase();
                  const notifId = `meal-reminder-${mealName}-${new Date().toISOString().split('T')[0]}`;
                  
                  // Only add if this notification doesn't already exist
                  if (!hasNotificationWithId(notifId)) {
                    const mealTime = meal.time;
                    const formattedFoods = Array.isArray(meal.foods) ? meal.foods.join(', ') : '';
                    
                    addNotification({
                      id: notifId,
                      message: `${meal.name} time: ${formattedFoods}`,
                      type: "meal",
                      time: mealTime
                    });
                  }
                }
              }
            }
          } else if (userHasGoals) {
            // No meal plan but has goals, generate default meal notifications based on time
            let mealType = "";
            let mealTime = "";
            let actionMessage = "";
            
            // Determine meal type based on time of day
            if (hour >= 5 && hour < 10) {
              mealType = "breakfast";
              mealTime = "8:00 AM";
              actionMessage = "Log your breakfast";
            } else if (hour >= 11 && hour < 14) {
              mealType = "lunch";
              mealTime = "12:00 PM";
              actionMessage = "Log your lunch";
            } else if (hour >= 17 && hour < 21) {
              mealType = "dinner";
              mealTime = "7:00 PM";
              actionMessage = "Log your dinner";
            }
            
            // Only add notification if a mealType was determined
            if (mealType) {
              const notifId = `meal-reminder-${mealType}-${new Date().toISOString().split('T')[0]}`;
              
              if (!hasNotificationWithId(notifId)) {
                const capitalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
                
                addNotification({
                  id: notifId,
                  message: `Don't forget to ${actionMessage.toLowerCase()}!`,
                  type: "meal",
                  time: mealTime
                });
              }
            }
          }
          
          // Check for goal notifications once per day
          if (userHasGoals && !hasNotificationByTypeToday("goal")) {
            try {
              // Check if user has a meal plan
              const { data: mealPlans, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);
              
              if (error) throw error;
              
              if (!mealPlans || mealPlans.length === 0) {
                // No meal plan, remind user to create one
                addNotification({
                  message: "Create a meal plan to track your nutrition goals better!",
                  type: "goal"
                });
              } else {
                // User has a meal plan, check their goal progress
                const { data: nutritionData, error: nutritionError } = await supabase
                  .from('nutrition_data')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('date', new Date().toISOString().split('T')[0])
                  .maybeSingle();
                  
                if (nutritionError) {
                  console.error('Error fetching nutrition data:', nutritionError);
                  return;
                }
                
                if (nutritionData) {
                  // Calculate how far they are from their protein goal
                  const proteinPercentage = Math.round((nutritionData.protein_consumed / nutritionData.protein_goal) * 100);
                  
                  if (proteinPercentage < 80) {
                    const remaining = 100 - proteinPercentage;
                    addNotification({
                      message: `You're ${remaining}% away from your protein goal today`,
                      type: "goal"
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Error checking meal plans:', error);
            }
          }
        } catch (error) {
          console.error('Error generating notifications:', error);
        }
      } catch (error) {
        console.error('Error in generateTimeBasedNotifications:', error);
      }
    };
    
    // Run immediately
    generateTimeBasedNotifications();
    
    // Set up interval to periodically check for time-based notifications
    const intervalId = setInterval(generateTimeBasedNotifications, 1000 * 60 * 30); // Check every 30 minutes
    
    return () => clearInterval(intervalId);
  }, [user, notifications, hasInitialized]);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('userNotifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Reset notifications for new users
      if (!hasInitialized) {
        setNotifications([]);
        localStorage.removeItem('userNotifications');
        setHasInitialized(true);
      }
      
      // Check if user has any goals or meal plans
      const userHasGoals = await hasGoals(user.id);
      const userHasMealPlans = await hasMealPlans(user.id);
      
      // For new users with no data yet, just show a welcome notification
      if (!userHasGoals && !userHasMealPlans) {
        const welcomeNotifId = `welcome-${user.id}`;
        
        if (!hasNotificationWithId(welcomeNotifId)) {
          const welcomeNotification: Notification = {
            id: welcomeNotifId,
            message: "Welcome! Start by creating your nutrition goals and meal plans.",
            type: "system",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          
          setNotifications([welcomeNotification]);
          return;
        }
        return; // No other notifications for new users
      }

      // Only fetch goal notifications if user has goals
      if (userHasGoals) {
        // Fetch goals with upcoming deadlines
        const { data: goalData, error: goalError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (goalError) {
          console.error('Error fetching goals:', goalError);
          return;
        }

        // Generate notifications based on goals, but only if we haven't already today
        if (goalData && goalData.length > 0 && !hasNotificationByTypeToday("goal")) {
          const goalNotification: Notification = {
            id: `goal-reminder-${new Date().toISOString().split('T')[0]}`,
            message: "Track your food today to meet your nutrition goals!",
            type: "goal",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          
          // Add to notifications without duplicating
          setNotifications(prev => {
            if (prev.some(n => n.id === goalNotification.id)) return prev;
            return [...prev, goalNotification];
          });
        }
      }
      
      // Only fetch meal notifications if user has meal plans
      if (userHasMealPlans) {
        // Fetch meal plans to generate notifications
        const { data: mealPlans, error: mealPlansError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (mealPlansError) {
          console.error('Error fetching meal plans:', mealPlansError);
          return;
        }
        
        if (mealPlans && mealPlans.length > 0 && mealPlans[0].meals) {
          const meals = mealPlans[0].meals as any[];
          
          if (Array.isArray(meals)) {
            // Process each meal to create a notification
            meals.forEach(meal => {
              if (typeof meal === 'object' && meal !== null && 'name' in meal && 'time' in meal && 'foods' in meal) {
                const mealName = meal.name.toLowerCase();
                const notifId = `meal-reminder-${mealName}-${new Date().toISOString().split('T')[0]}`;
                
                if (!hasNotificationWithId(notifId)) {
                  const mealTime = meal.time;
                  const formattedFoods = Array.isArray(meal.foods) ? meal.foods.join(', ') : '';
                  
                  const mealNotification: Notification = {
                    id: notifId,
                    message: `${meal.name} time: ${formattedFoods}`,
                    type: "meal",
                    time: mealTime,
                    isRead: false,
                    createdAt: new Date().toISOString()
                  };
                  
                  setNotifications(prev => {
                    if (prev.some(n => n.id === notifId)) return prev;
                    return [mealNotification, ...prev];
                  });
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const addNotification = (notification: Omit<Notification, "id" | "isRead" | "createdAt"> & { id?: string }) => {
    const newNotification: Notification = {
      ...notification,
      id: notification.id || `notification-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Check for duplicates before adding
    setNotifications(prev => {
      // If notification with this ID already exists, don't add it
      if (prev.some(n => n.id === newNotification.id)) {
        return prev;
      }
      
      // If this is a meal or goal notification, check if we already have one for today
      if ((newNotification.type === "meal" || newNotification.type === "goal") && 
          !notification.id) { // Skip check for notifications with explicit IDs
        const todayDate = new Date().toISOString().split('T')[0];
        const hasSimilarNotification = prev.some(n => 
          n.type === newNotification.type && 
          n.message === newNotification.message &&
          new Date(n.createdAt).toISOString().split('T')[0] === todayDate
        );
        
        if (hasSimilarNotification) {
          return prev;
        }
      }
      
      // Show toast for new notification
      toast({
        title: "New Notification",
        description: newNotification.message,
      });
      
      return [newNotification, ...prev];
    });
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    fetchNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};
