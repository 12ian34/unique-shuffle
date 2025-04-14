import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FallbackProps {
  title?: string
  message?: string
  icon?: React.ReactNode
  onRetry?: () => void
  className?: string
  minimal?: boolean
}

/**
 * A fallback UI component for when data cannot be loaded
 */
export function Fallback({
  title = 'Unable to load data',
  message = 'There was a problem loading this content.',
  icon = <AlertTriangle className='h-10 w-10 text-yellow-500' />,
  onRetry,
  className,
  minimal = false,
}: FallbackProps) {
  if (minimal) {
    return (
      <div
        className={cn(
          'flex items-center justify-center w-full p-4 rounded-md bg-muted/40',
          className
        )}
      >
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          {icon}
          <span>{message}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className='inline-flex items-center gap-1 text-xs p-1 px-2 rounded-sm hover:bg-muted'
            >
              <RefreshCw className='h-3 w-3' />
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full min-h-[200px] p-6 rounded-md bg-muted/30 border',
        className
      )}
    >
      <div className='mb-4'>{icon}</div>
      <h3 className='text-lg font-medium mb-1'>{title}</h3>
      <p className='text-sm text-muted-foreground mb-4 text-center max-w-md'>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className='inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
        >
          <RefreshCw className='h-4 w-4' />
          Try Again
        </button>
      )}
    </div>
  )
}
