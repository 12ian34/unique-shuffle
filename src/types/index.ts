export interface Card {
  value: string
  suit: string
}

export interface UserStats {
  total_shuffles: number
  shuffle_streak: number
  achievements_count: number
  most_common_cards: Array<{
    card: Card
    count: number
  }>
}

export interface Achievement {
  id: string
  name: string
  description: string
  condition: (stats: UserStats) => boolean
  category?: string
}

export interface Shuffle {
  id: string
  user_id: string
  cards: Card[]
  created_at: string
}

export interface LeaderboardEntry {
  username: string
  total_shuffles: number
  shuffle_streak: number
  achievements_count: number
}
