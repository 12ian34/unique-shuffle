'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'

interface AnalyticsData {
  totalShuffles: number
  viewedShuffles: number
  sharedShuffles: number
  copiedShuffles: number
  topSharedShuffles: Array<{
    id: number
    views: number
    copies: number
    lastViewed: string
  }>
  activityByDay: Array<{
    date: string
    count: number
  }>
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/auth'
        return
      }

      // Get all user's shuffles (both saved and unsaved)
      const { data: allShuffles } = await supabase
        .from('global_shuffles')
        .select('id')
        .eq('user_id', user.id)

      // Get user's saved shuffles (for analytics display)
      const { data: savedShuffles } = await supabase
        .from('global_shuffles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_saved', true)

      if (!allShuffles || allShuffles.length === 0) {
        setAnalytics({
          totalShuffles: 0,
          viewedShuffles: 0,
          sharedShuffles: 0,
          copiedShuffles: 0,
          topSharedShuffles: [],
          activityByDay: [],
        })
        setLoading(false)
        return
      }

      const shuffleIds = savedShuffles ? savedShuffles.map((s) => s.id) : []

      // Get total shared shuffles
      const { data: sharedShuffles, error: sharedError } = await supabase
        .from('global_shuffles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_saved', true)
        .eq('is_shared', true)

      // Get analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('shuffle_analytics')
        .select('*')
        .in(
          'shuffle_id',
          shuffleIds.map((id) => parseInt(id, 10))
        )

      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError)
        return
      }

      // Process data
      const viewEvents = analyticsData?.filter((a) => a.action === 'view') || []
      const shareEvents = analyticsData?.filter((a) => a.action === 'share') || []
      const copyEvents = analyticsData?.filter((a) => a.action === 'copy') || []

      // Get unique viewed shuffles
      const viewedShuffleIds = Array.from(new Set(viewEvents.map((e) => e.shuffle_id)))

      // Get top viewed shuffles
      const shuffleViewCounts: Record<
        number,
        { views: number; copies: number; lastViewed: string }
      > = {}

      viewEvents.forEach((event) => {
        if (!shuffleViewCounts[event.shuffle_id]) {
          shuffleViewCounts[event.shuffle_id] = {
            views: 0,
            copies: 0,
            lastViewed: event.created_at,
          }
        }
        shuffleViewCounts[event.shuffle_id].views++

        // Update last viewed date if more recent
        if (new Date(event.created_at) > new Date(shuffleViewCounts[event.shuffle_id].lastViewed)) {
          shuffleViewCounts[event.shuffle_id].lastViewed = event.created_at
        }
      })

      // Add copy counts
      copyEvents.forEach((event) => {
        if (!shuffleViewCounts[event.shuffle_id]) {
          shuffleViewCounts[event.shuffle_id] = {
            views: 0,
            copies: 0,
            lastViewed: event.created_at,
          }
        }
        shuffleViewCounts[event.shuffle_id].copies++
      })

      // Convert to array and sort by views
      const topShuffles = Object.entries(shuffleViewCounts)
        .map(([id, data]) => ({
          id: parseInt(id),
          ...data,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)

      // Activity by day for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      const activityByDay = last7Days.map((date) => {
        const count =
          analyticsData?.filter((event) => event.created_at.startsWith(date)).length || 0

        return { date, count }
      })

      setAnalytics({
        totalShuffles: allShuffles.length,
        viewedShuffles: viewedShuffleIds.length,
        sharedShuffles: sharedShuffles?.length || 0,
        copiedShuffles: Array.from(new Set(copyEvents.map((e) => e.shuffle_id))).length,
        topSharedShuffles: topShuffles,
        activityByDay,
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-slate-800 border border-slate-700 rounded p-2 shadow-lg'>
          <p className='text-slate-200 font-medium'>{`Date: ${label}`}</p>
          <p className='text-indigo-400 font-medium'>{`Activity: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold'>Shuffle Analytics Dashboard</h1>
          <div className='space-x-2'>
            <Button onClick={fetchAnalytics} variant='outline'>
              Refresh
            </Button>
            <Button variant='outline' onClick={() => (window.location.href = '/profile')}>
              Edit Profile
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xl'>Total Shuffles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-4xl font-bold'>{analytics.totalShuffles}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xl'>Viewed Shuffles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-4xl font-bold'>{analytics.viewedShuffles}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xl'>Shared Shuffles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-4xl font-bold'>{analytics.sharedShuffles}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xl'>Copied Shuffles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-4xl font-bold'>{analytics.copiedShuffles}</p>
            </CardContent>
          </Card>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          <Card className='col-span-1'>
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>Shuffle activity over the past 7 days</CardDescription>
            </CardHeader>
            <CardContent className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={analytics.activityByDay}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                  <XAxis
                    dataKey='date'
                    stroke='#d1d5db'
                    tickFormatter={formatXAxisDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} stroke='#d1d5db' tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey='count'
                    fill='#4338ca'
                    activeBar={{ fill: '#4f46e5', opacity: 0.9 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className='col-span-1'>
            <CardHeader>
              <CardTitle>Top Shared Shuffles</CardTitle>
              <CardDescription>Your most viewed and copied shuffles</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topSharedShuffles.length > 0 ? (
                <div className='space-y-4'>
                  {analytics.topSharedShuffles.map((shuffle) => (
                    <div
                      key={shuffle.id}
                      className='flex justify-between items-center border-b pb-2'
                    >
                      <div>
                        <p className='font-medium'>Shuffle #{shuffle.id}</p>
                        <p className='text-sm text-gray-500'>
                          Last viewed: {new Date(shuffle.lastViewed).toLocaleDateString()}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium'>{shuffle.views} views</p>
                        <p className='text-sm text-gray-500'>{shuffle.copies} copies</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-center py-8 text-gray-500'>No shuffle views recorded yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='text-center'>
          <Button variant='default' onClick={() => (window.location.href = '/')}>
            Return to Shuffles
          </Button>
        </div>
      </div>
    </div>
  )
}
