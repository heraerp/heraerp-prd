'use client'

import React from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal, Settings, Maximize } from 'lucide-react'

export interface SapTableColumn {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: any, index: number) => React.ReactNode
}

export interface SapTableRecord {
  [key: string]: any
  children?: SapTableRecord[]
  _expandable?: boolean
  _expanded?: boolean
  _level?: number
}

export interface SapTableProps {
  title?: string
  columns: SapTableColumn[]
  data: SapTableRecord[]
  loading?: boolean
  expandable?: boolean
  onRowExpand?: (record: SapTableRecord, expanded: boolean) => void
  className?: string
  showToolbar?: boolean
  onSettings?: () => void
  onFullscreen?: () => void
}

export function SapTable({
  title,
  columns,
  data,
  loading = false,
  expandable = false,
  onRowExpand,
  className = '',
  showToolbar = false,
  onSettings,
  onFullscreen
}: SapTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  const handleRowExpand = (record: SapTableRecord, rowKey: string) => {
    const newExpanded = new Set(expandedRows)
    const isCurrentlyExpanded = expandedRows.has(rowKey)
    
    if (isCurrentlyExpanded) {
      newExpanded.delete(rowKey)
    } else {
      newExpanded.add(rowKey)
    }
    
    setExpandedRows(newExpanded)
    onRowExpand?.(record, !isCurrentlyExpanded)
  }

  const renderRow = (record: SapTableRecord, index: number, level: number = 0): React.ReactNode[] => {
    const rowKey = record.id || record.key || index.toString()
    const isExpanded = expandedRows.has(rowKey)
    const hasChildren = record.children && record.children.length > 0
    const isExpandable = expandable && (record._expandable !== false) && hasChildren

    const rows: React.ReactNode[] = []

    // Main row
    rows.push(
      <tr
        key={rowKey}
        className={`sap-table-body ${isExpandable ? 'sap-table-expandable' : ''}`}
      >
        {columns.map((column, colIndex) => {
          const value = record[column.key]
          const isFirstColumn = colIndex === 0
          
          return (
            <td
              key={column.key}
              className={`${level > 0 ? `sap-table-indent-${Math.min(level, 2)}` : ''}`}
              style={{ 
                textAlign: column.align || 'left',
                width: column.width 
              }}
            >
              {isFirstColumn && isExpandable && (
                <button
                  onClick={() => handleRowExpand(record, rowKey)}
                  className="inline-flex items-center mr-2 p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
              {column.render ? column.render(value, record, index) : (value || '—')}
            </td>
          )
        })}
      </tr>
    )

    // Children rows (if expanded)
    if (isExpanded && hasChildren) {
      record.children!.forEach((childRecord, childIndex) => {
        rows.push(...renderRow(childRecord, childIndex, level + 1))
      })
    }

    return rows
  }

  if (loading) {
    return (
      <div className={`sap-content-section ${className}`}>
        {title && (
          <div className="sap-section-header">
            <h3 className="sap-section-title">{title}</h3>
          </div>
        )}
        <div className="p-8">
          <div className="sap-skeleton h-64 w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`sap-content-section ${className}`}>
      {(title || showToolbar) && (
        <div className="sap-section-header">
          {title && <h3 className="sap-section-title">{title}</h3>}
          {showToolbar && (
            <div className="sap-section-actions">
              <button className="sap-icon-btn" onClick={onSettings} title="Settings">
                <Settings className="w-4 h-4" />
              </button>
              <button className="sap-icon-btn" onClick={onFullscreen} title="Fullscreen">
                <Maximize className="w-4 h-4" />
              </button>
              <button className="sap-icon-btn" title="More">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="sap-table sap-font">
          <thead className="sap-table-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ 
                    textAlign: column.align || 'left',
                    width: column.width 
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="sap-table-body">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((record, index) => renderRow(record, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}