# HERA V2 RPC Functions - Technical Reference

**Database-Level CRUD Operations**
Complete reference for all PostgreSQL RPC functions supporting HERA V2 API operations.

---

## 🎯 Overview

HERA V2 RPC functions provide direct database-level CRUD operations with:
- **Multi-tenant security** via organization_id isolation
- **Smart code validation** on all operations
- **Complete audit trails** for all changes
- **Performance optimization** with strategic indexing
- **Immutable transactions** with event-sourced architecture

---

## 📋 Entity Functions

### `hera_entities_crud_v1` ⭐ ORCHESTRATOR - PRODUCTION READY
**Status**: ✅ 100% Success Rate (13/13 enterprise tests passing)
**Performance**: ⚡ Average 90ms response time
**Purpose**: Universal entity CRUD orchestrator - Single atomic call for all entity operations

#### Overview
The orchestrator RPC combines entity CRUD, dynamic fields, and relationships into **a single atomic operation**. This eliminates the need for multiple API calls and provides built-in guardrails, validation, and audit trails.

**Key Benefits:**
- **60% Less API Calls**: Single call vs. multi-step v1 pattern
- **70% Less Code**: Built-in validation and error handling
- **Atomic Operations**: All changes succeed or fail together
- **Enterprise Security**: Actor stamping + membership validation + smart code enforcement

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_entities_crud_v1(
  p_action            text,          -- 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id     uuid,          -- WHO is making the change (required)
  p_organization_id   uuid,          -- WHERE (tenant boundary - required)
  p_entity            jsonb DEFAULT '{}'::jsonb,
  p_dynamic           jsonb DEFAULT '{}'::jsonb,
  p_relationships     jsonb DEFAULT '{}'::jsonb,
  p_options           jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

##### `p_action` (required)
Operation type:
- `CREATE` - Create new entity with dynamic fields and relationships
- `READ` - Read entity(s) with optional includes
- `UPDATE` - Update entity, dynamic fields, and/or relationships
- `DELETE` - Delete entity with smart fallback (HARD → SOFT)

##### `p_actor_user_id` (required)
User entity UUID performing the operation. Used for audit trail (`created_by`, `updated_by`).

##### `p_organization_id` (required)
Organization UUID for multi-tenant isolation. Sacred boundary enforcement.

##### `p_entity` (object)
Entity core fields:
```typescript
{
  entity_id?: string,           // Required for UPDATE/DELETE
  entity_type?: string,         // Required for CREATE, optional for READ (list filter)
  entity_name?: string,         // Required for CREATE
  entity_code?: string | null,  // Optional - unique business code
  smart_code?: string,          // Required for CREATE - HERA DNA pattern
  status?: string | null,       // Optional - workflow status
  parent_entity_id?: string     // Optional - hierarchical parent
}
```

##### `p_dynamic` (object)
Dynamic fields in SIMPLE format:
```typescript
{
  field_name: {
    value: string,              // String representation of value
    type: 'text' | 'number' | 'boolean' | 'date' | 'json',
    smart_code: string          // HERA DNA pattern for field
  }
}
```

**Example:**
```javascript
{
  price: {
    value: '99.99',
    type: 'number',
    smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
  },
  category: {
    value: 'premium_treatment',
    type: 'text',
    smart_code: 'HERA.SALON.PRODUCT.FIELD.CATEGORY.V1'
  }
}
```

##### `p_relationships` (object)
Relationships in FLAT format:
```typescript
{
  RELATIONSHIP_TYPE: [entity_id_1, entity_id_2, ...]
}
```

**Example:**
```javascript
{
  STAFF_HAS_ROLE: ['role-uuid-1', 'role-uuid-2'],
  ASSIGNED_TO_BRANCH: ['branch-uuid']
}
```

##### `p_options` (object)
Operation-specific options:
```typescript
{
  // READ options
  limit?: number,                        // Default: 100
  offset?: number,                       // Default: 0
  include_dynamic?: boolean,             // Default: true
  include_relationships?: boolean,       // Default: true
  list_mode?: 'HEADERS' | 'FULL',       // HEADERS = fast (core only), FULL = complete

  // Relationship options (CREATE/UPDATE)
  relationships_mode?: 'UPSERT' | 'REPLACE',  // UPSERT = add/update, REPLACE = exact set
  relationship_smart_code_map?: {       // Per-type smart codes
    RELATIONSHIP_TYPE: 'HERA.SMART.CODE.V1'
  },

  // Security options
  system_actor_user_id?: string,        // For platform identity (USER/ROLE creation)
  allow_platform_identity?: boolean     // Allow USER/ROLE entity creation
}
```

#### Usage Examples

##### CREATE - Single Atomic Call
```javascript
import { entityCRUD } from '@/lib/universal-api-v2-client'

// Create entity with dynamic fields and relationships in ONE call
const { data, error } = await entityCRUD({
  p_action: 'CREATE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entity: {
    entity_type: 'STAFF',
    entity_name: 'John Doe',
    entity_code: 'STAFF-001',
    smart_code: 'HERA.SALON.STAFF.ENTITY.PROFILE.V1',
    status: 'active'
  },
  p_dynamic: {
    phone: {
      value: '+971501234567',
      type: 'text',
      smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1'
    },
    email: {
      value: 'john@salon.com',
      type: 'text',
      smart_code: 'HERA.SALON.STAFF.FIELD.EMAIL.V1'
    },
    commission_rate: {
      value: '15.5',
      type: 'number',
      smart_code: 'HERA.SALON.STAFF.FIELD.COMMISSION.V1'
    }
  },
  p_relationships: {
    STAFF_HAS_ROLE: ['role-manager-uuid', 'role-stylist-uuid'],
    ASSIGNED_TO_BRANCH: ['branch-main-uuid']
  },
  p_options: {
    relationships_mode: 'UPSERT',
    relationship_smart_code_map: {
      STAFF_HAS_ROLE: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1',
      ASSIGNED_TO_BRANCH: 'HERA.SALON.STAFF.REL.ASSIGNED_TO.V1'
    }
  }
})

console.log('Created entity:', data.entity_id)
```

##### READ - Single Entity
```javascript
const { data, error } = await entityCRUD({
  p_action: 'READ',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entity: {
    entity_id: 'entity-uuid'
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {
    include_dynamic: true,
    include_relationships: true
  }
})

// Response: { entity: {...}, dynamic_data: [...], relationships: [...] }
```

##### READ - List with Performance Optimization
```javascript
// Fast list read (HEADERS mode - core fields only)
const { data, error } = await entityCRUD({
  p_action: 'READ',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entity: {
    entity_type: 'CUSTOMER'
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {
    limit: 50,
    offset: 0,
    list_mode: 'HEADERS',      // Fast mode - core fields only
    include_dynamic: false,
    include_relationships: false
  }
})

// Response: { data: { list: [{entity}, {entity}, ...] } }
```

##### UPDATE - With Relationship REPLACE
```javascript
const { data, error } = await entityCRUD({
  p_action: 'UPDATE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entity: {
    entity_id: 'staff-uuid',
    entity_name: 'John Doe (Updated)',
    status: 'active'
  },
  p_dynamic: {
    phone: {
      value: '+971509876543',
      type: 'text',
      smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1'
    }
  },
  p_relationships: {
    STAFF_HAS_ROLE: ['role-senior-stylist-uuid']  // Exact set - removes old roles
  },
  p_options: {
    relationships_mode: 'REPLACE',  // Exact set - removes relationships not in list
    relationship_smart_code_map: {
      STAFF_HAS_ROLE: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1'
    }
  }
})
```

##### DELETE - Smart Fallback
```javascript
// Try HARD delete first, falls back to SOFT (archive) if entity is referenced
const { data, error } = await entityCRUD({
  p_action: 'DELETE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entity: {
    entity_id: 'entity-uuid'
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {}
})

// Response indicates mode: 'HARD' or 'SOFT_FALLBACK'
```

#### Response Structures

##### CREATE Response
```json
{
  "success": true,
  "action": "CREATE",
  "entity_id": "entity-uuid",
  "data": {
    "entity": {
      "id": "entity-uuid",
      "organization_id": "org-uuid",
      "entity_type": "STAFF",
      "entity_name": "John Doe",
      "entity_code": "STAFF-001",
      "smart_code": "HERA.SALON.STAFF.ENTITY.PROFILE.V1",
      "status": "active",
      "created_at": "2025-10-22T10:30:00Z",
      "created_by": "actor-uuid",
      "updated_at": "2025-10-22T10:30:00Z",
      "updated_by": "actor-uuid"
    },
    "dynamic_data": [
      {
        "id": "dyn-uuid-1",
        "entity_id": "entity-uuid",
        "field_name": "phone",
        "field_type": "text",
        "field_value_text": "+971501234567",
        "smart_code": "HERA.SALON.STAFF.FIELD.PHONE.V1"
      }
    ],
    "relationships": [
      {
        "id": "rel-uuid-1",
        "from_entity_id": "entity-uuid",
        "to_entity_id": "role-uuid",
        "relationship_type": "STAFF_HAS_ROLE",
        "smart_code": "HERA.SALON.STAFF.REL.HAS_ROLE.V1"
      }
    ]
  }
}
```

##### READ Single Entity Response
```json
{
  "success": true,
  "action": "READ",
  "data": {
    "entity": { /* same structure as CREATE */ },
    "dynamic_data": [ /* array of dynamic fields */ ],
    "relationships": [ /* array of relationships */ ]
  }
}
```

##### READ List Response (HEADERS Mode)
```json
{
  "success": true,
  "action": "READ",
  "data": {
    "list": [
      {
        "entity": { /* core fields only */ }
      },
      {
        "entity": { /* core fields only */ }
      }
    ]
  }
}
```

##### READ List Response (FULL Mode)
```json
{
  "success": true,
  "action": "READ",
  "data": {
    "list": [
      {
        "entity": { /* full entity */ },
        "dynamic_data": [ /* dynamic fields */ ],
        "relationships": [ /* relationships */ ]
      }
    ]
  }
}
```

##### UPDATE Response
```json
{
  "success": true,
  "action": "UPDATE",
  "entity_id": "entity-uuid",
  "data": {
    "entity": { /* updated entity */ },
    "dynamic_data": [ /* updated fields */ ],
    "relationships": [ /* updated relationships */ ]
  }
}
```

##### DELETE Response
```json
{
  "success": true,
  "action": "DELETE",
  "entity_id": "entity-uuid",
  "mode": "HARD",
  "dynamic_rows_deleted": 5,
  "relationships_deleted": 3
}
```

#### Key Features

- **✅ Atomic Operations**: All changes in a single transaction (all-or-nothing)
- **✅ Smart Code Validation**: Automatic HERA DNA pattern enforcement
- **✅ Actor Accountability**: Full audit trail with created_by/updated_by
- **✅ Organization Isolation**: Multi-tenant security boundary enforcement
- **✅ Flexible Relationships**: Per-type smart codes + UPSERT/REPLACE modes
- **✅ Performance Optimized**: HEADERS mode for fast list reads
- **✅ Smart Delete**: Automatic HARD → SOFT fallback on FK constraints
- **✅ Membership Validation**: Ensures actor belongs to organization
- **✅ Idempotent**: Safe to retry operations

#### Validation & Guardrails

**ORG-FILTER-REQUIRED**: Enforces organization_id presence
```sql
IF p_organization_id IS NULL THEN
  RAISE EXCEPTION 'HERA_ORG_REQUIRED: organization_id is required';
END IF;
```

**SMARTCODE-PRESENT**: Validates HERA DNA pattern
```sql
-- Smart code normalization: .V1 → .v1
v_smart_code := regexp_replace(v_smart_code, '\.[Vv]([0-9]+)', '.v\1');

-- Strict validation
IF NOT (v_smart_code ~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+') THEN
  RAISE EXCEPTION 'HERA_SMARTCODE_INVALID:%', v_smart_code;
END IF;
```

**MEMBERSHIP-CHECK**: Validates actor belongs to organization
```sql
SELECT COUNT(*) INTO v_is_member
FROM core_relationships r
WHERE r.relationship_type = 'MEMBER_OF'
  AND r.from_entity_id = p_actor_user_id
  AND r.to_entity_id = p_organization_id;

IF v_is_member = 0 THEN
  RAISE EXCEPTION 'HERA_MEMBERSHIP_REQUIRED: actor not member of organization';
END IF;
```

#### Per-Type Relationship Smart Codes

The orchestrator supports flexible smart code assignment per relationship type:

```javascript
// Helper function resolves smart codes with 3-tier fallback
hera_resolve_relationship_smartcode(
  p_entity_type,    // Entity type context
  p_rel_type,       // Relationship type
  p_map,            // Per-type map from options
  p_explicit        // Explicit smart code
)

// Priority:
// 1. Explicit smart code (p_explicit)
// 2. Per-type map (p_map[p_rel_type])
// 3. Generic fallback (HERA.GEN.{entity}.REL.{type}.v1)
```

**Example:**
```javascript
p_options: {
  relationship_smart_code_map: {
    STAFF_HAS_ROLE: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1',
    ASSIGNED_TO_BRANCH: 'HERA.SALON.STAFF.REL.ASSIGNED_TO.V1',
    STAFF_HAS_SKILL: 'HERA.SALON.STAFF.REL.HAS_SKILL.V1'
  }
}
```

#### Performance Metrics

**Production Test Results (13/13 tests passing):**
- Average Response Time: **90ms**
- Range: 67ms - 171ms
- Success Rate: **100%**

**Operation Breakdown:**
- CREATE (with dynamic + relationships): ~100ms
- READ (single entity, full): ~70ms
- READ (list, HEADERS mode): ~50ms
- READ (list, FULL mode): ~120ms
- UPDATE (with dynamic + relationships): ~110ms
- DELETE (HARD): ~80ms
- DELETE (SOFT fallback): ~90ms

**Performance Tips:**
1. Use `list_mode: 'HEADERS'` for fast list reads (50% faster)
2. Set `include_dynamic: false` when dynamic fields not needed
3. Set `include_relationships: false` when relationships not needed
4. Batch creates in parallel where possible (multiple `entityCRUD` calls)

#### Common Use Cases

**1. Customer Creation (Full Profile)**
```javascript
await entityCRUD({
  p_action: 'CREATE',
  p_actor_user_id: receptionist.id,
  p_organization_id: salon.id,
  p_entity: {
    entity_type: 'CUSTOMER',
    entity_name: 'Jane Smith',
    entity_code: 'CUST-' + Date.now(),
    smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.V1'
  },
  p_dynamic: {
    phone: { value: '+971501234567', type: 'text', smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.V1' },
    email: { value: 'jane@example.com', type: 'text', smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.V1' },
    preferred_stylist: { value: 'stylist-uuid', type: 'text', smart_code: 'HERA.SALON.CUSTOMER.FIELD.PREF_STYLIST.V1' }
  },
  p_relationships: {
    CUSTOMER_STATUS: ['status-active-uuid']
  },
  p_options: {
    relationships_mode: 'UPSERT',
    relationship_smart_code_map: {
      CUSTOMER_STATUS: 'HERA.SALON.CUSTOMER.REL.STATUS.V1'
    }
  }
})
```

**2. Staff Update (Change Roles)**
```javascript
await entityCRUD({
  p_action: 'UPDATE',
  p_actor_user_id: manager.id,
  p_organization_id: salon.id,
  p_entity: {
    entity_id: staff.id
  },
  p_dynamic: {},
  p_relationships: {
    STAFF_HAS_ROLE: ['role-senior-stylist-uuid', 'role-trainer-uuid']
  },
  p_options: {
    relationships_mode: 'REPLACE',  // Exact set - removes old roles
    relationship_smart_code_map: {
      STAFF_HAS_ROLE: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1'
    }
  }
})
```

**3. Fast Customer List (Dashboard)**
```javascript
// Fast mode - just names and IDs for dropdown
const { data } = await entityCRUD({
  p_action: 'READ',
  p_actor_user_id: user.id,
  p_organization_id: salon.id,
  p_entity: {
    entity_type: 'CUSTOMER'
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {
    limit: 100,
    list_mode: 'HEADERS',      // 50% faster - core fields only
    include_dynamic: false,
    include_relationships: false
  }
})
```

**4. Product Deletion (Smart Fallback)**
```javascript
// Try to delete product - will archive if used in transactions
const { data } = await entityCRUD({
  p_action: 'DELETE',
  p_actor_user_id: admin.id,
  p_organization_id: salon.id,
  p_entity: {
    entity_id: product.id
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {}
})

if (data.mode === 'SOFT_FALLBACK') {
  console.log('Product archived (used in transactions)')
} else {
  console.log('Product permanently deleted')
}
```

#### Error Handling

**Common Error Codes:**
```javascript
// Organization required
'HERA_ORG_REQUIRED: organization_id is required'

// Invalid smart code format
'HERA_SMARTCODE_INVALID: HERA.INVALID.CODE'

// Actor not member of organization
'HERA_MEMBERSHIP_REQUIRED: actor not member of organization'

// Entity not found
'HERA_ENTITY_NOT_FOUND: entity does not exist'

// Foreign key constraint on delete
'HERA_FK_VIOLATION: entity referenced in transactions'
```

**Error Response Structure:**
```json
{
  "success": false,
  "error": "HERA_SMARTCODE_INVALID: HERA.INVALID.CODE",
  "sqlstate": "P0001",
  "context": "PL/pgSQL function hera_entities_crud_v1..."
}
```

#### Integration with React Hook

The orchestrator integrates seamlessly with `useUniversalEntityV1` hook:

```typescript
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'

const { entities, isLoading, create, update, delete } = useUniversalEntityV1({
  entity_type: 'STAFF',
  filters: {
    include_dynamic: true,
    include_relationships: true,
    list_mode: 'FULL'
  },
  dynamicFields: [
    { name: 'phone', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1' },
    { name: 'email', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.EMAIL.V1' }
  ],
  relationships: [
    { type: 'STAFF_HAS_ROLE', smart_code: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1' }
  ]
})

// Create staff with dynamic fields and relationships in ONE call
await create({
  entity_type: 'STAFF',
  entity_name: 'John Doe',
  smart_code: 'HERA.SALON.STAFF.ENTITY.PROFILE.V1',
  dynamic_fields: {
    phone: { value: '+971501234567', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1' }
  },
  relationships: {
    STAFF_HAS_ROLE: ['role-uuid']
  }
})
```

---

### `hera_entity_read_v1`
**File**: `/database/functions/v2/hera_entity_read_v1.sql`
**Purpose**: Read single entity with optional dynamic data and relationships
**Status**: ⚠️ Legacy - Use `hera_entities_crud_v1` with `p_action: 'READ'` instead

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_entity_read_v1(
  p_org_id UUID,
  p_entity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_org_id` - Organization UUID (required for multi-tenant isolation)
- `p_entity_id` - Target entity UUID to read

#### Response Structure
```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "entity-uuid",
      "organization_id": "org-uuid",
      "entity_type": "customer",
      "entity_name": "ACME Corporation",
      "entity_code": "CUST-001",
      "smart_code": "HERA.CRM.CUST.ENT.PROF.V1",
      "classification": "business",
      "metadata": {},
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    "dynamic_data": [
      {
        "id": "dyn-data-uuid",
        "field_name": "credit_limit",
        "field_type": "number",
        "field_value_number": 50000,
        "smart_code": "HERA.CRM.CUST.DYN.CREDIT.V1",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "relationships": [
      {
        "id": "rel-uuid",
        "from_entity_id": "entity-uuid",
        "to_entity_id": "status-uuid",
        "relationship_type": "has_status",
        "smart_code": "HERA.CRM.CUST.STATUS.ACTIVE.V1"
      }
    ]
  }
}
```

#### Security Features
- **Organization boundary enforcement**: Prevents cross-org data access
- **Soft delete filtering**: Excludes deleted entities from results
- **Permission validation**: Checks entity access permissions

#### Performance Notes
- **Single query optimization**: Fetches entity + dynamic data + relationships in one call
- **Index utilization**: Uses `idx_core_entities_org_type` for fast lookups
- **Memory efficient**: Streams results for large dynamic data sets

### `hera_entity_delete_v1` ⭐ UPDATED
**Status**: ✅ Production Ready (v2.1.0)
**Purpose**: Smart delete entity with automatic HARD/SOFT fallback strategy

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_entity_delete_v1(
  p_organization_id        uuid,
  p_entity_id              uuid,
  p_cascade_dynamic_data   boolean DEFAULT true,
  p_cascade_relationships  boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_organization_id` (required) - Organization UUID for multi-tenant isolation
- `p_entity_id` (required) - Entity UUID to delete
- `p_cascade_dynamic_data` (optional, default: true) - Delete associated dynamic fields
- `p_cascade_relationships` (optional, default: true) - Delete/inactivate relationships

#### Smart Delete Strategy

The function implements an **intelligent 3-step delete strategy**:

1. **CASCADE CLEANUP** (if requested):
   - Remove dependent `core_dynamic_data` records
   - Remove dependent `core_relationships` records
   - Reduces foreign key constraint violations

2. **TRY HARD DELETE** (physical deletion):
   - Attempt to permanently delete entity from `core_entities`
   - If successful → Return `mode: 'HARD'`
   - If FK violation → Catch error and fall through to step 3

3. **SOFT DELETE FALLBACK** (archive):
   - Set `status = 'archived'`
   - Add `archived_at` timestamp to metadata
   - Optionally inactivate remaining relationships
   - Return `mode: 'SOFT_FALLBACK'` with FK error details

#### Usage Examples

##### Delete with Full Cascade (HARD DELETE)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Hard delete with full cascade (if no FK constraints exist)
const { data, error } = await supabase.rpc('hera_entity_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_cascade_dynamic_data: true,   // Delete all dynamic fields
  p_cascade_relationships: true   // Delete all relationships
});

console.log('Delete result:', data);
// Response: { success: true, mode: 'HARD', dynamic_rows_deleted: 5, relationships_deleted: 3 }
```

##### Delete with Soft Fallback (ARCHIVED)
```javascript
// Entity is referenced in transactions → Automatic soft delete fallback
const { data, error } = await supabase.rpc('hera_entity_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'product-uuid',  // Has transaction history
  p_cascade_dynamic_data: true,
  p_cascade_relationships: true
});

