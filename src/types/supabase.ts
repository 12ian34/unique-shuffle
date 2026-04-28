export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type DbSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
type DbRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
type DbColor = 'red' | 'black'

interface DbCard {
  suit: DbSuit
  rank: DbRank
  value: number
  color: DbColor
  index: number
}

type DbDeck = DbCard[]

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
        Relationships: []
      }
      shuffles: {
        Row: {
          id: string
          user_id: string | null
          cards: DbDeck
          is_saved: boolean
          is_shared: boolean
          share_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          cards: DbDeck
          is_saved?: boolean
          is_shared?: boolean
          share_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          cards?: DbDeck
          is_saved?: boolean
          is_shared?: boolean
          share_code?: string | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_shared_shuffle_views: {
        Args: {
          shuffle_id_param: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
