'use client'

import React from 'react'
import { 
  ChevronUp, ChevronDown, MoreVertical, Eye, 
  Edit, Trash2, ArrowUpDown, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { useHeraFilterStore } from '@/hooks/useHeraFilterStore'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: any, index: number) => React.ReactNode
}

export interface TableAction {
  label: string
  icon?: React.ComponentType<any>
  onClick: (record: any) => void
  variant?: 'default' | 'primary' | 'danger'
  show?: (record: any) => boolean
}

export interface HeraEntityTableProps {
  data: any[]
  columns: TableColumn[]
  actions?: TableAction[]
  loading?: boolean
  selectable?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  className?: string
  emptyMessage?: string
  emptyIcon?: React.ComponentType<any>
  rowKey?: string
}

export function HeraEntityTable({
  data,
  columns,
  actions = [],
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  className = '',
  emptyMessage = 'No data found',
  emptyIcon: EmptyIcon,
  rowKey = 'id'
}: HeraEntityTableProps) {
  const store = useHeraFilterStore()
  const [expandedActions, setExpandedActions] = React.useState<Set<string>>(new Set())
  
  const handleSort = (field: string) => {
    const currentSort = store.sortConfig
    let direction: 'asc' | 'desc' = 'asc'
    
    if (currentSort.field === field && currentSort.direction === 'asc') {
      direction = 'desc'
    }
    
    store.setSortConfig({ field, direction })
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    
    if (checked) {
      const allIds = data.map(item => item[rowKey])
      onSelectionChange(allIds)
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    
    if (checked) {
      onSelectionChange([...selectedRows, id])
    } else {
      onSelectionChange(selectedRows.filter(rowId => rowId !== id))
    }
  }

  const toggleActions = (recordId: string) => {
    const newExpanded = new Set(expandedActions)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedActions(newExpanded)
  }

  const getSortIcon = (field: string) => {
    if (store.sortConfig.field !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />
    }
    
    return store.sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-indigo-600" />
      : <ChevronDown className="w-3 h-3 text-indigo-600" />
  }

  const renderCellValue = (column: TableColumn, record: any, index: number) => {
    const value = record[column.key]
    
    if (column.render) {
      return column.render(value, record, index)
    }
    
    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`hera-status ${value ? 'hera-status-success' : 'hera-status-error'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    }
    
    if (typeof value === 'number') {
      return (
        <span className="font-mono text-sm">
          {value.toLocaleString()}
        </span>
      )
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value} className="truncate block max-w-48">
          {value}
        </span>
      )
    }
    
    return <span>{String(value)}</span>
  }

  if (loading) {
    return (
      <div className={`hera-table ${className}`}>
        <div className="p-12 text-center">
          <div className="hera-skeleton w-full h-64 rounded-xl"></div>
          <div className="mt-4 hera-skeleton w-32 h-4 mx-auto rounded"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`hera-table ${className}`}>
        <div className="p-12 text-center">
          {EmptyIcon && <EmptyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
          <p className="text-gray-500 hera-font-primary text-lg font-medium mb-2">
            {emptyMessage}
          </p>
          <p className="text-gray-400 hera-font-primary text-sm">
            Try adjusting your search criteria or filters
          </p>
        </div>
      </div>
    )
  }

  const isAllSelected = selectable && data.length > 0 && 
    data.every(item => selectedRows.includes(item[rowKey]))
  const isPartiallySelected = selectable && selectedRows.length > 0 && 
    !isAllSelected

  return (
    <div className={`hera-table ${className}`}>
      <table className="w-full">
        <thead className="hera-table-header">
          <tr>
            {selectable && (
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isPartiallySelected
                  }}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
            )}
            
            {columns.map(column => (
              <th
                key={column.key}
                className={`p-4 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-2 hover:text-indigo-600 transition-colors group"
                  >
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
            
            {actions.length > 0 && (
              <th className="w-20 p-4 text-center">Actions</th>
            )}
          </tr>
        </thead>
        
        <tbody className="hera-table-body">
          {data.map((record, index) => {
            const recordId = record[rowKey]
            const isSelected = selectedRows.includes(recordId)
            const showActions = expandedActions.has(recordId)
            
            return (
              <tr
                key={recordId}
                className={`transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
              >
                {selectable && (
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => handleSelectRow(recordId, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                )}
                
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={`p-4 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {renderCellValue(column, record, index)}
                  </td>
                ))}
                
                {actions.length > 0 && (
                  <td className="p-4 text-center">
                    <div className="relative">
                      <button
                        onClick={() => toggleActions(recordId)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      
                      {showActions && (
                        <>
                          <div 
                            className="fixed inset-0 z-30"
                            onClick={() => setExpandedActions(new Set())}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg z-40 hera-animate-scale-in">
                            <div className="p-1">
                              {actions
                                .filter(action => !action.show || action.show(record))
                                .map((action, actionIndex) => {
                                  const IconComponent = action.icon
                                  const buttonClass = action.variant === 'danger' 
                                    ? 'text-red-600 hover:bg-red-50'
                                    : action.variant === 'primary'
                                    ? 'text-indigo-600 hover:bg-indigo-50'
                                    : 'text-gray-700 hover:bg-gray-50'
                                  
                                  return (
                                    <button
                                      key={actionIndex}
                                      onClick={() => {
                                        action.onClick(record)
                                        setExpandedActions(new Set())
                                      }}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hera-font-primary ${buttonClass}`}
                                    >
                                      {IconComponent && <IconComponent className="w-4 h-4" />}
                                      {action.label}
                                    </button>
                                  )
                                })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      
      {/* Pagination */}
      {store.pagination.total && store.pagination.total > store.pagination.pageSize && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500 hera-font-primary">
            Showing {((store.pagination.page - 1) * store.pagination.pageSize) + 1} to{' '}
            {Math.min(store.pagination.page * store.pagination.pageSize, store.pagination.total)} of{' '}
            {store.pagination.total} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => store.setPagination({ page: store.pagination.page - 1 })}
              disabled={store.pagination.page <= 1}
              className="hera-btn-surface p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-2 text-sm hera-font-primary">
              Page {store.pagination.page}
            </span>
            
            <button
              onClick={() => store.setPagination({ page: store.pagination.page + 1 })}
              disabled={store.pagination.page * store.pagination.pageSize >= store.pagination.total}
              className="hera-btn-surface p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}