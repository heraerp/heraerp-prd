# Universal API v2 - RPC-First Architecture

The Universal API v2 is a comprehensive RPC-first implementation that directly calls HERA database functions through Supabase. It provides a type-safe, validated interface to all HERA operations while maintaining complete consistency with the underlying database functions.

## Architecture Overview

### RPC-First Design
- Direct mapping to HERA database functions (hera_entity_*, hera_dynamic_data_*, etc.)
- Server-side Supabase client with service role key for bypassing RLS
- Comprehensive Zod validation matching exact RPC parameter names
- Smart Code validation for business context
- Multi-tenant organization isolation

### Key Files
- `/src/lib/universal/guardrails.ts` - Core validation utilities
- `/src/lib/universal/supabase.ts` - Server-side Supabase client
- `/src/lib/universal/schemas.ts` - Zod schemas for all operations
- `/src/lib/universal/hooks.ts` - React hooks for client usage

## API Endpoints

### Entity Operations

#### Create/Update Entity
```http
POST /api/universal/entities
```
```json
{
  "p_organization_id": "uuid",
  "p_entity_type": "customer",
  "p_entity_name": "Acme Corp",
  "p_entity_code": "CUST-001",
  "p_smart_code": "HERA.CRM.CUSTOMER.ENTITY.v1",
  "p_business_context": { "industry": "tech" },
  "p_metadata": { "rating": "A+" }
}
```

#### Search Entities
```http
GET /api/universal/entities?p_organization_id=uuid&p_entity_type=customer
```

#### Get Single Entity
```http
GET /api/universal/entities/{id}
```

#### Delete Entity
```http
DELETE /api/universal/entities/{id}
```

#### Recover Deleted Entity
```http
POST /api/universal/entities/{id}/recover
```

### Dynamic Data Operations

#### Set Single Field
```http
POST /api/universal/dynamic-data
```
```json
{
  "p_organization_id": "uuid",
  "p_entity_id": "uuid",
  "p_field_name": "credit_limit",
  "p_field_type": "number",
  "p_field_value_number": 100000,
  "p_smart_code": "HERA.CRM.FIELD.CREDIT_LIMIT.v1"
}
```

#### Batch Set Fields
```http
POST /api/universal/dynamic-data
```
```json
{
  "p_organization_id": "uuid",
  "p_items": [
    {
      "p_entity_id": "uuid",
      "p_field_name": "credit_limit",
      "p_field_type": "number",
      "p_field_value_number": 100000,
      "p_smart_code": "HERA.CRM.FIELD.CREDIT_LIMIT.v1"
    }
  ]
}
```

#### Get Dynamic Data
```http
GET /api/universal/dynamic-data/get?p_organization_id=uuid&p_entity_id=uuid
```

#### Delete Dynamic Fields
```http
POST /api/universal/dynamic-data/delete
```
```json
{
  "p_organization_id": "uuid",
  "p_entity_id": "uuid",
  "p_field_names": ["credit_limit", "payment_terms"]
}
```

### Relationship Operations

#### Create Relationship
```http
POST /api/universal/relationships
```
```json
{
  "p_organization_id": "uuid",
  "p_from_entity_id": "uuid",
  "p_to_entity_id": "uuid",
  "p_relationship_type": "parent_of",
  "p_smart_code": "HERA.CORE.RELATIONSHIP.PARENT.v1",
  "p_metadata": { "created_reason": "org_structure" }
}
```

#### Batch Create Relationships
```http
POST /api/universal/relationships
```
```json
[
  {
    "p_organization_id": "uuid",
    "p_from_entity_id": "uuid",
    "p_to_entity_id": "uuid",
    "p_relationship_type": "parent_of",
    "p_smart_code": "HERA.CORE.RELATIONSHIP.PARENT.v1"
  }
]
```

#### Query Relationships
```http
GET /api/universal/relationships/query?p_organization_id=uuid&p_entity_id=uuid&p_side=from
```

#### Delete Relationship
```http
DELETE /api/universal/relationships/{id}
```

### Transaction Operations

#### Create Transaction
```http
POST /api/universal/transactions
```
```json
{
  "p_organization_id": "uuid",
  "p_transaction_type": "sale",
  "p_smart_code": "HERA.SALE.TRANSACTION.ORDER.v1",
  "p_source_entity_id": "uuid",
  "p_target_entity_id": "uuid",
  "p_total_amount": 1000.00,
  "p_lines": [
    {
      "line_number": 1,
      "line_entity_id": "uuid",
      "quantity": 2,
      "unit_price": 500.00,
      "line_amount": 1000.00
    }
  ]
}
```

#### Get Transaction
```http
GET /api/universal/transactions/{id}
```

#### Get Transaction Lines
```http
GET /api/universal/transactions/{id}/lines
```

#### Search Transactions
```http
GET /api/universal/transactions/search?p_organization_id=uuid&p_transaction_type=sale
```

