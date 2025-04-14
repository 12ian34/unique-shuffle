/**
 * Helper functions for tracking events
 */

import posthog from 'posthog-js'

interface TrackEvent {
  (eventName: string, properties?: Record<string, any>): void
}

/**
 * Track an event using PostHog.
 * This is a wrapper around posthog.capture that gracefully handles cases where PostHog isn't loaded.
 */
export const trackEvent: TrackEvent = (eventName, properties = {}) => {
  try {
    if (typeof window !== 'undefined' && posthog && posthog.capture) {
      posthog.capture(eventName, properties)
    }
  } catch (error) {
    // Silently fail if PostHog isn't available
    console.error('Failed to track event:', error)
  }
}

/**
 * Identify a user using PostHog.
 * This is a wrapper around posthog.identify that gracefully handles cases where PostHog isn't loaded.
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined' && posthog && posthog.identify) {
      posthog.identify(userId, properties)
    }
  } catch (error) {
    // Silently fail if PostHog isn't available
    console.error('Failed to identify user:', error)
  }
}

/**
 * Reset the current user in PostHog (usually on logout).
 */
export const resetUser = () => {
  try {
    if (typeof window !== 'undefined' && posthog && posthog.reset) {
      posthog.reset()
    }
  } catch (error) {
    // Silently fail if PostHog isn't available
    console.error('Failed to reset user:', error)
  }
}
