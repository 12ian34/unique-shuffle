'use client'

import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { ToastButton } from '@/components/ui/toast-button'
import { AppError } from '@/lib/errors'

interface ErrorToastProps {
  error: AppError
}

/**
 * Displays an error toast with appropriate styling and retry action if applicable
 */
export function showErrorToast({ error }: ErrorToastProps): void {
  let variant: 'destructive' | 'warning' | 'info' = 'destructive'

  // Determine appropriate variant based on severity
  switch (error.severity) {
    case 'CRITICAL':
    case 'ERROR':
      variant = 'destructive'
      break
    case 'WARNING':
      variant = 'warning'
      break
    case 'INFO':
      variant = 'info'
      break
  }

  let title = 'error'
  switch (error.type) {
    case 'NETWORK':
      title = 'connection error'
      break
    case 'DATABASE':
      title = 'data error'
      break
    case 'VALIDATION':
      title = 'invalid input'
      break
    case 'AUTH':
      title = 'authentication error'
      break
    case 'SHUFFLE':
      title = 'shuffle error'
      break
  }

  // Use ToastButton for recovery action if needed
  if (error.recoverable && error.recoveryAction) {
    toast({
      title,
      description: (
        <div className='flex flex-col gap-2'>
          <p>{error.message}</p>
          <ToastButton
            href='#'
            variant={
              variant === 'destructive' ? 'destructive' : variant === 'warning' ? 'warning' : 'info'
            }
            onClick={(e) => {
              e.preventDefault()
              error.recoveryAction?.()
            }}
          >
            retry
          </ToastButton>
        </div>
      ),
      variant,
    })
  } else {
    toast({
      title,
      description: error.message,
      variant,
    })
  }
}
