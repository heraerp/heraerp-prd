# HERA Ledger Engine - 7-Day Rollout Runbook

## Overview

This runbook guides you through deploying the HERA Ledger Engine from development to production in 7 days or less.

## Day 1: Environment Setup

### 1.1 Database Preparation
```sql
-- Verify 6-table schema exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'core_organizations',
  'core_entities', 
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
);
```

### 1.2 Create Organization
```sql
INSERT INTO core_organizations (name, code, smart_code, status)
VALUES ('Your Business', 'YOURBIZ', 'HERA.ORG.YOURBIZ.v1', 'active')
RETURNING id; -- Save this as ORG_ID
```

### 1.3 Deploy Edge Functions
- Deploy `/ledger/simulate` endpoint
- Deploy `/ledger/post` endpoint
- Configure environment variables

## Day 2: Chart of Accounts

### 2.1 Create GL Accounts
```bash
# Use MCP tools or direct SQL to create accounts
# Required accounts:
# - 4100 Sales Revenue (Credit)
# - 2200 Tax Payable (Credit)  
# - 2300 Tips Payable (Credit)
# - 1100 Card Clearing (Debit)
# - 5500 Payment Fees (Debit)
```

### 2.2 Query Account IDs
```sql
SELECT id, entity_code, entity_name 
FROM core_entities
WHERE entity_type = 'account'
AND organization_id = :org
AND business_rules->>'is_postable' = 'true'
ORDER BY entity_code;
```

## Day 3: Posting Schema Configuration

### 3.1 Prepare DSL JSON
Create `posting-schema.json`:
```json
{
  "ledgers": ["GL"],
  "accounts": {
    "revenue": "[UUID from 4100]",
    "tax_output": "[UUID from 2200]",
    "tips_payable": "[UUID from 2300]",
    "clearing": "[UUID from 1100]",
    "fees": "[UUID from 5500]"
  },
  "tax": {
    "profile_ref": "[Will be set in Day 4]",
    "inclusive_prices": true,
    "rounding": "line"
  },
  "splits": {
    "dimensions": ["org_unit", "staff_id"],
    "rules": [{
      "event_pattern": "HERA\\\\.POS\\\\..*",
      "split_by": "staff_id",
      "allocation_method": "proportional"
    }]
  },
  "dimension_requirements": [{
    "account_pattern": "^4.*",
    "required_dimensions": ["org_unit", "staff_id"],
    "enforcement": "error"
  }],
  "payments": {
    "capture_type": "immediate",
    "open_item": false
  }
}
```

### 3.2 Apply Posting Schema
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=hera
export DB_USER=postgres
export ORG_ID="your-org-uuid"
export DSL_JSON="./posting-schema.json"

./scripts/seed.sh
# Note the posting_schema_id from output
```

## Day 4: Tax Configuration

### 4.1 Create Tax Profile
```bash
export PROFILE_NAME="Standard Tax Profile"
./scripts/seed.sh
# Creates tax profile with placeholder 5% rate
```

### 4.2 Get IDs and Create Bindings
```sql
-- Get posting schema ID
SELECT id FROM core_entities 
WHERE smart_code = 'HERA.POS.POSTING.SCHEMA.v1' 
AND organization_id = :org;

-- Get tax profile ID  
SELECT id FROM core_entities
WHERE smart_code = 'HERA.TAX.PROFILE.V1'
AND organization_id = :org;

-- Export these for binding
export SCHEMA_ID="posting-schema-uuid"
export TAX_PROFILE_ID="tax-profile-uuid"
./scripts/seed.sh
```

## Day 5: Integration Testing

### 5.1 SDK Integration Test
```typescript
import { createLedgerClient } from '@hera/sdk';

const client = createLedgerClient({
  baseUrl: 'http://localhost:3000',
  organizationId: process.env.ORG_ID,
  apiKey: process.env.API_KEY
});

// Test simulation
const sim = await client.simulate({
  organization_id: process.env.ORG_ID,
  event_smart_code: 'HERA.POS.SALE.V1',
  total_amount: 105.00,
  currency: 'USD',
  business_context: {
    sale_amount: 100.00,
    tip_amount: 5.00,
    org_unit: 'BR-01',
    staff_id: 'EMP-001'
  }
});

console.log('Simulation result:', sim);
```

### 5.2 MCP Integration Test
```bash
# Test MCP can resolve schemas
curl -X POST http://localhost:3000/mcp/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "event_smart_code": "HERA.POS.SALE.V1",
    "organization_id": "'$ORG_ID'"
  }'
