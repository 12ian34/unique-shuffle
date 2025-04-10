export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      leaderboard: {
        Row: {
          user_id: string
          username: string
          total_shuffles: number
          shuffle_streak: number
          achievements_count: number
          updated_at: string
        }
        Insert: {
          user_id: string
          username?: string
          total_shuffles?: number
          shuffle_streak?: number
          achievements_count?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          username?: string
          total_shuffles?: number
          shuffle_streak?: number
          achievements_count?: number
          updated_at?: string
        }
      }
      shuffles: {
        Row: {
          id: number
          user_id: string
          cards: Json
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          cards: Json
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          cards?: Json
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
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
