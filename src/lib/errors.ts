'use client'

import { toast } from '@/components/ui/use-toast'

// Error types for categorizing errors
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  SHUFFLE = 'SHUFFLE',
  UNKNOWN = 'UNKNOWN',
}

// Error severities for determining response actions
export enum ErrorSeverity {
  INFO = 'INFO', // Just information, no action needed
  WARNING = 'WARNING', // Something might go wrong, but operation continued
  ERROR = 'ERROR', // Operation failed but app can continue
  CRITICAL = 'CRITICAL', // Operation failed and requires immediate attention
}

// Interface for structured error objects
export interface AppError {
  type: ErrorType
  message: string
  severity: ErrorSeverity
  code?: string
  details?: Record<string, any>
  timestamp: Date
  recoverable: boolean
  recoveryAction?: () => Promise<void> | void
}

// Factory to create structured error objects
export function createError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  details?: Record<string, any>,
  code?: string,
  recoverable: boolean = false,
  recoveryAction?: () => Promise<void> | void
): AppError {
  return {
    type,
    message,
    severity,
    code,
    details,
    timestamp: new Date(),
    recoverable,
    recoveryAction,
  }
}

// Central error handling function
export function handleError(error: AppError | Error | unknown): AppError {
  // Convert any error to our standard AppError format
  const appError: AppError =
    error instanceof Error && !(error as any).type
      ? createError(error.message || 'An unknown error occurred')
      : (error as AppError)

  // Log the error
  logError(appError)

  // Show user-friendly toast message
  displayErrorToast(appError)

  return appError
}

// Log error to console and potentially a monitoring service
export function logError(error: AppError): void {
  // Structure the console error for better readability
  console.error('Application Error:', {
    type: error.type,
    message: error.message,
    severity: error.severity,
    code: error.code,
    details: error.details,
    timestamp: error.timestamp,
    stack: new Error().stack,
  })

  // TODO: Send to error monitoring service like Sentry
  // If we had Sentry or similar configured, we would send the error there
}

// Display user-friendly error toast
export function displayErrorToast(error: AppError): void {
  // Determine variant based on error severity
  let variant: 'destructive' | 'warning' | 'info' = 'destructive'

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      variant = 'destructive'
      break
    case ErrorSeverity.WARNING:
      variant = 'warning'
      break
    case ErrorSeverity.INFO:
      variant = 'info'
      break
  }

  toast({
    title: getErrorTitle(error),
    description: error.message,
    variant,
  })

  // Note: For client components, import and use showErrorToast from '@/components/ui/error-toast'
  // instead of this function directly to get retry action functionality
}

// Get user-friendly error title based on error type
function getErrorTitle(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'connection error'
    case ErrorType.DATABASE:
      return 'data error'
    case ErrorType.VALIDATION:
      return 'invalid input'
    case ErrorType.AUTH:
      return 'authentication error'
    case ErrorType.SHUFFLE:
      return 'shuffle error'
    default:
      return 'error'
  }
}

// Helper functions for common errors

export function createNetworkError(
  message = 'Network connection issue. Please check your internet connection.',
  details?: Record<string, any>,
  recoverable = true,
  recoveryAction?: () => Promise<void> | void
): AppError {
  return createError(
    message,
    ErrorType.NETWORK,
    ErrorSeverity.ERROR,
    details,
    'NETWORK_ERROR',
    recoverable,
    recoveryAction
  )
}

export function createDatabaseError(
  message = 'There was an issue accessing your data.',
  details?: Record<string, any>
): AppError {
  return createError(message, ErrorType.DATABASE, ErrorSeverity.ERROR, details, 'DATABASE_ERROR')
}

export function createShuffleError(
  message = 'There was an issue with the shuffle operation.',
  details?: Record<string, any>,
  recoverable = true,
  recoveryAction?: () => Promise<void> | void
): AppError {
  return createError(
    message,
    ErrorType.SHUFFLE,
    ErrorSeverity.ERROR,
    details,
    'SHUFFLE_ERROR',
    recoverable,
    recoveryAction
  )
}

export function createValidationError(
  message = 'Please check your input and try again.',
  details?: Record<string, any>
): AppError {
  return createError(
    message,
    ErrorType.VALIDATION,
    ErrorSeverity.WARNING,
    details,
    'VALIDATION_ERROR'
  )
}

export function createAuthError(
  message = 'Authentication error. Please sign in again.',
  details?: Record<string, any>
): AppError {
  return createError(message, ErrorType.AUTH, ErrorSeverity.ERROR, details, 'AUTH_ERROR')
}