console.log('Delete result:', data);
// Response: {
//   success: true,
//   mode: 'SOFT_FALLBACK',
//   archived_at: '2025-01-15T14:30:00Z',
//   fk_error: 'foreign_key_violation: referenced in universal_transactions'
// }
```

##### Delete Without Cascade (Preserve Dependencies)
```javascript
// Delete entity only, keep dynamic data and relationships
const { data, error } = await supabase.rpc('hera_entity_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_cascade_dynamic_data: false,  // Keep dynamic fields
  p_cascade_relationships: false  // Keep relationships
});
```

#### Response Structures

##### HARD Delete Success
```json
{
  "success": true,
  "mode": "HARD",
  "organization_id": "org-uuid",
  "entity_id": "entity-uuid",
  "dynamic_rows_deleted": 5,
  "relationships_deleted": 3
}
```

##### SOFT Delete Fallback (Archive)
```json
{
  "success": true,
  "mode": "SOFT_FALLBACK",
  "organization_id": "org-uuid",
  "entity_id": "entity-uuid",
  "archived_at": "2025-10-19T12:00:00Z",
  "dynamic_rows_deleted": 5,
  "relationships_deleted": 0,
  "relationships_inactivated": 3,
  "fk_error": "update or delete on table \"core_entities\" violates foreign key constraint \"universal_transactions_source_entity_id_fkey\""
}
```

##### Error Response
```json
{
  "success": false,
  "mode": "ERROR",
  "organization_id": "org-uuid",
  "entity_id": "entity-uuid",
  "error": "HERA_DELETE_REQUIRED: organization_id and entity_id are required",
  "sqlstate": "P0001",
  "context": "PL/pgSQL function hera_entity_delete_v1..."
}
```

##### Entity Not Found
```json
{
  "success": false,
  "mode": "NONE",
  "error": "Entity <uuid> not found in organization <org-uuid>"
}
```

#### Key Features
- **✅ Smart Fallback**: Automatically archives entity if physical deletion fails
- **✅ Cascade Control**: Fine-grained control over dependent data deletion
- **✅ FK-Safe**: Handles foreign key violations gracefully without exceptions
- **✅ Audit Trail**: Returns detailed information about what was deleted/archived
- **✅ Organization Isolated**: Enforces multi-tenant security boundary
- **✅ Idempotent**: Safe to retry - deleting non-existent entity returns clean error

#### Common Use Cases

1. **Product Deletion** (Smart Fallback Pattern):
   ```javascript
   // Try to delete product - will archive if used in transactions
   const result = await supabase.rpc('hera_entity_delete_v1', {
     p_organization_id: orgId,
     p_entity_id: productId,
     p_cascade_dynamic_data: true,
     p_cascade_relationships: true
   });

   if (result.data.mode === 'SOFT_FALLBACK') {
     console.log('Product archived (used in transactions)');
   } else {
     console.log('Product permanently deleted');
   }
   ```

2. **Customer Cleanup** (Full Cascade):
   ```javascript
   // Delete test customer with all associated data
   await supabase.rpc('hera_entity_delete_v1', {
     p_organization_id: orgId,
     p_entity_id: testCustomerId,
     p_cascade_dynamic_data: true,  // Remove all custom fields
     p_cascade_relationships: true  // Remove all relationships
   });
   ```

3. **Relationship Preservation** (Selective Cascade):
   ```javascript
   // Archive entity but keep relationships for historical reference
   await supabase.rpc('hera_entity_delete_v1', {
     p_organization_id: orgId,
     p_entity_id: entityId,
     p_cascade_dynamic_data: true,   // Clean up dynamic data
     p_cascade_relationships: false  // Preserve relationships
   });
   ```

#### Performance Notes
- **Single Entity Hard Delete**: ~10-30ms (no dependencies)
- **Entity with Dynamic Data**: ~20-50ms (5-10 fields)
- **Entity with Relationships**: ~30-80ms (5-10 relationships)
- **Soft Delete Fallback**: ~15-40ms (status update + metadata)
- **Transaction**: All operations are atomic (all-or-nothing)

#### Security & Validation
- **Organization Boundary**: Enforced via `WHERE organization_id = p_organization_id`
- **Entity Existence**: Validates entity exists before attempting deletion
- **Parameter Validation**: Raises exception if required params are NULL
- **FK Protection**: Catches and handles foreign key violations gracefully
- **Audit Metadata**: Adds `archived_at` timestamp to entity metadata on soft delete

---

### `hera_entities_bulk_crud_v1` ⭐ NEW - PRODUCTION READY
**Status**: ✅ 100% E2E Test Pass Rate (6/6 tests)
**Performance**: ⚡ Average 50ms per entity (150ms for 3 entities)
**Purpose**: High-performance batch processing for entity operations (up to 1000 entities per call)

#### Overview
The bulk CRUD RPC enables efficient batch processing of multiple entities in a single call. It provides both atomic (all-or-nothing) and non-atomic (continue-on-error) modes, making it ideal for CSV imports, data migrations, and bulk updates.

**Key Benefits:**
- **🚀 High Performance**: Process up to 1000 entities per call
- **⚡ Atomic Mode**: All-or-nothing transactions with automatic rollback
- **🔄 Non-Atomic Mode**: Continue processing after errors (ideal for imports)
- **🛡️ Pre-Validation**: Actor membership checked before processing
- **📊 Progress Logging**: Reports progress every 100 entities
- **🔒 Complete Security**: Organization isolation + actor stamping

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_entities_bulk_crud_v1(
  p_action          text,                       -- 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id   uuid,                       -- WHO is making the change (required)
  p_organization_id uuid,                       -- WHERE (tenant boundary - required)
  p_entities        jsonb DEFAULT '[]'::jsonb,  -- Array of entities
  p_options         jsonb DEFAULT '{}'::jsonb   -- Batch configuration
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

##### `p_action` (required)
Operation type: `CREATE`, `READ`, `UPDATE`, `DELETE`

##### `p_actor_user_id` (required)
User entity UUID performing the bulk operation. All entities will be stamped with this actor.

##### `p_organization_id` (required)
Organization UUID for multi-tenant isolation. Pre-validated before processing.

##### `p_entities` (array of objects)
Array of entities to process. Each entity can use two formats:

**Format 1: Full Envelope (Recommended)**
```typescript
{
  entity: {
    entity_type: 'CUSTOMER',
    entity_name: 'John Doe',
    smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
  },
  dynamic: {
    phone: {
      field_name: 'phone',
      field_type: 'text',
      field_value_text: '+1-555-0001',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.NUMBER.v1'
    }
  },
  relationships: [],
  options: {}  // Per-entity options
}
```

**Format 2: Bare Entity (Simple)**
```typescript
{
  entity_type: 'CUSTOMER',
  entity_name: 'John Doe',
  smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
}
```

##### `p_options` (object)
Batch configuration options:
```typescript
{
  atomic: boolean,         // Default: false - All-or-nothing mode
  max_batch_size: number   // Default: 1000 - Maximum entities per call
}
```

#### Usage Examples

##### Bulk CREATE (Non-Atomic)
```javascript
const { data, error } = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entities: [
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'Customer 1',
        entity_code: 'CUST-001',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
      },
      dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-0001',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.NUMBER.v1'
        }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'Customer 2',
        entity_code: 'CUST-002',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
      }
    }
  ],
  p_options: { atomic: false }  // Continue on error
})

