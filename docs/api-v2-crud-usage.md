# HERA API v2 Complete CRUD Solution

## Overview

The v2 API provides a complete CRUD solution for entity management with minimal overhead and high performance. It bridges the gap from the single `entity-upsert` endpoint to a full-featured entity management system.

## Architecture

### Endpoints

1. **`/api/v2/universal/entity-upsert`** - Create or Update entities (POST)
2. **`/api/v2/universal/entity-read`** - Read entities by ID or filters (GET)
3. **`/api/v2/universal/entity-query`** - Advanced querying with joins (POST)
4. **`/api/v2/universal/entity-delete`** - Soft/hard delete entities (DELETE)

### Client Library

The `EntityClientV2` provides a unified interface for all CRUD operations.

## Usage Examples

### Basic Setup

```typescript
import { entityClientV2 } from '@/lib/api/v2/entity-client';

// Set organization context
entityClientV2.setOrganizationId('your-org-id');

// Optional: Set auth token
entityClientV2.setAuthToken('your-jwt-token');
```

### Create (Insert)

```typescript
// Create a new salon service
const result = await entityClientV2.upsert({
  organization_id: 'org-123',
  entity_type: 'service',
  entity_name: 'Haircut & Blowdry',
  entity_code: 'SVC-HAIRCUT-001',
  smart_code: 'HERA.SALON.SVC.HAIR.CUT.V1',
  metadata: {
    duration_minutes: 45,
    base_price: 65.00,
    category: 'Hair Services',
    requires_stylist: true,
    commission_rate: 0.40
  },
  status: 'active'
});

if (result.success) {
  console.log('Created entity:', result.data.entity_id);
}
```

### Read (Retrieve)

```typescript
// Get entity by ID
const entity = await entityClientV2.read({
  entity_id: 'entity-123'
});

// Get all services
const services = await entityClientV2.read({
  entity_type: 'service',
  status: 'active',
  limit: 50
});

// Get entity by code
const entityByCode = await entityClientV2.getByCode('SVC-HAIRCUT-001', 'service');
```

### Update

```typescript
// Update existing entity
const updateResult = await entityClientV2.update('entity-123', {
  metadata: {
    base_price: 75.00, // Price increase
    last_updated: new Date().toISOString()
  },
  status: 'active'
});

// Or use upsert with entity_id
const upsertResult = await entityClientV2.upsert({
  id: 'entity-123',
  entity_id: 'entity-123',
  organization_id: 'org-123',
  entity_type: 'service',
  entity_name: 'Haircut & Blowdry Premium',
  smart_code: 'HERA.SALON.SVC.HAIR.CUT.V1',
  metadata: {
    base_price: 75.00
  }
});
```

### Delete

```typescript
// Soft delete (mark as deleted)
const softDelete = await entityClientV2.delete('entity-123', {
  hard_delete: false,
  actor_user_id: 'user-456'
});

// Hard delete with cascade
const hardDelete = await entityClientV2.delete('entity-123', {
  hard_delete: true,
  cascade: true, // Also removes relationships and dynamic data
  actor_user_id: 'user-456'
});

// Recover soft-deleted entity
const recovered = await entityClientV2.recover('entity-123', 'user-456');
```

### Advanced Querying

```typescript
// Search with filters and joins
const queryResult = await entityClientV2.query({
  filters: {
    entity_type: 'service',
    status: 'active',
    'metadata.category': 'Hair Services'
  },
  search: 'color', // Text search across fields
  joins: ['dynamic_data', 'relationships'],
  order_by: {
    field: 'created_at',
    direction: 'DESC'
  },
  limit: 20,
  offset: 0,
  aggregate: true // Include statistics
});

// Complex filters with operators
const advancedQuery = await entityClientV2.query({
  filters: {
    'metadata.base_price': {
      operator: 'gte',
      value: 100
    },
    entity_type: ['service', 'product'], // IN clause
    created_at: {
      operator: 'gt',
      value: '2024-01-01'
    }
  },
  order_by: {
    field: 'metadata.base_price',
    direction: 'DESC'
  }
});
```

### Batch Operations

```typescript
// Perform multiple operations
const batchResult = await entityClientV2.batch([
  {
    operation: 'create',
    entity: {
      organization_id: 'org-123',
      entity_type: 'service',
      entity_name: 'Service 1',
      smart_code: 'HERA.SALON.SVC.1.V1'
    }
  },
  {
    operation: 'update',
    entity: {
      id: 'existing-entity-id',
      entity_id: 'existing-entity-id',
      organization_id: 'org-123',
      entity_type: 'service',
      entity_name: 'Updated Service',
      smart_code: 'HERA.SALON.SVC.2.V1'
    }
  },
  {
    operation: 'delete',
    entity_id: 'entity-to-delete',
    options: { hard_delete: false }
  }
]);
```

## Salon Services Example

Complete CRUD flow for managing salon services:

