# Complete CRUD Solution with Dynamic Data - API v2

## Overview

Yes! The complete CRUD solution now includes the `core_dynamic_data` table. Here's the relationship and complete implementation:

### Relationship: `core_entities` ↔ `core_dynamic_data`

- **One-to-Many**: One entity can have many dynamic fields
- **Foreign Key**: `core_dynamic_data.entity_id` → `core_entities.id`
- **Cascade Delete**: When an entity is deleted, all its dynamic data is automatically deleted

## Complete API Endpoints

### Core Entities CRUD
1. **`POST /api/v2/universal/entity-upsert`** - Create/Update entities
2. **`GET /api/v2/universal/entity-read`** - Read entities
3. **`POST /api/v2/universal/entity-query`** - Advanced entity querying
4. **`DELETE /api/v2/universal/entity-delete`** - Delete entities

### Dynamic Data CRUD
5. **`POST /api/v2/universal/dynamic-data-upsert`** - Create/Update dynamic fields
6. **`GET /api/v2/universal/dynamic-data-read`** - Read dynamic fields
7. **`DELETE /api/v2/universal/dynamic-data-delete`** - Delete dynamic fields
8. **`PUT /api/v2/universal/dynamic-data-upsert`** - Batch operations

## Complete Example: Salon Service with Dynamic Data