console.log(`Created: ${data.succeeded}/${data.total}`)
```

##### Bulk UPDATE
```javascript
const { data, error } = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entities: [
    {
      entity: {
        entity_id: 'entity-uuid-1',
        entity_name: 'Updated Name 1',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
      }
    },
    {
      entity: {
        entity_id: 'entity-uuid-2',
        entity_name: 'Updated Name 2',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
      }
    }
  ]
})
```

##### Bulk DELETE
```javascript
const { data, error } = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'DELETE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entities: [
    { entity: { entity_id: 'entity-uuid-1' } },
    { entity: { entity_id: 'entity-uuid-2' } }
  ]
})
```

##### Atomic Mode (All-or-Nothing)
```javascript
const { data, error } = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_entities: [...],
  p_options: { atomic: true }  // All succeed or all rollback
})

if (!data.success && data.atomic_rollback) {
  console.log('Transaction rolled back - no changes made')
}
```

#### Response Structure
```json
{
  "success": boolean,              // Overall operation success
  "action": "CREATE|READ|UPDATE|DELETE",
  "organization_id": "org-uuid",
  "total": 3,                      // Total entities processed
  "succeeded": 3,                  // Number of successful operations
  "failed": 0,                     // Number of failed operations
  "atomic": false,                 // Atomic mode flag
  "atomic_rollback": false,        // True if atomic rollback occurred
  "results": [                     // Per-entity results
    {
      "index": 0,                  // Position in input array
      "entity_id": "entity-uuid",  // Entity UUID (if successful)
      "success": true,             // Operation success flag
      "result": {                  // Delegated hera_entities_crud_v1 result
        "success": true,
        "action": "CREATE",
        "entity_id": "entity-uuid",
        "entity": {...},
        "dynamic_data": [...],
        "relationships": [...]
      }
    }
  ]
}
```

#### Atomic vs Non-Atomic Mode

**Atomic Mode** (`atomic: true`):
- ✅ All-or-nothing: either ALL succeed or ALL rollback
- ✅ Fails fast on first error
- ✅ Returns `atomic_rollback: true` in error response
- ✅ Perfect for: financial transactions, critical data migrations

**Non-Atomic Mode** (`atomic: false` - default):
- ✅ Continues processing after errors
- ✅ Returns mix of successes and failures
- ✅ Successful entities are committed
- ✅ Perfect for: CSV imports, bulk updates with expected failures

#### Performance & Limits

**Batch Size Recommendations:**
- CSV Import: 100-500 entities
- Real-time Updates: 10-50 entities
- Overnight Migration: 500-1000 entities
- Mobile App: 10-20 entities

**Limits:**
- Maximum: 1000 entities per call (configurable via `max_batch_size`)
- Progress logging: Every 100 entities processed

**E2E Test Performance:**
- CREATE 3 entities: ~150ms
- READ 3 entities: ~120ms
- UPDATE 3 entities: ~140ms
- DELETE 5 entities: ~180ms
- **Average: 50ms per entity**

#### Security Guardrails

1. **Actor Membership Validation**: Pre-validates actor is member of organization before processing
2. **Organization Isolation**: All operations scoped to specified organization
3. **Smart Code Validation**: Enforces proper HERA DNA patterns (6+ segments, UPPERCASE, lowercase version)
4. **Batch Size Limits**: Rejects batches exceeding maximum size
5. **Complete Audit Trail**: All operations are actor-stamped

#### Common Errors

**HERA_ACTOR_NOT_MEMBER**
```json
{
  "error": "HERA_ACTOR_NOT_MEMBER: Actor abc-123 not member of organization xyz-789"
}
```
Solution: Verify actor membership or use correct actor_user_id

**HERA_BATCH_TOO_LARGE**
```json
{
  "error": "HERA_BATCH_TOO_LARGE: Maximum 1000 entities per call (got 1500)"
}
```
Solution: Split into smaller batches or increase `max_batch_size`

**HERA_SMARTCODE_INVALID**
```json
{
  "error": "HERA_SMARTCODE_INVALID:HERA.INVALID.CODE"
}
```
Solution: Use proper format (6+ segments, UPPERCASE, lowercase version)

#### Best Practices

✅ **Use atomic mode for critical operations** (financial transactions)
✅ **Use non-atomic for imports** (CSV processing)
✅ **Include proper smart codes** (6+ segments minimum)
✅ **Batch appropriately** (split large datasets into manageable chunks)
✅ **Handle errors gracefully** (check `results` array for per-entity failures)

#### Testing

Complete E2E test suite available at:
`/mcp-server/test-bulk-e2e-complete.mjs`

Test coverage:
- ✅ Bulk CREATE (3 entities)
- ✅ Bulk READ (3 entities)
- ✅ Bulk UPDATE (3 entities)
- ✅ Atomic rollback test
- ✅ Non-atomic continue-on-error test
- ✅ Bulk DELETE (cleanup)

**Test Results**: 100% pass rate (6/6 tests)

---

## 💾 Dynamic Data Functions

### `hera_dynamic_data_batch_v1` ⭐ NEW
**Status**: ✅ Production Ready
**Purpose**: Batch upsert of dynamic fields with atomic transaction guarantees

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_dynamic_data_batch_v1(
  p_organization_id uuid,
  p_entity_id       uuid,
  p_items           jsonb,
  p_actor_user_id   uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_organization_id` (required) - Organization UUID for multi-tenant isolation
