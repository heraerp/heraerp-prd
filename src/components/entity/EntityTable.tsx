'use client'

import React from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import type { EntityPreset, Role } from '@/hooks/entityPresets'

interface EntityTableProps {
  preset: EntityPreset & {
    labels: {
      singular: string
      plural: string
    }
    permissions?: {
      edit?: (role: Role) => boolean
      delete?: (role: Role) => boolean
      view?: (role: Role) => boolean
    }
  }
  rows: any[]
  loading?: boolean
  error?: string
  userRole: Role
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  onView?: (row: any) => void
}

export function EntityTable({
  preset,
  rows,
  loading,
  error,
  userRole,
  onEdit,
  onDelete,
  onView
}: EntityTableProps) {
  
  // Helper to check if user can see a field
  const canSeeField = (field: any) => {
    if (!field.ui?.roles) return true
    return field.ui.roles.includes(userRole)
  }

  // Format field value for display
  const formatValue = (field: any, value: any) => {
    if (value === null || value === undefined) return '-'
    
    switch (field.type) {
      case 'number':
        if (field.name.includes('price') || field.name.includes('cost')) {
          return `AED ${Number(value).toFixed(2)}`
        }
        if (field.name.includes('percent') || field.name.includes('rate')) {
          return `${(Number(value) * 100).toFixed(1)}%`
        }
        return Number(value).toLocaleString()
      
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        )
      
      case 'date':
        return new Date(value).toLocaleDateString()
      
      case 'json':
        return <code className="text-xs">{JSON.stringify(value)}</code>
      
      default:
        return String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')
    }
  }

  // Get visible fields for table columns
  const visibleFields = (preset.dynamicFields || []).filter(canSeeField)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading {preset.labels.plural.toLowerCase()}: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No {preset.labels.plural.toLowerCase()} found.</p>
            <p className="text-sm">Create your first {preset.labels.singular.toLowerCase()} to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasActions = onEdit || onDelete || onView

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Name</TableHead>
              {visibleFields.map(field => (
                <TableHead key={field.name} className="font-semibold">
                  {field.ui?.label || field.name}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="text-right font-semibold">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow 
                key={row.id || index}
                className="hover:bg-muted/50"
              >
                {/* Entity Name */}
                <TableCell className="font-medium">
                  {row.entity_name || row.name || 'Untitled'}
                </TableCell>

                {/* Dynamic Fields */}
                {visibleFields.map(field => {
                  const value = row.dynamic?.[field.name] ?? row[field.name]
                  return (
                    <TableCell key={field.name}>
                      {formatValue(field, value)}
                    </TableCell>
                  )
                })}

                {/* Actions */}
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(row)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}