```

### 5.3 Run UAT Suite
```bash
# Run all UAT scenarios
pnpm test hera/engine/tests/uat.spec.ts

# Verify results
- [ ] Balanced journals
- [ ] Correct tax calculations
- [ ] Dimensions present
- [ ] Idempotency working
```

## Day 6: Go-Live Preparation

### 6.1 Production Checklist
- [ ] Edge functions deployed to production
- [ ] Database migrations applied
- [ ] Accounts created with correct IDs
- [ ] Posting schema configured
- [ ] Tax profile bound
- [ ] API keys generated
- [ ] Monitoring configured

### 6.2 Flip to Production Mode
```typescript
// Change SDK configuration
const client = createLedgerClient({
  baseUrl: 'https://api.production.com',
  organizationId: PROD_ORG_ID,
  apiKey: PROD_API_KEY,
  retry: {
    maxAttempts: 5,
    baseDelayMs: 1000
  },
  idempotency: {
    storage: 'local', // Persistent storage
    prefix: 'prod:hera:'
  }
});
```

### 6.3 Idempotency Strategy
```typescript
// For POS systems
const externalRef = `POS-${terminalId}-${transactionNumber}`;

// For settlements
const externalRef = `SETTLE-${providerId}-${date}-${lineNumber}`;

// For e-commerce
const externalRef = `WEB-${orderId}`;
```

## Day 7: Production Rollout

### 7.1 Pilot Transaction
```typescript
// Post first production transaction
const result = await client.postWithIdempotency({
  organization_id: PROD_ORG_ID,
  event_smart_code: 'HERA.POS.SALE.V1',
  total_amount: 10.50,
  currency: 'USD',
  external_reference: 'PILOT-001',
  business_context: {
    sale_amount: 10.00,
    tax_amount: 0.50,
    org_unit: 'MAIN',
    staff_id: 'SYSTEM',
    notes: 'First production transaction'
  }
});

console.log('Production transaction:', result);
```

### 7.2 Verify in Database
```sql
-- Check transaction created
SELECT * FROM universal_transactions
WHERE smart_code = 'HERA.POS.SALE.V1'
AND organization_id = :prod_org_id
ORDER BY created_at DESC
LIMIT 1;

-- Check lines balance
SELECT 
  line_type,
  SUM(line_amount) as total
FROM universal_transaction_lines
WHERE transaction_id = :txn_id
GROUP BY line_type;
```

### 7.3 Monitor and Scale
```bash
# Monitor logs
tail -f /var/log/hera/ledger.log

# Check metrics
curl http://localhost:9090/metrics | grep hera_ledger

# Scale if needed
kubectl scale deployment ledger-engine --replicas=3
```

## Post-Rollout

### Week 1 Tasks
- [ ] Monitor error rates (target < 0.1%)
- [ ] Review dimension compliance
- [ ] Validate tax calculations
- [ ] Check idempotency hit rate
- [ ] Tune retry settings

### Month 1 Goals
- [ ] Process 10,000+ transactions
- [ ] Add settlement automation
- [ ] Implement reporting views
- [ ] Train finance team
- [ ] Document custom workflows

## Troubleshooting

### Common Issues

**Schema Not Found**
```bash
# Check binding exists
SELECT * FROM core_relationships
WHERE relationship_type = 'applies_to'
AND metadata->>'event_smart_code' = 'HERA.POS.SALE.V1';
```

**Unbalanced Journals**
```bash
# Check tax profile configuration
SELECT * FROM core_dynamic_data
WHERE entity_id = :tax_profile_id
AND field_name LIKE 'rate.%';
```

**Missing Dimensions**
```bash
# Verify dimension requirements
SELECT business_rules->'dimension_requirements'
FROM core_entities
WHERE smart_code = 'HERA.POS.POSTING.SCHEMA.v1';
```

## Support Contacts

- Technical Issues: hera-support@example.com
- Business Questions: hera-business@example.com
- Emergency: +1-555-HERA-911

## Appendix: Quick Commands

```bash
# Apply all seeds
./scripts/seed.sh

# Test simulation
curl -X POST http://localhost:3000/ledger/simulate \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Check transaction
psql -c "SELECT * FROM universal_transactions WHERE external_reference = 'TEST-001'"

# View logs
docker logs -f hera-ledger-engine

# Restart services
docker-compose restart ledger-engine
```

---

**Remember**: The goal is working software in production. Start simple, validate each step, and scale based on actual usage patterns.