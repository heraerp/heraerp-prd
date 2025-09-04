# HERA DNA SDK

Type-safe enforcement of HERA's sacred 6-table architecture at compile time.

## Overview

The HERA DNA SDK makes it impossible to violate HERA principles at compile time by:

1. **Branded Types** - SmartCode, OrganizationId, EntityId, and TransactionId are distinct types
2. **Compile-Time Gates** - TypeScript compiler prevents direct database access
3. **Runtime Validation** - Additional safety checks at runtime
4. **MCP Integration** - All operations go through MCP tools
5. **Automatic Code Generation** - SDK functions generated from MCP definitions

## Installation

```bash
cd packages/hera-dna-sdk
npm install
npm run build
```

## Usage

### Basic Setup

```typescript
import { HeraDNAClient, createOrganizationId, createSmartCode } from '@hera/dna-sdk';

// Initialize client with organization context
const client = new HeraDNAClient({
  organizationId: createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
  enableRuntimeGates: true,
  enableAudit: true
});
```

### Creating Entities

```typescript
// Type-safe entity creation
const customerResult = await client.createEntity({
  entityType: 'customer',
  entityName: 'ACME Corporation',
  entityCode: 'CUST-001',
  smartCode: createSmartCode('HERA.CRM.CUST.ENT.PROF.v1'),
  metadata: {
    industry: 'Technology',
    size: 'Enterprise'
  }
});

if (customerResult.success) {
  console.log('Customer created:', customerResult.data);
}
```

### Creating Transactions

```typescript
// Type-safe transaction creation
const saleResult = await client.createTransaction({
  transactionType: 'sale',
  transactionCode: 'SALE-2024-001',
  transactionDate: new Date(),
  smartCode: createSmartCode('HERA.SAL.TXN.ORDER.v1'),
  fromEntityId: customerId,
  toEntityId: warehouseId,
  totalAmount: 5000.00,
  currency: 'USD'
});
```

### Using Builders

```typescript
import { DNA, createOrganizationId } from '@hera/dna-sdk';

const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');

// Build entity with fluent API
const entity = DNA.entity(orgId)
  .type('product')
  .name('Premium Widget')
  .code('PROD-001')
  .smartCode('HERA.INV.PROD.ITEM.STD.v1')
  .metadata({ category: 'Electronics', price: 99.99 })
  .build();

// Build smart code with validation
const smartCode = DNA.smartCode()
  .industry('RESTAURANT')
  .module('CRM')
  .function('CUST')
  .type('PROF')
  .version(1)
  .build(); // Returns: HERA.REST.CRM.CUST.PROF.v1
```

### Type Guards

```typescript
import { isSmartCode, isOrganizationId, isCoreEntity } from '@hera/dna-sdk';

// Runtime type checking
if (isSmartCode(value)) {
  // TypeScript knows value is SmartCode
}

if (isCoreEntity(data)) {
  // TypeScript knows data is CoreEntity
  console.log(data.entity_name); // Safe property access
}
```

### Validators

```typescript
import { validateSmartCode, validateOrganizationId, batchValidate } from '@hera/dna-sdk';

// Validate with exceptions
const smartCode = validateSmartCode('HERA.CRM.CUST.ENT.PROF.v1'); // Returns SmartCode
const orgId = validateOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479'); // Returns OrganizationId

// Batch validation
const result = batchValidate([
  () => validateSmartCode(code1),
  () => validateSmartCode(code2),
  () => validateOrganizationId(orgId)
]);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Compile-Time Protection

The SDK prevents common violations at compile time:

```typescript
// ❌ These will not compile:

// Direct database access
const result = await supabase.from('core_entities').select(); // Error!

// Wrong parameter types
client.createEntity({
  smartCode: 'invalid-format' // Error: Must use createSmartCode()
});

// Missing organization context
client.createTransaction({
  // Error: organizationId is required
});

// Invalid table name
client.queryEntities({
  table: 'custom_table' // Error: Only sacred tables allowed
});
```

## Runtime Gates

Enable runtime validation for additional safety:

```typescript
import { DNARuntimeGate } from '@hera/dna-sdk/runtime';

const gate = new DNARuntimeGate({
  currentOrganizationId: orgId,
  enableSmartCodeValidation: true,
  enableOrganizationIsolation: true,
  enableAuditLogging: true
});

// Validate operations before execution
gate.validateOperation({
  table: 'core_entities',
  operation: 'create',
  organizationId: orgId,
  smartCode: 'HERA.CRM.CUST.ENT.PROF.v1',
  data: entityData
});

// Get metrics
const metrics = gate.getMetrics();
console.log('Success rate:', metrics.successfulOperations / metrics.totalOperations);
```

## Linting

Run the DNA linter to check for violations:

```bash
npm run lint

# Output:
# 🧬 HERA DNA Linter starting...
# ✅ No DNA violations found!
```

## Configuration

The SDK is configured via `hera.dna.json`:

```json
{
  "dna": {
    "sacredTables": ["core_organizations", "core_entities", ...],
    "smartCodePattern": "^HERA\\.[A-Z]+\\.[A-Z]+\\.[A-Z]+\\.[A-Z]+\\.v\\d+$",
    "gates": {
      "compile": { "enabled": true },
      "runtime": { "enabled": true }
    }
  }
}
```

## Generated SDK Functions

The SDK automatically generates type-safe functions from MCP tools:

```typescript
import { create_entity, create_transaction, set_dynamic_field } from '@hera/dna-sdk';

// All MCP tools are available as type-safe functions
const entity = await create_entity(
  'customer',
  'ACME Corp',
  smartCode,
  organizationId
);
```

## Best Practices

1. **Always use branded types** - Never use plain strings for IDs
2. **Enable runtime gates** in production for additional safety
3. **Use builders** for complex object creation
4. **Validate early** - Use validators at system boundaries
5. **Leverage type guards** for runtime type narrowing
6. **Run the linter** in CI/CD pipelines

## Sacred Principles Enforced

1. ✅ **Only 6 Tables** - Cannot access non-sacred tables
2. ✅ **Smart Codes Required** - Every operation needs valid smart codes
3. ✅ **Organization Isolation** - Cannot cross organization boundaries
4. ✅ **No Status Columns** - Must use relationships for workflows
5. ✅ **No Direct DB Access** - Must use SDK/MCP tools
6. ✅ **Type Safety** - Compile-time prevention of violations

## License

MIT