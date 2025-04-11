'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card as CardType, UserStats } from '@/types'
import { Database } from '@/types/supabase'
import { Leaderboard } from '@/components/leaderboard'

export default function StatsPage() {
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

      // Get all user shuffles from database, regardless of saved status
      const { data: shuffles, error: shufflesError } = await supabase
        .from('global_shuffles')
        .select('cards, created_at')
        .eq('user_id', user.id)
        // Don't filter by is_saved - count all shuffles for stats
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
    const shufflesSubscription = supabase
      .channel('shuffles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_shuffles' },
        (payload) => {
          console.log('Shuffles change received!', payload)
          // Always reload stats for any shuffle by this user
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new) {
            loadUserStats() // Refresh stats when changes occur
          }
        }
      )
      .subscribe()

    // Subscribe to leaderboard changes
    const leaderboardSubscription = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, (payload) => {
        console.log('Leaderboard change received!', payload)
        loadUserStats() // Refresh stats when leaderboard changes
      })
      .subscribe()

    // Cleanup subscriptions
    return () => {
      shufflesSubscription.unsubscribe()
      leaderboardSubscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-slate-200'>Loading...</p>
      </div>
    )
  }
  return <Leaderboard />
}
