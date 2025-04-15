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
      maintenance: {
        Row: {
          last_cleaned: string
          maintenance_id: number
          next_cleaning_due: string
          product_id: number
          status: string
        }
        Insert: {
          last_cleaned: string
          maintenance_id?: number
          next_cleaning_due: string
          product_id: number
          status: string
        }
        Update: {
          last_cleaned?: string
          maintenance_id?: number
          next_cleaning_due?: string
          product_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          payment_date: string
          payment_id: number
          payment_status: string
          rental_id: number
          user_id: number
        }
        Insert: {
          amount: number
          payment_date?: string
          payment_id?: number
          payment_status: string
          rental_id: number
          user_id: number
        }
        Update: {
          amount?: number
          payment_date?: string
          payment_id?: number
          payment_status?: string
          rental_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["rental_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          available_quantity: number
          category: string
          name: string
          owner_id: number
          product_id: number
          rental_price: number
          sub_category: string
        }
        Insert: {
          available_quantity: number
          category: string
          name: string
          owner_id: number
          product_id?: number
          rental_price: number
          sub_category: string
        }
        Update: {
          available_quantity?: number
          category?: string
          name?: string
          owner_id?: number
          product_id?: number
          rental_price?: number
          sub_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rentals: {
        Row: {
          product_id: number
          rental_end: string
          rental_id: number
          rental_start: string
          renter_id: number
          status: string
          total_cost: number
        }
        Insert: {
          product_id: number
          rental_end: string
          rental_id?: number
          rental_start: string
          renter_id: number
          status: string
          total_cost: number
        }
        Update: {
          product_id?: number
          rental_end?: string
          rental_id?: number
          rental_start?: string
          renter_id?: number
          status?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "rentals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "rentals_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          product_id: number
          rating: number
          review_date: string
          review_id: number
          user_id: number
        }
        Insert: {
          comment?: string | null
          product_id: number
          rating: number
          review_date?: string
          review_id?: number
          user_id: number
        }
        Update: {
          comment?: string | null
          product_id?: number
          rating?: number
          review_date?: string
          review_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          name: string
          password: string
          phone: string
          role: string
          user_id: number
        }
        Insert: {
          email: string
          name: string
          password: string
          phone: string
          role: string
          user_id?: number
        }
        Update: {
          email?: string
          name?: string
          password?: string
          phone?: string
          role?: string
          user_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_top_rented_products: {
        Args: { limit_count: number }
        Returns: {
          product_id: number
          name: string
          category: string
          sub_category: string
          rental_price: number
          rental_count: number
        }[]
      }
      get_top_revenue_products: {
        Args: { limit_count: number }
        Returns: {
          product_id: number
          name: string
          category: string
          sub_category: string
          rental_price: number
          total_revenue: number
        }[]
      }
      get_unrented_products: {
        Args: Record<PropertyKey, never>
        Returns: {
          product_id: number
          name: string
          category: string
          sub_category: string
          rental_price: number
          available_quantity: number
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
