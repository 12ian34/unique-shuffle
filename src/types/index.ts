import { Database } from './supabase'

export type DbUser = Database['public']['Tables']['users']['Row']
export type DbShuffle = Database['public']['Tables']['shuffles']['Row']
export type DbAchievement = Database['public']['Tables']['achievements']['Row']
export type DbSharedShuffle = Database['public']['Tables']['shared_shuffles']['Row']
export type DbFriend = Database['public']['Tables']['friends']['Row']

// Card types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
export type Color = 'red' | 'black'

export interface Card {
  suit: Suit
  rank: Rank
  value: number
  color: Color
  index: number
}

export type Deck = Card[]

// Pattern types
export interface Pattern {
  id: string
  name: string
  description: string
  indices?: number[]
  type: PatternType
}

export type PatternType =
  | 'sequence'
  | 'straight'
  | 'flush'
  | 'three'
  | 'four'
  | 'full_house'
  | 'poker_hand'
  | 'special'
  | 'straight_flush'
  | 'royal_flush'
  | 'two_pair'
  | 'legendary'

// Achievement types
export interface Achievement {
  id: string
  name: string
  description: string
  type: AchievementType
  criteria: AchievementCriteria
}

export type AchievementType = 'pattern' | 'time' | 'count' | 'special'

export interface AchievementCriteria {
  patternId?: string
  shuffleCount?: number
  timeRange?: {
    start?: string
    end?: string
  }
  dayOfWeek?: number[]
  timeOfDay?: {
    start: string
    end: string
  }
  special?: string
}

// User profile with stats
export interface UserProfile extends DbUser {
  achievementCount: number
  savedShuffleCount: number
}

// Shuffle with patterns
export interface ShuffleWithPatterns extends DbShuffle {
  patterns: Pattern[]
}

// Leaderboard entry
export interface LeaderboardEntry {
  userId: string
  username: string
  totalShuffles: number
  achievementCount: number
  shuffleStreak: number
}

// Type for user stats subset
export interface UserStats {
  total_shuffles: number | null
  shuffle_streak: number | null
  last_shuffle_date: string | null
}
