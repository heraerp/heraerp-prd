/**
 * HERA UIKit - DataTable
 * Generic data table component
 */

'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TableColumn } from '@/lib/ui-binder/types'

interface DataTableProps<T = any> {
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

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  onRowClick,
  emptyMessage = 'No data available',
  className = ''
}: DataTableProps<T>) {
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
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  const formatCellValue = (column: TableColumn, value: any, row: T) => {
    if (column.formatter) {
      return column.formatter(value, row)
    }
    
    if (value == null) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toLocaleString()
    
    return String(value)
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1
  const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : data.length

  if (loading) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {getSortIcon(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row.id || row.entity_id || index}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
                  } ${hoveredRow === index ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  onClick={() => onRowClick?.(row, index)}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className="py-3">
                      {formatCellValue(column, row[column.key], row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between px-6 py-3 border-t">
          <div className="text-sm text-gray-500">
            Showing {startItem} to {endItem} of {pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
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
                    className="w-8 h-8 p-0"
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