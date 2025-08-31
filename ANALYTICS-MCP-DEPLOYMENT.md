# HERA Analytics MCP - The Analytical Brain 🧠

## Overview

HERA Analytics MCP is a strict, guardrail-enforced analytical engine that operates exclusively on HERA's 6-table architecture. It provides enterprise-grade business intelligence with zero schema violations.

## Key Features

### 🛡️ Strict Guardrails
- **ORG_FILTER_MISSING**: Organization ID required for ALL queries
- **SMART_CODE_INVALID**: Only validated smart codes allowed
- **GL_UNBALANCED**: Debits must equal credits for GL transactions
- **TABLE_VIOLATION**: Only 6 sacred tables exist
- **FANOUT_VIOLATION**: Relationship depth limited to 2
- **PRIVACY_VIOLATION**: PII/PHI automatically anonymized

### 📊 Analytical Capabilities

#### 1. **Smart Code Intelligence**
```javascript
// Search for codes
search_smart_codes({
  organization_id: "xxx",
  search_text: "refund",
  industry: "RETAIL"
})

// Validate and auto-upgrade
validate_smart_code({
  organization_id: "xxx",
  smart_code: "HERA.RETAIL.REFUND.ISSUED.v1"
})
// Returns: { valid: true, latest_version: 2, upgrade_available: true }
```

#### 2. **Aggregation-First Queries**
```javascript
query_transactions({
  organization_id: "xxx",
  smart_code: "HERA.RETAIL.SALE.COMPLETED.v2",
  time: { 
    start: "2025-08-01", 
    end: "2025-08-31", 
    grain: "week" 
  },
  group_by: ["region", "product_category"],
  metrics: ["count", "sum.amount", "avg.amount"],
  limit: 500
})
```

#### 3. **Entity Analysis**
```javascript
query_entities({
  organization_id: "xxx",
  entity_type: "customer",
  filters: { 
    loyalty_tier: "platinum",
    total_spend: { gte: 5000 }
  },
  select: ["entity_name", "total_spend", "last_purchase"],
  limit: 50
})
```

#### 4. **Relationship Traversal**
```javascript
search_relationships({
  organization_id: "xxx",
  from_entity_id: "customer-123",
  relationship_type: "purchased_from",
  direction: "outgoing",
  depth: 2
})
```

#### 5. **Balanced Transaction Posting**
```javascript
post_transaction({
  organization_id: "xxx",
  transaction_code: "HERA.ACCOUNTING.GL.ADJUSTMENT.v1",
  header: { 
    posting_date: "2025-08-29",
    description: "Inventory adjustment"
  },
  lines: [
    { line_type: "debit", line_amount: 1000, account: "5000" },
    { line_type: "credit", line_amount: 1000, account: "1300" }
  ]
})
```

## Deployment Instructions

### 1. Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  
ANTHROPIC_API_KEY=your-claude-api-key

# Organization
DEFAULT_ORGANIZATION_ID=550e8400-e29b-41d4-a716-446655440000
```

### 2. Database Requirements
- Supabase with HERA's 6-table schema
- Smart code registry populated
- Organization data isolated
- RLS policies enforced

### 3. Start Analytics MCP Server
```bash
cd mcp-server
node hera-analytics-mcp-server.js
```

### 4. Access Analytics Chat
- Development: http://localhost:3000/analytics-chat
- Production: https://your-domain.com/analytics-chat

## Example Queries

### Revenue Analysis
```
"Why did refunds spike in August?"
→ Searches HERA.RETAIL.REFUND.ISSUED.v2
→ Aggregates by week and reason_code
→ Identifies carrier delays caused 42% spike
```

### Customer Insights
```
"Show top wholesale customers by margin last 90 days"
→ Queries entities with channel='wholesale'
→ Joins transactions for margin calculation
→ Returns ranked list with actionable insights
```

### Financial Posting
```
"Post inventory write-off for batch B-923"
→ Validates GL smart codes
→ Creates balanced journal entry
→ Ensures audit trail compliance
```

## Architecture Principles

### 1. **Smart Code First**
Every analysis starts with smart code validation. Invalid codes are rejected with suggestions.

### 2. **Aggregation Default**
Raw data queries limited to 50 rows. Aggregations handle millions of records efficiently.

### 3. **Time-Bounded**
Queries without time bounds default to last 30 days to prevent unbounded scans.

### 4. **Privacy Protected**
PII/PHI fields automatically excluded from results unless explicitly authorized.

### 5. **Guardrail Enforced**
Every query passes through 6 guardrail checks before execution.

## Error Handling

### Common Errors and Fixes

```javascript
// ORG_FILTER_MISSING
❌ { entity_type: "customer" }
✅ { organization_id: "xxx", entity_type: "customer" }

// SMART_CODE_INVALID  
❌ { smart_code: "CUSTOM.CODE" }
✅ { smart_code: "HERA.RETAIL.CUSTOMER.PROFILE.v1" }

// GL_UNBALANCED
❌ Debits: 1000, Credits: 900
✅ Debits: 1000, Credits: 1000

// TABLE_VIOLATION
❌ FROM custom_reports
✅ FROM universal_transactions

// FANOUT_VIOLATION
❌ depth: 5
✅ depth: 2
```

## Performance Optimization

### 1. **Index Usage**
- organization_id + smart_code
- transaction_date + transaction_type
- entity_type + status

### 2. **Caching Strategy**
- Smart code validations: 1 hour
- Aggregated results: 15 minutes
- Entity lookups: 5 minutes

### 3. **Query Limits**
- Raw queries: 50 rows max
- Aggregations: 1000 groups max
- Relationships: depth 2, 100 edges max

## Monitoring

### Key Metrics
- Query response time < 2 seconds
- Smart code cache hit rate > 90%
- Guardrail violations < 5%
- Aggregation usage > 80%

### Alerts
- Response time > 5 seconds
- Memory usage > 80%
- Error rate > 1%
- Invalid smart code attempts > 10/minute

## Security

### Multi-Layer Protection
1. **Organization isolation**: Queries filtered by org_id
2. **Smart code validation**: Only approved codes execute
3. **Schema protection**: 6-table limitation enforced
4. **Data anonymization**: PII/PHI automatically masked
5. **Audit logging**: Every query logged with context

## Future Enhancements

### Planned Features
- Predictive analytics with ML models
- Natural language to SQL generation
- Real-time streaming analytics
- Custom KPI dashboards
- Anomaly detection alerts

### Integration Roadmap
- Power BI connector
- Tableau integration  
- Slack/Teams notifications
- Email report scheduling
- API webhook triggers

---

## Success Criteria

After deployment, verify:
- ✅ All queries respect organization boundaries
- ✅ Smart codes validate before execution
- ✅ GL transactions balance automatically
- ✅ Aggregations return within 2 seconds
- ✅ Guardrails prevent schema violations

The HERA Analytics MCP transforms natural language into validated, efficient queries while maintaining strict architectural compliance. No exceptions, no violations, pure analytical power. 🧠