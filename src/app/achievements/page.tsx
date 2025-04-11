'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { Achievements } from '@/components/achievements'
import { UserStats } from '@/types'
import { Achievement } from '@/types'

export default function AchievementsPage() {
  const [stats, setStats] = useState<UserStats>({
    total_shuffles: 0,
    shuffle_streak: 0,
    achievements_count: 0,
    most_common_cards: [],
  })
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setIsLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('Please sign in to view your achievements')
          setIsLoading(false)
          return
        }

        // First, get user stats
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('leaderboard')
          .select('total_shuffles, shuffle_streak, achievements_count')
          .eq('user_id', user.id)
          .single()

        if (leaderboardError) {
          console.error('Error fetching user stats:', leaderboardError)
          setError('Failed to load stats. Please try again.')
          setIsLoading(false)
          return
        }

        setStats({
          total_shuffles: leaderboardData.total_shuffles || 0,
          shuffle_streak: leaderboardData.shuffle_streak || 0,
          achievements_count: leaderboardData.achievements_count || 0,
          most_common_cards: [],
        })

        // Now fetch all achievements using the API endpoint that combines both types
        const response = await fetch(`/api/achievements?userId=${user.id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch achievements')
        }

        const { achievements } = await response.json()

        if (Array.isArray(achievements)) {
          // Extract just the IDs for the unlockedAchievements array
          const achievementIds = achievements.map((achievement: Achievement) => achievement.id)
          setUnlockedAchievements(achievementIds)
        }
      } catch (error) {
        console.error('Error fetching achievements:', error)
        setError('Failed to load achievements. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAchievements()
  }, [supabase])

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6 text-slate-100'>Your Achievements</h1>

      <div className='bg-slate-900 rounded-lg shadow-md p-6 border border-slate-700'>
        {isLoading ? (
          <div className='flex justify-center items-center h-40'>
            <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-100'></div>
          </div>
        ) : error ? (
          <div className='text-red-400 p-4 rounded-md bg-red-900/20 border border-red-800/40'>
            <h3 className='font-semibold mb-1'>Error loading achievements</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className='mb-4 flex justify-between items-center'>
              <div>
                <p className='text-slate-300'>
                  <span className='font-medium'>{stats.total_shuffles}</span> total shuffles
                </p>
                <p className='text-slate-300'>
                  <span className='font-medium'>{stats.shuffle_streak}</span> day streak
                </p>
              </div>
              <div className='text-right'>
                <p className='text-slate-300'>
                  <span className='font-medium'>{unlockedAchievements.length}</span> achievements
                  unlocked
                </p>
              </div>
            </div>

            <Achievements unlockedAchievements={unlockedAchievements} />
          </>
        )}
      </div>
    </div>
  )
}
