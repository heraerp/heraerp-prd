'use client'

/**
 * Entity List View - Layout Engine
 * Smart Code: HERA.UNIVERSAL.COMPONENT.ENTITY_LIST_VIEW.v1
 * 
 * Universal component that handles grid, list, and mobile layouts
 * with dynamic rendering based on entity configuration
 */

import React, { useState, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  ExternalLink,
  User,
  Building2,
  Package,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { 
  EntityTypeConfig, 
  EntityListColumn, 
  EntityListConfiguration 
} from '@/lib/config/entity-types'

interface EntityData {
  id: string
  [key: string]: any
}

interface EntityListViewProps {
  entities: EntityData[]
  config: EntityTypeConfig
  view: 'grid' | 'list' | 'mobile'
  loading?: boolean
  selectedItems?: string[]
  onItemSelect?: (id: string) => void
  onItemsSelect?: (ids: string[]) => void
  onItemClick?: (entity: EntityData) => void
  onItemEdit?: (entity: EntityData) => void
  onItemDelete?: (entity: EntityData) => void
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  currentSort?: { field: string; direction: 'asc' | 'desc' }
  emptyMessage?: string
  emptyAction?: React.ReactNode
}

export function EntityListView({
  entities,
  config,
  view,
  loading = false,
  selectedItems = [],
  onItemSelect,
  onItemsSelect,
  onItemClick,
  onItemEdit,
  onItemDelete,
  onSort,
  currentSort,
  emptyMessage,
  emptyAction
}: EntityListViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  
  const listConfig = config.list_configuration

  // Get visible columns for current view
  const visibleColumns = useMemo(() => {
    if (!listConfig?.list_columns) return []
    
    return listConfig.list_columns.filter(col => {
      if (view === 'mobile') {
        return col.mobile_priority !== 'hidden'
      }
      return col.visible !== false
    })
  }, [listConfig, view])

  // Handle item selection
  const handleItemToggle = (id: string) => {
    onItemSelect?.(id)
  }

  const handleSelectAll = () => {
    const allSelected = entities.length > 0 && entities.every(entity => selectedItems.includes(entity.id))
    if (allSelected) {
      onItemsSelect?.([])
    } else {
      onItemsSelect?.(entities.map(entity => entity.id))
    }
  }

  // Format field values
  const formatFieldValue = (value: any, column: EntityListColumn): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-400">—</span>
    }

    switch (column.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(Number(value) || 0)
      
      case 'date':
        return new Date(value).toLocaleDateString()
      
      case 'email':
        return (
          <a 
            href={`mailto:${value}`} 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-3 h-3" />
            {value}
          </a>
        )
      
      case 'phone':
        return (
          <a 
            href={`tel:${value}`} 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3 h-3" />
            {value}
          </a>
        )
      
      case 'link':
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            {value}
          </a>
        )
      
      case 'badge':
        return (
          <Badge 
            variant={getStatusVariant(value)} 
            className="capitalize"
          >
            {String(value).replace(/_/g, ' ')}
          </Badge>
        )
      
      default:
        return column.render === 'chip' ? (
          <Badge variant="outline" className="font-mono text-xs">
            {value}
          </Badge>
        ) : String(value)
    }
  }

  // Get status variant for badges
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const statusLower = String(status).toLowerCase()
    if (['active', 'completed', 'approved'].includes(statusLower)) return 'default'
    if (['pending', 'draft', 'review'].includes(statusLower)) return 'secondary'
    if (['inactive', 'cancelled', 'rejected'].includes(statusLower)) return 'destructive'
    return 'outline'
  }

  // Render action buttons
  const renderActions = (entity: EntityData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onItemClick?.(entity)}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
        {onItemEdit && (
          <DropdownMenuItem onClick={() => onItemEdit(entity)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {onItemDelete && (
          <DropdownMenuItem 
            className="text-red-600"
            onClick={() => onItemDelete(entity)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Loading state
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Loading {config.plural.toLowerCase()}...</p>
      </div>
    )
  }

  // Empty state
  if (entities.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <config.icon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {emptyMessage || `No ${config.plural.toLowerCase()} found`}
        </h3>
        <p className="text-slate-500 mb-6">
          Get started by creating your first {config.name.toLowerCase()}.
        </p>
        {emptyAction}
      </div>
    )
  }

  // Grid View
  if (view === 'grid') {
    const previewFields = listConfig?.grid_preview_fields || visibleColumns.slice(0, 4).map(col => col.field)
    
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {entities.map((entity) => (
            <Card 
              key={entity.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-slate-200/50 bg-white/80",
                selectedItems.includes(entity.id) && "ring-2 ring-blue-500 bg-blue-50/50"
              )}
              onClick={() => onItemClick?.(entity)}
            >
              <CardContent className="p-4">
                {/* Header with selection */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedItems.includes(entity.id)}
                      onCheckedChange={() => handleItemToggle(entity.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: config.color }}
                    >
                      {entity[listConfig?.mobile_primary_field || 'name']?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>
                  {renderActions(entity)}
                </div>

                {/* Primary field */}
                <h3 className="font-medium text-slate-900 mb-1 line-clamp-2">
                  {entity[listConfig?.mobile_primary_field || previewFields[0]]}
                </h3>

                {/* Secondary field */}
                {listConfig?.mobile_secondary_field && (
                  <p className="text-sm text-slate-600 mb-3">
                    {entity[listConfig.mobile_secondary_field]}
                  </p>
                )}

                {/* Preview fields */}
                <div className="space-y-2">
                  {previewFields.slice(1, 4).map((fieldName) => {
                    const column = visibleColumns.find(col => col.field === fieldName)
                    if (!column || !entity[fieldName]) return null
                    
                    return (
                      <div key={fieldName} className="flex justify-between text-sm">
                        <span className="text-slate-500 truncate">{column.label}:</span>
                        <span className="text-slate-700 font-medium truncate ml-2">
                          {formatFieldValue(entity[fieldName], column)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Mobile View
  if (view === 'mobile') {
    return (
      <div className="divide-y divide-slate-200/50">
        {entities.map((entity) => (
          <div 
            key={entity.id} 
            className={cn(
              "p-4 transition-all active:scale-[0.98]",
              selectedItems.includes(entity.id) && "bg-blue-50/50"
            )}
            onClick={() => onItemClick?.(entity)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedItems.includes(entity.id)}
                onCheckedChange={() => handleItemToggle(entity.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
              
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: config.color }}
              >
                {entity[listConfig?.mobile_primary_field || 'name']?.charAt(0)?.toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 mb-1 truncate">
                  {entity[listConfig?.mobile_primary_field || 'name']}
                </h3>
                
                {listConfig?.mobile_secondary_field && (
                  <p className="text-sm text-slate-600 mb-2 truncate">
                    {entity[listConfig.mobile_secondary_field]}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs">
                  {listConfig?.mobile_meta_fields?.slice(0, 3).map((fieldName) => {
                    const column = visibleColumns.find(col => col.field === fieldName)
                    const value = entity[fieldName]
                    if (!column || !value) return null
                    
                    return (
                      <div key={fieldName} className="flex items-center gap-1 text-slate-500">
                        {formatFieldValue(value, column)}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {renderActions(entity)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // List View (Table)
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50/50 border-b border-slate-200/50">
          <tr>
            <th className="w-12 p-4">
              <Checkbox
                checked={entities.length > 0 && entities.every(entity => selectedItems.includes(entity.id))}
                onCheckedChange={handleSelectAll}
              />
            </th>
            {visibleColumns.map((column) => (
              <th 
                key={column.field}
                className={cn(
                  "p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider",
                  column.align === 'center' && "text-center",
                  column.align === 'right' && "text-right",
                  column.sortable && "cursor-pointer hover:text-slate-700"
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort?.(column.field, 
                  currentSort?.field === column.field && currentSort?.direction === 'asc' ? 'desc' : 'asc'
                )}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && currentSort?.field === column.field && (
                    currentSort.direction === 'asc' ? 
                      <ChevronUp className="w-3 h-3" /> : 
                      <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </th>
            ))}
            <th className="w-16 p-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/30">
          {entities.map((entity) => (
            <tr 
              key={entity.id}
              className={cn(
                "hover:bg-slate-50/50 transition-colors cursor-pointer",
                selectedItems.includes(entity.id) && "bg-blue-50/50"
              )}
              onClick={() => onItemClick?.(entity)}
            >
              <td className="p-4">
                <Checkbox
                  checked={selectedItems.includes(entity.id)}
                  onCheckedChange={() => handleItemToggle(entity.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              {visibleColumns.map((column) => (
                <td 
                  key={column.field}
                  className={cn(
                    "p-4 whitespace-nowrap",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right"
                  )}
                >
                  <div className="max-w-xs truncate">
                    {formatFieldValue(entity[column.field], column)}
                  </div>
                </td>
              ))}
              <td className="p-4">
                {renderActions(entity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Mock data generator for testing
export function generateMockEntityData(config: EntityTypeConfig, count: number = 25): EntityData[] {
  const mockData: EntityData[] = []
  
  for (let i = 1; i <= count; i++) {
    const entity: EntityData = {
      id: `${config.id}-${i}`,
    }
    
    // Generate mock data based on field configuration
    config.fields.forEach(field => {
      switch (field.type) {
        case 'text':
          if (field.name.includes('name')) {
            entity[field.name] = `${config.name} ${i}`
          } else if (field.name.includes('code')) {
            entity[field.name] = `${config.id.toUpperCase()}-${String(i).padStart(3, '0')}`
          } else {
            entity[field.name] = `Sample ${field.label} ${i}`
          }
          break
        case 'email':
          entity[field.name] = `contact${i}@example.com`
          break
        case 'phone':
          entity[field.name] = `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`
          break
        case 'number':
          entity[field.name] = Math.floor(Math.random() * 100000)
          break
        case 'select':
          if (field.options && field.options.length > 0) {
            entity[field.name] = field.options[Math.floor(Math.random() * field.options.length)].value
          }
          break
        case 'date':
          entity[field.name] = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
          break
        default:
          entity[field.name] = `Sample ${field.label}`
      }
    })
    
    mockData.push(entity)
  }
  
  return mockData
}