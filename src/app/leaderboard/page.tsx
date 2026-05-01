'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLargeNumber } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

export default function LeaderboardPage() {
  const [globalCount, setGlobalCount] = useState<number | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    async function fetchGlobalCount() {
      try {
        const response = await fetch('/api/shuffles/global-count', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to fetch global count')
        }

        const data = await response.json()
        setGlobalCount(Number(data.count || 0))
      } catch (error) {
        console.error('Error fetching global count:', error)
        setHasError(true)
      }
    }

    fetchGlobalCount()
    trackEvent('global_stats_page_viewed', { storage: 'local' })
  }, [])

  return (
    <div className='space-y-8'>
      <Card>
        <CardHeader>
          <CardTitle>global shuffles</CardTitle>
          <CardDescription>
            everyone contributes to this count. individual profiles stay local unless a shuffle is
            explicitly shared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <p className='text-muted-foreground'>global stats are unavailable right now.</p>
          ) : (
            <div className='text-5xl font-bold'>
              {globalCount === null ? '...' : formatLargeNumber(globalCount)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
