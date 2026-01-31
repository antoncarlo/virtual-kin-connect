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
      analytics_events: {
        Row: {
          created_at: string | null
          device_info: Json | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      avatar_identity: {
        Row: {
          age: number
          avatar_id: string
          birthdate: string | null
          birthplace: string | null
          created_at: string | null
          deep_secrets: Json | null
          education: string | null
          education_story: string | null
          favorite_book: string | null
          favorite_coffee: string | null
          forbidden_phrases: string[] | null
          formative_pain: string | null
          formative_story: string | null
          hates: string[] | null
          id: string
          loves: string[] | null
          must_remember: string[] | null
          name: string
          past_occupations: string[] | null
          personality_traits: Json | null
          relationship_status: string | null
          relationship_story: string | null
          speech_patterns: string[] | null
          updated_at: string | null
        }
        Insert: {
          age: number
          avatar_id: string
          birthdate?: string | null
          birthplace?: string | null
          created_at?: string | null
          deep_secrets?: Json | null
          education?: string | null
          education_story?: string | null
          favorite_book?: string | null
          favorite_coffee?: string | null
          forbidden_phrases?: string[] | null
          formative_pain?: string | null
          formative_story?: string | null
          hates?: string[] | null
          id?: string
          loves?: string[] | null
          must_remember?: string[] | null
          name: string
          past_occupations?: string[] | null
          personality_traits?: Json | null
          relationship_status?: string | null
          relationship_story?: string | null
          speech_patterns?: string[] | null
          updated_at?: string | null
        }
        Update: {
          age?: number
          avatar_id?: string
          birthdate?: string | null
          birthplace?: string | null
          created_at?: string | null
          deep_secrets?: Json | null
          education?: string | null
          education_story?: string | null
          favorite_book?: string | null
          favorite_coffee?: string | null
          forbidden_phrases?: string[] | null
          formative_pain?: string | null
          formative_story?: string | null
          hates?: string[] | null
          id?: string
          loves?: string[] | null
          must_remember?: string[] | null
          name?: string
          past_occupations?: string[] | null
          personality_traits?: Json | null
          relationship_status?: string | null
          relationship_story?: string | null
          speech_patterns?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      avatars: {
        Row: {
          created_at: string
          id: string
          name: string
          source_video_url: string
          system_prompt: string | null
          updated_at: string
          voice_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          source_video_url: string
          system_prompt?: string | null
          updated_at?: string
          voice_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source_video_url?: string
          system_prompt?: string | null
          updated_at?: string
          voice_id?: string
        }
        Relationships: []
      }
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
      daily_challenges: {
        Row: {
          challenge_id: string
          challenge_name: string
          challenge_type: string
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          expires_at: string
          id: string
          requirement_metric: string
          requirement_target: number
          requirement_type: string
          token_reward: number | null
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          challenge_id: string
          challenge_name: string
          challenge_type: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          expires_at: string
          id?: string
          requirement_metric: string
          requirement_target: number
          requirement_type: string
          token_reward?: number | null
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          challenge_id?: string
          challenge_name?: string
          challenge_type?: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          expires_at?: string
          id?: string
          requirement_metric?: string
          requirement_target?: number
          requirement_type?: string
          token_reward?: number | null
          user_id?: string
          xp_reward?: number | null
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
          is_global: boolean
          knowledge_type: string
          last_used_at: string | null
          learned_at: string | null
          learned_from_user_id: string | null
          metadata: Json | null
          source: string | null
          title: string
          validation_count: number | null
          validation_status: string | null
        }
        Insert: {
          avatar_id?: string | null
          category: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          is_global?: boolean
          knowledge_type?: string
          last_used_at?: string | null
          learned_at?: string | null
          learned_from_user_id?: string | null
          metadata?: Json | null
          source?: string | null
          title: string
          validation_count?: number | null
          validation_status?: string | null
        }
        Update: {
          avatar_id?: string | null
          category?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          is_global?: boolean
          knowledge_type?: string
          last_used_at?: string | null
          learned_at?: string | null
          learned_from_user_id?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string
          validation_count?: number | null
          validation_status?: string | null
        }
        Relationships: []
      }
      knowledge_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          items_approved: number | null
          items_merged: number | null
          items_processed: number | null
          items_rejected: number | null
          started_at: string
          status: string
          sync_date: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          items_approved?: number | null
          items_merged?: number | null
          items_processed?: number | null
          items_rejected?: number | null
          started_at?: string
          status?: string
          sync_date?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          items_approved?: number | null
          items_merged?: number | null
          items_processed?: number | null
          items_rejected?: number | null
          started_at?: string
          status?: string
          sync_date?: string
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
      pending_knowledge: {
        Row: {
          avatar_id: string
          confidence: number
          created_at: string
          extracted_fact: string
          fact_category: string
          id: string
          is_personal: boolean
          processed_at: string | null
          processing_status: string
          source_message: string
          user_id: string
        }
        Insert: {
          avatar_id?: string
          confidence?: number
          created_at?: string
          extracted_fact: string
          fact_category: string
          id?: string
          is_personal?: boolean
          processed_at?: string | null
          processing_status?: string
          source_message: string
          user_id: string
        }
        Update: {
          avatar_id?: string
          confidence?: number
          created_at?: string
          extracted_fact?: string
          fact_category?: string
          id?: string
          is_personal?: boolean
          processed_at?: string | null
          processing_status?: string
          source_message?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acquisition_source: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_streak: number | null
          display_name: string | null
          gamification_xp: number | null
          has_completed_onboarding: boolean
          id: string
          last_activity: string | null
          longest_streak: number | null
          notification_preferences: Json | null
          onboarding_step: number | null
          referral_code_used: string | null
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
          acquisition_source?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_streak?: number | null
          display_name?: string | null
          gamification_xp?: number | null
          has_completed_onboarding?: boolean
          id?: string
          last_activity?: string | null
          longest_streak?: number | null
          notification_preferences?: Json | null
          onboarding_step?: number | null
          referral_code_used?: string | null
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
          acquisition_source?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_streak?: number | null
          display_name?: string | null
          gamification_xp?: number | null
          has_completed_onboarding?: boolean
          id?: string
          last_activity?: string | null
          longest_streak?: number | null
          notification_preferences?: Json | null
          onboarding_step?: number | null
          referral_code_used?: string | null
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
          activated_at: string | null
          bonus_tokens: number
          completed_at: string | null
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referred_reward: number | null
          referrer_id: string
          referrer_reward: number | null
          rewards_claimed: boolean | null
          status: string
        }
        Insert: {
          activated_at?: string | null
          bonus_tokens?: number
          completed_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referred_reward?: number | null
          referrer_id: string
          referrer_reward?: number | null
          rewards_claimed?: boolean | null
          status?: string
        }
        Update: {
          activated_at?: string | null
          bonus_tokens?: number
          completed_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referred_reward?: number | null
          referrer_id?: string
          referrer_reward?: number | null
          rewards_claimed?: boolean | null
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
      shared_memories: {
        Row: {
          ai_description: string | null
          ai_emotions: string[] | null
          ai_objects: string[] | null
          ai_themes: string[] | null
          analyzed_at: string | null
          avatar_comment: string | null
          avatar_id: string
          created_at: string
          id: string
          image_path: string
          image_url: string
          is_favorite: boolean | null
          user_caption: string | null
          user_id: string
        }
        Insert: {
          ai_description?: string | null
          ai_emotions?: string[] | null
          ai_objects?: string[] | null
          ai_themes?: string[] | null
          analyzed_at?: string | null
          avatar_comment?: string | null
          avatar_id: string
          created_at?: string
          id?: string
          image_path: string
          image_url: string
          is_favorite?: boolean | null
          user_caption?: string | null
          user_id: string
        }
        Update: {
          ai_description?: string | null
          ai_emotions?: string[] | null
          ai_objects?: string[] | null
          ai_themes?: string[] | null
          analyzed_at?: string | null
          avatar_comment?: string | null
          avatar_id?: string
          created_at?: string
          id?: string
          image_path?: string
          image_url?: string
          is_favorite?: boolean | null
          user_caption?: string | null
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
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          metadata: Json | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_avatar_affinity: {
        Row: {
          affinity_level: number | null
          avatar_id: string
          created_at: string | null
          deep_conversations: number | null
          deep_topics: Json | null
          id: string
          total_call_minutes: number | null
          total_messages: number | null
          unlocked_secrets: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affinity_level?: number | null
          avatar_id: string
          created_at?: string | null
          deep_conversations?: number | null
          deep_topics?: Json | null
          id?: string
          total_call_minutes?: number | null
          total_messages?: number | null
          unlocked_secrets?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affinity_level?: number | null
          avatar_id?: string
          created_at?: string | null
          deep_conversations?: number | null
          deep_topics?: Json | null
          id?: string
          total_call_minutes?: number | null
          total_messages?: number | null
          unlocked_secrets?: string[] | null
          updated_at?: string | null
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
          is_cross_avatar: boolean
          key: string
          privacy_level: string
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
          is_cross_avatar?: boolean
          key: string
          privacy_level?: string
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
          is_cross_avatar?: boolean
          key?: string
          privacy_level?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      xp_log: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          source: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason: string
          source?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      global_knowledge: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string | null
          knowledge_type: string | null
          last_used_at: string | null
          metadata: Json | null
          source: string | null
          title: string | null
          validation_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          knowledge_type?: string | null
          last_used_at?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          validation_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          knowledge_type?: string | null
          last_used_at?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          validation_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_xp: {
        Args: { p_amount: number; p_reason: string; p_user_id: string }
        Returns: {
          level_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      get_user_private_context: {
        Args: { p_avatar_id?: string; p_user_id: string }
        Returns: {
          avatar_id: string
          confidence: number
          context_type: string
          id: string
          is_cross_avatar: boolean
          key: string
          value: string
        }[]
      }
      increment_tokens: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      search_global_knowledge: {
        Args: {
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
      update_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          is_new_day: boolean
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
