import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function Loading({ className, size = 'md', text = 'Loading...' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="h-4 bg-muted animate-pulse rounded" />
      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
    </div>
  )
}

export function PlaybookListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-5 bg-muted animate-pulse rounded w-16" />
          </div>
          <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}

export function PlaybookDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
        <div className="flex gap-4">
          <div className="h-6 bg-muted animate-pulse rounded w-20" />
          <div className="h-6 bg-muted animate-pulse rounded w-24" />
        </div>
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
      </div>
      
      <div className="space-y-4">
        <div className="h-6 bg-muted animate-pulse rounded w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-16" />
            </div>
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Alias for compatibility
export const LoadingState = Loading