```typescript
import { entityClientV2 } from '@/lib/api/v2/entity-client';

// Initialize client
entityClientV2.setOrganizationId('salon-org-123');

async function completeSalonServiceExample() {

  // ==================== 1. CREATE ENTITY ====================

  // Create a haircut service entity
  const serviceResult = await entityClientV2.upsert({
    organization_id: 'salon-org-123',
    entity_type: 'service',
    entity_name: 'Premium Haircut & Style',
    entity_code: 'SVC-HAIRCUT-PREMIUM',
    smart_code: 'HERA.SALON.SVC.HAIR.CUT.PREMIUM.V1',
    metadata: {
      category: 'Hair Services',
      created_by: 'admin'
    },
    status: 'active'
  });

  console.log('Created service:', serviceResult.data?.entity_id);
  const serviceId = serviceResult.data?.entity_id!;

  // ==================== 2. ADD DYNAMIC FIELDS ====================

  // Add pricing information
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'base_price',
    85.00,
    'number'
  );

  // Add duration
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'duration_minutes',
    60
  );

  // Add stylist requirements
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'requires_senior_stylist',
    true,
    'boolean'
  );

  // Add complex JSON data
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'skill_requirements',
    {
      cutting_level: 'advanced',
      styling_techniques: ['layering', 'texturizing', 'blowdry'],
      equipment_needed: ['professional_scissors', 'blow_dryer', 'round_brush']
    },
    'json'
  );

  // Add commission rate
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'commission_rate',
    0.45,
    'number'
  );

  // Add booking restrictions
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'advance_booking_required',
    '24 hours',
    'text'
  );

  // ==================== 3. BATCH ADD MULTIPLE FIELDS ====================

  const additionalFields = [
    {
      field_name: 'seasonal_discount',
      field_type: 'number' as const,
      field_value_number: 0.10,
      smart_code: 'HERA.SALON.SVC.DYN.DISCOUNT.V1'
    },
    {
      field_name: 'popular_time_slots',
      field_type: 'json' as const,
      field_value_json: {
        weekday_preferred: ['10:00', '14:00', '16:00'],
        weekend_preferred: ['09:00', '11:00', '13:00', '15:00']
      },
      smart_code: 'HERA.SALON.SVC.DYN.SCHEDULE.V1'
    },
    {
      field_name: 'client_satisfaction_score',
      field_type: 'number' as const,
      field_value_number: 4.8,
      smart_code: 'HERA.SALON.SVC.DYN.RATING.V1'
    },
    {
      field_name: 'last_price_update',
      field_type: 'datetime' as const,
      field_value_datetime: new Date().toISOString(),
      smart_code: 'HERA.SALON.SVC.DYN.AUDIT.V1'
    }
  ];

  const batchResult = await entityClientV2.batchUpsertDynamicFields(
    serviceId,
    additionalFields
  );

  console.log(`Batch upsert: ${batchResult.metadata?.succeeded}/${batchResult.metadata?.total} succeeded`);

  // ==================== 4. READ COMPLETE ENTITY WITH DYNAMIC DATA ====================

  // Read entity with all dynamic fields
  const completeService = await entityClientV2.getWithRelationships(serviceId);
  console.log('Complete service with dynamic data:', completeService.data);

  // Get dynamic fields as key-value object
  const dynamicFields = await entityClientV2.getDynamicFieldsAsObject(serviceId);
  console.log('Service dynamic fields:', dynamicFields.data);

  // Sample output:
  // {
  //   base_price: 85.00,
  //   duration_minutes: 60,
  //   requires_senior_stylist: true,
  //   skill_requirements: {
  //     cutting_level: 'advanced',
  //     styling_techniques: ['layering', 'texturizing', 'blowdry'],
  //     equipment_needed: ['professional_scissors', 'blow_dryer', 'round_brush']
  //   },
  //   commission_rate: 0.45,
  //   advance_booking_required: '24 hours',
  //   seasonal_discount: 0.10,
  //   popular_time_slots: {
  //     weekday_preferred: ['10:00', '14:00', '16:00'],
  //     weekend_preferred: ['09:00', '11:00', '13:00', '15:00']
  //   },
  //   client_satisfaction_score: 4.8,
  //   last_price_update: '2024-01-15T10:30:00Z'
  // }

  // ==================== 5. UPDATE DYNAMIC FIELDS ====================

  // Update price (will update existing field)
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'base_price',
    95.00, // Price increase
    'number'
  );

  // Update satisfaction score
  await entityClientV2.setDynamicFieldValue(
    serviceId,
    'client_satisfaction_score',
    4.9
  );

  // ==================== 6. QUERY SERVICES WITH DYNAMIC DATA ====================

  // Find all premium services (price > $75)
  const premiumServices = await entityClientV2.query({
    filters: {
      entity_type: 'service',
      status: 'active'
    },
    joins: ['dynamic_data'],
    limit: 50
  });

  // Filter by dynamic field values (client-side filtering since JOIN is included)
  const expensiveServices = premiumServices.data?.filter((service: any) => {
    const priceField = service.dynamic_fields?.find((field: any) =>
      field.field_name === 'base_price'
    );
    return priceField && priceField.field_value_number > 75;
  });

  console.log(`Found ${expensiveServices?.length} premium services`);

  // ==================== 7. DELETE SPECIFIC DYNAMIC FIELDS ====================

  // Remove seasonal discount (no longer applicable)
  await entityClientV2.deleteDynamicField({
    entity_id: serviceId,
    field_name: 'seasonal_discount'
  });

  // ==================== 8. COMPLETE SERVICE MANAGEMENT ====================

  // Get all services with their dynamic data grouped
  const allServicesWithFields = await entityClientV2.getDynamicFields({
    group_by_entity: true
  });

  console.log('All services with their fields:', allServicesWithFields.data);

  // ==================== 9. ADVANCED OPERATIONS ====================

  // Clone a service with all its dynamic fields
  async function cloneServiceWithDynamicData(sourceServiceId: string, newServiceName: string) {
    // 1. Read source service
    const sourceService = await entityClientV2.read({ entity_id: sourceServiceId });
    const sourceDynamicFields = await entityClientV2.getDynamicFields({
      entity_id: sourceServiceId
    });

    if (!sourceService.success || !sourceDynamicFields.success) {
      throw new Error('Failed to read source service');
    }

    // 2. Create new service
    const newService = await entityClientV2.upsert({
      ...sourceService.data,
      id: undefined, // Remove ID to create new
      entity_id: undefined,
      entity_name: newServiceName,
      entity_code: `${sourceService.data.entity_code}-COPY`,
      created_at: undefined,
      updated_at: undefined
    });

    if (!newService.success) {
      throw new Error('Failed to create new service');
    }

    // 3. Copy all dynamic fields
    const fieldsToClone = sourceDynamicFields.data?.map(field => ({
      field_name: field.field_name,
      field_type: field.field_type,
      field_value_text: field.field_value_text,
      field_value_number: field.field_value_number,
      field_value_boolean: field.field_value_boolean,
      field_value_date: field.field_value_date,
      field_value_datetime: field.field_value_datetime,
      field_value_json: field.field_value_json,
      smart_code: field.smart_code,
      metadata: field.metadata
    })) || [];

    const cloneResult = await entityClientV2.batchUpsertDynamicFields(
      newService.data.entity_id,
      fieldsToClone
    );

    return {
      success: true,
      new_service_id: newService.data.entity_id,
      fields_copied: cloneResult.metadata?.succeeded || 0
    };
  }

  // Clone the premium service
  const cloneResult = await cloneServiceWithDynamicData(
    serviceId,
    'Premium Haircut & Style (Weekend Special)'
  );

  console.log(`Cloned service: ${cloneResult.new_service_id} with ${cloneResult.fields_copied} fields`);

  // ==================== 10. CLEANUP ====================

  // Soft delete the original service (and all its dynamic data will be preserved)
  await entityClientV2.delete(serviceId, {
    hard_delete: false, // Soft delete
    actor_user_id: 'admin-user'
  });

  // Hard delete would remove both the entity and all dynamic data
  // await entityClientV2.delete(serviceId, {
  //   hard_delete: true,
  //   cascade: true
  // });
}

// Run the complete example
completeSalonServiceExample().catch(console.error);
```

