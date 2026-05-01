'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Achievement, Deck, LocalProfile, LocalSavedShuffle, Pattern } from '@/types'
import {
  createDefaultLocalProfile,
  loadLocalProfile,
  markLocalShuffleShared,
  parseLocalProfileExport,
  recordLocalShuffle,
  removeLocalShuffle,
  saveLocalProfile,
  saveLocalShuffle,
} from '@/lib/local-profile'

interface RecordShuffleResponse {
  shuffle: LocalSavedShuffle
  newAchievements: Achievement[]
  repeatedAchievements: Achievement[]
}

interface LocalProfileContextType {
  profile: LocalProfile
  isLoading: boolean
  recordShuffle: (
    cards: Deck,
    patterns: Pattern[],
    achievements: Achievement[]
  ) => RecordShuffleResponse
  saveShuffle: (shuffle: LocalSavedShuffle) => void
  removeShuffle: (localId: string) => void
  markShuffleShared: (localId: string, shareCode: string) => void
  updateDisplayName: (displayName: string) => void
  exportProfile: () => string
  importProfile: (raw: string) => void
  resetProfile: () => void
}

const LocalProfileContext = createContext<LocalProfileContextType | undefined>(undefined)

export function LocalProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LocalProfile>(() => createDefaultLocalProfile())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedProfile = loadLocalProfile()
    setProfile(storedProfile)
    setIsLoading(false)
  }, [])

  const persist = useCallback((nextProfile: LocalProfile) => {
    setProfile(nextProfile)
    saveLocalProfile(nextProfile)
  }, [])

  const recordShuffle = useCallback(
    (cards: Deck, patterns: Pattern[], achievements: Achievement[]) => {
      const result = recordLocalShuffle(profile, cards, patterns, achievements)
      persist(result.profile)

      return {
        shuffle: result.shuffle,
        newAchievements: result.newAchievements,
        repeatedAchievements: result.repeatedAchievements,
      }
    },
    [persist, profile]
  )

  const saveShuffle = useCallback(
    (shuffle: LocalSavedShuffle) => {
      persist(saveLocalShuffle(profile, shuffle))
    },
    [persist, profile]
  )

  const removeShuffle = useCallback(
    (localId: string) => {
      persist(removeLocalShuffle(profile, localId))
    },
    [persist, profile]
  )

  const markShuffleShared = useCallback(
    (localId: string, shareCode: string) => {
      persist(markLocalShuffleShared(profile, localId, shareCode))
    },
    [persist, profile]
  )

  const updateDisplayName = useCallback(
    (displayName: string) => {
      const trimmed = displayName.trim()
      if (!trimmed) return

      persist({
        ...profile,
        display_name: trimmed,
        updated_at: new Date().toISOString(),
      })
    },
    [persist, profile]
  )

  const exportProfile = useCallback(() => JSON.stringify(profile, null, 2), [profile])

  const importProfile = useCallback(
    (raw: string) => {
      persist(parseLocalProfileExport(raw))
    },
    [persist]
  )

  const resetProfile = useCallback(() => {
    persist(createDefaultLocalProfile())
  }, [persist])

  const value = useMemo(
    () => ({
      profile,
      isLoading,
      recordShuffle,
      saveShuffle,
      removeShuffle,
      markShuffleShared,
      updateDisplayName,
      exportProfile,
      importProfile,
      resetProfile,
    }),
    [
      profile,
      isLoading,
      recordShuffle,
      saveShuffle,
      removeShuffle,
      markShuffleShared,
      updateDisplayName,
      exportProfile,
      importProfile,
      resetProfile,
    ]
  )

  return <LocalProfileContext.Provider value={value}>{children}</LocalProfileContext.Provider>
}

export function useLocalProfile() {
  const context = useContext(LocalProfileContext)
  if (!context) {
    throw new Error('useLocalProfile must be used within a LocalProfileProvider')
  }

  return context
}