- `p_entity_id` (required) - Target entity UUID for dynamic fields
- `p_items` (required) - JSONB array of field objects to upsert
- `p_actor_user_id` (optional) - Actor UUID for audit trail (created_by/updated_by)

#### Item Structure
Each item in `p_items` array must follow this structure:
```typescript
{
  field_name: string,              // Required - Unique field identifier
  field_type: string,              // Required - 'text' | 'number' | 'boolean' | 'date' | 'json'
  smart_code: string,              // Required - HERA DNA pattern (enforced)

  // Value fields (based on field_type)
  field_value_text?: string,       // For type='text'
  field_value_number?: number,     // For type='number'
  field_value_boolean?: boolean,   // For type='boolean'
  field_value_date?: string,       // For type='date' (ISO 8601)
  field_value_json?: object,       // For type='json'

  // Optional metadata
  smart_code_status?: string,      // Default: 'DRAFT'
  ai_confidence?: number,          // Default: 0.0
  ai_insights?: object,            // Default: {}
  validation_rules?: object,       // Default: {}
  validation_status?: string,      // Default: 'valid'
  field_order?: number,            // Default: 1
  is_required?: boolean,           // Default: false
  is_searchable?: boolean,         // Default: true
  is_system_field?: boolean,       // Default: false
  ai_enhanced_value?: string,
  field_value_file_url?: string,
  calculated_value?: object
}
```

#### Usage Example
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Batch upsert multiple dynamic fields atomically
const { data, error } = await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_entity_id: 'product-uuid',
  p_items: [
    {
      field_name: 'price',
      field_type: 'number',
      field_value_number: 99.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1',
      is_required: true,
      field_order: 1
    },
    {
      field_name: 'category',
      field_type: 'text',
      field_value_text: 'premium_treatment',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.CATEGORY.V1',
      is_searchable: true
    },
    {
      field_name: 'in_stock',
      field_type: 'boolean',
      field_value_boolean: true,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.STOCK.V1'
    },
    {
      field_name: 'metadata',
      field_type: 'json',
      field_value_json: { tags: ['featured', 'bestseller'], rating: 4.8 },
      smart_code: 'HERA.SALON.PRODUCT.FIELD.META.V1'
    }
  ],
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
});

console.log('Batch upsert result:', data);
```

#### Response Structure
```json
{
  "success": true,
  "organization_id": "org-uuid",
  "entity_id": "entity-uuid",
  "total": 4,
  "upserted": 4,
  "skipped": 0
}
```

#### Error Response
```json
{
  "success": false,
  "error": "HERA_DYN_BATCH_PAYLOAD_INVALID: each item requires field_name and smart_code",
  "sqlstate": "P0001",
  "context": "PL/pgSQL function hera_dynamic_data_batch_v1..."
}
```

#### Key Features
- **✅ Atomic Operation**: All fields upserted in single transaction (all-or-nothing)
- **✅ Upsert Logic**: Creates new fields or updates existing ones based on unique key (org + entity + field_name)
- **✅ Smart Code Validation**: Enforces HERA DNA pattern on all items
- **✅ Type Safety**: Automatic type conversion and validation
- **✅ Audit Trail**: Automatic created_by/updated_by stamping with actor
- **✅ Idempotent**: Safe to retry - uses INSERT ... ON CONFLICT DO UPDATE
- **✅ Performance**: Single round-trip for multiple fields (10x faster than individual calls)

#### Validation Rules
1. **Required Fields**: `organization_id`, `entity_id`, `p_items` array
2. **Item Validation**: Each item must have `field_name` and `smart_code`
3. **Smart Code Format**: Must match HERA DNA pattern (enforced in database)
4. **Unique Constraint**: `(organization_id, entity_id, field_name)` is unique

#### Performance Notes
- **Batch Size**: Optimal batch size is 10-50 fields per call
- **Index**: Uses unique index `ux_cdd_org_entity_field` for fast conflict detection
- **Query Cost**: ~20-50ms for 10 fields, ~100-200ms for 50 fields
- **Concurrency**: Safe for concurrent calls (UPSERT handles conflicts)

---

### `hera_dynamic_data_delete_v1` ⭐ NEW
**Status**: ✅ Production Ready
**Purpose**: Delete dynamic fields with optional field-specific or entity-wide deletion

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_dynamic_data_delete_v1(
  p_organization_id uuid,
  p_entity_id       uuid,
  p_field_name      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_organization_id` (required) - Organization UUID
- `p_entity_id` (required) - Target entity UUID
- `p_field_name` (optional) - Specific field to delete (NULL = delete all fields for entity)

#### Usage Examples

##### Delete Specific Field
```javascript
// Delete single dynamic field
const { data, error } = await supabase.rpc('hera_dynamic_data_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_field_name: 'obsolete_field'
});

console.log('Deleted:', data.deleted_count);
```

##### Delete All Entity Fields
```javascript
// Delete ALL dynamic fields for an entity (cascade cleanup)
const { data, error } = await supabase.rpc('hera_dynamic_data_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid'
  // p_field_name omitted = delete all
});

console.log('Total fields deleted:', data.deleted_count);
```

#### Response Structure
```json
{
  "success": true,
  "organization_id": "org-uuid",
  "entity_id": "entity-uuid",
  "field_name": "price",
  "deleted_count": 1
}
```

#### Error Response
```json
{
  "success": false,
  "error": "HERA_DYN_DELETE_REQUIRED: organization_id and entity_id are required",
  "sqlstate": "P0001",
  "context": "PL/pgSQL function hera_dynamic_data_delete_v1..."
}
```

#### Key Features
- **✅ Flexible Deletion**: Delete single field or all fields for entity
- **✅ Safe Operation**: Organization boundary enforcement prevents cross-org deletion
- **✅ Audit Ready**: Returns deleted_count for tracking
- **✅ Idempotent**: Safe to retry (deleting non-existent field returns count=0)
- **✅ Cascade Support**: Use with entity deletion for complete cleanup

#### Common Use Cases
1. **Field Deprecation**: Remove obsolete dynamic fields
   ```javascript
   await supabase.rpc('hera_dynamic_data_delete_v1', {
     p_organization_id: orgId,
     p_entity_id: entityId,
     p_field_name: 'deprecated_field'
   });
   ```

2. **Entity Cleanup**: Delete all dynamic data before entity deletion
   ```javascript
   // Step 1: Delete all dynamic fields
   await supabase.rpc('hera_dynamic_data_delete_v1', {
     p_organization_id: orgId,
     p_entity_id: entityId
   });

   // Step 2: Delete entity
   await supabase.rpc('hera_entity_delete_v1', {
     p_org_id: orgId,
     p_entity_id: entityId,
     p_delete_reason: 'Entity no longer needed'
   });
   ```

3. **Bulk Field Reset**: Clear all fields and re-populate
   ```javascript
   // Clear existing
   await supabase.rpc('hera_dynamic_data_delete_v1', {
     p_organization_id: orgId,
     p_entity_id: entityId
   });

   // Re-populate with new schema
   await supabase.rpc('hera_dynamic_data_batch_v1', {
     p_organization_id: orgId,
     p_entity_id: entityId,
     p_items: newFieldsArray
   });
   ```

#### Performance Notes
- **Single Field Delete**: ~5-10ms
- **Entity-wide Delete**: ~20-50ms (depends on field count)
- **Index**: Uses `ux_cdd_org_entity_field` for fast lookup

