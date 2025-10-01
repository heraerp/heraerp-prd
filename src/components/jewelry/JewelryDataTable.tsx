/**
 * HERA Jewelry - DataTable
 * Jewelry-themed data table component with Royal Blue & Gold styling
 */

'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Diamond } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TableColumn } from '@/lib/ui-binder/types'
import '@/styles/jewelry-glassmorphism.css'

interface JewelryDataTableProps<T = any> {
  data: T[]
  columns: TableColumn[]
  loading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (size: number) => void
  }
  sorting?: {
    column?: string
    direction?: 'asc' | 'desc'
    onSort: (column: string, direction: 'asc' | 'desc') => void
  }
  onRowClick?: (row: T, index: number) => void
  emptyMessage?: string
  className?: string
}

export function JewelryDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  onRowClick,
  emptyMessage = 'No jewelry items available',
  className = ''
}: JewelryDataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const handleSort = (column: TableColumn) => {
    if (!column.sortable || !sorting) return
    
    const currentDirection = sorting.column === column.key ? sorting.direction : undefined
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc'
    
    sorting.onSort(column.key, newDirection)
  }

  const getSortIcon = (column: TableColumn) => {
    if (!column.sortable || !sorting || sorting.column !== column.key) {
      return <span className="w-4 h-4" />
    }
    
    return sorting.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 jewelry-icon-gold" />
    ) : (
      <ChevronDown className="w-4 h-4 jewelry-icon-gold" />
    )
  }

  const formatCellValue = (column: TableColumn, value: any, row: T) => {
    if (column.formatter) {
      return column.formatter(value, row)
    }
    
    if (value == null) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toLocaleString()
    
    return String(value)
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1
  const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : data.length

  if (loading) {
    return (
      <div className={`jewelry-glass-panel ${className}`}>
        <div className="p-8 text-center">
          <div className="jewelry-spinner mx-auto mb-4"></div>
          <p className="jewelry-champagne-text">Loading luxury collection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`jewelry-table ${className}`}>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${column.sortable ? 'cursor-pointer hover:bg-opacity-20' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="jewelry-text-high-contrast font-semibold">{column.label}</span>
                    {getSortIcon(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <Diamond className="h-16 w-16 jewelry-icon-gold opacity-50" />
                    <div>
                      <p className="jewelry-empty-state text-lg font-medium mb-2">
                        {emptyMessage}
                      </p>
                      <p className="jewelry-champagne-text text-sm">
                        Add your first luxury piece to get started
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row.id || row.entity_id || index}
                  className={`${
                    onRowClick ? 'cursor-pointer jewelry-scale-hover' : ''
                  } ${hoveredRow === index ? 'bg-opacity-30' : ''} transition-all duration-200`}
                  onClick={() => onRowClick?.(row, index)}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className="py-4">
                      <span className="jewelry-text-high-contrast">
                        {formatCellValue(column, row[column.key], row)}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-jewelry-gold-300">
          <div className="jewelry-champagne-text text-sm">
            Showing {startItem} to {endItem} of {pagination.total} luxury pieces
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="jewelry-btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`w-8 h-8 p-0 ${
                      pageNum === pagination.page ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'
                    }`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="jewelry-btn-secondary"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}