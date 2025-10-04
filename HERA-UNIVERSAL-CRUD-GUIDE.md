# HERA Universal CRUD Implementation Guide

> **Version**: 1.0
> **Last Updated**: 2025-01-10
> **Status**: ✅ PRODUCTION STANDARD
> **Validated**: Salon Services & Categories

---

## 📚 Table of Contents

1. [Overview & Principles](#overview--principles)
2. [Pre-Implementation Checklist](#pre-implementation-checklist)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Code Templates](#code-templates)
5. [Common Pitfalls](#common-pitfalls)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview & Principles

### **HERA Universal Architecture**

HERA uses a **universal 6-table schema** that handles ALL entity types without schema changes:

```
core_organizations     → Multi-tenant isolation
core_entities          → ALL business objects (products, services, customers, etc.)
core_dynamic_data      → Unlimited custom fields per entity
core_relationships     → Entity connections and hierarchies
universal_transactions → All business transaction headers
universal_transaction_lines → Transaction line items
```

### **Core Principles (NEVER VIOLATE)**

1. **✅ Universal API v2 Only** - All operations via `/api/v2/*` endpoints
2. **✅ RPC Functions Only** - No direct database queries, always use RPC
3. **✅ Status Standardization** - Only `'active'` or `'archived'`, never `null`
4. **✅ Authentication Always** - JWT + `x-hera-org` header on every request
5. **✅ Organization Isolation** - Every query filtered by `organization_id`
6. **✅ Dynamic Data** - Custom fields in `core_dynamic_data`, not metadata
7. **✅ Enterprise UI** - Luxe theme with professional polish
8. **✅ Cascade Deletion** - Delete relationships → dynamic data → entity (in order)

---

## Pre-Implementation Checklist

Before starting implementation, ensure:

### **1. Entity Definition**
- [ ] Entity type name defined (e.g., 'product', 'customer', 'appointment')
- [ ] Smart code pattern identified (e.g., `HERA.SALON.PROD.STANDARD.V1`)
- [ ] Core fields identified (stored in `core_entities`)
- [ ] Dynamic fields identified (stored in `core_dynamic_data`)

### **2. Data Model**
```typescript
// Example: Product Entity
Core Fields (core_entities):
- entity_type: 'product'
- entity_name: string (product name)
- entity_code: string (auto-generated)
- entity_description: string (optional)
- status: 'active' | 'archived'
- smart_code: string

Dynamic Fields (core_dynamic_data):
- price: number
- cost: number
- sku: string
- category: string
- stock_quantity: number
- reorder_level: number
```

### **3. File Structure Preparation**
- [ ] Create custom hook: `/src/hooks/useHera[EntityName].ts`
- [ ] Create modal component: `/src/components/[module]/[EntityName]Modal.tsx`
- [ ] Identify page location: `/src/app/[module]/[entity-plural]/page.tsx`

---

## Step-by-Step Implementation

### **Phase 1: Backend - API Routes (Already Done)**

The Universal API v2 endpoints are **already implemented**:
- ✅ `GET /api/v2/entities` - Read entities
- ✅ `POST /api/v2/entities` - Create entities
- ✅ `PUT /api/v2/entities` - Update entities
- ✅ `DELETE /api/v2/entities/[id]` - Delete entities
- ✅ `GET /api/v2/dynamic-data` - Read dynamic fields
- ✅ `POST /api/v2/dynamic-data/batch` - Batch set dynamic fields

**✅ No API changes needed - these work for ALL entity types!**

---

### **Phase 2: Frontend - Custom Hook**

Create a custom hook following this exact pattern:

#### **File**: `/src/hooks/useHera[EntityName].ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEntities, upsertEntity, deleteEntity, getDynamicData, setDynamicDataBatch } from '@/lib/universal-api-v2-client'

// 1️⃣ Define your entity interface
export interface [EntityName] {
  id: string
  entity_name: string
  entity_code: string
  entity_description?: string
  status: 'active' | 'archived'
  smart_code: string
  metadata?: any
  // Add your dynamic fields here
  [dynamicField]: any
}

// 2️⃣ Define your form values interface
export interface [EntityName]FormValues {
  name: string
  code?: string
  description?: string
  status?: 'active' | 'archived'
  // Add your dynamic fields here
  [dynamicField]: any
}

export function useHera[EntityName]({
  includeArchived = false,
  organizationId
}: {
  includeArchived?: boolean
  organizationId?: string
}) {
  const queryClient = useQueryClient()

  // 3️⃣ Fetch entities with proper status filtering
  const {
    data: entities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['[entity-plural]', organizationId, { includeArchived }],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      const result = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: '[entity_type]', // e.g., 'product'
        p_status: includeArchived ? null : 'active' // ✅ null = all, 'active' = active only
      })

      return Array.isArray(result) ? result : []
    },
    enabled: !!organizationId
  })

  // 4️⃣ Fetch and merge dynamic data
  const [entityPlural] = useQuery({
    queryKey: ['[entity-plural]-with-dynamic', organizationId, entities],
    queryFn: async () => {
      if (!entities || entities.length === 0) return []

      return await Promise.all(
        entities.map(async (entity: any) => {
          try {
            const response = await getDynamicData('', {
              p_organization_id: organizationId!,
              p_entity_id: entity.id
            })

            const dynamicData = Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : []

            // ✅ CRITICAL: Proper field type mapping
            const mergedMetadata = { ...entity.metadata }
            dynamicData.forEach((field: any) => {
              if (field.field_type === 'number') {
                mergedMetadata[field.field_name] = field.field_value_number
              } else if (field.field_type === 'boolean') {
                mergedMetadata[field.field_name] = field.field_value_boolean
              } else if (field.field_type === 'text') {
                mergedMetadata[field.field_name] = field.field_value_text // ✅ NOT field.field_value
              } else if (field.field_type === 'json') {
                mergedMetadata[field.field_name] = field.field_value_json
              } else if (field.field_type === 'date') {
                mergedMetadata[field.field_name] = field.field_value_date
              } else {
                // Fallback for unknown types
                mergedMetadata[field.field_name] =
                  field.field_value_text ||
                  field.field_value_number ||
                  field.field_value_boolean ||
                  field.field_value_json ||
                  field.field_value_date
              }
            })

            return {
              ...entity,
              metadata: mergedMetadata,
              // Extract dynamic fields to top level for easier access
              [dynamicField1]: mergedMetadata.[dynamicField1],
              [dynamicField2]: mergedMetadata.[dynamicField2]
            }
          } catch (error) {
            console.error(`Failed to fetch dynamic data for entity ${entity.id}:`, error)
            return entity
          }
        })
      )
    },
    enabled: !!entities && entities.length > 0 && !!organizationId
  })

  // 5️⃣ Create mutation
  const createEntity = useMutation({
    mutationFn: async (data: [EntityName]FormValues) => {
      if (!organizationId) throw new Error('Organization ID required')

      // Create entity
      const result = await upsertEntity('', {
        p_organization_id: organizationId,
        p_entity_type: '[entity_type]',
        p_entity_name: data.name,
        p_entity_code: data.code || `[CODE_PREFIX]-${Date.now()}`,
        p_smart_code: 'HERA.[MODULE].[ENTITY].STANDARD.V1',
        p_entity_description: data.description || null,
        p_status: 'active' // ✅ Always default to active
      })

      const entityId = result.data?.id || result.data?.entity_id

      if (!entityId) throw new Error('Failed to get entity ID')

      // Save dynamic fields
      const dynamicFields = [
        { field_name: '[field1]', field_type: 'number', field_value_number: data.[field1] },
        { field_name: '[field2]', field_type: 'text', field_value: data.[field2] },
        { field_name: '[field3]', field_type: 'boolean', field_value_boolean: data.[field3] }
      ].filter(f => f.field_value || f.field_value_number !== undefined || f.field_value_boolean !== undefined)

      if (dynamicFields.length > 0) {
        await setDynamicDataBatch('', {
          p_organization_id: organizationId,
          p_entity_id: entityId,
          p_smart_code: 'HERA.[MODULE].[ENTITY].FIELD.V1',
          p_fields: dynamicFields
        })
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[entity-plural]', organizationId] })
    }
  })

  // 6️⃣ Update mutation
  const updateEntity = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!organizationId) throw new Error('Organization ID required')

      const entity = entities?.find(e => e.id === id)
      if (!entity) throw new Error('Entity not found')

      // Update core entity
      await upsertEntity('', {
        p_organization_id: organizationId,
        p_entity_id: id,
        p_entity_type: '[entity_type]',
        p_entity_name: updates.p_entity_name,
        p_entity_code: updates.p_entity_code,
        p_smart_code: updates.p_smart_code,
        p_entity_description: updates.p_entity_description,
        p_status: updates.p_status
      })

      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[entity-plural]', organizationId] })
    }
  })

  // 7️⃣ Delete mutation
  const deleteEntityMutation = useMutation({
    mutationFn: async (entityId: string) => {
      if (!organizationId) throw new Error('Organization ID required')

      return await deleteEntity('', {
        p_organization_id: organizationId,
        p_entity_id: entityId
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[entity-plural]', organizationId] })
    }
  })

  // 8️⃣ Helper functions
  const create[EntityName] = async (data: [EntityName]FormValues) => {
    return await createEntity.mutateAsync(data)
  }

  const update[EntityName] = async (id: string, data: [EntityName]FormValues) => {
    const entity = entities?.find(e => e.id === id)
    if (!entity) throw new Error('Entity not found')

    await updateEntity.mutateAsync({
      id,
      updates: {
        p_entity_type: '[entity_type]',
        p_entity_name: data.name,
        p_entity_code: data.code,
        p_smart_code: entity.smart_code,
        p_entity_description: data.description,
        p_status: data.status || 'active'
      }
    })

    // Update dynamic fields
    const dynamicFields = [
      // Same as create
    ].filter(f => f.field_value || f.field_value_number !== undefined)

    if (dynamicFields.length > 0) {
      await setDynamicDataBatch('', {
        p_organization_id: organizationId!,
        p_entity_id: id,
        p_smart_code: 'HERA.[MODULE].[ENTITY].FIELD.V1',
        p_fields: dynamicFields
      })
    }
  }

  const delete[EntityName] = async (entityId: string) => {
    await deleteEntityMutation.mutateAsync(entityId)
  }

  const archive[EntityName] = async (entityId: string, archive: boolean = true) => {
    const entity = entities?.find(e => e.id === entityId)
    if (!entity) throw new Error('Entity not found')

    await updateEntity.mutateAsync({
      id: entityId,
      updates: {
        p_entity_type: '[entity_type]',
        p_entity_name: entity.entity_name,
        p_entity_code: entity.entity_code,
        p_smart_code: entity.smart_code,
        p_entity_description: entity.entity_description,
        p_status: archive ? 'archived' : 'active' // ✅ Toggle status
      }
    })
  }

  return {
    [entityPlural]: [entityPlural] || [],
    isLoading,
    error,
    refetch,
    create[EntityName],
    update[EntityName],
    delete[EntityName],
    archive[EntityName],
    isCreating: createEntity.isPending,
    isUpdating: updateEntity.isPending,
    isDeleting: deleteEntityMutation.isPending
  }
}
```

---

### **Phase 3: Frontend - Enterprise Modal**

Create an enterprise-grade modal with luxe theme:

#### **File**: `/src/components/[module]/[EntityName]Modal.tsx`

```typescript
'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, X } from 'lucide-react'

// ✅ HERA Luxe Theme Colors
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

// 1️⃣ Define Zod schema
const [EntityName]Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
  // Add your dynamic fields
  [dynamicField]: z.[type]()
})

