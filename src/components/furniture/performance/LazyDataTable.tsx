import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T
  header: string
  width?: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
}

interface LazyDataTableProps<T> {
  columns: Column<T>[]
  fetchData: (
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => Promise<{
    data: T[]
    totalCount: number
    hasMore: boolean
  }>
  pageSize?: number
  className?: string
  rowKey: keyof T
  onRowClick?: (row: T) => void
  loadMoreThreshold?: number // Pixels from bottom to trigger load
}

export function LazyDataTable<T extends Record<string, any>>({
  columns,
  fetchData,
  pageSize = 50,
  className,
  rowKey,
  onRowClick,
  loadMoreThreshold = 200
}: LazyDataTableProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  // Load initial data
  const loadData = useCallback(
    async (reset = false) => {
      if (loadingRef.current && !reset) return

      try {
        loadingRef.current = true
        const page = reset ? 1 : currentPage

        if (page === 1) {
          setLoading(true)
        } else {
          setLoadingMore(true)
        }

        setError(null)

        const result = await fetchData(page, pageSize, sortBy, sortOrder)

        if (reset) {
          setData(result.data)
          setCurrentPage(1)
        } else {
          setData(prev => [...prev, ...result.data])
        }

        setTotalCount(result.totalCount)
        setHasMore(result.hasMore)

        if (!reset && result.data.length > 0) {
          setCurrentPage(prev => prev + 1)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
        setLoadingMore(false)
        loadingRef.current = false
      }
    },
    [currentPage, fetchData, pageSize, sortBy, sortOrder]
  )

  // Initial load
  useEffect(() => {
    loadData(true)
  }, [sortBy, sortOrder])

  // Handle scroll for lazy loading
  useEffect(() => {
    const container = tableContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (!hasMore || loadingRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (distanceFromBottom < loadMoreThreshold) {
        loadData(false)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadData, loadMoreThreshold])

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(columnKey)
      setSortOrder('asc')
    }
  }

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    )
  }

  if (error && data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with count */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {data.length} of {totalCount} items loaded
        </h3>
        {error && (
          <div className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      {/* Table container with scroll */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                    column.width
                  )}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    {column.sortable &&
                      sortBy === String(column.key) &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => (
              <tr
                key={String(row[rowKey])}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                  onRowClick && 'cursor-pointer',
                  index % 2 === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50/50 dark:bg-gray-800/50'
                )}
              >
                {columns.map(column => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center p-4 border-t border-gray-200 dark:border-gray-700">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Loading more items...</span>
          </div>
        )}

        {/* End of data indicator */}
        {!hasMore && data.length > 0 && (
          <div className="text-center p-4 text-sm text-gray-500 border-t border-gray-200 dark:border-gray-700">
            All {totalCount} items loaded
          </div>
        )}

        {/* Empty state */}
        {data.length === 0 && !loading && (
          <div className="text-center p-8 text-gray-500">No data available</div>
        )}
      </div>
    </div>
  )
}
