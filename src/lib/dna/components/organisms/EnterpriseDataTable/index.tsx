/**
 * HERA DNA Enterprise Data Table
 * Combines SAP Fiori table patterns with glassmorphism design
 * Features: Multi-selection, sorting, filtering, personalization, export
 */

import React, { useState, useCallback, useMemo, memo } from 'react'
import { useGlassEffect, GlassConfig } from '../../../design-system/glass-effects-2.0'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Settings,
  Search,
  MoreVertical,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export interface Column<T> {
  id: string
  header: string
  accessor: keyof T | ((row: T) => any)
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T) => React.ReactNode
  microChart?: 'bullet' | 'line' | 'comparison'
}

export interface EnterpriseDataTableProps<T> {
  data: T[]
  columns: Column<T>[]

  // Features
  multiSelection?: boolean
  columnPersonalization?: boolean
  advancedFiltering?: boolean
  exportFormats?: ('excel' | 'pdf' | 'csv')[]
  virtualScrolling?: boolean

  // Glass styling
  glassIntensity?: 'subtle' | 'medium' | 'strong'
  variant?: 'default' | 'primary' | 'premium'

  // Callbacks
  onRowSelect?: (selectedRows: T[]) => void
  onExport?: (format: string) => void
  onColumnChange?: (columns: Column<T>[]) => void

  // Customization
  rowKey: keyof T
  pageSize?: number
  showPagination?: boolean
  emptyMessage?: string
  loading?: boolean
}

function EnterpriseDataTableInner<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  multiSelection = true,
  columnPersonalization = true,
  advancedFiltering = true,
  exportFormats = ['excel', 'pdf', 'csv'],
  glassIntensity = 'medium',
  variant = 'default',
  onRowSelect,
  onExport,
  onColumnChange,
  rowKey,
  pageSize = 10,
  showPagination = true,
  emptyMessage = 'No data available',
  loading = false
}: EnterpriseDataTableProps<T>) {
  // State management
  const [columns, setColumns] = useState(initialColumns)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{
    column: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [filterValue, setFilterValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showColumnSettings, setShowColumnSettings] = useState(false)

  // Glass effect configuration
  const glassConfig: GlassConfig = {
    intensity: glassIntensity,
    variant,
    enableShine: variant === 'premium'
  }
  const { className: glassClassName } = useGlassEffect(glassConfig)

  // Data processing
  const processedData = useMemo(() => {
    let result = [...data]

    // Filtering
    if (filterValue) {
      result = result.filter(row =>
        columns.some(col => {
          const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]
          return String(value).toLowerCase().includes(filterValue.toLowerCase())
        })
      )
    }

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const col = columns.find(c => c.id === sortConfig.column)
        if (!col) return 0

        const aVal = typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor]
        const bVal = typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor]

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, columns, filterValue, sortConfig])

  // Pagination
  const paginatedData = useMemo(() => {
    if (!showPagination) return processedData
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize, showPagination])

  const totalPages = Math.ceil(processedData.length / pageSize)

  // Selection handling
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
    } else {
      const newSelection = new Set(paginatedData.map(row => String(row[rowKey])))
      setSelectedRows(newSelection)
    }
  }, [paginatedData, rowKey, selectedRows])

  const handleSelectRow = useCallback(
    (rowId: string) => {
      const newSelection = new Set(selectedRows)
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId)
      } else {
        newSelection.add(rowId)
      }
      setSelectedRows(newSelection)

      if (onRowSelect) {
        const selected = data.filter(row => newSelection.has(String(row[rowKey])))
        onRowSelect(selected)
      }
    },
    [selectedRows, data, rowKey, onRowSelect]
  )

  // Sorting
  const handleSort = useCallback((columnId: string) => {
    setSortConfig(current => {
      if (!current || current.column !== columnId) {
        return { column: columnId, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { column: columnId, direction: 'desc' }
      }
      return null
    })
  }, [])

  // Column management
  const toggleColumn = useCallback(
    (columnId: string) => {
      setColumns(current => {
        const newColumns = current.map(col =>
          col.id === columnId ? { ...col, hidden: !col.hidden } : col
        )
        if (onColumnChange) {
          onColumnChange(newColumns)
        }
        return newColumns
      })
    },
    [onColumnChange]
  )

  return (
    <div className={cn('relative rounded-2xl p-1', glassClassName)}>
      {/* Table Header Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border/10">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Data Table</h3>

          {advancedFiltering && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={filterValue}
                onChange={e => setFilterValue(e.target.value)}
                className={cn(
                  'pl-10 pr-4 py-2 rounded-lg',
                  'bg-background/10 border border-border/20',
                  'backdrop-blur-xl',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                  'placeholder:text-muted-foreground',
                  'text-gray-900 dark:text-foreground'
                )}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {exportFormats.length > 0 && (
            <button
              onClick={() => onExport?.('excel')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-background/10 border border-border/20',
                'hover:bg-background/20 active:bg-background/10',
                'transition-all duration-200'
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}

          {columnPersonalization && (
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className={cn(
                'p-2 rounded-lg',
                'bg-background/10 border border-border/20',
                'hover:bg-background/20 active:bg-background/10',
                'transition-all duration-200'
              )}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background/5 border-b border-border/10">
            <tr>
              {multiSelection && (
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 rounded hover:bg-background/10 transition-colors"
                  >
                    {selectedRows.size === paginatedData.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}

              {columns
                .filter(col => !col.hidden)
                .map(column => (
                  <th
                    key={column.id}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
                      'text-gray-700 dark:text-gray-300',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer hover:bg-background/10 transition-colors'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable &&
                        sortConfig?.column === column.id &&
                        (sortConfig?.direction === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                ))}

              <th className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (multiSelection ? 2 : 1)}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (multiSelection ? 2 : 1)}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={String(row[rowKey])}
                  className={cn(
                    'hover:bg-background/5 transition-colors',
                    index % 2 === 0 && 'bg-background/[0.02]'
                  )}
                >
                  {multiSelection && (
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleSelectRow(String(row[rowKey]))}
                        className="p-1 rounded hover:bg-background/10 transition-colors"
                      >
                        {selectedRows.has(String(row[rowKey])) ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  )}

                  {columns
                    .filter(col => !col.hidden)
                    .map(column => {
                      const value =
                        typeof column.accessor === 'function'
                          ? column.accessor(row)
                          : row[column.accessor]

                      return (
                        <td
                          key={column.id}
                          className={cn(
                            'px-6 py-4 whitespace-nowrap text-sm',
                            'text-gray-900 dark:text-foreground',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.render ? column.render(value, row) : value}
                        </td>
                      )
                    })}

                  <td className="px-4 py-4 text-right">
                    <button className="p-1 rounded hover:bg-background/10 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/10">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length}{' '}
            results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                'p-2 rounded-lg',
                'bg-background/10 border border-border/20',
                'hover:bg-background/20 active:bg-background/10',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-4 py-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'p-2 rounded-lg',
                'bg-background/10 border border-border/20',
                'hover:bg-background/20 active:bg-background/10',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const EnterpriseDataTable = memo(EnterpriseDataTableInner) as typeof EnterpriseDataTableInner
