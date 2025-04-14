'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import supabase from '@/lib/supabase'
import { LeaderboardEntry } from '@/types'
import { Fallback } from '@/components/ui/fallback'
import { createNetworkError, handleError } from '@/lib/errors'
import ErrorBoundary from '@/components/error-boundary'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [currentTab, setCurrentTab] = useState<'total' | 'achievements' | 'streak'>('total')
  const [showFriendsOnly, setShowFriendsOnly] = useState(false)

  // Function to fetch leaderboard data - memoized with useCallback
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Determine sort field based on current tab
      const sortField =
        currentTab === 'total'
          ? 'total_shuffles'
          : currentTab === 'achievements'
          ? 'achievementCount'
          : 'shuffle_streak'

      const response = await fetch(
        `/api/leaderboard?sort=${sortField}&friendsOnly=${showFriendsOnly}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard data: ${response.status}`)
      }

      const result = await response.json()

      if (result.data) {
        setLeaderboard(result.data)
      } else if (result.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      const appError = createNetworkError(
        'Unable to load leaderboard data. Please try again.',
        { originalError: error },
        true,
        () => fetchLeaderboard()
      )
      handleError(appError)
      setError(error instanceof Error ? error : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [currentTab, showFriendsOnly]) // Dependencies for the callback

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard]) // fetchLeaderboard is now a dependency

  const handleTabChange = (value: string) => {
    setCurrentTab(value as 'total' | 'achievements' | 'streak')
  }

  const toggleFriendsOnly = () => {
    setShowFriendsOnly(!showFriendsOnly)
  }

  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Leaderboard</h1>
        <p className='mt-4 text-muted-foreground'>
          See who&apos;s shuffling the most and earning achievements
        </p>
      </div>

      <ErrorBoundary>
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div>
                <CardTitle>Top Shufflers</CardTitle>
                <CardDescription>
                  Rankings based on shuffles, achievements, and streaks
                </CardDescription>
              </div>
              <Button
                variant={showFriendsOnly ? 'default' : 'outline'}
                onClick={toggleFriendsOnly}
                className='whitespace-nowrap'
              >
                {showFriendsOnly ? 'Showing Friends' : 'Show All Users'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList className='grid w-full grid-cols-3 mb-8'>
                <TabsTrigger value='total'>Total Shuffles</TabsTrigger>
                <TabsTrigger value='achievements'>Achievements</TabsTrigger>
                <TabsTrigger value='streak'>Daily Streak</TabsTrigger>
              </TabsList>

              <TabsContent value='total'>
                {renderLeaderboard(
                  leaderboard,
                  'totalShuffles',
                  isLoading,
                  error,
                  fetchLeaderboard
                )}
              </TabsContent>

              <TabsContent value='achievements'>
                {renderLeaderboard(
                  leaderboard,
                  'achievementCount',
                  isLoading,
                  error,
                  fetchLeaderboard
                )}
              </TabsContent>

              <TabsContent value='streak'>
                {renderLeaderboard(
                  leaderboard,
                  'shuffleStreak',
                  isLoading,
                  error,
                  fetchLeaderboard
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
}

function renderLeaderboard(
  data: LeaderboardEntry[],
  sortField: keyof LeaderboardEntry,
  isLoading: boolean,
  error: Error | null,
  retryFunction: () => void
) {
  if (isLoading) {
    return <div className='text-center py-8'>Loading leaderboard...</div>
  }

  if (error) {
    return (
      <Fallback
        title='Unable to load leaderboard'
        message='There was a problem loading the leaderboard data.'
        onRetry={retryFunction}
      />
    )
  }

  if (data.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No data available for this leaderboard yet.
      </div>
    )
  }

  // Sort the data based on the selected field
  const sortedData = [...data].sort((a, b) => {
    const valueA = a[sortField] as number
    const valueB = b[sortField] as number
    return valueB - valueA
  })

  return (
    <div className='overflow-x-auto'>
      <table className='w-full'>
        <thead>
          <tr className='border-b'>
            <th className='text-left py-3 px-2'>Rank</th>
            <th className='text-left py-3 px-2'>Username</th>
            <th className='text-right py-3 px-2'>
              {sortField === 'totalShuffles'
                ? 'Total Shuffles'
                : sortField === 'achievementCount'
                ? 'Achievements'
                : 'Streak'}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((entry, index) => (
            <tr key={entry.userId} className='border-b hover:bg-muted/50'>
              <td className='py-3 px-2 text-muted-foreground'>{index + 1}</td>
              <td className='py-3 px-2 font-medium'>
                <a
                  href={`/profile/${entry.username}`}
                  className='hover:text-primary hover:underline'
                >
                  {entry.username}
                </a>
              </td>
              <td className='py-3 px-2 text-right'>
                {sortField === 'totalShuffles'
                  ? entry.totalShuffles
                  : sortField === 'achievementCount'
                  ? entry.achievementCount
                  : entry.shuffleStreak}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
