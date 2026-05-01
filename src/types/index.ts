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

export interface DbUser {
  id: string
  username: string
  email: string
  total_shuffles: number
  shuffle_streak: number
  last_shuffle_date: string | null
  created_at: string
  updated_at: string
}

export interface DbShuffle {
  id: string
  user_id: string
  cards: Deck
  is_saved: boolean
  is_shared: boolean
  share_code: string | null
  created_at: string
}

export interface DbAchievement {
  id: string
  user_id: string
  achievement_id: string
  shuffle_id: string | null
  achieved_at: string
  count: number
}

export interface DbSharedShuffle {
  id: string
  shuffle_id: string
  views: number
  last_viewed_at: string
}

export interface DbFriend {
  id: string
  user_id: string
  friend_id: string
  status: string
  created_at: string
  updated_at: string
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
