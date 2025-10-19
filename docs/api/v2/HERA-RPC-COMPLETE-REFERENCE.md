# HERA RPC Complete Reference Guide

**Definitive Reference for All Working RPC Functions**
**Status**: ✅ Production Verified
**Last Updated**: 2025-10-18
**Version**: 2.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [🌟 Universal Orchestrator RPC](#universal-orchestrator-rpc) **← NEW!**
4. [Entity RPCs (v1)](#entity-rpcs-v1)
5. [Dynamic Data RPCs](#dynamic-data-rpcs)
6. [Relationship RPCs](#relationship-rpcs)
7. [Transaction RPCs](#transaction-rpcs)
8. [Common Patterns](#common-patterns)
9. [Error Handling](#error-handling)
10. [Performance Best Practices](#performance-best-practices)

---

## 🎯 Overview

HERA's RPC functions provide database-level operations for the Sacred Six tables with:

- **Multi-tenant isolation** via `organization_id`
- **Actor-based audit trails** with `p_actor_user_id`
- **Smart code validation** on all operations
- **Complete CRUD operations** for all entities
- **Batch processing support** for performance
- **Relationship-based workflows** instead of status columns

---

## 🔑 Core Principles

### 1. Organization Isolation (Sacred Boundary)
```typescript
// ALWAYS required in every RPC call
p_organization_id: UUID  // Multi-tenant boundary
```

### 2. Actor-Based Audit Trail
```typescript
// WHO is making the change (for audit trail)
p_actor_user_id: UUID  // Optional but recommended
```

### 3. Smart Code Format
```typescript
// HERA DNA smart code validation
// Format: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{N}
// Regex: ^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$

// ✅ Valid examples:
'HERA.SALON.PROD.CATEGORY.FIELD.V1'
'HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1'
'HERA.FIN.GL.ACCOUNT.ENTITY.V1'

// ❌ Invalid examples:
'HERA.SALON.V1'  // Too few segments (need min 6)
'hera.salon.prod.v1'  // Lowercase (must be uppercase)
'HERA.SALON.PROD.v1'  // Lowercase 'v' (must be .V1)
```

### 4. Field Placement Policy
```typescript
// ✅ Business data → core_dynamic_data
price, color, category, description, icon
→ Use hera_dynamic_data_batch_v1

// ✅ System metadata → metadata column
ai_confidence, ai_classification, ai_insights
→ Include in p_metadata with metadata_category

// ❌ Status → NEVER use columns
→ Use hera_relationship_create_v1 with status entity
```

---

## 🌟 Universal Orchestrator RPC

### `hera_entities_crud_v1` ⭐ **RECOMMENDED**

**Purpose**: Universal orchestrator for complete entity CRUD operations in a single call
**Status**: ✅ Production Ready (12/12 tests passing, 100% success rate)
**Performance**: Avg 97ms (67-171ms range)
**Test Coverage**: 100% (All features validated)

**Why Use This?**
- **Single API call** replaces 3-5 v1 RPC calls
- **Atomic operations** - all changes succeed or fail together
- **Complete response** - returns entity + dynamic_data + relationships
- **Enterprise security** - actor + membership + smart code validation built-in
- **Battle-tested** - 12 comprehensive production tests passing

**Function Signature**:
```sql
hera_entities_crud_v1(
  p_action            text,                       -- 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id     uuid,                       -- Actor entity (required for mutations*)
  p_organization_id   uuid,                       -- REQUIRED - tenant boundary
  p_entity            jsonb DEFAULT '{}'::jsonb,  -- Entity header fields
  p_dynamic           jsonb DEFAULT '{}'::jsonb,  -- Dynamic fields object
  p_relationships     jsonb DEFAULT '{}'::jsonb,  -- Relationships by type
  p_options           jsonb DEFAULT '{}'::jsonb   -- Configuration options
)
RETURNS jsonb
```

**Complete CREATE Example**:
```typescript
// Create entity with dynamic fields and relationships in ONE call
const result = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_entity: {
    entity_type: 'product',
    entity_name: 'Premium Hair Treatment',
    smart_code: 'HERA.SALON.PRODUCT.SERVICE.TREATMENT.v1',  // Auto-normalizes to .v1
    entity_code: 'PROD-001',
    tags: ['premium', 'featured']
  },
  p_dynamic: {
    price: {
      value: '99.99',
      type: 'number',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.v1'
    },
    color: {
      value: '#8B5CF6',
      type: 'text',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.COLOR.v1'
    },
    featured: {
      value: 'true',
      type: 'boolean',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.FEATURED.v1'
    }
  },
  p_relationships: {
    HAS_CATEGORY: ['category-uuid'],
    HAS_STATUS: ['status-active-uuid']
  },
  p_options: {
    include_dynamic: true,
    include_relationships: true,
    relationships_mode: 'UPSERT'  // or 'REPLACE'
  }
})
```

**Response Structure**:
```json
{
  "success": true,
  "action": "CREATE",
  "entity_id": "new-entity-uuid",
  "data": {
    "entity": {
      "id": "new-entity-uuid",
      "entity_type": "product",
      "entity_name": "Premium Hair Treatment",
      "smart_code": "HERA.SALON.PRODUCT.SERVICE.TREATMENT.v1",
      "created_by": "user-uuid",
      "updated_by": "user-uuid",
      "created_at": "2025-10-18T10:00:00Z",
      "updated_at": "2025-10-18T10:00:00Z"
    },
    "dynamic_data": [
      {
        "field_name": "price",
        "field_type": "number",
        "field_value_number": 99.99,
        "smart_code": "HERA.SALON.PRODUCT.FIELD.PRICE.v1"
      }
    ],
    "relationships": [
      {
        "relationship_type": "HAS_CATEGORY",
        "to_entity_id": "category-uuid",
        "is_active": true
      }
    ]
  }
}
```

**Key Features**:

✅ **Complete CRUD**: CREATE, READ, UPDATE, DELETE in one function
✅ **Atomic Operations**: Entity + dynamic + relationships transactional
✅ **Smart Code Normalization**: Auto-converts `.V1` → `.v1`
✅ **Security Guardrails**: Organization + actor + membership validation
✅ **Relationship Modes**: UPSERT (add/update) or REPLACE (exact match)
✅ **Platform Identity**: USER/ROLE creation with system_actor_user_id
✅ **List Mode Performance**: HEADERS (fast) or FULL (complete) for list queries
✅ **Full Response**: Returns complete entity snapshot
✅ **Type-Safe Dynamic Fields**: Automatic text/number/boolean/date/json conversion

**List Mode (READ Performance Optimization)**:

**HEADERS Mode** - Fast list for UI dropdowns/tables:
```typescript
// Only core fields: id, type, name, code, smart_code, status, created_at, updated_at
const result = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_entity: {
    entity_type: 'product'  // No entity_id = list read
  },
  p_options: {
    list_mode: 'HEADERS',  // Skip dynamic_data and relationships
    limit: 100
  }
})

// Response: { success: true, action: 'READ', data: { list: [{id, entity_type, entity_name, ...}] } }
```

**FULL Mode** (default) - Complete data for detail views:
```typescript
// Includes entity + dynamic_data[] + relationships[]
const result = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_entity: {
    entity_type: 'product'
  },
  p_options: {
    list_mode: 'FULL',  // Default - includes all related data
    include_dynamic: true,
    include_relationships: true
  }
})

// Response: { success: true, action: 'READ', data: { list: [{entity, dynamic_data, relationships}] } }
```

**When to Use Each Mode:**
- **HEADERS**: Dropdown lists, data tables, autocomplete searches (10x faster)
- **FULL**: Detail views, forms with all fields, entity editing

**Relationship Modes**:

**UPSERT Mode** (default) - Add without removing:
```typescript
// Existing: HAS_CATEGORY → [cat1]
p_relationships: { HAS_CATEGORY: [cat2] }
// Result: HAS_CATEGORY → [cat1, cat2]  ← Adds cat2, keeps cat1
```

**REPLACE Mode** - Make exact match:
```typescript
// Existing: HAS_CATEGORY → [cat1, cat2]
p_relationships: { HAS_CATEGORY: [cat3] }
p_options: { relationships_mode: 'REPLACE' }
// Result: HAS_CATEGORY → [cat3]  ← Removes cat1, cat2; adds cat3
```

**Platform Identity (USER/ROLE Creation)**:
```typescript
// Create USER in platform org
const user = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: null,  // Not used for platform identity
  p_organization_id: '00000000-0000-0000-0000-000000000000',
  p_entity: {
    entity_type: 'USER',
    entity_name: 'John Doe',
    smart_code: 'HERA.SEC.USER.ENTITY.ACCOUNT.v1'
  },
  p_dynamic: {
    email: { value: 'john@example.com', type: 'text', smart_code: 'HERA.SEC.USER.DYN.EMAIL.v1' }
  },
  p_options: {
    allow_platform_identity: true,
    system_actor_user_id: 'admin-user-uuid'  // REQUIRED for audit stamping
  }
})
```

**Options Reference**:

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `include_dynamic` | boolean | true | Include dynamic_data in response |
| `include_relationships` | boolean | true | Include relationships in response |
| `limit` | integer | 100 | Pagination limit (READ) |
| `offset` | integer | 0 | Pagination offset (READ) |
| `list_mode` | string | 'FULL' | 'HEADERS' (fast, core fields only) or 'FULL' (with dynamic+rels) for list reads |
| `relationships_mode` | string | 'UPSERT' | 'UPSERT' or 'REPLACE' |
| `relationship_smart_code` | string | null | Smart code for relationship upserts |
| `allow_platform_identity` | boolean | false | Allow USER/ROLE creation in platform org |
| `system_actor_user_id` | uuid | null | System actor for platform identity (required) |
| `audit` | boolean | false | Emit audit transaction |

**Error Codes**:

| Error Code | Cause | Fix |
|------------|-------|-----|
| `HERA_INVALID_ACTION` | Invalid p_action | Use CREATE, READ, UPDATE, DELETE |
| `HERA_ORG_REQUIRED` | Missing organization_id | Provide p_organization_id |
| `HERA_ACTOR_REQUIRED` | Missing actor for mutation | Provide p_actor_user_id |
| `HERA_ACTOR_NOT_MEMBER` | Actor not member of org | Create MEMBER_OF relationship |
| `HERA_SMARTCODE_INVALID` | Invalid smart code format | Use HERA.{DOMAIN}...v{N} pattern |
| `HERA_DYN_SMARTCODE_REQUIRED` | Missing smart_code for dynamic field | Provide smart_code for each field |
| `HERA_PLATFORM_ORG_WRITE_FORBIDDEN` | Unauthorized platform write | Use USER/ROLE or set allow_platform_identity |
| `HERA_PLATFORM_IDENTITY_REQUIRES_SYSTEM_ACTOR` | Missing system_actor_user_id | Provide system_actor_user_id in options |
| `HERA_MISSING_FIELDS` | Missing required fields | Provide entity_type, entity_name, smart_code |
| `HERA_MISSING_ENTITY_ID` | Missing entity_id | Provide entity_id for UPDATE/DELETE |
| `HERA_REL_MODE_INVALID` | Invalid relationships_mode | Use UPSERT or REPLACE |
| `HERA_LIST_MODE_INVALID` | Invalid list_mode | Use HEADERS or FULL |

**Production Ready Checklist**:
- [x] All 12 tests passing (100% success rate)
- [x] Security guardrails enforced
- [x] Performance validated (<100ms average)
- [x] Response structure complete
- [x] Relationship modes working (UPSERT + REPLACE)
- [x] Platform identity support
- [x] Smart code normalization
- [x] Comprehensive error handling

**📚 Full Documentation**: `/docs/api/v2/HERA-ORCHESTRATOR-RPC-GUIDE.md`

---

## 🧩 Entity RPCs (v1)

### `hera_entity_upsert_v1`

**Purpose**: Creates or updates an entity record in `core_entities`

**Function Signature**:
```sql
hera_entity_upsert_v1(
  p_organization_id uuid,           -- REQUIRED: Organization boundary
  p_entity_type text,               -- REQUIRED: Entity type (customer, product, etc)
  p_entity_name text,               -- REQUIRED: Display name
  p_smart_code text,                -- REQUIRED: HERA DNA smart code
  p_entity_id uuid DEFAULT NULL,    -- Optional: For updates (NULL = create)
  p_entity_code text DEFAULT NULL,  -- Optional: Business code (SKU, etc)
  p_entity_description text DEFAULT NULL,
  p_parent_entity_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_smart_code_status text DEFAULT NULL,
  p_business_rules jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_ai_confidence numeric DEFAULT NULL,
  p_ai_classification text DEFAULT NULL,
  p_ai_insights jsonb DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL  -- WHO is making the change
)
RETURNS text  -- Returns entity_id as TEXT
```

**Usage Example**:
```typescript
// CREATE: New entity
const result = await supabase.rpc('hera_entity_upsert_v1', {
  p_organization_id: 'org-uuid',
  p_entity_type: 'customer',
  p_entity_name: 'ACME Corporation',
  p_smart_code: 'HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1',
  p_entity_code: 'CUST-001',
  p_entity_description: 'Premium customer',
  p_metadata: {
    metadata_category: 'system_ai',
    ai_confidence: 0.95
  },
  p_actor_user_id: 'user-uuid'
})

// UPDATE: Existing entity
const updateResult = await supabase.rpc('hera_entity_upsert_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'existing-entity-uuid',  // Triggers update
  p_entity_type: 'customer',
  p_entity_name: 'ACME Corporation Ltd',  // Updated name
  p_smart_code: 'HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1',
  p_actor_user_id: 'user-uuid'
})
```

**Response**:
```typescript
// Success
{ data: "entity-uuid", error: null }

// Error
{ data: null, error: { message: "Error details", code: "ERROR_CODE" } }
```

---

### `hera_entity_read_v1`

**Purpose**: Reads entity details with optional dynamic data and relationships

**Function Signature**:
```sql
hera_entity_read_v1(
  p_organization_id uuid,                    -- REQUIRED
  p_entity_id uuid DEFAULT NULL,             -- Filter by ID
  p_entity_type text DEFAULT NULL,           -- Filter by type
  p_entity_code text DEFAULT NULL,           -- Filter by code
  p_smart_code text DEFAULT NULL,            -- Filter by smart code
  p_status text DEFAULT NULL,                -- Filter by status
  p_include_relationships boolean DEFAULT false,
  p_include_dynamic_data boolean DEFAULT false,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Read single entity with dynamic data
const result = await supabase.rpc('hera_entity_read_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_include_dynamic_data: true,
  p_include_relationships: true
})
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "entity-uuid",
      "organization_id": "org-uuid",
      "entity_type": "customer",
      "entity_name": "ACME Corporation",
      "smart_code": "HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1",
      "created_by": "user-uuid",
      "updated_by": "user-uuid",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    "dynamic_data": [
      {
        "id": "dyn-uuid",
        "field_name": "credit_limit",
        "field_type": "number",
        "field_value_number": 50000,
        "smart_code": "HERA.CRM.CUSTOMER.FIELD.CREDIT.V1"
      }
    ],
    "relationships": [
      {
        "id": "rel-uuid",
        "from_entity_id": "entity-uuid",
        "to_entity_id": "status-uuid",
        "relationship_type": "HAS_STATUS"
      }
    ]
  }
}
```

---

### `hera_entity_read_with_branch_v1`

**Purpose**: Reads entities with branch/location context (multi-location support)

**Function Signature**:
```sql
hera_entity_read_with_branch_v1(
  p_organization_id uuid,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_branch_id uuid DEFAULT NULL,           -- Filter by branch/location
  p_relationship_type text DEFAULT NULL,
  p_include_relationships boolean DEFAULT false,
  p_include_dynamic_data boolean DEFAULT false,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Get all products for a specific branch
const result = await supabase.rpc('hera_entity_read_with_branch_v1', {
  p_organization_id: 'org-uuid',
  p_entity_type: 'product',
  p_branch_id: 'branch-uuid',
  p_include_dynamic_data: true
})
```

---

### `hera_entity_delete_v1`

**Purpose**: Deletes (soft/hard) an entity with optional cascade

**Function Signature**:
```sql
hera_entity_delete_v1(
  p_organization_id uuid,
  p_entity_id uuid,
  p_cascade_dynamic_data boolean DEFAULT true,
  p_cascade_relationships boolean DEFAULT true
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Soft delete entity with cascade
const result = await supabase.rpc('hera_entity_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_cascade_dynamic_data: true,
  p_cascade_relationships: true
})
```

**Response**:
```json
{
  "success": true,
  "data": {
    "entity_id": "entity-uuid",
    "deleted_at": "2025-01-15T14:30:00Z",
    "dynamic_fields_deleted": 5,
    "relationships_removed": 2
  }
}
```

---

### `hera_entity_recover_v1`

**Purpose**: Recovers archived or soft-deleted entities

**Function Signature**:
```sql
hera_entity_recover_v1(
  p_organization_id uuid,
  p_entity_id uuid,
  p_set_status text DEFAULT 'active',
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Recover deleted entity
const result = await supabase.rpc('hera_entity_recover_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'deleted-entity-uuid',
  p_set_status: 'active',
  p_actor_user_id: 'user-uuid'
})
```

---

### `hera_entity_profiles`

**Purpose**: Returns summarized entity profiles for analytics/reporting

**Function Signature**:
```sql
hera_entity_profiles(
  p_organization_id uuid,
  p_entity_type text DEFAULT NULL,
  p_smartcode_like text DEFAULT NULL  -- Pattern matching for smart codes
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Get all customer profiles
const result = await supabase.rpc('hera_entity_profiles', {
  p_organization_id: 'org-uuid',
  p_entity_type: 'customer'
})

// Get salon service profiles
const salonResult = await supabase.rpc('hera_entity_profiles', {
  p_organization_id: 'org-uuid',
  p_smartcode_like: 'HERA.SALON%'
})
```

---

## 📦 Dynamic Data RPCs

### `hera_dynamic_data_set_v1`

**Purpose**: Creates or updates a single dynamic field for an entity

**Function Signature**:
```sql
hera_dynamic_data_set_v1(
  p_organization_id uuid,
  p_entity_id uuid,
  p_field_name text,
  p_field_type text,  -- 'text', 'number', 'boolean', 'date', 'json'
  p_field_value_text text DEFAULT NULL,
  p_field_value_number numeric DEFAULT NULL,
  p_field_value_boolean boolean DEFAULT NULL,
  p_field_value_date timestamptz DEFAULT NULL,
  p_field_value_json jsonb DEFAULT NULL,
  p_smart_code text DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Set text field
await supabase.rpc('hera_dynamic_data_set_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_field_name: 'color',
  p_field_type: 'text',
  p_field_value_text: '#8B5CF6',
  p_smart_code: 'HERA.SALON.PRODUCT.FIELD.COLOR.V1',
  p_actor_user_id: 'user-uuid'
})

// Set number field
await supabase.rpc('hera_dynamic_data_set_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_field_name: 'price',
  p_field_type: 'number',
  p_field_value_number: 99.99,
  p_smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
})

// Set JSON field
await supabase.rpc('hera_dynamic_data_set_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_field_name: 'metadata',
  p_field_type: 'json',
  p_field_value_json: { category: 'premium', tags: ['featured'] },
  p_smart_code: 'HERA.SALON.PRODUCT.FIELD.META.V1'
})
```

---

### `hera_dynamic_data_get_v1`

**Purpose**: Retrieves dynamic fields for a given entity

**Function Signature**:
```sql
hera_dynamic_data_get_v1(
  p_organization_id uuid,
  p_entity_id uuid,
  p_field_name text DEFAULT NULL,  -- Optional: specific field
  p_limit integer DEFAULT 500,
  p_offset integer DEFAULT 0
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Get all dynamic fields for entity
const allFields = await supabase.rpc('hera_dynamic_data_get_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid'
})

// Get specific field
const priceField = await supabase.rpc('hera_dynamic_data_get_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_field_name: 'price'
})
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "dyn-uuid",
      "entity_id": "entity-uuid",
      "field_name": "price",
      "field_type": "number",
      "field_value_number": 99.99,
      "smart_code": "HERA.SALON.PRODUCT.FIELD.PRICE.V1",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### `hera_dynamic_data_delete_v1`

**Purpose**: Deletes one or more dynamic fields for an entity

**Function Signature**:
```sql
hera_dynamic_data_delete_v1(
  p_organization_id uuid,
  p_entity_id uuid,
  p_field_name text DEFAULT NULL  -- NULL = delete all fields
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Delete specific field
await supabase.rpc('hera_dynamic_data_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_field_name: 'obsolete_field'
})

// Delete all fields for entity
await supabase.rpc('hera_dynamic_data_delete_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid'
})
```

---

### `hera_dynamic_data_batch_v1`

**Purpose**: Performs batch upsert operations for multiple dynamic fields (RECOMMENDED)

**Function Signature**:
```sql
hera_dynamic_data_batch_v1(
  p_organization_id uuid,
  p_entity_id uuid,
  p_items jsonb,  -- Array of field objects
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Batch insert/update multiple fields
const result = await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_items: [
    {
      field_name: 'price',
      field_type: 'number',
      field_value_number: 99.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
    },
    {
      field_name: 'color',
      field_type: 'text',
      field_value_text: '#8B5CF6',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.COLOR.V1'
    },
    {
      field_name: 'icon',
      field_type: 'text',
      field_value_text: 'Sparkles',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.ICON.V1'
    },
    {
      field_name: 'featured',
      field_type: 'boolean',
      field_value_boolean: true,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.FEATURED.V1'
    }
  ],
  p_actor_user_id: 'user-uuid'
})
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items_processed": 4,
    "items_created": 2,
    "items_updated": 2,
    "items_failed": 0
  }
}
```

---

## 🔗 Relationship RPCs

### `hera_relationship_create_v1`

**Purpose**: Creates a new entity relationship

**Function Signature**:
```sql
hera_relationship_create_v1(
  p_organization_id uuid,
  p_from_entity_id uuid,
  p_to_entity_id uuid,
  p_relationship_type text,
  p_relationship_direction text DEFAULT 'forward',  -- 'forward', 'reverse', 'bidirectional'
  p_relationship_strength numeric DEFAULT 1.0,
  p_smart_code varchar DEFAULT NULL,
  p_relationship_data jsonb DEFAULT '{}',
  p_business_logic jsonb DEFAULT '{}',
  p_validation_rules jsonb DEFAULT '{}',
  p_is_active boolean DEFAULT true,
  p_effective_date timestamptz DEFAULT now(),
  p_expiration_date timestamptz DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS JSONB
```

**Common Relationship Types**:
- `HAS_STATUS` - Entity status assignment
- `PARENT_OF` - Hierarchical parent-child
- `BELONGS_TO` - Ownership/membership
- `RELATED_TO` - General association
- `DEPENDS_ON` - Dependency relationship
- `USER_MEMBER_OF_ORG` - User organization membership

**Usage Examples**:
```typescript
// Status assignment (replaces status columns)
await supabase.rpc('hera_relationship_create_v1', {
  p_organization_id: 'org-uuid',
  p_from_entity_id: 'customer-uuid',
  p_to_entity_id: 'status-active-uuid',
  p_relationship_type: 'HAS_STATUS',
  p_smart_code: 'HERA.CRM.CUSTOMER.STATUS.ACTIVE.V1',
  p_actor_user_id: 'user-uuid'
})

// Parent-child hierarchy
await supabase.rpc('hera_relationship_create_v1', {
  p_organization_id: 'org-uuid',
  p_from_entity_id: 'parent-category-uuid',
  p_to_entity_id: 'child-category-uuid',
  p_relationship_type: 'PARENT_OF',
  p_smart_code: 'HERA.INVENTORY.CATEGORY.HIERARCHY.V1'
})

// User organization membership
await supabase.rpc('hera_relationship_create_v1', {
  p_organization_id: 'org-uuid',
  p_from_entity_id: 'user-uuid',
  p_to_entity_id: 'org-uuid',
  p_relationship_type: 'USER_MEMBER_OF_ORG',
  p_smart_code: 'HERA.AUTH.USER.MEMBERSHIP.V1',
  p_relationship_data: { role: 'admin', permissions: ['read', 'write'] }
})
```

---

### `hera_relationship_upsert_v1`

**Purpose**: Creates or updates a relationship between entities

**Function Signature**:
```sql
hera_relationship_upsert_v1(
  p_organization_id uuid,
  p_from_entity_id uuid,
  p_to_entity_id uuid,
  p_relationship_type text,
  p_smart_code varchar,
  p_relationship_direction text DEFAULT 'forward',
  p_relationship_strength numeric DEFAULT 1.0,
  p_relationship_data jsonb DEFAULT '{}',
  p_smart_code_status text DEFAULT 'DRAFT',
  p_ai_confidence numeric DEFAULT 0.0,
  p_ai_classification text DEFAULT NULL,
  p_ai_insights jsonb DEFAULT '{}',
  p_business_logic jsonb DEFAULT '{}',
  p_validation_rules jsonb DEFAULT '{}',
  p_is_active boolean DEFAULT true,
  p_effective_date timestamptz DEFAULT now(),
  p_expiration_date timestamptz DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS JSONB
```

---

### `hera_relationship_upsert_batch_v1`

**Purpose**: Bulk upsert operation for multiple relationships

**Function Signature**:
```sql
hera_relationship_upsert_batch_v1(
  p_organization_id uuid,
  p_rows jsonb  -- Array of relationship objects
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Batch create multiple relationships
const result = await supabase.rpc('hera_relationship_upsert_batch_v1', {
  p_organization_id: 'org-uuid',
  p_rows: [
    {
      from_entity_id: 'product1-uuid',
      to_entity_id: 'category-uuid',
      relationship_type: 'BELONGS_TO',
      smart_code: 'HERA.INVENTORY.PRODUCT.CATEGORY.V1'
    },
    {
      from_entity_id: 'product2-uuid',
      to_entity_id: 'category-uuid',
      relationship_type: 'BELONGS_TO',
      smart_code: 'HERA.INVENTORY.PRODUCT.CATEGORY.V1'
    }
  ]
})
```

---

### `hera_relationship_read_v1`

**Purpose**: Reads a relationship record by ID

**Function Signature**:
```sql
hera_relationship_read_v1(
  p_organization_id uuid,
  p_relationship_id uuid
)
RETURNS JSONB
```

---

### `hera_relationship_query_v1`

**Purpose**: Queries relationships by entity, type, or time window

**Function Signature**:
```sql
hera_relationship_query_v1(
  p_organization_id uuid,
  p_entity_id uuid DEFAULT NULL,
  p_side text DEFAULT 'either',  -- 'from', 'to', 'either'
  p_relationship_type text DEFAULT NULL,
  p_active_only boolean DEFAULT true,
  p_effective_from timestamptz DEFAULT NULL,
  p_effective_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Get all relationships for an entity
const allRels = await supabase.rpc('hera_relationship_query_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_side: 'either'
})

// Get only status relationships
const statusRels = await supabase.rpc('hera_relationship_query_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'entity-uuid',
  p_relationship_type: 'HAS_STATUS'
})

// Get parent relationships
const parents = await supabase.rpc('hera_relationship_query_v1', {
  p_organization_id: 'org-uuid',
  p_entity_id: 'child-uuid',
  p_side: 'to',  // This entity is the 'to' in PARENT_OF relationships
  p_relationship_type: 'PARENT_OF'
})
```

---

### `hera_relationship_delete_v1`

**Purpose**: Soft deletes or expires a relationship

**Function Signature**:
```sql
hera_relationship_delete_v1(
  p_organization_id uuid,
  p_relationship_id uuid,
  p_expiration_date timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS JSONB
```

---

### `hera_relationship_bulk_link_v1`

**Purpose**: Links multiple entities to one target entity in bulk

**Function Signature**:
```sql
hera_relationship_bulk_link_v1(
  p_organization_id uuid,
  p_relationship_type text,
  p_to_entity_id uuid,
  p_from_entity_ids uuid[],
  p_smart_code text
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Link multiple products to a category
const result = await supabase.rpc('hera_relationship_bulk_link_v1', {
  p_organization_id: 'org-uuid',
  p_relationship_type: 'BELONGS_TO',
  p_to_entity_id: 'category-uuid',
  p_from_entity_ids: [
    'product1-uuid',
    'product2-uuid',
    'product3-uuid'
  ],
  p_smart_code: 'HERA.INVENTORY.PRODUCT.CATEGORY.V1'
})
```

---

### `hera_relationship_bulk_unlink_v1`

**Purpose**: Removes bulk links between entities

**Function Signature**:
```sql
hera_relationship_bulk_unlink_v1(
  p_organization_id uuid,
  p_relationship_type text,
  p_from_entity_ids uuid[]
)
RETURNS JSONB
```

---

### `hera_relationship_bulk_move_v1`

**Purpose**: Moves linked entities from one branch/parent to another

**Function Signature**:
```sql
hera_relationship_bulk_move_v1(
  p_organization_id uuid,
  p_relationship_type text,
  p_from_branch_id uuid,
  p_to_branch_id uuid,
  p_entity_ids uuid[],
  p_smart_code text
)
RETURNS JSONB
```

**Usage Example**:
```typescript
// Move products from one category to another
const result = await supabase.rpc('hera_relationship_bulk_move_v1', {
  p_organization_id: 'org-uuid',
  p_relationship_type: 'BELONGS_TO',
  p_from_branch_id: 'old-category-uuid',
  p_to_branch_id: 'new-category-uuid',
  p_entity_ids: ['product1-uuid', 'product2-uuid'],
  p_smart_code: 'HERA.INVENTORY.PRODUCT.CATEGORY.MOVE.V1'
})
```

---

## 💰 Transaction RPCs

### `hera_transactions_crud_v2`

**Purpose**: Complete CRUD operations for transactions with line items
**Status**: ✅ Production Ready (16/16 enterprise tests passed, 76.4ms avg)

**Function Signature**:
```sql
hera_transactions_crud_v2(
  p_action text,  -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_transaction jsonb,
  p_lines jsonb DEFAULT '[]',
  p_options jsonb DEFAULT '{}'
)
RETURNS JSONB
```

**Transaction Object Structure**:
```typescript
{
  transaction_id?: string,          // Required for UPDATE/DELETE
  transaction_type: string,         // Required for CREATE
  smart_code: string,               // Required for CREATE
  transaction_code?: string,        // Optional - auto-generated
  source_entity_id?: string,        // Optional - customer/vendor
  target_entity_id?: string,        // Optional - staff/location
  total_amount?: number,            // Optional - transaction total
  transaction_status?: string,      // Optional - workflow state
  transaction_date?: string,        // Optional - defaults to now
  currency?: string,                // Optional - defaults to org currency
  description?: string,             // Optional
  reference?: string,               // Optional - external reference
  metadata?: object                 // Optional - additional data
}
```

**Line Items Structure**:
```typescript
[
  {
    line_number: number,            // Required - line sequence
    line_type: string,              // Required - 'SERVICE', 'PRODUCT', 'GL', 'TAX'
    description?: string,           // Optional
    quantity?: number,              // Optional - defaults to 1
    unit_amount?: number,           // Optional - defaults to 0
    line_amount?: number,           // Optional - defaults to 0
    entity_id?: string,             // Optional - related entity
    smart_code?: string,            // Optional - line smart code
    metadata?: object               // Optional
  }
]
```

**CREATE Usage**:
```typescript
// Create appointment transaction with services
const result = await supabase.rpc('hera_transactions_crud_v2', {
  p_action: 'CREATE',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_transaction: {
    transaction_type: 'appointment',
    smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
    source_entity_id: 'customer-uuid',
    target_entity_id: 'staff-uuid',
    total_amount: 150.00,
    transaction_status: 'confirmed',
    description: 'Hair styling appointment',
    reference: 'APT-2025-001'
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'SERVICE',
      description: 'Hair Cut',
      quantity: 1,
      unit_amount: 50.00,
      line_amount: 50.00,
      entity_id: 'haircut-service-uuid',
      smart_code: 'HERA.SALON.SERVICE.HAIRCUT.V1'
    },
    {
      line_number: 2,
      line_type: 'SERVICE',
      description: 'Hair Styling',
      quantity: 1,
      unit_amount: 100.00,
      line_amount: 100.00,
      entity_id: 'styling-service-uuid',
      smart_code: 'HERA.SALON.SERVICE.STYLING.V1'
    }
  ],
  p_options: {}
})
```

**READ Usage**:
```typescript
// Read transaction with lines
const result = await supabase.rpc('hera_transactions_crud_v2', {
  p_action: 'READ',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_transaction: {
    transaction_id: 'txn-uuid'
  },
  p_options: {
    include_lines: true
  }
})
```

**UPDATE Usage**:
```typescript
// Update transaction
const result = await supabase.rpc('hera_transactions_crud_v2', {
  p_action: 'UPDATE',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_transaction: {
    transaction_id: 'txn-uuid',
    transaction_status: 'completed',
    total_amount: 175.00
  },
  p_lines: [
    {
      line_number: 3,
      line_type: 'PRODUCT',
      description: 'Hair Product',
      quantity: 1,
      unit_amount: 25.00,
      line_amount: 25.00
    }
  ]
})
```

**DELETE Usage**:
```typescript
// Soft delete transaction
const result = await supabase.rpc('hera_transactions_crud_v2', {
  p_action: 'DELETE',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_transaction: {
    transaction_id: 'txn-uuid'
  }
})
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "txn-uuid",
      "transaction_type": "appointment",
      "transaction_code": "APT-2025-001",
      "total_amount": 150.00,
      "created_by": "user-uuid",
      "updated_by": "user-uuid"
    },
    "lines": [
      {
        "id": "line-uuid",
        "line_number": 1,
        "line_type": "SERVICE",
        "line_amount": 50.00
      }
    ]
  }
}
```

**Security Features**:
- ✅ NULL UUID attack prevention
- ✅ Platform organization protection
- ✅ Complete actor validation
- ✅ Multi-tenant isolation enforcement
- ✅ Audit trail stamping

---

## 🔄 Common Patterns

### Pattern 1: Two-Step Entity Creation (STANDARD)

```typescript
// Step 1: Create entity in core_entities
const entityResult = await supabase.rpc('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'product',
  p_entity_name: 'Premium Hair Treatment',
  p_smart_code: 'HERA.SALON.PRODUCT.SERVICE.TREATMENT.V1',
  p_entity_code: 'PROD-001',
  p_actor_user_id: userId
})

const entityId = entityResult.data  // UUID returned as text

// Step 2: Add business fields to core_dynamic_data
await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,
  p_items: [
    {
      field_name: 'price',
      field_type: 'number',
      field_value_number: 99.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
    },
    {
      field_name: 'color',
      field_type: 'text',
      field_value_text: '#8B5CF6',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.COLOR.V1'
    },
    {
      field_name: 'icon',
      field_type: 'text',
      field_value_text: 'Sparkles',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.ICON.V1'
    }
  ],
  p_actor_user_id: userId
})
```

---

### Pattern 2: Status Workflow (Relationships Instead of Columns)

```typescript
// ❌ WRONG - Never use status columns
UPDATE entities SET status = 'active' WHERE id = entityId

// ✅ CORRECT - Use relationships
// Step 1: Create status entities (one-time setup)
const activeStatus = await supabase.rpc('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'status',
  p_entity_name: 'Active',
  p_smart_code: 'HERA.WORKFLOW.STATUS.ACTIVE.V1',
  p_actor_user_id: userId
})

