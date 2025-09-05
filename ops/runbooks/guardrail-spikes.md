# Runbook: Guardrail Spikes

## Overview
This runbook addresses sudden increases in guardrail blocks, which may indicate data quality issues or API misuse.

## Symptoms
- Alert: `GuardrailBlockRate` > 100/min for 5 minutes
- Dashboard: Spike in "HERA Guardrail Health" → "Guardrail Blocks (24h)"
- Users reporting API errors with guardrail messages

## Impact
- API requests being rejected
- Data not being saved
- User frustration

## Detection
```bash
# Check current block rate
curl -s http://localhost:9090/api/v1/query \
  -d 'query=sum(rate(hera_guardrail_blocks_total[5m]))'

# Top blocking reasons
curl -s http://localhost:9090/api/v1/query \
  -d 'query=topk(10, sum(hera_guardrail_blocks_total) by (reason))'

# Affected organizations
curl -s http://localhost:9090/api/v1/query \
  -d 'query=topk(10, sum(rate(hera_guardrail_blocks_total[5m])) by (organization_id))'
```

## Root Causes
1. **Missing Required Fields** - Client not sending organization_id or smart_code
2. **Schema Mismatch** - Client using outdated API schema
3. **Malformed Payloads** - Invalid JSON or incorrect data types
4. **Permission Issues** - User lacks required permissions
5. **Rate Limiting** - Organization exceeding quotas

## Resolution Steps

### 1. Identify Pattern (2 min)
```sql
-- Recent guardrail blocks
SELECT 
  metadata->>'reason' as reason,
  metadata->>'table_name' as table_name,
  COUNT(*) as count
FROM universal_transactions
WHERE transaction_type = 'guardrail_block'
  AND transaction_date > NOW() - INTERVAL '15 minutes'
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 10;
```

### 2. Check Auto-Fix Success (1 min)
```sql
-- Auto-fix effectiveness
SELECT 
  metadata->>'table_name' as table_name,
  metadata->>'fixes_applied' as fixes,
  COUNT(*) as count
FROM universal_transactions
WHERE transaction_type = 'guardrail_autofix'
  AND transaction_date > NOW() - INTERVAL '15 minutes'
GROUP BY 1, 2;
```

### 3. Enable Strict Mode (if needed)
```bash
# For specific organization
curl -X POST http://localhost:3000/api/v1/config/guardrails \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "organization_id": "affected-org-id",
    "mode": "strict",
    "autofix_enabled": false
  }'
```

### 4. Update Client Integration
```javascript
// Ensure clients include required fields
const payload = {
  ...data,
  organization_id: currentOrg.id,  // REQUIRED
  smart_code: generateSmartCode(data.type),  // REQUIRED
  created_at: new Date().toISOString()  // REQUIRED
};
```

### 5. Deploy Hot Fix
If widespread issue:
```yaml
# config/guardrails/emergency-fix.yaml
table: core_entities
fixes:
  - field: organization_id
    when: missing
    action: inject_from_context
  - field: smart_code
    when: missing
    action: generate_from_type
```

## Verification
```bash
# Block rate should decrease
watch -n 5 'curl -s http://localhost:9090/api/v1/query \
  -d "query=sum(rate(hera_guardrail_blocks_total[1m]))" | jq .data.result[0].value[1]'

# Auto-fix rate should increase
watch -n 5 'curl -s http://localhost:9090/api/v1/query \
  -d "query=sum(rate(hera_guardrail_autofix_total[1m]))" | jq .data.result[0].value[1]'
```

## Escalation
1. **L1** - If block rate > 1000/min → Page on-call
2. **L2** - If affecting > 10 organizations → Engineering lead
3. **L3** - If data corruption risk → CTO + Database team

## Prevention
1. Contract testing in CI/CD
2. API version deprecation notices
3. Client SDK auto-updates
4. Guardrail policy reviews
5. Regular schema validation

## Related
- [API Governance](./api-governance.md)
- [Schema Evolution](./schema-evolution.md)
- [Client Integration Guide](../docs/client-integration.md)