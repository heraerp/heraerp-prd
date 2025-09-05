# HERA Universal Configuration Rules (UCR) System

## Overview

The Universal Configuration Rules (UCR) system is HERA's centralized configuration engine that provides a single, consistent way for all modules to query and apply business rules. Built on the sacred 6-table architecture, UCR enables infinite configuration flexibility without schema changes.

## Key Principles

1. **One Rules Engine**: Single resolution algorithm used everywhere
2. **One Storage Pattern**: All rules stored in core_entities as `universal_rule` type
3. **Smart Code Driven**: Every rule family has a smart code pattern
4. **Perfect Isolation**: Organization-level isolation enforced at every level
5. **Deterministic Resolution**: Predictable rule matching with clear precedence

## Architecture

### Rule Structure

```typescript
interface UniversalRule {
  rule_id: string
  smart_code: string // HERA.UNIV.CONFIG.<FAMILY>.<TYPE>.<VERSION>
  status: 'active' | 'inactive' | 'draft'
  
  scope: {
    organization_id: string
    branches?: string[]
    services?: string[]
    specialists?: string[]
    customers?: string[] // IDs or segment smart codes
    channels?: string[]
  }
  
  conditions: {
    effective_from: string
    effective_to?: string
    days_of_week?: number[] // 0-6
    time_windows?: TimeWindow[]
    utilization_below?: number
    min_lead_minutes?: number
    // ... family-specific conditions
  }
  
  priority: number // Higher wins
  
  payload: {
    // Family-specific configuration
  }
  
  metadata: {
    created_by: string
    created_at: string
    rollout?: RolloutStrategy
    version: number
  }
}
```

### Storage in Sacred Six

- **core_entities**: Rules stored as entity_type = 'universal_rule'
- **core_dynamic_data**: Payload schemas and extended rule data
- **core_relationships**: Optional rule relationships (rule ↔ branch)
- **universal_transactions**: Policy decisions logged as transactions
- **universal_transaction_lines**: Financial effects from rules
- **core_organizations**: Isolation via organization_id

## Rule Families

### Booking & Scheduling
- `HERA.UNIV.CONFIG.BOOKING.AVAILABILITY.V1`
- `HERA.UNIV.CONFIG.BOOKING.NO_SHOW.V1`
- `HERA.UNIV.CONFIG.BOOKING.SLOT_FILTER.V1`

### Notifications
- `HERA.UNIV.CONFIG.REMINDER.APPOINTMENT.V1`
- `HERA.UNIV.CONFIG.NOTIFICATION.SMS.V1`
- `HERA.UNIV.CONFIG.NOTIFICATION.EMAIL.V1`

### Pricing & Discounts
- `HERA.UNIV.CONFIG.PRICING.DISCOUNT.V1`
- `HERA.UNIV.CONFIG.PRICING.SURGE.V1`
- `HERA.UNIV.CONFIG.PRICING.MEMBERSHIP.V1`

### Financial
- `HERA.UNIV.CONFIG.TAX.RULE.V1`
- `HERA.UNIV.CONFIG.PAYMENT.TERMS.V1`
- `HERA.UNIV.CONFIG.CREDIT.LIMIT.V1`

### Inventory
- `HERA.UNIV.CONFIG.INVENTORY.RESERVATION.V1`
- `HERA.UNIV.CONFIG.INVENTORY.REORDER.V1`

### UI/UX
- `HERA.UNIV.CONFIG.UI.EXPERIMENT.V1`
- `HERA.UNIV.CONFIG.UI.FEATURE_FLAG.V1`

## Resolution Algorithm

```typescript
function resolveRules(context: Context, family: string): Rule[] {
  // 1. Fetch cached rules for org + family
  const candidates = RULE_CACHE.fetch(context.organization_id, family)
  
  // 2. Filter by scope
  const inScope = candidates.filter(r => inScopeMatch(r.scope, context))
  
  // 3. Filter by time conditions
  const activeNow = inScope.filter(r => timeMatch(r.conditions, context.now))
  
  // 4. Filter by business conditions
  const conditionOK = activeNow.filter(r => conditionsMatch(r.conditions, context))
  
  // 5. Sort by priority, specificity, version
  const ordered = conditionOK.sort(byPrioritySpecificityVersion)
  
  // 6. Apply family-specific composition
  return composeByFamily(ordered, family)
}
```

## API Usage

### Query Rules
```typescript
// Get applicable rules
const rules = await universalConfig.resolve({
  organization_id: 'org_123',
  family: 'HERA.UNIV.CONFIG.BOOKING.NO_SHOW',
  context: {
    branch_id: 'br_45',
    service_ids: ['svc_color'],
    specialist_id: 'sp_9',
    customer_segments: ['cust_tier_gold'],
    channel: 'web',
    now: new Date(),
    utilization: 0.42
  }
})
```

### Make Decisions
```typescript
// Get decision based on rules
const decision = await universalConfig.decide({
  family: 'HERA.UNIV.CONFIG.BOOKING.NO_SHOW',
  context: { ... },
  inputs: {
    appointment_value: 140,
    deposit_captured: 30
  }
})
// Returns: { decision: 'waive', reason: 'grace', fee: 0, evidence: {...} }
```

## Performance & Caching

- **In-Memory Cache**: Per-org, per-family with TTL
- **Event-Driven Invalidation**: Updates when rules change
- **Read Replicas**: For high-throughput queries
- **Batch Resolution**: Resolve multiple contexts efficiently

## Security

- **Organization Isolation**: Every query filtered by org_id
- **Read-Only Tokens**: Safe for public endpoints
- **Audit Trail**: All decisions logged as transactions
- **Version Control**: Complete change history

## Best Practices

1. **Use Standard Families**: Don't create custom families without approval
2. **Set Priorities**: Always set explicit priorities to avoid conflicts
3. **Test Coverage**: Use preview simulator before deploying
4. **Version Appropriately**: New versions for breaking changes
5. **Document Payloads**: Clear schemas for each family
6. **Monitor Usage**: Track "no matching rule" cases

## Integration Guide

See implementation files:
- `/src/lib/universal-config/universal-config-service.ts` - Core service
- `/src/lib/universal-config/rule-resolver.ts` - Resolution engine
- `/src/lib/universal-config/rule-families/` - Family definitions
- `/src/app/api/v1/config/` - REST API endpoints
- `/src/components/admin/config/` - Admin UI components