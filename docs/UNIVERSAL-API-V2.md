# 🧬 HERA Universal API v2 - Enterprise Grade Documentation

## Overview

The HERA Universal API v2 is a complete rewrite that provides:
- **Consistent response format** across all operations
- **Complete CRUD** for all 6 sacred tables
- **Enterprise features** (pagination, batch operations, advanced filtering)
- **Perfect multi-tenancy** with organization isolation
- **Comprehensive error handling**
- **Performance monitoring** with execution time tracking
- **Backwards compatibility** with existing code

## 🎯 Key Improvements

### 1. Standardized Response Format

All API methods now return a consistent structure:

```typescript
interface UniversalResponse<T> {
  success: boolean      // Clear success/failure indication
  data: T | null       // The actual data or null on error
  error: string | null // Human-readable error message
  metadata?: {         // Optional performance and pagination info
    count?: number
    page?: number
    pageSize?: number
    totalPages?: number
    executionTime?: number
  }
}
```

### 2. Complete CRUD Coverage

| Table | Create | Read | Update | Delete | Batch |
|-------|--------|------|--------|--------|-------|
| `core_entities` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `core_relationships` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `universal_transactions` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `universal_transaction_lines` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `core_dynamic_data` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `core_organizations` | ❌ | ✅ | ✅ | ❌ | ❌ |

### 3. Enterprise Features

#### Pagination
```typescript
const result = await universalApi.getEntities({
  page: 2,
  pageSize: 50,
  orderBy: 'created_at',
  orderDirection: 'desc'
})

// Response includes metadata
{
  success: true,
  data: [...],
  error: null,
  metadata: {
    count: 245,
    page: 2,
    pageSize: 50,
    totalPages: 5,
    executionTime: 123
  }
}
```

#### Advanced Filtering
```typescript
const result = await universalApi.getTransactions({
  filters: {
    transaction_type: 'sale',
    total_amount: [100, 500], // Between 100 and 500
    created_at: { gte: '2024-01-01' } // After Jan 1
  },
  search: 'customer name',
  searchFields: ['metadata.customer_name', 'transaction_code']
})
```

#### Batch Operations
```typescript
// Create multiple entities at once
const result = await universalApi.batchCreate('core_entities', [
  { entity_type: 'customer', entity_name: 'Customer 1', ... },
  { entity_type: 'customer', entity_name: 'Customer 2', ... },
  { entity_type: 'customer', entity_name: 'Customer 3', ... }
])

// Update multiple records
const updates = await universalApi.batchUpdate('core_entities', [
  { id: 'uuid1', data: { entity_name: 'Updated Name 1' } },
  { id: 'uuid2', data: { entity_name: 'Updated Name 2' } }
])
```

### 4. Type Safety

The API now uses TypeScript generics for type-safe responses:

```typescript
// Type-safe entity creation
const entityResult: UniversalResponse<Entity> = await universalApi.createEntity({
  organization_id: 'org-123',
  entity_type: 'customer',
  entity_name: 'Acme Corp',
  smart_code: 'HERA.CRM.CUSTOMER.v1'
})

if (entityResult.success) {
  // TypeScript knows entityResult.data is Entity type
  console.log(entityResult.data.id)
}
```

## 📋 API Reference

### Configuration Methods

#### `setOrganizationId(orgId: string | null)`
Sets the default organization context for all operations.

```typescript
universalApi.setOrganizationId('org-123')
```

#### `setDefaultPageSize(size: number)`
Sets the default page size for pagination (default: 50).

```typescript
universalApi.setDefaultPageSize(100)
```

### Entity Operations

#### `createEntity(entity: Entity): Promise<UniversalResponse<Entity>>`
Creates a new entity in the `core_entities` table.

```typescript
const result = await universalApi.createEntity({
  organization_id: 'org-123',
  entity_type: 'product',
  entity_name: 'Premium Widget',
  entity_code: 'PROD-001',
  smart_code: 'HERA.INV.PRODUCT.v1',
  metadata: { price: 99.99 }
})
```

#### `getEntity(id: string, options?: QueryOptions): Promise<UniversalResponse<Entity>>`
Retrieves a single entity by ID.

```typescript
const result = await universalApi.getEntity('entity-uuid', {
  select: ['id', 'entity_name', 'metadata'] // Only return specific fields
})
```

#### `getEntities(options?: QueryOptions): Promise<UniversalResponse<Entity[]>>`
Retrieves multiple entities with filtering and pagination.

```typescript
const result = await universalApi.getEntities({
  filters: { entity_type: 'customer' },
  search: 'Acme',
  searchFields: ['entity_name', 'entity_code'],
  orderBy: 'created_at',
  orderDirection: 'desc',
  page: 1,
  pageSize: 20
})
```

