import { cn } from '@/lib/utils'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
  showHeader?: boolean
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  showHeader = true
}: TableSkeletonProps) {
  return (
    <div className={cn('bg-white border rounded-lg overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader && (
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="p-4 text-left">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="p-4">
                    <div
                      className={cn(
                        'h-4 bg-gray-200 rounded animate-pulse',
                        colIndex === 0 ? 'w-24' : colIndex === columns - 1 ? 'w-16' : 'w-20'
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TableSkeletonWithPagination(props: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      <TableSkeleton {...props} />

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