```typescript
import { entityClientV2 } from '@/lib/api/v2/entity-client';

// Initialize client
entityClientV2.setOrganizationId('salon-org-123');

// 1. CREATE - Add new services
const services = [
  {
    entity_name: 'Haircut & Blowdry',
    entity_code: 'SVC-HAIRCUT-001',
    smart_code: 'HERA.SALON.SVC.HAIR.CUT.V1',
    metadata: { duration_minutes: 45, base_price: 65.00 }
  },
  {
    entity_name: 'Full Color Treatment',
    entity_code: 'SVC-COLOR-001',
    smart_code: 'HERA.SALON.SVC.HAIR.COLOR.V1',
    metadata: { duration_minutes: 120, base_price: 150.00 }
  },
  {
    entity_name: 'Highlights',
    entity_code: 'SVC-HIGHLIGHT-001',
    smart_code: 'HERA.SALON.SVC.HAIR.HIGHLIGHT.V1',
    metadata: { duration_minutes: 180, base_price: 250.00 }
  },
  {
    entity_name: 'Deep Conditioning',
    entity_code: 'SVC-TREATMENT-001',
    smart_code: 'HERA.SALON.SVC.HAIR.TREATMENT.V1',
    metadata: { duration_minutes: 30, base_price: 45.00 }
  },
  {
    entity_name: 'Bridal Hair Styling',
    entity_code: 'SVC-BRIDAL-001',
    smart_code: 'HERA.SALON.SVC.HAIR.BRIDAL.V1',
    metadata: { duration_minutes: 90, base_price: 350.00 }
  }
];

// Create all services
for (const service of services) {
  const result = await entityClientV2.upsert({
    organization_id: 'salon-org-123',
    entity_type: 'service',
    ...service,
    status: 'active'
  });

  console.log(`Created ${service.entity_name}: ${result.data?.entity_id}`);
}

// 2. READ - List all services
const allServices = await entityClientV2.read({
  entity_type: 'service',
  status: 'active'
});

console.log(`Found ${allServices.data?.length} services`);

// 3. UPDATE - Increase prices by 10%
for (const service of allServices.data as any[]) {
  const newPrice = service.metadata.base_price * 1.1;

  await entityClientV2.update(service.id, {
    metadata: {
      ...service.metadata,
      base_price: newPrice,
      price_updated_at: new Date().toISOString()
    }
  });
}

// 4. QUERY - Find premium services (>$100)
const premiumServices = await entityClientV2.query({
  filters: {
    entity_type: 'service',
    'metadata.base_price': { operator: 'gt', value: 100 }
  },
  order_by: {
    field: 'metadata.base_price',
    direction: 'DESC'
  }
});

console.log('Premium services:', premiumServices.data);

// 5. DELETE - Remove discontinued service
const discontinued = await entityClientV2.getByCode('SVC-OLD-001');
if (discontinued.success && discontinued.data) {
  await entityClientV2.delete(discontinued.data.id!, {
    hard_delete: false, // Soft delete for recovery
    actor_user_id: 'admin-user'
  });
}
```

## Direct API Usage (without client)

```typescript
// CREATE/UPDATE
const response = await fetch('/api/v2/universal/entity-upsert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'org-123',
    entity_type: 'service',
    entity_name: 'Test Service',
    smart_code: 'HERA.SALON.SVC.TEST.V1'
  })
});

// READ
const entities = await fetch('/api/v2/universal/entity-read?' + new URLSearchParams({
  organization_id: 'org-123',
  entity_type: 'service',
  limit: '10'
}));

// QUERY
const queryResponse = await fetch('/api/v2/universal/entity-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'org-123',
    filters: { entity_type: 'service' },
    search: 'hair',
    joins: ['dynamic_data']
  })
});

// DELETE
const deleteResponse = await fetch('/api/v2/universal/entity-delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entity_id: 'entity-123',
    organization_id: 'org-123',
    hard_delete: false
  })
});
```

## Performance Considerations

1. **Upsert** - Single database function call, minimal overhead
2. **Read** - Direct SELECT with optional joins, indexed queries
3. **Query** - Advanced filtering with aggregation support
4. **Delete** - Soft delete by default, cascade options available

## Error Handling

```typescript
const result = await entityClientV2.upsert(entity);

if (!result.success) {
  console.error('Error:', result.error);
  console.error('Message:', result.message);

  // Handle specific errors
  if (result.error === 'guardrail_failed') {
    // Validation error
  } else if (result.error === 'database_error') {
    // Database issue
  }
}
```

## Migration from v1

```typescript
// v1 Universal API
import { universalApi } from '@/lib/universal-api-v2';
const entity = await universalApi.createEntity({...});

// v2 Entity Client
import { entityClientV2 } from '@/lib/api/v2/entity-client';
const result = await entityClientV2.upsert({...});
```

## Benefits of v2 CRUD Solution

1. **Complete CRUD** - All operations supported
2. **Minimal Overhead** - Direct database function calls
3. **Type Safety** - Full TypeScript support
4. **Flexible Querying** - Advanced filters and joins
5. **Soft Delete** - Recovery possible by default
6. **Batch Operations** - Multiple operations in sequence
7. **Audit Trail** - Actor tracking on all operations
8. **Multi-Tenancy** - Organization isolation enforced

## Testing

See `/src/app/api/v2/universal/__tests__/` for comprehensive test coverage of all CRUD operations.