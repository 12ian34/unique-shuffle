'use client'

import { useEffect } from 'react'
import { identifyUser, resetUser } from '@/lib/analytics'
import { usePostHog } from 'posthog-js/react'

/**
 * A hook that identifies the user in PostHog when they are authenticated
 * and resets the user in PostHog when they are not authenticated
 */
export function useAuthTracking(
  isAuthenticated: boolean,
  userId?: string | null,
  userProperties?: Record<string, any>
) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return

    if (isAuthenticated && userId) {
      // User is authenticated, identify them
      identifyUser(userId, userProperties)
    } else {
      // User is not authenticated, reset user
      resetUser()
    }
  }, [isAuthenticated, userId, userProperties, posthog])
}
