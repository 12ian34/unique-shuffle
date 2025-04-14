'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ScrollableTabsList, TabsTrigger } from '@/components/ui/scrollable-tabs'
import supabase from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatDate, generateRandomString } from '@/lib/utils'
import { DbShuffle, DbAchievement, UserProfile } from '@/types'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/protected-route'
import { Loader2, Pencil, X, Check, Copy, Share2 } from 'lucide-react'
import { MAX_USERNAME_LENGTH } from '@/lib/constants'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useTheme } from 'next-themes'
import { ToastButton } from '@/components/ui/toast-button'
import { trackEvent } from '@/lib/analytics'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser, signOut } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [savedShuffles, setSavedShuffles] = useState<DbShuffle[]>([])
  const [userAchievements, setUserAchievements] = useState<DbAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [friendUsername, setFriendUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [sharingInProgress, setSharingInProgress] = useState<Record<string, boolean>>({})
  const [deletingInProgress, setDeletingInProgress] = useState<Record<string, boolean>>({})
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    async function fetchProfileData() {
      setIsLoading(true)
      setError(null)

      try {
        if (!authUser) {
          // Redirect to auth page if not logged in
          router.push('/auth')
          return
        }

        // Ensure we have a valid user ID
        if (!authUser.id) {
          console.error('Invalid user ID')
          setError('Invalid user ID. Please sign out and sign in again.')
          return
        }

        // Fetch user profile - fixed query with proper headers
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) {
          console.error('Error fetching user profile:', userError)

          // If the error is that the user profile doesn't exist yet
          if (userError.code === 'PGRST116' || userError.message.includes('no rows')) {
            // Profile doesn't exist yet, attempt to create it
            setIsCreatingProfile(true)
            const username =
              authUser.user_metadata?.username || `user-${authUser.id.substring(0, 8)}`

            const { error: insertError } = await supabase.from('users').insert({
              id: authUser.id,
              username,
              email: authUser.email,
              total_shuffles: 0,
              shuffle_streak: 0,
              created_at: new Date().toISOString(),
            })

            if (insertError) {
              console.error('Error creating user profile:', insertError)
              setError('Error creating your profile. Please refresh or try again later.')
              return
            }

            // Fetch the newly created profile
            const { data: newProfile, error: refetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single()

            if (refetchError) {
              console.error('Error fetching newly created profile:', refetchError)
              setError(
                'Your profile was created but there was an error loading it. Please refresh the page.'
              )
              return
            }

            setUser({
              ...newProfile,
              achievementCount: 0,
              savedShuffleCount: 0,
            })

            setIsCreatingProfile(false)
            toast({
              title: 'profile created',
              description: 'your profile has been successfully created!',
            })
            return
          } else {
            setError('Error loading your profile. Please refresh or try again later.')
            return
          }
        }

        if (userData) {
          // Fetch achievements for counting unique types
          const { data: achievementRecords } = await supabase
            .from('achievements')
            .select('achievement_id')
            .eq('user_id', authUser.id)

          // Count unique achievement types
          const uniqueAchievements = new Set()
          if (achievementRecords) {
            achievementRecords.forEach((a) => uniqueAchievements.add(a.achievement_id))
          }
          const achievementCount = uniqueAchievements.size

          // Fetch saved shuffle count
          const { count: savedShuffleCount } = await supabase
            .from('shuffles')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
            .eq('is_saved', true)

          setUser({
            ...userData,
            achievementCount: achievementCount || 0,
            savedShuffleCount: savedShuffleCount || 0,
          })

          // Fetch saved shuffles
          const { data: shuffles } = await supabase
            .from('shuffles')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('is_saved', true)
            .order('created_at', { ascending: false })
            .limit(5)

          setSavedShuffles(shuffles || [])

          // Fetch recent achievement records with all details
          const { data: recentAchievements } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', authUser.id)
            .order('achieved_at', { ascending: false })
            .limit(5)

          setUserAchievements(recentAchievements || [])
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
        setError('An unexpected error occurred. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    if (authUser) {
      fetchProfileData()
    }
  }, [router, authUser, toast])

  // Fetch friends and pending requests
  useEffect(() => {
    async function fetchFriendsData() {
      try {
        // Get current session for authentication
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session

        if (!session?.access_token) {
          console.error('No access token available')
          return
        }

        // Clear any existing friends data
        setFriends([])
        setPendingRequests([])

        // Fetch accepted friends
        try {
          const friendsResponse = await fetch('/api/friends?status=accepted', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          })

          if (!friendsResponse.ok) {
            const errorData = await friendsResponse.json()
            console.error('Error fetching friends:', friendsResponse.status, errorData)

            // Don't throw if it's just that there are no friends
            if (friendsResponse.status !== 500) {
              return
            }
          }

          const friendsData = await friendsResponse.json()
          setFriends(friendsData.data || [])
        } catch (error) {
          console.error('Exception fetching friends:', error)
        }

        // Fetch pending requests received
        try {
          const pendingResponse = await fetch('/api/friends?status=pending', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          })

          if (!pendingResponse.ok) {
            const errorData = await pendingResponse.json()
            console.error('Error fetching pending requests:', pendingResponse.status, errorData)
            return
          }

          const pendingData = await pendingResponse.json()

          // Filter to only show requests where the user is not the requester
          const receivedRequests = (pendingData.data || []).filter((req: any) => !req.isRequester)
          setPendingRequests(receivedRequests)
        } catch (error) {
          console.error('Exception fetching pending requests:', error)
        }
      } catch (error) {
        console.error('Error in fetchFriendsData:', error)
      }
    }

    if (user) {
      fetchFriendsData()
    }
  }, [user])

  const handleSendFriendRequest = async () => {
    if (!friendUsername.trim()) return

    setIsSubmitting(true)
    try {
      // Find user by username
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', friendUsername.trim())
        .single()

      if (!userData) {
        toast({
          title: 'user not found',
          description: 'no user found with this username.',
          variant: 'destructive',
        })
        return
      }

      // Get current session for authentication
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      if (!session?.access_token) {
        toast({
          title: 'authentication error',
          description: 'you need to be logged in to send friend requests.',
          variant: 'destructive',
        })
        return
      }

      // Send friend request
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ friendId: userData.id }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'friend request sent',
          description: 'your friend request has been sent successfully.',
        })
        setFriendUsername('')
      } else {
        toast({
          title: 'error',
          description: result.error || 'failed to send friend request.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast({
        title: 'error',
        description: 'something went wrong. please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFriendRequest = async (friendshipId: string, status: 'accepted' | 'rejected') => {
    try {
      // Get current session for authentication
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      if (!session?.access_token) {
        toast({
          title: 'authentication error',
          description: 'you need to be logged in to manage friend requests.',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ friendshipId, status }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: status === 'accepted' ? 'friend request accepted' : 'friend request rejected',
          description:
            status === 'accepted'
              ? 'you are now friends with this user.'
              : 'friend request has been rejected.',
        })

        // Update the UI by removing the request
        setPendingRequests(pendingRequests.filter((req) => req.id !== friendshipId))

        // If accepted, add to friends list
        if (status === 'accepted') {
          const accepted = pendingRequests.find((req) => req.id === friendshipId)
          if (accepted) {
            setFriends([...friends, { ...accepted, status: 'accepted' }])
          }
        }
      } else {
        toast({
          title: 'error',
          description: result.error || 'failed to process friend request.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error handling friend request:', error)
      toast({
        title: 'error',
        description: 'something went wrong. please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || !user) return

    // Validate username
    if (newUsername.length > MAX_USERNAME_LENGTH) {
      toast({
        title: 'username too long',
        description: `username must be ${MAX_USERNAME_LENGTH} characters or less.`,
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingUsername(true)
    try {
      // Update username in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: newUsername.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setUser((prev) => (prev ? { ...prev, username: newUsername.trim() } : null))
      setIsEditingUsername(false)

      toast({
        title: 'username updated',
        description: 'your username has been successfully updated.',
        variant: 'success',
      })

      // Add tracking
      trackEvent('profile_updated', {
        username: newUsername, // Or other profile details you want to track
      })
    } catch (error: any) {
      console.error('Error updating username:', error)
      toast({
        title: 'error',
        description: error.message || 'failed to update username. please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const startEditingUsername = () => {
    if (user) {
      setNewUsername(user.username)
      setIsEditingUsername(true)
    }
  }

  const cancelEditingUsername = () => {
    setIsEditingUsername(false)
  }

  // Add a function to handle copying the share URL
  const copyShareUrl = (shareCode: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareCode}`
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        toast({
          title: 'copied to clipboard',
          description: 'share url has been copied to your clipboard',
          duration: 2000,
          variant: 'info',
        })
      },
      (err) => {
        console.error('Could not copy text: ', err)
        toast({
          title: 'failed to copy',
          description: (
            <div className='flex flex-col gap-2'>
              <p>please try again or copy the url manually</p>
              <ToastButton href='/support' variant='destructive'>
                get help
              </ToastButton>
            </div>
          ),
          variant: 'destructive',
        })
      }
    )
  }

  // Add the handleDeleteShuffle function
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

  // Add a useEffect to track page view
  useEffect(() => {
    trackEvent('profile_page_viewed')
  }, [])

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center text-center py-12'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin mb-4' />
        <p>Loading your profile...</p>
      </div>
    )
  }

  if (isCreatingProfile) {
    return (
      <div className='flex flex-col items-center justify-center text-center py-12'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin mb-4' />
        <p>Creating your profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-500 mb-4'>{error}</p>
        <Button onClick={() => router.push('/auth')}>back to login</Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='text-center'>
        {error ? (
          <p className='text-red-500 mb-4'>{error}</p>
        ) : (
          <p className='text-muted-foreground mb-4'>
            you need to be logged in to view your profile.
          </p>
        )}
        <Button onClick={() => router.push('/auth')}>login</Button>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className='space-y-8'>
        <Card>
          <CardHeader>
            {!isEditingUsername ? (
              <div className='flex items-center justify-between'>
                <CardTitle>{user?.username}</CardTitle>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={startEditingUsername}
                  aria-label='Edit username'
                >
                  <Pencil className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder='New username'
                  maxLength={MAX_USERNAME_LENGTH}
                  disabled={isUpdatingUsername}
                  className='max-w-xs'
                />
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleUpdateUsername}
                  disabled={
                    isUpdatingUsername || !newUsername.trim() || newUsername === user?.username
                  }
                  aria-label='Save username'
                >
                  {isUpdatingUsername ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Check className='h-4 w-4' />
                  )}
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={cancelEditingUsername}
                  disabled={isUpdatingUsername}
                  aria-label='Cancel editing'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            )}
            <CardDescription>shuffler since {formatDate(user?.created_at || '')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='bg-muted p-4 rounded-md text-center'>
                <div className='text-3xl font-bold mb-1'>{user.total_shuffles}</div>
                <div className='text-sm text-muted-foreground'>shuffles</div>
              </div>
              <div className='bg-muted p-4 rounded-md text-center'>
                <div className='text-3xl font-bold mb-1'>{user.achievementCount}</div>
                <div className='text-sm text-muted-foreground'>achievements</div>
              </div>
              <div className='bg-muted p-4 rounded-md text-center'>
                <div className='text-3xl font-bold mb-1'>{user.shuffle_streak}</div>
                <div className='text-sm text-muted-foreground'>streak</div>
              </div>
            </div>

            {/* Theme toggle */}
            <div className='flex items-center justify-between mt-8 p-4 bg-muted rounded-md'>
              <div>
                <div className='font-medium'>appearance</div>
                <div className='text-sm text-muted-foreground'>dark / light mode</div>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-sm'>{theme === 'dark' ? 'dark' : 'light'} mode</span>
                <ThemeToggle />
              </div>
            </div>

            <div className='flex justify-end mt-6'>
              <Button variant='outline' onClick={handleSignOut}>
                sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='saved'>
          <ScrollableTabsList variant='underline' className='mb-8'>
            <TabsTrigger variant='underline' value='saved'>
              saved shuffles
            </TabsTrigger>
            <TabsTrigger variant='underline' value='achievements'>
              recent achievements
            </TabsTrigger>
            <TabsTrigger variant='underline' value='friends'>
              friends
            </TabsTrigger>
          </ScrollableTabsList>

          <TabsContent value='saved'>
            {savedShuffles.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                you haven&apos;t saved any shuffles yet. save interesting shuffles to view them
                here!
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                {savedShuffles.map((shuffle) => (
                  <Card key={shuffle.id}>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg'>saved shuffle</CardTitle>
                      <CardDescription>{formatDate(shuffle.created_at)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={async () => {
                            // Check if it has a valid ID
                            if (!shuffle.id) {
                              toast({
                                title: 'error',
                                description: 'this shuffle cannot be viewed because it has no id.',
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
                                title: 'error',
                                description:
                                  'this shuffle could not be found. it may have been deleted.',
                                variant: 'destructive',
                              })
                              return
                            }

                            if (!checkResult.is_saved) {
                              // Fix the saved status
                              await supabase
                                .from('shuffles')
                                .update({ is_saved: true })
                                .eq('id', shuffle.id)
                            }

                            router.push(`/shared/${shuffle.id}`)
                          }}
                        >
                          view
                        </Button>

                        {!shuffle.is_shared ? (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={async () => {
                              // Prevent sharing if already in progress
                              if (sharingInProgress[shuffle.id]) return

                              // Set sharing in progress for this shuffle
                              setSharingInProgress((prev) => ({ ...prev, [shuffle.id]: true }))

                              try {
                                // Generate a share code for the shuffle
                                const shareCode = generateRandomString(10)

                                // Update the shuffle with share code and sharing flag
                                await supabase
                                  .from('shuffles')
                                  .update({
                                    is_shared: true,
                                    share_code: shareCode,
                                  })
                                  .eq('id', shuffle.id)

                                // Update shuffle in local state
                                setSavedShuffles(
                                  savedShuffles.map((s) =>
                                    s.id === shuffle.id
                                      ? { ...s, is_shared: true, share_code: shareCode }
                                      : s
                                  )
                                )

                                // Copy the share link to clipboard
                                const shareUrl = `${window.location.origin}/shared/${shareCode}`
                                navigator.clipboard.writeText(shareUrl)

                                // Show success toast
                                toast({
                                  title: 'Shuffle shared',
                                  description: 'Share link copied to clipboard',
                                  variant: 'success',
                                })

                                const data = { shareCode }
                                return data
                              } catch (error) {
                                console.error('Error sharing shuffle:', error)
                                toast({
                                  title: 'Error sharing shuffle',
                                  description: 'There was a problem sharing this shuffle.',
                                  variant: 'destructive',
                                })
                                return null
                              } finally {
                                // Clear sharing in progress
                                setSharingInProgress((prev) => ({ ...prev, [shuffle.id]: false }))
                              }
                            }}
                          >
                            {sharingInProgress[shuffle.id] ? (
                              <Loader2 className='h-4 w-4 animate-spin mr-2' />
                            ) : (
                              <Share2 className='h-4 w-4 mr-2' />
                            )}
                            share
                          </Button>
                        ) : (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              if (shuffle.share_code) {
                                copyShareUrl(shuffle.share_code)
                              } else {
                                copyShareUrl(shuffle.id)
                              }
                            }}
                          >
                            <Copy className='h-4 w-4 mr-2' />
                            copy link
                          </Button>
                        )}

                        <Button
                          size='sm'
                          variant='outline'
                          className='text-destructive hover:bg-destructive/10'
                          onClick={() => handleDeleteShuffle(shuffle.id)}
                          disabled={deletingInProgress[shuffle.id]}
                        >
                          {deletingInProgress[shuffle.id] ? 'removing...' : 'remove'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {savedShuffles.length > 0 && (
              <div className='text-center mt-8'>
                <Button variant='outline' onClick={() => router.push('/saved-shuffles')}>
                  view all saved shuffles
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='achievements'>
            {userAchievements.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                you haven&apos;t earned any achievements yet. start shuffling to unlock
                achievements!
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                {userAchievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg'>{achievement.achievement_id}</CardTitle>
                      <CardDescription>
                        earned on {formatDate(achievement.achieved_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {achievement.shuffle_id && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            router.push(`/shared/${achievement.shuffle_id}`)
                          }}
                        >
                          view shuffle
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {userAchievements.length > 0 && (
              <div className='text-center mt-8'>
                <Button variant='outline' onClick={() => router.push('/achievements')}>
                  view all achievements
                </Button>
              </div>
            )}

            {/* Add tracking */}
            {userAchievements.length > 0 && (
              <div className='text-center mt-8'>
                <Button
                  variant='outline'
                  onClick={() => {
                    router.push('/achievements')
                    trackEvent('profile_achievements_viewed')
                  }}
                >
                  view all achievements
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='friends'>
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>add friend</CardTitle>
                  <CardDescription>enter a username to send a friend request</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Username'
                      value={friendUsername}
                      onChange={(e) => setFriendUsername(e.target.value)}
                    />
                    <Button
                      onClick={handleSendFriendRequest}
                      disabled={isSubmitting || !friendUsername.trim()}
                    >
                      send request
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {pendingRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>friend requests</CardTitle>
                    <CardDescription>people who want to be your friend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className='flex items-center justify-between p-2 border rounded'
                        >
                          <span className='font-medium'>{request.username}</span>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleFriendRequest(request.id, 'accepted')}
                            >
                              accept
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleFriendRequest(request.id, 'rejected')}
                            >
                              reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>friends</CardTitle>
                  <CardDescription>
                    {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {friends.length === 0 ? (
                    <div className='text-center py-4 text-muted-foreground'>
                      you don&apos;t have any friends yet. send requests to add friends.
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className='flex items-center justify-between p-2 border rounded'
                        >
                          <span className='font-medium'>{friend.username}</span>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => router.push(`/profile/${friend.username}`)}
                          >
                            view profile
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