// Step 2: Assign status via relationship
await supabase.rpc('hera_relationship_create_v1', {
  p_organization_id: orgId,
  p_from_entity_id: entityId,
  p_to_entity_id: activeStatus.data,
  p_relationship_type: 'HAS_STATUS',
  p_smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.V1',
  p_actor_user_id: userId
})

// Step 3: Query entity status
const statusRels = await supabase.rpc('hera_relationship_query_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,
  p_relationship_type: 'HAS_STATUS',
  p_active_only: true
})
```

---

### Pattern 3: Complete Transaction Creation

```typescript
// Create transaction with lines
const txnResult = await supabase.rpc('hera_transactions_crud_v2', {
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_transaction: {
    transaction_type: 'sale',
    smart_code: 'HERA.SALON.SALE.POS.V1',
    source_entity_id: customerId,
    target_entity_id: staffId,
    total_amount: 250.00,
    transaction_status: 'completed',
    description: 'Salon service sale'
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'SERVICE',
      description: 'Hair Cut',
      quantity: 1,
      unit_amount: 50.00,
      line_amount: 50.00,
      entity_id: serviceid,
      smart_code: 'HERA.SALON.SERVICE.HAIRCUT.V1'
    },
    {
      line_number: 2,
      line_type: 'PRODUCT',
      description: 'Hair Product',
      quantity: 2,
      unit_amount: 100.00,
      line_amount: 200.00,
      entity_id: productId,
      smart_code: 'HERA.SALON.PRODUCT.ITEM.V1'
    }
  ]
})
```

---

### Pattern 4: Batch Operations for Performance

```typescript
// Batch create multiple entities with dynamic data
const productIds = []