#### `updateEntity(id: string, updates: Partial<Entity>): Promise<UniversalResponse<Entity>>`
Updates an existing entity.

```typescript
const result = await universalApi.updateEntity('entity-uuid', {
  entity_name: 'Updated Product Name',
  metadata: { price: 129.99 }
})
```

#### `deleteEntity(id: string, soft?: boolean): Promise<UniversalResponse<void>>`
Deletes an entity (soft delete by default).

```typescript
// Soft delete (marks as deleted in metadata)
await universalApi.deleteEntity('entity-uuid')

// Hard delete (permanent removal)
await universalApi.deleteEntity('entity-uuid', false)
```

### Transaction Operations

#### `createTransaction(transaction: Transaction): Promise<UniversalResponse<Transaction>>`
Creates a new transaction. Automatically handles line items if provided.

```typescript
// Create transaction without line items
const result = await universalApi.createTransaction({
  organization_id: 'org-123',
  transaction_type: 'sale',
  transaction_code: 'INV-2024-001',
  transaction_date: '2024-01-15',
  source_entity_id: 'customer-uuid',
  total_amount: 1500.00,
  smart_code: 'HERA.SALES.INVOICE.v1',
  metadata: { 
    payment_terms: 'NET30',
    tax_rate: 0.08 
  }
})

// Create transaction with line items (automatically creates lines)
const result = await universalApi.createTransaction({
  organization_id: 'org-123',
  transaction_type: 'sale',
  transaction_code: 'INV-2024-001',
  transaction_date: '2024-01-15',
  source_entity_id: 'customer-uuid',
  total_amount: 1500.00,
  smart_code: 'HERA.SALES.INVOICE.v1',
  line_items: [
    {
      entity_id: 'product-uuid-1',
      quantity: '2',
      unit_price: 500.00,
      line_amount: 1000.00,
      smart_code: 'HERA.SALES.LINE.v1'
    },
    {
      entity_id: 'product-uuid-2',
      quantity: '1',
      unit_price: 500.00,
      line_amount: 500.00,
      smart_code: 'HERA.SALES.LINE.v1'
    }
  ]
})
```

#### `createTransactionWithLineItems(transaction: Transaction & { line_items: TransactionLine[] }): Promise<UniversalResponse<{ transaction: Transaction; lines: TransactionLine[] }>>`
Creates a transaction with line items and returns both.

```typescript
const result = await universalApi.createTransactionWithLineItems({
  organization_id: 'org-123',
  transaction_type: 'production_order',
  transaction_code: 'PO-2024-001',
  transaction_date: '2024-01-15',
  from_entity_id: 'customer-uuid',
  total_amount: 5000.00,
  smart_code: 'HERA.PROD.ORDER.v1',
  line_items: [
    {
      entity_id: 'product-uuid',
      quantity: '10',
      unit_price: 500.00,
      line_amount: 5000.00,
      smart_code: 'HERA.PROD.ORDER.LINE.v1'
    }
  ]
})

// Access both transaction and lines
if (result.success) {
  console.log('Transaction:', result.data.transaction)
  console.log('Lines:', result.data.lines)
}
```

#### `getTransaction(id: string, options?: QueryOptions): Promise<UniversalResponse<Transaction>>`
#### `getTransactions(options?: QueryOptions): Promise<UniversalResponse<Transaction[]>>`
#### `updateTransaction(id: string, updates: Partial<Transaction>): Promise<UniversalResponse<Transaction>>`
#### `deleteTransaction(id: string, soft?: boolean): Promise<UniversalResponse<void>>`

Similar to entity operations but for the `universal_transactions` table.

### Relationship Operations

#### `createRelationship(relationship: Relationship): Promise<UniversalResponse<Relationship>>`
Creates a relationship between entities.

```typescript
const result = await universalApi.createRelationship({
  organization_id: 'org-123',
  from_entity_id: 'order-uuid',
  to_entity_id: 'status-uuid',
  relationship_type: 'has_status',
  smart_code: 'HERA.WORKFLOW.STATUS.v1',
  relationship_data: {
    assigned_at: new Date().toISOString(),
    assigned_by: 'user-uuid'
  }
})
```

#### `getRelationships(options?: QueryOptions): Promise<UniversalResponse<Relationship[]>>`
#### `updateRelationship(id: string, updates: Partial<Relationship>): Promise<UniversalResponse<Relationship>>`
#### `deleteRelationship(id: string): Promise<UniversalResponse<void>>`

### Dynamic Data Operations

#### `setDynamicField(entityId: string, fieldName: string, value: any, options?): Promise<UniversalResponse<DynamicData>>`
Sets a dynamic field value for an entity. Automatically determines field type and creates/updates as needed.

