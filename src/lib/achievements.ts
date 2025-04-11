import { Achievement, UserStats } from '@/types'
import { getCardKey } from '@/lib/cards'

// Achievement categories
export enum AchievementCategory {
  SHUFFLE_COUNT = 'shuffle_count',
  SHUFFLE_PATTERNS = 'shuffle_patterns',
  TIME_BASED = 'time_based',
  STREAKS = 'streaks',
  SPECIAL_SHUFFLES = 'special_shuffles',
  MILESTONES = 'milestones',
  POP_CULTURE = 'pop_culture',
  QUIRKY = 'quirky',
}

// Define available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Shuffle count achievements
  {
    id: 'shuffle_10',
    name: 'Novice Shuffler',
    description: 'Complete 10 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 10,
    category: AchievementCategory.SHUFFLE_COUNT,
  },
  {
    id: 'shuffle_50',
    name: 'Card Enthusiast',
    description: 'Complete 50 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 50,
    category: AchievementCategory.SHUFFLE_COUNT,
  },
  {
    id: 'shuffle_100',
    name: 'Shuffle Master',
    description: 'Complete 100 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 100,
    category: AchievementCategory.SHUFFLE_COUNT,
  },
  {
    id: 'shuffle_250',
    name: 'Deck Dominator',
    description: 'Complete 250 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 250,
    category: AchievementCategory.SHUFFLE_COUNT,
  },
  {
    id: 'shuffle_500',
    name: 'Card Connoisseur',
    description: 'Complete 500 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 500,
    category: AchievementCategory.SHUFFLE_COUNT,
  },
  {
    id: 'shuffle_1000',
    name: 'Legendary Shuffler',
    description: 'Complete 1000 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 1000,
    category: AchievementCategory.SHUFFLE_COUNT,
  },

  // Streak achievements
  {
    id: 'streak_3',
    name: 'Consistent Shuffler',
    description: 'Maintain a 3-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 3,
    category: AchievementCategory.STREAKS,
  },
  {
    id: 'streak_7',
    name: 'Weekly Devotee',
    description: 'Maintain a 7-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 7,
    category: AchievementCategory.STREAKS,
  },
  {
    id: 'streak_14',
    name: 'Card Aficionado',
    description: 'Maintain a 14-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 14,
    category: AchievementCategory.STREAKS,
  },
  {
    id: 'streak_30',
    name: 'Dedicated Shuffler',
    description: 'Maintain a 30-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 30,
    category: AchievementCategory.STREAKS,
  },
  {
    id: 'streak_90',
    name: 'Seasonal Devotee',
    description: 'Maintain a 90-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 90,
    category: AchievementCategory.STREAKS,
  },
  {
    id: 'streak_365',
    name: 'Year-Round Shuffler',
    description: 'Maintain a 365-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 365,
    category: AchievementCategory.STREAKS,
  },

  // Special shuffle patterns (can only be achieved by repeated shuffling)
  {
    id: 'triple_aces_first',
    name: 'Triple Aces',
    description: 'Get 3 Aces in the first 5 cards of your shuffle',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'sequential_shuffle',
    name: 'Sequential Genius',
    description: 'Get 3 consecutive cards of the same suit in sequence',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'three_pairs',
    name: 'Three Pairs',
    description: 'Get 3 pairs of the same value in a single shuffle',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'symmetric_shuffle',
    name: 'Symmetric Shuffle',
    description: 'Get a shuffle with perfect red/black alternating pattern',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'rainbow_shuffle',
    name: 'Rainbow Shuffle',
    description: 'Get all four suits in the first four cards',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'royal_flush',
    name: 'Royal Flush',
    description:
      'Get a royal flush (A, K, Q, J, 10 of the same suit) in order somewhere in your shuffle',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'lady_luck',
    name: 'Lady Luck',
    description: 'Get all the Queens in the first 10 cards',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'suited_up',
    name: 'Suited Up',
    description: 'Get 5 cards of the same suit in a row',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'even_steven',
    name: 'Even Steven',
    description: 'Get only even-numbered cards in the first 5 cards',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'ace_hunter',
    name: 'Ace Hunter',
    description: 'Get all 4 Aces in a single shuffle',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },

  // Special shuffle achievements
  {
    id: 'midnight_shuffle',
    name: 'Midnight Shuffler',
    description: 'Complete a shuffle between midnight and 3 AM',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'morning_routine',
    name: 'Morning Routine',
    description: 'Complete shuffles on 5 consecutive mornings',
    condition: (stats: UserStats) => {
      // Placeholder - requires streak tracking
      return false
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete shuffles on 3 consecutive weekends',
    condition: (stats: UserStats) => {
      // Placeholder - requires streak tracking
      return false
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'shuffle_sprint',
    name: 'Shuffle Sprint',
    description: 'Complete 5 shuffles within one hour',
    condition: (stats: UserStats) => {
      // Placeholder - would need timestamp tracking
      return stats.total_shuffles >= 25
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'daily_double',
    name: 'Daily Double',
    description: 'Complete exactly 2 shuffles per day for 5 consecutive days',
    condition: (stats: UserStats) => {
      // Placeholder - requires streak tracking
      return false
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'quick_draw',
    name: 'Quick Draw',
    description: 'Complete a shuffle in under 5 seconds',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete shuffles between 10 PM and 4 AM for 5 consecutive days',
    condition: (stats: UserStats) => {
      // Placeholder - requires streak tracking
      return false
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },

  // Time-based achievements
  {
    id: 'new_year_shuffle',
    name: 'New Year Shuffle',
    description: "Complete a shuffle on New Year's Day",
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'monday_blues',
    name: 'Monday Blues',
    description: 'Complete shuffles on 4 consecutive Mondays',
    condition: (stats: UserStats) => {
      // Placeholder - requires streak tracking
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'leap_day',
    name: 'Leap of Faith',
    description: 'Complete a shuffle on February 29 (Leap Day)',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'shuffle_marathon',
    name: 'Shuffle Marathon',
    description: 'Shuffle at least once every hour for 12 consecutive hours',
    condition: (stats: UserStats) => {
      // Placeholder - requires streak tracking
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'holiday_shuffle',
    name: 'Holiday Shuffler',
    description: 'Complete shuffles on 3 different holidays',
    condition: (stats: UserStats) => {
      // Placeholder - requires holiday tracking
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'friday_13',
    name: 'Friday the 13th',
    description: 'Complete a shuffle on Friday the 13th',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'shuffle_o_clock',
    name: "Shuffle o'Clock",
    description: 'Complete a shuffle at exactly XX:00 (top of the hour)',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'palindrome_shuffle',
    name: 'Palindrome Shuffle',
    description: 'Complete a shuffle on a palindrome date (like 2/22/22)',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.TIME_BASED,
  },

  // Milestone achievements
  {
    id: 'first_shuffle',
    name: 'First Steps',
    description: 'Complete your first shuffle',
    condition: (stats: UserStats) => stats.total_shuffles >= 1,
    category: AchievementCategory.MILESTONES,
  },
  {
    id: 'five_in_a_day',
    name: 'Daily Dedication',
    description: 'Complete 5 shuffles in a single day',
    condition: (stats: UserStats) => {
      // This is a placeholder - actual implementation would need timestamps
      // Require a decent number of shuffles
      return stats.total_shuffles >= 15
    },
    category: AchievementCategory.MILESTONES,
  },
  {
    id: 'seven_days',
    name: 'Seven Days',
    description: 'Shuffle every day for a week',
    condition: (stats: UserStats) => stats.shuffle_streak >= 7,
    category: AchievementCategory.MILESTONES,
  },
  {
    id: 'persistence',
    name: 'Persistence',
    description: 'Return to shuffling after missing a day in your streak',
    condition: (stats: UserStats) => {
      // This requires tracking previous streak breaks
      // For now, assume anyone with enough shuffles has probably done this
      return stats.total_shuffles >= 30
    },
    category: AchievementCategory.MILESTONES,
  },
  {
    id: 'shuffle_addict',
    name: 'Shuffle Addict',
    description: 'Complete at least one shuffle every day for a month',
    condition: (stats: UserStats) => stats.shuffle_streak >= 30,
    category: AchievementCategory.MILESTONES,
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Unlock 25% of all available achievements',
    condition: (stats: UserStats) => {
      // This achievement is now managed by the achievements API
      return false
    },
    category: AchievementCategory.MILESTONES,
  },
  {
    id: 'achievement_hunter',
    name: 'Achievement Hunter',
    description: 'Unlock 50% of all available achievements',
    condition: (stats: UserStats) => {
      // This achievement is now managed by the achievements API
      return false
    },
    category: AchievementCategory.MILESTONES,
  },
  {
    id: 'shuffle_legend',
    name: 'Shuffle Legend',
    description: 'Unlock 75% of all available achievements',
    condition: (stats: UserStats) => {
      // This achievement is now managed by the achievements API
      return false
    },
    category: AchievementCategory.MILESTONES,
  },

  // Pop culture references
  {
    id: 'perfect_shuffle',
    name: 'Perfect Shuffle',
    description: 'Shuffle and get cards in perfect sequential order',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.POP_CULTURE,
  },
  {
    id: 'agent_007',
    name: '007',
    description: 'Get the 7 of spades in the 7th position',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.POP_CULTURE,
  },
  {
    id: 'blackjack',
    name: 'Blackjack!',
    description: 'Get exactly 21 as the sum of the first two cards (Ace + 10/J/Q/K)',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.POP_CULTURE,
  },

  // Quirky achievements
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Get 5 face cards in a row in your shuffle',
    condition: (stats: UserStats) => {
      // Placeholder - actual implementation uses user_achievements table
      return false
    },
    category: AchievementCategory.QUIRKY,
  },
  {
    id: 'deck_inspector',
    name: 'Deck Inspector',
    description: 'View the stats page 10 times',
    condition: (stats: UserStats) => {
      // The real implementation would track page views
      return false
    },
    category: AchievementCategory.QUIRKY,
  },
]

// Function to check which achievements a user has earned
// Note: This only handles count-based achievements
// Pattern-based achievements are handled by the achievements API
export function getUnlockedAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.condition(stats))
}

// This function is now superseded by the achievements API
// Kept for backward compatibility
export async function updateUserAchievements(
  supabaseAdmin: any,
  userId: string,
  stats: UserStats
): Promise<{ achievements: Achievement[]; updated: boolean }> {
  try {
    // Get user's current achievements
    const { data: currentEntry } = await supabaseAdmin
      .from('leaderboard')
      .select('achievements_count')
      .eq('user_id', userId)
      .single()

    // Get count-based achievements (pattern-based are handled separately)
    const countBasedAchievements = getUnlockedAchievements(stats)

    // Get pattern-based achievements
    const { data: patternAchievements, error: patternError } = await supabaseAdmin
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    if (patternError) {
      console.error('Error fetching pattern achievements:', patternError)
      // Continue even if there's an error - we can still update count-based achievements
    }

    // Define interface for pattern achievement data
    interface PatternAchievement {
      achievement_id: string
    }

    // Extract achievement IDs from pattern achievements
    const patternAchievementIds = (patternAchievements || []).map(
      (item: PatternAchievement) => item.achievement_id
    )

    // Combine both types of achievements
    const countBasedAchievementIds = countBasedAchievements.map((achievement) => achievement.id)
    const uniqueAchievementSet = new Set([...countBasedAchievementIds, ...patternAchievementIds])
    const allAchievementIds = Array.from(uniqueAchievementSet)

    // Map IDs back to full achievement objects
    const allAchievements = allAchievementIds
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
      .filter(Boolean) as Achievement[] // Remove any undefined entries

    // If the number of achievements has changed, update the database
    if (allAchievements.length !== (currentEntry?.achievements_count || 0)) {
      const { error } = await supabaseAdmin
        .from('leaderboard')
        .update({ achievements_count: allAchievements.length })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating achievements count:', error)
        return { achievements: allAchievements, updated: false }
      }

      return { achievements: allAchievements, updated: true }
    }

    return { achievements: allAchievements, updated: false }
  } catch (error) {
    console.error('Error updating achievements:', error)
    return { achievements: [], updated: false }
  }
}
