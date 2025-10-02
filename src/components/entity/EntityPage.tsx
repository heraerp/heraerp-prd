'use client'

import React, { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { EntityForm } from './EntityForm'
import { EntityTable } from './EntityTable'
import type { EntityPreset, Role } from '@/hooks/entityPresets'

export interface EntityPageProps {
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
}

export function EntityPage({ preset, userRole, title, subtitle }: EntityPageProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editRow, setEditRow] = useState<any>(null)

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
        smart_code: `HERA.SALON.${preset.entity_type}.ENTITY.ITEM.v1`,
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

      // Separate dynamic fields from entity updates
      const dynamic_patch: Record<string, any> = {}
      const relationships_patch: Record<string, string[]> = {}

      // Extract dynamic fields
      if (updates.dynamic_fields) {
        Object.entries(updates.dynamic_fields).forEach(([key, value]) => {
          dynamic_patch[key] = value
        })
      }

      // Extract direct field updates
      ;(preset.dynamicFields || []).forEach(df => {
        if (df.name in updates) {
          dynamic_patch[df.name] = updates[df.name]
        }
      })

      // Extract relationships
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

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title ?? preset.labels.plural}</h1>
          <p className="text-sm text-muted-foreground">
            {subtitle ?? `Manage ${preset.labels.plural.toLowerCase()} via universal CRUD.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New {preset.labels.singular}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <EntityTable
        preset={preset}
        rows={entities}
        loading={isLoading}
        error={error}
        userRole={userRole}
        onEdit={canEdit ? (row: any) => setEditRow(row) : undefined}
        onDelete={canDelete ? (row: any) => onDelete(row.id) : undefined}
      />

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New {preset.labels.singular}</DialogTitle>
          </DialogHeader>
          <EntityForm
            key="create-form"
            preset={preset}
            mode="create"
            allowedRoles={[userRole]}
            onSuccess={() => {
              setOpen(false)
              refetch()
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={v => !v && setEditRow(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {preset.labels.singular}</DialogTitle>
          </DialogHeader>
          {editRow && (
            <EntityForm
              key={`edit-form-${editRow.id}`}
              preset={preset}
              mode="update"
              entityId={editRow.id}
              allowedRoles={[userRole]}
              onSuccess={() => {
                setEditRow(null)
                refetch()
              }}
              onCancel={() => setEditRow(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
