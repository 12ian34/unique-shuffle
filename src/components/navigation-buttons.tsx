'use client'

import { Button } from '@/components/ui/button'

export function BackButton() {
  return (
    <Button variant='outline' onClick={() => window.history.back()}>
      Go Back
    </Button>
  )
}

export function HomeButton() {
  return (
    <Button variant='default' onClick={() => (window.location.href = '/')}>
      Go Home
    </Button>
  )
}
