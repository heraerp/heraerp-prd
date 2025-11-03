/**
 * List Report Floorplan
 * 
 * SAP Fiori List Report pattern with glassmorphism design
 * For master data browsing and CRUD operations
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, Download, Filter, Search } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { DynamicPage, PageToolbar, FilterBar, EmptyState } from '../primitives'
import { DataGrid, createActionColumn } from '../data-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fadeSlide } from '../design-tokens'

interface ListReportProps<T> {
  title: string
  entityType: string
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string
  
  // Search and filtering
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: React.ReactNode
  
  // Actions
  onCreate?: () => void
  onRefresh?: () => void
  onExport?: () => void
  onImport?: () => void
  
  // Row actions
  onRowClick?: (row: T) => void
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  
  // Customization
  subtitle?: string
  emptyState?: {
    icon: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
  }
  showSelection?: boolean
  showExport?: boolean
  showFilters?: boolean
  className?: string
}

export function ListReport<T>({
  title,
  entityType,
  data,
  columns,
  loading = false,
  error,
  searchValue = '',
  onSearchChange,
  filters,
  onCreate,
  onRefresh,
  onExport,
  onImport,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  subtitle,
  emptyState,
  showSelection = false,
  showExport = true,
  showFilters = true,
  className = ""
}: ListReportProps<T>) {
  
  // Enhanced columns with actions
  const enhancedColumns = React.useMemo(() => {
    const actionColumn = createActionColumn({
      onView,
      onEdit,
      onDelete
    })
    
    return [...columns, actionColumn]
  }, [columns, onView, onEdit, onDelete])

  // Default empty state
  const defaultEmptyState = {
    icon: <Search className="w-8 h-8 text-gray-400" />,
    title: `No ${entityType.toLowerCase()} found`,
    description: `Get started by creating your first ${entityType.toLowerCase()}.`,
    action: onCreate ? (
      <Button onClick={onCreate}>
        <Plus className="w-4 h-4 mr-2" />
        Create {entityType}
      </Button>
    ) : undefined
  }

  return (
    <DynamicPage
      title={title}
      subtitle={subtitle || `Manage ${entityType.toLowerCase()} records`}
      actions={
        <motion.div className="flex flex-wrap gap-2" {...fadeSlide(0.1)}>
          {onCreate && (
            <Button onClick={onCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New {entityType}
            </Button>
          )}
          {onImport && (
            <Button variant="outline" onClick={onImport}>
              <Download className="w-4 h-4 mr-2 rotate-180" />
              Import
            </Button>
          )}
          {showExport && onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </motion.div>
      }
      className={className}
    >
      {/* Toolbar with Search and Filters */}
      <motion.div {...fadeSlide(0.2)}>
        <PageToolbar
          left={
            <div className="flex flex-col md:flex-row gap-4 w-full">
              {/* Search */}
              {onSearchChange && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={`Search ${entityType.toLowerCase()}...`}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 bg-white/50 border-white/30"
                  />
                </div>
              )}
              
              {/* Quick Filters */}
              {showFilters && filters && (
                <div className="flex gap-2">
                  {filters}
                </div>
              )}
            </div>
          }
        />
      </motion.div>

      {/* Data Grid */}
      <motion.div {...fadeSlide(0.3)}>
        <DataGrid
          data={data}
          columns={enhancedColumns}
          loading={loading}
          error={error}
          onRowClick={onRowClick}
          searchable={false} // We handle search in toolbar
          selectable={showSelection}
          exportable={false} // We handle export in toolbar
          emptyState={emptyState || defaultEmptyState}
          className="mt-4"
        />
      </motion.div>
    </DynamicPage>
  )
}

// Quick filter helpers for common use cases
export function QuickFilters({
  statusOptions,
  categoryOptions,
  dateRange,
  onStatusChange,
  onCategoryChange,
  onDateRangeChange
}: {
  statusOptions?: { value: string; label: string }[]
  categoryOptions?: { value: string; label: string }[]
  dateRange?: { from?: string; to?: string }
  onStatusChange?: (value: string) => void
  onCategoryChange?: (value: string) => void
  onDateRangeChange?: (range: { from?: string; to?: string }) => void
}) {
  return (
    <>
      {statusOptions && onStatusChange && (
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px] bg-white/50 border-white/30">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {categoryOptions && onCategoryChange && (
        <Select onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px] bg-white/50 border-white/30">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  )
}

// Pre-configured List Report for common HERA entities
export function HERAListReport<T extends { entity_id: string; entity_name: string; smart_code: string }>({
  entityType,
  useListHook,
  useMutationsHook,
  onCreateNew,
  customColumns = [],
  ...props
}: {
  entityType: string
  useListHook: () => {
    data: T[] | undefined
    loading: boolean
    error: Error | null
    refetch: () => void
  }
  useMutationsHook: () => {
    deleteEntity: (id: string) => Promise<void>
  }
  onCreateNew: () => void
  customColumns?: ColumnDef<T>[]
} & Omit<ListReportProps<T>, 'data' | 'columns' | 'loading' | 'error' | 'onCreate'>) {
  
  const { data, loading, error, refetch } = useListHook()
  const { deleteEntity } = useMutationsHook()
  
  // Standard HERA columns
  const standardColumns: ColumnDef<T>[] = [
    {
      accessorKey: 'entity_name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.entity_name}</div>
      )
    },
    {
      accessorKey: 'smart_code',
      header: 'Smart Code',
      cell: ({ row }) => (
        <code className="text-xs bg-gray-100/80 px-2 py-1 rounded">
          {row.original.smart_code}
        </code>
      )
    },
    ...customColumns
  ]
  
  return (
    <ListReport
      {...props}
      entityType={entityType}
      data={data || []}
      columns={standardColumns}
      loading={loading}
      error={error?.message}
      onCreate={onCreateNew}
      onRefresh={refetch}
      onDelete={async (row) => {
        if (confirm(`Are you sure you want to delete ${row.entity_name}?`)) {
          await deleteEntity(row.entity_id)
          refetch()
        }
      }}
    />
  )
}