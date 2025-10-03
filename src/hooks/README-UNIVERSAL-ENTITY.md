# Universal Entity Hook - Complete Guide

## Overview

The `useUniversalEntity` hook provides a **battle-tested, reusable solution** for managing ANY entity type with dynamic data. It handles all the complexity we solved for products:

✅ Automatic dynamic data loading
✅ Proper metadata merging
✅ Complete CRUD operations
✅ Smart code integration
✅ Multi-tenant isolation
✅ Status filtering
✅ Search and category filtering

## Quick Start

### 1. Products (Already Working)

```typescript
import { useUniversalEntity } from '@/hooks/useUniversalEntity'

const {
  entities: products,
  createEntity,
  updateEntity,
  deleteEntity,
  isLoading
} = useUniversalEntity({
  entityType: 'product',
  organizationId,
  smartCode: 'HERA.SALON.PROD.ENT.RETAIL.V1',
  dynamicFieldSmartCode: 'HERA.SALON.PROD.FIELD.DATA.V1'
})

// Create product with dynamic fields
await createEntity({
  name: 'Hair Gel',
  code: 'PROD-001',
  description: 'Professional hair gel',
  status: 'active',
  dynamicFields: [
    { name: 'price', value: 25.0, type: 'number' },
    { name: 'cost', value: 10.0, type: 'number' },
    { name: 'category', value: 'Hair Care', type: 'text' },
    { name: 'qty_on_hand', value: 50, type: 'number' }
  ]
})
```

### 2. Services

```typescript
import { useUniversalEntity } from '@/hooks/useUniversalEntity'

const {
  entities: services,
  createEntity,
  updateEntity
} = useUniversalEntity({
  entityType: 'service',
  organizationId,
  smartCode: 'HERA.SALON.SVC.ENT.STANDARD.V1',
  dynamicFieldSmartCode: 'HERA.SALON.SVC.FIELD.DATA.V1'
})

// Create service with dynamic fields
await createEntity({
  name: 'Haircut & Styling',
  code: 'SVC-001',
  description: 'Professional haircut with styling',
  dynamicFields: [
    { name: 'price', value: 45.0, type: 'number' },
    { name: 'duration_minutes', value: 60, type: 'number' },
    { name: 'category', value: 'Hair Services', type: 'text' },
    { name: 'commission_rate', value: 0.3, type: 'number' }
  ]
})
```

### 3. Customers

```typescript
const { entities: customers, createEntity } = useUniversalEntity({
  entityType: 'customer',
  organizationId,
  smartCode: 'HERA.SALON.CUST.ENT.STANDARD.V1',
  dynamicFieldSmartCode: 'HERA.SALON.CUST.FIELD.DATA.V1'
})

// Create customer with dynamic fields
await createEntity({
  name: 'Jane Doe',
  code: 'CUST-001',
  dynamicFields: [
    { name: 'email', value: 'jane@example.com', type: 'text' },
    { name: 'phone', value: '+971501234567', type: 'text' },
    { name: 'loyalty_points', value: 150, type: 'number' },
    { name: 'preferred_stylist', value: 'Sarah Johnson', type: 'text' },
    { name: 'vip_status', value: true, type: 'boolean' }
  ]
})
```

### 4. Employees

```typescript
const {
  entities: employees,
  createEntity,
  updateEntity
} = useUniversalEntity({
  entityType: 'employee',
  organizationId,
  smartCode: 'HERA.SALON.EMP.ENT.STANDARD.V1',
  dynamicFieldSmartCode: 'HERA.SALON.EMP.FIELD.DATA.V1'
})

// Create employee with dynamic fields
await createEntity({
  name: 'Sarah Johnson',
  code: 'EMP-001',
  description: 'Senior Hair Stylist',
  dynamicFields: [
    { name: 'position', value: 'Senior Stylist', type: 'text' },
    { name: 'hire_date', value: '2023-01-15', type: 'date' },
    { name: 'hourly_rate', value: 25.0, type: 'number' },
    { name: 'commission_rate', value: 0.3, type: 'number' },
    { name: 'specialties', value: ['coloring', 'cutting', 'styling'], type: 'json' }
  ]
})
```

