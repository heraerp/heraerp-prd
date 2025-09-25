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

### `hera_entity_delete_v1`
**File**: `/database/functions/v2/hera_entity_delete_v1.sql`
**Purpose**: Soft delete entity with comprehensive referential integrity checks

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_entity_delete_v1(
  p_org_id UUID,
  p_entity_id UUID,
  p_delete_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters
- `p_org_id` - Organization UUID
- `p_entity_id` - Entity UUID to delete
- `p_delete_reason` - Required business justification for audit trail

#### Referential Integrity Checks
1. **Transaction References**: Prevents deletion if entity appears in transactions
2. **Relationship Dependencies**: Checks for parent-child relationships
3. **Dynamic Data Cascade**: Soft deletes associated dynamic fields
4. **Audit Trail Creation**: Creates deletion record in audit tables

#### Response Examples
```json
// Successful Deletion
{
  "success": true,
  "data": {
    "entity_id": "entity-uuid",
    "deleted_at": "2025-01-15T14:30:00Z",
    "delete_reason": "Customer account closed",
    "dynamic_fields_deleted": 5,
    "relationships_removed": 2,
    "audit_record_id": "audit-uuid"
  }
}

// Deletion Blocked (Has References)
{
  "success": false,
  "error": "ENTITY_HAS_REFERENCES",
  "message": "Cannot delete entity with active transaction references",
  "data": {
    "blocking_transactions": ["txn-1", "txn-2"],
    "blocking_relationships": ["rel-1"]
  }
}
```

---

## 💾 Dynamic Data Functions

### `hera_dynamic_data_v1`
**File**: `/database/functions/v2/hera_dynamic_data_v1.sql`
**Purpose**: Batch CRUD operations on entity dynamic fields

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

**Last Updated**: January 15, 2025
**Version**: 2.0.0
**Status**: ✅ Production Ready