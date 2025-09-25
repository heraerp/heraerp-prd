# HERA V2 API - Complete CRUD Documentation

**Revolutionary Event-Sourced Architecture**
Complete documentation for HERA V2 RPC functions and API endpoints covering all Sacred Six tables.

---

## 🏗️ Architecture Overview

### Sacred Six Tables CRUD
HERA V2 provides complete CRUD operations for all Sacred Six tables:

1. **`core_entities`** - All business objects (customers, products, GL accounts, etc.)
2. **`core_dynamic_data`** - Unlimited custom fields without schema changes
3. **`core_relationships`** - Universal entity connections and workflows
4. **`universal_transactions`** - All business transaction headers
5. **`universal_transaction_lines`** - Transaction line items and breakdowns
6. **`core_organizations`** - Multi-tenant business isolation

### Event-Sourced Design Principles
- **Immutable Transactions**: Corrections via reversal only
- **Complete Audit Trail**: Every operation logged with smart codes
- **Organization Isolation**: Sacred `organization_id` filtering on all operations
- **Smart Code Intelligence**: Business context on every data point

---

## 📋 RPC Functions Reference

### 1. Entity CRUD Functions (`/database/functions/v2/`)

#### `hera_entity_read_v1(p_org_id, p_entity_id)`
**Purpose**: Read single entity with optional dynamic data
**Security**: Organization isolation enforced

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_entity_read_v1(
  p_org_id UUID,
  p_entity_id UUID
) RETURNS JSONB

-- Example Call
SELECT hera_entity_read_v1(
  'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'::uuid,
  'entity-uuid-here'::uuid
);
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "id": "entity-uuid",
    "entity_type": "customer",
    "entity_name": "ACME Corporation",
    "smart_code": "HERA.CRM.CUST.ENT.PROF.V1",
    "organization_id": "org-uuid",
    "created_at": "2025-01-15T10:30:00Z",
    "dynamic_data": [
      {
        "field_name": "credit_limit",
        "field_value_number": 50000,
        "smart_code": "HERA.CRM.CUST.DYN.CREDIT.V1"
      }
    ]
  }
}
```

#### `hera_entity_delete_v1(p_org_id, p_entity_id, p_delete_reason)`
**Purpose**: Soft delete entity with audit trail
**Security**: Organization isolation + referential integrity checks

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_entity_delete_v1(
  p_org_id UUID,
  p_entity_id UUID,
  p_delete_reason TEXT
) RETURNS JSONB

-- Example Call
SELECT hera_entity_delete_v1(
  'org-uuid'::uuid,
  'entity-uuid'::uuid,
  'Customer account closed'
);
```

### 2. Dynamic Data Functions

#### `hera_dynamic_data_v1(p_org_id, p_entity_id, p_operations)`
**Purpose**: Batch CRUD operations on dynamic fields
**Operations**: `CREATE`, `READ`, `UPDATE`, `DELETE`

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_dynamic_data_v1(
  p_org_id UUID,
  p_entity_id UUID,
  p_operations JSONB[]
) RETURNS JSONB

-- Example Call - Multiple Operations
SELECT hera_dynamic_data_v1(
  'org-uuid'::uuid,
  'entity-uuid'::uuid,
  ARRAY[
    '{"operation": "CREATE", "field_name": "credit_limit", "field_value_number": 50000, "smart_code": "HERA.CRM.CUST.DYN.CREDIT.V1"}'::jsonb,
    '{"operation": "UPDATE", "field_name": "payment_terms", "field_value_text": "NET30", "smart_code": "HERA.CRM.CUST.DYN.TERMS.V1"}'::jsonb,
    '{"operation": "DELETE", "field_name": "old_field"}'::jsonb
  ]
);
```

### 3. Relationship CRUD Functions

#### `hera_relationship_create_v1(p_org_id, p_from_entity_id, p_to_entity_id, p_relationship_type, p_smart_code)`
**Purpose**: Create entity relationships (parent-child, status assignments, etc.)

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_relationship_create_v1(
  p_org_id UUID,
  p_from_entity_id UUID,
  p_to_entity_id UUID,
  p_relationship_type TEXT,
  p_smart_code TEXT
) RETURNS JSONB

-- Example - Status Assignment
SELECT hera_relationship_create_v1(
  'org-uuid'::uuid,
  'customer-uuid'::uuid,
  'status-active-uuid'::uuid,
  'has_status',
  'HERA.CRM.CUST.STATUS.ACTIVE.V1'
);
```

