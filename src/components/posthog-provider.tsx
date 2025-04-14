'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import PostHogPageView from './posthog-pageview'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog only on the client side
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        capture_pageview: false, // We'll handle pageviews manually
        capture_pageleave: true, // Enable pageleave events
        autocapture: true, // Enable autocapture of clicks, form submissions, etc.
        session_recording: {
          maskAllInputs: false,
          maskInputOptions: {
            password: true,
          },
        },
        // Debug mode in development
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug()
        },
      })
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  )
}
