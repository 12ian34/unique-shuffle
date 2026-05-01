import { UserProfileRow } from '@/lib/db/schema'

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function getNextShuffleStats(profile: UserProfileRow) {
  const now = new Date()
  const today = dateOnly(now)
  const yesterday = dateOnly(addDays(now, -1))

  let shuffleStreak = 1

  if (profile.lastShuffleDate === today) {
    shuffleStreak = profile.shuffleStreak
  } else if (profile.lastShuffleDate === yesterday) {
    shuffleStreak = profile.shuffleStreak + 1
  }

  return {
    totalShuffles: profile.totalShuffles + 1,
    shuffleStreak,
    lastShuffleDate: today,
    updatedAt: now.toISOString(),
  }
}