#### `hera_relationship_delete_v1(p_org_id, p_relationship_id)`
**Purpose**: Remove relationship with audit trail

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_relationship_delete_v1(
  p_org_id UUID,
  p_relationship_id UUID
) RETURNS JSONB
```

### 4. Transaction CRUD Functions (V2 Event-Sourced)

#### `hera_txn_read_v1(p_org_id, p_transaction_id, p_include_lines)`
**Purpose**: Read transaction with optional line items
**Performance**: N+1 query optimized

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_txn_read_v1(
  p_org_id UUID,
  p_transaction_id UUID,
  p_include_lines BOOLEAN DEFAULT true
) RETURNS JSONB

-- Example Call
SELECT hera_txn_read_v1(
  'org-uuid'::uuid,
  'transaction-uuid'::uuid,
  true
);
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "transaction_type": "sale",
    "transaction_code": "SALE-2025-001",
    "smart_code": "HERA.RESTAURANT.SALES.ORDER.CORE.V1",
    "total_amount": 53.95,
    "lines": [
      {
        "line_number": 1,
        "line_type": "ITEM",
        "quantity": 2,
        "unit_price": 25.50,
        "line_amount": 51.00,
        "smart_code": "HERA.RESTAURANT.SALES.LINE.ITEM.V1"
      }
    ]
  }
}
```

#### `hera_txn_query_v1(p_org_id, p_filters)`
**Purpose**: Query transactions with flexible filters
**Performance**: Optimized with strategic indexes

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_txn_query_v1(
  p_org_id UUID,
  p_filters JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB

-- Example - Query by Type and Date Range
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{
    "transaction_type": "sale",
    "date_from": "2025-01-01T00:00:00Z",
    "date_to": "2025-01-31T23:59:59Z",
    "limit": 100,
    "offset": 0
  }'::jsonb
);
```

**Available Filters**:
```typescript
interface QueryFilters {
  source_entity_id?: string;      // Customer, vendor, etc.
  target_entity_id?: string;      // Store, location, etc.
  transaction_type?: string;      // sale, purchase, payment
  smart_code_like?: string;       // Pattern matching
  date_from?: string;             // ISO datetime
  date_to?: string;               // ISO datetime
  limit?: number;                 // Default 100, max 1000
  offset?: number;                // For pagination
  include_lines?: boolean;        // Include transaction lines
}
```

#### `hera_txn_reverse_v1(p_org_id, p_original_txn_id, p_reason, p_reversal_smart_code)`
**Purpose**: Immutable transaction reversal (event-sourced correction)
**Business Logic**: Negates amounts, flips DR/CR, maintains audit trail

```sql
-- Function Signature
CREATE OR REPLACE FUNCTION hera_txn_reverse_v1(
  p_org_id UUID,
  p_original_txn_id UUID,
  p_reason TEXT,
  p_reversal_smart_code TEXT
) RETURNS JSONB

