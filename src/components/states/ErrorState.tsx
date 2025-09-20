import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  showRetry?: boolean
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content.',
  onRetry,
  className,
  showRetry = true
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
        </AlertDescription>
      </Alert>
      
      {showRetry && onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}

export function PlaybookErrorState({ error, onRetry }: { error: Error, onRetry?: () => void }) {
  return (
    <ErrorState
      title="Failed to load playbooks"
      message={error.message || 'There was a problem loading the playbooks. Please try again.'}
      onRetry={onRetry}
    />
  )
}

export function PlaybookDetailErrorState({ error, onRetry }: { error: Error, onRetry?: () => void }) {
  return (
    <ErrorState
      title="Failed to load playbook"
      message={error.message || 'There was a problem loading this playbook. Please try again.'}
      onRetry={onRetry}
    />
  )
}