'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createDeck, shuffleDeck } from '@/lib/cards'
import { findPatterns, checkAchievements } from '@/lib/achievements'
import { Deck, Pattern, Achievement, LocalSavedShuffle } from '@/types'
import { useLocalProfile } from '@/contexts/LocalProfileContext'
import { useToast } from '@/components/ui/use-toast'
import { refreshShuffleStats } from '@/components/global-shuffle-counter'
import { BookmarkIcon, BookmarkFilledIcon } from '@radix-ui/react-icons'
import { ToastButton } from '@/components/ui/toast-button'
import { trackEvent } from '@/lib/analytics'
import { usePostHog } from 'posthog-js/react'
import dynamic from 'next/dynamic'

// Add dynamic component loading
const ShuffleAnimation = dynamic(() =>
  import('@/components/shuffle-animation').then((mod) => mod.ShuffleAnimation)
)
const ShuffleDisplay = dynamic(() =>
  import('@/components/shuffle-display').then((mod) => mod.ShuffleDisplay)
)

export default function HomePage() {
  const { profile, recordShuffle, saveShuffle } = useLocalProfile()
  const [shuffledDeck, setShuffledDeck] = useState<Deck | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [isShuffling, setIsShuffling] = useState(false)
  const [earnedAchievements, setEarnedAchievements] = useState<Achievement[]>([])
  const [showAnimation, setShowAnimation] = useState(false)
  const [animatedDeck, setAnimatedDeck] = useState<Deck | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { toast, dismiss } = useToast()
  const posthog = usePostHog()
  // Add a ref to track if a save operation is in progress
  const isSaveInProgressRef = useRef(false)
  // Add a ref to track if this shuffle has been processed
  const hasProcessedCurrentShuffleRef = useRef(false)
  // Add state for current shuffle ID and saved status
  const [currentShuffleId, setCurrentShuffleId] = useState<string | null>(null)
  const [currentShuffle, setCurrentShuffle] = useState<LocalSavedShuffle | null>(null)
  const [isShuffleSaved, setIsShuffleSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // Add new state for previously unlocked achievements
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [previouslyUnlockedAchievements, setPreviouslyUnlockedAchievements] = useState<
    Achievement[]
  >([])

  useEffect(() => {
    setIsAuthenticated(true)
    setUserPreviousAchievements(
      new Set(profile.earned_achievements.map((achievement) => achievement.achievement_id))
    )

    trackEvent('home_page_viewed', {
      isAuthenticated: false,
      storage: 'local',
    })
  }, [profile.earned_achievements])

  // Create ref to store previously earned achievements
  const userPreviousAchievementsRef = useRef(new Set<string>())

  // Function to set user's previously earned achievements
  const setUserPreviousAchievements = (achievementIds: Set<string>) => {
    userPreviousAchievementsRef.current = achievementIds
  }

  const handleShuffle = async () => {
    // Track user intent to shuffle (funnel step)
    trackEvent('shuffle_intent', {
      isAuthenticated: isAuthenticated === true,
    })

    // Reset the shuffle processing state for the new shuffle first
    hasProcessedCurrentShuffleRef.current = false
    isSaveInProgressRef.current = false

    setIsShuffling(true)
    setEarnedAchievements([])
    setShowAnimation(false)
    setShuffledDeck(null)
    setPatterns([])
    // Reset shuffle save states
    setCurrentShuffleId(null)
    setCurrentShuffle(null)
    setIsShuffleSaved(false)

    // Track shuffle start
    trackEvent('shuffle_started')

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

      // Track shuffle error
      trackEvent('shuffle_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleAnimationComplete = async () => {
    if (!animatedDeck) {
      // Reset state if no animated deck
      setIsShuffling(false)
      return
    }

    // Prevent multiple executions for the same shuffle
    if (hasProcessedCurrentShuffleRef.current) {
      // Reset state even if we're not processing
      setIsShuffling(false)
      return
    }

    // Mark as being processed
    hasProcessedCurrentShuffleRef.current = true

    // Prevent concurrent save operations
    if (isSaveInProgressRef.current) {
      // Reset state even if save is in progress
      setIsShuffling(false)
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

      // Track patterns found
      trackEvent('patterns_found', {
        patternCount: foundPatterns.length,
        patternTypes: foundPatterns.map((p) => p.type),
      })

      const earned = checkAchievements(animatedDeck, profile.total_shuffles + 1)
      const result = recordShuffle(animatedDeck, foundPatterns, earned)
      setCurrentShuffleId(result.shuffle.local_id)
      setCurrentShuffle(result.shuffle)
      setIsShuffleSaved(result.shuffle.is_saved)
      setEarnedAchievements(earned)
      setNewAchievements(result.newAchievements)
      setPreviouslyUnlockedAchievements(result.repeatedAchievements)

      if (result.newAchievements.length > 0) {
        trackEvent('achievements_earned', {
          achievementCount: result.newAchievements.length,
          achievementIds: result.newAchievements.map((a) => a.id),
          achievementTitles: result.newAchievements.map((a) => a.name),
        })
      }

      if (result.shuffle.is_saved) {
        toast({
          title: 'achievement shuffle saved',
          description: 'this shuffle was saved locally because it earned an achievement.',
          variant: 'success',
        })
      }

      try {
        await fetch('/api/shuffles/global-count', { method: 'POST' })
        refreshShuffleStats()
      } catch (fetchError) {
        console.error('Error incrementing global count:', fetchError)
      }
    } catch (error) {
      console.error('Error processing shuffle:', error)
    } finally {
      // Reset the save in progress flag
      isSaveInProgressRef.current = false
      setIsShuffling(false)
      setShowAnimation(false)
    }

    // Track results view (funnel step)
    trackEvent('shuffle_results_viewed', {
      isAuthenticated: isAuthenticated === true,
      shuffleId: currentShuffleId,
      deckSize: animatedDeck?.length || 52,
      patternCount: patterns.length,
    })
  }

  // Add a new function to handle saving a shuffle
  const handleSaveShuffle = async () => {
    // Track save intent (funnel step)
    trackEvent('shuffle_save_intent', {
      isAuthenticated: isAuthenticated === true,
      shuffleId: currentShuffleId,
    })

    if (!currentShuffleId || !currentShuffle) {
      toast({
        title: 'cannot save shuffle',
        description: 'shuffle again before saving.',
        variant: 'destructive',
        duration: 8000,
      })
      return
    }

    setIsSaving(true)

    try {
      saveShuffle(currentShuffle)
      setIsShuffleSaved(true)
      toast({
        title: 'shuffle saved',
        description: 'your shuffle has been saved locally.',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error saving shuffle:', error)
      toast({
        title: 'error saving shuffle',
        description: (
          <div className='flex flex-col gap-2'>
            <p>there was a problem saving your shuffle.</p>
            <ToastButton
              href='#'
              variant='destructive'
              onClick={(e) => {
                e.preventDefault()
                handleSaveShuffle()
              }}
            >
              try again
            </ToastButton>
          </div>
        ),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Add a debug function to help with diagnosing shuffle issues
  const debugShuffleCode = async (code: string) => {
    if (!code) {
      console.error('Please provide a shuffle code to debug')
      return
    }

    try {
      const response = await fetch(`/api/shuffle/verify?code=${code}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error debugging shuffle:', error)
    }
  }

  // Expose the debug function to the window object for debugging in console
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // @ts-ignore - Adding custom property to window for debugging
      window.debugShuffleCode = debugShuffleCode
    }
  }, [])

  // Safety effect to ensure isShuffling state gets reset if animation is dismissed
  useEffect(() => {
    if (!showAnimation && isShuffling) {
      // If animation is not showing but isShuffling is still true, reset it
      setIsShuffling(false)
    }
  }, [showAnimation, isShuffling])

  return (
    <div className='space-y-8 w-full overflow-hidden'>
      <div className='text-center max-w-2xl mx-auto'>
        <p className='text-lg text-muted-foreground mb-6 break-normal max-w-full'>
          there is a 1 in
          80,658,175,170,943,878,571,&#8203;660,636,856,403,766,975,289,&#8203;505,440,883,277,824,000,000,000,000
          chance that anyone has shuffled this before. it&apos;s probably unique...
        </p>
        <div className='flex justify-center'>
          <Button
            onClick={handleShuffle}
            disabled={isShuffling}
            size='lg'
            className='shadow-lg hover:shadow-primary/20 transition-all duration-300 relative group'
          >
            <span className='relative z-[5] font-bold tracking-wider animate-glow-text-subtle'>
              {isShuffling ? 'shuffling...' : 'shuffle'}
            </span>
            <span className='absolute inset-0 -z-[1] blur-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-80 rounded-md group-hover:opacity-90 group-hover:blur-md transition-all'></span>
            <span className='absolute -inset-1 -z-[2] scale-90 opacity-30 group-hover:opacity-40 group-hover:scale-110 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-xl rounded-lg transition-all duration-300'></span>
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
          {newAchievements.length > 0 && (
            <Card className='bg-primary/10 border-primary/20 card-hover'>
              <CardHeader>
                <CardTitle>new achievements unlocked!</CardTitle>
                <CardDescription>
                  these were saved to your local profile on this browser
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
                        new
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
                <CardTitle>achievements found again</CardTitle>
                <CardDescription>
                  you&apos;ve previously unlocked these achievements
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

          <Card className='mx-auto card-hover'>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>shuffled deck</CardTitle>
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
                      <span>saved</span>
                    </>
                  ) : (
                    <>
                      <BookmarkIcon className='h-4 w-4' />
                      <span>{isSaving ? 'saving...' : 'save'}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ShuffleDisplay deck={shuffledDeck} patterns={patterns} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