-- Example - Customer Cancellation
SELECT hera_txn_reverse_v1(
  'org-uuid'::uuid,
  'original-transaction-uuid'::uuid,
  'Customer cancellation - full refund requested',
  'HERA.RESTAURANT.SALES.ORDER.REVERSAL.V1'
);
```

**Reversal Logic**:
- **Amounts**: All amounts negated (`-original_amount`)
- **DR/CR**: Flipped (`DR` ↔ `CR`)
- **Quantities**: Negated for inventory impact
- **Metadata**: Links to original via `reversal_of` field
- **Status**: Set to `REVERSAL`

---

## 🌐 API Endpoints Reference

### Base URL Structure
```
/api/v2/universal/[operation]/route.ts
```

### 1. Transaction Endpoints

#### `POST /api/v2/universal/txn-read`
**Purpose**: Read single transaction
**Observability**: Structured logging with operation tracking

**Request Body**:
```typescript
{
  organization_id: string;    // Required - UUID format
  transaction_id: string;     // Required - UUID format
  include_lines?: boolean;    // Optional - default true
}
```

**Response**:
```typescript
{
  api_version: "v2";
  transaction: {
    id: string;
    organization_id: string;
    transaction_type: string;
    smart_code: string;
    // ... full transaction data
    lines?: TransactionLine[]; // If include_lines=true
  }
}
```

**Structured Logging Output**:
```json
{
  "operation": "txn-read",
  "organization_id": "org-123",
  "transaction_id": "txn-456",
  "smart_code": "HERA.RESTAURANT.SALES.ORDER.CORE.V1",
  "duration_ms": 45,
  "status": "success"
}
```

#### `POST /api/v2/universal/txn-query`
**Purpose**: Query transactions with flexible filters

**Request Body**:
```typescript
{
  organization_id: string;        // Required
  source_entity_id?: string;      // Optional filters
  target_entity_id?: string;
  transaction_type?: string;
  smart_code_like?: string;       // Pattern matching
  date_from?: string;             // ISO datetime
  date_to?: string;
  limit?: number;                 // 1-1000, default 100
  offset?: number;                // For pagination
  include_lines?: boolean;        // Include line items
}
```

**Response**:
```typescript
{
  api_version: "v2";
  transactions: Transaction[];
  total: number;                  // Total matching records
  limit: number;                  // Applied limit
  offset: number;                 // Applied offset
}
```

#### `POST /api/v2/universal/txn-reverse`
**Purpose**: Immutable transaction reversal

**Request Body**:
```typescript
{
  organization_id: string;           // Required
  original_transaction_id: string;   // Transaction to reverse
  smart_code: string;               // Reversal smart code (UPPERCASE, 6+ segments, .V#)
  reason: string;                   // Required - business justification
}
```

**Response**:
```typescript
{
  api_version: "v2";
  reversal_transaction_id: string;
  original_transaction_id: string;
  lines_reversed: number;
  reversal_reason: string;
}
```

#### `POST /api/v2/universal/txn-emit`
**Purpose**: Create new transaction (existing endpoint)

**Request Body**:
```typescript
{
  organization_id: string;
  transaction_type: string;
  smart_code: string;               // UPPERCASE, 6+ segments, .V#
  transaction_date: string;         // ISO datetime
  source_entity_id?: string;
  target_entity_id?: string;
  business_context?: object;
  lines: TransactionLine[];         // At least one line required
  require_balance?: boolean;        // For GL transactions
  idempotency_key?: string;         // Deduplication
}

interface TransactionLine {
  line_number?: number;             // Auto-generated if not provided
  line_type: string;
  smart_code: string;              // Required on all lines
  entity_id?: string;
  quantity?: number;
  unit_price?: number;             // Primary field (database schema)
  unit_amount?: number;            // Backward compatibility - normalized to unit_price
  line_amount?: number;
  description?: string;
  dr_cr?: 'DR' | 'CR';            // For financial transactions
  metadata?: object;
}
```

---

## 🔧 TypeScript Client Usage

### Installation & Setup
```typescript
import { txnClientV2 } from '@/lib/v2/client/txn-client'