---

### `hera_dynamic_data_v1`
**File**: `/database/functions/v2/hera_dynamic_data_v1.sql`
**Purpose**: Batch CRUD operations on entity dynamic fields
**Status**: ⚠️ Deprecated - Use `hera_dynamic_data_batch_v1` instead

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_dynamic_data_v1(
  p_org_id UUID,
  p_entity_id UUID,
  p_operations JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Operation Types
Each operation in `p_operations` array supports:

##### CREATE Operation
```json
{
  "operation": "CREATE",
  "field_name": "credit_limit",
  "field_type": "number",
  "field_value_number": 50000,
  "smart_code": "HERA.CRM.CUST.DYN.CREDIT.V1",
  "metadata": {"source": "manual_entry"}
}
```

##### READ Operation
```json
{
  "operation": "READ",
  "field_name": "credit_limit"
}
```

##### UPDATE Operation
```json
{
  "operation": "UPDATE",
  "field_name": "credit_limit",
  "field_value_number": 75000,
  "smart_code": "HERA.CRM.CUST.DYN.CREDIT.V2",
  "update_reason": "Credit limit increase approved"
}
```

##### DELETE Operation
```json
{
  "operation": "DELETE",
  "field_name": "obsolete_field",
  "delete_reason": "Field no longer used"
}
```

#### Batch Processing Example
```sql
SELECT hera_dynamic_data_v1(
  'org-uuid'::uuid,
  'entity-uuid'::uuid,
  ARRAY[
    '{"operation": "CREATE", "field_name": "credit_limit", "field_value_number": 50000, "smart_code": "HERA.CRM.CUST.DYN.CREDIT.V1"}'::jsonb,
    '{"operation": "UPDATE", "field_name": "payment_terms", "field_value_text": "NET30", "smart_code": "HERA.CRM.CUST.DYN.TERMS.V1"}'::jsonb,
    '{"operation": "DELETE", "field_name": "old_field", "delete_reason": "Deprecated field"}'::jsonb,
    '{"operation": "READ", "field_name": "customer_type"}'::jsonb
  ]
);
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "operations_processed": 4,
    "operations_successful": 3,
    "operations_failed": 1,
    "results": [
      {
        "operation": "CREATE",
        "field_name": "credit_limit",
        "status": "success",
        "dynamic_data_id": "dyn-uuid-1"
      },
      {
        "operation": "UPDATE",
        "field_name": "payment_terms",
        "status": "success",
        "updated_at": "2025-01-15T14:30:00Z"
      },
      {
        "operation": "DELETE",
        "field_name": "old_field",
        "status": "failed",
        "error": "FIELD_NOT_FOUND"
      },
      {
        "operation": "READ",
        "field_name": "customer_type",
        "status": "success",
        "field_value_text": "Premium"
      }
    ]
  }
}
```

#### Data Types Supported
- **Text**: `field_value_text` (VARCHAR/TEXT)
- **Number**: `field_value_number` (NUMERIC)
- **Date**: `field_value_date` (TIMESTAMPTZ)
- **Boolean**: `field_value_boolean` (BOOLEAN)
- **JSON**: `field_value_json` (JSONB)

---

## 🔗 Relationship Functions

### `hera_relationship_create_v1`
**File**: `/database/functions/v2/relationship-crud.sql`
**Purpose**: Create entity relationships with smart code validation

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_relationship_create_v1(
  p_org_id UUID,
  p_from_entity_id UUID,
  p_to_entity_id UUID,
  p_relationship_type TEXT,
  p_smart_code TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Common Relationship Types
| Type | Description | Example |
|------|-------------|---------|
| `has_status` | Entity status assignment | Customer → Active Status |
| `parent_of` | Hierarchical parent-child | Category → Subcategory |
| `belongs_to` | Ownership/membership | Employee → Department |
| `related_to` | General association | Product → Supplier |
| `depends_on` | Dependency relationship | Task → Prerequisite |

#### Usage Examples

##### Status Assignment
```sql
-- Assign "Active" status to customer
SELECT hera_relationship_create_v1(
  'org-uuid'::uuid,
  'customer-uuid'::uuid,
  'status-active-uuid'::uuid,
  'has_status',
  'HERA.CRM.CUST.STATUS.ACTIVE.V1',
  '{"assigned_by": "user-uuid", "assigned_date": "2025-01-15T10:30:00Z"}'::jsonb
);
```

##### Parent-Child Hierarchy
```sql
-- Set product category parent
SELECT hera_relationship_create_v1(
  'org-uuid'::uuid,
  'parent-category-uuid'::uuid,
  'child-category-uuid'::uuid,
  'parent_of',
  'HERA.INVENTORY.CATEGORY.HIERARCHY.V1'
);
```

### `hera_relationship_delete_v1`
**Purpose**: Remove relationship with audit trail

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_relationship_delete_v1(
  p_org_id UUID,
  p_relationship_id UUID,
  p_delete_reason TEXT DEFAULT 'Relationship no longer applicable'
)
RETURNS JSONB
```

---

## 💰 Transaction Functions (V2 Event-Sourced)

### `hera_txn_read_v1`
**File**: `/database/functions/v2/txn-crud.sql`
**Purpose**: Read transaction with optional line items

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_txn_read_v1(
  p_org_id UUID,
  p_transaction_id UUID,
  p_include_lines BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "id": "txn-uuid",
    "organization_id": "org-uuid",
    "transaction_type": "sale",
    "transaction_code": "SALE-2025-001",
    "transaction_date": "2025-01-15T14:30:00Z",
    "source_entity_id": "customer-uuid",
    "target_entity_id": "store-uuid",
    "total_amount": 53.95,
    "currency": "AED",
    "smart_code": "HERA.RESTAURANT.SALES.ORDER.CORE.V1",
    "reference": "Table-5-Order",
    "description": "Dine-in order",
    "status": "COMPLETED",
    "business_context": {
      "table_number": 5,
      "server": "John Doe",
      "payment_method": "credit_card"
    },
    "metadata": {
      "pos_terminal": "TERM-01",
      "receipt_printed": true
    },
    "ai_confidence": 0.95,
    "created_at": "2025-01-15T14:30:00Z",
    "updated_at": "2025-01-15T14:30:00Z",
    "version": 1,
    "lines": [
      {
        "id": "line-uuid-1",
        "line_number": 1,
        "line_type": "ITEM",
        "line_entity_id": "menu-item-uuid",
        "quantity": 2,
        "unit_price": 25.50,
        "line_amount": 51.00,
        "discount_amount": 0,
        "tax_amount": 0,
        "total_amount": 51.00,
        "currency": "AED",
        "smart_code": "HERA.RESTAURANT.SALES.LINE.ITEM.V1",
        "description": "Margherita Pizza",
        "metadata": {
          "kitchen_notes": "Extra cheese"
        }
      },
      {
        "id": "line-uuid-2",
        "line_number": 2,
        "line_type": "TAX",
        "line_amount": 2.95,
        "total_amount": 2.95,
        "smart_code": "HERA.RESTAURANT.SALES.LINE.TAX.V1",
        "description": "Sales Tax (5%)"
      }
    ]
  }
}
```

### `hera_txn_query_v1`
**Purpose**: Query transactions with flexible filters and pagination

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_txn_query_v1(
  p_org_id UUID,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Filter Options
```json
{
  "source_entity_id": "customer-uuid",
  "target_entity_id": "store-uuid",
  "transaction_type": "sale",
  "smart_code_like": "RESTAURANT",
  "date_from": "2025-01-01T00:00:00Z",
  "date_to": "2025-01-31T23:59:59Z",
  "limit": 100,
  "offset": 0,
  "include_lines": false
}
```

#### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": "txn-uuid-1",
      "transaction_type": "sale",
      "transaction_date": "2025-01-15T14:30:00Z",
      "total_amount": 53.95,
      "smart_code": "HERA.RESTAURANT.SALES.ORDER.CORE.V1"
      // ... full transaction data
    }
  ],
  "total": 25,
  "limit": 100,
  "offset": 0
}
```

### `hera_txn_reverse_v1`
**Purpose**: Immutable transaction reversal (event-sourced correction)

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_txn_reverse_v1(
  p_org_id UUID,
  p_original_txn_id UUID,
  p_reason TEXT,
  p_reversal_smart_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Reversal Logic
1. **Header Reversal**:
   - `total_amount` → `-total_amount`
   - `status` → `'REVERSAL'`
   - `description` → `'REVERSAL: ' + p_reason`

2. **Line Item Reversals**:
   - All amounts negated: `line_amount` → `-line_amount`
   - DR/CR flipped: `'DR'` ↔ `'CR'`
   - Quantities negated: `quantity` → `-quantity`
   - Unit prices preserved: `unit_price` unchanged

3. **Metadata Linking**:
   - `metadata.reversal_of` → original transaction UUID
   - `metadata.reversal_reason` → p_reason
   - `metadata.reversal_date` → current timestamp

#### Response Structure
```json
{
  "success": true,
  "data": {
    "reversal_transaction_id": "reversal-uuid",
    "original_transaction_id": "original-uuid",
    "lines_reversed": 2,
    "reversal_reason": "Customer cancellation - order mistake"
  }
}
```

---

## 🔧 Utility Functions

### `hera_validate_smart_code`
**Purpose**: Validate smart code format compliance

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_validate_smart_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
```

#### Validation Rules
- **Pattern**: `^HERA\.[A-Z0-9]+(\.[A-Z0-9]+){4,}\.V[0-9]+$`
- **Requirements**:
  - Must start with `HERA.`
  - UPPERCASE letters and numbers only
  - Minimum 6 segments (5 business + version)
  - Must end with `.V` + version number
- **Examples**:
  - ✅ `HERA.RESTAURANT.SALES.ORDER.CORE.V1`
  - ✅ `HERA.CRM.CUSTOMER.PROFILE.PREMIUM.V2`
  - ❌ `hera.restaurant.sales.v1` (lowercase)
  - ❌ `HERA.SALES.V1` (insufficient segments)

