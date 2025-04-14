'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Fallback } from '@/components/ui/fallback'
import { handleError } from '@/lib/errors'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary component that catches JavaScript errors
 * and displays a fallback UI instead of crashing the application
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the error handling system
    handleError(error)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <Fallback
          title='Something went wrong'
          message={error?.message || 'An unexpected error occurred'}
          onRetry={this.resetError}
        />
      )
    }

    return children
  }
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 */
export function withErrorBoundary<P extends React.PropsWithChildren<{}>>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component'

  const WrappedComponent: React.FC<P> = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`
  return WrappedComponent
}

export default ErrorBoundary
