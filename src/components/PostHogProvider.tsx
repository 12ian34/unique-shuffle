'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      // Safety check to ensure environment variable exists
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''

      posthog.init(posthogKey, {
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',
        capture_pageview: false, // We capture pageviews manually
        capture_pageleave: true, // Enable pageleave capture
        loaded: (posthog) => {
          // Success callback to ensure it's properly loaded
          console.log('PostHog initialized successfully')
        },
      })
    } catch (error) {
      // Prevent any analytics errors from breaking the app
      console.error('Error initializing PostHog:', error)
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    try {
      if (pathname && posthog) {
        let url = window.origin + pathname
        const search = searchParams.toString()
        if (search) {
          url += '?' + search
        }
        posthog.capture('$pageview', { $current_url: url })
      }
    } catch (error) {
      // Prevent any analytics errors from breaking the app
      console.error('Error capturing pageview:', error)
    }
  }, [pathname, searchParams, posthog])

  return null
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}
