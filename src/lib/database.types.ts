export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      canvas_blocks: {
        Row: {
          id: string
          canvas_id: string
          user_id: string
          type: string | null
          content: string
          order_index: number
          position_x: number
          position_y: number
          meta: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          canvas_id: string
          user_id: string
          type?: string | null
          content: string
          order_index?: number
          position_x?: number
          position_y?: number
          meta?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          canvas_id?: string
          user_id?: string
          type?: string | null
          content?: string
          order_index?: number
          position_x?: number
          position_y?: number
          meta?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_blocks_canvas_id_fkey"
            columns: ["canvas_id"]
            referencedRelation: "canvas_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_blocks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      canvas_edges: {
        Row: {
          id: string
          canvas_id: string
          user_id: string
          source_block_id: string
          target_block_id: string
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          canvas_id: string
          user_id: string
          source_block_id: string
          target_block_id: string
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          canvas_id?: string
          user_id?: string
          source_block_id?: string
          target_block_id?: string
          label?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_edges_canvas_id_fkey"
            columns: ["canvas_id"]
            referencedRelation: "canvas_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_source_block_id_fkey"
            columns: ["source_block_id"]
            referencedRelation: "canvas_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_target_block_id_fkey"
            columns: ["target_block_id"]
            referencedRelation: "canvas_blocks"
            referencedColumns: ["id"]
          }
        ]
      }
      canvas_sessions: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      idea_kernels: {
        Row: {
          id: string
          user_id: string
          input_type: string
          input_data: string
          kernels: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_type?: string
          input_data: string
          kernels: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_type?: string
          input_data?: string
          kernels?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_kernels_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          profile_name: string
          niche: string | null
          tone_config: Json | null
          samples: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_name?: string
          niche?: string | null
          tone_config?: Json | null
          samples?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_name?: string
          niche?: string | null
          tone_config?: Json | null
          samples?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scheduled_posts: {
        Row: {
          id: string
          user_id: string
          content_blocks: Json
          channel: string
          scheduled_time: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_blocks: Json
          channel: string
          scheduled_time: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_blocks?: Json
          channel?: string
          scheduled_time?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          clerk_id: string
          stripe_customer_id: string | null
          flutterwave_customer_id: string | null
          flutterwave_transaction_ref: string | null
          flutterwave_plan_id: string | null
          subscription_status: string | null
          current_period_end: string | null
          subscription_plan: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          clerk_id: string
          stripe_customer_id?: string | null
          flutterwave_customer_id?: string | null
          flutterwave_transaction_ref?: string | null
          flutterwave_plan_id?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          subscription_plan?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          clerk_id?: string
          stripe_customer_id?: string | null
          flutterwave_customer_id?: string | null
          flutterwave_transaction_ref?: string | null
          flutterwave_plan_id?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          subscription_plan?: string | null
          created_at?: string
        }
        Relationships: []
      }
      saved_campaigns: {
        Row: {
          id: string
          user_id: string
          topic: string
          platform: string
          tone: string
          posts: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          platform: string
          tone: string
          posts: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          platform?: string
          tone?: string
          posts?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_campaigns_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string | null
          price_id: string | null
          cancel_at_period_end: boolean | null
          current_period_end: string | null
          created_at: string
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
        }
        Insert: {
          id: string
          user_id: string
          status?: string | null
          price_id?: string | null
          cancel_at_period_end?: boolean | null
          current_period_end?: string | null
          created_at?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: string | null
          price_id?: string | null
          cancel_at_period_end?: boolean | null
          current_period_end?: string | null
          created_at?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          metric: string
          count: number
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric: string
          count?: number
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric?: string
          count?: number
          period_start?: string
          period_end?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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