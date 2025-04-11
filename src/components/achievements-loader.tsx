'use client'

import { useEffect, useState } from 'react'
import { UserStats } from '@/types'

interface AchievementsLoaderProps {
  stats: UserStats
}

export function AchievementsLoader({ stats }: AchievementsLoaderProps) {
  const [loading, setLoading] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(0)

  useEffect(() => {
    const loadAchievements = async () => {
      if (loading) return

      try {
        setLoading(true)

        // Get the user ID for the authenticated user
        const response = await fetch('/api/auth/session')
        const sessionData = await response.json()

        if (!sessionData?.user?.id) {
          console.log('No authenticated user found')
          return
        }

        // Fetch user's achievements using combined pattern and count-based methods
        const achievementsResponse = await fetch(`/api/achievements?userId=${sessionData.user.id}`)
        const achievementsData = await achievementsResponse.json()

        if (achievementsData.count !== undefined) {
          setUnlockedCount(achievementsData.count)

          // If the achievement count doesn't match what's in the database, update it
          if (achievementsData.count !== stats.achievements_count) {
            // Update the count in the database
            await fetch('/api/achievements', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: sessionData.user.id }),
            })
          }
        }
      } catch (error) {
        console.error('Error loading achievements:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAchievements()
  }, [stats, loading, stats.achievements_count])

  return null
}
