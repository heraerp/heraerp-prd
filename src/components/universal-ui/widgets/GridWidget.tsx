'use client'

import React, { useEffect, useState } from 'react'
import { Widget } from '@/lib/universal-ui/view-meta-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface GridWidgetProps {
  widget: Widget
  entityId?: string
  organizationId: string
  onAction?: (action: any) => void
}

export function GridWidget({ widget, entityId, organizationId, onAction }: GridWidgetProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(widget.config.pagination?.page_size || 25)
  const [totalRows, setTotalRows] = useState(0)

  useEffect(() => {
    loadData()
  }, [entityId, currentPage, pageSize, sortColumn, sortDirection])

  const loadData = async () => {
    try {
      setLoading(true)

      // Determine data source
      const source = widget.data_source
      let result: any = { data: [] }

      if (source?.type === 'entities') {
        result = await universalApi.query('core_entities', {
          organization_id: organizationId,
          entity_type: source.entity_type,
          ...buildFilters(source.filters)
        })
      } else if (source?.type === 'transactions') {
        result = await universalApi.query('universal_transactions', {
          organization_id: organizationId,
          ...buildFilters(source.filters)
        })
      } else if (source?.type === 'relationships' && entityId) {
        result = await universalApi.query('core_relationships', {
          organization_id: organizationId,
          from_entity_id: entityId,
          ...buildFilters(source.filters)
        })
      } else {
        // Default to entities
        result = await universalApi.query('core_entities', {
          organization_id: organizationId
        })
      }

      if (result.data) {
        // Apply client-side filtering and sorting
        let filteredData = result.data

        // Search filter
        if (searchTerm) {
          filteredData = filteredData.filter((row: any) =>
            Object.values(row).some(val =>
              String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
        }

        // Sorting
        if (sortColumn) {
          filteredData.sort((a: any, b: any) => {
            const aVal = a[sortColumn]
            const bVal = b[sortColumn]
            const direction = sortDirection === 'asc' ? 1 : -1

            if (aVal === null) return 1
            if (bVal === null) return -1

            if (aVal < bVal) return -direction
            if (aVal > bVal) return direction
            return 0
          })
        }

        setTotalRows(filteredData.length)

        // Pagination
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        setData(filteredData.slice(startIndex, endIndex))
      }
    } catch (error) {
      console.error('Failed to load grid data:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildFilters = (filters: any[] = []) => {
    const filterObj: any = {}
    filters.forEach(filter => {
      filterObj[filter.field] = filter.value
    })
    return filterObj
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(data.map(row => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelection = new Set(selectedRows)
    if (checked) {
      newSelection.add(rowId)
    } else {
      newSelection.delete(rowId)
    }
    setSelectedRows(newSelection)
  }

  const renderCellValue = (row: any, column: any) => {
    const value = row[column.field]

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }

    switch (column.type) {
      case 'date':
        return format(new Date(value), 'PPP')

      case 'money':
        return `$${Number(value).toFixed(2)}`

      case 'percentage':
        return `${Number(value).toFixed(1)}%`

      case 'boolean':
        return value ? '✓' : '✗'

      case 'status':
        const statusColors: any = {
          draft: 'secondary',
          in_review: 'outline',
          released: 'default',
          superseded: 'destructive',
          archived: 'secondary'
        }
        return <Badge variant={statusColors[value] || 'default'}>{value}</Badge>

      case 'entity_link':
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => onAction?.({ type: 'navigate', target: `/entities/${row.id}` })}
          >
            {value}
          </Button>
        )

      case 'actions':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {widget.config.row_actions?.map(action => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => onAction?.({ ...action, rowData: row })}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )

      default:
        return String(value)
    }
  }

  const totalPages = Math.ceil(totalRows / pageSize)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{widget.title}</CardTitle>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>

            {/* Bulk actions */}
            {selectedRows.size > 0 && widget.config.bulk_actions && (
              <>
                <Badge variant="secondary">{selectedRows.size} selected</Badge>
                {widget.config.bulk_actions.map(action => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onAction?.({ ...action, selectedRows: Array.from(selectedRows) })
                    }
                  >
                    {action.label}
                  </Button>
                ))}
              </>
            )}

            {/* Standard bulk actions when no rows selected */}
            {selectedRows.size === 0 &&
              widget.config.bulk_actions &&
              widget.config.bulk_actions
                .filter(a => a.type === 'create')
                .map(action => (
                  <Button key={action.id} size="sm" onClick={() => onAction?.(action)}>
                    {action.label}
                  </Button>
                ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {widget.config.bulk_actions && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.size === data.length && data.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {widget.config.columns?.map(column => (
                  <TableHead
                    key={column.field}
                    className={cn(
                      column.sortable && 'cursor-pointer hover:bg-muted/50',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.field)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && sortColumn === column.field && (
                        <span className="text-muted-foreground">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {widget.config.row_actions && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={100} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={100} className="text-center py-8 text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row: any) => (
                  <TableRow key={row.id}>
                    {widget.config.bulk_actions && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(row.id)}
                          onCheckedChange={checked => handleSelectRow(row.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    {widget.config.columns?.map(column => (
                      <TableCell
                        key={column.field}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {renderCellValue(row, column)}
                      </TableCell>
                    ))}
                    {widget.config.row_actions && (
                      <TableCell>{renderCellValue(row, { type: 'actions' })}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {widget.config.pagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {widget.config.pagination.page_size_options.map(size => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