// Create entities
for (const product of products) {
  const result = await supabase.rpc('hera_entity_upsert_v1', {
    p_organization_id: orgId,
    p_entity_type: 'product',
    p_entity_name: product.name,
    p_smart_code: 'HERA.SALON.PRODUCT.V1',
    p_actor_user_id: userId
  })
  productIds.push(result.data)
}

// Batch add dynamic data for all products
const batchPromises = productIds.map((id, index) =>
  supabase.rpc('hera_dynamic_data_batch_v1', {
    p_organization_id: orgId,
    p_entity_id: id,
    p_items: [
      {
        field_name: 'price',
        field_type: 'number',
        field_value_number: products[index].price,
        smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
      }
    ],
    p_actor_user_id: userId
  })
)

await Promise.all(batchPromises)
```

---

## ⚠️ Error Handling

### Standard Error Response
```typescript
{
  data: null,
  error: {
    message: "Error description",
    code: "ERROR_CODE",
    details: "Additional context",
    hint: "Suggested fix"
  }
}
```

### Common Error Codes

| Error Code | Cause | Fix |
|------------|-------|-----|
| `HERA_ORG_REQUIRED` | Missing `p_organization_id` | Always include organization_id |
| `HERA_SMARTCODE_INVALID` | Invalid smart code format | Use 6+ segments, uppercase .V1 |
| `ENTITY_NOT_FOUND` | Invalid entity reference | Verify entity exists |
| `REFERENTIAL_INTEGRITY` | Constraint violation | Check foreign key references |
| `DUPLICATE_FIELD` | Dynamic field already exists | Use update instead of create |
| `ORG_MISMATCH` | Cross-organization access | Verify organization_id |

### Error Handling Pattern
```typescript
async function safeRPCCall(functionName, params) {
  const result = await supabase.rpc(functionName, params)

  if (result.error) {
    console.error(`[RPC Error] ${functionName}:`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      params
    })

    // Handle specific errors
    switch(result.error.code) {
      case 'HERA_ORG_REQUIRED':
        throw new Error('Organization context required')
      case 'HERA_SMARTCODE_INVALID':
        throw new Error('Invalid smart code format')
      default:
        throw new Error(result.error.message)
    }
  }

  return result.data
}

