'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import supabase from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatDate, generateRandomString } from '@/lib/utils'
import { DbShuffle, DbAchievement, UserProfile } from '@/types'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/protected-route'
import { Loader2, Pencil, X, Check } from 'lucide-react'
import { MAX_USERNAME_LENGTH } from '@/lib/constants'

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
              title: 'Profile Created',
              description: 'Your profile has been successfully created!',
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
          title: 'User not found',
          description: 'No user found with this username.',
          variant: 'destructive',
        })
        return
      }

      // Get current session for authentication
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      if (!session?.access_token) {
        toast({
          title: 'Authentication Error',
          description: 'You need to be logged in to send friend requests.',
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
          title: 'Friend request sent',
          description: 'Your friend request has been sent successfully.',
        })
        setFriendUsername('')
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send friend request.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
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
          title: 'Authentication Error',
          description: 'You need to be logged in to manage friend requests.',
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
          title: status === 'accepted' ? 'Friend request accepted' : 'Friend request rejected',
          description:
            status === 'accepted'
              ? 'You are now friends with this user.'
              : 'Friend request has been rejected.',
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
          title: 'Error',
          description: result.error || 'Failed to process friend request.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error handling friend request:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
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
        title: 'Username too long',
        description: `Username must be ${MAX_USERNAME_LENGTH} characters or less.`,
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
        title: 'Username updated',
        description: 'Your username has been successfully updated.',
      })
    } catch (error: any) {
      console.error('Error updating username:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update username. Please try again.',
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
        <Button onClick={() => router.push('/auth')}>Back to Sign In</Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground mb-4'>You need to be logged in to view your profile.</p>
        <Button onClick={() => router.push('/auth')}>Sign In</Button>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className='space-y-8'>
        <div className='text-center max-w-2xl mx-auto'>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Your Profile</h1>
          <p className='mt-4 text-muted-foreground'>View your stats and manage your account</p>
        </div>

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
            <CardDescription>Member since {formatDate(user?.created_at || '')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='bg-muted p-4 rounded-md text-center'>
                <div className='text-3xl font-bold mb-1'>{user.total_shuffles}</div>
                <div className='text-sm text-muted-foreground'>Total Shuffles</div>
              </div>
              <div className='bg-muted p-4 rounded-md text-center'>
                <div className='text-3xl font-bold mb-1'>{user.achievementCount}</div>
                <div className='text-sm text-muted-foreground'>Achievements</div>
              </div>
              <div className='bg-muted p-4 rounded-md text-center'>
                <div className='text-3xl font-bold mb-1'>{user.shuffle_streak}</div>
                <div className='text-sm text-muted-foreground'>Daily Streak</div>
              </div>
            </div>

            <div className='flex justify-end mt-6'>
              <Button variant='outline' onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='saved'>
          <TabsList className='grid w-full grid-cols-3 mb-8'>
            <TabsTrigger value='saved'>Saved Shuffles</TabsTrigger>
            <TabsTrigger value='achievements'>Recent Achievements</TabsTrigger>
            <TabsTrigger value='friends'>Friends</TabsTrigger>
          </TabsList>

          <TabsContent value='saved'>
            {savedShuffles.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                You haven&apos;t saved any shuffles yet. Save interesting shuffles to view them
                here!
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                {savedShuffles.map((shuffle) => (
                  <Card key={shuffle.id}>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg'>Saved Shuffle</CardTitle>
                      <CardDescription>{formatDate(shuffle.created_at)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='flex justify-between'>
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
                                description:
                                  'This shuffle could not be found. It may have been deleted.',
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
                            onClick={async () => {
                              // First check if the shuffle already has a share code
                              const { data: existingShuffle } = await supabase
                                .from('shuffles')
                                .select('share_code')
                                .eq('id', shuffle.id)
                                .single()

                              // Generate a share code if one doesn't exist
                              const shareCode =
                                existingShuffle?.share_code || generateRandomString(10)

                              // Update the shuffle with is_shared: true and the share_code
                              await supabase
                                .from('shuffles')
                                .update({
                                  is_shared: true,
                                  share_code: shareCode,
                                })
                                .eq('id', shuffle.id)

                              console.log('Shuffle shared with code:', shareCode)

                              // Update local state
                              setSavedShuffles(
                                savedShuffles.map((s) =>
                                  s.id === shuffle.id
                                    ? { ...s, is_shared: true, share_code: shareCode }
                                    : s
                                )
                              )

                              toast({
                                title: 'Shuffle shared',
                                description: 'Your shuffle can now be shared with others.',
                              })
                            }}
                          >
                            Share
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {savedShuffles.length > 0 && (
              <div className='text-center mt-8'>
                <Button variant='outline' onClick={() => router.push('/saved-shuffles')}>
                  View All Saved Shuffles
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='achievements'>
            {userAchievements.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                You haven&apos;t earned any achievements yet. Start shuffling to unlock
                achievements!
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                {userAchievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg'>{achievement.achievement_id}</CardTitle>
                      <CardDescription>
                        Earned on {formatDate(achievement.achieved_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {achievement.shuffle_id && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            console.log('Viewing achievement shuffle:', {
                              achievementId: achievement.id,
                              shuffleId: achievement.shuffle_id,
                            })
                            router.push(`/shared/${achievement.shuffle_id}`)
                          }}
                        >
                          View Shuffle
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
                  View All Achievements
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='friends'>
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Add Friend</CardTitle>
                  <CardDescription>Enter a username to send a friend request</CardDescription>
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
                      Send Request
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {pendingRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Friend Requests</CardTitle>
                    <CardDescription>People who want to be your friend</CardDescription>
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
                              Accept
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleFriendRequest(request.id, 'rejected')}
                            >
                              Reject
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
                  <CardTitle>Friends</CardTitle>
                  <CardDescription>
                    {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {friends.length === 0 ? (
                    <div className='text-center py-4 text-muted-foreground'>
                      You don&apos;t have any friends yet. Send requests to add friends.
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
                            View Profile
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
