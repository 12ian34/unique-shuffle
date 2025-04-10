export const GAME_SETTINGS = {
  MAX_SHUFFLES: 100,
  MAX_CARDS_PER_SHUFFLE: 7,
  ACHIEVEMENTS_ENABLED: true,
  LEADERBOARD_ENABLED: true,
  DEFAULT_DECK_SIZE: 52,
} as const

export const API_ENDPOINTS = {
  SHUFFLES: '/api/shuffles',
  STATS: '/api/stats',
  ACHIEVEMENTS: '/api/achievements',
  LEADERBOARD: '/api/leaderboard',
} as const

export const STORAGE_KEYS = {
  USER_STATS: 'user_stats',
  UNLOCKED_ACHIEVEMENTS: 'unlocked_achievements',
  LAST_SHUFFLE: 'last_shuffle',
} as const

export const ERROR_MESSAGES = {
  INVALID_SHUFFLE: 'Invalid shuffle configuration',
  MAX_SHUFFLES_REACHED: 'Maximum number of shuffles reached',
  INVALID_CARD_COUNT: 'Invalid number of cards requested',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const 