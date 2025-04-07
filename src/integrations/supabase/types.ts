export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          meals: Json
          notes: string | null
          total_daily_calories: number
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          meals: Json
          notes?: string | null
          total_daily_calories: number
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          meals?: Json
          notes?: string | null
          total_daily_calories?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_data: {
        Row: {
          calories_consumed: number
          calories_goal: number
          carbs_consumed: number
          carbs_goal: number
          created_at: string
          date: string
          fat_consumed: number
          fat_goal: number
          id: string
          protein_consumed: number
          protein_goal: number
          updated_at: string
          user_id: string
          weekly_progress: number
        }
        Insert: {
          calories_consumed?: number
          calories_goal?: number
          carbs_consumed?: number
          carbs_goal?: number
          created_at?: string
          date?: string
          fat_consumed?: number
          fat_goal?: number
          id?: string
          protein_consumed?: number
          protein_goal?: number
          updated_at?: string
          user_id: string
          weekly_progress?: number
        }
        Update: {
          calories_consumed?: number
          calories_goal?: number
          carbs_consumed?: number
          carbs_goal?: number
          created_at?: string
          date?: string
          fat_consumed?: number
          fat_goal?: number
          id?: string
          protein_consumed?: number
          protein_goal?: number
          updated_at?: string
          user_id?: string
          weekly_progress?: number
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_data: Json | null
          payment_reference: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_data?: Json | null
          payment_reference?: string | null
          status: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_data?: Json | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          ingredients: string[]
          steps: string[]
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients: string[]
          steps: string[]
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string[]
          steps?: string[]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          expires_at: string | null
          free_trial_used: boolean
          id: string
          is_active: boolean
          payment_reference: string | null
          presentations_generated: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          expires_at?: string | null
          free_trial_used?: boolean
          id?: string
          is_active?: boolean
          payment_reference?: string | null
          presentations_generated?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          expires_at?: string | null
          free_trial_used?: boolean
          id?: string
          is_active?: boolean
          payment_reference?: string | null
          presentations_generated?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          activity_level: string
          age: number
          carbs_grams: number | null
          created_at: string
          current_weight: number
          daily_calories: number | null
          dietary_restrictions: string | null
          fat_grams: number | null
          goal_type: string
          height: number
          id: string
          meals_per_day: number
          protein_grams: number | null
          target_weight: number | null
          timeframe: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_level: string
          age: number
          carbs_grams?: number | null
          created_at?: string
          current_weight: number
          daily_calories?: number | null
          dietary_restrictions?: string | null
          fat_grams?: number | null
          goal_type: string
          height: number
          id?: string
          meals_per_day: number
          protein_grams?: number | null
          target_weight?: number | null
          timeframe?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_level?: string
          age?: number
          carbs_grams?: number | null
          created_at?: string
          current_weight?: number
          daily_calories?: number | null
          dietary_restrictions?: string | null
          fat_grams?: number | null
          goal_type?: string
          height?: number
          id?: string
          meals_per_day?: number
          protein_grams?: number | null
          target_weight?: number | null
          timeframe?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          free_trial_used: boolean | null
          id: string
          is_subscribed: boolean | null
          payment_reference: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          free_trial_used?: boolean | null
          id?: string
          is_subscribed?: boolean | null
          payment_reference?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          free_trial_used?: boolean | null
          id?: string
          is_subscribed?: boolean | null
          payment_reference?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_todays_nutrition_data: {
        Args: { user_uuid: string }
        Returns: {
          calories_consumed: number
          calories_goal: number
          carbs_consumed: number
          carbs_goal: number
          created_at: string
          date: string
          fat_consumed: number
          fat_goal: number
          id: string
          protein_consumed: number
          protein_goal: number
          updated_at: string
          user_id: string
          weekly_progress: number
        }[]
      }
      get_subscription_status: {
        Args: { user_uuid: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
