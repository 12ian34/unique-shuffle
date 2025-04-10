'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/card'
import { Button } from '@/components/ui/button'
import { Card as CardType } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ShuffleHistoryProps {
  className?: string
}

interface ShuffleEntry {
  id: number
  cards: CardType[]
  created_at: string
  is_shared: boolean
  share_code?: string
}

export function ShuffleHistory({ className }: ShuffleHistoryProps) {
  const [shuffles, setShuffles] = useState<ShuffleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sharing, setSharing] = useState<Record<number, boolean>>({})
  const [shareUrls, setShareUrls] = useState<Record<number, string>>({})
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const limit = 5

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadShuffles = async (pageNum = 0, replace = true) => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const response = await fetch(
        `/api/shuffles/user?userId=${user.id}&limit=${limit}&page=${pageNum}`
      )
      const { shuffles: newShuffles, total } = await response.json()

      if (replace) {
        setShuffles(newShuffles || [])
      } else {
        setShuffles((prev) => [...prev, ...(newShuffles || [])])
      }

      setHasMore((pageNum + 1) * limit < (total || 0))
    } catch (error) {
      console.error('Failed to load shuffles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadShuffles(nextPage, false)
  }

  useEffect(() => {
    loadShuffles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const shareShuffle = async (shuffleId: number) => {
    try {
      setSharing((prev) => ({ ...prev, [shuffleId]: true }))

      const response = await fetch('/api/shuffle/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shuffleId }),
      })

      if (!response.ok) {
        throw new Error('Failed to share shuffle')
      }

      const { shareCode, shareUrl } = await response.json()

      // Record share in analytics
      await fetch('/api/shuffle/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shuffleId,
          action: 'share',
        }),
      })

      setShareUrls((prev) => ({ ...prev, [shuffleId]: shareUrl }))

      // Update the shuffle in state to show it's shared
      setShuffles((prev) =>
        prev.map((shuffle) =>
          shuffle.id === shuffleId
            ? { ...shuffle, is_shared: true, share_code: shareCode }
            : shuffle
        )
      )
    } catch (error) {
      console.error('Failed to share shuffle:', error)
    } finally {
      setSharing((prev) => ({ ...prev, [shuffleId]: false }))
    }
  }

  const copyShareLink = (shuffleId: number) => {
    if (shareUrls[shuffleId]) {
      navigator.clipboard.writeText(shareUrls[shuffleId])
    }
  }

  if (loading && shuffles.length === 0) {
    return (
      <div className={`${className} text-slate-200 font-medium`}>
        Loading your shuffle history...
      </div>
    )
  }

  if (shuffles.length === 0) {
    return (
      <div className={`${className} text-slate-200 font-medium`}>
        You haven&apos;t saved any shuffles yet.
      </div>
    )
  }

  return (
    <div className={className}>
      <h2 className='text-xl font-semibold mb-4 text-slate-100'>Your Shuffle History</h2>
      <div className='space-y-4'>
        {shuffles.map((shuffle) => (
          <div key={shuffle.id} className='border border-slate-700 bg-slate-900 rounded-lg p-4'>
            <div className='flex justify-between items-center mb-2'>
              <div>
                <span className='font-medium text-slate-200'>
                  {formatDistanceToNow(new Date(shuffle.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => toggleExpand(shuffle.id)}
                  className='border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white'
                >
                  {expanded[shuffle.id] ? 'Hide' : 'View'}
                </Button>

                {shuffle.is_shared && shareUrls[shuffle.id] ? (
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => copyShareLink(shuffle.id)}
                    className='bg-sky-700 hover:bg-sky-800 text-white'
                  >
                    Copy Link
                  </Button>
                ) : (
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => shareShuffle(shuffle.id)}
                    disabled={sharing[shuffle.id]}
                    className='bg-amber-700 hover:bg-amber-800 text-white'
                  >
                    {sharing[shuffle.id] ? 'Sharing...' : 'Share'}
                  </Button>
                )}
              </div>
            </div>

            {expanded[shuffle.id] && (
              <div className='grid grid-cols-4 gap-2 mt-4'>
                {shuffle.cards.map((card, index) => (
                  <Card key={index} card={card} />
                ))}
              </div>
            )}
          </div>
        ))}

        {hasMore && (
          <Button
            variant='outline'
            onClick={loadMore}
            disabled={loading}
            className='w-full mt-4 border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white'
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>
    </div>
  )
}