#### Void Transaction
```http
POST /api/universal/transactions/{id}/void
```
```json
{
  "p_reason": "Customer cancelled order",
  "p_user_id": "uuid"
}
```

#### Reverse Transaction
```http
POST /api/universal/transactions/{id}/reverse
```
```json
{
  "p_reason": "Refund requested",
  "p_user_id": "uuid",
  "p_reversal_date": "2024-01-15T10:00:00Z"
}
```

#### Validate Transaction
```http
POST /api/universal/transactions/{id}/validate
```

## Client Usage with React Hooks

```typescript
import { useUniversalApi } from '@/lib/universal/hooks';

function MyComponent() {
  const api = useUniversalApi({
    onError: (error) => console.error(error),
    onSuccess: (data) => console.log('Success:', data)
  });

  // Create entity
  const createCustomer = async () => {
    const result = await api.entities.upsert({
      p_organization_id: 'org-uuid',
      p_entity_type: 'customer',
      p_entity_name: 'New Customer',
      p_smart_code: 'HERA.CRM.CUSTOMER.ENTITY.v1'
    });
  };

  // Set dynamic field
  const setCreditLimit = async (entityId: string) => {
    await api.dynamicData.set({
      p_organization_id: 'org-uuid',
      p_entity_id: entityId,
      p_field_name: 'credit_limit',
      p_field_type: 'number',
      p_field_value_number: 100000,
      p_smart_code: 'HERA.CRM.FIELD.CREDIT_LIMIT.v1'
    });
  };

  // Create transaction
  const createSale = async () => {
    await api.transactions.emit({
      p_organization_id: 'org-uuid',
      p_transaction_type: 'sale',
      p_smart_code: 'HERA.SALE.TRANSACTION.ORDER.v1',
      p_total_amount: 1000.00,
      p_lines: [/* line items */]
    });
  };

  return (
    <div>
      {api.loading && <p>Loading...</p>}
      {api.error && <p>Error: {api.error.message}</p>}
      {/* UI components */}
    </div>
  );
}
```

## Smart Code Validation

All operations require valid Smart Codes following the pattern:
```
HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}
```

Example valid Smart Codes:
- `HERA.CRM.CUSTOMER.ENTITY.v1`
- `HERA.SALE.TRANSACTION.ORDER.v1`
- `HERA.CORE.RELATIONSHIP.PARENT.v1`
- `HERA.CRM.FIELD.CREDIT_LIMIT.v1`

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message"
}
```

HTTP status codes:
- `200` - Success
- `400` - Validation error or bad request
- `500` - Server error

## Security

- Server-side operations use Supabase service role key
- Organization ID validation on all operations
- Smart Code validation ensures business context
- Type-safe schemas prevent malformed requests

## Environment Variables

Required:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## RPC Function Reference

| RPC Function | Description | Parameters |
|--------------|-------------|------------|
| `hera_entity_upsert_v1` | Create or update entity | p_organization_id, p_entity_type, p_entity_name, p_entity_code, p_smart_code, p_business_context, p_metadata |
| `hera_entity_read_v1` | Search entities | p_organization_id, p_entity_type, p_entity_name_pattern, p_entity_id, p_smart_code, p_include_deleted, p_limit, p_offset |
| `hera_entity_delete_v1` | Delete entity | p_organization_id, p_entity_id |
| `hera_entity_recover_v1` | Recover deleted entity | p_organization_id, p_entity_id |
| `hera_dynamic_data_set_v1` | Set single dynamic field | p_organization_id, p_entity_id, p_field_name, p_field_type, p_field_value_*, p_smart_code |
| `hera_dynamic_data_batch_v1` | Set multiple dynamic fields | p_organization_id, p_items |
| `hera_dynamic_data_get_v1` | Get dynamic fields | p_organization_id, p_entity_id, p_field_names |
| `hera_dynamic_data_delete_v1` | Delete dynamic fields | p_organization_id, p_entity_id, p_field_names |
| `hera_relationship_upsert_v1` | Create/update relationship | p_organization_id, p_from_entity_id, p_to_entity_id, p_relationship_type, p_smart_code, p_metadata |
| `hera_relationship_query_v1` | Query relationships | p_organization_id, p_entity_id, p_side, p_relationship_type, p_active_only, p_limit, p_offset |
| `hera_txn_emit_v1` | Create transaction | p_organization_id, p_transaction_type, p_smart_code, p_total_amount, p_lines |
| `hera_txn_get_v1` | Get transaction | p_organization_id, p_transaction_id |
| `hera_txn_search_v1` | Search transactions | p_organization_id, p_transaction_type, p_date_from, p_date_to, p_entity_id, p_status, p_min_amount, p_max_amount |
| `hera_txn_void_v1` | Void transaction | p_organization_id, p_transaction_id, p_reason, p_user_id |
| `hera_txn_reverse_v1` | Reverse transaction | p_organization_id, p_transaction_id, p_reason, p_user_id, p_reversal_date |
| `hera_txn_validate_v1` | Validate transaction | p_organization_id, p_transaction_id |