type [EntityName]FormValues = z.infer<typeof [EntityName]Schema>

interface [EntityName]ModalProps {
  open: boolean
  onClose: () => void
  [entity]?: any | null
  onSave: (data: [EntityName]FormValues) => Promise<void>
}

export function [EntityName]Modal({ open, onClose, [entity], onSave }: [EntityName]ModalProps) {
  const form = useForm<[EntityName]FormValues>({
    resolver: zodResolver([EntityName]Schema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'active',
      // Add dynamic field defaults
    }
  })

  // Reset form when entity changes
  useEffect(() => {
    if ([entity]) {
      form.reset({
        name: [entity].entity_name || '',
        code: [entity].entity_code || '',
        description: [entity].entity_description || '',
        status: [entity].status || 'active',
        // Map dynamic fields
      })
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        status: 'active',
      })
    }
  }, [[entity], form])

  const handleSubmit = async (data: [EntityName]FormValues) => {
    try {
      await onSave(data)
      form.reset()
    } catch (error) {
      console.error('[EntityName] save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0"
        aria-describedby={undefined}
        style={{
          backgroundColor: COLORS.black,
          border: `1px solid ${COLORS.gold}30`,
          boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px ${COLORS.gold}20`,
          borderRadius: '16px'
        }}
      >
        {/* ✅ Luxe Header with Gradient */}
        <div
          className="relative px-8 py-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.black} 100%)`,
            borderBottom: `1px solid ${COLORS.bronze}30`
          }}
        >
          {/* Decorative Gold Accent Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`
            }}
          />

          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Luxe Icon Badge */}
                <div
                  className="relative w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}10 100%)`,
                    border: `2px solid ${COLORS.gold}50`,
                    boxShadow: `0 8px 16px ${COLORS.gold}20`
                  }}
                >
                  <Sparkles className="w-7 h-7" style={{ color: COLORS.gold }} />
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: COLORS.gold }}
                  />
                </div>

                <div className="space-y-1.5">
                  <DialogTitle
                    className="text-2xl font-bold tracking-tight"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {[entity] ? 'Edit [EntityName]' : 'Create New [EntityName]'}
                  </DialogTitle>
                  <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.8 }}>
                    {[entity] ? 'Update [entity] information' : 'Add a new [entity] to your inventory'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 transition-all duration-200 hover:bg-white/10"
                style={{ color: COLORS.lightText }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>
        </div>

        {/* ✅ Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Section: Basic Information */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                  <h3 className="text-lg font-semibold tracking-wide" style={{ color: COLORS.champagne }}>
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium tracking-wide" style={{ color: COLORS.champagne }}>
                          Name <span style={{ color: COLORS.gold }}>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter name"
                            className="h-11 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                            style={{
                              backgroundColor: COLORS.charcoalLight + '80',
                              borderColor: COLORS.bronze + '40',
                              color: COLORS.champagne,
                              '--tw-ring-color': COLORS.gold + '60'
                            } as React.CSSProperties}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Add more fields as needed */}
                </div>
              </div>

              {/* Add more sections as needed */}
            </form>
          </Form>
        </div>

        {/* ✅ Fixed Footer */}
        <div
          className="px-8 py-5 border-t"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: COLORS.bronze + '30'
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.6 }}>
              <span style={{ color: COLORS.gold }}>*</span> Required fields
            </p>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 px-6 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: COLORS.bronze + '50',
                  color: COLORS.lightText
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                onClick={form.handleSubmit(handleSubmit)}
                className="h-11 px-8 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  border: 'none',
                  boxShadow: `0 4px 12px ${COLORS.gold}30`
                }}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {[entity] ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {[entity] ? 'Update [EntityName]' : 'Create [EntityName]'}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### **Phase 4: Frontend - Page Component**

Wire up the hook and modal in your page:

```typescript
'use client'

import { useState } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHera[EntityName] } from '@/hooks/useHera[EntityName]'
import { [EntityName]Modal } from '@/components/[module]/[EntityName]Modal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Archive } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function [EntityName]Page() {
  const { organizationId } = useSecuredSalonContext()
  const { toast } = useToast()

  // State
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing[EntityName], setEditing[EntityName]] = useState<any | null>(null)

  // Hook
  const {
    [entityPlural],
    isLoading,
    create[EntityName],
    update[EntityName],
    delete[EntityName],
    archive[EntityName]
  } = useHera[EntityName]({
    includeArchived,
    organizationId
  })

  // Handlers
  const handleCreate = () => {
    setEditing[EntityName](null)
    setModalOpen(true)
  }

  const handleEdit = ([entity]: any) => {
    setEditing[EntityName]([entity])
    setModalOpen(true)
  }

  const handleSave = async (data: any) => {
    try {
      if (editing[EntityName]) {
        await update[EntityName](editing[EntityName].id, data)
        toast({
          title: '[EntityName] updated',
          description: `${data.name} has been updated successfully`
        })
      } else {
        await create[EntityName](data)
        toast({
          title: '[EntityName] created',
          description: `${data.name} has been created successfully`
        })
      }
      setModalOpen(false)
      setEditing[EntityName](null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async ([entity]: any) => {
    if (!confirm(`Delete ${[entity].entity_name}?`)) return

    try {
      await delete[EntityName]([entity].id)
      toast({
        title: '[EntityName] deleted',
        description: `${[entity].entity_name} has been permanently deleted`
      })
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleArchive = async ([entity]: any) => {
    try {
      await archive[EntityName]([entity].id, [entity].status !== 'archived')
      toast({
        title: [entity].status === 'archived' ? '[EntityName] restored' : '[EntityName] archived',
        description: `${[entity].entity_name} has been ${[entity].status === 'archived' ? 'restored' : 'archived'}`
      })
    } catch (error: any) {
      toast({
        title: 'Failed to archive',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">[EntityName] Management</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create [EntityName]
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={includeArchived ? 'all' : 'active'} onValueChange={v => setIncludeArchived(v === 'all')}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All [EntityName]</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="mt-6">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[entityPlural].map([entity] => (
                <tr key={[entity].id}>
                  <td>{[entity].entity_name}</td>
                  <td>{[entity].entity_code}</td>
                  <td>{[entity].status}</td>
                  <td>
                    <Button size="sm" onClick={() => handleEdit([entity])}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleArchive([entity])}>
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete([entity])}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <[EntityName]Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing[EntityName](null)
        }}
        [entity]={editing[EntityName]}
        onSave={handleSave}
      />
    </div>
  )
}
```

---

## Code Templates

### **Quick Start Template Variables**

Replace these placeholders in the templates above:

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `[EntityName]` | `Product` | Singular, PascalCase |
| `[entityName]` | `product` | Singular, camelCase |
| `[entity-name]` | `product` | Singular, kebab-case |
| `[entity]` | `product` | Variable name for single entity |
| `[entityPlural]` | `products` | Plural, camelCase |
| `[entity-plural]` | `products` | Plural, kebab-case |
| `[entity_type]` | `'product'` | Database entity_type value |
| `[MODULE]` | `SALON` | Smart code module (uppercase) |
| `[ENTITY]` | `PROD` | Smart code entity abbreviation |
| `[CODE_PREFIX]` | `PROD` | Entity code prefix |
| `[dynamicField]` | `price` | Name of dynamic field |

---

## Common Pitfalls

### **❌ Pitfall 1: Wrong Dynamic Field Mapping**

```typescript
// ❌ WRONG
dynamicData.forEach((field: any) => {
  mergedMetadata[field.field_name] = field.field_value // ❌ Does not exist!
})

// ✅ CORRECT
dynamicData.forEach((field: any) => {
  if (field.field_type === 'text') {
    mergedMetadata[field.field_name] = field.field_value_text // ✅ Correct
  } else if (field.field_type === 'number') {
    mergedMetadata[field.field_name] = field.field_value_number
  }
  // ... etc
})
```

### **❌ Pitfall 2: Missing Authentication Headers**

```typescript
// ❌ WRONG
const res = await fetch('/api/v2/entities', {
  headers: {
    'x-hera-org': organizationId
  }
})

// ✅ CORRECT
const authHeaders = await getAuthHeaders() // ✅ Get JWT token
const res = await fetch('/api/v2/entities', {
  headers: {
    'x-hera-org': organizationId,
    ...authHeaders // ✅ Include JWT
  },
  credentials: 'include'
})
```

### **❌ Pitfall 3: Status = null or undefined**

```typescript
// ❌ WRONG
const entityData = {
  entity_type: 'product',
  entity_name: 'Test Product',
  status: null // ❌ Never null!
}

// ✅ CORRECT
const entityData = {
  entity_type: 'product',
  entity_name: 'Test Product',
  status: 'active' // ✅ Always 'active' or 'archived'
}
```

### **❌ Pitfall 4: Wrong Delete Order**

```typescript
// ❌ WRONG - Will fail due to foreign key constraints
await supabase.from('core_entities').delete().eq('id', entityId)
await supabase.from('core_dynamic_data').delete().eq('entity_id', entityId)

// ✅ CORRECT - Delete in cascade order
// 1. Delete relationships first
await supabase.from('core_relationships').delete().eq('from_entity_id', entityId)
await supabase.from('core_relationships').delete().eq('to_entity_id', entityId)
// 2. Delete dynamic data
await supabase.from('core_dynamic_data').delete().eq('entity_id', entityId)
// 3. Delete entity last
await supabase.from('core_entities').delete().eq('id', entityId)
```

### **❌ Pitfall 5: Status Filter Confusion**

```typescript
// ❌ WRONG
const result = await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'product',
  p_status: undefined // ❌ Will default to 'active', not show all
})

// ✅ CORRECT
const result = await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'product',
  p_status: includeArchived ? null : 'active' // ✅ null = all, 'active' = active only
})
```

### **❌ Pitfall 6: Not Using RPC Functions**

```typescript
// ❌ WRONG - Direct query
const { data } = await supabase
  .from('core_entities')
  .select('*')
  .eq('entity_type', 'product')

// ✅ CORRECT - Use RPC function
const { data } = await supabase.rpc('hera_entity_read_v1', {
  p_organization_id: organizationId,
  p_entity_type: 'product'
})
```

---

## Testing Checklist

### **Functional Testing**

- [ ] **Create**: New entity created with status='active'
- [ ] **Create**: Dynamic fields saved correctly
- [ ] **Create**: Entity appears in "Active" tab
- [ ] **Read**: Active entities displayed correctly
- [ ] **Read**: Dynamic fields merged correctly
- [ ] **Read**: "All" tab shows both active and archived
- [ ] **Update**: Entity name updates correctly
- [ ] **Update**: Dynamic fields update correctly
- [ ] **Update**: Changes reflect immediately
- [ ] **Delete**: Confirmation dialog shows
- [ ] **Delete**: Entity permanently removed
- [ ] **Delete**: No orphaned dynamic data or relationships
- [ ] **Archive**: Status changes to 'archived'
- [ ] **Archive**: Entity disappears from "Active" tab
- [ ] **Archive**: Entity appears in "All" tab
- [ ] **Unarchive**: Status changes back to 'active'
- [ ] **Unarchive**: Entity reappears in "Active" tab

### **UI/UX Testing**

- [ ] Modal opens and closes smoothly
- [ ] Form validation shows helpful errors
- [ ] Loading states display correctly
- [ ] Toast notifications appear on success/error
- [ ] Modal resets when closed
- [ ] Edit mode pre-fills form correctly
- [ ] Required fields marked with asterisk
- [ ] Buttons disabled during submission
- [ ] Luxe theme applied consistently
- [ ] Responsive on mobile/tablet/desktop

### **Security Testing**

- [ ] Cannot view other organization's entities
- [ ] Cannot create entity without authentication
- [ ] Cannot update entity without proper permissions
- [ ] Cannot delete entity from another organization
- [ ] JWT token included in all requests
- [ ] Organization ID validated on server

### **Performance Testing**

- [ ] Page loads in < 2 seconds
- [ ] Table handles 100+ entities smoothly
- [ ] Create/Update operations complete in < 1 second
- [ ] No memory leaks on repeated operations
- [ ] Query invalidation works correctly

---

## Troubleshooting Guide

### **Problem: "Organization ID required" error**

**Cause**: `organizationId` not provided or not accessible

**Solution**:
1. Check context provider wraps your page
2. Verify `useSecuredSalonContext()` or equivalent is called
3. Ensure user is authenticated and has org assigned

### **Problem: Dynamic fields not saving**

**Cause**: Wrong field type or missing smart code

**Solution**:
1. Check field type matches value type (text/number/boolean)
2. Ensure smart code is provided
3. Verify `setDynamicDataBatch` is called after entity creation

### **Problem: Dynamic fields not displaying**

**Cause**: Wrong field mapping in hook

**Solution**:
1. Use `field.field_value_text` for text fields (NOT `field.field_value`)
2. Use `field.field_value_number` for number fields
3. Check console for dynamic data fetch errors

### **Problem: Delete fails with foreign key error**

**Cause**: Deleting entity before relationships/dynamic data

**Solution**:
Follow cascade delete order:
1. Delete relationships (from_entity_id and to_entity_id)
2. Delete dynamic data
3. Delete entity

### **Problem: Status filter not working**

**Cause**: Wrong status parameter handling

**Solution**:
- Use `null` to show all statuses
- Use `'active'` to show only active
- Use `'archived'` to show only archived
- Never use `undefined` - it will default to 'active'

### **Problem: 401 Unauthorized error**

**Cause**: Missing JWT token in request

**Solution**:
1. Call `getAuthHeaders()` before fetch
2. Spread auth headers into request: `...authHeaders`
3. Include `credentials: 'include'`

### **Problem: Modal doesn't reset after submission**

**Cause**: Form not reset or editing state not cleared

**Solution**:
```typescript
const handleSave = async (data) => {
  await onSave(data)
  form.reset() // ✅ Reset form
  setEditingEntity(null) // ✅ Clear editing state
  onClose() // ✅ Close modal
}
```

### **Problem: Archived items still showing in "Active" tab**

**Cause**: Status filter not being applied

**Solution**:
Check that hook passes correct status:
```typescript
p_status: includeArchived ? null : 'active'
```

---

## Version History

- **v1.0** (2025-01-10) - Initial guide based on Salon Services implementation

---

## Support

For questions or issues:
1. Review this guide thoroughly
2. Check `/salon/services` implementation as reference
3. Review console logs for detailed error messages
4. Verify all checklist items completed

---

## Next Steps

1. ✅ Review this guide completely
2. ✅ Choose entity to implement
3. ✅ Follow Phase 1-4 step by step
4. ✅ Complete testing checklist
5. ✅ Document any deviations or learnings

**Remember**: This pattern is **universal** - it works for ALL entity types with minimal modifications. Stay consistent and your CRUD implementations will be bulletproof! 🚀
