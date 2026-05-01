'use client'

import { Toaster } from '@/components/ui/toaster'
import { LocalProfileProvider } from '@/contexts/LocalProfileContext'
import { ThemeProvider } from '@/components/theme-provider'
import { PostHogProvider } from '@/components/posthog-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LocalProfileProvider>
      <ThemeProvider defaultTheme='dark' attribute='class'>
        <PostHogProvider>
          {children}
          <Toaster />
        </PostHogProvider>
      </ThemeProvider>
    </LocalProfileProvider>
  )
}
