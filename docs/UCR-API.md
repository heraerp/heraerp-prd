# UCR API Reference

## Overview

The Universal Configuration Rules API provides programmatic access to create, manage, and execute business rules within the HERA ecosystem.

## Base URL
```
/api/v1/config/rules
```

## Authentication
All API requests require authentication via JWT token with organization context:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Organization-ID': 'org-uuid'
}
```

## Core Endpoints

### 1. Rule Management

#### Create Rule
```http
POST /api/v1/config/rules
```

**Request Body:**
```json
{
  "smart_code": "HERA.UNIV.CONFIG.PRICING.CUSTOM.v1",
  "name": "Custom Pricing Rule",
  "family": "HERA.UNIV.CONFIG.PRICING.DISCOUNT",
  "priority": 100,
  "conditions": [
    {
      "field": "customer_type",
      "operator": "eq",
      "value": "wholesale"
    }
  ],
  "actions": [
    {
      "type": "apply_discount",
      "target": "order_total",
      "value": {
        "discount_percent": 20
      }
    }
  ],
  "status": "active",
  "effective_date": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "id": "rule_uuid",
  "smart_code": "HERA.UNIV.CONFIG.PRICING.CUSTOM.v1",
  "created_at": "2024-01-01T10:00:00Z",
  "created_by": "user_uuid",
  "organization_id": "org_uuid",
  "status": "active"
}
```

#### Get Rule
```http
GET /api/v1/config/rules/:id
```

#### Update Rule
```http
PUT /api/v1/config/rules/:id
```

#### Delete Rule
```http
DELETE /api/v1/config/rules/:id
```

#### List Rules
```http
GET /api/v1/config/rules
```

**Query Parameters:**
- `family`: Filter by rule family
- `status`: Filter by status (active, inactive, draft)
- `category`: Filter by category
- `search`: Search in name and description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### 2. Rule Execution

#### Resolve Rules
Execute all matching rules for a given context:

```http
POST /api/v1/config/rules/resolve
```

**Request Body:**
```json
{
  "family": "HERA.UNIV.CONFIG.PRICING.DISCOUNT",
  "context": {
    "organization_id": "org_uuid",
    "customer_type": "vip",
    "order_total": 500,
    "items_count": 3,
    "temporal": {
      "hour_of_day": 14,
      "day_of_week": 5,
      "is_holiday": false
    }
  },
  "inputs": {
    "original_price": 500
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "rule_id": "rule_uuid_1",
      "rule_name": "VIP Discount",
      "priority": 100,
      "matched": true,
      "actions_executed": [
        {
          "type": "apply_discount",
          "result": {
            "discount_amount": 50,
            "final_price": 450
          }
        }
      ]
    }
  ],
  "summary": {
    "rules_evaluated": 5,
    "rules_matched": 1,
    "execution_time_ms": 23
  }
}
```

#### Make Decision
Get a single decision based on highest priority matching rule:

```http
POST /api/v1/config/rules/decide
```

**Request Body:**
```json
{
  "family": "HERA.UNIV.CONFIG.BOOKING.AVAILABILITY",
  "context": {
    "requested_date": "2024-12-25",
    "service_type": "premium",
    "stylist_id": "stylist_123"
  }
}
```

**Response:**
```json
{
  "decision": "unavailable",
  "reason": "Holiday - salon closed",
  "rule_applied": {
    "id": "rule_uuid",
    "name": "Holiday Closure",
    "smart_code": "HERA.UNIV.CONFIG.BOOKING.HOLIDAY.v1"
  },
  "confidence": 1.0
}
```

### 3. Rule Testing

#### Test Rule
```http
POST /api/v1/config/rules/:id/test
```

**Request Body:**
```json
{
  "context": {
    "customer_type": "vip",
    "order_total": 1000
  },
  "expected_result": {
    "action": "apply_discount",
    "discount_percent": 15
  }
}
```

**Response:**
```json
{
  "test_id": "test_uuid",
  "status": "passed",
  "execution_time_ms": 15,
  "conditions_evaluated": [
    {
      "condition": "customer_type eq vip",
      "result": true,
      "actual_value": "vip"
    }
  ],
  "actions_executed": [
    {
      "action": "apply_discount",
      "result": {
        "discount_percent": 15,
        "discount_amount": 150
      }
    }
  ],
  "matches_expected": true
}
```

#### Validate Rule
Check for conflicts and issues:

```http
POST /api/v1/config/rules/:id/validate
```

**Response:**
```json
{
  "valid": false,
  "issues": [
    {
      "type": "conflict",
      "severity": "warning",
      "message": "Rule conflicts with 'Standard VIP Discount' (priority 150)",
      "conflicting_rule_id": "rule_uuid_2"
    }
  ],
  "suggestions": [
    {
      "type": "priority",
      "message": "Consider setting priority to 250 to avoid conflicts"
    }
  ]
}
```

### 4. Rule Analytics

#### Get Rule Analytics
```http
GET /api/v1/config/rules/:id/analytics
```

**Query Parameters:**
- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `metrics`: Comma-separated list of metrics

**Response:**
```json
{
  "rule_id": "rule_uuid",
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "metrics": {
    "execution_count": 1523,
    "match_rate": 0.72,
    "average_execution_time_ms": 12,
    "total_impact_value": 15230.50,
    "unique_entities_affected": 234
  },
  "daily_breakdown": [
    {
      "date": "2024-01-01",
      "executions": 45,
      "matches": 32,
      "impact_value": 450.00
    }
  ]
}
```

### 5. Rule Templates

#### List Templates
```http
GET /api/v1/config/templates
```

**Query Parameters:**
- `industry`: Filter by industry (salon, restaurant, healthcare)
- `category`: Filter by category

#### Apply Template
```http
POST /api/v1/config/templates/:template_id/apply
```

**Request Body:**
```json
{
  "organization_id": "org_uuid",
  "customizations": {
    "vip_discount_percent": 20,
    "peak_hours_start": 17,
    "peak_hours_end": 21
  }
}
```

## JavaScript/TypeScript SDK

### Installation
```typescript
import { UniversalConfigClient } from '@/lib/universal-config/client'