// Set organization context (recommended)
// Client handles organization_id automatically in requests
```

### Client Methods

#### Read Transaction
```typescript
const transaction = await txnClientV2.read({
  organization_id: 'org-uuid',
  transaction_id: 'txn-uuid',
  include_lines: true
});
```

#### Query Transactions
```typescript
// Query by type and date range
const sales = await txnClientV2.query({
  organization_id: 'org-uuid',
  transaction_type: 'sale',
  date_from: '2025-01-01T00:00:00Z',
  date_to: '2025-01-31T23:59:59Z',
  include_lines: false
});

// Query by entity (customer transactions)
const customerTxns = await txnClientV2.query({
  organization_id: 'org-uuid',
  source_entity_id: 'customer-uuid',
  limit: 50
});
```

#### Reverse Transaction
```typescript
const reversal = await txnClientV2.reverse({
  organization_id: 'org-uuid',
  original_transaction_id: 'original-txn-uuid',
  smart_code: 'HERA.RESTAURANT.SALES.ORDER.REVERSAL.V1',
  reason: 'Customer cancellation'
});
```

#### Emit New Transaction
```typescript
const newTxn = await txnClientV2.emit({
  organization_id: 'org-uuid',
  transaction_type: 'sale',
  smart_code: 'HERA.RESTAURANT.SALES.ORDER.CORE.V1',
  transaction_date: new Date().toISOString(),
  lines: [
    {
      line_number: 1,
      line_type: 'ITEM',
      entity_id: 'menu-item-uuid',
      quantity: 2,
      unit_price: 25.50,           // ✅ Primary field
      line_amount: 51.00,          // quantity × unit_price
      smart_code: 'HERA.RESTAURANT.SALES.LINE.ITEM.V1',
      description: 'Margherita Pizza'
    }
  ]
});
```

### Helper Functions

#### Find Transactions by Entity
```typescript
import { txnHelpers } from '@/lib/v2/client/txn-client'

// Find all transactions involving an entity
const entityTxns = await txnHelpers.findByEntity(
  'org-uuid',
  'customer-uuid'
);

// Response includes both directions
console.log(entityTxns.as_source);    // Transactions FROM entity
console.log(entityTxns.as_target);    // Transactions TO entity
```

#### Audit Trail
```typescript
// Get complete audit trail (original + reversals)
const auditTrail = await txnHelpers.getAuditTrail(
  'org-uuid',
  'transaction-uuid'
);

console.log(auditTrail.original);     // Original transaction
console.log(auditTrail.reversals);    // All reversal transactions
```

#### Balance Validation
```typescript
// Validate financial transaction balance (DR = CR)
const isBalanced = txnHelpers.validateBalance([
  { line_amount: 100, dr_cr: 'DR' },
  { line_amount: 100, dr_cr: 'CR' }
]);

console.log(isBalanced); // true
```

---

## 🔒 Security & Validation

### Organization Isolation
All RPC functions enforce **sacred `organization_id` filtering**:
```sql
-- Every query includes this pattern
WHERE organization_id = p_org_id
```
**Guarantee**: Zero data leakage between organizations

### Smart Code Validation
All operations validate smart code format:
- **Pattern**: `^HERA\.[A-Z0-9]+(\.[A-Z0-9]+){4,}\.V[0-9]+$`
- **Requirements**: UPPERCASE, 6+ segments, ends with `.V#`
- **Examples**:
  - ✅ `HERA.RESTAURANT.SALES.ORDER.CORE.V1`
  - ❌ `hera.restaurant.sales.v1` (lowercase, insufficient segments)

### Field Naming Consistency
- **Database**: Always uses `unit_price`
- **API**: Accepts both `unit_price` (primary) and `unit_amount` (backward compatibility)
- **Normalization**: `unit_amount` automatically converted to `unit_price`

