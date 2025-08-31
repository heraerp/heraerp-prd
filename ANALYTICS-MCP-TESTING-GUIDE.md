# HERA Analytics MCP Testing Guide 🧪

## Overview

This guide explains how to thoroughly test the HERA Analytics MCP server, including all guardrails, tools, and analytical capabilities.

## Testing Setup

### 1. Prerequisites
```bash
# Ensure environment variables are set
cat .env | grep -E "SUPABASE|ANTHROPIC|ORGANIZATION"

# Install dependencies
cd mcp-server
npm install
```

### 2. Start Services

#### Option A: Test MCP Server Directly
```bash
# Terminal 1: Start Analytics MCP Server
cd mcp-server
node hera-analytics-mcp-server.js

# Terminal 2: Run tests
cd mcp-server
node test-analytics-mcp.js        # Database connectivity tests
node test-analytics-tools.js      # Tool implementation tests
```

#### Option B: Test via Web API
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Run API tests
cd mcp-server
node demo-analytics-chat.js       # Natural language tests
```

## Test Suites

### 1. **Database Connectivity Test** (`test-analytics-mcp.js`)

Tests basic database operations and schema compliance:

```bash
node test-analytics-mcp.js
```

Expected output:
```
━━━ Smart Code Search Tests ━━━
✓ Smart codes exist in organization
✓ Smart code format validation

━━━ Entity Query Tests ━━━
✓ Basic entity query
✓ Entity with dynamic data expansion
✓ Entity type filter: customer

━━━ Transaction Query Tests ━━━
✓ Basic transaction query
✓ Time-based transaction filter
✓ Transaction aggregation

━━━ Test Summary ━━━
Total Tests: 25
Passed: 25
Failed: 0
Success Rate: 100.0%
```

### 2. **MCP Tool Test** (`test-analytics-tools.js`)

Tests each MCP tool implementation:

```bash
node test-analytics-tools.js
```

This tests:
- ✅ Smart code search and validation
- ✅ Entity queries with dynamic data
- ✅ Transaction aggregation
- ✅ Relationship traversal
- ✅ Balanced transaction posting
- ❌ Guardrail violations (expected errors)

### 3. **API Integration Test** (`demo-analytics-chat.js`)

Tests the complete flow from natural language to results:

```bash
# Make sure Next.js is running first
node demo-analytics-chat.js
```

## Manual Testing Scenarios

### 1. **Smart Code Validation**

#### Test Valid Code
```javascript
// In analytics chat
"Validate smart code HERA.SALON.CLIENT.PROFILE.v1"

// Expected: Valid, shows version info
```

#### Test Invalid Code
```javascript
"Use smart code CUSTOM.INVALID.CODE"

// Expected: SMART_CODE_INVALID guardrail triggered
// Suggests using search_smart_codes
```

#### Test Version Upgrade
```javascript
"Check if HERA.SALES.ORDER.v1 needs upgrade"

// Expected: Shows v2 available, suggests upgrade
```

### 2. **Guardrail Testing**

#### Organization ID Missing
```javascript
// Direct tool call without org_id
{
  "tool": "query_entities",
  "args": {
    "entity_type": "customer"
  }
}

// Expected: ORG_FILTER_MISSING error
```

#### GL Unbalanced
```javascript
"Post journal entry with debit 1000 credit 900"

// Expected: GL_UNBALANCED error
// Message: "Debits: 1000, Credits: 900. Adjust lines."
```

#### Table Violation
```javascript
"Query the custom_reports table"

// Expected: TABLE_VIOLATION error
// Message: "Only sacred 6 tables allowed"
```

#### Fanout Violation
```javascript
"Show all relationships up to 5 levels deep"

// Expected: FANOUT_VIOLATION error
// Message: "Set depth to 1 or 2"
```

### 3. **Analytical Queries**

#### Revenue Analysis
```javascript
"Why did revenue spike in August?"

// Expected flow:
1. search_smart_codes("revenue", "SALES")
2. validate_smart_code("HERA.SALES.ORDER.COMPLETED.v2")
3. query_transactions with time.grain = "week"
4. Returns aggregated data with insights
```

#### Customer Segmentation
```javascript
"Find VIP customers with spend over $5000"

