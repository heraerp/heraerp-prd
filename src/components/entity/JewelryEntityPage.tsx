'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, Package, Diamond, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { EntityForm } from './EntityForm'
import type { EntityPreset, Role } from '@/hooks/entityPresets'
import '@/styles/jewelry-glassmorphism.css'

export interface JewelryEntityPageProps {
  preset: EntityPreset & {
    labels: {
      singular: string
      plural: string
    }
    permissions?: {
      create?: (role: Role) => boolean
      edit?: (role: Role) => boolean
      delete?: (role: Role) => boolean
      view?: (role: Role) => boolean
    }
  }
  userRole: Role
  title?: string
  subtitle?: string
  className?: string
}

export function JewelryEntityPage({
  preset,
  userRole,
  title,
  subtitle,
  className
}: JewelryEntityPageProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editRow, setEditRow] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Universal entity hook with preset configuration
  const {
    entities,
    isLoading,
    error,
    refetch,
    create,
    update,
    delete: remove,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: preset.entity_type,
    dynamicFields: preset.dynamicFields,
    relationships: preset.relationships,
    filters: { include_dynamic: true, limit: 100 }
  })

  // Create handler
  const onCreate = async (payload: any) => {
    try {
      await create({
        entity_type: preset.entity_type,
        entity_name: payload.entity_name || 'Untitled',
        smart_code: `HERA.JEWELRY.${preset.entity_type}.ENTITY.ITEM.v1`,
        dynamic_fields: Object.fromEntries(
          (preset.dynamicFields || []).map(df => [
            df.name,
            {
              value: payload.dynamic_fields?.[df.name] ?? payload[df.name],
              type: df.type,
              smart_code: df.smart_code
            }
          ])
        ),
        metadata: {
          relationships: payload.relationships || {}
        }
      })
      toast({
        title: `${preset.labels.singular} created`,
        description: `Successfully created ${payload.entity_name || 'new item'}`
      })
      setOpen(false)
      refetch()
    } catch (e: any) {
      toast({
        title: 'Create failed',
        description: e?.message ?? 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  // Update handler
  const onUpdate = async (payload: any) => {
    try {
      const { entity_id, ...updates } = payload

      const dynamic_patch: Record<string, any> = {}
      const relationships_patch: Record<string, string[]> = {}

      if (updates.dynamic_fields) {
        Object.entries(updates.dynamic_fields).forEach(([key, value]) => {
          dynamic_patch[key] = value
        })
      }

      ;(preset.dynamicFields || []).forEach(df => {
        if (df.name in updates) {
          dynamic_patch[df.name] = updates[df.name]
        }
      })

      if (updates.relationships) {
        Object.entries(updates.relationships).forEach(([type, ids]) => {
          relationships_patch[type] = Array.isArray(ids) ? ids : [ids].filter(Boolean)
        })
      }

      await update({
        entity_id,
        entity_name: updates.entity_name,
        dynamic_patch,
        relationships_patch
      })

      toast({
        title: `${preset.labels.singular} updated`,
        description: 'Changes saved successfully'
      })
      setEditRow(null)
      refetch()
    } catch (e: any) {
      toast({
        title: 'Update failed',
        description: e?.message ?? 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  // Delete handler
  const onDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${preset.labels.singular.toLowerCase()}?`)) {
      return
    }

    try {
      await remove({ entity_id: id, hard_delete: false })
      toast({
        title: `${preset.labels.singular} deleted`,
        description: 'Item moved to archive'
      })
      refetch()
    } catch (e: any) {
      toast({
        title: 'Delete failed',
        description: e?.message ?? 'Unknown error',
        variant: 'destructive'
      })
    }
  }

  // Check permissions
  const canCreate = preset.permissions?.create?.(userRole) !== false
  const canEdit = preset.permissions?.edit?.(userRole) !== false
  const canDelete = preset.permissions?.delete?.(userRole) !== false

  // Calculate summary metrics for jewelry items
  const totalItems =
    entities?.reduce((sum, item) => sum + (Number(item.dynamic_fields?.quantity?.value) || 0), 0) ||
    0
  const totalValue =
    entities?.reduce((sum, item) => {
      const quantity = Number(item.dynamic_fields?.quantity?.value) || 0
      const unitPrice = Number(item.dynamic_fields?.unit_price?.value) || 0
      return sum + quantity * unitPrice
    }, 0) || 0
  const uniqueItems = entities?.length || 0
  const lowStockItems =
    entities?.filter(item => {
      const quantity = Number(item.dynamic_fields?.quantity?.value) || 0
      const status = item.dynamic_fields?.status?.value
      return quantity < 5 || status === 'low_stock' || status === 'out_of_stock'
    }).length || 0

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'jewelry-status-active'
      case 'low_stock':
        return 'jewelry-status-pending'
      case 'out_of_stock':
        return 'jewelry-status-inactive'
      case 'reserved':
        return 'jewelry-status-luxury'
      default:
        return 'jewelry-status-inactive'
    }
  }

  return (
    <div className={`w-full max-w-7xl mx-auto p-6 space-y-6 ${className || ''}`}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
          <Package className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
          {title ?? preset.labels.plural}
        </h1>
        <p className="jewelry-text-luxury text-lg md:text-xl">
          {subtitle ?? `Universal Entity Framework - ${preset.labels.plural} management`}
        </p>
      </motion.div>

      {/* Summary Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="jewelry-glass-card jewelry-float p-6 text-center">
          <Package className="mx-auto mb-3 jewelry-icon-gold" size={32} />
          <h3 className="jewelry-text-high-contrast text-2xl font-bold">{totalItems}</h3>
          <p className="jewelry-text-muted text-sm font-medium">Total Items</p>
        </div>

        <div
          className="jewelry-glass-card jewelry-float p-6 text-center"
          style={{ animationDelay: '0.1s' }}
        >
          <Diamond className="mx-auto mb-3 jewelry-icon-gold" size={32} />
          <h3 className="jewelry-text-high-contrast text-2xl font-bold">
            ${totalValue.toLocaleString()}
          </h3>
          <p className="jewelry-text-muted text-sm font-medium">Total Value</p>
        </div>

        <div
          className="jewelry-glass-card jewelry-float p-6 text-center"
          style={{ animationDelay: '0.2s' }}
        >
          <RefreshCw className="mx-auto mb-3 jewelry-icon-gold" size={32} />
          <h3 className="jewelry-text-high-contrast text-2xl font-bold">{lowStockItems}</h3>
          <p className="jewelry-text-muted text-sm font-medium">Low Stock Items</p>
        </div>

        <div
          className="jewelry-glass-card jewelry-float p-6 text-center"
          style={{ animationDelay: '0.3s' }}
        >
          <Package className="mx-auto mb-3 jewelry-icon-gold" size={32} />
          <h3 className="jewelry-text-high-contrast text-2xl font-bold">{uniqueItems}</h3>
          <p className="jewelry-text-muted text-sm font-medium">Unique Items</p>
        </div>
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="jewelry-glass-panel"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="jewelry-text-high-contrast text-xl font-semibold">
              {preset.labels.plural} ({entities?.length || 0})
            </h2>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="jewelry-text-luxury text-sm">{selectedItems.length} selected</span>
                <button
                  onClick={clearSelection}
                  className="jewelry-btn-secondary text-sm px-3 py-1"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="jewelry-btn-secondary"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreate && (
              <Button onClick={() => setOpen(true)} className="jewelry-btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                New {preset.labels.singular}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Items Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="jewelry-glass-panel"
      >
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto mb-4 jewelry-icon-gold animate-spin" size={48} />
            <p className="jewelry-text-luxury">Loading {preset.labels.plural.toLowerCase()}...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Package className="mx-auto mb-4 jewelry-icon-gold opacity-50" size={64} />
            <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">Error Loading Data</h3>
            <p className="jewelry-text-muted mb-4">{error.message}</p>
            <Button onClick={() => refetch()} className="jewelry-btn-secondary">
              Try Again
            </Button>
          </div>
        ) : entities && entities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`jewelry-glass-card jewelry-scale-hover p-6 relative ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-jewelry-gold-500/50' : ''
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="jewelry-checkbox"
                  />
                </div>

                {/* Item Header */}
                <div className="flex items-start justify-between mb-4 ml-8">
                  <div className="flex-1">
                    <h3 className="jewelry-text-high-contrast font-semibold text-lg mb-1">
                      {item.entity_name}
                    </h3>
                    <p className="jewelry-text-muted text-sm font-mono">
                      {item.dynamic_fields?.sku?.value || 'No SKU'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        item.dynamic_fields?.status?.value || 'unknown'
                      )}`}
                    >
                      {(item.dynamic_fields?.status?.value || 'UNKNOWN')
                        .replace('_', ' ')
                        .toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Item Details */}
                <div className="space-y-3">
                  {preset.dynamicFields
                    ?.map(field => {
                      const value = item.dynamic_fields?.[field.name]?.value
                      if (!value && value !== 0) return null

                      return (
                        <div key={field.name} className="flex items-center justify-between">
                          <span className="jewelry-text-muted text-sm">
                            {field.ui?.label || field.name}:
                          </span>
                          <span className="jewelry-text-high-contrast text-sm font-medium">
                            {field.type === 'number' && field.ui?.label?.includes('Price')
                              ? `$${Number(value).toLocaleString()}`
                              : field.type === 'number' && field.ui?.label?.includes('Weight')
                                ? `${value}g`
                                : field.type === 'boolean'
                                  ? value
                                    ? 'Yes'
                                    : 'No'
                                  : String(value)}
                          </span>
                        </div>
                      )
                    })
                    .slice(0, 6)}
                </div>

                {/* Item Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-jewelry-blue-200">
                  <div className="flex items-center space-x-1">
                    <span className="jewelry-text-muted text-xs">ID: {item.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                      <Eye className="jewelry-icon-gold" size={16} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setEditRow(item)}
                        className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform"
                      >
                        <Edit className="jewelry-icon-gold" size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="jewelry-icon-gold" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto mb-4 jewelry-icon-gold opacity-50" size={64} />
            <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">
              No {preset.labels.plural} Found
            </h3>
            <p className="jewelry-text-muted mb-4">
              Get started by creating your first {preset.labels.singular.toLowerCase()}.
            </p>
            {canCreate && (
              <Button onClick={() => setOpen(true)} className="jewelry-btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create {preset.labels.singular}
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto jewelry-glass-panel">
          <DialogHeader>
            <DialogTitle className="jewelry-text-high-contrast">
              New {preset.labels.singular}
            </DialogTitle>
          </DialogHeader>
          <EntityForm
            key="create-form"
            preset={preset}
            mode="create"
            allowedRoles={[userRole]}
            onSuccess={onCreate}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={v => !v && setEditRow(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto jewelry-glass-panel">
          <DialogHeader>
            <DialogTitle className="jewelry-text-high-contrast">
              Edit {preset.labels.singular}
            </DialogTitle>
          </DialogHeader>
          {editRow && (
            <EntityForm
              key={`edit-form-${editRow.id}`}
              preset={preset}
              mode="update"
              entityId={editRow.id}
              allowedRoles={[userRole]}
              onSuccess={onUpdate}
              onCancel={() => setEditRow(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center mt-12 mb-6"
      >
        <p className="text-jewelry-platinum-500 text-sm">
          Powered by{' '}
          <span className="jewelry-text-luxury font-semibold">HERA Universal Entity Framework</span>
          {' • '}
          <span className="jewelry-text-luxury font-semibold">95% less code</span>
        </p>
      </motion.div>
    </div>
  )
}
