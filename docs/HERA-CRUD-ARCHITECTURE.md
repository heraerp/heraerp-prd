# HERA CRUD Architecture - MANDATORY PATTERN

## 🚨 CRITICAL RULE: NO DIRECT SUPABASE CALLS

**NEVER use direct Supabase calls in React components or custom hooks. ALWAYS use `useUniversalEntity`.**

---

## ✅ CORRECT Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│ React Components (Client)                           │
│ ├─ useHeraStaff                                     │
│ ├─ useHeraRoles                                     │
│ ├─ useHeraProducts                                  │
│ └─ useHeraServices                                  │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│ useUniversalEntity Hook                             │
│ ├─ Provides: create, update, delete, archive       │
│ ├─ Handles: Dynamic fields, relationships          │
│ └─ Manages: Loading states, errors, refetch        │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│ API Routes (Thin Wrappers)                          │
│ ├─ /api/v2/entities                                 │
│ └─ Calls RPC functions ONLY                         │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│ Database RPC Functions                              │
│ ├─ hera_entity_upsert_v2()                          │
│ ├─ hera_entity_delete_v2()                          │
│ ├─ hera_dynamic_data_batch_v1()                     │
│ └─ Complete business logic, security, audit         │
└─────────────────────────────────────────────────────┘
```

---

## ❌ WRONG - Direct Supabase Calls

```typescript
// ❌ NEVER DO THIS
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(...)

const { data } = await supabase
  .from('core_entities')
  .select('*')
  .eq('organization_id', orgId)

// ❌ NEVER DO THIS
import { getSupabaseService } from '@/lib/supabase-service'
const supabase = getSupabaseService()
await supabase.from('core_entities').insert(...)
```

---

## ✅ CORRECT - Use useUniversalEntity

### Pattern 1: Custom Hook Wrapper

```typescript
// ✅ CORRECT: Custom hook using useUniversalEntity
import { useUniversalEntity } from './useUniversalEntity'

export function useHeraStaff(options?: UseHeraStaffOptions) {
  const {
    entities: staff,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'staff',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100,
      ...(options?.includeArchived ? {} : { status: 'active' })
    },
    dynamicFields: STAFF_PRESET.dynamicFields
  })

  // Add helper functions that use baseCreate, baseUpdate, etc.
  const createStaff = async (data: StaffFormValues) => {
    const dynamic_fields: Record<string, any> = {
      first_name: {
        value: data.first_name,
        type: 'text',
        smart_code: 'HERA.SALON.STAFF.FIELD.FIRST_NAME.V1'
      },
      // ... more fields
    }

    return baseCreate({
      entity_type: 'staff',
      entity_name: `${data.first_name} ${data.last_name}`,
      smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
      status: data.status === 'inactive' ? 'archived' : 'active',
      dynamic_fields
    })
  }

  return {
    staff,
    isLoading,
    error,
    createStaff,
    updateStaff,
    archiveStaff,
    deleteStaff,
    // ... other functions
  }
}
```

### Pattern 2: Direct Usage in Component

```typescript
// ✅ CORRECT: Direct use in component
import { useUniversalEntity } from '@/hooks/useUniversalEntity'

function MyComponent() {
  const { entities, create, update, delete: deleteEntity } = useUniversalEntity({
    entity_type: 'product',
    organizationId: orgId,
    filters: { include_dynamic: true }
  })

  const handleCreate = async () => {
    await create({
      entity_type: 'product',
      entity_name: 'New Product',
      smart_code: 'HERA.PRODUCT.V1',
      dynamic_fields: {
        price: { value: 99.99, type: 'number', smart_code: 'HERA.PRODUCT.PRICE.V1' }
      }
    })
  }

  return <div>{/* UI */}</div>
}
```

---

## 🔍 How to Verify Compliance

### Check for Violations

```bash
# Check if any hooks have direct Supabase calls
grep -r "supabase\|getSupabase" src/hooks/useHera*.ts

# Should return NO results ✅

# Check API routes use RPC (not direct table access)
grep -r "\.from\(" src/app/api/v2/entities/

