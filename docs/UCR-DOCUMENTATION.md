# HERA Universal Configuration Rules (UCR) Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Concepts](#key-concepts)
4. [Rule Structure](#rule-structure)
5. [API Reference](#api-reference)
6. [Implementation Examples](#implementation-examples)
7. [Best Practices](#best-practices)
8. [Industry Templates](#industry-templates)

## Overview

HERA's Universal Configuration Rules (UCR) is a revolutionary business logic engine that enables dynamic, rule-based configuration across all business operations. UCR allows organizations to define and manage complex business rules without code changes, providing enterprise-grade flexibility while maintaining the simplicity of HERA's 6-table architecture.

### Key Benefits
- **Zero Code Changes**: Modify business logic through configuration, not code
- **Real-time Updates**: Rules take effect immediately without deployment
- **Multi-tenant Isolation**: Each organization has its own rule sets
- **Industry Templates**: Pre-built rules for common business scenarios
- **AI Integration**: Smart rule suggestions and conflict detection
- **Complete Audit Trail**: Every rule change is tracked and versioned

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      UCR Engine                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Rule     │  │   Context   │  │  Decision   │        │
│  │  Storage    │  │  Resolver   │  │   Engine    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         ↓                ↓                 ↓                │
│  ┌─────────────────────────────────────────────────┐      │
│  │           Universal 6-Table Storage              │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

UCR rules are stored in the universal tables:
- **core_entities**: Rules stored as entities with `entity_type = 'config_rule'`
- **core_dynamic_data**: Rule conditions, actions, and metadata
- **core_relationships**: Rule dependencies and hierarchies
- **universal_transactions**: Rule execution history and audit logs

## Key Concepts

### 1. Rule Families
Rules are organized into families for logical grouping:
- `HERA.UNIV.CONFIG.BOOKING.*` - Appointment and booking rules
- `HERA.UNIV.CONFIG.PRICING.*` - Pricing and discount rules
- `HERA.UNIV.CONFIG.NOTIFICATION.*` - Communication rules
- `HERA.UNIV.CONFIG.WORKFLOW.*` - Business process rules
- `HERA.UNIV.CONFIG.VALIDATION.*` - Data validation rules

### 2. Rule Context
Context provides runtime information for rule evaluation:
```typescript
interface RuleContext {
  organization_id: string
  business_type: string
  entity_type?: string
  user_role?: string
  transaction_type?: string
  customer_segments?: string[]
  temporal: {
    timestamp: Date
    day_of_week: number
    hour_of_day: number
    is_holiday: boolean
  }
  custom?: Record<string, any>
}
```

### 3. Rule Priority
Rules are evaluated in priority order (1-1000):
- 1-100: System defaults
- 101-500: Organization overrides
- 501-900: Department/branch specific
- 901-1000: Critical overrides

## Rule Structure

### Basic Rule Format
```typescript
interface ConfigRule {
  // Identification
  id: string
  smart_code: string  // e.g., 'HERA.UNIV.CONFIG.BOOKING.ADVANCE.v1'
  name: string
  description: string
  
  // Classification
  family: string      // Rule family for grouping
  category: string    // Business category
  priority: number    // 1-1000, lower = higher priority
  
  // Conditions (ALL must match)
  conditions: Array<{
    field: string     // Context field to check
    operator: string  // eq, ne, gt, lt, gte, lte, in, contains
    value: any        // Value to compare
    logic?: 'AND' | 'OR'  // How to combine with next condition
  }>
  
  // Actions (executed if conditions match)
  actions: Array<{
    type: string      // set_value, calculate, validate, notify
    target: string    // Field or system to affect
    value: any        // Action payload
  }>
  
  // Metadata
  status: 'active' | 'inactive' | 'draft'
  effective_date?: Date
  expiration_date?: Date
  created_by: string
  organization_id: string
}
```

### Example Rule: VIP Discount
```json
{
  "smart_code": "HERA.UNIV.CONFIG.PRICING.VIP.DISCOUNT.v1",
  "name": "VIP Customer 15% Discount",
  "family": "HERA.UNIV.CONFIG.PRICING.DISCOUNT",
  "priority": 200,
  "conditions": [
    {
      "field": "customer_segments",
      "operator": "contains",
      "value": "vip_platinum"
    },
    {
      "field": "transaction_type",
      "operator": "in",
      "value": ["sale", "appointment"],
      "logic": "AND"
    }
  ],
  "actions": [
    {
      "type": "apply_discount",
      "target": "transaction_total",
      "value": {
        "discount_type": "percentage",
        "discount_value": 15,
        "reason": "VIP Platinum member discount"
      }
    }
  ],
  "status": "active"
}
```

## API Reference

### Universal Config Service
```typescript
import { universalConfigService } from '@/lib/universal-config/universal-config-service'

// Set organization context
universalConfigService.setOrganizationId('org-uuid')

// Create a new rule
const rule = await universalConfigService.createRule({
  smart_code: 'HERA.UNIV.CONFIG.BOOKING.BLACKOUT.v1',
  name: 'Holiday Blackout Dates',
  family: 'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY',
  conditions: [
    { field: 'temporal.is_holiday', operator: 'eq', value: true }
  ],
  actions: [
    { type: 'block_booking', target: 'availability', value: 'holiday_closure' }
  ]
})

// Query rules by family
const bookingRules = await universalConfigService.getRulesByFamily(
  'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY'
)

// Resolve rules for a context
const decisions = await universalConfigService.resolve({
  family: 'HERA.UNIV.CONFIG.PRICING.DISCOUNT',
  context: {
    organization_id: 'org-uuid',
    customer_segments: ['vip_gold'],
    transaction_type: 'sale',
    transaction_amount: 500
  }
})

// Make a decision (single result)
const decision = await universalConfigService.decide({
  family: 'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY',
  context: {
    appointment_time: '2024-12-25T14:00:00Z',
    temporal: { is_holiday: true }
  }
})
```

### Rule Testing
```typescript
// Test a rule before activation
const testResult = await universalConfigService.testRule(rule.id, {
  context: mockContext,
  inputs: mockInputs
})

// Validate rule conflicts
const conflicts = await universalConfigService.validateRule(rule)
if (conflicts.length > 0) {
  console.warn('Rule conflicts detected:', conflicts)
}
```

## Implementation Examples

### 1. Salon Booking Rules
```typescript
// Peak hour surcharge
{
  smart_code: 'HERA.UNIV.CONFIG.PRICING.PEAK.SALON.v1',
  family: 'HERA.UNIV.CONFIG.PRICING.SURCHARGE',
  conditions: [
    { field: 'business_type', operator: 'eq', value: 'salon' },
    { field: 'temporal.hour_of_day', operator: 'in', value: [17, 18, 19] },
    { field: 'temporal.day_of_week', operator: 'in', value: [5, 6] } // Fri, Sat
  ],
  actions: [
    { 
      type: 'apply_surcharge', 
      target: 'service_price',
      value: { surcharge_percent: 20, reason: 'Peak hours (Fri/Sat evening)' }
    }
  ]
}

// Double booking prevention
{
  smart_code: 'HERA.UNIV.CONFIG.BOOKING.DOUBLE.PREVENT.v1',
  family: 'HERA.UNIV.CONFIG.BOOKING.VALIDATION',
  conditions: [
    { field: 'stylist_availability', operator: 'eq', value: 'booked' }
  ],
  actions: [
    {
      type: 'block_booking',
      target: 'appointment',
      value: { error: 'Stylist already booked for this time slot' }
    }
  ]
}
```

### 2. Restaurant Order Rules
```typescript
// Happy hour discount
{
  smart_code: 'HERA.UNIV.CONFIG.PRICING.HAPPY.HOUR.v1',
  family: 'HERA.UNIV.CONFIG.PRICING.DISCOUNT',
  conditions: [
    { field: 'business_type', operator: 'eq', value: 'restaurant' },
    { field: 'temporal.hour_of_day', operator: 'gte', value: 15 },
    { field: 'temporal.hour_of_day', operator: 'lt', value: 18 },
    { field: 'order_type', operator: 'eq', value: 'dine_in' }
  ],
  actions: [
    {
      type: 'apply_discount',
      target: 'beverage_items',
      value: { discount_percent: 30, reason: 'Happy Hour 3-6 PM' }
    }
  ]
}
```

### 3. Healthcare Appointment Rules
```typescript
// Insurance pre-authorization required
{
  smart_code: 'HERA.UNIV.CONFIG.WORKFLOW.INSURANCE.AUTH.v1',
  family: 'HERA.UNIV.CONFIG.WORKFLOW.APPROVAL',
  conditions: [
    { field: 'service_category', operator: 'in', value: ['surgery', 'specialist'] },
    { field: 'payment_method', operator: 'eq', value: 'insurance' }
  ],
  actions: [
    {
      type: 'require_approval',
      target: 'appointment',
      value: { 
        approval_type: 'insurance_pre_auth',
        blocking: true,
        notification_recipients: ['billing_dept', 'patient']
      }
    }
  ]
}
```

## Best Practices

### 1. Rule Design
- **Keep conditions simple**: Complex logic should be split into multiple rules
- **Use descriptive names**: Rule names should clearly indicate their purpose
- **Document thoroughly**: Include detailed descriptions and examples
- **Test extensively**: Always test rules in a sandbox before activation

### 2. Performance Optimization
- **Limit active rules**: Deactivate unused rules to improve performance
- **Use appropriate priorities**: Higher priority rules should be more specific
- **Cache decisions**: Use TTL-based caching for frequently evaluated rules
- **Index context fields**: Ensure frequently queried fields are indexed

### 3. Maintenance
- **Version control**: Use smart code versioning (v1, v2, etc.)
- **Regular audits**: Review rule usage and effectiveness monthly
- **Conflict resolution**: Implement clear precedence rules for conflicts
- **Deprecation strategy**: Phase out old rules gradually with notices

### 4. Security
- **Principle of least privilege**: Rules should only access necessary data
- **Audit all changes**: Track who modified rules and when
- **Test authorization**: Ensure rules respect organization boundaries
- **Validate inputs**: Sanitize all rule inputs to prevent injection

## Industry Templates

### Salon & Spa
```
HERA.UNIV.CONFIG.SALON.TEMPLATE.v1
├── Booking Rules
│   ├── Advance booking limits (30 days)
│   ├── Minimum notice period (2 hours)
│   ├── Peak hour restrictions
│   └── Double booking prevention
├── Pricing Rules
│   ├── VIP tier discounts (5%, 10%, 15%)
│   ├── Package pricing
│   ├── Peak hour surcharges
│   └── Cancellation fees
└── Notification Rules
    ├── Appointment reminders (24h, 2h)
    ├── Stylist notifications
    └── Review requests
```

### Restaurant
```
HERA.UNIV.CONFIG.RESTAURANT.TEMPLATE.v1
├── Order Rules
│   ├── Minimum order values
│   ├── Delivery radius restrictions
│   ├── Kitchen capacity limits
│   └── Special request handling
├── Pricing Rules
│   ├── Happy hour discounts
│   ├── Loyalty program tiers
│   ├── Bulk order discounts
│   └── Service charges
└── Workflow Rules
    ├── Order approval thresholds
    ├── Inventory depletion alerts
    └── Health compliance checks
```

### Healthcare
```
HERA.UNIV.CONFIG.HEALTHCARE.TEMPLATE.v1
├── Appointment Rules
│   ├── Specialist referral requirements
│   ├── Insurance verification
│   ├── Emergency slot allocation
│   └── Follow-up scheduling
├── Compliance Rules
│   ├── HIPAA consent verification
│   ├── Prescription validation
│   ├── Medical record access
│   └── Billing compliance
└── Workflow Rules
    ├── Lab result notifications
    ├── Prescription renewals
    └── Care coordination
```

## Advanced Features

### 1. Machine Learning Integration
```typescript
// AI-powered rule suggestions
const suggestions = await universalConfigService.suggestRules({
  business_type: 'salon',
  historical_data: last90DaysTransactions,
  optimization_goal: 'maximize_revenue'
})
```

### 2. A/B Testing
```typescript
// Create rule variants for testing
const variant = await universalConfigService.createVariant(rule.id, {
  name: 'Higher VIP Discount Test',
  modifications: {
    actions: [{ 
      type: 'apply_discount',
      target: 'transaction_total',
      value: { discount_percent: 20 } // Test 20% vs 15%
    }]
  },
  traffic_percentage: 50
})
```

### 3. Real-time Analytics
```typescript
// Monitor rule performance
const analytics = await universalConfigService.getRuleAnalytics(rule.id, {
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  metrics: ['execution_count', 'impact_value', 'user_satisfaction']
})
```

## Troubleshooting

### Common Issues

1. **Rules not firing**
   - Check rule status is 'active'
   - Verify context matches all conditions
   - Review rule priority conflicts

2. **Performance degradation**
   - Reduce number of active rules
   - Optimize condition complexity
   - Enable rule caching

3. **Unexpected behavior**
   - Check for conflicting rules
   - Review rule execution logs
   - Test with simplified context

### Debug Mode
```typescript
// Enable debug logging
universalConfigService.enableDebug(true)

// Execute with detailed logging
const result = await universalConfigService.resolve({
  family: 'HERA.UNIV.CONFIG.PRICING.DISCOUNT',
  context: debugContext,
  debug: true
})

console.log(result.debug_info)
```

## Conclusion

HERA's Universal Configuration Rules system provides unprecedented flexibility in managing business logic without code changes. By following the patterns and best practices outlined in this documentation, organizations can create sophisticated rule-based systems that adapt to their evolving needs while maintaining the simplicity and power of HERA's universal architecture.

For additional support, refer to:
- `/src/lib/universal-config/README.md` - Technical implementation details
- `/docs/UCR-API.md` - Complete API reference
- `/examples/ucr/` - Working examples for various industries