### `hera_assert_txn_org`
**Purpose**: Security assertion for transaction organization ownership

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_assert_txn_org(
  p_org_id UUID,
  p_transaction_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
```

#### Usage
```sql
-- Called internally by all transaction functions
PERFORM hera_assert_txn_org(p_org_id, p_transaction_id);
-- Throws exception if transaction doesn't belong to organization
```

---

## 🚀 Performance Optimizations

### Strategic Indexing
```sql
-- Organization-first pattern (critical for multi-tenancy)
CREATE INDEX idx_universal_transactions_org_date
ON universal_transactions (organization_id, transaction_date DESC);

-- Entity relationship lookups
CREATE INDEX idx_core_relationships_org_from_to
ON core_relationships (organization_id, from_entity_id, to_entity_id);

-- Dynamic data field lookups
CREATE INDEX idx_core_dynamic_data_org_entity_field
ON core_dynamic_data (organization_id, entity_id, field_name);

-- Smart code pattern matching
CREATE INDEX idx_universal_transactions_org_smart_code
ON universal_transactions (organization_id, smart_code);
```

### Query Optimization Techniques
1. **Batch Operations**: Process multiple operations in single transaction
2. **Selective Loading**: Fetch only required fields based on use case
3. **Pagination**: Use limit/offset for large result sets
4. **Index Hints**: Force index usage for complex queries
5. **Connection Pooling**: Efficient database connection management

---

## 🔒 Security Features

### Multi-Tenant Isolation
Every function enforces organization boundary:
```sql
-- Standard pattern in all functions
WHERE organization_id = p_org_id
```

### Smart Code Validation
All operations validate smart code format before processing:
```sql
IF NOT hera_validate_smart_code(p_smart_code) THEN
    RAISE EXCEPTION 'INVALID_SMART_CODE: %', p_smart_code;
END IF;
```

### Audit Trail Generation
Every modification creates audit records:
- **Who**: User context from JWT
- **What**: Operation type and details
- **When**: Precise timestamp
- **Why**: Business reason/context
- **Where**: Source system/terminal

### Error Handling
Standardized error codes and messages:
- `ORG_MISMATCH`: Cross-organization access attempt
- `ENTITY_NOT_FOUND`: Invalid entity reference
- `INVALID_SMART_CODE`: Smart code format violation
- `REFERENTIAL_INTEGRITY`: Constraint violation
- `DUPLICATE_FIELD`: Dynamic field already exists

---

## 📊 Monitoring & Debugging

### Function Performance Metrics
Monitor these key indicators:
```sql
-- Query performance analysis
SELECT
  schemaname,
  funcname,
  calls,
  total_time,
  mean_time,
  stddev_time
FROM pg_stat_user_functions
WHERE schemaname = 'public'
  AND funcname LIKE 'hera_%'
ORDER BY total_time DESC;
```

### Common Debugging Queries
```sql
-- Check organization isolation
SELECT DISTINCT organization_id
FROM universal_transactions
WHERE id = 'suspected-cross-org-txn-uuid';

-- Validate smart code compliance
SELECT smart_code, hera_validate_smart_code(smart_code)
FROM universal_transactions
WHERE NOT hera_validate_smart_code(smart_code);

-- Audit trail analysis
SELECT * FROM audit_log
WHERE entity_id = 'problematic-entity-uuid'
ORDER BY created_at DESC;
```

---

## 🔗 Integration Examples

### Node.js/Supabase Integration
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Call RPC function
const { data, error } = await supabase.rpc('hera_entity_read_v1', {
  p_org_id: 'org-uuid',
  p_entity_id: 'entity-uuid'
});

if (error) {
  console.error('RPC call failed:', error);
} else {
  console.log('Entity data:', data);
}
```

### Direct PostgreSQL Integration
```sql
-- Direct function call
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{"transaction_type": "sale", "limit": 10}'::jsonb
);
```

---

## 👥 User & Organization Management Functions (v2.3)

### `hera_onboard_user_v1` ⭐ NEW
**Status**: ✅ Production Ready (v2.3)
**Purpose**: Universal user onboarding with role and label support

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_onboard_user_v1(
  p_supabase_user_id uuid,          -- Auth user ID
  p_organization_id  uuid,          -- Tenant organization
  p_actor_user_id    uuid,          -- WHO is performing onboarding
  p_role             text DEFAULT 'member'  -- Role or label
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_supabase_user_id` (required) - Supabase auth.users.id
- `p_organization_id` (required) - Organization UUID to onboard user into
- `p_actor_user_id` (required) - Actor performing the onboarding (often same as user for self-signup)
- `p_role` (optional, default: 'member') - Canonical role or custom label

#### Role Mapping
The function implements **universal role mapping** with custom label support:

| Input Role | Canonical Role | Custom Label | Use Case |
|------------|----------------|--------------|----------|
| `owner` | `ORG_OWNER` | `null` | Organization owner (full control) |
| `admin` | `ORG_ADMIN` | `null` | Administrator |
| `manager` | `ORG_MANAGER` | `null` | Manager |
| `employee` | `ORG_EMPLOYEE` | `null` | Employee/Staff |
| `staff` | `ORG_EMPLOYEE` | `null` | Staff (alias for employee) |
| `member` | `MEMBER` | `null` | Basic member |
| `receptionist` | `ORG_EMPLOYEE` | `receptionist` | Receptionist with custom label |
| `accountant` | `ORG_EMPLOYEE` | `accountant` | Accountant with custom label |
| `nurse` | `ORG_EMPLOYEE` | `nurse` | Healthcare: Nurse |
| `engineer` | `ORG_EMPLOYEE` | `engineer` | Any custom role |

#### What It Creates
1. **User Entity** (if not exists):
   - Table: `core_entities`
   - Organization: Platform org (`00000000-0000-0000-0000-000000000000`)
   - Entity Type: `USER`
   - Smart Code: `HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1`
   - Metadata: `{ email: user_email }`

2. **Membership Relationship**:
   - Table: `core_relationships`
   - Type: `MEMBER_OF`
   - From: User entity
   - To: Organization entity
   - Smart Code: `HERA.PLATFORM.REL.MEMBER_OF.USER.v1`
   - Relationship Data: `{ role: canonical_role, label: custom_label }`

#### Usage Examples

##### Self-Signup (User is Actor)
```javascript
// New user signs up and creates organization
const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: newUser.id,
  p_organization_id: newOrg.id,
  p_actor_user_id: newUser.id,  // User onboards themselves
  p_role: 'owner'
});

console.log(data);
// {
//   success: true,
//   user_entity_id: 'user-uuid',
//   membership_id: 'membership-uuid',
//   role: 'ORG_OWNER',
//   label: null,
//   message: 'User membership + role setup complete'
// }
```

##### Admin Onboards Staff with Custom Label
```javascript
// Owner adds receptionist to organization
const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: staffUser.id,
  p_organization_id: org.id,
  p_actor_user_id: ownerUser.id,  // Owner is the actor
  p_role: 'receptionist'  // Custom label
});

console.log(data);
// {
//   success: true,
//   user_entity_id: 'staff-uuid',
//   membership_id: 'membership-uuid',
//   role: 'ORG_EMPLOYEE',
//   label: 'receptionist',
//   message: 'User membership + role setup complete'
// }
```

##### Healthcare: Add Nurse
```javascript
const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: nurseUser.id,
  p_organization_id: clinic.id,
  p_actor_user_id: adminUser.id,
  p_role: 'nurse'
});

// Result: role='ORG_EMPLOYEE', label='nurse'
```

#### Response Structure
```json
{
  "success": true,
  "user_entity_id": "user-uuid",
  "membership_id": "membership-uuid",
  "organization_id": "org-uuid",
  "email": "user@example.com",
  "name": "User Display Name",
  "role": "ORG_OWNER",
  "label": null,
  "actor_user_id": "actor-uuid",
  "message": "User membership + role setup complete"
}
```

#### Error Handling
```json
{
  "error": "Supabase user not found: <uuid>",
  "hint": "auth_user=<uuid> org=<org-uuid> entity=<none>"
}
```

#### Key Features
- **✅ Universal Role Support**: Standard roles + custom labels
- **✅ Idempotent**: Safe to retry - upserts user entity and updates membership
- **✅ Actor Tracking**: Full audit trail with created_by/updated_by
- **✅ Smart Code Validation**: Enforces HERA DNA patterns
- **✅ Multi-Tenant Safe**: Platform org for users, tenant org for memberships
- **✅ Auth Integration**: Fetches user profile from auth.users (email, name)

#### Performance Notes
- **User Entity Upsert**: ~10-20ms
- **Membership Creation**: ~15-30ms
- **Total**: ~25-50ms (single transaction)

---

### `hera_users_list_v1` ⭐ NEW
**Status**: ✅ Production Ready (v2.3)
**Purpose**: List all users in an organization with their roles

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_users_list_v1(
  p_organization_id uuid,
  p_limit           integer DEFAULT 25,
  p_offset          integer DEFAULT 0
)
RETURNS TABLE(
  id             uuid,
  name           text,
  email          text,
  role           text,
  role_entity_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_organization_id` (required) - Organization UUID to list users from
- `p_limit` (optional, default: 25) - Maximum number of users to return
- `p_offset` (optional, default: 0) - Pagination offset

#### Response Structure
Returns a table with the following columns:
- `id` - User entity UUID
- `name` - User display name
- `email` - User email address (from auth.users or metadata)
- `role` - User's role in the organization (e.g., 'MEMBER', 'PLATFORM_ADMIN')
- `role_entity_id` - UUID of the role entity (if using entity-based roles)

#### Usage Example
```javascript
const { data, error } = await supabase.rpc('hera_users_list_v1', {
  p_organization_id: 'org-uuid',
  p_limit: 50,
  p_offset: 0
});

console.log(data);
// [
//   {
//     id: 'user-uuid-1',
//     name: 'Admin',
//     email: 'admin@example.com',
//     role: 'PLATFORM_ADMIN',
//     role_entity_id: null
//   },
//   {
//     id: 'user-uuid-2',
//     name: 'Manager',
//     email: 'manager@example.com',
//     role: 'ORG_MANAGER',
//     role_entity_id: null
//   }
// ]
```

#### Key Features
- **✅ Pagination**: Supports limit/offset for large user lists
- **✅ Role Information**: Includes user roles within the organization
- **✅ Email Retrieval**: Fetches email from auth.users or metadata
- **✅ Multi-Tenant Safe**: Only returns users in specified organization

---

