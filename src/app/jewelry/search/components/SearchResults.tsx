'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Award,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'

// Mock data for demonstration
const MOCK_DATA = {
  JEWELRY_ITEM: [
    {
      id: '1',
      entity_id: 'jewelry_1',
      entity_name: 'Diamond Solitaire Ring',
      dynamic_data: {
        item_type: 'ring',
        metal_type: 'platinum',
        stone_type: 'diamond',
        carat_weight: 1.5,
        price: 15000,
        status: 'available'
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      entity_id: 'jewelry_2',
      entity_name: 'Emerald Tennis Necklace',
      dynamic_data: {
        item_type: 'necklace',
        metal_type: 'gold',
        stone_type: 'emerald',
        carat_weight: 5.2,
        price: 25000,
        status: 'reserved'
      },
      created_at: '2024-01-14T14:30:00Z',
      updated_at: '2024-01-14T14:30:00Z'
    }
  ],
  GRADING_JOB: [
    {
      id: '3',
      entity_id: 'grading_1',
      entity_name: 'GJ-2024-001',
      dynamic_data: {
        status: 'in_progress',
        priority: 'high',
        assigned_to: 'John Smith',
        due_date: '2024-02-01'
      },
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-16T16:45:00Z'
    }
  ],
  CERTIFICATE: [
    {
      id: '4',
      entity_id: 'cert_1',
      entity_name: 'GIA-2024-001',
      dynamic_data: {
        cert_type: 'gia',
        grade: 'excellent',
        issue_date: '2024-01-15',
        status: 'valid'
      },
      created_at: '2024-01-15T15:00:00Z',
      updated_at: '2024-01-15T15:00:00Z'
    }
  ]
}

interface SearchResultsProps {
  selectedEntities: string[]
  searchQuery: string
  filters: Record<string, any>
  sortBy: string
  sortOrder: 'asc' | 'desc'
  viewMode: 'table' | 'grid'
  organizationId: string
  userRole: string
  onOpenDetails: (entityId: string) => void
  onSortChange: (field: string, order: 'asc' | 'desc') => void
}

export function SearchResults({
  selectedEntities,
  searchQuery,
  filters,
  sortBy,
  sortOrder,
  viewMode,
  organizationId,
  userRole,
  onOpenDetails,
  onSortChange
}: SearchResultsProps) {
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Combine data from all selected entities
  const combinedData = useMemo(() => {
    let allData: any[] = []

    selectedEntities.forEach(entityType => {
      const mockData = MOCK_DATA[entityType as keyof typeof MOCK_DATA] || []
      const dataWithType = mockData.map(item => ({
        ...item,
        entity_type: entityType
      }))
      allData = [...allData, ...dataWithType]
    })

    // Apply search filter
    if (searchQuery) {
      allData = allData.filter(
        item =>
          item.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Object.values(item.dynamic_data || {}).some(value =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    }

    // Apply facet filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        allData = allData.filter(item => value.includes(item.dynamic_data?.[key]))
      } else if (typeof value === 'object' && value !== null) {
        if (value.min !== undefined || value.max !== undefined) {
          allData = allData.filter(item => {
            const itemValue = parseFloat(item.dynamic_data?.[key] || 0)
            return (
              (value.min === undefined || itemValue >= value.min) &&
              (value.max === undefined || itemValue <= value.max)
            )
          })
        }
        if (value.from || value.to) {
          allData = allData.filter(item => {
            const itemDate = new Date(item.dynamic_data?.[key] || item.created_at)
            const fromDate = value.from ? new Date(value.from) : null
            const toDate = value.to ? new Date(value.to) : null

            return (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate)
          })
        }
      }
    })

    // Apply sorting
    allData.sort((a, b) => {
      let aValue = a.dynamic_data?.[sortBy] || a[sortBy]
      let bValue = b.dynamic_data?.[sortBy] || b[sortBy]

      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return allData
  }, [selectedEntities, searchQuery, filters, sortBy, sortOrder])

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return combinedData.slice(start, start + pageSize)
  }, [combinedData, page, pageSize])

  // Handle sort
  const handleSort = useCallback(
    (field: string) => {
      const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
      onSortChange(field, newOrder)
    },
    [sortBy, sortOrder, onSortChange]
  )

  // Get column headers
  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'entity_name', label: 'Name', sortable: true },
      { key: 'entity_type', label: 'Type', sortable: true },
      { key: 'created_at', label: 'Created', sortable: true }
    ]

    // Add dynamic columns based on selected entities
    const dynamicColumns = new Set<string>()
    selectedEntities.forEach(entityType => {
      const mockData = MOCK_DATA[entityType as keyof typeof MOCK_DATA] || []
      mockData.forEach(item => {
        if (item.dynamic_data) {
          Object.keys(item.dynamic_data).forEach(key => {
            if (key !== 'created_at' && key !== 'updated_at') {
              dynamicColumns.add(key)
            }
          })
        }
      })
    })

    const dynamicCols = Array.from(dynamicColumns).map(key => ({
      key,
      label: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      sortable: true
    }))

    return [...baseColumns, ...dynamicCols]
  }, [selectedEntities])

  // Render actions for a row
  const renderActions = useCallback(
    (item: any) => {
      const actions = []

      // View details (always available)
      actions.push(
        <DropdownMenuItem key="view" onClick={() => onOpenDetails(item.entity_id)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
      )

      // Entity-specific actions based on type and role
      if (item.entity_type === 'GRADING_JOB') {
        if (['owner', 'manager', 'grader'].includes(userRole)) {
          actions.push(
            <DropdownMenuItem key="regrade">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regrade
            </DropdownMenuItem>
          )
        }
        if (['owner', 'manager'].includes(userRole)) {
          actions.push(
            <DropdownMenuItem key="certificate">
              <Award className="h-4 w-4 mr-2" />
              Issue Certificate
            </DropdownMenuItem>
          )
        }
      }

      if (item.entity_type === 'JEWELRY_ITEM') {
        if (['owner', 'manager', 'sales'].includes(userRole)) {
          actions.push(
            <DropdownMenuItem key="edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </DropdownMenuItem>
          )
        }
      }

      if (item.entity_type === 'CERTIFICATE') {
        actions.push(
          <DropdownMenuItem key="download">
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
        )
      }

      // Delete action (restricted)
      if (['owner', 'manager'].includes(userRole)) {
        actions.push(
          <DropdownMenuSeparator key="sep" />,
          <DropdownMenuItem key="delete" className="text-red-400">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )
      }

      return actions
    },
    [userRole, onOpenDetails]
  )

  // Format cell value
  const formatCellValue = useCallback((value: any, key: string) => {
    if (value === null || value === undefined) return '-'

    if (key === 'created_at' || key === 'updated_at' || key.includes('_date')) {
      return new Date(value).toLocaleDateString()
    }

    if (key === 'price' || key.includes('amount')) {
      return `$${parseFloat(value).toLocaleString()}`
    }

    if (key === 'status') {
      const statusColors = {
        available: 'bg-green-500/20 text-green-400',
        sold: 'bg-blue-500/20 text-blue-400',
        reserved: 'bg-yellow-500/20 text-yellow-400',
        repair: 'bg-red-500/20 text-red-400',
        pending: 'bg-gray-500/20 text-gray-400',
        in_progress: 'bg-blue-500/20 text-blue-400',
        graded: 'bg-green-500/20 text-green-400',
        certified: 'bg-purple-500/20 text-purple-400',
        valid: 'bg-green-500/20 text-green-400',
        expired: 'bg-red-500/20 text-red-400'
      }

      const colorClass =
        statusColors[value as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-400'

      return <Badge className={colorClass}>{String(value).replace('_', ' ')}</Badge>
    }

    if (key === 'entity_type') {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400">
          {String(value).replace('_', ' ')}
        </Badge>
      )
    }

    return String(value)
  }, [])

  // Render table view
  const renderTableView = () => (
    <Card className="glass-card border-yellow-500/30">
      <Table>
        <TableHeader>
          <TableRow className="border-yellow-500/30">
            {columns.map(column => (
              <TableHead key={column.key} className="text-yellow-400">
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.key)}
                    className="h-auto p-0 hover:bg-transparent text-yellow-400 hover:text-yellow-300"
                  >
                    {column.label}
                    {sortBy === column.key &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-2 h-4 w-4" />
                      ))}
                    {sortBy !== column.key && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            <TableHead className="text-yellow-400 w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map(item => (
            <TableRow
              key={item.entity_id}
              className="border-yellow-500/20 hover:bg-yellow-500/5 cursor-pointer"
              onClick={() => onOpenDetails(item.entity_id)}
            >
              {columns.map(column => (
                <TableCell key={column.key} className="text-gray-300">
                  {formatCellValue(item.dynamic_data?.[column.key] || item[column.key], column.key)}
                </TableCell>
              ))}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => e.stopPropagation()}
                      className="h-8 w-8 p-0 hover:bg-yellow-500/20"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card border-yellow-500/30">
                    {renderActions(item)}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paginatedData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No results found matching your criteria</p>
          <p className="text-sm mt-2">Try adjusting your filters or search query</p>
        </div>
      )}
    </Card>
  )

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {paginatedData.map(item => (
        <Card
          key={item.entity_id}
          className="glass-card border-yellow-500/30 hover:border-yellow-400 transition-colors cursor-pointer"
          onClick={() => onOpenDetails(item.entity_id)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-100 truncate">{item.entity_name}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => e.stopPropagation()}
                    className="h-6 w-6 p-0 hover:bg-yellow-500/20"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-yellow-500/30">
                  {renderActions(item)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Badge className="bg-yellow-500/20 text-yellow-400">
                {item.entity_type.replace('_', ' ')}
              </Badge>

              {Object.entries(item.dynamic_data || {})
                .slice(0, 3)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-gray-300">{formatCellValue(value, key)}</span>
                  </div>
                ))}

              <div className="text-xs text-gray-500 mt-2">
                Created: {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {paginatedData.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          <p>No results found matching your criteria</p>
          <p className="text-sm mt-2">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  )

  const totalPages = Math.ceil(combinedData.length / pageSize)

  return (
    <div className="h-full flex flex-col">
      {/* Results Header */}
      <div className="flex items-center justify-between p-4 border-b border-yellow-500/30">
        <div className="flex items-center gap-4">
          <span className="text-gray-300">{combinedData.length} results</span>
          {searchQuery && (
            <Badge className="bg-blue-500/20 text-blue-400">Search: "{searchQuery}"</Badge>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-yellow-500/50 text-yellow-400"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="border-yellow-500/50 text-yellow-400"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'table' ? renderTableView() : renderGridView()}
      </div>
    </div>
  )
}