const ucr = new UniversalConfigClient({
  organizationId: 'org_uuid',
  apiKey: 'your_api_key' // Optional, uses session auth by default
})
```

### Usage Examples

#### Creating Rules
```typescript
const rule = await ucr.createRule({
  name: 'Weekend Special Pricing',
  family: 'HERA.UNIV.CONFIG.PRICING.SPECIAL',
  conditions: [
    { field: 'temporal.is_weekend', operator: 'eq', value: true },
    { field: 'service_category', operator: 'in', value: ['haircut', 'styling'] }
  ],
  actions: [
    { 
      type: 'apply_discount',
      target: 'service_price',
      value: { discount_percent: 15, reason: 'Weekend Special' }
    }
  ]
})
```

#### Resolving Rules
```typescript
const context = {
  customer_id: 'cust_123',
  customer_segments: ['vip_gold'],
  order_items: ['service_001', 'service_002'],
  temporal: {
    is_weekend: true,
    hour_of_day: 14
  }
}

const decisions = await ucr.resolve('HERA.UNIV.CONFIG.PRICING.DISCOUNT', context)

// Apply the decisions
decisions.results.forEach(decision => {
  if (decision.matched) {
    console.log(`Applying ${decision.rule_name}: ${decision.actions_executed}`)
  }
})
```

#### Batch Operations
```typescript
// Create multiple rules at once
const rules = await ucr.batchCreate([
  { name: 'Rule 1', ... },
  { name: 'Rule 2', ... },
  { name: 'Rule 3', ... }
])

// Update multiple rules
const updates = await ucr.batchUpdate([
  { id: 'rule_1', status: 'inactive' },
  { id: 'rule_2', priority: 150 }
])
```

## WebSocket API

For real-time rule updates and monitoring:

```typescript
const ws = new WebSocket('wss://api.heraerp.com/v1/config/rules/stream')

ws.on('connect', () => {
  // Subscribe to rule changes
  ws.send(JSON.stringify({
    action: 'subscribe',
    families: ['HERA.UNIV.CONFIG.PRICING.*'],
    organization_id: 'org_uuid'
  }))
})

ws.on('message', (data) => {
  const event = JSON.parse(data)
  switch (event.type) {
    case 'rule_created':
    case 'rule_updated':
    case 'rule_deleted':
      // Handle rule changes
      break
    case 'execution_event':
      // Monitor rule executions
      break
  }
})
```

## Error Codes

| Code | Description |
|------|-------------|
| `UCR001` | Invalid rule format |
| `UCR002` | Rule not found |
| `UCR003` | Insufficient permissions |
| `UCR004` | Rule conflict detected |
| `UCR005` | Invalid context format |
| `UCR006` | Execution timeout |
| `UCR007` | Template not found |
| `UCR008` | Invalid operator |
| `UCR009` | Circular dependency detected |
| `UCR010` | Rate limit exceeded |

## Rate Limits

- **Rule Creation**: 100 per hour per organization
- **Rule Execution**: 10,000 per hour per organization
- **Analytics Queries**: 1,000 per hour per organization
- **Batch Operations**: 10 per minute per organization

## Best Practices

1. **Use Batch APIs** for bulk operations to reduce API calls
2. **Cache Rule Results** when context doesn't change frequently
3. **Subscribe to WebSocket** for real-time updates instead of polling
4. **Use Rule Families** to organize and query rules efficiently
5. **Implement Retry Logic** with exponential backoff for failed requests
6. **Monitor Rate Limits** using response headers
7. **Version Your Rules** using smart code versioning (v1, v2, etc.)

## Migration Guide

### From Hard-Coded Rules
```typescript
// Before: Hard-coded in application
if (customer.type === 'vip' && order.total > 100) {
  order.discount = order.total * 0.1
}

// After: UCR rule
await ucr.createRule({
  name: 'VIP Order Discount',
  conditions: [
    { field: 'customer_type', operator: 'eq', value: 'vip' },
    { field: 'order_total', operator: 'gt', value: 100 }
  ],
  actions: [
    { type: 'apply_discount', target: 'order', value: { percent: 10 } }
  ]
})
```

### From Other Rule Engines
UCR provides import utilities for common rule engine formats:
```typescript
// Import from Drools
const rules = await ucr.import.fromDrools(droolsRuleFile)

// Import from JSON Rules Engine
const rules = await ucr.import.fromJsonRules(jsonRules)

// Import from custom format
const rules = await ucr.import.custom(data, mappingFunction)
```