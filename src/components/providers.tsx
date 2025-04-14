'use client'

import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme='dark' attribute='class'>
        {children}
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  )
}
