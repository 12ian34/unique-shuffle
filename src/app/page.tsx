'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createDeck, shuffleDeck } from '@/lib/cards'
import { findPatterns } from '@/lib/achievements'
import { Deck, Pattern, Achievement } from '@/types'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { ShuffleAnimation } from '@/components/shuffle-animation'
import supabase from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { refreshShuffleStats } from '@/components/global-shuffle-counter'
import { refreshUserStats } from '@/components/user-stats-provider'
import { BookmarkIcon, BookmarkFilledIcon } from '@radix-ui/react-icons'
import { generateRandomString } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const [shuffledDeck, setShuffledDeck] = useState<Deck | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [isShuffling, setIsShuffling] = useState(false)
  const [earnedAchievements, setEarnedAchievements] = useState<Achievement[]>([])
  const [showAnimation, setShowAnimation] = useState(false)
  const [animatedDeck, setAnimatedDeck] = useState<Deck | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { toast } = useToast()
  // Add a ref to track if a save operation is in progress
  const isSaveInProgressRef = useRef(false)
  // Add a ref to track if this shuffle has been processed
  const hasProcessedCurrentShuffleRef = useRef(false)
  // Add state for current shuffle ID and saved status
  const [currentShuffleId, setCurrentShuffleId] = useState<string | null>(null)
  const [isShuffleSaved, setIsShuffleSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // Add new state for previously unlocked achievements
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [previouslyUnlockedAchievements, setPreviouslyUnlockedAchievements] = useState<
    Achievement[]
  >([])

  useEffect(() => {
    // Check auth status when component mounts
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)

      // If authenticated, refresh the stats immediately
      if (data.session) {
        console.log('User authenticated on page load, refreshing stats')
        refreshShuffleStats() // Refresh global stats
        refreshUserStats() // Refresh user stats

        // Fetch previously earned achievements
        const { data: userAchievements } = await supabase
          .from('achievements')
          .select('achievement_id')
          .eq('user_id', data.session.user.id)

        // Create a set of previously earned achievement IDs
        const previouslyEarnedAchievementIds = new Set(
          userAchievements?.map((a) => a.achievement_id) || []
        )

        // Store this set for later use
        setUserPreviousAchievements(previouslyEarnedAchievementIds)
      }
    }

    checkAuth()
  }, [])

  // Create ref to store previously earned achievements
  const userPreviousAchievementsRef = useRef(new Set<string>())

  // Function to set user's previously earned achievements
  const setUserPreviousAchievements = (achievementIds: Set<string>) => {
    userPreviousAchievementsRef.current = achievementIds
  }

  const handleShuffle = async () => {
    setIsShuffling(true)
    setEarnedAchievements([])
    setShowAnimation(false)
    setShuffledDeck(null)
    setPatterns([])
    // Reset shuffle save states
    setCurrentShuffleId(null)
    setIsShuffleSaved(false)

    // Reset the shuffle processing state for the new shuffle
    hasProcessedCurrentShuffleRef.current = false
    isSaveInProgressRef.current = false

    try {
      // Create and shuffle a new deck
      const deck = createDeck()
      const shuffled = shuffleDeck(deck)

      // Show the animation
      setAnimatedDeck(shuffled)
      setShowAnimation(true)

      // When animation is complete, the onCompleteAction callback will
      // set the shuffled deck and find patterns
    } catch (error) {
      console.error('Error shuffling deck:', error)
      setIsShuffling(false)
    }
  }

  const handleAnimationComplete = async () => {
    if (!animatedDeck) return

    // Prevent multiple executions for the same shuffle
    if (hasProcessedCurrentShuffleRef.current) {
      console.log('This shuffle has already been processed, skipping')
      return
    }

    // Mark as being processed
    hasProcessedCurrentShuffleRef.current = true

    // Prevent concurrent save operations
    if (isSaveInProgressRef.current) {
      console.log('Save operation already in progress, skipping')
      return
    }

    // Set flag to indicate a save is in progress
    isSaveInProgressRef.current = true

    try {
      // Set the deck after animation
      setShuffledDeck(animatedDeck)

      // Find patterns in the shuffled deck
      const foundPatterns = findPatterns(animatedDeck)
      setPatterns(foundPatterns)

      // Get the current user and auth session
      const { data: authData } = await supabase.auth.getSession()
      const accessToken = authData.session?.access_token
      console.log('Auth Session Check:', authData.session ? 'Active session' : 'No session')

      // If not authenticated, show a toast with info about signing in
      if (!authData.session) {
        toast({
          title: 'Shuffle not saved',
          description: 'Sign in to save your shuffles and track achievements!',
          duration: 5000,
        })
        return
      }

      let saveSuccessful = false

      if (accessToken) {
        // Track the shuffle via API with auth token included in headers
        try {
          const response = await fetch('/api/shuffle/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: 'include',
            body: JSON.stringify({ cards: animatedDeck }),
          })

          console.log('API Response Status:', response.status)

          if (response.ok) {
            const data = await response.json()
            console.log('Shuffle tracked successfully:', data.saved ? 'Saved to DB' : 'Not saved')
            saveSuccessful = true

            // Store the shuffle ID for save functionality
            if (data.shuffle && data.shuffle.id) {
              setCurrentShuffleId(data.shuffle.id)
              setIsShuffleSaved(data.shuffle.is_saved || false)
            }

            // Update any earned achievements
            if (data.achievements && data.achievements.length > 0) {
              // Store all earned achievements
              setEarnedAchievements(data.achievements)

              // Separate new achievements from previously unlocked ones
              const newlyEarned: Achievement[] = []
              const previouslyUnlocked: Achievement[] = []

              data.achievements.forEach((achievement: Achievement) => {
                if (userPreviousAchievementsRef.current.has(achievement.id)) {
                  previouslyUnlocked.push(achievement)
                } else {
                  newlyEarned.push(achievement)
                  // Add to our set of previously earned achievements for future shuffles
                  userPreviousAchievementsRef.current.add(achievement.id)
                }
              })

              setNewAchievements(newlyEarned)
              setPreviouslyUnlockedAchievements(previouslyUnlocked)
            }

            // If we received userStats in the response, update the UI immediately
            if (data.userStats) {
              console.log('Updating UI with received user stats:', data.userStats)
              // Dispatch an event to update the stats immediately
              const statsUpdateEvent = new CustomEvent('statsUpdate', {
                detail: {
                  userStats: data.userStats,
                },
              })
              window.dispatchEvent(statsUpdateEvent)
            } else {
              // Fallback to refresh from API
              refreshShuffleStats()
              refreshUserStats()
            }
          } else {
            console.error('API failed with status:', response.status)
            const errorData = await response.json().catch(() => ({}))
            console.error('Error details:', errorData)
            // API failed, we'll try direct DB access below
          }
        } catch (fetchError) {
          console.error('Error in fetch call:', fetchError)
          // Fetch call failed, we'll try direct DB access below
        }
      }

      // Only if the API method failed, try the direct method
      if (!saveSuccessful && authData.session) {
        console.log('API save failed or unavailable, using direct DB access')
        await saveShuffleDirect(authData.session, animatedDeck)
      }
    } catch (error) {
      console.error('Error processing shuffle:', error)
    } finally {
      // Reset the save in progress flag
      isSaveInProgressRef.current = false
      setIsShuffling(false)
      setShowAnimation(false)
    }
  }

  // Helper function to save shuffle directly to DB
  const saveShuffleDirect = async (session: any, deck: Deck) => {
    if (!session?.user) {
      console.log('No active session for direct DB access')
      return
    }

    try {
      console.log('Trying direct DB access')
      // Get user stats first
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userData) {
        // Save shuffle directly
        const { data: shuffle, error: shuffleError } = await supabase
          .from('shuffles')
          .insert({
            user_id: session.user.id,
            cards: deck,
          })
          .select()
          .single()

        if (shuffleError) {
          console.error('Error saving shuffle directly:', shuffleError)
          return
        }

        if (shuffle) {
          // Store the shuffle ID for save functionality
          setCurrentShuffleId(shuffle.id)
          setIsShuffleSaved(shuffle.is_saved || false)

          // Update user stats
          const { error: updateError } = await supabase
            .from('users')
            .update({
              total_shuffles: (userData.total_shuffles || 0) + 1,
              last_shuffle_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
              updated_at: new Date().toISOString(),
              // Note: shuffle_streak is managed by the database trigger
            })
            .eq('id', session.user.id)

          if (updateError) {
            console.error('Error updating user stats:', updateError)
            return
          }

          console.log('Shuffle saved directly to database')

          // Get updated user stats after the update
          const { data: updatedUser, error: fetchUpdatedUserError } = await supabase
            .from('users')
            .select('total_shuffles, shuffle_streak, last_shuffle_date')
            .eq('id', session.user.id)
            .single()

          if (fetchUpdatedUserError) {
            console.error('Error fetching updated user stats:', fetchUpdatedUserError)
            // Fallback to refresh API if we couldn't get updated stats
            refreshShuffleStats()
            refreshUserStats()
          } else {
            console.log('Updated user stats:', updatedUser)
            // Dispatch event with updated stats
            const statsUpdateEvent = new CustomEvent('statsUpdate', {
              detail: {
                userStats: updatedUser,
              },
            })
            window.dispatchEvent(statsUpdateEvent)
          }
        }
      } else {
        console.log('User data not found for direct DB access')
      }
    } catch (error) {
      console.error('Error in direct DB access:', error)
    }
  }

  // Add a new function to handle saving a shuffle
  const handleSaveShuffle = async () => {
    if (!currentShuffleId || !isAuthenticated) {
      toast({
        title: 'Cannot save shuffle',
        description: 'Please sign in to save shuffles.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      // Use direct Supabase client to update the shuffle
      const { data: updatedShuffle, error } = await supabase
        .from('shuffles')
        .update({
          is_saved: true,
          // We should not generate a share_code here - it should only be generated when sharing
        })
        .eq('id', currentShuffleId)
        .select()
        .single()

      console.log('Save shuffle result:', {
        success: !error,
        shuffleId: updatedShuffle?.id,
        isSaved: updatedShuffle?.is_saved,
        error,
      })

      if (error) {
        console.error('Error saving shuffle:', error)
        toast({
          title: 'Error saving shuffle',
          description: 'There was a problem saving your shuffle.',
          variant: 'destructive',
        })
      } else {
        setIsShuffleSaved(true)
        toast({
          title: 'Shuffle saved',
          description: 'Your shuffle has been saved to your profile.',
        })

        // Refresh user stats to update saved shuffle count
        refreshUserStats()
      }
    } catch (error) {
      console.error('Error saving shuffle:', error)
      toast({
        title: 'Error saving shuffle',
        description: 'There was a problem saving your shuffle.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='space-y-8 w-full overflow-x-hidden'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-4xl font-bold tracking-tight sm:text-5xl mb-4 gradient-text'>
          Unique Shuffle
        </h1>
        <p className='text-lg text-muted-foreground mb-6 break-all'>
          There is a 1 in
          80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
          chance that anyone has shuffled this before. It&apos;s probably unique:
        </p>
        <div className='flex justify-center'>
          <Button
            onClick={handleShuffle}
            disabled={isShuffling}
            size='lg'
            className='shadow-lg hover:shadow-primary/20 transition-all duration-300'
          >
            {isShuffling ? 'Shuffling...' : 'Shuffle Cards'}
          </Button>
        </div>
      </div>

      {showAnimation && animatedDeck && (
        <Card className='mx-auto card-hover'>
          <CardContent className='p-6'>
            <ShuffleAnimation
              deck={animatedDeck}
              onCompleteAction={handleAnimationComplete}
              isShuffling={isShuffling}
            />
          </CardContent>
        </Card>
      )}

      {shuffledDeck && (
        <>
          <Card className='mx-auto card-hover'>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Shuffled Deck</CardTitle>
                {isAuthenticated && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleSaveShuffle}
                    disabled={isShuffleSaved || isSaving}
                    className='flex items-center gap-1'
                  >
                    {isShuffleSaved ? (
                      <>
                        <BookmarkFilledIcon className='h-4 w-4 text-primary' />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <BookmarkIcon className='h-4 w-4' />
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ShuffleDisplay deck={shuffledDeck} />
            </CardContent>
          </Card>

          {newAchievements.length > 0 && (
            <Card className='bg-primary/10 border-primary/20 card-hover'>
              <CardHeader>
                <CardTitle>New Achievements Unlocked!</CardTitle>
                <CardDescription>
                  Congratulations on earning these for the first time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3'>
                  {newAchievements.map((achievement, index) => (
                    <li
                      key={index}
                      className='flex items-start gap-3 bg-background/50 p-3 rounded-md'
                    >
                      <span className='bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-medium'>
                        NEW
                      </span>
                      <div>
                        <p className='font-medium'>{achievement.name}</p>
                        <p className='text-sm text-muted-foreground'>{achievement.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {previouslyUnlockedAchievements.length > 0 && (
            <Card className='bg-muted/30 border-muted card-hover'>
              <CardHeader>
                <CardTitle>Achievements Found Again</CardTitle>
                <CardDescription>
                  You&apos;ve previously unlocked these achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3'>
                  {previouslyUnlockedAchievements.map((achievement, index) => (
                    <li
                      key={index}
                      className='flex items-start gap-3 bg-background/50 p-3 rounded-md'
                    >
                      <div>
                        <p className='font-medium'>{achievement.name}</p>
                        <p className='text-sm text-muted-foreground'>{achievement.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
