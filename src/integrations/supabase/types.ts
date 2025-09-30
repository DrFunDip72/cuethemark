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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audio_labels: {
        Row: {
          created_at: string
          id: string
          label_name: string
          notes: string | null
          order: number | null
          playback_offset_seconds: number | null
          timestamp_seconds: number
          track_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label_name: string
          notes?: string | null
          order?: number | null
          playback_offset_seconds?: number | null
          timestamp_seconds: number
          track_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label_name?: string
          notes?: string | null
          order?: number | null
          playback_offset_seconds?: number | null
          timestamp_seconds?: number
          track_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_labels_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_tracks: {
        Row: {
          created_at: string
          filename: string
          id: string
          notes: string | null
          order: number | null
          updated_at: string
          uploaded_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          notes?: string | null
          order?: number | null
          updated_at?: string
          uploaded_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          notes?: string | null
          order?: number | null
          updated_at?: string
          uploaded_at?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          app_version: string | null
          created_at: string
          current_route: string | null
          device_info: Json | null
          email: string | null
          id: string
          message: string
          type: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          current_route?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          message: string
          type: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          current_route?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_admin?: boolean
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          id: string
          promo_code_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          promo_code_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          promo_code_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          type: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          type: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          type?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      seeded_templates: {
        Row: {
          created_at: string
          id: string
          template_track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_track_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      upload_errors: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          error_number: number
          error_type: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          stack_trace: string | null
          step_failed: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          error_number?: number
          error_type: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          step_failed: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          error_number?: number
          error_type?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          step_failed?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_admin_unchanged: {
        Args: { _new_is_admin: boolean }
        Returns: boolean
      }
      user_is_admin: {
        Args: { _user_id: string }
        Returns: boolean
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