### `hera_user_orgs_list_v1` ⭐ NEW
**Status**: ✅ Production Ready (v2.3)
**Purpose**: List all organizations a user belongs to

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_user_orgs_list_v1(
  p_org_id  uuid,
  p_user_id uuid
)
RETURNS TABLE(
  id            uuid,
  name          text,
  role          text,
  is_primary    boolean,
  last_accessed timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_org_id` (required) - Organization context UUID
- `p_user_id` (required) - User entity UUID

#### Response Structure
Returns a table with the following columns:
- `id` - Organization UUID
- `name` - Organization name
- `role` - User's role in the organization
- `is_primary` - Whether this is the user's primary organization
- `last_accessed` - Timestamp of last access to this organization

#### Usage Example
```javascript
const { data, error } = await supabase.rpc('hera_user_orgs_list_v1', {
  p_org_id: 'org-uuid',
  p_user_id: 'user-uuid'
});

console.log(data);
// [
//   {
//     id: 'org-uuid-1',
//     name: 'HERA Platform',
//     role: 'PLATFORM_ADMIN',
//     is_primary: false,
//     last_accessed: '2025-10-24T15:01:35.607810+00:00'
//   },
//   {
//     id: 'org-uuid-2',
//     name: 'My Business',
//     role: 'ORG_OWNER',
//     is_primary: true,
//     last_accessed: '2025-11-10T10:00:00.000000+00:00'
//   }
// ]
```

#### Key Features
- **✅ Multi-Org Support**: Lists all organizations user has access to
- **✅ Primary Org Flag**: Identifies user's default organization
- **✅ Last Accessed**: Tracks when user last switched to each org
- **✅ Role Context**: Shows user's role in each organization

---

### `hera_user_switch_org_v1` ⭐ NEW
**Status**: ✅ Production Ready (v2.3)
**Purpose**: Switch user's active organization context

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_user_switch_org_v1(
  p_user_id         uuid,
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_user_id` (required) - User entity UUID
- `p_organization_id` (required) - Target organization UUID

#### Response Structure
```json
{
  "ok": true,
  "switched_at": "2025-11-10T13:34:21.060493+00:00",
  "primary_role": "ORG_OWNER",
  "organization_id": "org-uuid",
  "organization_name": "My Business"
}
```

#### Usage Example
```javascript
const { data, error } = await supabase.rpc('hera_user_switch_org_v1', {
  p_user_id: 'user-uuid',
  p_organization_id: 'target-org-uuid'
});

console.log(data);
// {
//   ok: true,
//   switched_at: '2025-11-10T13:34:21.060493+00:00',
//   primary_role: 'ORG_OWNER',
//   organization_id: 'target-org-uuid',
//   organization_name: 'My Business'
// }

// Update UI context
setCurrentOrganization(data.organization_id);
```

#### Key Features
- **✅ Context Switching**: Updates user's active organization
- **✅ Timestamp Tracking**: Records when switch occurred
- **✅ Role Verification**: Returns user's role in target organization
- **✅ Membership Validation**: Ensures user has access to target org

#### Use Cases
- Multi-organization user switching contexts
- Admin managing multiple client organizations
- Contractor accessing different customer organizations

---

### `hera_user_remove_from_org_v1` ⭐ NEW
**Status**: ✅ Production Ready (v2.3)
**Purpose**: Remove user from organization (delete membership)

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_user_remove_from_org_v1(
  p_organization_id uuid,
  p_user_id         uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_organization_id` (required) - Organization UUID
- `p_user_id` (required) - User entity UUID to remove

#### Response Structure
```json
{
  "success": true,
  "message": "User removed from organization",
  "user_id": "user-uuid",
  "organization_id": "org-uuid"
}
```

#### Usage Example
```javascript
const { data, error } = await supabase.rpc('hera_user_remove_from_org_v1', {
  p_organization_id: 'org-uuid',
  p_user_id: 'user-uuid-to-remove'
});

console.log(data);
// {
//   success: true,
//   message: 'User removed from organization',
//   user_id: 'user-uuid-to-remove',
//   organization_id: 'org-uuid'
// }
```

#### Key Features
- **✅ Clean Removal**: Deletes MEMBER_OF relationship
- **✅ User Entity Preserved**: Only removes membership, not user entity
- **✅ Multi-Tenant Safe**: Only affects specified organization
- **⚠️ Permanent**: User loses access to organization immediately

#### Use Cases
- Remove employee who left the company
- Revoke contractor access after project completion
- Clean up inactive user accounts

#### Important Notes
- **Does NOT delete** the user entity (user can still access other organizations)
- **Immediately revokes** all access to the organization
- **Audit trail**: Operation is tracked via relationship deletion
- **No undo**: Requires re-onboarding via `hera_onboard_user_v1` to restore access

---

### `hera_organizations_crud_v1` ⭐ NEW
**Status**: ⚠️ Requires `version` Column (v2.3)
**Purpose**: Full CRUD operations for organizations with RBAC and optimistic concurrency

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_organizations_crud_v1(
  p_action        text,            -- 'CREATE' | 'UPDATE' | 'GET' | 'LIST' | 'ARCHIVE'
  p_actor_user_id uuid,            -- USER entity id (actor)
  p_payload       jsonb DEFAULT '{}'::jsonb,
  p_limit         int  DEFAULT 50,
  p_offset        int  DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_action` (required) - Operation: `CREATE`, `UPDATE`, `GET`, `LIST`, `ARCHIVE`
- `p_actor_user_id` (required for mutations) - Actor user entity ID
- `p_payload` (required) - Operation-specific data (JSONB)
- `p_limit` (optional, default: 50) - For LIST operations
- `p_offset` (optional, default: 0) - For LIST operations

#### CREATE Payload
```typescript
{
  organization_name: string,        // Required
  organization_code: string,        // Required - Unique identifier
  organization_type: string,        // Required - 'business_unit' | 'branch' | 'division' | 'partner'
  industry_classification?: string, // Optional - e.g., 'beauty_salon', 'healthcare'
  parent_organization_id?: uuid,    // Optional - For hierarchies
  settings?: {                      // Optional - JSONB settings
    currency?: string,
    selected_app?: string,
    theme?: object
  },
  status?: string,                  // Optional - Default: 'active'
  bootstrap?: boolean,              // Optional - Auto-onboard actor as owner
  owner_user_id?: uuid,             // Optional - Explicit owner (platform admin use)
  members?: [                       // Optional - Bulk onboard members
    {
      user_id: uuid,
      role: string  // 'owner' | 'admin' | 'manager' | custom label
    }
  ]
}
```

#### Usage Examples

##### CREATE with Bootstrap (Signup Flow)
```javascript
// User signs up and creates their organization
const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: newUser.id,
  p_payload: {
    organization_name: 'My Salon',
    organization_code: 'ORG-' + Date.now().toString(36).toUpperCase(),
    organization_type: 'business_unit',
    industry_classification: 'beauty_salon',
    settings: {
      currency: 'USD',
      selected_app: 'salon'
    },
    status: 'active',
    bootstrap: true  // Auto-onboard actor as owner
  }
});

console.log(data);
// {
//   action: 'CREATE',
//   organization: { ...org details... }
// }
```

##### CREATE with Explicit Owner and Members
```javascript
// Platform admin creates org for client with team
const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: platformAdminId,
  p_payload: {
    organization_name: 'Enterprise Client',
    organization_code: 'ENT-12345',
    organization_type: 'business_unit',
    industry_classification: 'professional_services',
    owner_user_id: clientOwnerId,  // Explicit owner
    members: [
      { user_id: managerId, role: 'manager' },
      { user_id: staffId1, role: 'receptionist' },
      { user_id: staffId2, role: 'accountant' }
    ]
  }
});
```

##### UPDATE (Requires version column)
```javascript
const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: ownerId,
  p_payload: {
    id: orgId,
    organization_name: 'Updated Name',
    if_match_version: 1  // Optimistic concurrency control
  }
});
```

##### GET
```javascript
const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'GET',
  p_actor_user_id: userId,
  p_payload: {
    id: orgId
  }
});
```

##### LIST
```javascript
const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'LIST',
  p_actor_user_id: userId,
  p_limit: 50,
  p_offset: 0
});
```

#### Response Structures

##### CREATE Success
```json
{
  "action": "CREATE",
  "organization": {
    "id": "org-uuid",
    "organization_name": "My Salon",
    "organization_code": "ORG-MH0RCR8M",
    "organization_type": "business_unit",
    "industry_classification": "beauty_salon",
    "settings": {
      "currency": "USD",
      "selected_app": "salon"
    },
    "status": "active",
    "created_at": "2025-10-21T14:00:00Z",
    "created_by": "user-uuid"
  }
}
```

#### RBAC (Role-Based Access Control)
- **CREATE**: Platform admins only (unless `bootstrap=true`)
- **UPDATE**: `ORG_OWNER` or `ORG_ADMIN` only
- **ARCHIVE**: `ORG_OWNER` or `ORG_ADMIN` only
- **GET**: Any member of organization
- **LIST**: Returns only orgs where user is a member (via RLS)

#### Key Features
- **✅ Unified Onboarding**: Delegates to `hera_onboard_user_v1` for all user-org links
- **✅ Bootstrap Mode**: Self-service signup (actor becomes owner)
- **✅ Bulk Members**: Onboard multiple users atomically
- **✅ RBAC**: Role-based access control enforced
- **✅ Optimistic Concurrency**: Version-based conflict detection (requires `version` column)
- **✅ Audit Trail**: Full actor stamping (created_by, updated_by)

#### Known Limitations
- **⚠️ Requires `version` Column**: Current `core_organizations` table missing this column
- **Workaround**: Use direct table insert for organization creation until migration adds `version` column

---

**Last Updated**: November 11, 2025
**Version**: 2.4.0
**Status**: ✅ Production Ready

## 📱 App Management Functions (v2.4) ⭐ **NEW**

### `hera_apps_register_v1` ⭐ **NEW - PRODUCTION READY**
**Status**: ✅ 100% Success Rate (MCP-tested 2025-11-11)
**Purpose**: Register/create new app in HERA platform catalog

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_apps_register_v1(
  p_actor_user_id uuid,          -- WHO is registering the app
  p_payload jsonb                 -- App registration data
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

**`p_actor_user_id`** (required)
- Platform admin user UUID
- Used for audit trail

**`p_payload`** (object)
```typescript
{
  code: string,               // Required - UPPERCASE alphanumeric, no underscores/spaces (e.g., "SALON", "CRM")
  name: string,               // Required - Display name
  smart_code: string,         // Required - HERA DNA pattern (e.g., "HERA.PLATFORM.APP.ENTITY.SALON.v1")
  status?: string,            // Optional - 'active' | 'inactive' (default: 'active')
  metadata?: {                // Optional - App configuration
    category?: string,
    version?: string,
    description?: string,
    icon?: string,
    features?: string[]
  }
}
```

#### Usage Example
```javascript
const { data, error } = await supabase.rpc('hera_apps_register_v1', {
  p_actor_user_id: platformAdminId,
  p_payload: {
    code: 'CRM',
    name: 'HERA CRM',
    smart_code: 'HERA.PLATFORM.APP.ENTITY.CRM.v1',
    status: 'active',
    metadata: {
      category: 'business',
      version: '1.0.0',
      description: 'Customer Relationship Management',
      icon: 'Users',
      features: ['contacts', 'leads', 'opportunities', 'pipeline']
    }
  }
})

console.log('Registered App ID:', data.app.id)
```

#### Response Structure
```json
{
  "app": {
    "id": "uuid",
    "code": "CRM",
    "name": "HERA CRM",
    "status": "active",
    "smart_code": "HERA.PLATFORM.APP.ENTITY.CRM.v1",
    "metadata": { ... },
    "created_at": "2025-11-11T...",
    "updated_at": "2025-11-11T..."
  }
}
```

#### Validation Rules
- ✅ `code` must be UPPERCASE alphanumeric only (no underscores, spaces, or special characters)
- ✅ `code` must be unique in platform catalog
- ✅ `smart_code` must match HERA DNA pattern
- ✅ Examples of valid codes: `SALON`, `CRM`, `FINANCE`, `WMS`, `RETAIL`
- ❌ Invalid codes: `SALON_POS`, `my-app`, `Test App`, `salon`

#### Key Features
- Platform-level app registration (organization_id = `00000000-...`)
- Strict code validation for consistency
- Automatic smart_code enforcement
- Complete audit trail with actor stamping
- Idempotent registration

---

### `hera_apps_get_v1` ⭐ **PRODUCTION READY**
**Status**: ✅ 100% Success Rate (MCP-tested)
**Purpose**: Get single app by ID or code

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_apps_get_v1(
  p_actor_user_id uuid,          -- Actor user
  p_selector jsonb                -- App selector
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

**`p_selector`** (object)
Must provide ONE of:
```typescript
{
  id?: string,      // App entity UUID
  code?: string     // App code (e.g., "SALON", "CRM")
}
```

#### Usage Examples

**Get by ID:**
```javascript
const { data } = await supabase.rpc('hera_apps_get_v1', {
  p_actor_user_id: userId,
  p_selector: { id: 'app-uuid' }
})
```

**Get by Code:**
```javascript
const { data } = await supabase.rpc('hera_apps_get_v1', {
  p_actor_user_id: userId,
  p_selector: { code: 'SALON' }
})
```

#### Response Structure
```json
{
  "app": {
    "id": "uuid",
    "code": "SALON",
    "name": "HERA Salon Management",
    "status": "active",
    "metadata": {
      "icon": "scissors",
      "category": "retail",
      "industry": "beauty_wellness",
      "ui_route": "/salon",
      "features": { ... }
    },
    "smart_code": "HERA.PLATFORM.APP.ENTITY.SALON.v1",
    "created_at": "2025-10-30T...",
    "updated_at": "2025-11-02T...",
    "business_rules": { ... }
  }
}
```

#### Error Handling
```javascript
// Invalid selector
Error: "hera_apps_get_v1: provide 'id' or 'code' in selector. Example: {\"code\":\"SALON\"} or {\"id\":\"uuid\"}"

// App not found
Error: "App not found with code: INVALID"

// Lowercase code
Error: "Invalid code \"salon\": must be UPPERCASE alphanumeric with no underscores/spaces. Examples: SALON, CRM, FINANCE"
```

---

### `hera_apps_list_v1` ⭐ **PRODUCTION READY**
**Status**: ✅ 100% Success Rate (MCP-tested)
**Purpose**: List apps with optional filters

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_apps_list_v1(
  p_actor_user_id uuid,                    -- Actor user
  p_filters jsonb DEFAULT '{}'::jsonb      -- Optional filters
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

**`p_filters`** (object - all optional)
```typescript
{
  status?: string,       // Filter by status ('active' | 'inactive')
  category?: string,     // Filter by metadata.category
  limit?: number,        // Max results (default: 50)
  offset?: number        // Pagination offset (default: 0)
}
```

#### Usage Examples

**List all active apps:**
```javascript
const { data } = await supabase.rpc('hera_apps_list_v1', {
  p_actor_user_id: userId,
  p_filters: {
    status: 'active',
    limit: 10
  }
})

console.log(`Found ${data.total} apps`)
data.items.forEach(app => {
  console.log(`- ${app.name} (${app.code})`)
})
```

**List all apps (no filters):**
```javascript
const { data } = await supabase.rpc('hera_apps_list_v1', {
  p_actor_user_id: userId,
  p_filters: {}
})
```

**Pagination:**
```javascript
// Get apps 11-20
const { data } = await supabase.rpc('hera_apps_list_v1', {
  p_actor_user_id: userId,
  p_filters: {
    limit: 10,
    offset: 10
  }
})
```

#### Response Structure
```json
{
  "items": [
    {
      "id": "uuid",
      "code": "SALON",
      "name": "HERA Salon Management",
      "status": "active",
      "metadata": { ... },
      "smart_code": "HERA.PLATFORM.APP.ENTITY.SALON.v1",
      "created_at": "2025-10-30T...",
      "updated_at": "2025-11-02T...",
      "business_rules": { ... }
    },
    {
      "id": "uuid",
      "code": "CRM",
      "name": "HERA CRM",
      "status": "active",
      ...
    }
  ],
  "total": 4,
  "limit": 50,
  "offset": 0,
  "action": "LIST"
}
```

#### Key Features
- Flexible filtering by status, category
- Pagination support with limit/offset
- Returns complete app details including business_rules
- Default limit: 50 apps
- Sorted by creation date (newest first)

---

### `hera_apps_update_v1` ⭐ **PRODUCTION READY**
**Status**: ✅ 100% Success Rate (MCP-tested)
**Purpose**: Update app details

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_apps_update_v1(
  p_actor_user_id uuid,          -- WHO is updating
  p_payload jsonb                 -- Update data
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

**`p_payload`** (object)
```typescript
{
  id: string,                 // Required - App UUID (use "id" not "entity_id")
  name?: string,              // Optional - Updated display name
  status?: string,            // Optional - 'active' | 'inactive'
  metadata?: object,          // Optional - Updated metadata (full replacement)
  business_rules?: object     // Optional - Updated business rules
}
```

#### Usage Example
```javascript
const { data, error } = await supabase.rpc('hera_apps_update_v1', {
  p_actor_user_id: platformAdminId,
  p_payload: {
    id: 'app-uuid',
    name: 'HERA CRM Enterprise',
    status: 'active',
    metadata: {
      category: 'business',
      version: '2.0.0',
      description: 'Updated CRM with AI features',
      icon: 'Sparkles',
      features: ['contacts', 'leads', 'opportunities', 'pipeline', 'ai-insights']
    }
  }
})

console.log('Updated app:', data.app.name)
```

#### Response Structure
```json
{
  "app": {
    "id": "uuid",
    "code": "CRM",
    "name": "HERA CRM Enterprise",
    "status": "active",
    "metadata": {
      "version": "2.0.0",
      ...
    },
    "smart_code": "HERA.PLATFORM.APP.ENTITY.CRM.v1",
    "updated_at": "2025-11-11T..."
  }
}
```

#### Validation Rules
- ✅ Must provide `id` (not `entity_id`)
- ✅ Cannot update `code` (immutable after creation)
- ✅ Cannot update `smart_code` (immutable)
- ✅ `metadata` is full replacement (not merge)
- ✅ Actor stamping enforced (`updated_by`)

#### Error Handling
```javascript
// Missing ID
Error: "Provide \"id\" or \"code\" to identify the APP"

// Invalid app ID
Error: "App not found with id: invalid-uuid"
```

#### Key Features
- Patch-based updates (only send changed fields)
- Immutable fields protected (code, smart_code)
- Full metadata replacement (ensure complete object)
- Audit trail with updated_by and updated_at
- Idempotent updates

---

## 🆕 Recent Updates (v2.4.0)
- ✅ **Added 4 App Management RPC Functions** (2025-11-11) - Platform app catalog management
  - `hera_apps_register_v1` - Register/create new apps in platform catalog
  - `hera_apps_get_v1` - Get single app by ID or code
  - `hera_apps_list_v1` - List apps with filters and pagination
  - `hera_apps_update_v1` - Update app details (name, status, metadata)
  - **Validation**: UPPERCASE alphanumeric codes only (no underscores/spaces)
  - **MCP-tested**: 100% success rate (7/7 tests passing)
  - **Production Ready**: Full CRUD lifecycle validated

## Previous Updates (v2.3.0)
- ✅ Added `hera_users_list_v1` - List all users in an organization with pagination
  - Returns user ID, name, email, role, and role entity ID
  - Supports limit/offset pagination
  - MCP-tested: 100% success rate
- ✅ Added `hera_user_orgs_list_v1` - List all organizations a user belongs to
  - Shows organization ID, name, role, primary flag, and last accessed timestamp
  - Multi-organization support
  - MCP-tested: 100% success rate
- ✅ Added `hera_user_switch_org_v1` - Switch user's active organization context
  - Updates user's current organization
  - Returns switched timestamp and role verification
  - MCP-tested: 100% success rate
- ✅ Added `hera_user_remove_from_org_v1` - Remove user from organization
  - Deletes MEMBER_OF relationship (preserves user entity)
  - Immediate access revocation
  - MCP-tested: Production validated
- ✅ Added `hera_onboard_user_v1` - Universal user onboarding with role/label support
  - Supports canonical roles: `ORG_OWNER`, `ORG_ADMIN`, `ORG_MANAGER`, `ORG_EMPLOYEE`, `MEMBER`
  - Custom labels for industry-specific roles: `receptionist`, `nurse`, `engineer`, etc.
  - Idempotent upsert for user entities and memberships
  - Full actor tracking and audit trail
  - MCP-tested: 100% success rate
- ✅ Added `hera_organizations_crud_v1` - Full CRUD for organizations
  - Bootstrap mode for self-service signup
  - Bulk member onboarding
  - RBAC enforcement (platform admins, org owners)
  - Optimistic concurrency control (requires `version` column migration)
  - Uses `hera_onboard_user_v1` internally for all user-org links
- ✅ Added `hera_dynamic_data_batch_v1` - Batch upsert with atomic guarantees (13/13 tests passing)
- ✅ Added `hera_dynamic_data_delete_v1` - Flexible field deletion with cascade support
- ✅ Updated `hera_entity_delete_v1` - **Smart delete with HARD/SOFT fallback strategy**
  - Implements intelligent 3-step delete: CASCADE → HARD DELETE → SOFT FALLBACK
  - Automatic archive when entity is referenced (FK-safe)
  - Returns detailed mode information: `HARD`, `SOFT_FALLBACK`, `ERROR`, or `NONE`
  - Fine-grained cascade control for dynamic data and relationships
  - Production-tested with orchestrator RPC (13/13 tests passing)
- ✅ Enhanced documentation with comprehensive examples and use cases
- ✅ Deprecated legacy `hera_dynamic_data_v1` in favor of batch function