# DATA-MODELS.md - HERA Sacred Six Data Models Reference

**Technical Guide** | Last Updated: 2025-11-07
**Status**: ✅ Production | **Coverage**: 100% Sacred Six Schema

---

## 📋 Table of Contents

1. [Sacred Six Architecture](#sacred-six-architecture)
2. [Core Entities](#core-entities)
3. [Core Dynamic Data](#core-dynamic-data)
4. [Core Relationships](#core-relationships)
5. [Universal Transactions](#universal-transactions)
6. [Universal Transaction Lines](#universal-transaction-lines)
7. [Core Organizations](#core-organizations)
8. [Smart Code System](#smart-code-system)
9. [Entity Types in Salon Module](#entity-types-in-salon-module)
10. [Transaction Types in Salon Module](#transaction-types-in-salon-module)
11. [Dynamic Field Patterns](#dynamic-field-patterns)
12. [Relationship Patterns](#relationship-patterns)
13. [RPC Function Signatures](#rpc-function-signatures)
14. [Data Transformation Patterns](#data-transformation-patterns)
15. [Query Patterns](#query-patterns)

---

## Sacred Six Architecture

### 🏛️ **The Foundation of HERA**

HERA is built on **six sacred tables** that provide infinite business flexibility without schema changes:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SACRED SIX ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │ core_organizations │◄────────┤ ALL DATA FILTERED  │         │
│  │ (Multi-Tenant)     │         │ BY organization_id │         │
│  └────────────────────┘         └────────────────────┘         │
│           │                                                      │
│           │ owns                                                 │
│           ▼                                                      │
│  ┌────────────────────┐                                         │
│  │  core_entities     │  ◄─── Master Data (Customers, Staff)   │
│  │  (Master Data)     │                                         │
│  └────────┬───────────┘                                         │
│           │                                                      │
│           ├─────► ┌─────────────────────┐                      │
│           │       │ core_dynamic_data    │ ◄─── Flexible Attrs │
│           │       │ (Attributes)         │                      │
│           │       └─────────────────────┘                      │
│           │                                                      │
│           └─────► ┌─────────────────────┐                      │
│                   │ core_relationships   │ ◄─── Entity Links   │
│                   │ (Entity Links)       │                      │
│                   └─────────────────────┘                      │
│           │                                                      │
│           │ references                                          │
│           ▼                                                      │
│  ┌────────────────────────┐                                    │
│  │ universal_transactions │  ◄─── Transactional Data          │
│  │ (Transactions)         │       (Appointments, Sales)        │
│  └────────┬───────────────┘                                    │
│           │                                                      │
│           └─────► ┌──────────────────────────┐                │
│                   │ universal_transaction_   │ ◄─── Line Items │
│                   │ lines (Line Items)       │                  │
│                   └──────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principles:**
1. **No Schema Changes**: All business data via dynamic fields
2. **Organization Isolation**: Every query filtered by `organization_id`
3. **Actor Stamping**: All writes tracked with `created_by`/`updated_by`
4. **Smart Code Intelligence**: Every record has business context
5. **Relationship-Based Workflows**: Status via relationships, not columns

---

## Core Entities

### 📊 **Table Schema** (`core_entities`)

Master data storage for all business entities (customers, staff, services, products, etc.).

```typescript
interface CoreEntities {
  // REQUIRED SYSTEM FIELDS (4)
  id: string                      // UUID auto-generated
  organization_id: string         // Multi-tenant isolation (SACRED)
  entity_type: string             // Classification (e.g., 'CUSTOMER', 'STAFF')
  entity_name: string             // Display name (e.g., 'John Doe')

  // REQUIRED BUSINESS FIELD (1)
  smart_code: string              // HERA DNA pattern (e.g., 'HERA.SALON.CUSTOMER.ENTITY.v1')

  // OPTIONAL CORE FIELDS (3)
  entity_code?: string            // Business identifier (e.g., 'CUST-001')
  entity_description?: string     // Additional details
  status?: string                 // Lifecycle status ('active', 'inactive', 'deleted')

  // HIERARCHY FIELD (1)
  parent_entity_id?: string       // Enables entity hierarchies

  // AI FIELDS (3)
  ai_confidence?: string          // AI confidence score (0.0-1.0)
  ai_insights?: string            // JSONB AI-generated insights
  ai_classification?: string      // AI classification label

  // WORKFLOW FIELDS (1)
  smart_code_status?: string      // Smart code lifecycle ('ACTIVE', 'DEPRECATED')

  // ADVANCED FEATURES (3)
  business_rules?: string         // JSONB rule engine configuration
  metadata?: any                  // JSONB flexible metadata (system use only)
  tags?: string                   // Array of tags for categorization

  // AUDIT FIELDS (5)
  created_at: string              // ISO 8601 timestamp
  updated_at: string              // ISO 8601 timestamp
  created_by?: string             // Actor user entity ID
  updated_by?: string             // Actor user entity ID
  version?: string                // Optimistic locking version
}
```

**Total Columns**: 20 (100% coverage in HERA Universal API)

### 🎯 **Entity Types Used in Salon Module**

```typescript
// Master Data Entities
type SalonEntityType =
  | 'CUSTOMER'              // Salon customers
  | 'STAFF'                 // Staff members (stylists, receptionists)
  | 'SERVICE'               // Services offered (haircut, treatment)
  | 'PRODUCT'               // Retail products (shampoo, styling gel)
  | 'BRANCH'                // Salon branches/locations
  | 'LEAVE_POLICY'          // Leave policies for staff
  | 'GL_ACCOUNT'            // Chart of Accounts (GL accounts)
  | 'CATEGORY'              // Service/product categories
  | 'USER'                  // User accounts (staff login credentials)
  | 'STATUS'                // Status entities for workflows
```

### ✅ **Required vs Optional Fields**

**ALWAYS Required (Non-Negotiable)**:
- `organization_id` - Multi-tenant isolation
- `entity_type` - Entity classification
- `entity_name` - Display name
- `smart_code` - HERA DNA pattern

**Recommended for Business Logic**:
- `entity_code` - Unique business identifier (e.g., 'CUST-001')
- `status` - Lifecycle management ('active', 'inactive', 'deleted')

**Optional Based on Use Case**:
- `parent_entity_id` - Only if hierarchies needed
- `ai_*` fields - Only if AI features enabled
- `business_rules` - Only for complex validation logic
- `metadata` - System metadata only (NOT business data)
- `tags` - For categorization and filtering

### 🚨 **Critical Rules**

**❌ NEVER Store Business Data in Metadata**:
```typescript
// ❌ WRONG - Business data in metadata
const entity = {
  entity_type: 'CUSTOMER',
  entity_name: 'John Doe',
  metadata: {
    email: 'john@example.com',      // WRONG
    phone: '+1234567890',            // WRONG
    loyalty_points: 150              // WRONG
  }
}

// ✅ CORRECT - Business data in core_dynamic_data
const entity = {
  entity_type: 'CUSTOMER',
  entity_name: 'John Doe'
  // Email, phone, loyalty_points stored in core_dynamic_data separately
}
```

**✅ Metadata for System Use Only**:
```typescript
// ✅ CORRECT - System metadata only
const entity = {
  entity_type: 'CUSTOMER',
  entity_name: 'John Doe',
  metadata: {
    metadata_category: 'system_ai',
    ai_model_version: 'v2.1',
    data_source: 'api_import',
    import_batch_id: 'BATCH-2024-001'
  }
}
```

---

## Core Dynamic Data

### 📊 **Table Schema** (`core_dynamic_data`)

Stores all business attributes for entities as flexible key-value pairs.

```typescript
interface CoreDynamicData {
  // REQUIRED SYSTEM FIELDS
  id: string                      // UUID auto-generated
  organization_id: string         // Multi-tenant isolation (SACRED)
  entity_id: string               // Foreign key to core_entities
  field_name: string              // Attribute name (e.g., 'email', 'price')

  // TYPED VALUE FIELDS (ONE MUST BE SET)
  field_type?: string             // 'text' | 'number' | 'boolean' | 'date' | 'json' | 'file'
  field_value_text?: string       // For text values
  field_value_number?: number     // For numeric values
  field_value_boolean?: string    // For boolean values ('true'/'false')
  field_value_date?: string       // For date values (ISO 8601)
  field_value_json?: any          // For complex JSON objects
  field_value_file_url?: string   // For file references

  // COMPUTED FIELDS
  calculated_value?: string       // Derived/computed values

  // SMART CODE & AI FIELDS
  smart_code?: string             // HERA DNA pattern for this field
  smart_code_status?: string      // Smart code lifecycle
  ai_confidence?: string          // AI confidence score
  ai_enhanced_value?: string      // AI-enhanced value
  ai_insights?: string            // AI insights about this field

  // VALIDATION & DISPLAY
  validation_rules?: string       // JSONB validation rules
  validation_status?: string      // Validation result
  field_order?: string            // Display order
  is_searchable?: boolean         // Include in search index
  is_required?: boolean           // Required field validation
  is_system_field?: boolean       // System vs user field

  // AUDIT FIELDS
  created_at: string              // ISO 8601 timestamp
  updated_at?: string             // ISO 8601 timestamp
  created_by?: string             // Actor user entity ID
  updated_by?: string             // Actor user entity ID
  version?: string                // Optimistic locking version
}
```

### 🎯 **Common Dynamic Fields in Salon Module**

**Customer Dynamic Fields**:
```typescript
const customerDynamicFields = [
  { field_name: 'email', field_type: 'text' },
  { field_name: 'phone', field_type: 'text' },
  { field_name: 'loyalty_points', field_type: 'number' },
  { field_name: 'preferred_contact_method', field_type: 'text' },
  { field_name: 'birthday', field_type: 'date' },
  { field_name: 'notes', field_type: 'text' },
  { field_name: 'vip_status', field_type: 'boolean' }
]
```

**Service Dynamic Fields**:
```typescript
const serviceDynamicFields = [
  { field_name: 'price', field_type: 'number' },
  { field_name: 'duration', field_type: 'number' },  // minutes
  { field_name: 'description', field_type: 'text' },
  { field_name: 'category', field_type: 'text' },
  { field_name: 'requires_deposit', field_type: 'boolean' },
  { field_name: 'deposit_amount', field_type: 'number' }
]
```

**Product Dynamic Fields**:
```typescript
const productDynamicFields = [
  { field_name: 'price', field_type: 'number' },
  { field_name: 'cost', field_type: 'number' },
  { field_name: 'barcode', field_type: 'text' },
  { field_name: 'sku', field_type: 'text' },
  { field_name: 'reorder_level', field_type: 'number' },
  { field_name: 'supplier', field_type: 'text' },
  { field_name: 'category', field_type: 'text' }
]
```

**Staff Dynamic Fields**:
```typescript
const staffDynamicFields = [
  { field_name: 'role', field_type: 'text' },         // 'stylist', 'receptionist'
  { field_name: 'hire_date', field_type: 'date' },
  { field_name: 'commission_rate', field_type: 'number' },
  { field_name: 'specialties', field_type: 'json' },  // Array of specialties
  { field_name: 'availability', field_type: 'json' }, // Schedule availability
  { field_name: 'hourly_rate', field_type: 'number' }
]
```

**Branch Dynamic Fields**:
```typescript
const branchDynamicFields = [
  { field_name: 'address', field_type: 'text' },
  { field_name: 'phone', field_type: 'text' },
  { field_name: 'email', field_type: 'text' },
  // Business hours (21 fields total: 7 days × 3 fields each)
  { field_name: 'hours_monday_open', field_type: 'text' },
  { field_name: 'hours_monday_close', field_type: 'text' },
  { field_name: 'hours_monday_is_open', field_type: 'boolean' },
  // ... repeated for tuesday through sunday
]
```

### 🔄 **Dynamic Data Access Patterns**

**Create Dynamic Field**:
```typescript
import { apiV2 } from '@/lib/client/fetchV2'

await apiV2.post('entities/dynamic-data', {
  entity_id: 'customer-uuid',
  field_name: 'email',
  field_value_text: 'john@example.com',
  field_type: 'text',
  smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1',
  organization_id: orgId
})
```

**Batch Create Dynamic Fields**:
```typescript
const dynamicFields = {
  email: {
    field_type: 'text',
    field_value_text: 'john@example.com',
    smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
  },
  phone: {
    field_type: 'text',
    field_value_text: '+1234567890',
    smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
  },
  loyalty_points: {
    field_type: 'number',
    field_value_number: 150,
    smart_code: 'HERA.SALON.CUSTOMER.FIELD.LOYALTY.v1'
  }
}

await callRPC('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_entity: { entity_type: 'CUSTOMER', entity_name: 'John Doe' },
  p_dynamic: dynamicFields,
  p_relationships: [],
  p_options: { include_dynamic: true }
})
```

**Query Entity with Dynamic Fields**:
```typescript
const { entities } = useUniversalEntityV1({
  entity_type: 'CUSTOMER',
  organizationId: orgId,
  filters: {
    list_mode: 'FULL',  // Includes dynamic fields
    limit: 100
  }
})

// Access dynamic fields
entities.forEach(entity => {
  const email = entity.dynamic_fields?.email?.field_value_text
  const loyaltyPoints = entity.dynamic_fields?.loyalty_points?.field_value_number
})
```

---

## Core Relationships

### 📊 **Table Schema** (`core_relationships`)

Stores directed relationships between entities with temporal validity.

```typescript
interface CoreRelationships {
  // REQUIRED SYSTEM FIELDS
  id: string                      // UUID auto-generated
  organization_id: string         // Multi-tenant isolation (SACRED)
  from_entity_id: string          // Source entity ID
  to_entity_id: string            // Target entity ID
  relationship_type: string       // Relationship classification

  // RELATIONSHIP METADATA
  relationship_direction?: string // 'FORWARD' | 'BIDIRECTIONAL'
  relationship_strength?: string  // Strength indicator (e.g., 'PRIMARY', 'SECONDARY')
  relationship_data?: string      // JSONB additional relationship data

  // SMART CODE & AI FIELDS
  smart_code?: string             // HERA DNA pattern
  smart_code_status?: string      // Smart code lifecycle
  ai_confidence?: string          // AI confidence score
  ai_classification?: string      // AI classification
  ai_insights?: string            // AI insights

  // BUSINESS LOGIC
  business_logic?: string         // JSONB business rules
  validation_rules?: string       // JSONB validation rules

  // TEMPORAL VALIDITY
  is_active?: boolean             // Currently active relationship
  effective_date?: string         // Relationship start date (ISO 8601)
  expiration_date?: string        // Relationship end date (ISO 8601)

  // AUDIT FIELDS
  created_at?: string             // ISO 8601 timestamp
  updated_at?: string             // ISO 8601 timestamp
  created_by?: string             // Actor user entity ID
  updated_by?: string             // Actor user entity ID
  version?: string                // Optimistic locking version
}
```

### 🎯 **Relationship Types in Salon Module**

**Status Workflows** (Replacing status columns):
```typescript
type StatusRelationship =
  | 'HAS_STATUS'              // Entity → Status entity
  | 'APPOINTMENT_STATUS'      // Appointment → Status
  | 'LEAVE_STATUS'            // Leave request → Status
```

**Hierarchies**:
```typescript
type HierarchyRelationship =
  | 'PARENT_OF'               // Branch → Sub-branch
  | 'CHILD_OF'                // Sub-branch → Parent branch
  | 'MEMBER_OF'               // Staff → Branch
  | 'REPORTS_TO'              // Staff → Manager
```

**Assignments**:
```typescript
type AssignmentRelationship =
  | 'ASSIGNED_TO'             // Appointment → Staff
  | 'SERVES'                  // Staff → Customer
  | 'MANAGED_BY'              // Branch → Manager
```

**Business Logic**:
```typescript
type BusinessRelationship =
  | 'PREFERS'                 // Customer → Staff (preferred stylist)
  | 'CATEGORIZED_AS'          // Service → Category
  | 'APPROVED_BY'             // Leave request → Approver
  | 'LINKED_TO'               // Generic association
```

### 🔄 **Relationship Access Patterns**

**Create Relationship**:
```typescript
import { apiV2 } from '@/lib/client/fetchV2'

// Assign staff to appointment
await apiV2.post('relationships', {
  from_entity_id: appointmentId,
  to_entity_id: staffId,
  relationship_type: 'ASSIGNED_TO',
  organization_id: orgId,
  smart_code: 'HERA.SALON.APPOINTMENT.REL.STAFF_ASSIGNED.v1',
  effective_date: new Date().toISOString()
})
```

**Status Workflow via Relationship**:
```typescript
// ❌ NEVER DO THIS - Status column approach
await updateEntity({
  id: appointmentId,
  status: 'confirmed'  // WRONG - No status columns!
})

// ✅ CORRECT - Relationship-based status
const confirmedStatusEntity = await createEntity({
  entity_type: 'STATUS',
  entity_name: 'Confirmed',
  smart_code: 'HERA.SALON.APPOINTMENT.STATUS.CONFIRMED.v1'
})

await createRelationship({
  from_entity_id: appointmentId,
  to_entity_id: confirmedStatusEntity.id,
  relationship_type: 'HAS_STATUS',
  effective_date: new Date().toISOString()
})
```

**Query Entities with Relationships**:
```typescript
const { entities } = useUniversalEntityV1({
  entity_type: 'APPOINTMENT',
  organizationId: orgId,
  filters: {
    list_mode: 'FULL',
    include_relationships: true
  }
})

// Access relationships
entities.forEach(appointment => {
  const staffAssignment = appointment.relationships?.find(
    rel => rel.relationship_type === 'ASSIGNED_TO'
  )
  const assignedStaffId = staffAssignment?.to_entity_id
})
```

**Temporal Relationships**:
```typescript
// Create time-limited relationship
await createRelationship({
  from_entity_id: staffId,
  to_entity_id: branchId,
  relationship_type: 'MEMBER_OF',
  effective_date: '2024-01-01T00:00:00Z',
  expiration_date: '2024-12-31T23:59:59Z',  // Expires at year-end
  is_active: true
})

// Query only active relationships
const activeRelationships = await apiV2.get('relationships/list', {
  from_entity_id: staffId,
  is_active: true,
  organization_id: orgId
})
```

---

## Universal Transactions

### 📊 **Table Schema** (`universal_transactions`)

Stores all transactional data (appointments, sales, leave requests, journal entries).

```typescript
interface UniversalTransactions {
  // REQUIRED SYSTEM FIELDS
  id: string                      // UUID auto-generated
  organization_id: string         // Multi-tenant isolation (SACRED)
  transaction_type: string        // Classification (e.g., 'APPOINTMENT', 'SALE')
  transaction_date: string        // ISO 8601 transaction date

  // TRANSACTION IDENTIFICATION
  transaction_code?: string       // Auto-generated transaction number
  reference_number?: number       // Sequential reference number
  external_reference?: string     // External system reference

  // TRANSACTION PARTIES
  source_entity_id?: string       // From entity (e.g., customer)
  target_entity_id?: string       // To entity (e.g., staff, branch)

  // FINANCIAL FIELDS
  total_amount?: number           // Transaction total
  transaction_currency_code?: string  // Currency code (e.g., 'AED', 'USD')
  base_currency_code?: string     // Base currency for multi-currency
  exchange_rate?: string          // Exchange rate if multi-currency
  exchange_rate_date?: string     // Exchange rate date
  exchange_rate_type?: string     // Exchange rate type

  // WORKFLOW FIELDS
  transaction_status?: string     // Transaction status
  approval_required?: string      // Requires approval flag
  approved_by?: string            // Approver entity ID
  approved_at?: string            // Approval timestamp

  // FISCAL PERIOD FIELDS
  fiscal_period_entity_id?: string  // Link to fiscal period entity
  fiscal_year?: string            // Fiscal year (e.g., '2024')
  fiscal_period?: string          // Fiscal period (e.g., 'P01', 'P02')
  posting_period_code?: string    // Posting period code

  // SMART CODE & AI FIELDS
  smart_code?: string             // HERA DNA pattern
  smart_code_status?: string      // Smart code lifecycle
  ai_confidence?: string          // AI confidence score
  ai_classification?: string      // AI classification
  ai_insights?: string            // AI insights

  // BUSINESS CONTEXT
  business_context?: string       // JSONB business context data
  metadata?: any                  // JSONB flexible metadata

  // AUDIT FIELDS
  created_at: string              // ISO 8601 timestamp
  updated_at?: string             // ISO 8601 timestamp
  created_by?: string             // Actor user entity ID
  updated_by?: string             // Actor user entity ID
  version?: string                // Optimistic locking version
}
```

### 🎯 **Transaction Types in Salon Module**

**Appointments**:
```typescript
type AppointmentTransactionType = 'APPOINTMENT'
// Smart Codes:
// 'HERA.SALON.APPOINTMENT.TXN.SCHEDULED.v1'
// 'HERA.SALON.APPOINTMENT.TXN.CONFIRMED.v1'
// 'HERA.SALON.APPOINTMENT.TXN.COMPLETED.v1'
```

**Sales (Point of Sale)**:
```typescript
type POSTransactionType = 'SALE' | 'POS_SALE'
// Smart Codes:
// 'HERA.SALON.POS.TXN.SALE.v1'
// 'HERA.SALON.POS.TXN.SALE.CASH.v1'
// 'HERA.SALON.POS.TXN.SALE.CARD.v1'
```

**Leave Requests**:
```typescript
type LeaveTransactionType = 'LEAVE_REQUEST'
// Smart Codes:
// 'HERA.SALON.LEAVE.TXN.ANNUAL_LEAVE.v1'
// 'HERA.SALON.LEAVE.TXN.SICK_LEAVE.v1'
// 'HERA.SALON.LEAVE.TXN.UNPAID_LEAVE.v1'
```

**General Ledger (Finance DNA v2)**:
```typescript
type GLTransactionType = 'GL_JOURNAL'
// Smart Codes:
// 'HERA.FINANCE.GL.TXN.JOURNAL.v1'
// 'HERA.FINANCE.GL.TXN.POSTING.v1'
```

**Expenses**:
```typescript
type ExpenseTransactionType = 'EXPENSE'
// Smart Codes:
// 'HERA.SALON.EXPENSE.TXN.OPERATIONAL.v1'
// 'HERA.SALON.EXPENSE.TXN.PAYROLL.v1'
```

### 🔄 **Transaction Access Patterns**

**Create Transaction with Lines**:
```typescript
import { callRPC } from '@/lib/universal-api-v2-client'

const txnResult = await callRPC('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_transaction: {
    transaction_type: 'APPOINTMENT',
    smart_code: 'HERA.SALON.APPOINTMENT.TXN.SCHEDULED.v1',
    transaction_date: new Date().toISOString(),
    source_entity_id: customerId,    // Customer
    target_entity_id: staffId,       // Assigned staff
    total_amount: 150.00,
    transaction_status: 'scheduled'
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'SERVICE',
      entity_id: serviceId,          // Service entity
      quantity: 1,
      unit_amount: 150.00,
      line_amount: 150.00,
      description: 'Haircut and styling'
    }
  ],
  p_options: {
    include_lines: true
  }
})
```

**Query Transactions**:
```typescript
const { transactions } = useUniversalTransactionV1({
  transaction_type: 'APPOINTMENT',
  organizationId: orgId,
  filters: {
    date_from: '2024-01-01',
    date_to: '2024-12-31',
    source_entity_id: customerId,  // Filter by customer
    list_mode: 'FULL'
  }
})
```

---

## Universal Transaction Lines

### 📊 **Table Schema** (`universal_transaction_lines`)

Stores line items for all transactions.

```typescript
interface UniversalTransactionLines {
  // REQUIRED SYSTEM FIELDS
  id: string                      // UUID auto-generated
  organization_id: string         // Multi-tenant isolation (SACRED)
  transaction_id: string          // Foreign key to universal_transactions
  line_number: number             // Line sequence number (1, 2, 3...)
  line_amount: number             // Line total amount (REQUIRED)

  // LINE IDENTIFICATION
  entity_id?: string              // Related entity (service, product, GL account)
  line_type?: string              // Line classification (e.g., 'SERVICE', 'PRODUCT', 'GL')
  description?: string            // Line description

  // FINANCIAL FIELDS
  quantity?: string               // Quantity (stored as string for flexibility)
  unit_amount?: number            // Unit price
  discount_amount?: number        // Discount applied
  tax_amount?: number             // Tax amount

  // SMART CODE & AI FIELDS
  smart_code?: string             // HERA DNA pattern
  smart_code_status?: string      // Smart code lifecycle
  ai_confidence?: string          // AI confidence score
  ai_classification?: string      // AI classification
  ai_insights?: string            // AI insights

  // LINE DATA
  line_data?: string              // JSONB additional line data (GL entries, etc.)

  // AUDIT FIELDS
  created_at: string              // ISO 8601 timestamp
  updated_at: string              // ISO 8601 timestamp
  created_by?: string             // Actor user entity ID
  updated_by?: string             // Actor user entity ID
  version?: string                // Optimistic locking version
}
```

### 🎯 **Line Types in Salon Module**

**Appointment Lines**:
```typescript
type AppointmentLineType =
  | 'SERVICE'                // Service line item
  | 'PRODUCT'                // Product add-on
  | 'DISCOUNT'               // Discount line
  | 'TIP'                    // Tip/gratuity
```

**Point of Sale Lines**:
```typescript
type POSLineType =
  | 'SERVICE'                // Service item
  | 'PRODUCT'                // Product item
  | 'PAYMENT'                // Payment line (cash, card)
  | 'TAX'                    // Tax line (VAT)
  | 'TIP'                    // Tip/gratuity
  | 'DISCOUNT'               // Discount line
```

**General Ledger Lines**:
```typescript
type GLLineType =
  | 'GL'                     // GL account posting
  | 'DEBIT'                  // Debit entry
  | 'CREDIT'                 // Credit entry
```

**Leave Request Lines**:
```typescript
type LeaveLineType =
  | 'LEAVE_DAY'              // Single leave day entry
```

### 🔄 **Transaction Line Access Patterns**

**Create Transaction Lines**:
```typescript
const lines = [
  {
    line_number: 1,
    line_type: 'SERVICE',
    entity_id: serviceId,
    description: 'Premium Haircut',
    quantity: 1,
    unit_amount: 150.00,
    line_amount: 150.00,
    smart_code: 'HERA.SALON.APPOINTMENT.LINE.SERVICE.v1'
  },
  {
    line_number: 2,
    line_type: 'PRODUCT',
    entity_id: productId,
    description: 'Hair Styling Gel',
    quantity: 1,
    unit_amount: 25.00,
    line_amount: 25.00,
    smart_code: 'HERA.SALON.APPOINTMENT.LINE.PRODUCT.v1'
  },
  {
    line_number: 3,
    line_type: 'TAX',
    description: 'VAT 5%',
    quantity: 1,
    unit_amount: 8.75,
    line_amount: 8.75,
    smart_code: 'HERA.SALON.POS.LINE.TAX.VAT.v1'
  }
]

// Total: 150.00 + 25.00 + 8.75 = 183.75
```

**GL Journal Lines with line_data**:
```typescript
const glLines = [
  {
    line_number: 1,
    line_type: 'GL',
    entity_id: cashAccountId,
    line_amount: 183.75,
    line_data: {
      account: '110000',          // Cash account
      side: 'DR',                 // Debit
      amount: 183.75,
      currency: 'AED',
      description: 'Cash receipt from customer'
    }
  },
  {
    line_number: 2,
    line_type: 'GL',
    entity_id: revenueAccountId,
    line_amount: 175.00,
    line_data: {
      account: '410000',          // Revenue account
      side: 'CR',                 // Credit
      amount: 175.00,
      currency: 'AED',
      description: 'Service revenue'
    }
  },
  {
    line_number: 3,
    line_type: 'GL',
    entity_id: vatPayableAccountId,
    line_amount: 8.75,
    line_data: {
      account: '210000',          // VAT payable
      side: 'CR',                 // Credit
      amount: 8.75,
      currency: 'AED',
      description: 'VAT collected'
    }
  }
]

// DR = CR balance check: 183.75 = 175.00 + 8.75 ✅
```

---

## Core Organizations

### 📊 **Table Schema** (`core_organizations`)

Stores organization/tenant data for multi-tenancy.

```typescript
interface CoreOrganizations {
  // REQUIRED SYSTEM FIELDS
  id: string                      // UUID (organization_id)
  organization_name: string       // Organization display name
  organization_code: string       // Unique organization code

  // CLASSIFICATION
  organization_type?: string      // Type (e.g., 'SALON', 'RESTAURANT', 'ENTERPRISE')
  industry_classification?: string // Industry classification

  // HIERARCHY
  parent_organization_id?: string // Parent organization (multi-org groups)

  // AI FIELDS
  ai_insights?: string            // JSONB AI insights
  ai_classification?: string      // AI classification
  ai_confidence?: string          // AI confidence score

  // CONFIGURATION
  settings?: string               // JSONB organization settings

  // WORKFLOW FIELDS
  status?: string                 // Organization status

  // AUDIT FIELDS
  created_at: string              // ISO 8601 timestamp
  updated_at: string              // ISO 8601 timestamp
  created_by?: string             // Actor user entity ID
  updated_by?: string             // Actor user entity ID
}
```

### 🎯 **Organization Settings Pattern**

```typescript
// Organization settings stored in JSONB
const organizationSettings = {
  business_hours: {
    monday: { open: '09:00', close: '18:00', is_open: true },
    tuesday: { open: '09:00', close: '18:00', is_open: true },
    // ... other days
  },
  fiscal_year_start: '01-01',     // MM-DD format
  default_currency: 'AED',
  vat_rate: 0.05,                 // 5%
  appointment_buffer: 15,         // minutes
  payment_methods: ['CASH', 'CARD', 'WALLET'],
  features_enabled: {
    appointments: true,
    pos: true,
    inventory: true,
    leave_management: true
  }
}
```

---

## Smart Code System

### 🧬 **HERA DNA Smart Code Convention**

Every entity, transaction, and field MUST have a smart code following this pattern:

```
HERA.{MODULE}.{TYPE}.{SUBTYPE}.{DETAILS}.v{VERSION}
```

**Format Rules**:
- **6-10 segments** total
- **UPPERCASE** for all segments EXCEPT version
- **Version segment** MUST be lowercase `.v1` (not `.V1`)
- Use existing families, don't invent new ones

### 📚 **Salon Module Smart Codes**

**Entity Smart Codes**:
```typescript
const entitySmartCodes = {
  CUSTOMER: 'HERA.SALON.CUSTOMER.ENTITY.v1',
  STAFF: 'HERA.SALON.STAFF.ENTITY.v1',
  SERVICE: 'HERA.SALON.SERVICE.ENTITY.v1',
  PRODUCT: 'HERA.SALON.PRODUCT.ENTITY.v1',
  BRANCH: 'HERA.SALON.BRANCH.ENTITY.v1',
  LEAVE_POLICY: 'HERA.SALON.LEAVE_POLICY.ENTITY.v1',
  GL_ACCOUNT: 'HERA.FINANCE.GL.ACCOUNT.ENTITY.v1',
  CATEGORY: 'HERA.SALON.CATEGORY.ENTITY.v1'
}
```

**Transaction Smart Codes**:
```typescript
const transactionSmartCodes = {
  APPOINTMENT: 'HERA.SALON.APPOINTMENT.TXN.SCHEDULED.v1',
  SALE: 'HERA.SALON.POS.TXN.SALE.v1',
  LEAVE_REQUEST: 'HERA.SALON.LEAVE.TXN.ANNUAL_LEAVE.v1',
  GL_JOURNAL: 'HERA.FINANCE.GL.TXN.JOURNAL.v1',
  EXPENSE: 'HERA.SALON.EXPENSE.TXN.OPERATIONAL.v1'
}
```

**Dynamic Field Smart Codes**:
```typescript
const fieldSmartCodes = {
  CUSTOMER_EMAIL: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1',
  CUSTOMER_PHONE: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1',
  CUSTOMER_LOYALTY: 'HERA.SALON.CUSTOMER.FIELD.LOYALTY.v1',
  SERVICE_PRICE: 'HERA.SALON.SERVICE.FIELD.PRICE.v1',
  SERVICE_DURATION: 'HERA.SALON.SERVICE.FIELD.DURATION.v1',
  PRODUCT_BARCODE: 'HERA.SALON.PRODUCT.FIELD.BARCODE.v1',
  STAFF_HIRE_DATE: 'HERA.SALON.STAFF.FIELD.HIRE_DATE.v1'
}
```

**Relationship Smart Codes**:
```typescript
const relationshipSmartCodes = {
  STAFF_ASSIGNED: 'HERA.SALON.APPOINTMENT.REL.STAFF_ASSIGNED.v1',
  CUSTOMER_PREFERS: 'HERA.SALON.CUSTOMER.REL.PREFERRED_STAFF.v1',
  MEMBER_OF_BRANCH: 'HERA.SALON.STAFF.REL.BRANCH_MEMBER.v1',
  HAS_STATUS: 'HERA.SALON.ENTITY.REL.STATUS.v1'
}
```

---

## RPC Function Signatures

### 🎯 **hera_entities_crud_v1** (Entity CRUD Operations)

```typescript
interface EntityCRUDParams {
  p_action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id: string            // WHO is making the change
  p_organization_id: string          // WHERE (tenant boundary)
  p_entity: {
    entity_id?: string               // Required for UPDATE/DELETE
    entity_type: string              // Required for CREATE
    entity_name?: string             // Required for CREATE
    entity_code?: string             // Optional
    smart_code: string               // Required for CREATE
    status?: string                  // Optional
    parent_entity_id?: string        // Optional
    business_rules?: Record<string, any>  // Optional JSONB
    metadata?: Record<string, any>   // Optional JSONB
    tags?: string[]                  // Optional
  }
  p_dynamic: Record<string, {
    type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'file'
    value: any                       // Actual value (NOT field_value_text format)
    smart_code: string               // Field smart code
  }>
  p_relationships: Array<{
    to_entity_id: string
    relationship_type: string
    smart_code?: string
    effective_date?: string
    expiration_date?: string
  }>
  p_options: {
    include_dynamic?: boolean        // Include dynamic fields in response
    include_relationships?: boolean  // Include relationships in response
    limit?: number                   // For READ operations
  }
}
```

### 🎯 **hera_txn_crud_v1** (Transaction CRUD Operations)

```typescript
interface TransactionCRUDParams {
  p_action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id: string            // WHO is making the change
  p_organization_id: string          // WHERE (tenant boundary)
  p_transaction: {
    transaction_id?: string          // Required for UPDATE/DELETE
    transaction_type: string         // Required for CREATE
    smart_code: string               // Required for CREATE
    transaction_date?: string        // ISO 8601 (defaults to NOW())
    transaction_code?: string        // Auto-generated if not provided
    source_entity_id?: string        // Optional
    target_entity_id?: string        // Optional
    total_amount?: number            // Optional
    transaction_status?: string      // Optional
    transaction_currency_code?: string  // Optional (defaults to org currency)
    business_context?: Record<string, any>  // Optional JSONB
    metadata?: Record<string, any>   // Optional JSONB
  }
  p_lines: Array<{
    line_number: number              // Required (1, 2, 3...)
    line_type: string                // Required
    entity_id?: string               // Optional (service/product/account)
    description?: string             // Optional
    quantity?: number                // Optional (defaults to 1)
    unit_amount?: number             // Optional (defaults to 0)
    line_amount: number              // Required
    discount_amount?: number         // Optional
    tax_amount?: number              // Optional
    smart_code?: string              // Optional
    line_data?: Record<string, any>  // Optional JSONB (for GL entries)
  }>
  p_options: {
    include_lines?: boolean          // Include lines in response
    limit?: number                   // For READ operations
  }
}
```

---

## Data Transformation Patterns

### 🔄 **RPC Format vs Entity Format**

**CRITICAL**: RPC functions use a DIFFERENT format than the Entity format returned by queries.

**RPC Format (for writes)**:
```typescript
// ✅ CORRECT - RPC format for hera_entities_crud_v1
const dynamicFields = {
  email: {
    type: 'text',                    // NOT field_type
    value: 'john@example.com',       // NOT field_value_text
    smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
  },
  loyalty_points: {
    type: 'number',                  // NOT field_type
    value: 150,                      // NOT field_value_number
    smart_code: 'HERA.SALON.CUSTOMER.FIELD.LOYALTY.v1'
  }
}
```

**Entity Format (from reads)**:
```typescript
// ❌ WRONG - This is READ format, NOT RPC format
const dynamicFields = {
  email: {
    field_type: 'text',              // Entity format
    field_value_text: 'john@example.com',  // Entity format
    smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
  },
  loyalty_points: {
    field_type: 'number',            // Entity format
    field_value_number: 150,         // Entity format
    smart_code: 'HERA.SALON.CUSTOMER.FIELD.LOYALTY.v1'
  }
}
```

**Transformation Helper**:
```typescript
function entityToRPCFormat(entityDynamicFields: Record<string, any>): Record<string, any> {
  const rpcFormat: Record<string, any> = {}

  Object.entries(entityDynamicFields).forEach(([key, field]) => {
    rpcFormat[key] = {
      type: field.field_type,
      value: field.field_value_text
             || field.field_value_number
             || field.field_value_boolean
             || field.field_value_date
             || field.field_value_json,
      smart_code: field.smart_code
    }
  })

  return rpcFormat
}
```

---

## Query Patterns

### 🔍 **Common Query Patterns in Salon Module**

**Query All Customers**:
```typescript
const { entities: customers } = useUniversalEntityV1({
  entity_type: 'CUSTOMER',
  organizationId: orgId,
  filters: {
    status: 'active',
    list_mode: 'FULL',
    limit: 100
  }
})
```

**Query Appointments for a Date**:
```typescript
const { transactions: appointments } = useUniversalTransactionV1({
  transaction_type: 'APPOINTMENT',
  organizationId: orgId,
  filters: {
    date_from: '2024-01-15',
    date_to: '2024-01-15',
    list_mode: 'FULL',
    include_lines: true
  }
})
```

**Query Staff with Relationships**:
```typescript
const { entities: staff } = useUniversalEntityV1({
  entity_type: 'STAFF',
  organizationId: orgId,
  filters: {
    list_mode: 'FULL',
    include_relationships: true
  }
})

// Access branch membership
staff.forEach(staffMember => {
  const branchRel = staffMember.relationships?.find(
    rel => rel.relationship_type === 'MEMBER_OF'
  )
  const branchId = branchRel?.to_entity_id
})
```

**Query Services by Category**:
```typescript
// First get category entity ID
const { entities: categories } = useUniversalEntityV1({
  entity_type: 'CATEGORY',
  organizationId: orgId,
  filters: {
    entity_name: 'Hair Services'
  }
})

const categoryId = categories[0]?.id

// Then query services with relationship to category
const { data: services } = await apiV2.get('relationships/list', {
  to_entity_id: categoryId,
  relationship_type: 'CATEGORIZED_AS',
  organization_id: orgId
})

// Extract service IDs from relationships
const serviceIds = services.map(rel => rel.from_entity_id)
```

**Query Leave Requests by Status**:
```typescript
// Get approved status entity
const { entities: statuses } = useUniversalEntityV1({
  entity_type: 'STATUS',
  organizationId: orgId,
  filters: {
    entity_name: 'Approved'
  }
})

const approvedStatusId = statuses[0]?.id

// Query leave requests with approved status relationship
const { data: approvedLeaves } = await apiV2.get('relationships/list', {
  to_entity_id: approvedStatusId,
  relationship_type: 'HAS_STATUS',
  organization_id: orgId
})

// Extract leave request transaction IDs
const leaveRequestIds = approvedLeaves.map(rel => rel.from_entity_id)
```

**Query GL Journal Entries for Period**:
```typescript
const { transactions: glEntries } = useUniversalTransactionV1({
  transaction_type: 'GL_JOURNAL',
  organizationId: orgId,
  filters: {
    date_from: '2024-01-01',
    date_to: '2024-01-31',
    list_mode: 'FULL',
    include_lines: true
  }
})

// Calculate totals by account
const accountTotals: Record<string, number> = {}

glEntries.forEach(entry => {
  entry.lines?.forEach(line => {
    const account = line.line_data?.account
    const amount = line.line_amount
    const side = line.line_data?.side

    if (account) {
      accountTotals[account] = (accountTotals[account] || 0) +
        (side === 'DR' ? amount : -amount)
    }
  })
})
```

---

## 🎯 Quick Reference Summary

### **Sacred Six Tables**:
1. **core_organizations** - Multi-tenant organizations
2. **core_entities** - Master data (customers, staff, services, products)
3. **core_dynamic_data** - Flexible attributes for entities
4. **core_relationships** - Directed relationships between entities
5. **universal_transactions** - Transactional data (appointments, sales)
6. **universal_transaction_lines** - Line items for transactions

### **Critical Rules**:
- ✅ **ALWAYS** filter by `organization_id` (multi-tenant isolation)
- ✅ **ALWAYS** include `smart_code` (HERA DNA intelligence)
- ✅ **ALWAYS** stamp with `created_by`/`updated_by` (actor tracking)
- ❌ **NEVER** store business data in `metadata` (use `core_dynamic_data`)
- ❌ **NEVER** use status columns (use relationships)
- ❌ **NEVER** add columns to tables (use dynamic fields)

### **RPC Functions**:
- **hera_entities_crud_v1** - Entity CRUD operations
- **hera_txn_crud_v1** - Transaction CRUD operations

### **RPC Format (CRITICAL)**:
```typescript
// RPC format uses: { type, value, smart_code }
// NOT: { field_type, field_value_text, smart_code }
```

### **Related Documentation**:
- **HOOKS.md** - Hook architecture and usage
- **AUTHENTICATION.md** - Auth and actor resolution
- **API-ROUTES.md** - API endpoint patterns
- Feature guides: DASHBOARD.md, APPOINTMENTS.md, CUSTOMERS.md, etc.

---

## ✅ Next Steps

After understanding the data models:

1. **Read AUTHENTICATION.md** - Learn actor-based auth and organization context
2. **Read HOOKS.md** - Learn how to query and mutate data via hooks
3. **Read API-ROUTES.md** - Learn API endpoint patterns
4. **Read Feature Guides** - See data models in action

**This guide provides the foundation for working with HERA data. All features build on these Sacred Six tables.**
