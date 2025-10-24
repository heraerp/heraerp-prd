# Universal Entity V1 - Quick Reference

**Fast lookup guide for common patterns**

---

## 🚀 Quick Setup (3 Steps)

### 1. Create Preset

```typescript
// /src/hooks/entityPresets.ts
export const YOUR_ENTITY_PRESET: EntityPreset = {
  entity_type: 'YOUR_ENTITY',
  smart_code: 'HERA.INDUSTRY.MODULE.ENTITY.TYPE.v1',

  dynamicFields: [
    {
      name: 'field_name',
      type: 'text' | 'number' | 'date' | 'boolean' | 'json',
      smart_code: 'HERA.INDUSTRY.MODULE.DYN.FIELD_NAME.v1',
      label: 'Field Label',
      required: true | false
    }
  ],

  relationships: [
    {
      name: 'ENTITY_RELATION_TYPE',
      smart_code: 'HERA.INDUSTRY.MODULE.REL.RELATION_TYPE.v1',
      to_entity_type: 'TARGET_ENTITY',
      cardinality: 'one' | 'many'
    }
  ]
}
```

### 2. Create Hook

```typescript
// /src/hooks/useHeraYourEntity.ts
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { YOUR_ENTITY_PRESET } from './entityPresets'
import { normalizeEntities } from '@/lib/normalize-entity'

export function useHeraYourEntity(options) {
  const {
    entities: rawEntities,
    create: baseCreate,
    update: baseUpdate,
    // ... other operations
  } = useUniversalEntityV1({
    entity_type: 'YOUR_ENTITY',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      ...(options?.includeArchived ? {} : { status: 'active' })
    },
    dynamicFields: YOUR_ENTITY_PRESET.dynamicFields,
    relationships: YOUR_ENTITY_PRESET.relationships
  })

  const entities = useMemo(
    () => rawEntities ? normalizeEntities(rawEntities) : rawEntities,
    [rawEntities]
  )

  return { entities, /* ... */ }
}
```

### 3. Use in Page

```typescript
const { entities, createEntity, updateEntity } = useHeraYourEntity({
  organizationId,
  includeArchived: false
})
```

---

## 📝 CRUD Operations

### Create

```typescript
const createEntity = async (data) => {
  // Build dynamic fields
  const dynamic_fields: Record<string, any> = {}
  for (const def of YOUR_ENTITY_PRESET.dynamicFields) {
    const key = def.name as keyof typeof data
    if (key in data && (data as any)[key] !== undefined) {
      dynamic_fields[def.name] = {
        value: (data as any)[key],
        type: def.type,
        smart_code: def.smart_code
      }
    }
  }

  // Build relationships
  const relationships: Record<string, string[]> = {}
  if (data.related_entity_ids?.length > 0) {
    relationships.ENTITY_RELATION_TYPE = data.related_entity_ids
  }

  return baseCreate({
    entity_type: 'YOUR_ENTITY',
    entity_name: data.name,
    smart_code: 'HERA.INDUSTRY.MODULE.ENTITY.TYPE.v1',
    status: 'active',
    ai_confidence: 1.0,  // ⚠️ Required to bypass normalization
    dynamic_fields,
    relationships
  })
}
```

### Update

```typescript
const updateEntity = async (id, data) => {
  // Partial dynamic patch
  const dynamic_patch: Record<string, any> = {}
  for (const def of YOUR_ENTITY_PRESET.dynamicFields) {
    const key = def.name as keyof typeof data
    if (key in data) {
      dynamic_patch[def.name] = (data as any)[key]
    }
  }

  // Partial relationships patch
  const relationships_patch: Record<string, string[]> = {}
  if (data.related_entity_ids !== undefined) {
    relationships_patch.ENTITY_RELATION_TYPE = data.related_entity_ids
  }

  return baseUpdate({
    entity_id: id,
    ...(data.name && { entity_name: data.name }),
    ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
    ...(Object.keys(relationships_patch).length ? { relationships_patch } : {}),
    ...(data.status !== undefined && { status: data.status })
  })
}
```

### Delete (Smart Pattern)

```typescript
const deleteEntity = async (id) => {
  try {
    await baseDelete({
      entity_id: id,
      hard_delete: true,
      cascade: true,
      reason: 'Permanent deletion',
      smart_code: 'HERA.INDUSTRY.MODULE.DELETE.v1'
    })
    return { success: true, archived: false }
  } catch (error: any) {
    // Check for foreign key constraint (409 conflict)
    if (error.message?.includes('409') || error.message?.includes('referenced')) {
      // Fallback to archive
      await baseUpdate({ entity_id: id, status: 'archived' })
      return {
        success: true,
        archived: true,
        message: 'Entity referenced by other records. Archived instead.'
      }
    }
    throw error
  }
}
```

### Archive

```typescript
const archiveEntity = async (id) => {
  return baseArchive(id)  // Sets status='archived'
}
```

### Restore

```typescript
const restoreEntity = async (id) => {
  return baseRestore(id)  // Sets status='active'
}
```

---

