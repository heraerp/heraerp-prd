import { cn } from '@/lib/utils'

interface CardSkeletonProps {
  rows?: number
  className?: string
  showHeader?: boolean
}

export function CardSkeleton({ rows = 3, className, showHeader = true }: CardSkeletonProps) {
  return (
    <div className={cn('bg-white border rounded-lg p-6 space-y-4', className)}>
      {showHeader && (
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div
              className={cn(
                'h-4 bg-gray-200 rounded animate-pulse',
                i === rows - 1 ? 'w-1/2' : 'w-full'
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
