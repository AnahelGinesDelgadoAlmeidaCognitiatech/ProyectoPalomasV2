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
      autocomplete: {
        Row: {
          category: string
          id: string
          user_id: string
          value: string
        }
        Insert: {
          category: string
          id?: string
          user_id?: string
          value: string
        }
        Update: {
          category?: string
          id?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "autocomplete_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          country_prefix: string
          id: string
          pigeon_id: string
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          country_prefix: string
          id?: string
          pigeon_id: string
          updated_at?: string | null
          user_id?: string
          year: number
        }
        Update: {
          country_prefix?: string
          id?: string
          pigeon_id?: string
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "bands_pigeon_id_fkey"
            columns: ["pigeon_id"]
            isOneToOne: false
            referencedRelation: "pigeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          id: string
          target_id: string
          target_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          id?: string
          target_id: string
          target_type: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          content?: string
          id?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          country: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          country?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      filters: {
        Row: {
          config: Json
          id: string
          module: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config: Json
          id?: string
          module: string
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          config?: Json
          id?: string
          module?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal: {
        Row: {
          content: string | null
          date: string
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          date: string
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          content?: string | null
          date?: string
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lofts: {
        Row: {
          id: string
          is_primary: boolean | null
          lat: number | null
          lng: number | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lofts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_pigeons: {
        Row: {
          medication_id: string
          pigeon_id: string
        }
        Insert: {
          medication_id: string
          pigeon_id: string
        }
        Update: {
          medication_id?: string
          pigeon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_pigeons_medication_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_pigeons_pigeon_fkey"
            columns: ["pigeon_id"]
            isOneToOne: false
            referencedRelation: "pigeons"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          date: string
          id: string
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          date?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pairs: {
        Row: {
          cock_id: string
          hen_id: string
          id: string
          nest_box: string | null
          notes: string | null
          season_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cock_id: string
          hen_id: string
          id?: string
          nest_box?: string | null
          notes?: string | null
          season_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          cock_id?: string
          hen_id?: string
          id?: string
          nest_box?: string | null
          notes?: string | null
          season_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairs_cock_id_fkey"
            columns: ["cock_id"]
            isOneToOne: false
            referencedRelation: "pigeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairs_hen_id_fkey"
            columns: ["hen_id"]
            isOneToOne: false
            referencedRelation: "pigeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pigeons: {
        Row: {
          born_year: number | null
          breeder: string | null
          color: string | null
          father_id: string | null
          id: string
          image: string | null
          loft_id: string | null
          mother_id: string | null
          name: string | null
          notes: string | null
          races: number | null
          ring_number: string
          sex: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          wins: number | null
        }
        Insert: {
          born_year?: number | null
          breeder?: string | null
          color?: string | null
          father_id?: string | null
          id?: string
          image?: string | null
          loft_id?: string | null
          mother_id?: string | null
          name?: string | null
          notes?: string | null
          races?: number | null
          ring_number: string
          sex?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          wins?: number | null
        }
        Update: {
          born_year?: number | null
          breeder?: string | null
          color?: string | null
          father_id?: string | null
          id?: string
          image?: string | null
          loft_id?: string | null
          mother_id?: string | null
          name?: string | null
          notes?: string | null
          races?: number | null
          ring_number?: string
          sex?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pigeons_father_id_fkey"
            columns: ["father_id"]
            isOneToOne: false
            referencedRelation: "pigeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pigeons_loft_id_fkey"
            columns: ["loft_id"]
            isOneToOne: false
            referencedRelation: "lofts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pigeons_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "pigeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pigeons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      race_results: {
        Row: {
          id: string
          pigeon_id: string
          position: number | null
          race_id: string
          speed: number | null
        }
        Insert: {
          id?: string
          pigeon_id: string
          position?: number | null
          race_id: string
          speed?: number | null
        }
        Update: {
          id?: string
          pigeon_id?: string
          position?: number | null
          race_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "race_results_pigeon_fkey"
            columns: ["pigeon_id"]
            isOneToOne: false
            referencedRelation: "pigeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_results_race_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          date: string
          distance_km: number | null
          id: string
          name: string
          station_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          date: string
          distance_km?: number | null
          id?: string
          name: string
          station_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          date?: string
          distance_km?: number | null
          id?: string
          name?: string
          station_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "races_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "races_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          id: string
          name: string | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id?: string
          year: number
        }
        Update: {
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          user_id: string
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          user_id?: string
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          country: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          country?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
