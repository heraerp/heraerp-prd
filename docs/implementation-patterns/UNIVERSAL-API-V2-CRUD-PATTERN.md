# Universal API v2 CRUD Pattern - Complete Implementation Guide

**Based on: Salon Products & Categories Implementation**
**Date: 2025-10-01**
**Status: ✅ Production Ready**

## 📋 Overview

This guide demonstrates a complete implementation of dual entity management (Products + Categories) using Universal API v2 with full CRUD operations, dynamic filtering, real-time updates, and luxe theme styling.

**Key Achievement:** Zero database schema changes - all custom fields stored in `core_dynamic_data` table.

---

## 🏗️ Architecture Pattern

### Universal API v2 Data Layer

**Core Functions:**
```typescript
import {
  getEntities,      // Read from core_entities
  getDynamicData,   // Read custom fields from core_dynamic_data
  setDynamicDataBatch, // Save custom fields
  upsertEntity,     // Create/update in core_entities
  deleteEntity      // Delete from core_entities
} from '@/lib/universal-api-v2-client'
```

**Data Storage Pattern:**

```typescript
// 1. Entity stored in core_entities
{
  id: 'uuid',
  organization_id: 'org-uuid',
  entity_type: 'product', // or 'product_category'
  entity_name: 'Premium Shampoo',
  entity_code: 'PROD-001',
  smart_code: 'HERA.SALON.PROD.ENT.RETAIL.V1',
  entity_description: 'Professional hair care product',
  status: 'active' | 'archived' | 'deleted',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

// 2. Custom fields in core_dynamic_data
[
  {
    entity_id: 'uuid',
    field_name: 'category',
    field_type: 'text',
    field_value: 'Hair Care'
  },
  {
    entity_id: 'uuid',
    field_name: 'price',
    field_type: 'number',
    field_value_number: 45.00
  },
  {
    entity_id: 'uuid',
    field_name: 'cost',
    field_type: 'number',
    field_value_number: 25.00
  }
]
```

---

## 🔧 Step-by-Step Implementation

### Step 1: Create Custom Hook

**File:** `/src/hooks/useHeraYourEntity.ts`

