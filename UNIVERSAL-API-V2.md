# HERA Universal API v2 - The Ultimate Development Pattern
**Created: 2024-01-10**
**Last Updated: 2024-01-10**
**Status: ACTIVE - Use this for ALL new development**

## 🚀 Overview

The Universal API v2 is a revolutionary pattern that handles CRUD operations for ANY entity type using a single endpoint. This eliminates the need to create separate APIs for each business object.

## 📋 Version History

| Version | Date | Status | Endpoints | Notes |
|---------|------|--------|-----------|-------|
| v2 | 2024-01-10 | **ACTIVE** | `/api/v2/entities` | Current universal pattern |
| v1 | 2023-xx-xx | DEPRECATED | `/api/v1/universal` | Legacy, entity-specific |

## 🎯 Key Components

### 1. Universal API Endpoint
**Location**: `/src/app/api/v2/entities/route.ts`
**Created**: 2024-01-10

```typescript
// Single endpoint for ALL entities
POST   /api/v2/entities     // Create any entity
GET    /api/v2/entities     // Read with filters
PUT    /api/v2/entities     // Update entity
DELETE /api/v2/entities/[id] // Delete entity
```

### 2. Universal React Hook
**Location**: `/src/hooks/useUniversalEntity.ts`
**Created**: 2024-01-10

```typescript
// One hook for ANY entity type
const products = useUniversalEntity({ entity_type: 'product' })
const services = useUniversalEntity({ entity_type: 'service' })
const customers = useUniversalEntity({ entity_type: 'customer' })
```

### 3. Entity Builder Utility
**Location**: `/src/lib/universal/entity-builder.ts`
**Created**: 2024-01-10

```typescript
// Fluent API for building entities
const product = new EntityBuilder('product', 'Shampoo', SmartCodes.product.entity)
  .numberField('price', 89.99, SmartCodes.product.fields.price)
  .textField('brand', 'HERA Pro', SmartCodes.product.fields.brand)
  .build()
```

## 📊 API Structure

### Request Format
```json
{
  "entity_type": "product",
  "entity_name": "Professional Shampoo",
  "entity_code": "SHMP-001",
  "smart_code": "HERA.SALON.CATALOG.PRODUCT.RETAIL.V1",
  "metadata": {
    "category": "Hair Care",
    "tax_code": "VAT_STD"
  },
  "dynamic_fields": {
    "price": {
      "value": 89.99,
      "type": "number",
      "smart_code": "HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1"
    },
    "brand": {
      "value": "HERA Professional",
      "type": "text",
      "smart_code": "HERA.SALON.CATALOG.PRODUCT.FIELD.BRAND.V1"
    }
  }
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "entity_id": "uuid",
    "entity_type": "product",
    "entity_name": "Professional Shampoo",
    "entity_code": "SHMP-001",
    "smart_code": "HERA.SALON.CATALOG.PRODUCT.RETAIL.V1",
    "dynamic_fields": { ... }
  }
}
```

## 🛠️ RPC Functions Used

| Function | Purpose | Added Date |
|----------|---------|------------|
| `hera_entity_upsert_v1` | Create/update entities | Pre-2024 |
| `hera_entity_read_v1` | Read entities with filters | Pre-2024 |
| `hera_entity_delete_v1` | Soft/hard delete entities | Pre-2024 |
| `hera_dynamic_data_set_v1` | Store dynamic fields | Pre-2024 |

## 📁 File Locations

```
/src/
├── app/
│   └── api/
│       └── v2/
│           └── entities/
│               ├── route.ts          # Main API endpoint
│               └── [id]/
│                   └── route.ts      # Delete endpoint
├── hooks/
│   └── useUniversalEntity.ts        # Universal React hook
└── lib/
    └── universal/
        └── entity-builder.ts         # Entity builder utility
```

## 🚀 Quick Start Examples

