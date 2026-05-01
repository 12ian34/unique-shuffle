import { Achievement, Deck, LocalAchievement, LocalProfile, LocalSavedShuffle, Pattern } from '@/types'
import { generateRandomString } from './utils'

export const LOCAL_PROFILE_STORAGE_KEY = 'unique-shuffle-profile-v1'

interface RecordShuffleResult {
  profile: LocalProfile
  shuffle: LocalSavedShuffle
  newAchievements: Achievement[]
  repeatedAchievements: Achievement[]
}

function nowIso() {
  return new Date().toISOString()
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function createProfileId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `local_${generateRandomString(16)}`
}

function createLocalShuffleId() {
  return `shuffle_${generateRandomString(16)}`
}

function getNextStreak(profile: LocalProfile) {
  const today = todayIsoDate()

  if (profile.last_shuffle_date === today) {
    return profile.shuffle_streak
  }

  if (!profile.last_shuffle_date) {
    return 1
  }

  const previous = new Date(`${profile.last_shuffle_date}T00:00:00.000Z`)
  const current = new Date(`${today}T00:00:00.000Z`)
  const daysSinceLastShuffle = Math.round(
    (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000)
  )

  return daysSinceLastShuffle === 1 ? profile.shuffle_streak + 1 : 1
}

export function createDefaultLocalProfile(): LocalProfile {
  const timestamp = nowIso()

  return {
    schema_version: 1,
    profile_id: createProfileId(),
    display_name: `shuffler-${generateRandomString(5)}`,
    created_at: timestamp,
    updated_at: timestamp,
    total_shuffles: 0,
    shuffle_streak: 0,
    last_shuffle_date: null,
    earned_achievements: [],
    saved_shuffles: [],
  }
}

function isLocalProfile(value: unknown): value is LocalProfile {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<LocalProfile>

  return (
    candidate.schema_version === 1 &&
    typeof candidate.profile_id === 'string' &&
    typeof candidate.display_name === 'string' &&
    typeof candidate.total_shuffles === 'number' &&
    typeof candidate.shuffle_streak === 'number' &&
    Array.isArray(candidate.earned_achievements) &&
    Array.isArray(candidate.saved_shuffles)
  )
}

export function loadLocalProfile(): LocalProfile {
  if (typeof window === 'undefined') {
    return createDefaultLocalProfile()
  }

  const raw = window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY)
  if (!raw) {
    return createDefaultLocalProfile()
  }

  try {
    const parsed = JSON.parse(raw)
    if (isLocalProfile(parsed)) {
      return parsed
    }
  } catch {
    // Fall through to a fresh profile if the stored blob is corrupt.
  }

  return createDefaultLocalProfile()
}

export function saveLocalProfile(profile: LocalProfile) {
  window.localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export function parseLocalProfileExport(raw: string): LocalProfile {
  const parsed = JSON.parse(raw)

  if (!isLocalProfile(parsed)) {
    throw new Error('This file is not a valid Unique Shuffle profile export.')
  }

  return {
    ...parsed,
    updated_at: nowIso(),
  }
}

export function recordLocalShuffle(
  profile: LocalProfile,
  cards: Deck,
  patterns: Pattern[],
  achievements: Achievement[]
): RecordShuffleResult {
  const timestamp = nowIso()
  const nextTotalShuffles = profile.total_shuffles + 1
  const nextStreak = getNextStreak(profile)
  const localShuffleId = createLocalShuffleId()
  const existingAchievements = new Map(
    profile.earned_achievements.map((achievement) => [achievement.achievement_id, achievement])
  )
  const newAchievements: Achievement[] = []
  const repeatedAchievements: Achievement[] = []
  const earnedAchievements: LocalAchievement[] = [...profile.earned_achievements]

  for (const achievement of achievements) {
    const existing = existingAchievements.get(achievement.id)

    if (existing) {
      repeatedAchievements.push(achievement)
      earnedAchievements.splice(
        earnedAchievements.findIndex((entry) => entry.achievement_id === achievement.id),
        1,
        {
          ...existing,
          count: existing.count + 1,
        }
      )
    } else {
      newAchievements.push(achievement)
      earnedAchievements.push({
        id: `achievement_${generateRandomString(16)}`,
        achievement_id: achievement.id,
        achieved_at: timestamp,
        local_shuffle_id: localShuffleId,
        count: 1,
      })
    }
  }

  const shuffle: LocalSavedShuffle = {
    local_id: localShuffleId,
    cards,
    patterns,
    achievement_ids: achievements.map((achievement) => achievement.id),
    created_at: timestamp,
    is_saved: achievements.length > 0,
    is_shared: false,
    share_code: null,
  }

  const savedShuffles = shuffle.is_saved ? [shuffle, ...profile.saved_shuffles] : profile.saved_shuffles

  return {
    profile: {
      ...profile,
      total_shuffles: nextTotalShuffles,
      shuffle_streak: nextStreak,
      last_shuffle_date: todayIsoDate(),
      earned_achievements: earnedAchievements,
      saved_shuffles: savedShuffles,
      updated_at: timestamp,
    },
    shuffle,
    newAchievements,
    repeatedAchievements,
  }
}

export function saveLocalShuffle(profile: LocalProfile, shuffle: LocalSavedShuffle): LocalProfile {
  const existingIndex = profile.saved_shuffles.findIndex((entry) => entry.local_id === shuffle.local_id)
  const savedShuffle = { ...shuffle, is_saved: true }
  const savedShuffles = [...profile.saved_shuffles]

  if (existingIndex >= 0) {
    savedShuffles[existingIndex] = savedShuffle
  } else {
    savedShuffles.unshift(savedShuffle)
  }

  return {
    ...profile,
    saved_shuffles: savedShuffles,
    updated_at: nowIso(),
  }
}

export function removeLocalShuffle(profile: LocalProfile, localId: string): LocalProfile {
  return {
    ...profile,
    saved_shuffles: profile.saved_shuffles.filter((shuffle) => shuffle.local_id !== localId),
    updated_at: nowIso(),
  }
}

export function markLocalShuffleShared(
  profile: LocalProfile,
  localId: string,
  shareCode: string
): LocalProfile {
  return {
    ...profile,
    saved_shuffles: profile.saved_shuffles.map((shuffle) =>
      shuffle.local_id === localId
        ? {
            ...shuffle,
            is_shared: true,
            share_code: shareCode,
            shared_at: nowIso(),
          }
        : shuffle
    ),
    updated_at: nowIso(),
  }
}
