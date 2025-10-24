# useUniversalEntity V2 Migration Plan

## 🎯 Executive Summary

**Current State**: `useUniversalEntity` makes 3-5 separate API calls per operation
**Target State**: Single `hera_entities_crud_v2` RPC call handles everything atomically
**Performance Gain**: 3-5x faster, atomic transactions, zero consistency issues

---

## 📊 Current Architecture Analysis

### Current Flow (useUniversalEntity v1)
```typescript
// CREATE Operation - 4 separate calls
1. POST /api/v2/entities          → Create entity (100ms)
2. POST /api/v2/dynamic-data/batch → Add dynamic fields (80ms)
3. POST /api/v2/relationships      → Create relationship 1 (60ms)
4. POST /api/v2/relationships      → Create relationship 2 (60ms)
───────────────────────────────────────────────────────
Total: 4 HTTP calls, 300ms+, HIGH consistency risk ⚠️
```

### Problems with Current Approach
1. **No Atomicity**: If step 3 fails, entity + dynamic fields are created but relationships missing
2. **Performance**: 3-5 sequential network round-trips
3. **Error Handling**: Complex rollback logic needed
4. **Race Conditions**: Other operations can see partial state
5. **Network Overhead**: Multiple auth headers, multiple requests

---

## 🚀 Target Architecture (useUniversalEntity v2)

### New Flow with hera_entities_crud_v2
```typescript
// CREATE Operation - 1 atomic call
1. RPC hera_entities_crud_v2 → Everything in one transaction (80ms)
───────────────────────────────────────────────────────
Total: 1 RPC call, 80ms, ZERO consistency risk ✅
```

### Benefits
1. ✅ **Atomic Operations**: All-or-nothing guarantee
2. ✅ **3-5x Faster**: Single database round-trip
3. ✅ **Simplified Error Handling**: One error to handle
4. ✅ **No Race Conditions**: Consistent view of data
5. ✅ **Less Network Overhead**: Single request

---

## 🏗️ Enterprise Migration Strategy

### Option 1: **Feature Flag Approach** (RECOMMENDED)
Create a new version alongside the old one, controlled by feature flag.

**Pros**:
- Zero risk - old code keeps working
- Gradual rollout per entity type
- Easy rollback if issues found
- A/B testing capability

**Cons**:
- Temporary code duplication
- Need to maintain both versions during migration

### Option 2: **Breaking Change Approach**
Replace useUniversalEntity entirely with v2.

**Pros**:
- Clean codebase
- Forces migration
- No dual maintenance

**Cons**:
- High risk - all entity operations affected
- Requires testing every component
- Harder to rollback

---

## 📋 Recommended Implementation: Feature Flag Approach

### Step 1: Create `useUniversalEntityV2` Hook

```typescript
// src/hooks/useUniversalEntityV2.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { supabase } from '@/lib/supabase/client'

export interface UseUniversalEntityV2Config {
  entity_type: string
  organizationId?: string
  filters?: {
    status?: string
    limit?: number
    offset?: number
  }
  dynamicFields?: DynamicFieldDef[]
  relationships?: RelationshipDef[]
}

export function useUniversalEntityV2(config: UseUniversalEntityV2Config) {
  const { organization, user } = useHERAAuth()
  const queryClient = useQueryClient()
  const organizationId = config.organizationId || organization?.id
  const actorUserId = user?.id

  // Query entities using RPC
  const {
    data: entities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['entities-v2', config.entity_type, organizationId, config.filters],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: config.entity_type.toUpperCase()
        },
        p_options: {
          include_dynamic: true,
          include_relationships: true,
          limit: config.filters?.limit || 100,
          offset: config.filters?.offset || 0,
          status_filter: config.filters?.status
        }
      })

      if (error) throw error
      return data?.data || []
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })

  // Create mutation - ONE atomic call
  const createMutation = useMutation({
    mutationFn: async (entity: UniversalEntity & Record<string, any>) => {
      if (!organizationId || !actorUserId) {
        throw new Error('Organization ID and User ID required')
      }

      // Transform dynamic fields from hook format to RPC format
      const p_dynamic: Record<string, any> = {}
      if (entity.dynamic_fields) {
        Object.entries(entity.dynamic_fields).forEach(([key, value]: any) => {
          p_dynamic[key] = {
            field_type: value.type,
            [`field_value_${value.type}`]: value.value,
            smart_code: value.smart_code
          }
        })
      }

      // Transform relationships from hook format to RPC format
      const p_relationships: any[] = []
      if (entity.relationships) {
        Object.entries(entity.relationships).forEach(([relType, toIds]: any) => {
          const relDef = config.relationships?.find(r => r.type === relType)
          if (relDef && Array.isArray(toIds)) {
            toIds.forEach(toId => {
              p_relationships.push({
                to_entity_id: toId,
                relationship_type: relType,
                smart_code: relDef.smart_code
              })
            })
          }
        })
      }

      // 🚀 ONE ATOMIC RPC CALL
      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: config.entity_type.toUpperCase(),
          entity_name: entity.entity_name,
          entity_code: entity.entity_code,
          smart_code: entity.smart_code,
          metadata: entity.metadata
        },
        p_dynamic,
        p_relationships
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['entities-v2', config.entity_type]
      })
    }
  })

  // Update mutation - ONE atomic call
  const updateMutation = useMutation({
    mutationFn: async ({
      entity_id,
      ...updates
    }: Partial<UniversalEntity> & { entity_id: string }) => {
      if (!organizationId || !actorUserId) {
        throw new Error('Organization ID and User ID required')
      }

      // Transform dynamic_patch to RPC format
      const p_dynamic: Record<string, any> = {}
      if (updates.dynamic_patch) {
        Object.entries(updates.dynamic_patch).forEach(([key, value]: any) => {
          const fieldDef = config.dynamicFields?.find(f => f.name === key)
          if (fieldDef) {
            p_dynamic[key] = {
              field_type: fieldDef.type,
              [`field_value_${fieldDef.type}`]: value,
              smart_code: fieldDef.smart_code
            }
          }
        })
      }

      // Transform relationships_patch to RPC format
      const p_relationships: any[] = []
      if (updates.relationships_patch) {
        Object.entries(updates.relationships_patch).forEach(([relType, toIds]: any) => {
          const relDef = config.relationships?.find(r => r.type === relType)
          if (relDef && Array.isArray(toIds)) {
            toIds.forEach(toId => {
              p_relationships.push({
                to_entity_id: toId,
                relationship_type: relType,
                smart_code: relDef.smart_code
              })
            })
          }
        })
      }

      // 🚀 ONE ATOMIC RPC CALL
      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'UPDATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: {
          id: entity_id,
          entity_name: updates.entity_name,
          entity_code: updates.entity_code,
          metadata: updates.metadata
        },
        p_dynamic: Object.keys(p_dynamic).length > 0 ? p_dynamic : undefined,
        p_relationships: p_relationships.length > 0 ? p_relationships : undefined
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['entities-v2', config.entity_type]
      })
    }
  })

  return {
    entities: entities || [],
    isLoading,
    error: error?.message,
    refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending
  }
}
```