```typescript
'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity,
  DynamicFieldInput,
} from '@/lib/universal-api-v2-client'

export function useHeraYourEntity({
  organizationId,
  includeArchived = false,
  searchQuery = '',
  filterValue = ''
}: {
  organizationId?: string
  includeArchived?: boolean
  searchQuery?: string
  filterValue?: string
}) {
  const queryClient = useQueryClient()

  // Fetch entities with dynamic data
  const { data: entities, isLoading, error, refetch } = useQuery({
    queryKey: ['yourEntity', organizationId, { includeArchived }],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      // 1. Fetch entities from core_entities
      const result = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: 'your_entity_type',
        p_status: includeArchived ? undefined : 'active'
      })

      const entities = Array.isArray(result) ? result : []

      // 2. Fetch dynamic data for each entity
      const entitiesWithDynamicData = await Promise.all(
        entities.map(async (entity: any) => {
          try {
            const response = await getDynamicData('', {
              p_organization_id: organizationId,
              p_entity_id: entity.id
            })

            const dynamicData = Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : []

            // 3. Merge dynamic data into entity metadata
            const mergedMetadata = { ...entity.metadata }
            dynamicData.forEach((field: any) => {
              if (field.field_type === 'number') {
                mergedMetadata[field.field_name] = field.field_value_number
              } else if (field.field_type === 'boolean') {
                mergedMetadata[field.field_name] = field.field_value_boolean
              } else {
                mergedMetadata[field.field_name] = field.field_value
              }
            })

            return {
              ...entity,
              metadata: mergedMetadata,
              // Extract common fields to top level for easy access
              category: mergedMetadata.category,
              price: mergedMetadata.price,
              cost: mergedMetadata.cost
            }
          } catch (error) {
            console.error('Failed to fetch dynamic data:', error)
            return entity
          }
        })
      )

      return entitiesWithDynamicData
    },
    enabled: !!organizationId
  })

  // Create mutation
  const createEntity = useMutation({
    mutationFn: async (data: any) => {
      if (!organizationId) throw new Error('Organization ID required')
      return await upsertEntity('', {
        p_organization_id: organizationId,
        ...data
      })
    }
  })

  // Update mutation
  const updateEntity = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!organizationId) throw new Error('Organization ID required')
      return await upsertEntity('', {
        p_organization_id: organizationId,
        p_entity_id: id,
        ...updates
      })
    },
    onSuccess: () => {
      // Invalidate all queries for this entity type
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'yourEntity' &&
          query.queryKey[1] === organizationId
      })
    }
  })

  // Create operation
  const createYourEntity = async (entityData: any) => {
    if (!organizationId) throw new Error('Organization ID required')

    // 1. Create entity in core_entities
    await createEntity.mutateAsync({
      p_entity_type: 'your_entity_type',
      p_entity_name: entityData.name,
      p_entity_code: entityData.code || '',
      p_smart_code: 'HERA.YOUR.ENTITY.SMART.CODE.V1',
      p_entity_description: entityData.description || null,
      p_status: 'active'
    })

    // 2. Get the newly created entity
    const allEntities = await getEntities('', {
      p_organization_id: organizationId,
      p_entity_type: 'your_entity_type'
    })
    const newEntity = Array.isArray(allEntities)
      ? allEntities.find(e => e.entity_name === entityData.name)
      : null

    if (!newEntity) throw new Error('Failed to create entity')

    // 3. Save dynamic fields
    const dynamicFields = [
      { field_name: 'category', field_type: 'text', field_value: entityData.category },
      { field_name: 'price', field_type: 'number', field_value_number: entityData.price },
      { field_name: 'cost', field_type: 'number', field_value_number: entityData.cost }
    ].filter(f => f.field_value !== undefined || f.field_value_number !== undefined)

    if (dynamicFields.length > 0) {
      await setDynamicDataBatch('', {
        p_organization_id: organizationId,
        p_entity_id: newEntity.id,
        p_smart_code: 'HERA.YOUR.ENTITY.FIELD.DATA.V1',
        p_fields: dynamicFields as any
      })
    }

    // 4. Invalidate queries to refresh UI
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'yourEntity' &&
        query.queryKey[1] === organizationId
    })
  }

  // Update operation
  const updateYourEntity = async (entityId: string, entityData: any) => {
    if (!organizationId) throw new Error('Organization ID required')

    // 1. Update entity in core_entities
    await updateEntity.mutateAsync({
      id: entityId,
      updates: {
        p_entity_type: 'your_entity_type',
        p_entity_name: entityData.name,
        p_entity_code: entityData.code,
        p_smart_code: 'HERA.YOUR.ENTITY.SMART.CODE.V1',
        p_entity_description: entityData.description || null,
        p_status: entityData.status || 'active'
      }
    })

    // 2. Update dynamic fields
    const dynamicFields = [
      { field_name: 'category', field_type: 'text', field_value: entityData.category },
      { field_name: 'price', field_type: 'number', field_value_number: entityData.price },
      { field_name: 'cost', field_type: 'number', field_value_number: entityData.cost }
    ].filter(f =>
      (f.field_value !== undefined && f.field_value !== null && f.field_value !== '') ||
      (f.field_value_number !== undefined && f.field_value_number !== null)
    )

    if (dynamicFields.length > 0) {
      await setDynamicDataBatch('', {
        p_organization_id: organizationId,
        p_entity_id: entityId,
        p_smart_code: 'HERA.YOUR.ENTITY.FIELD.DATA.V1',
        p_fields: dynamicFields as any
      })

      // 3. CRITICAL: Invalidate cache after dynamic data update
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'yourEntity' &&
          query.queryKey[1] === organizationId
      })
    }
  }

  // Delete operation (soft delete)
  const deleteYourEntity = async (entityId: string) => {
    if (!organizationId) throw new Error('Organization ID required')

    await updateEntity.mutateAsync({
      id: entityId,
      updates: {
        p_status: 'deleted'
      }
    })
  }

  // Archive operation
  const archiveYourEntity = async (entityId: string, archive: boolean = true) => {
    const entity = entities?.find(e => e.id === entityId)
    if (!entity) return

    await updateEntity.mutateAsync({
      id: entityId,
      updates: {
        p_entity_type: 'your_entity_type',
        p_entity_name: entity.entity_name,
        p_entity_code: entity.entity_code,
        p_smart_code: entity.smart_code,
        p_entity_description: entity.entity_description || null,
        p_status: archive ? 'archived' : 'active'
      }
    })
  }

  // Processed entities with filters
  const processedEntities = useMemo(() => {
    if (!entities) return []

    return entities
      .filter(entity => {
        // Status filter
        if (!includeArchived && entity.status === 'archived') return false

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            entity.entity_name?.toLowerCase().includes(query) ||
            entity.entity_code?.toLowerCase().includes(query)
          )
        }

        // Custom filter
        if (filterValue && entity.category !== filterValue) return false

        return true
      })
  }, [entities, includeArchived, searchQuery, filterValue])

  return {
    entities: processedEntities,
    isLoading,
    error,
    refetch,
    createYourEntity,
    updateYourEntity,
    deleteYourEntity,
    archiveYourEntity,
    isCreating: createEntity.isPending,
    isUpdating: updateEntity.isPending
  }
}
```

