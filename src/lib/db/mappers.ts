import { AchievementRow, ShuffleRow, UserProfileRow } from './schema'
import { DbAchievement, DbShuffle, DbUser } from '@/types'

export function toDbUser(profile: UserProfileRow): DbUser {
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    total_shuffles: profile.totalShuffles,
    shuffle_streak: profile.shuffleStreak,
    last_shuffle_date: profile.lastShuffleDate,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  }
}

export function toDbShuffle(shuffle: ShuffleRow): DbShuffle {
  return {
    id: shuffle.id,
    user_id: shuffle.userId,
    cards: shuffle.cards,
    is_saved: shuffle.isSaved,
    is_shared: shuffle.isShared,
    share_code: shuffle.shareCode,
    created_at: shuffle.createdAt,
  }
}

export function toDbAchievement(achievement: AchievementRow): DbAchievement {
  return {
    id: achievement.id,
    user_id: achievement.userId,
    achievement_id: achievement.achievementId,
    shuffle_id: achievement.shuffleId,
    achieved_at: achievement.achievedAt,
    count: achievement.count,
  }
}
