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
          niche: string | null
          tone_config: Json | null
          samples: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          niche?: string | null
          tone_config?: Json | null
          samples?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          niche?: string | null
          tone_config?: Json | null
          samples?: Json | null
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
          _id: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          _id: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          _id?: string
          created_at?: string
        }
        Relationships: []
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