---

### Step 2: Create Page Component

**File:** `/src/app/salon/your-page/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSalonContext } from '@/app/salon/SalonProvider'
import { useHeraYourEntity } from '@/hooks/useHeraYourEntity'
import { YourEntityModal } from '@/components/salon/your-entity/YourEntityModal'
import { YourEntityList } from '@/components/salon/your-entity/YourEntityList'
import { PageHeader, PageHeaderButton } from '@/components/ui/page-header'
import { Plus, Filter } from 'lucide-react'

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

export default function YourPage() {
  const { organizationId, currency } = useSalonContext()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<any>(null)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const {
    entities,
    isLoading,
    createYourEntity,
    updateYourEntity,
    deleteYourEntity,
    archiveYourEntity
  } = useHeraYourEntity({
    organizationId,
    includeArchived,
    searchQuery,
    filterValue: categoryFilter
  })

  const handleSave = async (data: any) => {
    if (editingEntity) {
      await updateYourEntity(editingEntity.id, data)
    } else {
      await createYourEntity(data)
    }
    setModalOpen(false)
    setEditingEntity(null)
  }

  const handleEdit = (entity: any) => {
    setEditingEntity(entity)
    setModalOpen(true)
  }

  const handleDelete = async (entity: any) => {
    if (confirm(`Are you sure you want to delete ${entity.entity_name}?`)) {
      await deleteYourEntity(entity.id)
    }
  }

  const handleArchive = async (entity: any) => {
    await archiveYourEntity(entity.id, true)
  }

  const handleRestore = async (entity: any) => {
    await archiveYourEntity(entity.id, false)
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-full flex flex-col">
        <div
          className="relative flex-1 overflow-auto"
          style={{
            backgroundColor: COLORS.charcoal,
            minHeight: '100vh'
          }}
        >
          <PageHeader
            title="Your Entity"
            breadcrumbs={[
              { label: 'HERA' },
              { label: 'SALON OS' },
              { label: 'Your Entity', isActive: true }
            ]}
            actions={
              <>
                <PageHeaderButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingEntity(null)
                    setModalOpen(true)
                  }}
                >
                  New Entity
                </PageHeaderButton>
              </>
            }
          />

          {/* Stats, Filters, List */}
          <div className="mx-6 mt-6 mb-6">
            <YourEntityList
              entities={entities}
              loading={isLoading}
              currency={currency}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      <YourEntityModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingEntity(null)
        }}
        entity={editingEntity}
        onSave={handleSave}
      />
    </div>
  )
}
```

---

### Step 3: Create Modal Component

**File:** `/src/components/salon/your-entity/YourEntityModal.tsx`

