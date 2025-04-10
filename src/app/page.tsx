'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { StatsDisplay } from '@/components/stats-display'
import { Achievements } from '@/components/achievements'
import { ShuffleHistory } from '@/components/shuffle-history'
import { Card as CardType, UserStats } from '@/types'
import { getUnlockedAchievements } from '@/lib/achievements'
import { Database } from '@/types/supabase'

export default function Home() {
  const [stats, setStats] = useState<UserStats>({
    total_shuffles: 0,
    shuffle_streak: 0,
    achievements_count: 0,
    most_common_cards: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadUserStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found')
        setIsLoading(false)
        return
      }

      console.log('Loading stats for user:', user.id)

      // Get user shuffles from database
      const { data: shuffles, error: shufflesError } = await supabase
        .from('shuffles')
        .select('cards, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (shufflesError) {
        console.error('Error fetching shuffles:', shufflesError)
        setIsLoading(false)
        return
      }

      if (!shuffles || shuffles.length === 0) {
        console.log('No shuffles found')
        setStats({
          total_shuffles: 0,
          shuffle_streak: 0,
          achievements_count: 0,
          most_common_cards: [],
        })
        setIsLoading(false)
        return
      }

      console.log(`Found ${shuffles.length} shuffles`)

      // Directly count card occurrences without JSON stringification
      const cardCounts: Record<string, { card: CardType; count: number }> = {}

      shuffles.forEach((shuffle) => {
        if (!shuffle.cards || !Array.isArray(shuffle.cards)) {
          console.warn('Invalid shuffle data:', shuffle)
          return
        }

        shuffle.cards.forEach((card) => {
          if (!card || !card.suit || !card.value) return

          const key = `${card.value}-${card.suit}`
          if (!cardCounts[key]) {
            cardCounts[key] = { card, count: 0 }
          }
          cardCounts[key].count++
        })
      })

      // Calculate shuffle streak
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Group shuffles by date (using a Map to preserve insertion order)
      const shufflesByDate = new Map<string, boolean>()

      shuffles.forEach((shuffle) => {
        if (!shuffle.created_at) return

        const shuffleDate = new Date(shuffle.created_at)
        shuffleDate.setHours(0, 0, 0, 0)

        // Store date as string key in format YYYY-MM-DD
        const dateStr = shuffleDate.toISOString().split('T')[0]
        shufflesByDate.set(dateStr, true)
      })

      // Get dates as array sorted in descending order (most recent first)
      const shuffleDates = Array.from(shufflesByDate.keys()).sort().reverse()

      if (shuffleDates.length > 0) {
        streak = 1 // Start with 1 for the most recent day

        const todayStr = today.toISOString().split('T')[0]
        const mostRecentShuffleDate = new Date(shuffleDates[0])
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        // If most recent shuffle is not today or yesterday, streak is just 1
        if (shuffleDates[0] === todayStr || shuffleDates[0] === yesterdayStr) {
          // Check for consecutive days working backwards
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
      const newStats: UserStats = {
        total_shuffles: shuffles.length,
        shuffle_streak: streak,
        achievements_count: 0,
        most_common_cards: Object.values(cardCounts).sort((a, b) => b.count - a.count),
      }

      console.log('Stats calculated:', {
        shuffles: newStats.total_shuffles,
        streak: newStats.shuffle_streak,
        topCard: newStats.most_common_cards[0]?.card,
      })

      setStats(newStats)
    } catch (error) {
      console.error('Failed to load user stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUserStats()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('shuffles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shuffles' }, (payload) => {
        console.log('Change received!', payload)
        loadUserStats() // Refresh stats when changes occur
      })
      .subscribe()

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-slate-200'>Loading...</p>
      </div>
    )
  }

  const unlockedAchievements = getUnlockedAchievements(stats)

  return (
    <main className='min-h-screen p-4 md:p-8'>
      <div className='max-w-[1400px] mx-auto'>
        <p className='text-lg mb-6 text-slate-300'>
          there is a 1 in{' '}
          <span className='break-all text-pretty'>
            80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
          </span>{' '}
          chance that this shuffle has ever existed before. it&apos;s probably unique
        </p>

        <div className='space-y-8'>
          <div>
            <ShuffleDisplay onSaveShuffle={handleSaveShuffle} />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-700'>
            <StatsDisplay stats={stats} />
            <Achievements unlockedAchievements={unlockedAchievements.map((a) => a.id)} />
          </div>
        </div>

        <div className='mt-8 pt-8 border-t border-slate-700'>
          <ShuffleHistory className='w-full' />
        </div>
      </div>
    </main>
  )
}
