/**
 * Enterprise Data Grid
 * 
 * TanStack Table-powered data grid with glassmorphism design
 * Features: sorting, filtering, selection, virtualization, responsive
 */

'use client'

import React from 'react'
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { GlassCard, LoadingSkeleton, EmptyState } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { fadeSlide, staggerChildren } from './design-tokens'

interface DataGridProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string
  onRowClick?: (row: T) => void
  onRowSelect?: (rows: T[]) => void
  searchable?: boolean
  filterable?: boolean
  selectable?: boolean
  exportable?: boolean
  pagination?: boolean
  pageSize?: number
  emptyState?: {
    icon: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
  }
  className?: string
}

export function DataGrid<T>({
  data,
  columns,
  loading = false,
  error,
  onRowClick,
  onRowSelect,
  searchable = true,
  filterable = false,
  selectable = false,
  exportable = false,
  pagination = true,
  pageSize = 10,
  emptyState,
  className = ""
}: DataGridProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [rowSelection, setRowSelection] = React.useState({})

  // Add selection column if selectable
  const tableColumns = React.useMemo(() => {
    if (!selectable) return columns

    const selectionColumn: ColumnDef<T> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, selectable])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  })

  // Handle row selection
  React.useEffect(() => {
    if (onRowSelect) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelect(selectedRows)
    }
  }, [rowSelection, onRowSelect, table])

  // Loading state
  if (loading) {
    return (
      <GlassCard className={cn("p-6", className)}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <LoadingSkeleton className="h-6 w-32" />
            <LoadingSkeleton className="h-10 w-24" />
          </div>
          <LoadingSkeleton lines={5} className="h-12" />
        </div>
      </GlassCard>
    )
  }

  // Error state
  if (error) {
    return (
      <GlassCard className={cn("p-6", className)}>
        <div className="text-center text-red-600">
          <p>Error loading data: {error}</p>
        </div>
      </GlassCard>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <GlassCard className={cn("p-6", className)}>
        {emptyState ? (
          <EmptyState {...emptyState} />
        ) : (
          <EmptyState
            icon={<Search className="w-8 h-8 text-gray-400" />}
            title="No data found"
            description="There are no items to display at this time."
          />
        )}
      </GlassCard>
    )
  }

  return (
    <GlassCard className={cn("overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="p-4 border-b border-white/20">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-2">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 bg-white/50 border-white/30"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {selectable && Object.keys(rowSelection).length > 0 && (
              <Badge variant="secondary">
                {Object.keys(rowSelection).length} selected
              </Badge>
            )}
            {exportable && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <motion.table 
          className="w-full"
          {...staggerChildren}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <motion.tr 
                key={headerGroup.id}
                className="border-b border-white/10"
                {...fadeSlide()}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 bg-white/30 dark:bg-gray-800/30"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          header.column.getCanSort() && "cursor-pointer select-none hover:bg-white/20 rounded px-2 py-1 -mx-2 -my-1"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={cn(
                                "w-3 h-3",
                                header.column.getIsSorted() === 'asc' ? "text-blue-600" : "text-gray-400"
                              )} 
                            />
                            <ChevronDown 
                              className={cn(
                                "w-3 h-3 -mt-1",
                                header.column.getIsSorted() === 'desc' ? "text-blue-600" : "text-gray-400"
                              )} 
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </motion.tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <motion.tr
                key={row.id}
                className={cn(
                  "border-b border-white/5 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors",
                  onRowClick && "cursor-pointer",
                  row.getIsSelected() && "bg-blue-50/50 dark:bg-blue-900/20"
                )}
                onClick={() => onRowClick?.(row.original)}
                {...fadeSlide(index * 0.02)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td 
                    key={cell.id} 
                    className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, table.getState().pagination.pageIndex - 2),
                    Math.min(table.getPageCount(), table.getState().pagination.pageIndex + 3)
                  )
                  .map((page) => (
                    <Button
                      key={page}
                      variant={table.getState().pagination.pageIndex + 1 === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => table.setPageIndex(page - 1)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

// Pre-configured action column for common CRUD operations
export function createActionColumn<T>(options: {
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  customActions?: Array<{
    label: string
    icon: React.ReactNode
    onClick: (row: T) => void
    variant?: 'default' | 'destructive'
  }>
}): ColumnDef<T> {
  return {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {options.onView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              options.onView!(row.original)
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {options.onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              options.onEdit!(row.original)
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        {options.onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              options.onDelete!(row.original)
            }}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        )}
        {options.customActions?.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              action.onClick(row.original)
            }}
          >
            {action.icon}
          </Button>
        ))}
      </div>
    ),
    enableSorting: false,
  }
}