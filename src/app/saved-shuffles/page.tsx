'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import supabase from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatDate, generateRandomString } from '@/lib/utils'
import { DbShuffle } from '@/types'
import { useToast } from '@/components/ui/use-toast'

export default function SavedShufflesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [savedShuffles, setSavedShuffles] = useState<DbShuffle[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    try {
      // First check if the shuffle already has a share code
      const { data: existingShuffle } = await supabase
        .from('shuffles')
        .select('share_code')
        .eq('id', shuffleId)
        .single()

      // Generate a share code if one doesn't exist
      const shareCode = existingShuffle?.share_code || generateRandomString(10)

      // Update the shuffle with is_shared: true and the share_code
      await supabase
        .from('shuffles')
        .update({
          is_shared: true,
          share_code: shareCode,
        })
        .eq('id', shuffleId)

      console.log('Shuffle shared with code:', shareCode)

      // Update local state
      setSavedShuffles(
        savedShuffles.map((s) =>
          s.id === shuffleId ? { ...s, is_shared: true, share_code: shareCode } : s
        )
      )

      toast({
        title: 'Shuffle shared',
        description: 'Your shuffle can now be shared with others.',
      })
    } catch (error) {
      console.error('Error sharing shuffle:', error)
      toast({
        title: 'Error sharing shuffle',
        description: 'There was a problem sharing your shuffle.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteShuffle = async (shuffleId: string) => {
    try {
      // Update the shuffle to mark it as not saved
      await supabase.from('shuffles').update({ is_saved: false }).eq('id', shuffleId)

      // Remove from local state
      setSavedShuffles(savedShuffles.filter((s) => s.id !== shuffleId))
    } catch (error) {
      console.error('Error deleting shuffle:', error)
    }
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
                          description: 'This shuffle could not be found. It may have been deleted.',
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

                  {!shuffle.is_shared && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleShareShuffle(shuffle.id)}
                    >
                      Share
                    </Button>
                  )}

                  <Button
                    size='sm'
                    variant='outline'
                    className='text-destructive hover:bg-destructive/10'
                    onClick={() => handleDeleteShuffle(shuffle.id)}
                  >
                    Remove
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
