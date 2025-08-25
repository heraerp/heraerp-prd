# MCP Wiring Documentation

## Overview

The Model Context Protocol (MCP) orchestrates the ledger posting flow by resolving posting schemas, tax profiles, and calling the appropriate edge functions.

## Architecture Flow

```
Event (POS Sale) 
  → MCP reads playbook.posting.json
  → Finds posting schema via 'applies_to' relationship
  → Finds tax profile via 'uses_tax_profile' relationship
  → Calls /ledger/simulate or /ledger/post
  → Returns journal entries
```

## Schema Resolution

### Step 1: Event to Posting Schema

MCP queries for posting schema:
```sql
SELECT 
    ps.id,
    ps.business_rules as posting_dsl
FROM core_relationships r
JOIN core_entities ps ON r.from_entity_id = ps.id
WHERE r.relationship_type = 'applies_to'
AND r.metadata->>'event_smart_code' = 'HERA.POS.SALE.V1'
AND r.organization_id = :org
AND r.status = 'active'
ORDER BY r.metadata->>'priority' DESC
LIMIT 1;
```

### Step 2: Posting Schema to Tax Profile

MCP finds linked tax profile:
```sql
SELECT 
    tp.id,
    tp.business_rules as tax_config
FROM core_relationships r
JOIN core_entities tp ON r.to_entity_id = tp.id
WHERE r.from_entity_id = :posting_schema_id
AND r.relationship_type = 'uses_tax_profile'
AND r.organization_id = :org
AND r.status = 'active'
LIMIT 1;
```

### Step 3: Tax Profile Rates

MCP loads tax rates:
```sql
SELECT 
    field_name,
    field_value_number,
    metadata
FROM core_dynamic_data
WHERE entity_id = :tax_profile_id
AND field_name LIKE 'rate.%'
AND organization_id = :org;
```

## Edge Function Calls

### Simulate Endpoint

**Purpose**: Preview journal entries without database writes

```typescript
POST /ledger/simulate
{
  "organization_id": "org-123",
  "event_smart_code": "HERA.POS.SALE.V1",
  "total_amount": 105.00,
  "currency": "USD",
  "business_context": {
    // Event-specific data
  }
}
```

**MCP Enhancement**: Adds resolved posting schema and tax profile to internal context

### Post Endpoint

**Purpose**: Create journal entries with idempotency

```typescript
POST /ledger/post
{
  "organization_id": "org-123",
  "event_smart_code": "HERA.POS.SALE.V1",
  "total_amount": 105.00,
  "currency": "USD",
  "external_reference": "POS-TERM-001-TXN-12345",
  "business_context": {
    // Event-specific data
  }
}
```

**Returns**: `{ transaction_id: "uuid" }` or idempotent response

## Business Context Traceability

MCP recommends including these fields in business_context for audit trails:

### Point of Sale
```json
{
  "orderId": "ORD-2025-001",
  "terminalTxnId": "TERM-001-TXN-12345",
  "terminalId": "POS-TERM-001",
  "cashierId": "EMP-123",
  "shiftId": "SHIFT-2025-01-08-AM",
  "receiptNumber": "R-2025-001234"
}
```

### Payment Settlement
```json
{
  "settlementFileId": "SETTLE-2025-01-08-001",
  "providerId": "PROVIDER-VISA",
  "batchId": "BATCH-123456",
  "merchantId": "MID-789",
  "settlementDate": "2025-01-08"
}
```

### E-commerce
```json
{
  "orderId": "WEB-ORDER-123",
  "customerId": "CUST-456",
  "sessionId": "SESSION-789",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## Logging Strategy

MCP should log at these points:

1. **Event Receipt**
   ```
   INFO: Processing event HERA.POS.SALE.V1 for org-123
   ```

2. **Schema Resolution**
   ```
   DEBUG: Found posting schema ps-456 via 'applies_to'
   DEBUG: Found tax profile tp-789 via 'uses_tax_profile'
   ```

3. **Edge Function Call**
   ```
   INFO: Calling /ledger/simulate with 4 line items
   ```

4. **Success/Failure**
   ```
   INFO: Created transaction txn-abc-123
   ERROR: Failed with E_UNBALANCED - debits: 100, credits: 95
   ```

## Error Handling

### Schema Not Found
```json
{
  "code": "E_SCHEMA",
  "message": "No posting schema found for event HERA.POS.SALE.V1",
  "hint": "Ensure posting schema is bound via 'applies_to' relationship"
}
```

### Tax Profile Missing
```json
{
  "code": "E_TAX_PROFILE",
  "message": "No tax profile bound to posting schema",
  "hint": "Bind tax profile using 'uses_tax_profile' relationship"
}
```

### Dimension Validation
```json
{
  "code": "E_DIM_MISSING",
  "message": "Required dimensions missing",
  "details": {
    "required": ["org_unit", "staff_id"],
    "provided": ["org_unit"]
  }
}
```

## Performance Optimization

1. **Cache Posting Schemas** - TTL 5 minutes (from playbook)
2. **Batch Similar Events** - Group by event_smart_code
3. **Pre-validate Dimensions** - Check before calling edge function
4. **Connection Pooling** - Reuse database connections

## Testing MCP Integration

### 1. Unit Test Schema Resolution
```typescript
const schema = await mcp.resolvePostingSchema('HERA.POS.SALE.V1', 'org-123');
expect(schema).toBeDefined();
expect(schema.accounts.revenue).toBeUuid();
```

### 2. Integration Test Full Flow
```typescript
const result = await mcp.processEvent({
  event_smart_code: 'HERA.POS.SALE.V1',
  organization_id: 'org-123',
  total_amount: 100,
  business_context: { /* ... */ }
});
expect(result.transaction_id).toBeUuid();
```

### 3. Verify Idempotency
```typescript
const result1 = await mcp.processEvent(event);
const result2 = await mcp.processEvent(event); // Same external_reference
expect(result2.meta.idempotent).toBe(true);
expect(result2.transaction_id).toBe(result1.transaction_id);
```

## MCP Configuration

Environment variables:
```bash
MCP_CACHE_TTL=300              # Schema cache TTL in seconds
MCP_LOG_LEVEL=info             # debug|info|warn|error
MCP_RETRY_ATTEMPTS=3           # Edge function retry attempts
MCP_TIMEOUT_MS=30000           # Request timeout
```

## Security Considerations

1. **Always validate organization_id** - Never trust client-provided org
2. **Sanitize business_context** - Prevent injection attacks
3. **Rate limit by organization** - Prevent abuse
4. **Audit all posts** - Log who, what, when, where
5. **Encrypt sensitive data** - PII in business_context