### Creating a Product
```typescript
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { EntityBuilder, SmartCodes } from '@/lib/universal/entity-builder'

const products = useUniversalEntity({ entity_type: 'product' })

const newProduct = new EntityBuilder('product', 'Shampoo', SmartCodes.product.entity)
  .code('SHMP-001')
  .numberField('price', 89.99, SmartCodes.product.fields.price)
  .textField('brand', 'HERA Pro', SmartCodes.product.fields.brand)
  .build()

await products.create(newProduct)
```

### Creating a Service
```typescript
const services = useUniversalEntity({ entity_type: 'service' })

await services.create({
  entity_type: 'service',
  entity_name: 'Hair Cut & Style',
  smart_code: 'HERA.SALON.CATALOG.SERVICE.CHAIRTIME.V1',
  dynamic_fields: {
    duration_minutes: { 
      value: 60, 
      type: 'number', 
      smart_code: 'HERA.SALON.CATALOG.SERVICE.FIELD.DURATION.V1' 
    },
    price: { 
      value: 150, 
      type: 'number', 
      smart_code: 'HERA.SALON.CATALOG.SERVICE.FIELD.PRICE.V1' 
    }
  }
})
```

## 🎯 Smart Code Patterns

### Standard Structure
```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}
```

### Common Patterns (as of 2024-01-10)
```typescript
// Products
HERA.SALON.CATALOG.PRODUCT.RETAIL.V1
HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1
HERA.SALON.CATALOG.PRODUCT.FIELD.BRAND.V1

// Services  
HERA.SALON.CATALOG.SERVICE.CHAIRTIME.V1
HERA.SALON.CATALOG.SERVICE.FIELD.DURATION.V1
HERA.SALON.CATALOG.SERVICE.FIELD.PRICE.V1

// Customers
HERA.SALON.CRM.CUSTOMER.PROFILE.V1
HERA.SALON.CRM.CUSTOMER.FIELD.EMAIL.V1
HERA.SALON.CRM.CUSTOMER.FIELD.PHONE.V1

// Staff
HERA.SALON.HR.STAFF.PROFILE.V1
HERA.SALON.HR.STAFF.FIELD.ROLE.V1
HERA.SALON.HR.STAFF.FIELD.COMMISSION.V1
```

## ⚠️ Migration Guide

### From Old APIs to Universal v2

#### Old Pattern (DEPRECATED)
```typescript
// Separate APIs for each entity
POST /api/playbook/salon/products
POST /api/playbook/salon/services
POST /api/playbook/salon/customers

// Entity-specific hooks
useProductsPlaybook()
useServicesPlaybook()
useCustomersPlaybook()
```

#### New Pattern (USE THIS)
```typescript
// One API for everything
POST /api/v2/entities

// One hook with different configs
useUniversalEntity({ entity_type: 'product' })
useUniversalEntity({ entity_type: 'service' })
useUniversalEntity({ entity_type: 'customer' })
```

## 📈 Benefits Summary

1. **10x Faster Development** - One pattern for everything
2. **No Backend Changes** - Add fields without touching APIs
3. **Infinite Scalability** - Same API handles any complexity
4. **Perfect Multi-tenancy** - Organization isolation built-in
5. **Type Safety** - Full TypeScript support
6. **Future Proof** - New entity types need zero API changes

## 🔍 Demo & Testing

- **Demo Page**: `/salon/universal-demo` (created 2024-01-10)
- **Test Page**: `/salon/products-test` (uses old pattern - for comparison)

## 📝 Notes for Future Development

1. **Always use v2** for new features
2. **Migrate old endpoints** gradually to v2
3. **Document smart codes** in entity-builder.ts
4. **Keep this file updated** with new entity types

## 🚨 Important Reminders

- **Organization ID**: Always passed via auth token
- **Smart Codes**: Required for every entity and field
- **Dynamic Fields**: Store business data, not system fields
- **Multi-tenancy**: Automatic via auth middleware

---

**This is the way forward. Build once, use everywhere!** 🚀