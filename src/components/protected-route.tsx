'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth')
    }
  }, [session, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className='flex justify-center items-center min-h-screen'>Loading...</div>
  }

  // Don't render children if not authenticated
  if (!session) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
