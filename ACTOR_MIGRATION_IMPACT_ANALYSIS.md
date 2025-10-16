# HERA v2.2 Actor Migration Impact Analysis

## Executive Summary

The codebase is **well-architected** for actor stamping implementation. Most infrastructure exists - we primarily need to add `actor_user_id` parameter passing through API routes to RPC functions. This is a **low-risk, additive change** that won't break existing functionality.

## Current State Analysis

### ✅ Strong Foundation Already Exists

1. **JWT Authentication**: Supabase auth with user context
2. **Organization Filtering**: Multi-tenant security enforced 
3. **RPC Architecture**: Functions already support actor parameters
4. **Auth Middleware**: Request tracking and observability
5. **Type-Safe Clients**: `fetchV2`, `apiV2`, `universalApi`

### 🎯 What Needs Actor Stamping

## Critical API Routes Requiring Updates

### 1. Entity Operations
```typescript
// File: src/app/api/v2/entities/route.ts
// Current: Basic auth check
// Needs: Extract actor_user_id from auth context

// BEFORE
const auth = await verifyAuth(request)
const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
  p_payload: body,
  p_organization_id: auth.organizationId
})

// AFTER  
const auth = await verifyAuth(request)
const actor = await buildActorContext(supabase, auth.id, headerOrgId)
const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
  p_operation: 'UPSERT',
  p_payload: body,
  p_actor_user_id: actor.actor_user_id  // ✅ Actor stamping
})
```

### 2. Transaction Operations
```typescript
// File: src/app/api/v2/transactions/route.ts
// File: src/app/api/v2/universal/txn-emit/route.ts

// BEFORE
await supabase.rpc('hera_txn_emit_v1', {
  p_transaction_code: transactionNumber,
  p_organization_id: orgId
})

// AFTER
await supabase.rpc('hera_transactions_post_v2', {
  p_transaction: transactionPayload,
  p_lines: lines,
  p_actor_user_id: actor.actor_user_id  // ✅ Actor stamping
})
```

### 3. Relationship Operations
```typescript
// File: src/app/api/v2/relationships/*/route.ts

// BEFORE
await supabase.rpc('hera_relationship_upsert_v1', {
  p_payload: body,
  p_organization_id: orgId
})

// AFTER
await supabase.rpc('hera_relationships_crud_v2', {
  p_operation: 'UPSERT', 
  p_payload: body,
  p_actor_user_id: actor.actor_user_id  // ✅ Actor stamping
})
```

### 4. Dynamic Data Operations
```typescript
// File: src/app/api/v2/dynamic-data/*/route.ts

// BEFORE
await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_fields: fields,
  p_organization_id: orgId
})

// AFTER
await supabase.rpc('hera_dynamic_data_crud_v2', {
  p_operation: 'BATCH_UPSERT',
  p_fields: fields, 
  p_actor_user_id: actor.actor_user_id  // ✅ Actor stamping
})
```

## Detailed File-by-File Changes

### High Priority Server Files (Must Update)

#### 1. Auth Infrastructure Enhancement
```typescript
// File: src/lib/auth/verify-auth.ts
// Add: buildActorContext function (already created)
// Add: Enhanced auth result with actor_user_id

export interface AuthUser {
  id: string                    // Supabase UID
  actor_user_id?: string       // ✅ NEW: USER entity ID for stamping
  organizationId?: string
  roles?: string[]
  permissions?: string[]
}
```

#### 2. Core Entity API Routes
```typescript
// Files requiring actor stamping:
src/app/api/v2/entities/route.ts                    // Entity CRUD
src/app/api/v2/entities/[id]/route.ts              // Entity updates
src/app/api/v2/universal/entity-upsert/route.ts    // Universal entity operations
src/app/api/v2/universal/entity-delete/route.ts    // Entity deletion

// Pattern for all:
const actor = await buildActorContext(supabase, auth.id, headerOrgId)
// Pass actor.actor_user_id to all RPC calls
```

#### 3. Transaction API Routes
```typescript
// Files requiring actor stamping:
src/app/api/v2/transactions/route.ts               // Transaction CRUD
src/app/api/v2/transactions/[id]/route.ts         // Transaction updates  
src/app/api/v2/universal/txn-emit/route.ts        // Transaction emission
src/app/api/v2/universal/txn-query/route.ts       // Transaction queries (read-only, may skip)

// All transaction writes need actor_user_id
```

#### 4. Relationship API Routes
```typescript
// Files requiring actor stamping:
src/app/api/v2/relationships/route.ts             // Relationship CRUD
src/app/api/v2/relationships/[id]/route.ts       // Relationship updates
src/app/api/v2/universal/relationship-upsert/route.ts // Universal relationships

// All relationship modifications need actor_user_id
```

#### 5. Dynamic Data API Routes
```typescript
// Files requiring actor stamping:
src/app/api/v2/dynamic-data/route.ts              // Dynamic data CRUD
src/app/api/v2/dynamic-data/batch/route.ts       // Batch operations
src/app/api/v2/universal/dynamic-data-upsert/route.ts // Universal dynamic data

// All dynamic data changes need actor_user_id
```

### Medium Priority Files (Enhancement)