## Direct API Usage (Without Client)

```typescript
// 1. Create entity
const entityResponse = await fetch('/api/v2/universal/entity-upsert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'salon-org-123',
    entity_type: 'service',
    entity_name: 'Deluxe Manicure',
    smart_code: 'HERA.SALON.SVC.NAIL.MANICURE.V1'
  })
});

const entity = await entityResponse.json();
const entityId = entity.entity_id;

// 2. Add dynamic fields
await fetch('/api/v2/universal/dynamic-data-upsert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'salon-org-123',
    entity_id: entityId,
    field_name: 'base_price',
    field_type: 'number',
    field_value_number: 45.00,
    smart_code: 'HERA.SALON.SVC.DYN.PRICE.V1'
  })
});

// 3. Batch add multiple fields
await fetch('/api/v2/universal/dynamic-data-upsert', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'salon-org-123',
    entity_id: entityId,
    fields: [
      {
        field_name: 'duration_minutes',
        field_type: 'number',
        field_value_number: 30
      },
      {
        field_name: 'nail_polish_included',
        field_type: 'boolean',
        field_value_boolean: true
      },
      {
        field_name: 'available_colors',
        field_type: 'json',
        field_value_json: {
          classic: ['red', 'pink', 'nude'],
          trendy: ['blue', 'green', 'gold']
        }
      }
    ]
  })
});

// 4. Read entity with dynamic data
const serviceData = await fetch(
  `/api/v2/universal/entity-read?entity_id=${entityId}&organization_id=salon-org-123`
);

// 5. Read all dynamic fields for entity
const dynamicData = await fetch(
  `/api/v2/universal/dynamic-data-read?entity_id=${entityId}&organization_id=salon-org-123`
);

// 6. Delete specific dynamic field
await fetch('/api/v2/universal/dynamic-data-delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'salon-org-123',
    entity_id: entityId,
    field_name: 'nail_polish_included'
  })
});

// 7. Delete entity (cascades to dynamic data)
await fetch('/api/v2/universal/entity-delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_id: 'salon-org-123',
    entity_id: entityId,
    hard_delete: true
  })
});
```

## Benefits of Complete CRUD with Dynamic Data

### 🚀 **Flexibility**
- Add unlimited custom fields to any entity without schema changes
- Support multiple data types: text, number, boolean, date, datetime, json
- Batch operations for efficient bulk updates

### ⚡ **Performance**
- Direct database operations with minimal overhead
- Proper indexing on entity_id for fast lookups
- Optional JOINs only when needed

### 🔒 **Security**
- Multi-tenant isolation enforced at both entity and dynamic data levels
- Foreign key constraints ensure data integrity
- Cascade deletes prevent orphaned data

### 🛠️ **Developer Experience**
- Type-safe TypeScript interfaces
- Helper methods for common operations
- Auto-detection of field types
- Comprehensive error handling

### 📊 **Business Intelligence**
- Smart codes on dynamic fields for business context
- Metadata support for additional field information
- JSON fields for complex data structures
- Full audit trails with created/updated timestamps

## Schema Relationship Summary

```sql
-- Core Entities (1)
core_entities {
  id: UUID (PK)
  organization_id: UUID (FK)
  entity_type: TEXT
  entity_name: TEXT
  entity_code: TEXT
  smart_code: TEXT
  metadata: JSONB
  -- ... other fields
}

-- Dynamic Data (Many)
core_dynamic_data {
  id: UUID (PK)
  organization_id: UUID (FK)
  entity_id: UUID (FK → core_entities.id) -- THE RELATIONSHIP
  field_name: TEXT
  field_type: TEXT
  field_value_text: TEXT
  field_value_number: NUMERIC
  field_value_boolean: BOOLEAN
  field_value_date: DATE
  field_value_datetime: TIMESTAMPTZ
  field_value_json: JSONB
  smart_code: TEXT
  metadata: JSONB
  -- ... audit fields
}
```

This complete solution provides full CRUD operations for both entities and their dynamic data, maintaining the flexibility of the HERA universal architecture while providing the power and performance needed for production applications.