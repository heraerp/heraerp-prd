import React, { useState, useEffect, useCallback, useRef }
from 'react'
import { ChevronDown, ChevronUp, Loader2, AlertCircle }
from 'lucide-react'
import { cn }
from '@/src/lib/utils'


interface Column<T> { key: keyof T header: string width?: string render?: (value: any, row: T) => React.ReactNode sortable?: boolean
}

interface LazyDataTableProps<T> { columns: Column<T>[] fetchData: ( page: number, pageSize: number, sortBy?: string, sortOrder?: 'asc' | 'desc' ) => Promise<{ data: T[] totalCount: number hasMore: boolean }> pageSize?: number className?: string rowKey: keyof T onRowClick?: (row: T) => void loadMoreThreshold?: number // Pixels from bottom to trigger load
}

export function LazyDataTable<T extends Record<string, any>>({ columns, fetchData, pageSize = 50, className, rowKey, onRowClick, loadMoreThreshold = 200
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

const loadingRef = useRef(false) // Load initial data const loadData = useCallback( async (reset = false) => { if (loadingRef.current && !reset) return try { loadingRef.current = true const page = reset ? 1 : currentPage if (page === 1) {
  setLoading(true  ) else { setLoadingMore(true  ) setError(null)

const result = await fetchData(page, pageSize, sortBy, sortOrder) if (reset) {
  setData(result.data) setCurrentPage(1  ) else { setData(prev => [...prev, ...result.data]  ) setTotalCount(result.totalCount) setHasMore(result.hasMore) if (!reset && result.data.length > 0) {
  setCurrentPage(prev => prev + 1  )   } catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load data'  ) finally { setLoading(false) setLoadingMore(false) loadingRef.current = false } }, [currentPage, fetchData, pageSize, sortBy, sortOrder] ) // Initial load useEffect(() => { loadData(true  ), [sortBy, sortOrder]) // Handle scroll for lazy loading useEffect(() => { const container = tableContainerRef.current if (!container) return const handleScroll = () => { if (!hasMore || loadingRef.current) return const { scrollTop, scrollHeight, clientHeight } = container const distanceFromBottom = scrollHeight - scrollTop - clientHeight if (distanceFromBottom < loadMoreThreshold) {
  loadData(false  ) } container.addEventListener('scroll', handleScroll, { passive: true }) return () => container.removeEventListener('scroll', handleScroll  ), [hasMore, loadData, loadMoreThreshold]) // Handle sorting const handleSort = (columnKey: string) => { if (sortBy === columnKey) {
  setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc')  ) else { setSortBy(columnKey) setSortOrder('asc'  ) } if (loading && data.length === 0) {
  return ( <div className="bg-[var(--color-body)] flex items-center justify-center p-8"> <Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-[var(--color-text-secondary)]">Loading data...</span> </div>   ) if (error && data.length === 0) {
  return ( <div className="bg-[var(--color-body)] flex items-center justify-center p-8 text-red-600"> <AlertCircle className="h-6 w-6 mr-2" /> <span>{error}</span> </div>   ) return ( <div className={cn('flex flex-col h-full', className)}> {/* Header with count */} <div className="bg-[var(--color-body)] flex items-center justify-between mb-4"> <h3 className="bg-[var(--color-body)] text-lg font-semibold text-gray-100 text-[var(--color-text-primary)]"> {data.length} of {totalCount} items loaded </h3> {error && ( <div className="text-sm text-red-600 flex items-center"> <AlertCircle className="h-4 w-4 mr-1" /> {error} </div> )} </div> {/* Table container with scroll */} <div ref={tableContainerRef} className="bg-[var(--color-body)] flex-1 overflow-auto border border-[var(--color-border)] border-[var(--color-border)] rounded-lg" > <table className="bg-[var(--color-body)] min-w-full divide-y divide-gray-200 dark:divide-gray-700"> <thead className="bg-[var(--color-body)] bg-[var(--color-body)] sticky top-0 z-10"> <tr> {columns.map(column => ( <th key={String(column.key)} className={cn( 'px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] uppercase tracking-wider', column.sortable && 'cursor-pointer hover:bg-[var(--color-body)] dark:hover:bg-[var(--color-sidebar)]/30', column.width )} onClick={() => column.sortable && handleSort(String(column.key))} > <div className="bg-[var(--color-body)] flex items-center justify-between"> <span>{column.header}</span> {column.sortable && sortBy === String(column.key) && (sortOrder === 'asc' ? ( <ChevronUp className="h-4 w-4" /> ) : ( <ChevronDown className="h-4 w-4" /> ))} </div> </th> ))} </tr> </thead> <tbody className="bg-[var(--color-body)] bg-[var(--color-body)] divide-y divide-gray-200 dark:divide-gray-700"> {data.map((row, index) => ( <tr key={String(row[rowKey])} onClick={() => onRowClick?.(row)} className={cn( 'hover:bg-[var(--color-body)] dark:hover:bg-[var(--color-body)] transition-colors', onRowClick && 'cursor-pointer', index % 2 === 0 ? 'bg-[var(--color-body)] bg-[var(--color-body)]' : 'bg-[var(--color-body)]/50 bg-[var(--color-body)]/50' )} > {columns.map(column => ( <td key={String(column.key)} className="bg-[var(--color-body)] px-6 py-4 whitespace-nowrap text-sm text-gray-100 text-[var(--color-text-primary)]" > {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')} </td> ))} </tr> ))} </tbody> </table> {/* Loading more indicator */} {loadingMore && ( <div className="bg-[var(--color-body)] flex items-center justify-center p-4 border-t border-[var(--color-border)] border-[var(--color-border)]"> <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" /> <span className="text-sm text-[var(--color-text-secondary)]">Loading more items...</span> </div> )} {/* End of data indicator */} {!hasMore && data.length > 0 && ( <div className="bg-[var(--color-body)] text-center p-4 text-sm text-[var(--color-text-secondary)] border-t border-[var(--color-border)] border-[var(--color-border)]"> All {totalCount} items loaded </div> )} {/* Empty state */} {data.length === 0 && !loading && ( <div className="bg-[var(--color-body)] text-center p-8 text-[var(--color-text-secondary)]">No data available</div> )} </div> </div> )
}