```typescript
'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSalonContext } from '@/app/salon/SalonProvider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Package, X } from 'lucide-react'

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

// Form validation schema
const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived'])
})

type FormValues = z.infer<typeof FormSchema>

interface YourEntityModalProps {
  open: boolean
  onClose: () => void
  entity?: any | null
  onSave: (data: FormValues) => Promise<void>
}

export function YourEntityModal({
  open,
  onClose,
  entity,
  onSave
}: YourEntityModalProps) {
  const { currency } = useSalonContext()

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      code: '',
      category: '',
      price: undefined,
      cost: undefined,
      description: '',
      status: 'active'
    }
  })

  // Reset form when entity changes
  useEffect(() => {
    if (entity) {
      form.reset({
        name: entity.entity_name || '',
        code: entity.entity_code || '',
        category: entity.category || '',
        price: entity.price || undefined,
        cost: entity.cost || undefined,
        description: entity.entity_description || '',
        status: entity.status || 'active'
      })
    } else {
      form.reset({
        name: '',
        code: '',
        category: '',
        price: undefined,
        cost: undefined,
        description: '',
        status: 'active'
      })
    }
  }, [entity, form])

  const handleSubmit = async (data: FormValues) => {
    try {
      await onSave(data)
      form.reset()
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.bronze}40`,
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
        }}
      >
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: COLORS.gold + '20',
                  border: `1px solid ${COLORS.gold}40`
                }}
              >
                <Package className="w-5 h-5" style={{ color: COLORS.gold }} />
              </div>
              <DialogTitle
                className="text-xl font-semibold"
                style={{ color: COLORS.champagne }}
              >
                {entity ? 'Edit Entity' : 'Create Entity'}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: COLORS.lightText }}>
                    Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter name"
                      className="bg-background/50 border-border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Field with Dynamic Currency */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: COLORS.lightText }}>
                    Price
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                        style={{ color: COLORS.lightText, opacity: 0.6 }}
                      >
                        {currency || 'AED'}
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-background/50 border-border pl-16"
                        onChange={e => {
                          const value = e.target.value
                          field.onChange(value === '' ? undefined : parseFloat(value))
                        }}
                        value={field.value || ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black
                }}
              >
                {form.formState.isSubmitting
                  ? entity ? 'Updating...' : 'Creating...'
                  : entity ? 'Update Entity' : 'Create Entity'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🎨 Salon Luxe Theme Colors

```typescript
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
```

---

## 🔑 Critical Best Practices

### 1. Always Invalidate Cache After Dynamic Data Updates

```typescript
// ❌ WRONG: UI won't update immediately
await setDynamicDataBatch(...)
// Missing cache invalidation

// ✅ CORRECT: UI updates in real-time
await setDynamicDataBatch(...)
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'yourEntity' &&
    query.queryKey[1] === organizationId
})
```

### 2. Filter Out Empty Values Before Saving

```typescript
const dynamicFields = fields
  .filter(f =>
    f.value !== undefined &&
    f.value !== null &&
    f.value !== ''
  )
  .map(f => ({
    field_name: f.name,
    field_type: f.type,
    field_value: f.value
  }))
```

### 3. Always Use Organization Context

```typescript
const { organizationId, currency } = useSalonContext()

// Pass to all API calls for multi-tenant isolation
await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'product'
})
```

### 4. Handle Dynamic Data Type Conversions

```typescript
dynamicData.forEach((field: any) => {
  if (field.field_type === 'number') {
    mergedMetadata[field.field_name] = field.field_value_number
  } else if (field.field_type === 'boolean') {
    mergedMetadata[field.field_name] = field.field_value_boolean
  } else {
    mergedMetadata[field.field_name] = field.field_value
  }
})
```

---

## 📦 Implementation Checklist

### Backend (Hook)
- [ ] Create custom hook file
- [ ] Implement useQuery for fetching entities
- [ ] Fetch dynamic data for each entity
- [ ] Merge dynamic data into entity metadata
- [ ] Create mutations (create, update, delete)
- [ ] Add cache invalidation after ALL updates
- [ ] Implement filtering and search logic
- [ ] Add proper TypeScript types

### Frontend (Page)
- [ ] Create page component
- [ ] Import useSalonContext for org data
- [ ] Import custom hook
- [ ] Set up state for modals and filters
- [ ] Implement CRUD handlers
- [ ] Apply Salon luxe theme colors
- [ ] Add PageHeader with actions
- [ ] Add stats cards
- [ ] Add filtering UI

### Modal Component
- [ ] Create modal component file
- [ ] Set up React Hook Form with Zod
- [ ] Add form fields with proper validation
- [ ] Implement dynamic currency display
- [ ] Add real-time validation warnings
- [ ] Apply Salon luxe styling
- [ ] Handle form reset on open/close

### Testing
- [ ] Test create operation
- [ ] Test update operation
- [ ] Test delete operation
- [ ] Test archive/restore operations
- [ ] Verify cache invalidation works
- [ ] Test with multiple organizations
- [ ] Test filtering and search
- [ ] Verify dynamic currency works

---

## 🚀 Real-World Examples

### Salon Products Implementation
- **File:** `/src/hooks/useHeraProducts.ts`
- **Entity Type:** `product`
- **Smart Code:** `HERA.SALON.PROD.ENT.RETAIL.V1`
- **Dynamic Fields:** price, cost, category, qty_on_hand, brand, barcode, sku

### Salon Categories Implementation
- **File:** `/src/hooks/useHeraProductCategories.ts`
- **Entity Type:** `product_category`
- **Smart Code:** `HERA.SALON.PROD.CAT.V1`
- **Dynamic Fields:** color, description, product_count

---

## 💡 Key Takeaways

1. **Zero Schema Changes:** All custom fields go to `core_dynamic_data`
2. **Cache Invalidation:** Must invalidate after dynamic data updates
3. **Organization Context:** Always pass `organization_id` for multi-tenancy
4. **Type Safety:** Use proper TypeScript types throughout
5. **Real-time Updates:** React Query handles automatic refetching
6. **Luxe Theme:** Consistent gold/champagne/bronze color scheme
7. **Dynamic Currency:** Pull from organization settings, never hardcode

---

## 📚 Related Documentation

- Universal API v2 Client: `/src/lib/universal-api-v2-client.ts`
- Salon Context Provider: `/src/app/salon/SalonProvider.tsx`
- Page Header Component: `/src/components/ui/page-header.tsx`
- Form Components: `/src/components/ui/form.tsx`

---

**Status:** ✅ Production Ready
**Last Updated:** 2025-10-01
**Maintainer:** HERA Development Team