### 5. Appointments

```typescript
const { entities: appointments, createEntity } = useUniversalEntity({
  entityType: 'appointment',
  organizationId,
  smartCode: 'HERA.SALON.APPT.ENT.STANDARD.V1',
  dynamicFieldSmartCode: 'HERA.SALON.APPT.FIELD.DATA.V1'
})

// Create appointment with dynamic fields
await createEntity({
  name: 'Haircut - Jane Doe',
  code: 'APPT-001',
  dynamicFields: [
    { name: 'customer_id', value: 'customer-uuid', type: 'text' },
    { name: 'stylist_id', value: 'employee-uuid', type: 'text' },
    { name: 'service_id', value: 'service-uuid', type: 'text' },
    { name: 'appointment_date', value: '2025-01-15T10:00:00', type: 'date' },
    { name: 'duration_minutes', value: 60, type: 'number' },
    { name: 'status', value: 'confirmed', type: 'text' },
    { name: 'notes', value: 'Customer prefers layered cut', type: 'text' }
  ]
})
```

## Update Operations

```typescript
// Update entity with new dynamic fields
await updateEntity({
  id: 'entity-uuid',
  updates: {
    name: 'Updated Name',
    description: 'Updated description',
    status: 'active',
    dynamicFields: [
      { name: 'price', value: 30.0, type: 'number' },
      { name: 'category', value: 'New Category', type: 'text' }
    ]
  }
})
```

## Delete Operations

```typescript
// Soft delete (status = 'archived')
await deleteEntity('entity-uuid')
```

## Complete Component Example

```typescript
'use client'

import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { useSalonContext } from '@/app/salon/SalonProvider'

export default function ServicesPage() {
  const { organizationId } = useSalonContext()

  const {
    entities: services,
    createEntity,
    updateEntity,
    deleteEntity,
    isLoading,
    isCreating
  } = useUniversalEntity({
    entityType: 'service',
    organizationId,
    smartCode: 'HERA.SALON.SVC.ENT.STANDARD.V1',
    dynamicFieldSmartCode: 'HERA.SALON.SVC.FIELD.DATA.V1'
  })

  const handleCreateService = async (formData: any) => {
    await createEntity({
      name: formData.serviceName,
      code: formData.serviceCode,
      description: formData.description,
      dynamicFields: [
        { name: 'price', value: formData.price, type: 'number' },
        { name: 'duration_minutes', value: formData.duration, type: 'number' },
        { name: 'category', value: formData.category, type: 'text' }
      ]
    })
  }

  if (isLoading) return <div>Loading services...</div>

  return (
    <div>
      <h1>Services ({services.length})</h1>
      {services.map(service => (
        <div key={service.id}>
          <h3>{service.entity_name}</h3>
          <p>Price: {service.metadata?.price}</p>
          <p>Duration: {service.metadata?.duration_minutes} min</p>
          <p>Category: {service.metadata?.category}</p>
        </div>
      ))}
    </div>
  )
}
```

## Smart Code Conventions

### Format

`HERA.{MODULE}.{ENTITY}.{TYPE}.{VARIANT}.V1`

### Examples

- **Products**: `HERA.SALON.PROD.ENT.RETAIL.V1`
- **Services**: `HERA.SALON.SVC.ENT.STANDARD.V1`
- **Customers**: `HERA.SALON.CUST.ENT.STANDARD.V1`
- **Employees**: `HERA.SALON.EMP.ENT.STANDARD.V1`
- **Appointments**: `HERA.SALON.APPT.ENT.STANDARD.V1`

### Dynamic Field Smart Codes

- **Products**: `HERA.SALON.PROD.FIELD.DATA.V1`
- **Services**: `HERA.SALON.SVC.FIELD.DATA.V1`
- **Customers**: `HERA.SALON.CUST.FIELD.DATA.V1`
- **Employees**: `HERA.SALON.EMP.FIELD.DATA.V1`
- **Appointments**: `HERA.SALON.APPT.FIELD.DATA.V1`

## Common Dynamic Fields by Entity Type

### Products