// Usage
try {
  const data = await safeRPCCall('hera_entity_upsert_v1', {
    p_organization_id: orgId,
    p_entity_type: 'customer',
    p_entity_name: 'ACME Corp',
    p_smart_code: 'HERA.CRM.CUSTOMER.V1'
  })
} catch (error) {
  console.error('Failed to create entity:', error)
}
```

---

## 🚀 Performance Best Practices

### 1. Use Batch Operations
```typescript
// ❌ SLOW: Individual calls
for (const field of fields) {
  await supabase.rpc('hera_dynamic_data_set_v1', { ... })
}

// ✅ FAST: Batch call
await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_items: fields
})
```

### 2. Include Only Required Data
```typescript
// ❌ SLOW: Always fetching everything
await supabase.rpc('hera_entity_read_v1', {
  p_organization_id: orgId,
  p_include_dynamic_data: true,
  p_include_relationships: true
})

// ✅ FAST: Fetch only what you need
await supabase.rpc('hera_entity_read_v1', {
  p_organization_id: orgId,
  p_include_dynamic_data: false,  // Don't fetch if not needed
  p_include_relationships: false
})
```

### 3. Use Pagination for Large Datasets
```typescript
// Paginate entity reads
const result = await supabase.rpc('hera_entity_read_v1', {
  p_organization_id: orgId,
  p_entity_type: 'customer',
  p_limit: 100,
  p_offset: 0
})
```

### 4. Leverage Indexes
```sql
-- These indexes are already created for performance
-- Organization-first pattern (critical)
idx_core_entities_org_type
idx_core_dynamic_data_org_entity_field
idx_core_relationships_org_from_to
idx_universal_transactions_org_date

