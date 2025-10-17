'use client'

import React from 'react'
import { Eye, Table, BarChart, Grid, Sliders, Search, MoreHorizontal } from 'lucide-react'

export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
  render?: (value: any, record: any, index: number) => React.ReactNode
  mobileHidden?: boolean
}

export interface TableRecord {
  [key: string]: any
  id: string | number
}

export interface MobileDataTableProps {
  title?: string
  subtitle?: string
  columns: TableColumn[]
  data: TableRecord[]
  loading?: boolean
  selectable?: boolean
  selectedRows?: (string | number)[]
  onRowSelect?: (selectedRows: (string | number)[]) => void
  onRowClick?: (record: TableRecord) => void
  actions?: React.ReactNode
  className?: string
  mobileCardRender?: (record: TableRecord, index: number) => React.ReactNode
  emptyState?: React.ReactNode
}

export function MobileDataTable({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  onRowClick,
  actions,
  className = '',
  mobileCardRender,
  emptyState
}: MobileDataTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (onRowSelect) {
      onRowSelect(checked ? data.map(record => record.id) : [])
    }
  }

  const handleRowSelect = (recordId: string | number) => {
    if (onRowSelect) {
      const newSelection = selectedRows.includes(recordId)
        ? selectedRows.filter(id => id !== recordId)
        : [...selectedRows, recordId]
      onRowSelect(newSelection)
    }
  }

  const defaultMobileCard = (record: TableRecord, index: number) => (
    <div
      key={record.id}
      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onRowClick?.(record)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {selectable && (
            <input
              type="checkbox"
              className="rounded mt-1"
              checked={selectedRows.includes(record.id)}
              onChange={() => handleRowSelect(record.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex-1">
            {columns.slice(0, 2).map((col) => (
              <div key={col.key} className="mb-1">
                {col.render ? col.render(record[col.key], record, index) : (
                  <div className={`text-sm ${index === 0 ? 'font-medium text-blue-600 hover:text-blue-800' : 'text-gray-600'}`}>
                    {record[col.key]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {columns.slice(2).map((col) => (
          <div key={col.key}>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{col.label}</div>
            <div className="text-gray-900 mt-1">
              {col.render ? col.render(record[col.key], record, index) : record[col.key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {title && <h3 className="font-medium text-gray-900 text-lg">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {actions}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 bg-blue-600 text-white rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <Table className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <BarChart className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <Grid className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="w-8 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record, index) => (
              <tr
                key={record.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onRowClick?.(record)}
              >
                {selectable && (
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedRows.includes(record.id)}
                      onChange={() => handleRowSelect(record.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-sm ${
                      column.align === 'center' ? 'text-center' :
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.render ? column.render(record[column.key], record, index) : record[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        {data.length === 0 ? (
          <div className="p-8 text-center">
            {emptyState || (
              <>
                <div className="text-gray-400 mb-2">No data available</div>
                <div className="text-sm text-gray-500">Try adjusting your filters</div>
              </>
            )}
          </div>
        ) : (
          data.map((record, index) => 
            mobileCardRender ? mobileCardRender(record, index) : defaultMobileCard(record, index)
          )
        )}
      </div>
    </div>
  )
}