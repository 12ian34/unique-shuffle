'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ScrollableTabsList, TabsTrigger } from '@/components/ui/scrollable-tabs'
import { Button } from '@/components/ui/button'
import { LeaderboardEntry } from '@/types'
import { Fallback } from '@/components/ui/fallback'
import { createNetworkError, handleError } from '@/lib/errors'
import ErrorBoundary from '@/components/error-boundary'
import { trackEvent } from '@/lib/analytics'

// Map frontend tab values to API sort parameters
const sortMapping = {
  total: 'total_shuffles',
  achievements: 'achievementCount',
  streak: 'shuffle_streak',
}

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
      const sortBy = sortMapping[currentTab]
      const params = new URLSearchParams({
        sort: sortBy,
        friendsOnly: String(showFriendsOnly),
        // Add page param if implementing pagination later
        // page: '1',
      })

      const response = await fetch(`/api/leaderboard?${params.toString()}`)

      if (!response.ok) {
        console.error('Error fetching leaderboard data:', response.statusText)
        // Try to parse error response from API
        let errorData: any = { message: 'Failed to fetch leaderboard data' }
        try {
          errorData = await response.json()
        } catch (parseError) {
          // Ignore if response is not JSON
        }
        const networkError = createNetworkError(errorData.message || response.statusText, {
          statusCode: response.status,
          url: response.url,
        })
        // Wrap the custom AppError message in a standard Error object
        setError(new Error(networkError.message))
        setLeaderboard([])
      } else {
        const result = await response.json()
        setLeaderboard(result.data as LeaderboardEntry[])
      }
    } catch (err) {
      console.error('Unexpected error fetching leaderboard:', err)
      const fetchError = createNetworkError(
        err instanceof Error ? err.message : 'An unknown fetch error occurred',
        { originalError: err }
      )
      // Wrap the custom AppError message in a standard Error object
      setError(new Error(fetchError.message))
      setLeaderboard([])
    } finally {
      setIsLoading(false)
    }
  }, [currentTab, showFriendsOnly]) // Depend on currentTab and showFriendsOnly

  useEffect(() => {
    fetchLeaderboard()
    // Track tab view
    trackEvent('leaderboard_tab_view', {
      tab: currentTab,
      filter: showFriendsOnly ? 'friends' : 'all',
    })
  }, [fetchLeaderboard, currentTab, showFriendsOnly]) // Add currentTab and showFriendsOnly as dependencies

  const handleTabChange = (value: string) => {
    const newTab = value as 'total' | 'achievements' | 'streak'
    setCurrentTab(newTab)
    // Tracking moved to useEffect to capture initial load and subsequent changes
  }

  const toggleFriendsOnly = () => {
    setShowFriendsOnly((prev) => {
      const newState = !prev
      trackEvent('leaderboard_filter_toggle', { filter: newState ? 'friends' : 'all' })
      return newState
    })
    // Fetch is triggered by useEffect dependency change
  }

  // Map tab value to the display name used in renderLeaderboard's header
  const sortFieldMap: Record<typeof currentTab, keyof LeaderboardEntry> = {
    total: 'totalShuffles',
    achievements: 'achievementCount',
    streak: 'shuffleStreak',
  }
  const currentSortField = sortFieldMap[currentTab]

  return (
    <div className='space-y-8'>
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <Button
                variant={showFriendsOnly ? 'default' : 'outline'}
                onClick={toggleFriendsOnly}
                className='whitespace-nowrap'
                aria-pressed={showFriendsOnly} // Add aria-pressed for accessibility
              >
                {showFriendsOnly ? 'friends' : 'all users'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <ScrollableTabsList variant='underline' className='mb-8'>
                <TabsTrigger variant='underline' value='total'>
                  shuffles
                </TabsTrigger>
                <TabsTrigger variant='underline' value='achievements'>
                  achievements
                </TabsTrigger>
                <TabsTrigger variant='underline' value='streak'>
                  streak
                </TabsTrigger>
              </ScrollableTabsList>

              {/* Pass currentSortField to renderLeaderboard */}
              <TabsContent value='total'>
                {renderLeaderboard(
                  leaderboard,
                  currentSortField,
                  isLoading,
                  error,
                  fetchLeaderboard
                )}
              </TabsContent>

              <TabsContent value='achievements'>
                {renderLeaderboard(
                  leaderboard,
                  currentSortField,
                  isLoading,
                  error,
                  fetchLeaderboard
                )}
              </TabsContent>

              <TabsContent value='streak'>
                {renderLeaderboard(
                  leaderboard,
                  currentSortField,
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
  // Renamed sortField to displayField for clarity, as sorting is done by API
  displayField: keyof LeaderboardEntry,
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
        // Display more specific error message if available
        message={error.message || 'There was a problem loading the leaderboard data.'}
        onRetry={retryFunction}
      />
    )
  }

  if (data.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No data available for this leaderboard view. Try changing the filter.
      </div>
    )
  }

  // Remove client-side sorting, API handles sorting now
  // const sortedData = [...data].sort((a, b) => {
  //   const valueA = a[sortField] as number
  //   const valueB = b[sortField] as number
  //   return valueB - valueA
  // })

  return (
    <div className='overflow-x-auto'>
      <table className='w-full'>
        <thead>
          <tr className='border-b'>
            <th className='text-left py-3 px-2'>rank</th>
            <th className='text-left py-3 px-2'>username</th>
            <th className='text-right py-3 px-2'>
              {/* Determine header based on displayField */}
              {displayField === 'totalShuffles'
                ? 'shuffles'
                : displayField === 'achievementCount'
                ? 'achievements'
                : 'streak'}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Use data directly as it's pre-sorted by API */}
          {data.map((entry, index) => (
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
                {/* Display data based on displayField */}
                {displayField === 'totalShuffles'
                  ? entry.totalShuffles
                  : displayField === 'achievementCount'
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
