'use client'

import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { AppError } from '@/lib/errors'

interface ErrorToastProps {
  error: AppError
}

/**
 * Displays an error toast with appropriate styling and retry action if applicable
 */
export function showErrorToast({ error }: ErrorToastProps): void {
  const variant =
    error.severity === 'CRITICAL' || error.severity === 'ERROR' ? 'destructive' : 'default'

  let title = 'Error'
  switch (error.type) {
    case 'NETWORK':
      title = 'Connection Error'
      break
    case 'DATABASE':
      title = 'Data Error'
      break
    case 'VALIDATION':
      title = 'Invalid Input'
      break
    case 'AUTH':
      title = 'Authentication Error'
      break
    case 'SHUFFLE':
      title = 'Shuffle Error'
      break
  }

  toast({
    title,
    description: error.message,
    variant,
    action:
      error.recoverable && error.recoveryAction ? (
        <ToastAction altText='Retry' onClick={() => error.recoveryAction?.()}>
          Retry
        </ToastAction>
      ) : undefined,
  })
}