-- GIN indexes for JSONB queries
cdd_field_value_json_gin
ce_business_rules_gin
```

### 5. Use Connection Pooling
```typescript
// Supabase client automatically pools connections
// Just create one client instance
const supabase = createClient(url, key)

// Reuse the same client
export { supabase }
```

---

## 📚 Quick Reference Tables

### Field Type Mapping
| Field Type | Use When | Column Used |
|------------|----------|-------------|
| `text` | Strings, codes, names | `field_value_text` |
| `number` | Prices, quantities, decimals | `field_value_number` |
| `boolean` | True/false flags | `field_value_boolean` |
| `date` | Timestamps, dates | `field_value_date` |
| `json` | Complex objects, arrays | `field_value_json` |

### Relationship Directions
| Direction | Meaning | Use Case |
|-----------|---------|----------|
| `forward` | A → B | Parent → Child |
| `reverse` | B → A | Child → Parent |
| `bidirectional` | A ↔ B | Mutual association |

### Transaction Line Types
| Line Type | Purpose | Example |
|-----------|---------|---------|
| `SERVICE` | Service line items | Hair cut, styling |
| `PRODUCT` | Product line items | Shampoo, tools |
| `GL` | General ledger entries | Accounting posts |
| `TAX` | Tax calculations | VAT, sales tax |
| `DISCOUNT` | Discount/promotion | 10% off |
| `PAYMENT` | Payment method | Cash, card |

---

## ✅ Production Checklist

Before deploying RPC-based features:

- [ ] All calls include `p_organization_id`
- [ ] Smart codes validated (6+ segments, uppercase .V1)
- [ ] Actor user IDs included for audit trail
- [ ] Error handling implemented for all RPC calls
- [ ] Two-step pattern used (entity → dynamic data)
- [ ] Status workflows use relationships (not columns)
- [ ] Batch operations used where possible
- [ ] Pagination implemented for large datasets
- [ ] Connection pooling configured
- [ ] Performance tested with production data volume
- [ ] Security validated (organization isolation)
- [ ] Audit trail verified (created_by/updated_by)

---

## 📖 Related Documentation

- **Schema Reference**: `/docs/schema/hera-sacred-six-schema.yaml`
- **RPC Cheat Sheet**: `/docs/dna/RPC-CHEAT-SHEET.md`
- **RPC Debugging Guide**: `/docs/dna/RPC-DEBUGGING-GUIDE.md`
- **Universal API V2**: `/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md`
- **Smart Code Guide**: `/docs/playbooks/_shared/SMART_CODE_GUIDE.md`
- **CLAUDE.md**: `/CLAUDE.md` (Development playbook)

---

**Version**: 2.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2025-10-18
**Verified Against**: Supabase Production Database

**The HERA Promise**: 6 Tables. Infinite Business Complexity. Zero Schema Changes.
