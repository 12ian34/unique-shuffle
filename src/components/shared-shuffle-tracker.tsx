'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface SharedShuffleTrackerProps {
  shuffleId: string
  shareCode: string
  viewCount: number
  username: string
  patternCount: number
}

export function SharedShuffleTracker({
  shuffleId,
  shareCode,
  viewCount,
  username,
  patternCount,
}: SharedShuffleTrackerProps) {
  const posthog = usePostHog()

  // Track the shared shuffle view on component mount
  useEffect(() => {
    if (posthog) {
      posthog.capture('shared_shuffle_viewed', {
        shuffleId,
        shareCode,
        viewCount,
        username,
        patternCount,
        viewSource: document.referrer || 'direct',
      })
    }
  }, [posthog, shuffleId, shareCode, viewCount, username, patternCount])

  return null
}
