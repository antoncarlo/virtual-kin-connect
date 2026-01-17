export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          avatar_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          avatar_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          avatar_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      crisis_logs: {
        Row: {
          action_taken: string
          avatar_id: string
          crisis_type: string
          detected_at: string
          id: string
          message_content: string
          user_id: string
        }
        Insert: {
          action_taken: string
          avatar_id: string
          crisis_type: string
          detected_at?: string
          id?: string
          message_content: string
          user_id: string
        }
        Update: {
          action_taken?: string
          avatar_id?: string
          crisis_type?: string
          detected_at?: string
          id?: string
          message_content?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          avatar_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          avatar_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          avatar_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      interaction_feedback: {
        Row: {
          assistant_response: string | null
          avatar_id: string
          correction_note: string | null
          created_at: string
          feedback_type: string
          id: string
          learned_pattern: string | null
          session_id: string | null
          user_id: string
          user_message: string | null
          weight_adjustment: Json | null
        }
        Insert: {
          assistant_response?: string | null
          avatar_id?: string
          correction_note?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          learned_pattern?: string | null
          session_id?: string | null
          user_id: string
          user_message?: string | null
          weight_adjustment?: Json | null
        }
        Update: {
          assistant_response?: string | null
          avatar_id?: string
          correction_note?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          learned_pattern?: string | null
          session_id?: string | null
          user_id?: string
          user_message?: string | null
          weight_adjustment?: Json | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          avatar_id: string | null
          category: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source: string | null
          title: string
        }
        Insert: {
          avatar_id?: string | null
          category: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title: string
        }
        Update: {
          avatar_id?: string | null
          category?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title?: string
        }
        Relationships: []
      }
      metaphor_library: {
        Row: {
          avatar_id: string
          category: string
          created_at: string
          id: string
          metaphor: string
          source: string | null
          theme: string
          usage_context: string | null
        }
        Insert: {
          avatar_id?: string
          category: string
          created_at?: string
          id?: string
          metaphor: string
          source?: string | null
          theme: string
          usage_context?: string | null
        }
        Update: {
          avatar_id?: string
          category?: string
          created_at?: string
          id?: string
          metaphor?: string
          source?: string | null
          theme?: string
          usage_context?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          has_completed_onboarding: boolean
          id: string
          notification_preferences: Json | null
          safe_space_sound: string | null
          safe_space_theme: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tokens_balance: number
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          has_completed_onboarding?: boolean
          id?: string
          notification_preferences?: Json | null
          safe_space_sound?: string | null
          safe_space_theme?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tokens_balance?: number
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          has_completed_onboarding?: boolean
          id?: string
          notification_preferences?: Json | null
          safe_space_sound?: string | null
          safe_space_theme?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tokens_balance?: number
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          avatar_id: string
          created_at: string
          feedback: string | null
          id: string
          rating: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          avatar_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_tokens: number
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_tokens?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_tokens?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      session_insights: {
        Row: {
          avatar_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          key_points: Json | null
          mood: string | null
          summary: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          avatar_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          key_points?: Json | null
          mood?: string | null
          summary?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          key_points?: Json | null
          mood?: string | null
          summary?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      session_summaries: {
        Row: {
          avatar_id: string
          created_at: string
          embedding: string | null
          emotions_detected: string[] | null
          id: string
          insights: Json | null
          session_date: string
          summary: string
          topics_discussed: string[] | null
          user_id: string
        }
        Insert: {
          avatar_id: string
          created_at?: string
          embedding?: string | null
          emotions_detected?: string[] | null
          id?: string
          insights?: Json | null
          session_date?: string
          summary: string
          topics_discussed?: string[] | null
          user_id: string
        }
        Update: {
          avatar_id?: string
          created_at?: string
          embedding?: string | null
          emotions_detected?: string[] | null
          id?: string
          insights?: Json | null
          session_date?: string
          summary?: string
          topics_discussed?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      social_graph: {
        Row: {
          avatar_id: string
          context: string | null
          first_mentioned_at: string
          id: string
          last_mentioned_at: string
          mention_count: number
          metadata: Json | null
          person_name: string
          relationship: string | null
          sentiment: string | null
          user_id: string
        }
        Insert: {
          avatar_id?: string
          context?: string | null
          first_mentioned_at?: string
          id?: string
          last_mentioned_at?: string
          mention_count?: number
          metadata?: Json | null
          person_name: string
          relationship?: string | null
          sentiment?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string
          context?: string | null
          first_mentioned_at?: string
          id?: string
          last_mentioned_at?: string
          mention_count?: number
          metadata?: Json | null
          person_name?: string
          relationship?: string | null
          sentiment?: string | null
          user_id?: string
        }
        Relationships: []
      }
      temporal_goals: {
        Row: {
          achieved_at: string | null
          avatar_id: string
          created_at: string
          goal_category: string | null
          goal_description: string
          id: string
          progress_notes: Json | null
          status: string
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          avatar_id?: string
          created_at?: string
          goal_category?: string | null
          goal_description: string
          id?: string
          progress_notes?: Json | null
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          avatar_id?: string
          created_at?: string
          goal_category?: string | null
          goal_description?: string
          id?: string
          progress_notes?: Json | null
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_context: {
        Row: {
          avatar_id: string
          confidence: number | null
          context_type: string
          created_at: string
          embedding: string | null
          expires_at: string | null
          id: string
          key: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          avatar_id: string
          confidence?: number | null
          context_type: string
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          avatar_id?: string
          confidence?: number | null
          context_type?: string
          created_at?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_knowledge: {
        Args: {
          filter_avatar_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          source: string
          title: string
        }[]
      }
      search_user_context: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_avatar_id: string
          p_user_id: string
          query_embedding: string
        }
        Returns: {
          confidence: number
          context_type: string
          id: string
          key: string
          similarity: number
          value: string
        }[]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
