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

### `hera_entity_read_v1`
**File**: `/database/functions/v2/hera_entity_read_v1.sql`
**Purpose**: Read single entity with optional dynamic data and relationships

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

**Last Updated**: October 19, 2025
**Version**: 2.1.0
**Status**: ✅ Production Ready

## 🆕 Recent Updates (v2.1.0)
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