```typescript
// Set various field types
await universalApi.setDynamicField('entity-uuid', 'email', 'user@example.com')
await universalApi.setDynamicField('entity-uuid', 'age', 25)
await universalApi.setDynamicField('entity-uuid', 'is_active', true)
await universalApi.setDynamicField('entity-uuid', 'metadata', { custom: 'data' })

// With smart code
await universalApi.setDynamicField('entity-uuid', 'credit_limit', 50000, {
  smart_code: 'HERA.CRM.CUSTOMER.CREDIT.v1',
  metadata: { approved_by: 'manager-uuid' }
})
```

#### `getDynamicFields(entityId: string): Promise<UniversalResponse<DynamicData[]>>`
Retrieves all dynamic fields for an entity.

```typescript
const result = await universalApi.getDynamicFields('entity-uuid')
// Returns all dynamic data records for this entity
```

#### `deleteDynamicField(entityId: string, fieldName: string): Promise<UniversalResponse<void>>`
Deletes a specific dynamic field.

```typescript
await universalApi.deleteDynamicField('entity-uuid', 'old_field')
```

### Batch Operations

#### `batchCreate<T>(table: string, items: T[]): Promise<UniversalResponse<T[]>>`
Creates multiple records in a single operation.

```typescript
const result = await universalApi.batchCreate('core_entities', [
  { entity_type: 'product', entity_name: 'Product 1', ... },
  { entity_type: 'product', entity_name: 'Product 2', ... }
])
```

#### `batchUpdate<T>(table: string, updates: Array<{id: string, data: Partial<T>}>): Promise<UniversalResponse<number>>`
Updates multiple records.

```typescript
const result = await universalApi.batchUpdate('core_entities', [
  { id: 'uuid1', data: { entity_name: 'Updated 1' } },
  { id: 'uuid2', data: { entity_name: 'Updated 2' } }
])
// Returns count of successfully updated records
```

### Backwards Compatibility

All legacy methods are preserved and automatically delegate to the new standardized methods:

- `read()` - Maps to appropriate get methods
- `query()` - Returns legacy format `{ data, error }`
- `readEntities()` - Returns legacy format
- `getEntityBySmartCode()` - Returns entity or null
- `getTransactionsByIds()` - Returns array of transactions

## 🔄 Migration Guide

### Basic Migration

Most code will work without changes due to backwards compatibility. However, to take advantage of the standardized response format:

#### Before (v1):
```typescript
try {
  const result = await universalApi.createEntity(data)
  if (result.success) {
    console.log('Created:', result.data.id)
  }
} catch (error) {
  console.error('Failed:', error)
}
```

#### After (v2):
```typescript
const result = await universalApi.createEntity(data)
if (result.success) {
  console.log('Created:', result.data.id)
} else {
  console.error('Failed:', result.error)
}
```

### Advanced Features

Take advantage of new enterprise features:

```typescript
// Pagination with metadata
const customers = await universalApi.getEntities({
  filters: { entity_type: 'customer' },
  page: 1,
  pageSize: 50,
  orderBy: 'created_at',
  orderDirection: 'desc'
})

console.log(`Showing ${customers.data.length} of ${customers.metadata.count} customers`)
console.log(`Page ${customers.metadata.page} of ${customers.metadata.totalPages}`)
console.log(`Query took ${customers.metadata.executionTime}ms`)

// Batch operations
const products = generateProducts(100)
const result = await universalApi.batchCreate('core_entities', products)
console.log(`Created ${result.metadata.count} products in ${result.metadata.executionTime}ms`)
```

## 🔐 Security

- **Organization Isolation**: All operations respect organization boundaries
- **Required Organization ID**: Most operations require organization context
- **RLS Integration**: Works with Supabase Row Level Security
- **Error Sanitization**: Consistent error messages without exposing internals

## 🚀 Performance

- **Execution Time Tracking**: All operations report execution time
- **Optimized Queries**: Uses Supabase query builder efficiently
- **Batch Operations**: Reduces round trips for bulk operations
- **Field Selection**: Only fetch needed fields with `select` option

## 📊 Best Practices

1. **Always check `success` field** before accessing `data`
2. **Use type-safe methods** instead of generic `read()`
3. **Leverage pagination** for large datasets
4. **Use batch operations** for bulk creates/updates
5. **Select only needed fields** to reduce payload size
6. **Handle errors gracefully** using the standardized error field

## 🎯 Summary

The Universal API v2 provides:
- ✅ **100% backwards compatibility**
- ✅ **Consistent, predictable responses**
- ✅ **Complete CRUD for all sacred tables**
- ✅ **Enterprise-grade features**
- ✅ **Type safety and better DX**
- ✅ **Performance monitoring**
- ✅ **Future-proof architecture**

This positions HERA as having a truly enterprise-grade API that can scale with any business while maintaining the simplicity of the 6-table universal architecture.