// Expected flow:
1. query_entities(entity_type: "customer")
2. Filter by dynamic field total_spend > 5000
3. Returns customer list with metrics
```

#### Trend Analysis
```javascript
"Show service popularity trends last 3 months"

// Expected flow:
1. query_transactions with group_by: ["service_type", "month"]
2. Calculate metrics: count, sum, avg
3. Returns trend data with visualization hints
```

### 4. **Error Recovery**

Test how the system handles and recovers from errors:

```javascript
// Typo in query
"Show reveneu last mont"

// Expected: AI understands intent, corrects to "revenue last month"

// Ambiguous time period
"Show sales recently"

// Expected: Defaults to last 30 days, notes assumption

// Missing context
"Show top customers"

// Expected: Asks "Top by what metric? Revenue, visit count, or lifetime value?"
```

## Performance Testing

### 1. **Load Test Aggregations**
```javascript
// Large date range
"Analyze all transactions for the past year grouped by day"

// Expected: Completes in <2 seconds with daily aggregations
```

### 2. **Complex Queries**
```javascript
"Compare revenue by service type and staff member this vs last month"

// Expected: Multi-dimensional aggregation completes in <3 seconds
```

### 3. **Relationship Traversal**
```javascript
"Show all customers and their purchase patterns"

// Expected: Depth-limited traversal prevents exponential queries
```

## Integration Testing

### 1. **With Salon MCP**
```bash
# Terminal 1: Analytics MCP
node hera-analytics-mcp-server.js

# Terminal 2: Salon MCP
SALON_PORT=3006 node hera-mcp-salon-magic.js

# Test cross-references
"Analyze salon revenue patterns"
"Which VIP clients contribute most revenue?"
```

### 2. **With Production Data**
```javascript
// Test with real organization data
const PROD_ORG_ID = 'your-production-org-id';

// Verify isolation
"Show revenue for organization ABC"  // Should fail if not your org
"Show my organization's revenue"     // Should succeed
```

## Debugging

### Enable Verbose Logging
```javascript
// In hera-analytics-mcp-server.js
console.error('Query:', JSON.stringify(args, null, 2));
console.error('Result:', JSON.stringify(result, null, 2));
```

### Check Guardrails
```bash
# Test each guardrail individually
node -e "
const server = require('./hera-analytics-mcp-server');
const s = new server();
console.log(s.identifyGuardrail('Organization ID is required'));
"
```

### Validate Database Schema
```bash
# Check if all tables exist
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

['core_organizations', 'core_entities', 'core_dynamic_data', 
 'core_relationships', 'universal_transactions', 'universal_transaction_lines']
.forEach(async table => {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  console.log(table + ':', count, 'records');
});
"
```

## Expected Test Results

### ✅ All Tests Pass
- Smart codes validated correctly
- Queries return expected data
- Aggregations compute accurately
- Guardrails prevent violations
- Errors return helpful corrections

### ⚠️ Common Issues

1. **"No smart codes found"**
   - Solution: Run `node setup-salon-data.js` to create test data

2. **"Connection refused"**
   - Solution: Check Supabase credentials in .env

3. **"Guardrail not triggered"**
   - Solution: Ensure test includes organization_id when testing other guardrails

4. **"Aggregation returns empty"**
   - Solution: Create test transactions with dates in query range

## Production Readiness Checklist

- [ ] All guardrails trigger correctly
- [ ] Smart code validation works
- [ ] Aggregations complete in <2 seconds
- [ ] Error messages suggest corrections
- [ ] Organization isolation verified
- [ ] GL balance enforcement works
- [ ] Relationship depth limited
- [ ] Natural language queries understood
- [ ] Results format correctly for UI
- [ ] Performance acceptable under load

## Summary

The Analytics MCP testing ensures:
1. **Architectural Compliance** - Only 6 tables used
2. **Security** - Organization isolation enforced
3. **Data Integrity** - GL balances, valid codes
4. **Performance** - Fast aggregations
5. **Usability** - Natural language understood

Run all test suites to verify the analytical brain is working correctly! 🧠