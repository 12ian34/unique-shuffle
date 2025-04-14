import { PostHog } from 'posthog-node'

export default function getPostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    flushAt: 1, // Immediately send events in server context
    flushInterval: 0,
  })

  return posthogClient
}
