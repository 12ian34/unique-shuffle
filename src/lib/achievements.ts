import { Achievement, UserStats } from '@/types'

// Achievement categories
export enum AchievementCategory {
  SHUFFLE_COUNT = 'shuffle_count',
  UNIQUE_CARDS = 'unique_cards',
  SPECIAL_COMBINATIONS = 'special_combinations',
}

// Define available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Shuffle count achievements
  {
    id: 'shuffle_10',
    name: 'Novice Shuffler',
    description: 'Complete 10 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 10,
  },
  {
    id: 'shuffle_50',
    name: 'Card Enthusiast',
    description: 'Complete 50 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 50,
  },
  {
    id: 'shuffle_100',
    name: 'Shuffle Master',
    description: 'Complete 100 shuffles',
    condition: (stats: UserStats) => stats.total_shuffles >= 100,
  },

  // Streak achievements
  {
    id: 'streak_3',
    name: 'Consistent Shuffler',
    description: 'Maintain a 3-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Weekly Devotee',
    description: 'Maintain a 7-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 7,
  },
  {
    id: 'streak_14',
    name: 'Card Aficionado',
    description: 'Maintain a 14-day shuffle streak',
    condition: (stats: UserStats) => stats.shuffle_streak >= 14,
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
