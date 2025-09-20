# Universal CRUD Procedures

## Overview

HERA provides universal CRUD procedures for entities (master data) and transactions (business events) that can be reused across all modules. Instead of writing custom CRUD operations for each module, you simply create a profile that customizes the universal procedures.

## Benefits of Universal CRUD

1. **Correctness by Design**: Entities are slow-changing truth, transactions are immutable events
2. **Uniform Guardrails**: Org isolation, idempotency, validation, and audit across all modules
3. **No Schema Changes**: New fields via core_dynamic_data, new behaviors via procedures
4. **Performance Optimized**: Entities use caching/read-models, transactions use batching
5. **Finance Integrity**: Automatic GL posting, tax calculation, inventory management
6. **Analytics Ready**: Entities become dimensions, transactions are facts
7. **Reusable**: Just create a profile - the universal procedures do the rest
8. **Compliance Built-in**: Soft-delete, audit trails, versioned smart codes

## Architecture

### Entity CRUD (`/entity/`)
- `entity.create.yml` - Create any business entity
- `entity.read.yml` - Read entity with logged access
- `entity.update.yml` - Patch entity attributes safely  
- `entity.archive.yml` - Soft-delete with dependency checks
- `orchestration.yml` - HTTP route mappings

### Transaction CRUD (`/txn/`)
- `txn.header.create.yml` - Create transaction headers
- `txn.line.add.yml` - Add lines to transactions
- `txn.line.update.yml` - Update line quantities/attributes
- `txn.line.remove.yml` - Remove lines with compensations
- `txn.header.finalize.yml` - Finalize transactions (cart→sale)
- `txn.header.void.yml` - Void/reverse transactions
- `orchestration.yml` - HTTP route mappings

## How to Use

### 1. Create a Module Profile

Create a profile YAML that defines:
- Entity types or transaction families
- Required roles/permissions
- Validation rules (JSON schemas)
- Business rules and constraints
- Before/after hooks for procedures

Example profiles:
- `/salon/catalog/profile.yml` - Entity CRUD for services, products, employees
- `/salon/pos/profile.yml` - Transaction CRUD for POS operations

### 2. Register the Profile

In your module's orchestration, reference the universal procedures with your profile:

```yaml
routes:
  - http: POST /api/v1/salon/entities
    handler: HERA.UNIV.ENTITY.CREATE.V1
    profile: HERA.SALON.CATALOG.PROFILE.V1
```

### 3. Implement API Handlers

Create thin API handlers that just call the procedure runner:

```typescript
export async function POST(request: NextRequest) {
  const payload = await request.json()
  
  return runProcedure({
    procedure: 'HERA.UNIV.ENTITY.CREATE.V1',
    profile: 'HERA.SALON.CATALOG.PROFILE.V1',
    payload
  })
}
```

## Profile Structure

### Entity Profile
```yaml
smart_code: HERA.MODULE.PROFILE.V1
entity_types: [SERVICE, PRODUCT, EMPLOYEE]
required_role_create: catalog_admin
unique_key: entity_code
derivation_rules:
  SERVICE: "HERA.MODULE.SVC.${CODE}.V1"
validation:
  SERVICE:
    dynamic_json_schema: {...}
after_create:
  SERVICE: [HERA.MODULE.POST_CREATE.V1]
```

### Transaction Profile
```yaml
smart_code: HERA.MODULE.POS.PROFILE.V1
required_role_create: pos_operator
header_families: [HERA.MODULE.CART.V1]
line_families: [HERA.MODULE.SVC.LINE.]
initial_state: ACTIVE
final_state: FINALIZED
after_add: [HERA.MODULE.REPRICE.V1]
post_finalize: [HERA.MODULE.GL.POST.V1]
```

## JSON Data Storage

Dynamic data is stored in `core_dynamic_data`:
- Key slug: 'attributes' for entity attributes
- JSON merge patch for partial updates
- Optional JSON schema validation per profile
- Version tracking and audit trail

## Testing

Create UAT tests that exercise the full CRUD lifecycle:
1. Create → Update → Archive for entities
2. Create header → Add lines → Update → Finalize for transactions
3. Test error cases: duplicates, invalid data, permissions
4. Test org isolation and multi-tenant safety

## Best Practices

1. **Always use procedures** - No direct DB writes in APIs
2. **Profile everything** - Even simple CRUD needs a profile
3. **Test idempotency** - Operations should be retry-safe
4. **Log everything** - Use observability features
5. **Version smart codes** - Always end with .V1, .V2, etc.
6. **Handle errors gracefully** - Use defined error codes
7. **Document profiles** - Explain validation rules and hooks

## Next Steps

1. Copy example profiles from `/salon/` as templates
2. Customize for your module (HR, Finance, etc.)
3. Wire up orchestration routes
4. Create thin API handlers
5. Write comprehensive tests
6. Deploy with confidence!

The universal CRUD system ensures every module follows HERA principles while eliminating repetitive code and potential bugs.