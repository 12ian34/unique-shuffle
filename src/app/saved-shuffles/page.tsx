'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocalProfile } from '@/contexts/LocalProfileContext'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { LocalSavedShuffle } from '@/types'
import { useToast } from '@/components/ui/use-toast'
import { Copy, Share2 } from 'lucide-react'
import { ToastButton } from '@/components/ui/toast-button'
import { trackEvent } from '@/lib/analytics'

export default function SavedShufflesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { profile, isLoading, removeShuffle, markShuffleShared } = useLocalProfile()
  const savedShuffles = profile.saved_shuffles
  const [sharingInProgress, setSharingInProgress] = useState<Record<string, boolean>>({})
  const [deletingInProgress, setDeletingInProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    trackEvent('saved_shuffles_page_viewed', {
      count: savedShuffles.length,
      storage: 'local',
    })
  }, [savedShuffles.length])

  const handleShareShuffle = async (shuffle: LocalSavedShuffle) => {
    // Track share intent (funnel step)
    trackEvent('shuffle_share_intent', {
      shuffleId: shuffle.local_id,
    })

    // Prevent sharing if already in progress
    if (sharingInProgress[shuffle.local_id]) return

    try {
      // Set sharing state for this specific shuffle
      setSharingInProgress((prev) => ({ ...prev, [shuffle.local_id]: true }))

      // Use the shared API endpoint for sharing shuffles
      const response = await fetch('/api/shuffle/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cards: shuffle.cards,
          patterns: shuffle.patterns,
          achievementIds: shuffle.achievement_ids,
          displayName: profile.display_name,
          profileId: profile.profile_id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to share shuffle')
      }

      const data = await response.json()
      markShuffleShared(shuffle.local_id, data.shareCode)

      toast({
        title: 'shuffle shared',
        description: 'your shuffle can now be shared with others.',
        variant: 'success',
      })

      // Track the share event
      trackEvent('shuffle_shared', {
        shuffleId: shuffle.local_id,
        method: 'saved_shuffles_page',
      })
    } catch (error) {
      console.error('Error sharing shuffle:', error)
      toast({
        title: 'error sharing shuffle',
        description: (
          <div className='flex flex-col gap-2'>
            <p>there was a problem sharing your shuffle.</p>
            <ToastButton
              href='#'
              variant='destructive'
              onClick={(e) => {
                e.preventDefault()
                handleShareShuffle(shuffle)
              }}
            >
              try again
            </ToastButton>
          </div>
        ),
        variant: 'destructive',
      })

      // Track the share error
      trackEvent('shuffle_share_error', {
        shuffleId: shuffle.local_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      // Clear sharing state when done
      setSharingInProgress((prev) => ({ ...prev, [shuffle.local_id]: false }))
    }
  }

  const handleDeleteShuffle = async (shuffleId: string) => {
    // Track delete intent (funnel step)
    trackEvent('shuffle_delete_intent', {
      shuffleId,
    })

    // Ask for confirmation before removing
    if (!window.confirm('are you sure you want to remove this shuffle from your saved shuffles?')) {
      // Track cancel deletion (funnel abandon)
      trackEvent('shuffle_delete_cancelled', {
        shuffleId,
      })
      return
    }

    // Prevent multiple clicks
    if (deletingInProgress[shuffleId]) return

    try {
      // Set deleting state for this specific shuffle
      setDeletingInProgress((prev) => ({ ...prev, [shuffleId]: true }))

      removeShuffle(shuffleId)

      toast({
        title: 'shuffle removed',
        description: 'the shuffle has been removed from your saved shuffles.',
        variant: 'success',
      })

      // Track the delete event
      trackEvent('shuffle_deleted', {
        shuffleId,
      })
    } catch (error) {
      console.error('Error removing shuffle:', error)
      toast({
        title: 'error removing shuffle',
        description: 'there was a problem removing this shuffle from your saved shuffles.',
        variant: 'destructive',
      })

      // Track the delete error
      trackEvent('shuffle_delete_error', {
        shuffleId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      // Clear deleting state when done
      setDeletingInProgress((prev) => ({ ...prev, [shuffleId]: false }))
    }
  }

  // Add a function to handle copying the share URL
  const copyShareUrl = (shareCode: string) => {
    // Track copy intent (funnel step)
    trackEvent('shuffle_copy_intent', {
      shareCode,
    })

    const shareUrl = `${window.location.origin}/shared/${shareCode}`
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        toast({
          title: 'copied to clipboard',
          description: 'share url has been copied to your clipboard',
          duration: 2000,
          variant: 'info',
        })

        // Track the copy link event
        trackEvent('shuffle_link_copied', {
          shareCode,
        })
      },
      (err) => {
        console.error('Could not copy text: ', err)
        toast({
          title: 'failed to copy',
          description: (
            <div className='flex flex-col gap-2'>
              <p>please try again or copy the url manually</p>
              <ToastButton
                href='#'
                variant='destructive'
                onClick={(e) => {
                  e.preventDefault()
                  copyShareUrl(shareCode)
                }}
              >
                try again
              </ToastButton>
            </div>
          ),
          variant: 'destructive',
        })
      }
    )
  }

  const viewShuffle = async (shuffle: LocalSavedShuffle) => {
    // Track view intent (funnel step)
    trackEvent('saved_shuffle_view_intent', {
      shuffleId: shuffle.local_id,
    })

    if (!shuffle.share_code) {
      toast({
        title: 'share required',
        description: 'share this shuffle first to open a public link.',
        variant: 'destructive',
      })
      return
    }

    // Track the view event
    trackEvent('saved_shuffle_viewed', {
      shuffleId: shuffle.local_id,
    })

    // Then navigate to the shuffle page
    router.push(`/shared/${shuffle.share_code}`)
  }

  // Track page view
  useEffect(() => {
    trackEvent('saved_shuffles_viewed', {
      shuffleCount: savedShuffles.length,
    })
  }, [savedShuffles.length])

  if (isLoading) {
    return <div className='text-center py-12'>loading saved shuffles...</div>
  }

  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>saved shuffles</h1>
        <p className='mt-4 text-muted-foreground'>view and manage all your saved shuffles</p>
      </div>

      {savedShuffles.length === 0 ? (
        <div className='text-center py-12 bg-muted/20 rounded-md'>
          <p className='text-muted-foreground mb-4'>you haven&apos;t saved any shuffles yet.</p>
          <Button onClick={() => router.push('/')}>shuffle!</Button>
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {savedShuffles.map((shuffle) => (
            <Card key={shuffle.local_id}>
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg'>saved shuffle</CardTitle>
                <CardDescription>{formatDate(shuffle.created_at)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col gap-2'>
                  <Button size='sm' variant='outline' onClick={() => viewShuffle(shuffle)}>
                    view
                  </Button>

                  {!shuffle.is_shared ? (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleShareShuffle(shuffle)}
                      disabled={sharingInProgress[shuffle.local_id]}
                    >
                      <Share2 className='h-4 w-4 mr-1' />
                      {sharingInProgress[shuffle.local_id] ? 'sharing...' : 'share'}
                    </Button>
                  ) : (
                    // Add copy button for already shared shuffles
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => copyShareUrl(shuffle.share_code || shuffle.local_id)}
                    >
                      <Copy className='h-4 w-4 mr-1' />
                      copy link
                    </Button>
                  )}

                  <Button
                    size='sm'
                    variant='outline'
                    className='text-destructive hover:bg-destructive/10'
                    onClick={() => handleDeleteShuffle(shuffle.local_id)}
                    disabled={deletingInProgress[shuffle.local_id]}
                  >
                    {deletingInProgress[shuffle.local_id] ? 'removing...' : 'remove'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className='text-center'>
        <Button variant='outline' onClick={() => router.push('/profile')}>
          back to profile
        </Button>
      </div>
    </div>
  )
}