## 🔗 Relationships

### Access Relationships

```typescript
import { getRelationship, extractRelationshipIds } from '@/lib/normalize-entity'

// Get relationship (normalized to UPPERCASE)
const rels = getRelationship(entity, 'ENTITY_RELATION_TYPE')

// Extract IDs
const relatedIds = extractRelationshipIds(rels, 'to_entity_id')
```

### Create Relationships

```typescript
const relationships: Record<string, string[]> = {}

// One-to-many
if (data.branch_ids?.length > 0) {
  relationships.ENTITY_MEMBER_OF = data.branch_ids
}

// One-to-one (still an array!)
if (data.parent_id) {
  relationships.ENTITY_HAS_PARENT = [data.parent_id]
}
```

### Update Relationships

```typescript
const relationships_patch: Record<string, string[]> = {}

// Replace all relationships
if (data.branch_ids !== undefined) {
  relationships_patch.ENTITY_MEMBER_OF = data.branch_ids
}

// Remove all relationships
relationships_patch.ENTITY_HAS_PARENT = []
```

---

## ⚡ React Query Optimistic Updates

### Archive (Optimistic - Recommended)

```typescript
const handleArchive = async (entityId) => {
  await archiveEntity(entityId)

  // Optimistic update - instant UI
  queryClient.setQueryData(
    ['universal-entities', 'YOUR_ENTITY', organizationId],
    (old: any) => old?.map(e =>
      e.id === entityId ? { ...e, status: 'archived' } : e
    )
  )
  // ✅ No refetch needed!
}
```

### Delete (Optimistic with Fallback)

```typescript
const handleDelete = async (entityId) => {
  const result = await deleteEntity(entityId)

  queryClient.setQueryData(
    ['universal-entities', 'YOUR_ENTITY', organizationId],
    (old: any) => {
      if (result.archived) {
        // Archived - update status
        return old?.map(e => e.id === entityId ? { ...e, status: 'archived' } : e)
      } else {
        // Deleted - remove
        return old?.filter(e => e.id !== entityId)
      }
    }
  )
}
```

### Update (Optimistic)

```typescript
const handleUpdate = async (entityId, data) => {
  await updateEntity(entityId, data)

  // Optimistic update - merge changes
  queryClient.setQueryData(
    ['universal-entities', 'YOUR_ENTITY', organizationId],
    (old: any) => old?.map(e =>
      e.id === entityId ? { ...e, ...data } : e
    )
  )
}
```

### Restore (Refetch Justified)

```typescript
const handleRestore = async (entityId) => {
  await restoreEntity(entityId)
  await refetch()  // Need to fetch restored data
}
```

---

## 🎯 Field Types

| Type | Storage | Example Value | Use Case |
|------|---------|---------------|----------|
| `text` | `field_value_text` | `"John Doe"` | Names, descriptions |
| `number` | `field_value_number` | `99.99` | Prices, quantities |
| `date` | `field_value_text` | `"2024-01-15"` | Dates (ISO format) |
| `boolean` | `field_value_text` | `"true"` | Flags, toggles |
| `json` | `field_value_json` | `{"key":"value"}` | Complex objects |

---

## 📋 Complete Page Pattern

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraYourEntity } from '@/hooks/useHeraYourEntity'