- `price` (number) - Selling price
- `cost` (number) - Cost price
- `category` (text) - Product category
- `qty_on_hand` (number) - Stock quantity
- `barcode` (text) - Product barcode
- `supplier_name` (text) - Supplier

### Services

- `price` (number) - Service price
- `duration_minutes` (number) - Service duration
- `category` (text) - Service category
- `commission_rate` (number) - Staff commission
- `requires_booking` (boolean) - Booking required

### Customers

- `email` (text) - Email address
- `phone` (text) - Phone number
- `loyalty_points` (number) - Loyalty points
- `vip_status` (boolean) - VIP customer
- `preferred_stylist` (text) - Preferred staff

### Employees

- `position` (text) - Job position
- `hire_date` (date) - Hire date
- `hourly_rate` (number) - Hourly rate
- `commission_rate` (number) - Commission rate
- `specialties` (json) - Array of specialties

### Appointments

- `customer_id` (text) - Customer reference
- `stylist_id` (text) - Staff reference
- `service_id` (text) - Service reference
- `appointment_date` (date) - Appointment date/time
- `duration_minutes` (number) - Duration
- `status` (text) - Appointment status
- `notes` (text) - Special notes

## Migration Guide

### From Old Hook to Universal Hook

**Before (useHeraProducts):**

```typescript
const { products, createProduct, updateProduct } = useHeraProducts({
  organizationId,
  includeArchived: false
})

await createProduct({
  name: 'Product Name',
  price: 25.0,
  category: 'Category'
})
```

**After (useUniversalEntity):**

```typescript
const {
  entities: products,
  createEntity,
  updateEntity
} = useUniversalEntity({
  entityType: 'product',
  organizationId,
  smartCode: 'HERA.SALON.PROD.ENT.RETAIL.V1',
  dynamicFieldSmartCode: 'HERA.SALON.PROD.FIELD.DATA.V1'
})

await createEntity({
  name: 'Product Name',
  dynamicFields: [
    { name: 'price', value: 25.0, type: 'number' },
    { name: 'category', value: 'Category', type: 'text' }
  ]
})
```

## Benefits

✅ **One Hook, All Entities** - Same pattern works everywhere
✅ **Battle-Tested** - Solved all the products complexity
✅ **Type-Safe** - Full TypeScript support
✅ **Automatic Loading** - Dynamic data fetched automatically
✅ **Smart Filtering** - Search, category, status filters built-in
✅ **Optimized Performance** - React Query caching & invalidation
✅ **Comprehensive Logging** - Debug logs at every step
✅ **Error Handling** - Graceful fallbacks for failed operations

## Advanced Features

### Custom Filtering

```typescript
const { entities } = useUniversalEntity({
  entityType: 'product',
  organizationId,
  searchQuery: 'hair', // Search by name/code
  categoryFilter: 'Hair Care', // Filter by category
  includeArchived: true, // Include archived items
  smartCode: 'HERA.SALON.PROD.ENT.RETAIL.V1',
  dynamicFieldSmartCode: 'HERA.SALON.PROD.FIELD.DATA.V1'
})
```

### Loading States

```typescript
const {
  isLoading,    // Initial load
  isCreating,   // Creating entity
  isUpdating,   // Updating entity
  isDeleting    // Deleting entity
} = useUniversalEntity({ ... })
```

### Manual Refetch

```typescript
const { refetch } = useUniversalEntity({ ... })

// Manually refresh data
await refetch()
```

## Next Steps

1. **Replace useHeraProducts** with useUniversalEntity in products page
2. **Create useHeraServices** using useUniversalEntity
3. **Create useHeraCustomers** using useUniversalEntity
4. **Create useHeraEmployees** using useUniversalEntity
5. **Create useHeraAppointments** using useUniversalEntity

Each specific hook can be a simple wrapper:

```typescript
// useHeraServices.ts
export function useHeraServices(options: { organizationId?: string }) {
  return useUniversalEntity({
    entityType: 'service',
    organizationId: options.organizationId,
    smartCode: 'HERA.SALON.SVC.ENT.STANDARD.V1',
    dynamicFieldSmartCode: 'HERA.SALON.SVC.FIELD.DATA.V1'
  })
}
```

This way, each module has a clean, simple API but uses the same robust implementation!
