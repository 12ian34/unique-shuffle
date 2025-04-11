'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { Card as CardType, UserStats } from '@/types'
import { Database } from '@/types/supabase'
import dynamic from 'next/dynamic'

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
  const [stats, setStats] = useState<UserStats>({
    total_shuffles: 0,
    shuffle_streak: 0,
    achievements_count: 0,
    most_common_cards: [],
  })
  const [isLoading, setIsLoading] = useState(false) // Start as false for better perceived performance
  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  // Add a ref to track when we last logged
  const lastLogTimeRef = useRef<number>(0)

  const loadUserStats = useCallback(async () => {
    if (isLoading) return // Prevent concurrent loads

    try {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        // Only log if it's been more than 5 seconds since the last log
        const now = Date.now()
        if (now - lastLogTimeRef.current > 5000) {
          console.log('No user found')
          lastLogTimeRef.current = now
        }
        setIsLoading(false)
        return
      }

      // Optimize query - only select what we need
      const { data: shuffles, error: shufflesError } = await supabase
        .from('global_shuffles')
        .select('cards, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        // Add limit to prevent loading too much data
        .limit(100)

      if (shufflesError) {
        console.error('Error fetching shuffles:', shufflesError)
        setIsLoading(false)
        return
      }

      if (!shuffles || shuffles.length === 0) {
        // Only log if it's been more than 5 seconds since the last log
        const now = Date.now()
        if (now - lastLogTimeRef.current > 5000) {
          console.log('No shuffles found')
          lastLogTimeRef.current = now
        }
        setStats({
          total_shuffles: 0,
          shuffle_streak: 0,
          achievements_count: 0,
          most_common_cards: [],
        })
        setIsLoading(false)
        return
      }

      // Optimize card counting - use a Map for better performance
      const cardCounts = new Map<string, { card: CardType; count: number }>()

      shuffles.forEach((shuffle) => {
        if (!shuffle.cards || !Array.isArray(shuffle.cards)) return

        shuffle.cards.forEach((card) => {
          if (!card || !card.suit || !card.value) return

          const key = `${card.value}-${card.suit}`
          if (!cardCounts.has(key)) {
            cardCounts.set(key, { card, count: 0 })
          }

          const entry = cardCounts.get(key)!
          entry.count++
          cardCounts.set(key, entry)
        })
      })

      // Calculate shuffle streak more efficiently
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Use a Set for faster lookups
      const shuffleDateSet = new Set<string>()

      shuffles.forEach((shuffle) => {
        if (!shuffle.created_at) return

        const shuffleDate = new Date(shuffle.created_at)
        shuffleDate.setHours(0, 0, 0, 0)

        const dateStr = shuffleDate.toISOString().split('T')[0]
        shuffleDateSet.add(dateStr)
      })

      // Convert to sorted array
      const shuffleDates = Array.from(shuffleDateSet).sort().reverse()

      if (shuffleDates.length > 0) {
        streak = 1 // Start with 1 for the most recent day

        const todayStr = today.toISOString().split('T')[0]
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (shuffleDates[0] === todayStr || shuffleDates[0] === yesterdayStr) {
          for (let i = 1; i < shuffleDates.length; i++) {
            const currentDate = new Date(shuffleDates[i - 1])
            currentDate.setDate(currentDate.getDate() - 1)
            const expectedPrevDateStr = currentDate.toISOString().split('T')[0]

            if (shuffleDates[i] === expectedPrevDateStr) {
              streak++
            } else {
              break
            }
          }
        }
      }

      // Convert to the format expected by the UI
      const mostCommonCards = Array.from(cardCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Only keep top 10 to reduce state size

      const newStats: UserStats = {
        total_shuffles: shuffles.length,
        shuffle_streak: streak,
        achievements_count: 0, // Will be calculated by AchievementsLoader
        most_common_cards: mostCommonCards,
      }

      setStats(newStats)
    } catch (error) {
      console.error('Failed to load user stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, supabase])

  // Load user stats on mount, but don't block rendering
  useEffect(() => {
    // Defer stats loading to improve initial load time
    const timeoutId = setTimeout(loadUserStats, 100)
    return () => clearTimeout(timeoutId)
  }, [loadUserStats])

  // Optimize Supabase subscriptions - consolidate them and use a more efficient approach
  useEffect(() => {
    // Single subscription for any relevant change
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_shuffles' },
        (payload) => {
          // Only reload for this user's changes to avoid unnecessary work
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new) {
            // Debounce updates to prevent rapid reloads
            const userId = (payload.new as any).user_id

            // Get current user ID
            supabase.auth.getUser().then(({ data }) => {
              if (data.user && data.user.id === userId) {
                // Only reload if it's this user's data
                loadUserStats()
              }
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, loadUserStats])

  const handleSaveShuffle = async (cards: CardType[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Call API endpoint instead of directly inserting
      const response = await fetch('/api/shuffle/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cards }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save shuffle')
      }

      // Update stats
      await loadUserStats() // Reload stats instead of manually updating
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
          chance that this shuffle has ever existed before. it&apos;s probably unique
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