export default function YourEntityPage() {
  const { organizationId } = useSecuredSalonContext()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active')

  // Always fetch all entities
  const {
    entities: allEntities,
    isLoading,
    createEntity,
    updateEntity,
    deleteEntity,
    archiveEntity,
    restoreEntity
  } = useHeraYourEntity({
    organizationId,
    includeArchived: true  // Always fetch all
  })

  // Filter in UI based on view mode
  const entities = useMemo(() => {
    if (!allEntities) return []
    if (viewMode === 'all') return allEntities
    return allEntities.filter(e => e.status === 'active')
  }, [allEntities, viewMode])

  // Stats from ALL entities (stable)
  const stats = {
    total: allEntities?.length || 0,
    active: allEntities?.filter(e => e.status === 'active').length || 0,
    archived: allEntities?.filter(e => e.status === 'archived').length || 0
  }

  // CRUD handlers with optimistic updates
  const handleCreate = async (data) => {
    await createEntity(data)
    // Refetch needed for new entity
    await refetch()
  }

  const handleUpdate = async (id, data) => {
    await updateEntity(id, data)
    // Optimistic update
    queryClient.setQueryData(
      ['universal-entities', 'YOUR_ENTITY', organizationId],
      (old: any) => old?.map(e => e.id === id ? { ...e, ...data } : e)
    )
  }

  const handleArchive = async (id) => {
    await archiveEntity(id)
    // Optimistic update
    queryClient.setQueryData(
      ['universal-entities', 'YOUR_ENTITY', organizationId],
      (old: any) => old?.map(e => e.id === id ? { ...e, status: 'archived' } : e)
    )
  }

  const handleDelete = async (id) => {
    const result = await deleteEntity(id)
    // Optimistic update based on result
    queryClient.setQueryData(
      ['universal-entities', 'YOUR_ENTITY', organizationId],
      (old: any) => {
        if (result.archived) {
          return old?.map(e => e.id === id ? { ...e, status: 'archived' } : e)
        } else {
          return old?.filter(e => e.id !== id)
        }
      }
    )
  }

  return (
    <div>
      {/* KPIs - stable stats from allEntities */}
      <div>
        <div>Total: {stats.total}</div>
        <div>Active: {stats.active}</div>
        <div>Archived: {stats.archived}</div>
      </div>

      {/* View toggle */}
      <button onClick={() => setViewMode('active')}>Active</button>
      <button onClick={() => setViewMode('all')}>All</button>

      {/* Entity list - filtered by viewMode */}
      {entities.map(entity => (
        <div key={entity.id}>
          {entity.entity_name}
          <button onClick={() => handleUpdate(entity.id, { /* data */ })}>Edit</button>
          <button onClick={() => handleArchive(entity.id)}>Archive</button>
          <button onClick={() => handleDelete(entity.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

---

## 🎨 Auto-Assignment Pattern

```typescript
// When no relationships selected, assign all
const onSubmit = async (data) => {
  let assignedIds = data.branch_ids

  if (!assignedIds || assignedIds.length === 0) {
    // Auto-assign all available
    assignedIds = branches.map(b => b.id)
    console.log('Auto-assigning to all branches:', assignedIds.length)
  }

  await createEntity({ ...data, branch_ids: assignedIds })
}
```

**UI Message:**
```typescript
{!watch('branch_ids')?.length ? (
  <div>
    <strong>Auto-Assignment Active</strong>
    <p>Will be assigned to all {branches.length} branches when saved.</p>
  </div>
) : (
  <p>Assigned to: {watch('branch_ids').length} branches</p>
)}
```

---

## ✅ Checklist for New Pages

- [ ] Create entity preset in `/src/hooks/entityPresets.ts`
- [ ] Define all dynamic fields with smart codes
- [ ] Define all relationships with cardinality
- [ ] Create entity hook in `/src/hooks/useHeraYourEntity.ts`
- [ ] Use `useUniversalEntityV1` with preset
- [ ] Normalize entities with `normalizeEntities()`
- [ ] Always fetch all entities (`includeArchived: true`)
- [ ] Filter in UI with `useMemo` based on view mode
- [ ] Calculate stats from `allEntities` (stable)
- [ ] Use optimistic updates for instant UI
- [ ] Handle auto-assignment for relationships
- [ ] Implement smart delete with fallback
- [ ] Test all CRUD operations
- [ ] Verify relationships work correctly
- [ ] Check optimistic updates are instant

---

## 🚨 Common Mistakes to Avoid

❌ **CRITICAL: Using 'status' as dynamic field name**
```typescript
// ❌ WRONG - Overwrites entity status, breaks filtering!
dynamicFields: [{ name: 'status', ... }]  // FORBIDDEN

// ✅ CORRECT - Use entity-level status or rename
status: 'active' | 'inactive' | 'on_leave' | 'archived'  // Entity level
// OR
dynamicFields: [{ name: 'employee_status', ... }]  // Renamed
```

❌ **Using lowercase relationship keys**
```typescript
relationships.staff_member_of = ids  // WRONG
relationships.STAFF_MEMBER_OF = ids  // CORRECT
```

❌ **Not normalizing entities**
```typescript
const entities = rawEntities  // WRONG
const entities = normalizeEntities(rawEntities)  // CORRECT
```

❌ **Forgetting ai_confidence**
```typescript
await baseCreate({ entity_type: 'STAFF', ... })  // WRONG - triggers normalization
await baseCreate({ entity_type: 'STAFF', ai_confidence: 1.0, ... })  // CORRECT
```

❌ **Query-level filtering (unstable KPIs)**
```typescript
includeArchived: viewMode === 'all'  // WRONG - refetches on toggle
includeArchived: true  // CORRECT - always fetch all, filter in UI
```

❌ **Unnecessary refetches**
```typescript
await archiveEntity(id)
await refetch()  // WRONG - extra API call

await archiveEntity(id)
queryClient.setQueryData(/* optimistic update */)  // CORRECT - instant UI
```

❌ **Missing entity_name**
```typescript
await baseCreate({ entity_type: 'STAFF', dynamic_fields })  // WRONG - fails
await baseCreate({ entity_type: 'STAFF', entity_name: 'John', dynamic_fields })  // CORRECT
```

❌ **Wrong smart code format**
```typescript
'HERA.SALON.STAFF.ENTITY.PERSON.V1'  // WRONG - uppercase V
'HERA.SALON.STAFF.ENTITY.PERSON.v1'  // CORRECT - lowercase v
```

---

## 📖 Full Documentation

See complete guide: `/docs/api/v2/UNIVERSAL-ENTITY-V1-USAGE-GUIDE.md`

**Production reference:** `/src/app/salon/staffs/page.tsx`

---

**Status:** ✅ Production-Ready | Based on HERA Staff Management System v2.2

**Last Updated:** October 23, 2025
