'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { Card as CardType, UserStats } from '@/types'
import { Database } from '@/types/supabase'
import dynamic from 'next/dynamic'
import { createDisabledRealtimeClient } from '@/lib/supabase-browser'
import { getUserStats, subscribeToStats, fetchStats, initializeStats } from '@/lib/stats-store'

// Lazily load non-critical components
const AchievementsLoader = dynamic(
  () =>
    import('@/lib/achievements').then((mod) => ({
      default: (props: { stats: UserStats }) => {
        const achievements = mod.getUnlockedAchievements(props.stats)
        return null // We're just using this for calculation, not rendering
      },
    })),
  { ssr: false, loading: () => null }
)

export default function Home() {
  // Start with empty stats until client-side initialization
  const [stats, setStats] = useState<UserStats>({
    total_shuffles: 0,
    shuffle_streak: 0,
    achievements_count: 0,
    most_common_cards: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const hasInitializedRef = useRef(false)

  // Initialize store on mount (client-side only)
  useEffect(() => {
    const initialize = async () => {
      if (hasInitializedRef.current) return
      hasInitializedRef.current = true

      setIsLoading(true)
      try {
        // Initialize the store (client-side only)
        await initializeStats()

        // Get initial stats
        const initialStats = getUserStats()
        if (initialStats) {
          setStats(initialStats)
        }

        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Subscribe to store updates
  useEffect(() => {
    if (!isInitialized) return

    // Update stats from the store when it changes
    const handleStatsUpdate = () => {
      const newStats = getUserStats()
      if (newStats) {
        setStats(newStats)
      }
    }

    // Subscribe to stats updates
    const unsubscribe = subscribeToStats(handleStatsUpdate)

    // Unsubscribe on unmount
    return unsubscribe
  }, [isInitialized])

  const handleSaveShuffle = async (cards: CardType[]) => {
    try {
      // Call API endpoint instead of directly inserting
      const response = await fetch('/api/shuffle/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ cards }),
        cache: 'no-store',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save shuffle')
      }

      // Parse the response data
      const data = await response.json()
      console.log('Shuffle saved successfully:', data)

      return data
    } catch (error) {
      console.error('Failed to save shuffle:', error)
      throw error
    }
  }

  return (
    <main className='min-h-screen p-4 md:p-8'>
      <div className='max-w-[1400px] mx-auto'>
        <p className='text-lg mb-6 text-slate-300'>
          there is a 1 in{' '}
          <span className='inline-block break-all md:break-all text-pretty'>
            80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
          </span>{' '}
          chance that anyone has shuffled this before. it&apos;s probably unique:
        </p>

        <div className='space-y-8'>
          <div className='grid grid-cols-1 gap-6'>
            <ShuffleDisplay onSaveShuffleAction={handleSaveShuffle} />
          </div>
        </div>
      </div>

      {/* Load achievements calculation in the background */}
      <Suspense fallback={null}>{stats && <AchievementsLoader stats={stats} />}</Suspense>
    </main>
  )
}
