export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          total_shuffles: number
          shuffle_streak: number
          last_shuffle_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          total_shuffles?: number
          shuffle_streak?: number
          last_shuffle_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          total_shuffles?: number
          shuffle_streak?: number
          last_shuffle_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shuffles: {
        Row: {
          id: string
          user_id: string | null
          cards: Json
          is_saved: boolean
          is_shared: boolean
          share_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          cards: Json
          is_saved?: boolean
          is_shared?: boolean
          share_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          cards?: Json
          is_saved?: boolean
          is_shared?: boolean
          share_code?: string | null
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          shuffle_id: string | null
          achieved_at: string
          count: number
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          shuffle_id?: string | null
          achieved_at?: string
          count?: number
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          shuffle_id?: string | null
          achieved_at?: string
          count?: number
        }
      }
      shared_shuffles: {
        Row: {
          id: string
          shuffle_id: string
          views: number
          last_viewed_at: string
        }
        Insert: {
          id?: string
          shuffle_id: string
          views?: number
          last_viewed_at?: string
        }
        Update: {
          id?: string
          shuffle_id?: string
          views?: number
          last_viewed_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
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
  }
}