### Error Handling
Standardized error responses:
```typescript
// Business Logic Errors
{
  success: false,
  error: "TXN_NOT_FOUND",
  message: "Transaction not found"
}

// Organization Security Errors
{
  success: false,
  error: "ORG_MISMATCH",
  message: "Transaction not found in organization"
}

// Validation Errors
{
  success: false,
  error: "INVALID_SMART_CODE",
  message: "Smart code must be UPPERCASE with 6+ segments ending in .V#"
}
```

---

## 📊 Performance Optimizations

### Strategic Indexes
All operations optimized with purpose-built indexes:

```sql
-- Organization-first pattern (multi-tenant isolation)
CREATE INDEX idx_universal_transactions_org_date
ON universal_transactions (organization_id, transaction_date DESC);

-- Entity lookup optimization
CREATE INDEX idx_universal_transactions_org_source
ON universal_transactions (organization_id, source_entity_id);

-- Query pattern optimization
CREATE INDEX idx_universal_transactions_org_type
ON universal_transactions (organization_id, transaction_type);

-- Idempotency for deduplication
CREATE INDEX idx_universal_transactions_org_idempotency
ON universal_transactions (organization_id, ((metadata->>'idempotency_key')));
```

### N+1 Query Prevention
- **Transaction Query**: Single query fetches all lines for multiple transactions
- **Batch Operations**: Dynamic data operations processed in single transaction
- **Efficient Grouping**: Lines grouped by transaction_id with optimal sorting

### Pagination Best Practices
```typescript
// Efficient pagination
const PAGE_SIZE = 100;
let offset = 0;

do {
  const results = await txnClientV2.query({
    organization_id: 'org-uuid',
    transaction_type: 'sale',
    limit: PAGE_SIZE,
    offset: offset,
    include_lines: false  // Fetch headers first, lines on-demand
  });

  // Process results
  offset += PAGE_SIZE;
} while (results.transactions.length === PAGE_SIZE);
```

---

## 🚨 Best Practices

### 1. Organization Context First
```typescript
// ✅ Always include organization_id
const result = await txnClientV2.read({
  organization_id: currentOrg.id,  // CRITICAL
  transaction_id: txnId
});

// ❌ Never omit organization context
const bad = await someGenericQuery(txnId);  // Security risk
```

### 2. Smart Code Standards
```typescript
// ✅ Use proper smart code format
const smartCode = 'HERA.RESTAURANT.SALES.ORDER.CORE.V1';

// ✅ Generate reversal codes correctly
const reversalCode = txnHelpers.generateReversalSmartCode(smartCode);
// Result: 'HERA.RESTAURANT.SALES.ORDER.REVERSE.V1'

// ❌ Never hardcode or use invalid formats
const bad = 'custom-code';  // Will fail validation
```

### 3. Field Naming Consistency
```typescript
// ✅ Preferred (matches database)
{
  quantity: 2,
  unit_price: 25.50,
  line_amount: 51.00
}

// ✅ Also works (backward compatibility)
{
  quantity: 2,
  unit_amount: 25.50,  // Normalized to unit_price
  line_amount: 51.00
}
```

### 4. Transaction Reversal Pattern
```typescript
// ✅ Always provide business justification
await txnClientV2.reverse({
  organization_id: 'org-uuid',
  original_transaction_id: 'txn-uuid',
  smart_code: 'HERA.RESTAURANT.SALES.ORDER.REVERSAL.V1',
  reason: 'Customer cancellation - order placed by mistake'  // Required
});

// ❌ Never delete or update transactions directly
// Use reversal for immutable audit trail
```

### 5. Error Handling
```typescript
try {
  const result = await txnClientV2.read({ /* ... */ });
} catch (error) {
  if (error.message.includes('ORG_MISMATCH')) {
    // Handle organization security error
    console.error('Access denied: Transaction not in current organization');
  } else if (error.message.includes('TXN_NOT_FOUND')) {
    // Handle missing transaction
    console.error('Transaction not found or deleted');
  } else {
    // Handle other errors
    console.error('Transaction read failed:', error.message);
  }
}
```

---

## 🎯 Quick Start Examples