### Step 2: Add Feature Flag System

```typescript
// src/lib/features/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_UNIFIED_ENTITY_RPC: process.env.NEXT_PUBLIC_USE_UNIFIED_ENTITY_RPC === 'true',

  // Per-entity-type flags for gradual rollout
  USE_UNIFIED_RPC_PRODUCT: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_PRODUCT === 'true',
  USE_UNIFIED_RPC_CUSTOMER: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_CUSTOMER === 'true',
  USE_UNIFIED_RPC_STOCK_LEVEL: process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_STOCK_LEVEL === 'true',
} as const

export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] || false
}
```

### Step 3: Create Adapter Hook (Unified Interface)

```typescript
// src/hooks/useUniversalEntity.ts (Updated)
import { useFeatureFlag } from '@/lib/features/feature-flags'
import { useUniversalEntityV1 } from './useUniversalEntityV1' // Rename current hook
import { useUniversalEntityV2 } from './useUniversalEntityV2'

export function useUniversalEntity(config: UseUniversalEntityConfig) {
  const useV2 = useFeatureFlag('USE_UNIFIED_ENTITY_RPC') ||
                useFeatureFlag(`USE_UNIFIED_RPC_${config.entity_type.toUpperCase()}` as any)

  // Route to V2 if feature flag is enabled, otherwise use V1
  if (useV2) {
    console.log(`[useUniversalEntity] Using V2 (unified RPC) for ${config.entity_type}`)
    return useUniversalEntityV2(config)
  } else {
    console.log(`[useUniversalEntity] Using V1 (multi-call) for ${config.entity_type}`)
    return useUniversalEntityV1(config)
  }
}
```

### Step 4: Gradual Rollout Strategy

#### Phase 1: Development Testing
```bash
# .env.local
NEXT_PUBLIC_USE_UNIFIED_RPC_STOCK_LEVEL=true  # Start with inventory only
```

#### Phase 2: Staged Rollout
```bash
# Week 1: Inventory
NEXT_PUBLIC_USE_UNIFIED_RPC_STOCK_LEVEL=true
NEXT_PUBLIC_USE_UNIFIED_RPC_PRODUCT=true

# Week 2: Add more entity types
NEXT_PUBLIC_USE_UNIFIED_RPC_CUSTOMER=true
NEXT_PUBLIC_USE_UNIFIED_RPC_SERVICE=true

# Week 3: Enable globally
NEXT_PUBLIC_USE_UNIFIED_ENTITY_RPC=true
```

