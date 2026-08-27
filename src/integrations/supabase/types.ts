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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          created_at: string
          detail: Json
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      birth_profiles: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          payload_ct: string
          time_accuracy: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          payload_ct: string
          time_accuracy?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          payload_ct?: string
          time_accuracy?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chart_snapshots: {
        Row: {
          aspects: Json
          birth_profile_id: string
          contract_version: string
          created_at: string
          engine: string
          fingerprint: string
          houses: Json
          id: string
          positions: Json
          uncertainty: Json
          user_id: string
        }
        Insert: {
          aspects?: Json
          birth_profile_id: string
          contract_version: string
          created_at?: string
          engine: string
          fingerprint: string
          houses?: Json
          id?: string
          positions?: Json
          uncertainty?: Json
          user_id: string
        }
        Update: {
          aspects?: Json
          birth_profile_id?: string
          contract_version?: string
          created_at?: string
          engine?: string
          fingerprint?: string
          houses?: Json
          id?: string
          positions?: Json
          uncertainty?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_snapshots_birth_profile_id_fkey"
            columns: ["birth_profile_id"]
            isOneToOne: false
            referencedRelation: "birth_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          created_at: string
          day: string
          energy: number | null
          id: string
          mood: number | null
          note_ct: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          energy?: number | null
          id?: string
          mood?: number | null
          note_ct?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          energy?: number | null
          id?: string
          mood?: number | null
          note_ct?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_releases: {
        Row: {
          bundle: Json
          checksum: string
          created_at: string
          id: string
          is_active: boolean
          version: string
        }
        Insert: {
          bundle: Json
          checksum: string
          created_at?: string
          id?: string
          is_active?: boolean
          version: string
        }
        Update: {
          bundle?: Json
          checksum?: string
          created_at?: string
          id?: string
          is_active?: boolean
          version?: string
        }
        Relationships: []
      }
      context_signals: {
        Row: {
          captured_at: string
          confidence: number
          expires_at: string
          id: string
          source_id: string
          user_id: string
          value: Json
        }
        Insert: {
          captured_at?: string
          confidence?: number
          expires_at?: string
          id?: string
          source_id: string
          user_id: string
          value?: Json
        }
        Update: {
          captured_at?: string
          confidence?: number
          expires_at?: string
          id?: string
          source_id?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      cycle_instances: {
        Row: {
          aspect: string
          computed_for: string
          created_at: string
          cycle_key: string
          domain: string
          egress_at: string | null
          exact_at: string | null
          id: string
          importance: number
          ingress_at: string | null
          natal_point: string
          orb: number
          phase: string
          snapshot_id: string
          transit_body: string
          user_id: string
        }
        Insert: {
          aspect: string
          computed_for: string
          created_at?: string
          cycle_key: string
          domain?: string
          egress_at?: string | null
          exact_at?: string | null
          id?: string
          importance?: number
          ingress_at?: string | null
          natal_point: string
          orb?: number
          phase?: string
          snapshot_id: string
          transit_body: string
          user_id: string
        }
        Update: {
          aspect?: string
          computed_for?: string
          created_at?: string
          cycle_key?: string
          domain?: string
          egress_at?: string | null
          exact_at?: string | null
          id?: string
          importance?: number
          ingress_at?: string | null
          natal_point?: string
          orb?: number
          phase?: string
          snapshot_id?: string
          transit_body?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_instances_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "chart_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_readings: {
        Row: {
          body_ct: string
          confidence: string
          created_at: string
          headline: string
          id: string
          idempotency_key: string
          primary_cycle_key: string | null
          prompt: string | null
          reading_date: string
          release_version: string | null
          snapshot_id: string | null
          user_id: string
        }
        Insert: {
          body_ct: string
          confidence?: string
          created_at?: string
          headline: string
          id?: string
          idempotency_key: string
          primary_cycle_key?: string | null
          prompt?: string | null
          reading_date: string
          release_version?: string | null
          snapshot_id?: string | null
          user_id: string
        }
        Update: {
          body_ct?: string
          confidence?: string
          created_at?: string
          headline?: string
          id?: string
          idempotency_key?: string
          primary_cycle_key?: string | null
          prompt?: string | null
          reading_date?: string
          release_version?: string | null
          snapshot_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_readings_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "chart_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      life_events: {
        Row: {
          created_at: string
          domain: string
          id: string
          label_ct: string
          occurred_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string
          id?: string
          label_ct: string
          occurred_on: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          label_ct?: string
          occurred_on?: string
          user_id?: string
        }
        Relationships: []
      }
      natal_features: {
        Row: {
          created_at: string
          family: string
          feature_key: string
          id: string
          payload: Json
          snapshot_id: string
          strength: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family: string
          feature_key: string
          id?: string
          payload?: Json
          snapshot_id: string
          strength?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          family?: string
          feature_key?: string
          id?: string
          payload?: Json
          snapshot_id?: string
          strength?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "natal_features_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "chart_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          depth_pref: string
          display_name: string | null
          id: string
          onboarded_at: string | null
          tone_pref: string
          updated_at: string
          wrapped_dek: string | null
        }
        Insert: {
          created_at?: string
          depth_pref?: string
          display_name?: string | null
          id: string
          onboarded_at?: string | null
          tone_pref?: string
          updated_at?: string
          wrapped_dek?: string | null
        }
        Update: {
          created_at?: string
          depth_pref?: string
          display_name?: string | null
          id?: string
          onboarded_at?: string | null
          tone_pref?: string
          updated_at?: string
          wrapped_dek?: string | null
        }
        Relationships: []
      }
      reading_feedback: {
        Row: {
          created_at: string
          id: string
          labels: string[]
          note_ct: string | null
          reading_id: string
          resonance: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: string[]
          note_ct?: string | null
          reading_id: string
          resonance: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          labels?: string[]
          note_ct?: string | null
          reading_id?: string
          resonance?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_feedback_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "daily_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sources: {
        Row: {
          detail: Json
          id: string
          label: string
          lane: string
          reading_id: string
          source_id: string
          user_id: string
        }
        Insert: {
          detail?: Json
          id?: string
          label: string
          lane: string
          reading_id: string
          source_id: string
          user_id: string
        }
        Update: {
          detail?: Json
          id?: string
          label?: string
          lane?: string
          reading_id?: string
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sources_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "daily_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      source_consents: {
        Row: {
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          revoked_at: string | null
          source_id: string
          tier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          source_id: string
          tier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          source_id?: string
          tier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