#### 6. Universal API Client Updates
```typescript
// File: src/lib/universal-api-v2.ts
// Enhancement: Pass actor context automatically

class UniversalAPI {
  private async getActorContext() {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (session?.user?.id) {
      return await buildActorContext(this.supabase, session.user.id)
    }
    throw new Error('No authenticated user')
  }

  async createEntity(payload: any) {
    const actor = await this.getActorContext()
    return this.callRPC('hera_entities_crud_v2', {
      p_operation: 'UPSERT',
      p_payload: payload,
      p_actor_user_id: actor.actor_user_id  // ✅ Auto actor stamping
    })
  }
}
```

#### 7. React Hooks Enhancement
```typescript
// File: src/hooks/useUniversalEntity.ts
// Enhancement: Automatic actor context

export function useUniversalEntity() {
  const { user } = useHERAAuth()
  
  const createEntity = useCallback(async (payload: any) => {
    // Get actor context from user
    const actorUserId = user?.entity_id // Available from HERAAuthProvider
    
    return universalApi.createEntity({
      ...payload,
      actor_user_id: actorUserId  // ✅ Actor context from hook
    })
  }, [user])
}
```

### Low Priority Files (Optional)

#### 8. Client Utilities Enhancement
```typescript
// File: src/lib/client/fetchV2.ts
// Optional: Add actor context to headers

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const { user } = useHERAAuth() // If available
  
  return {
    Authorization: `Bearer ${session.access_token}`,
    'X-Actor-User-Id': user?.entity_id, // ✅ Optional actor header
    'X-Organization-Id': user?.organization?.id
  }
}
```

## Database Functions Requiring Updates

### New RPC Functions Needed
```sql
-- Already created (✅ DONE):
hera_entities_crud_v2(p_operation, p_payload, p_actor_user_id)
hera_transactions_post_v2(p_transaction, p_lines, p_actor_user_id) 

-- Still needed:
hera_relationships_crud_v2(p_operation, p_payload, p_actor_user_id)
hera_dynamic_data_crud_v2(p_operation, p_fields, p_actor_user_id)
```

### Legacy Functions to Deprecate
```sql
-- Gradually replace with v2 versions:
hera_entity_upsert_v1         → hera_entities_crud_v2
hera_txn_emit_v1             → hera_transactions_post_v2  
hera_relationship_upsert_v1   → hera_relationships_crud_v2
hera_dynamic_data_batch_v1    → hera_dynamic_data_crud_v2
```

## Implementation Timeline

### Week 1: Core Infrastructure
- [x] ✅ Deploy resolve_user_identity_v1 
- [x] ✅ Deploy hera_entities_crud_v2
- [x] ✅ Deploy hera_transactions_post_v2
- [ ] Create hera_relationships_crud_v2
- [ ] Create hera_dynamic_data_crud_v2

### Week 2: API Route Updates
- [ ] Update entity API routes (4 files)
- [ ] Update transaction API routes (4 files) 
- [ ] Update relationship API routes (3 files)
- [ ] Update dynamic data API routes (3 files)

### Week 3: Client Enhancement
- [ ] Enhance universal API client
- [ ] Update React hooks for actor context
- [ ] Add actor context to fetchV2 headers
- [ ] Update documentation

### Week 4: Testing & Hardening
- [ ] Enable hardening triggers
- [ ] Run comprehensive tests
- [ ] Performance validation
- [ ] Production deployment

## Risk Assessment

### Low Risk ✅
- **Additive changes**: Actor parameter is optional in most cases
- **Backward compatibility**: Existing APIs continue to work
- **Incremental rollout**: Can enable per endpoint
- **Strong foundation**: Auth infrastructure already robust

### Mitigation Strategies
- **Feature flags**: Control actor stamping per endpoint
- **Dual write**: Compare old vs new audit data during transition
- **Rollback plan**: Disable actor stamping if issues arise
- **Monitoring**: Track audit coverage and performance

## Success Metrics

### Audit Coverage Targets
- **100% actor stamping** on all write operations
- **Zero NULL audit columns** post-migration
- **<10ms latency impact** from actor resolution
- **Zero authentication failures** from actor stamping

### Validation Queries
```sql
-- Check actor coverage by table
SELECT 
  table_name,
  COUNT(*) as total_rows,
  COUNT(created_by) as actor_stamped,
  ROUND(100.0 * COUNT(created_by) / COUNT(*), 2) as coverage_pct
FROM (
  SELECT 'entities' as table_name, created_by FROM core_entities
  UNION ALL
  SELECT 'transactions', created_by FROM universal_transactions  
  UNION ALL
  SELECT 'relationships', created_by FROM core_relationships
) coverage
GROUP BY table_name;
```

## Conclusion

The HERA codebase is **excellently positioned** for actor stamping implementation. The authentication infrastructure, RPC architecture, and multi-tenant design provide a solid foundation. 

**Main effort required**: Adding `actor_user_id` parameter passing through ~14 API route files and creating 2 additional RPC functions.

**Timeline**: 2-3 weeks for complete implementation and testing.

**Risk**: Very low - this is primarily additive functionality that enhances the existing robust system.