#### Phase 3: Complete Migration
Once all entity types tested and working:
1. Remove V1 implementation
2. Remove feature flags
3. Remove adapter layer
4. Keep only V2 implementation

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// tests/hooks/useUniversalEntityV2.test.ts
describe('useUniversalEntityV2', () => {
  it('should create entity with dynamic fields and relationships in single RPC call', async () => {
    const { result } = renderHook(() => useUniversalEntityV2({
      entity_type: 'STOCK_LEVEL',
      dynamicFields: [
        { name: 'quantity', type: 'number', smart_code: 'HERA.SALON.INV.DYN.QTY.V1' }
      ],
      relationships: [
        { type: 'STOCK_OF_PRODUCT', smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1' }
      ]
    }))

    await act(async () => {
      await result.current.create({
        entity_name: 'Test Stock Level',
        smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1',
        dynamic_fields: {
          quantity: { value: 50, type: 'number', smart_code: 'HERA.SALON.INV.DYN.QTY.V1' }
        },
        relationships: {
          STOCK_OF_PRODUCT: ['product-uuid']
        }
      })
    })

    // Verify single RPC call was made
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('hera_entities_crud_v2', expect.objectContaining({
      p_action: 'CREATE',
      p_entity: expect.any(Object),
      p_dynamic: expect.any(Object),
      p_relationships: expect.any(Array)
    }))
  })
})
```

### Integration Tests
```typescript
// tests/integration/inventory-page.test.tsx
describe('Inventory Page with V2', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_UNIFIED_RPC_STOCK_LEVEL = 'true'
  })

  it('should create stock level using unified RPC', async () => {
    render(<InventoryPage />)

    // Click create button
    await userEvent.click(screen.getByText('Add Stock Level'))

    // Fill form
    await userEvent.type(screen.getByLabelText('Quantity'), '50')

    // Submit
    await userEvent.click(screen.getByText('Save'))

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Stock level created')).toBeInTheDocument()
    })

    // Verify only 1 RPC call was made
    expect(mockRPCCalls.length).toBe(1)
    expect(mockRPCCalls[0].function).toBe('hera_entities_crud_v2')
  })
})
```

### Performance Tests
```typescript
// tests/performance/entity-operations.benchmark.ts
describe('Performance: V1 vs V2', () => {
  it('should be 3x faster than V1', async () => {
    const v1Time = await measureTime(() => createEntityV1())
    const v2Time = await measureTime(() => createEntityV2())

    expect(v2Time).toBeLessThan(v1Time / 3)
    console.log(`V1: ${v1Time}ms, V2: ${v2Time}ms, Improvement: ${(v1Time/v2Time).toFixed(1)}x`)
  })
})
```

---

## 📊 Success Metrics

### Performance Metrics
- [ ] Create operation: < 100ms (vs 300ms+ in V1)
- [ ] Update operation: < 80ms (vs 250ms+ in V1)
- [ ] Network requests: 1 per operation (vs 3-5 in V1)

### Reliability Metrics
- [ ] Zero partial-state errors
- [ ] 100% atomic operations
- [ ] No race condition reports

### Migration Metrics
- [ ] 100% of entity types migrated
- [ ] Zero rollbacks required
- [ ] All tests passing

---

## 🚦 Go/No-Go Criteria

### Go Criteria (Enable for entity type)
✅ All unit tests passing
✅ Integration tests passing
✅ Performance tests show improvement
✅ Manual QA complete
✅ Rollback plan documented

### No-Go Criteria (Rollback to V1)
❌ Data consistency issues
❌ Performance regression
❌ Critical bugs in production
❌ RPC function not available

---

## 🔄 Rollback Plan

### Immediate Rollback (< 1 minute)
```bash
# Disable feature flag
NEXT_PUBLIC_USE_UNIFIED_RPC_STOCK_LEVEL=false
# Restart application
```

### Code Rollback (if needed)
```bash
git revert <commit-hash>
npm run build
npm run deploy
```

---

## 📅 Timeline

### Week 1: Foundation
- [ ] Create `useUniversalEntityV2` hook
- [ ] Add feature flag system
- [ ] Write unit tests
- [ ] Create adapter layer

### Week 2: Testing
- [ ] Test with STOCK_LEVEL entity type
- [ ] Integration testing on /inventory page
- [ ] Performance benchmarking
- [ ] QA testing

### Week 3: Rollout
- [ ] Enable for STOCK_LEVEL (inventory)
- [ ] Monitor for 3 days
- [ ] Enable for PRODUCT
- [ ] Monitor for 3 days

### Week 4: Complete Migration
- [ ] Enable globally
- [ ] Remove V1 code
- [ ] Update documentation
- [ ] Archive migration artifacts

---

## 🎯 Current Action: Start with Inventory Page

For `/salon/inventory` page:
1. ✅ Create `useUniversalEntityV2` hook
2. ✅ Add feature flag: `USE_UNIFIED_RPC_STOCK_LEVEL=true`
3. ✅ Update migration script to use V2
4. ✅ Test entity creation with relationships
5. ✅ Monitor performance improvement

**Expected Result**: Stock level creation goes from 4 API calls (400ms) → 1 RPC call (80ms) = **5x faster + atomic guarantee**.

---

## 📚 References

- [hera_entities_crud_v2 RPC Documentation](/docs/api/v2/RPC_FUNCTIONS_GUIDE.md#-hera_entities_crud_v2---unified-entity-rpc-recommended)
- [Feature Flag Best Practices](https://martinfowler.com/articles/feature-toggles.html)
- [Zero-Downtime Migration Strategies](https://www.redhat.com/en/topics/devops/what-is-zero-downtime)
