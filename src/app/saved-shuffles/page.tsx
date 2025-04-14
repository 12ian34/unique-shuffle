'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import supabase from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatDate, generateRandomString } from '@/lib/utils'
import { DbShuffle } from '@/types'
import { useToast } from '@/components/ui/use-toast'
import { Copy, Share2 } from 'lucide-react'
import { ToastButton } from '@/components/ui/toast-button'

export default function SavedShufflesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [savedShuffles, setSavedShuffles] = useState<DbShuffle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sharingInProgress, setSharingInProgress] = useState<Record<string, boolean>>({})
  const [deletingInProgress, setDeletingInProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function fetchSavedShuffles() {
      setIsLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // Redirect to auth page if not logged in
          router.push('/auth')
          return
        }

        // Fetch all saved shuffles
        const { data } = await supabase
          .from('shuffles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_saved', true)
          .order('created_at', { ascending: false })

        setSavedShuffles(data || [])
      } catch (error) {
        console.error('Error fetching saved shuffles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedShuffles()
  }, [router])

  const handleShareShuffle = async (shuffleId: string) => {
    // Prevent sharing if already in progress
    if (sharingInProgress[shuffleId]) return

    try {
      // Set sharing state for this specific shuffle
      setSharingInProgress((prev) => ({ ...prev, [shuffleId]: true }))

      // Use the shared API endpoint for sharing shuffles
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

      const data = await response.json()
      console.log('Shuffle shared with code:', data.shareCode)

      // Update local state
      setSavedShuffles(
        savedShuffles.map((s) =>
          s.id === shuffleId ? { ...s, is_shared: true, share_code: data.shareCode } : s
        )
      )

      toast({
        title: 'Shuffle shared',
        description: 'Your shuffle can now be shared with others.',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error sharing shuffle:', error)
      toast({
        title: 'Error sharing shuffle',
        description: (
          <div className='flex flex-col gap-2'>
            <p>There was a problem sharing your shuffle.</p>
            <ToastButton
              href='#'
              variant='destructive'
              onClick={(e) => {
                e.preventDefault()
                handleShareShuffle(shuffleId)
              }}
            >
              Try Again
            </ToastButton>
          </div>
        ),
        variant: 'destructive',
      })
    } finally {
      // Clear sharing state when done
      setSharingInProgress((prev) => ({ ...prev, [shuffleId]: false }))
    }
  }

  const handleDeleteShuffle = async (shuffleId: string) => {
    // Ask for confirmation before removing
    if (!window.confirm('Are you sure you want to remove this shuffle from your saved shuffles?')) {
      return
    }

    // Prevent multiple clicks
    if (deletingInProgress[shuffleId]) return

    try {
      // Set deleting state for this specific shuffle
      setDeletingInProgress((prev) => ({ ...prev, [shuffleId]: true }))

      // Only update is_saved flag to false
      // We're not changing the is_shared flag, so shared links will still work
      await supabase.from('shuffles').update({ is_saved: false }).eq('id', shuffleId)

      // Update local state
      setSavedShuffles(savedShuffles.filter((s) => s.id !== shuffleId))

      toast({
        title: 'Shuffle removed',
        description: 'The shuffle has been removed from your saved shuffles.',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error removing shuffle:', error)
      toast({
        title: 'Error removing shuffle',
        description: 'There was a problem removing this shuffle from your saved shuffles.',
        variant: 'destructive',
      })
    } finally {
      // Clear deleting state when done
      setDeletingInProgress((prev) => ({ ...prev, [shuffleId]: false }))
    }
  }

  // Add a function to handle copying the share URL
  const copyShareUrl = (shareCode: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareCode}`
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        toast({
          title: 'Copied to clipboard',
          description: 'Share URL has been copied to your clipboard',
          duration: 2000,
          variant: 'info',
        })
      },
      (err) => {
        console.error('Could not copy text: ', err)
        toast({
          title: 'Failed to copy',
          description: (
            <div className='flex flex-col gap-2'>
              <p>Please try again or copy the URL manually</p>
              <ToastButton
                href='#'
                variant='destructive'
                onClick={(e) => {
                  e.preventDefault()
                  copyShareUrl(shareCode)
                }}
              >
                Try Again
              </ToastButton>
            </div>
          ),
          variant: 'destructive',
        })
      }
    )
  }

  if (isLoading) {
    return <div className='text-center py-12'>Loading saved shuffles...</div>
  }

  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Saved Shuffles</h1>
        <p className='mt-4 text-muted-foreground'>View and manage all your saved shuffles</p>
      </div>

      {savedShuffles.length === 0 ? (
        <div className='text-center py-12 bg-muted/20 rounded-md'>
          <p className='text-muted-foreground mb-4'>You haven&apos;t saved any shuffles yet.</p>
          <Button onClick={() => router.push('/')}>Shuffle Cards</Button>
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {savedShuffles.map((shuffle) => (
            <Card key={shuffle.id}>
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg'>Saved Shuffle</CardTitle>
                <CardDescription>{formatDate(shuffle.created_at)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={async () => {
                      console.log('Viewing saved shuffle with ID:', shuffle.id)

                      // Check if it has a valid ID
                      if (!shuffle.id) {
                        toast({
                          title: 'Error',
                          description: 'This shuffle cannot be viewed because it has no ID.',
                          variant: 'destructive',
                        })
                        return
                      }

                      // Verify the shuffle exists before navigating
                      const { data: checkResult, error: checkError } = await supabase
                        .from('shuffles')
                        .select('id, is_saved')
                        .eq('id', shuffle.id)
                        .single()

                      if (checkError || !checkResult) {
                        console.error('Error verifying shuffle:', checkError)
                        toast({
                          title: 'Error',
                          description: (
                            <div className='flex flex-col gap-2'>
                              <p>This shuffle could not be found. It may have been deleted.</p>
                              <ToastButton href='/' variant='destructive'>
                                Shuffle New Cards
                              </ToastButton>
                            </div>
                          ),
                          variant: 'destructive',
                        })
                        return
                      }

                      if (!checkResult.is_saved) {
                        console.log('Shuffle exists but is not saved, fixing...')
                        // Fix the saved status
                        await supabase
                          .from('shuffles')
                          .update({ is_saved: true })
                          .eq('id', shuffle.id)
                      }

                      router.push(`/shared/${shuffle.id}`)
                    }}
                  >
                    View
                  </Button>

                  {!shuffle.is_shared ? (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleShareShuffle(shuffle.id)}
                      disabled={sharingInProgress[shuffle.id]}
                    >
                      <Share2 className='h-4 w-4 mr-1' />
                      {sharingInProgress[shuffle.id] ? 'Sharing...' : 'Share'}
                    </Button>
                  ) : (
                    // Add copy button for already shared shuffles
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => copyShareUrl(shuffle.share_code || shuffle.id)}
                    >
                      <Copy className='h-4 w-4 mr-1' />
                      Copy Link
                    </Button>
                  )}

                  <Button
                    size='sm'
                    variant='outline'
                    className='text-destructive hover:bg-destructive/10'
                    onClick={() => handleDeleteShuffle(shuffle.id)}
                    disabled={deletingInProgress[shuffle.id]}
                  >
                    {deletingInProgress[shuffle.id] ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className='text-center'>
        <Button variant='outline' onClick={() => router.push('/profile')}>
          Back to Profile
        </Button>
      </div>
    </div>
  )
}
