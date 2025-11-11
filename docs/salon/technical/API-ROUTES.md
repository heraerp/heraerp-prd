# API Routes Guide

**Complete reference for HERA API v2 routes, RPC patterns, and client SDK usage for Salon module development.**

---

## Table of Contents

1. [API Architecture](#api-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Universal Entity API](#universal-entity-api)
4. [Universal Transaction API](#universal-transaction-api)
5. [Dynamic Data API](#dynamic-data-api)
6. [Relationship API](#relationship-api)
7. [RPC Function API](#rpc-function-api)
8. [Client SDK Usage](#client-sdk-usage)
9. [Error Handling](#error-handling)
10. [Request/Response Patterns](#requestresponse-patterns)
11. [Rate Limiting & Performance](#rate-limiting--performance)
12. [Testing API Routes](#testing-api-routes)

---

## API Architecture

### Design Principles

**Universal API v2 Philosophy:**
- One unified API for all entity types (customers, products, services, etc.)
- RPC-first architecture (all operations through Postgres RPC functions)
- Organization-scoped (multi-tenant isolation)
- Actor-stamped (WHO made the change)
- Smart Code validated (HERA DNA enforcement)

**API Layers:**
```
Client → API Route → RPC Function → Database
   ↓        ↓           ↓              ↓
 SDK    Validation  Guardrails    Postgres
```

### Base URLs

```typescript
// Development
const DEV_BASE_URL = 'http://localhost:3000'

// Production
const PROD_BASE_URL = 'https://app.heraerp.com'

// API v2 Prefix
const API_PREFIX = '/api/v2'
```

---

## Authentication & Authorization

### Authentication Headers

**Every API request MUST include authentication:**

```typescript
// Automatic authentication (using Supabase session)
const authHeaders = await getAuthHeaders()

const response = await fetch('/api/v2/entities', {
  headers: {
    ...authHeaders,  // Includes: Authorization: Bearer <token>
    'x-hera-org': organizationId,
    'x-hera-api-version': 'v2',
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
```

### Required Headers

```typescript
interface RequiredHeaders {
  'Authorization': string       // Bearer token from Supabase
  'x-hera-org': string          // Organization ID (tenant boundary)
  'x-hera-api-version': 'v2'   // API version
}
```

### Authentication Flow

```typescript
// 1. Get Supabase session (with retry for stability)
async function waitForStableSession(maxAttempts = 3): Promise<Session | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (session?.access_token) {
      return session
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)))
    }
  }

  return null
}

// 2. Extract token and build headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await waitForStableSession()

  if (session?.access_token) {
    return {
      'Authorization': `Bearer ${session.access_token}`
    }
  }

  return {}
}
```

### Error Handling

```typescript
// 401 Unauthorized - Redirect to login
if (response.status === 401) {
  handleAuthenticationError(
    {
      endpoint: '/api/v2/entities',
      status: 401,
      message: 'Session expired'
    },
    {
      message: 'Your session has expired. Please log in again.',
      severity: 'warning'
    }
  )
  // Redirects to /auth/login
}
```

---

## Universal Entity API

### Endpoints

```typescript
// Create entity
POST /api/v2/entities

// Read entities (list with filters)
GET /api/v2/entities?entity_type=CUSTOMER&organization_id=...

// Update entity
PUT /api/v2/entities

// Delete entity
DELETE /api/v2/entities/[id]

// Read single entity
GET /api/v2/entities/[id]
```

### Create Entity

**Request:**
```typescript
POST /api/v2/entities
Content-Type: application/json

{
  "entity_type": "CUSTOMER",
  "entity_name": "John Doe",
  "entity_code": "CUST-001",
  "smart_code": "HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1",
  "status": "active",

  // Dynamic fields (business data)
  "dynamic_fields": {
    "email": {
      "value": "john@example.com",
      "type": "text",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.EMAIL.V1"
    },
    "phone": {
      "value": "+971 50 123 4567",
      "type": "text",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.PHONE.V1"
    },
    "vip": {
      "value": true,
      "type": "boolean",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.VIP.V1"
    },
    "loyalty_points": {
      "value": 150,
      "type": "number",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.LOYALTY_POINTS.V1"
    },
    "birthday": {
      "value": "1990-05-15",
      "type": "date",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.BIRTHDAY.V1"
    }
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "entity_id": "uuid-here",
    "entity_type": "CUSTOMER",
    "entity_name": "John Doe",
    "entity_code": "CUST-001",
    "smart_code": "HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1",
    "status": "active",
    "organization_id": "org-uuid",
    "created_at": "2025-01-07T10:00:00Z",
    "created_by": "user-uuid",
    "dynamic_fields": { ... }
  },
  "actor_stamped": true,
  "actor_user_id": "user-uuid"
}
```

### Read Entities (List)

**Request:**
```typescript
GET /api/v2/entities?entity_type=CUSTOMER&organization_id=org-uuid&status=active&include_dynamic=true&include_relationships=true
```

**Query Parameters:**
```typescript
interface EntityQueryParams {
  entity_type?: string          // Filter by type
  entity_id?: string            // Get specific entity
  organization_id: string       // REQUIRED - tenant boundary
  status?: string | null        // Filter by status ('active', 'archived', null=all)
  include_dynamic?: boolean     // Include dynamic fields (default: true)
  include_relationships?: boolean // Include relationships (default: false)
  limit?: number                // Max results (default: 100)
  offset?: number               // Pagination offset (default: 0)
}
```

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "entity_type": "CUSTOMER",
      "entity_name": "John Doe",
      "smart_code": "HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1",
      "status": "active",

      // Dynamic fields (flattened)
      "dynamic_fields": {
        "email": { "value": "john@example.com", "type": "text" },
        "phone": { "value": "+971 50 123 4567", "type": "text" },
        "vip": { "value": true, "type": "boolean" }
      },

      // Relationships (if include_relationships=true)
      "relationships": {
        "referred_by": { "to_entity": { "id": "uuid-2", "entity_name": "Jane Smith" } },
        "preferred_stylist": { "to_entity": { "id": "uuid-3", "entity_name": "Sarah Miller" } }
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

### Update Entity

**Request:**
```typescript
PUT /api/v2/entities
Content-Type: application/json

{
  "entity_id": "uuid-here",
  "entity_name": "John Doe Updated",
  "status": "active",

  // Update specific dynamic fields
  "dynamic_fields": {
    "email": {
      "value": "john.new@example.com",
      "type": "text",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.EMAIL.V1"
    },
    "loyalty_points": {
      "value": 200,
      "type": "number",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.LOYALTY_POINTS.V1"
    }
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Entity updated successfully",
  "actor_stamped": true,
  "actor_user_id": "user-uuid"
}
```

### Delete Entity

**Request:**
```typescript
DELETE /api/v2/entities/uuid-here?hard_delete=false&cascade=true&smart_code=HERA.CORE.ENTITY.DELETE.V1
```

**Query Parameters:**
```typescript
interface DeleteParams {
  hard_delete?: boolean  // true = permanent delete, false = soft delete (default: false)
  cascade?: boolean      // true = delete relationships too (default: true)
  reason?: string        // Reason for deletion (for audit trail)
  smart_code?: string    // Smart code (default: 'HERA.CORE.ENTITY.DELETE.V1')
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Entity deleted successfully"
}

// OR (if referenced in transactions, auto-archived)
{
  "success": true,
  "archived": true,
  "message": "Entity is used in transactions and cannot be deleted. It has been archived instead."
}
```

---

## Universal Transaction API

### Endpoints

```typescript
// Create transaction
POST /api/v2/transactions

// Read transactions (list with filters)
GET /api/v2/transactions?organization_id=...

// Update transaction
PUT /api/v2/transactions/[id]

// Delete transaction
DELETE /api/v2/transactions/[id]

// Get transaction lines
GET /api/v2/transactions/[id]/lines
```

### Create Transaction

**Request:**
```typescript
POST /api/v2/transactions
Content-Type: application/json

{
  "organization_id": "org-uuid",
  "transaction_type": "APPOINTMENT",
  "smart_code": "HERA.SALON.TXN.APPOINTMENT.V1",
  "transaction_date": "2025-01-15T10:00:00Z",
  "source_entity_id": "customer-uuid",  // Customer
  "target_entity_id": "stylist-uuid",   // Stylist
  "total_amount": 450.00,
  "transaction_status": "confirmed",

  "business_context": {
    "appointment_notes": "First visit, prefers morning slots",
    "send_reminder": true
  },

  "lines": [
    {
      "line_number": 1,
      "line_type": "SERVICE",
      "entity_id": "service-uuid",
      "description": "Haircut and Styling",
      "quantity": 1,
      "unit_amount": 450.00,
      "line_amount": 450.00,
      "smart_code": "HERA.SALON.TXN.LINE.SERVICE.V1"
    }
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "transaction_id": "txn-uuid",
    "transaction_code": "TXN-2025-001",
    "organization_id": "org-uuid",
    "transaction_type": "APPOINTMENT",
    "total_amount": 450.00,
    "transaction_status": "confirmed",
    "created_at": "2025-01-07T10:00:00Z",
    "created_by": "user-uuid"
  }
}
```

### Read Transactions (List)

**Request:**
```typescript
GET /api/v2/transactions?organization_id=org-uuid&transaction_type=APPOINTMENT&p_date_from=2025-01-01&p_date_to=2025-01-31&p_include_lines=true
```

**Query Parameters:**
```typescript
interface TransactionQueryParams {
  organization_id: string       // REQUIRED - tenant boundary
  transaction_type?: string     // Filter by type
  smart_code?: string          // Filter by smart code
  p_from_entity_id?: string    // Filter by source entity (customer)
  p_to_entity_id?: string      // Filter by target entity (stylist)
  p_date_from?: string         // Start date (ISO format)
  p_date_to?: string           // End date (ISO format)
  p_include_lines?: boolean    // Include transaction lines (default: false)
}
```

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "txn-uuid",
      "transaction_code": "TXN-2025-001",
      "transaction_type": "APPOINTMENT",
      "transaction_date": "2025-01-15T10:00:00Z",
      "source_entity_id": "customer-uuid",
      "target_entity_id": "stylist-uuid",
      "total_amount": 450.00,
      "transaction_status": "confirmed",

      // Lines (if p_include_lines=true)
      "lines": [
        {
          "line_number": 1,
          "line_type": "SERVICE",
          "entity_id": "service-uuid",
          "description": "Haircut and Styling",
          "quantity": 1,
          "unit_amount": 450.00,
          "line_amount": 450.00
        }
      ]
    }
  ]
}
```

### Update Transaction

**Request:**
```typescript
PUT /api/v2/transactions/txn-uuid
Content-Type: application/json

{
  "p_organization_id": "org-uuid",
  "p_transaction_date": "2025-01-15T14:00:00Z",  // Reschedule
  "p_status": "confirmed",
  "p_metadata": {
    "rescheduled": true,
    "previous_time": "2025-01-15T10:00:00Z"
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Transaction updated successfully"
}
```

### Delete Transaction

**Request:**
```typescript
DELETE /api/v2/transactions/txn-uuid?force=false
```

**Query Parameters:**
```typescript
interface DeleteTransactionParams {
  force?: boolean  // true = hard delete, false = soft delete (default: false)
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

## Dynamic Data API

### Endpoints

```typescript
// Get dynamic data for entity
GET /api/v2/dynamic-data?organization_id=...&entity_id=...

// Set single dynamic field
POST /api/v2/dynamic-data

// Batch set multiple fields
POST /api/v2/dynamic-data/batch

// Delete dynamic field
DELETE /api/v2/dynamic-data
```

### Get Dynamic Data

**Request:**
```typescript
GET /api/v2/dynamic-data?organization_id=org-uuid&entity_id=entity-uuid&field_name=email
```

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "field-uuid",
      "entity_id": "entity-uuid",
      "field_name": "email",
      "field_type": "text",
      "field_value_text": "john@example.com",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.EMAIL.V1",
      "created_at": "2025-01-07T10:00:00Z",
      "updated_at": "2025-01-07T10:00:00Z"
    }
  ]
}
```

### Set Dynamic Field

**Request:**
```typescript
POST /api/v2/dynamic-data
Content-Type: application/json

{
  "p_organization_id": "org-uuid",
  "p_entity_id": "entity-uuid",
  "p_field_name": "loyalty_points",
  "p_field_value_number": 250,
  "p_smart_code": "HERA.SALON.CUSTOMER.FIELD.LOYALTY_POINTS.V1"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "field_name": "loyalty_points",
    "field_value_number": 250
  }
}
```

### Batch Set Dynamic Fields

**Request:**
```typescript
POST /api/v2/dynamic-data/batch
Content-Type: application/json

{
  "p_organization_id": "org-uuid",
  "p_entity_id": "entity-uuid",
  "p_smart_code": "HERA.SALON.CUSTOMER.DYNAMIC.V1",
  "p_fields": [
    {
      "field_name": "email",
      "field_type": "text",
      "field_value": "john@example.com"
    },
    {
      "field_name": "loyalty_points",
      "field_type": "number",
      "field_value_number": 250
    },
    {
      "field_name": "vip",
      "field_type": "boolean",
      "field_value_boolean": true
    }
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "fields_created": 3
}
```

---

## Relationship API

### Endpoints

```typescript
// Get relationships
GET /api/v2/relationships?organization_id=...

// Create relationship
POST /api/v2/relationships

// Delete relationship
DELETE /api/v2/relationships/[id]
```

### Get Relationships

**Request:**
```typescript
GET /api/v2/relationships?organization_id=org-uuid&from_entity_id=customer-uuid&relationship_type=REFERRED_BY
```

**Response:**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "rel-uuid",
      "from_entity_id": "customer-uuid-1",
      "to_entity_id": "customer-uuid-2",
      "relationship_type": "REFERRED_BY",
      "smart_code": "HERA.SALON.RELATIONSHIP.REFERRED_BY.V1",
      "is_active": true,
      "created_at": "2025-01-07T10:00:00Z"
    }
  ]
}
```

### Create Relationship

**Request:**
```typescript
POST /api/v2/relationships
Content-Type: application/json

{
  "organization_id": "org-uuid",
  "from_entity_id": "customer-uuid",
  "to_entity_id": "stylist-uuid",
  "relationship_type": "PREFERRED_STYLIST",
  "smart_code": "HERA.SALON.RELATIONSHIP.PREFERRED_STYLIST.V1",
  "relationship_data": {
    "preference_level": "high",
    "notes": "Requests Sarah for all appointments"
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "rel-uuid",
    "from_entity_id": "customer-uuid",
    "to_entity_id": "stylist-uuid",
    "relationship_type": "PREFERRED_STYLIST",
    "created_at": "2025-01-07T10:00:00Z"
  }
}
```

---

## RPC Function API

### Universal RPC Endpoint

**All RPC functions accessible through:**
```typescript
POST /api/v2/rpc/[functionName]
```

### Entity CRUD RPC

**Function: `hera_entities_crud_v1`**

```typescript
POST /api/v2/rpc/hera_entities_crud_v1
Content-Type: application/json

{
  "p_action": "CREATE",  // or "READ", "UPDATE", "DELETE"
  "p_actor_user_id": "user-uuid",
  "p_organization_id": "org-uuid",

  "p_entity": {
    "entity_type": "CUSTOMER",
    "entity_name": "John Doe",
    "smart_code": "HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1"
  },

  "p_dynamic": {
    "email": {
      "field_type": "text",
      "field_value_text": "john@example.com",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.EMAIL.V1"
    }
  },

  "p_relationships": [],

  "p_options": {
    "include_dynamic": true,
    "include_relationships": true
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "entity": {
    "id": "entity-uuid",
    "entity_type": "CUSTOMER",
    "entity_name": "John Doe"
  },
  "dynamic_data": [
    {
      "field_name": "email",
      "field_value_text": "john@example.com"
    }
  ]
}
```

### Transaction CRUD RPC

**Function: `hera_txn_crud_v1`**

```typescript
POST /api/v2/rpc/hera_txn_crud_v1
Content-Type: application/json

{
  "p_action": "CREATE",
  "p_actor_user_id": "user-uuid",
  "p_organization_id": "org-uuid",

  "p_payload": {
    "header": {
      "transaction_type": "APPOINTMENT",
      "smart_code": "HERA.SALON.TXN.APPOINTMENT.V1",
      "source_entity_id": "customer-uuid",
      "target_entity_id": "stylist-uuid",
      "total_amount": 450.00,
      "transaction_status": "confirmed"
    },

    "lines": [
      {
        "line_number": 1,
        "line_type": "SERVICE",
        "entity_id": "service-uuid",
        "quantity": 1,
        "unit_amount": 450.00,
        "line_amount": 450.00
      }
    ]
  }
}
```

**Response:**
```typescript
{
  "success": true,
  "transaction_id": "txn-uuid",
  "transaction": {
    "id": "txn-uuid",
    "transaction_code": "TXN-2025-001",
    "transaction_type": "APPOINTMENT",
    "total_amount": 450.00
  }
}
```

---

## Client SDK Usage

### Installation

```typescript
// Import universal API client
import {
  getEntities,
  upsertEntity,
  deleteEntity,
  getTransactions,
  createTransaction,
  getDynamicData,
  setDynamicData,
  callRPC,
  entityCRUD,
  transactionCRUD
} from '@/lib/universal-api-v2-client'
```

### Entity Operations

**Get Entities:**
```typescript
// List customers
const customers = await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'CUSTOMER',
  p_status: 'active',
  p_include_dynamic: true,
  p_include_relationships: true
})

// Result: Customer[] with dynamic fields flattened
console.log(customers[0].dynamic_fields?.email?.value)
```

**Create Entity:**
```typescript
const result = await upsertEntity('', {
  p_organization_id: organizationId,
  p_entity_type: 'CUSTOMER',
  p_entity_name: 'John Doe',
  p_smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1',
  p_entity_code: 'CUST-001',
  p_status: 'active'
})

// Returns: { success: true, data: { id: 'uuid', ... } }
```

**Update Entity:**
```typescript
const result = await upsertEntity('', {
  p_organization_id: organizationId,
  p_entity_id: entityId,  // Include for update
  p_entity_name: 'John Doe Updated',
  p_status: 'active'
})
```

**Delete Entity:**
```typescript
const result = await deleteEntity('', {
  p_organization_id: organizationId,
  p_entity_id: entityId,
  hard_delete: false,  // Soft delete
  cascade: true,
  smart_code: 'HERA.CORE.ENTITY.DELETE.V1'
})
```

### Transaction Operations

**Get Transactions:**
```typescript
const transactions = await getTransactions({
  orgId: organizationId,
  transactionType: 'APPOINTMENT',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  includeLines: true
})
```

**Create Transaction:**
```typescript
const result = await createTransaction(organizationId, {
  p_transaction_type: 'APPOINTMENT',
  p_smart_code: 'HERA.SALON.TXN.APPOINTMENT.V1',
  p_from_entity_id: customerId,
  p_to_entity_id: stylistId,
  p_total_amount: 450.00,
  p_status: 'confirmed',
  p_transaction_date: '2025-01-15T10:00:00Z',
  p_lines: [
    {
      line_type: 'SERVICE',
      entity_id: serviceId,
      quantity: 1,
      unit_amount: 450.00,
      line_amount: 450.00
    }
  ]
})
```

### Dynamic Data Operations

**Get Dynamic Data:**
```typescript
const dynamicData = await getDynamicData('', {
  p_organization_id: organizationId,
  p_entity_id: entityId,
  p_field_name: 'email'  // Optional filter
})
```

**Set Dynamic Field:**
```typescript
await setDynamicData(organizationId, {
  p_entity_id: entityId,
  p_field_name: 'loyalty_points',
  p_field_value_number: 250,
  p_smart_code: 'HERA.SALON.CUSTOMER.FIELD.LOYALTY_POINTS.V1'
})
```

**Batch Set Dynamic Fields:**
```typescript
await setDynamicDataBatch('', {
  p_organization_id: organizationId,
  p_entity_id: entityId,
  p_smart_code: 'HERA.SALON.CUSTOMER.DYNAMIC.V1',
  p_fields: [
    {
      field_name: 'email',
      field_type: 'text',
      field_value: 'john@example.com'
    },
    {
      field_name: 'loyalty_points',
      field_type: 'number',
      field_value_number: 250
    }
  ]
})
```

### RPC Operations

**Entity CRUD Orchestrator:**
```typescript
const { data, error } = await entityCRUD({
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_organization_id: organizationId,

  p_entity: {
    entity_type: 'CUSTOMER',
    entity_name: 'John Doe',
    smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'
  },

  p_dynamic: {
    email: {
      field_type: 'text',
      field_value_text: 'john@example.com',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.V1'
    }
  },

  p_options: {
    include_dynamic: true
  }
})

if (error) {
  console.error('Entity creation failed:', error)
} else {
  console.log('Entity created:', data.entity)
}
```

**Transaction CRUD Orchestrator:**
```typescript
const { data, error } = await transactionCRUD({
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_organization_id: organizationId,

  p_payload: {
    header: {
      transaction_type: 'APPOINTMENT',
      smart_code: 'HERA.SALON.TXN.APPOINTMENT.V1',
      source_entity_id: customerId,
      target_entity_id: stylistId,
      total_amount: 450.00
    },

    lines: [
      {
        line_number: 1,
        line_type: 'SERVICE',
        entity_id: serviceId,
        quantity: 1,
        unit_amount: 450.00,
        line_amount: 450.00
      }
    ]
  }
})
```

**Generic RPC Call:**
```typescript
const { data, error } = await callRPC(
  'hera_custom_function_v1',
  {
    p_param1: 'value1',
    p_param2: 'value2'
  },
  organizationId
)
```

---

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: string           // Error message
  details?: string        // Additional details
  code?: string          // Error code
  status?: number        // HTTP status code
}
```

### Common Errors

**401 Unauthorized:**
```typescript
{
  "error": "Unauthorized",
  "details": "Session expired"
}
// Automatically redirects to /auth/login
```

**400 Bad Request:**
```typescript
{
  "error": "Invalid entity data",
  "details": [
    {
      "field": "entity_name",
      "message": "Required field missing"
    }
  ]
}
```

**409 Conflict:**
```typescript
{
  "error": "Duplicate entity code",
  "details": "An entity with code 'CUST-001' already exists in this organization.",
  "code": "DUPLICATE_ENTITY_CODE"
}
```

**500 Internal Server Error:**
```typescript
{
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

### Error Handling Pattern

```typescript
try {
  const result = await upsertEntity('', {
    p_organization_id: organizationId,
    p_entity_type: 'CUSTOMER',
    p_entity_name: 'John Doe',
    p_smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'
  })

  console.log('Success:', result)
} catch (error: any) {
  // 401 errors automatically redirect to login
  // Other errors are caught here

  if (error.message.includes('409')) {
    // Handle duplicate entity code
    toast.error('A customer with this code already exists')
  } else if (error.message.includes('400')) {
    // Handle validation error
    toast.error('Please check your input')
  } else {
    // Generic error
    toast.error('Failed to create customer')
    console.error('Error:', error)
  }
}
```

---

## Request/Response Patterns

### Standard Request Pattern

```typescript
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-hera-api-version': 'v2',
      ...authHeaders,
      ...options.headers
    },
    credentials: 'include'
  })

  // Handle authentication error
  if (response.status === 401) {
    handleAuthenticationError(
      {
        endpoint,
        status: 401,
        message: 'Session expired'
      },
      {
        message: 'Your session has expired. Please log in again.',
        severity: 'warning'
      }
    )
    throw new Error('REDIRECTING_TO_LOGIN')
  }

  // Handle other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText
    }))
    throw new Error(error.error || `Request failed: ${response.status}`)
  }

  return await response.json()
}
```

### Pagination Pattern

```typescript
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function fetchPaginated<T>(
  endpoint: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  })

  return apiRequest<PaginatedResponse<T>>(`${endpoint}?${params}`)
}

// Usage
const customers = await fetchPaginated<Customer>(
  '/api/v2/entities?entity_type=CUSTOMER&organization_id=org-uuid',
  50,
  0
)

console.log(`Showing ${customers.data.length} of ${customers.pagination.total}`)
```

### Infinite Scroll Pattern

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function useInfiniteCustomers(organizationId: string) {
  return useInfiniteQuery({
    queryKey: ['customers-infinite', organizationId],
    queryFn: ({ pageParam = 0 }) =>
      getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: 'CUSTOMER',
        p_include_dynamic: true,
        p_limit: 50,
        p_offset: pageParam
      }),

    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 50) return undefined
      return pages.length * 50
    }
  })
}

// Usage in component
function CustomerList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteCustomers(organizationId)

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.map(customer => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </React.Fragment>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

---

## Rate Limiting & Performance

### Performance Best Practices

**1. Use React Query for Caching:**
```typescript
import { useQuery } from '@tanstack/react-query'

function useCustomers(organizationId: string) {
  return useQuery({
    queryKey: ['customers', organizationId],
    queryFn: () => getEntities('', {
      p_organization_id: organizationId,
      p_entity_type: 'CUSTOMER',
      p_include_dynamic: true
    }),

    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Keep in cache for 10 minutes
    cacheTime: 10 * 60 * 1000
  })
}
```

**2. Optimize Relationship Fetching:**
```typescript
// ❌ BAD - Always fetches relationships (slow)
const customers = await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'CUSTOMER',
  p_include_relationships: true  // Expensive joins
})

// ✅ GOOD - Only fetch when needed
const customers = await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'CUSTOMER',
  p_include_relationships: !!filters.branch_id  // Only when filtering
})
```

**3. Batch Dynamic Data Updates:**
```typescript
// ❌ BAD - Multiple API calls
await setDynamicData(orgId, { p_entity_id: id, p_field_name: 'email', ... })
await setDynamicData(orgId, { p_entity_id: id, p_field_name: 'phone', ... })
await setDynamicData(orgId, { p_entity_id: id, p_field_name: 'vip', ... })

// ✅ GOOD - Single batch call
await setDynamicDataBatch('', {
  p_organization_id: orgId,
  p_entity_id: id,
  p_fields: [
    { field_name: 'email', field_type: 'text', field_value: '...' },
    { field_name: 'phone', field_type: 'text', field_value: '...' },
    { field_name: 'vip', field_type: 'boolean', field_value_boolean: true }
  ]
})
```

### Request Limits

```typescript
export const API_LIMITS = {
  maxEntitiesPerRequest: 1000,
  maxTransactionsPerRequest: 1000,
  maxDynamicFieldsPerBatch: 50,
  maxRelationshipsPerBatch: 100,

  // Rate limits (per user, per minute)
  maxRequestsPerMinute: 120,
  maxConcurrentRequests: 10
}
```

---

## Testing API Routes

### Unit Testing with MSW

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock GET /api/v2/entities
  http.get('/api/v2/entities', ({ request }) => {
    const url = new URL(request.url)
    const entityType = url.searchParams.get('entity_type')

    if (entityType === 'CUSTOMER') {
      return HttpResponse.json({
        success: true,
        data: [
          {
            id: '1',
            entity_name: 'Mock Customer 1',
            entity_type: 'CUSTOMER',
            dynamic_fields: {
              email: { value: 'mock1@example.com' }
            }
          }
        ]
      })
    }
  }),

  // Mock POST /api/v2/entities
  http.post('/api/v2/entities', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-uuid',
        ...body
      }
    }, { status: 201 })
  })
]
```

### API Testing with Playwright

```typescript
// tests/api/customers.api.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Customers API', () => {
  let apiContext: any

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'x-hera-org': 'test-org-123'
      }
    })
  })

  test('GET /api/v2/entities - should return customers', async () => {
    const response = await apiContext.get('/api/v2/entities', {
      params: {
        entity_type: 'CUSTOMER',
        organization_id: 'test-org-123'
      }
    })

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('POST /api/v2/entities - should create customer', async () => {
    const response = await apiContext.post('/api/v2/entities', {
      data: {
        entity_type: 'CUSTOMER',
        entity_name: 'API Test Customer',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'
      }
    })

    expect(response.status()).toBe(201)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('id')
  })
})
```

---

## API Checklist

### Before Every API Call

- [ ] ✅ Include authentication headers (Bearer token)
- [ ] ✅ Include organization ID (`x-hera-org` header)
- [ ] ✅ Include API version (`x-hera-api-version: v2`)
- [ ] ✅ Validate Smart Codes (HERA DNA format)
- [ ] ✅ Handle 401 errors (authentication)
- [ ] ✅ Handle 409 errors (conflicts)
- [ ] ✅ Implement proper error handling
- [ ] ✅ Use React Query for caching
- [ ] ✅ Test API routes

### Production Deployment

- [ ] ✅ All API routes tested
- [ ] ✅ Error handling implemented
- [ ] ✅ Rate limiting configured
- [ ] ✅ Authentication working
- [ ] ✅ Multi-tenant isolation verified
- [ ] ✅ Actor stamping enabled
- [ ] ✅ Performance optimized (< 200ms)

---

## Related Documentation

- **Performance Guide**: `/docs/salon/technical/PERFORMANCE.md`
- **Testing Guide**: `/docs/salon/technical/TESTING.md`
- **Hooks Reference**: `/docs/salon/technical/HOOKS.md`
- **Data Models**: `/docs/salon/technical/DATA-MODELS.md`
- **Authentication**: `/docs/salon/technical/AUTHENTICATION.md`

---

**Use the Universal API v2 for all operations. One API to rule them all.**