### Complete Restaurant Order Flow
```typescript
// 1. Create customer entity
const customer = await universalApi.createEntity({
  organization_id: 'restaurant-org-uuid',
  entity_type: 'customer',
  entity_name: 'John Smith',
  smart_code: 'HERA.RESTAURANT.CRM.CUSTOMER.PROFILE.V1'
});

// 2. Create menu item entity
const pizza = await universalApi.createEntity({
  organization_id: 'restaurant-org-uuid',
  entity_type: 'menu_item',
  entity_name: 'Margherita Pizza',
  smart_code: 'HERA.RESTAURANT.MENU.ITEM.PIZZA.V1'
});

// 3. Set dynamic data (price)
await universalApi.setDynamicField(
  pizza.id,
  'unit_price',
  25.50,
  'HERA.RESTAURANT.MENU.PRICE.STANDARD.V1'
);

// 4. Create sales transaction
const order = await txnClientV2.emit({
  organization_id: 'restaurant-org-uuid',
  transaction_type: 'sale',
  smart_code: 'HERA.RESTAURANT.SALES.ORDER.CORE.V1',
  transaction_date: new Date().toISOString(),
  source_entity_id: customer.id,
  lines: [
    {
      line_type: 'ITEM',
      entity_id: pizza.id,
      quantity: 2,
      unit_price: 25.50,
      line_amount: 51.00,
      smart_code: 'HERA.RESTAURANT.SALES.LINE.ITEM.V1',
      description: 'Margherita Pizza'
    },
    {
      line_type: 'TAX',
      line_amount: 2.95,
      smart_code: 'HERA.RESTAURANT.SALES.LINE.TAX.V1',
      description: 'Sales Tax (5%)'
    }
  ]
});

console.log('Order created:', order.transaction_id);
```

### Financial Journal Entry
```typescript
// GL transaction with balance validation
const journalEntry = await txnClientV2.emit({
  organization_id: 'org-uuid',
  transaction_type: 'journal_entry',
  smart_code: 'HERA.FINANCE.GL.JOURNAL.ENTRY.V1',
  transaction_date: new Date().toISOString(),
  require_balance: true,  // Enforce DR = CR
  lines: [
    {
      line_type: 'debit',
      line_amount: 1000,
      dr_cr: 'DR',
      smart_code: 'HERA.FINANCE.GL.DEBIT.CASH.V1',
      description: 'Cash increase'
    },
    {
      line_type: 'credit',
      line_amount: 1000,
      dr_cr: 'CR',
      smart_code: 'HERA.FINANCE.GL.CREDIT.REVENUE.V1',
      description: 'Revenue recognition'
    }
  ]
});
```

---

## 📈 Monitoring & Observability

### Structured Logging
Every API call generates structured logs:
```json
{
  "level": "info",
  "message": "HERA-V2-TXN: txn-query",
  "operation": "txn-query",
  "organization_id": "org-123",
  "transaction_type": "sale",
  "duration_ms": 87,
  "status": "success",
  "service": "hera-v2-api",
  "version": "2.0.0",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### Performance Metrics
Monitor key performance indicators:
- **Query Response Time**: < 100ms for single reads
- **Batch Operations**: < 500ms for 100 records
- **Organization Isolation**: 100% enforcement
- **Smart Code Validation**: 100% compliance
- **Balance Validation**: 100% accuracy for financial transactions

---

## 🔗 Related Documentation

- **Schema Reference**: `/database/migrations/schema.sql`
- **Performance Indexes**: `/database/indexes/transaction-performance.sql`
- **Field Migration Guide**: `/V2_FIELD_MIGRATION_NOTES.md`
- **HERA DNA Principles**: `/CLAUDE.md`
- **Universal API**: `/src/lib/universal-api.ts`

---

**Last Updated**: January 15, 2025
**API Version**: v2.0.0
**Status**: ✅ Production Ready