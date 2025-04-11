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
      // This is a placeholder - the real implementation would need to track card positions
      // This will be rare enough that we can assume it hasn't happened yet
      return stats.total_shuffles > 150
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'sequential_shuffle',
    name: 'Sequential Genius',
    description: 'Get 3 consecutive cards of the same suit in sequence',
    condition: (stats: UserStats) => {
      // This is a placeholder - the real implementation would need to track card sequences
      // This will be rare enough that we can assume it hasn't happened yet unless they've shuffled a lot
      return stats.total_shuffles > 200
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'three_pairs',
    name: 'Three Pairs',
    description: 'Get 3 pairs of the same value in a single shuffle',
    condition: (stats: UserStats) => {
      // This is a placeholder - real implementation would need specific shuffle tracking
      return stats.total_shuffles > 175
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'symmetric_shuffle',
    name: 'Symmetric Shuffle',
    description: 'Get a shuffle with perfect red/black alternating pattern',
    condition: (stats: UserStats) => {
      // This is extremely unlikely to happen naturally
      return stats.total_shuffles > 300
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },
  {
    id: 'rainbow_shuffle',
    name: 'Rainbow Shuffle',
    description: 'Get all four suits in the first four cards',
    condition: (stats: UserStats) => {
      // This is a placeholder - would need to track card positions
      return stats.total_shuffles > 120
    },
    category: AchievementCategory.SHUFFLE_PATTERNS,
  },

  // Special shuffle achievements
  {
    id: 'midnight_shuffle',
    name: 'Midnight Shuffler',
    description: 'Complete a shuffle between midnight and 3 AM',
    condition: (stats: UserStats) => {
      // This would require tracking shuffle timestamps
      // For now, treat as a rare achievement that needs more shuffles
      return stats.total_shuffles > 100
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'morning_routine',
    name: 'Morning Routine',
    description: 'Complete shuffles on 5 consecutive mornings',
    condition: (stats: UserStats) => {
      // Would need timestamp tracking
      // For now, assume this is difficult and requires both shuffles and streak
      return stats.total_shuffles > 30 && stats.shuffle_streak >= 5
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete shuffles on 3 consecutive weekends',
    condition: (stats: UserStats) => {
      // Would need timestamp and day tracking
      // For now, assume this requires longer streak
      return stats.shuffle_streak >= 15
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'shuffle_sprint',
    name: 'Shuffle Sprint',
    description: 'Complete 5 shuffles within one hour',
    condition: (stats: UserStats) => {
      // Would need timestamp tracking
      // For now, give to people who've done at least 25 shuffles
      return stats.total_shuffles >= 25
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },
  {
    id: 'daily_double',
    name: 'Daily Double',
    description: 'Complete exactly 2 shuffles per day for 5 consecutive days',
    condition: (stats: UserStats) => {
      // Would need detailed tracking of daily shuffles
      // Make this hard to achieve, requiring both streak and substantial shuffles
      return stats.shuffle_streak >= 7 && stats.total_shuffles >= 40
    },
    category: AchievementCategory.SPECIAL_SHUFFLES,
  },

  // Time-based achievements
  {
    id: 'new_year_shuffle',
    name: 'New Year Shuffle',
    description: "Complete a shuffle on New Year's Day",
    condition: (stats: UserStats) => {
      // Would need date tracking - for now make rare
      return stats.total_shuffles >= 75 && stats.shuffle_streak >= 10
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'monday_blues',
    name: 'Monday Blues',
    description: 'Complete shuffles on 4 consecutive Mondays',
    condition: (stats: UserStats) => {
      // Would need day-of-week tracking
      return stats.shuffle_streak >= 21 // About 3 weeks needed to hit 4 Mondays
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'leap_day',
    name: 'Leap of Faith',
    description: 'Complete a shuffle on February 29 (Leap Day)',
    condition: (stats: UserStats) => {
      // Super rare achievement - almost impossible to get except on leap years
      // For now, make this extremely difficult
      return stats.total_shuffles > 500 && stats.shuffle_streak > 60
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'shuffle_marathon',
    name: 'Shuffle Marathon',
    description: 'Shuffle at least once every hour for 12 consecutive hours',
    condition: (stats: UserStats) => {
      // Would need hourly tracking - for now make this very difficult
      return stats.total_shuffles >= 200
    },
    category: AchievementCategory.TIME_BASED,
  },
  {
    id: 'holiday_shuffle',
    name: 'Holiday Shuffler',
    description: 'Complete shuffles on 3 different holidays',
    condition: (stats: UserStats) => {
      // Would need holiday tracking
      return stats.total_shuffles >= 100 && stats.shuffle_streak >= 20
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
]

// Function to check which achievements a user has earned
export function getUnlockedAchievements(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.condition(stats))
}

// Function to update user achievements in the database
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

    // Calculate new achievements
    const unlockedAchievements = getUnlockedAchievements(stats)

    // If the number of achievements has changed, update the database
    if (unlockedAchievements.length !== (currentEntry?.achievements_count || 0)) {
      const { error } = await supabaseAdmin
        .from('leaderboard')
        .update({ achievements_count: unlockedAchievements.length })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating achievements count:', error)
        return { achievements: unlockedAchievements, updated: false }
      }

      return { achievements: unlockedAchievements, updated: true }
    }

    return { achievements: unlockedAchievements, updated: false }
  } catch (error) {
    console.error('Error updating achievements:', error)
    return { achievements: [], updated: false }
  }
}
