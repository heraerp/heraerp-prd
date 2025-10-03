# @hera/playbooks

Declarative, versioned business logic procedures for HERA Universal Architecture.

## Overview

Playbooks provide a structured way to express business logic that operates on HERA entities. They consist of sequential steps that validate, transform, persist, and audit entity changes.

## Key Concepts

- **Declarative DSL**: Express business logic as data, not code
- **Versioned**: Smart code-based versioning (e.g., `HERA.SALON.PRODUCT.PLAYBOOK.v1`)
- **Adapter Pattern**: Pluggable persistence backends (Universal API, Supabase, etc.)
- **Transaction Support**: Rollback capability for complex operations
- **Audit Trail**: Built-in activity logging for compliance

## Step Types

1. **validate** - Check preconditions, throw to fail
2. **enforce** - Normalize/coerce data, always succeeds
3. **transform** - Derive new fields from existing data
4. **post** - Persist changes to backend
5. **audit** - Log activity for audit trail
6. **branch** - Conditional execution paths
7. **tx** - Transaction wrapper for atomicity

## Example Usage

```typescript
import { executePlaybook } from '@hera/playbooks';
import { PRODUCT_PLAYBOOK_V1 } from '@hera/playbooks/salon';
import { universalApiAdapters } from '@hera/playbooks/adapters';

const result = await executePlaybook(PRODUCT_PLAYBOOK_V1, productEntity, {
  organizationId: 'org_123',
  actorId: 'user_456',
  actorRole: 'admin',
  adapters: universalApiAdapters,
});
```

## Creating a Playbook

```typescript
import { Playbook, validate, transform, post, audit } from '@hera/playbooks';

export const MY_PLAYBOOK_V1: Playbook = {
  id: 'HERA.MYINDUSTRY.MYENTITY.PLAYBOOK.v1',
  entityType: 'MY_ENTITY',
  version: 'v1',
  steps: [
    validate('required:name', (ctx) => {
      if (!ctx.entity.payload.entity_name) {
        throw new Error('Name is required');
      }
    }),
    
    transform('derive:code', (ctx) => {
      const name = ctx.entity.payload.entity_name;
      const code = name.toUpperCase().replace(/\s+/g, '_');
      ctx.util.setDynamic('code', code);
    }),
    
    post('persist:entity', async (ctx) => {
      await ctx.util.persist();
    }),
    
    audit('log:created', (ctx) => {
      ctx.util.log('entity_created', {
        entityType: ctx.entity.type,
        entityId: ctx.entity.id,
      });
    }),
  ],
};
```

## Smart Code Convention

Playbook IDs follow the pattern:
```
HERA.{INDUSTRY}.{MODULE}.PLAYBOOK.v{VERSION}
```

Examples:
- `HERA.SALON.PRODUCT.PLAYBOOK.v1`
- `HERA.JEWELRY.GRADING.PLAYBOOK.v1`
- `HERA.HEALTHCARE.PATIENT.PLAYBOOK.v1`

## Testing

```bash
# Validate all playbooks
npm run playbooks:validate

# Run example test
npm run playbooks:test
```

## Adapters

### Universal API Adapter (Default)
Maps playbook operations to HERA Universal API v2 calls.

### Supabase Adapter
Direct Supabase integration (stub for future implementation).

### Custom Adapter
Implement the adapter interface for custom backends:

```typescript
const myAdapter = {
  setDynamic(ctx, field) { /* ... */ },
  link(ctx, rel) { /* ... */ },
  async persist(ctx) { /* ... */ },
  audit(ctx, event, payload) { /* ... */ },
  async tx(fn) { /* ... */ },
  async fetchEntityById(id, opts) { /* ... */ },
};
```

## Benefits

1. **Consistency**: Same business logic pattern across all entities
2. **Testability**: Mock adapters for unit testing
3. **Auditability**: Every step logged with context
4. **Maintainability**: Business logic as data, not scattered code
5. **Versioning**: Smart code-based evolution of logic
6. **Reusability**: Share common patterns across entities