# Should only see RPC calls like: supabase.rpc('hera_entity_...')
```

### Checklist Before Committing

- [ ] No `import { createClient }` in hooks
- [ ] No `getSupabaseService()` in custom hooks
- [ ] All CRUD uses `useUniversalEntity`
- [ ] API routes call RPC functions only
- [ ] No `.from('core_entities')` in hooks

---

## 📋 Standard CRUD Operations

### Create
```typescript
await create({
  entity_type: 'staff',
  entity_name: 'John Doe',
  smart_code: 'HERA.SALON.STAFF.V1',
  status: 'active',
  dynamic_fields: { /* ... */ }
})
```

### Read
```typescript
// Automatic via useUniversalEntity
const { entities, isLoading } = useUniversalEntity({
  entity_type: 'staff',
  organizationId: orgId,
  filters: { status: 'active' }
})
```

### Update
```typescript
await update({
  entity_id: staffId,
  entity_name: 'Updated Name',
  dynamic_patch: {
    email: 'new@email.com',
    phone: '+1234567890'
  }
})
```

### Archive (Soft Delete)
```typescript
await update({
  entity_id: staffId,
  entity_name: staff.entity_name,
  status: 'archived'
})
```

### Delete (Hard Delete)
```typescript
await deleteEntity(staffId) // Calls hera_entity_delete_v2 RPC
```

---

## 🎯 Benefits of This Architecture

1. **Consistency** - All CRUD follows same pattern
2. **Security** - RPC functions enforce organization isolation
3. **Business Logic** - Centralized in database RPC functions
4. **Type Safety** - Full TypeScript support
5. **Maintainability** - Single source of truth
6. **Performance** - Optimized queries via RPC
7. **Audit Trail** - Automatic logging in RPC functions

---

## ⚠️ Common Mistakes to Avoid

### Mistake 1: Direct Supabase in Hook
```typescript
// ❌ WRONG
export function useHeraStaff() {
  const supabase = getSupabaseService()
  const [staff, setStaff] = useState([])

  useEffect(() => {
    supabase.from('core_entities')
      .select('*')
      .then(({ data }) => setStaff(data))
  }, [])
}
```

### Mistake 2: Skipping useUniversalEntity
```typescript
// ❌ WRONG
export function useHeraStaff() {
  const { data } = useQuery(['staff'], async () => {
    const supabase = getSupabaseService()
    return supabase.from('core_entities').select('*')
  })
}
```

### Mistake 3: Direct API Calls in Components
```typescript
// ❌ WRONG
const handleDelete = async (id: string) => {
  const supabase = getSupabaseService()
  await supabase.from('core_entities').delete().eq('id', id)
}
```

---

## 📖 Reference Examples

### ✅ useHeraStaff
- Location: `/src/hooks/useHeraStaff.ts`
- Pattern: Custom wrapper over useUniversalEntity
- CRUD: All operations use baseCreate, baseUpdate, baseDelete

### ✅ useHeraRoles
- Location: `/src/hooks/useHeraRoles.ts`
- Pattern: Custom wrapper over useUniversalEntity
- CRUD: All operations use baseCreate, baseUpdate, baseDelete

### ✅ useHeraProducts
- Location: `/src/hooks/useHeraProducts.ts`
- Pattern: Custom wrapper over useUniversalEntity
- CRUD: All operations use baseCreate, baseUpdate, baseDelete

---

## 🔒 Security Benefits

### Organization Isolation
- `useUniversalEntity` automatically filters by `organizationId`
- RPC functions enforce `hera_can_access_org()` checks
- No risk of data leakage between organizations

### Audit Trail
- All RPC calls logged automatically
- Complete transaction history preserved
- Smart codes track business context

### Row-Level Security
- Database RLS policies enforce access control
- Service role properly scoped
- Multi-tenant security guaranteed

---

## 🚀 Future Enhancements

When adding new entity types:

1. **Create Preset** in `/src/hooks/entityPresets.ts`
2. **Create Custom Hook** using `useUniversalEntity`
3. **Add Smart Codes** for all fields
4. **NO direct Supabase calls**

Example:
```typescript
// ✅ CORRECT: New entity type
export function useHeraAppointments(options) {
  const { entities, create, update, delete } = useUniversalEntity({
    entity_type: 'appointment',
    organizationId: options.organizationId,
    dynamicFields: APPOINTMENT_PRESET.dynamicFields
  })

  // Add helper functions
  return { appointments: entities, createAppointment, ... }
}
```

---

## ✅ Verified Implementations

The following hooks have been verified to follow the HERA CRUD architecture correctly:

### Salon Module
- **useHeraStaff** (`/src/hooks/useHeraStaff.ts`) ✅
  - Uses `useUniversalEntity` with STAFF_PRESET
  - No direct Supabase calls
  - Proper archive/delete patterns

- **useHeraRoles** (`/src/hooks/useHeraRoles.ts`) ✅
  - Uses `useUniversalEntity` with ROLE_PRESET
  - No direct Supabase calls
  - Proper CRUD patterns

- **useHeraProducts** (`/src/hooks/useHeraProducts.ts`) ✅
  - Uses `useUniversalEntity` with PRODUCT_PRESET
  - No direct Supabase calls
  - Search and filter functionality

- **useHeraProductCategories** (`/src/hooks/useHeraProductCategories.ts`) ✅
  - Uses `useUniversalEntity` with CATEGORY_PRESET
  - No direct Supabase calls
  - Proper archive patterns

### Verification Command
```bash
# Should return ZERO matches for these files:
grep -E "supabase|getSupabase" src/hooks/useHeraStaff.ts
grep -E "supabase|getSupabase" src/hooks/useHeraRoles.ts
grep -E "supabase|getSupabase" src/hooks/useHeraProducts.ts
grep -E "supabase|getSupabase" src/hooks/useHeraProductCategories.ts
```

---

## 📝 Summary

**MANDATORY RULE**: All CRUD operations MUST use `useUniversalEntity` hook. No direct Supabase calls allowed in React components or custom hooks.

**Enforcement**: Check with `grep -r "supabase\|getSupabase" src/hooks/` before every commit.

**Pattern**: Custom Hook → useUniversalEntity → API Route → RPC Function → Database
