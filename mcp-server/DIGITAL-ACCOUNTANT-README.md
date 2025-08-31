# HERA Digital Accountant MCP Server

The HERA Digital Accountant MCP provides enterprise-grade accounting automation with natural language processing capabilities, enabling users to post journals, create invoices, reconcile accounts, and generate financial reports through conversational AI.

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd mcp-server
npm install

# 2. Start the MCP server
npm start

# 3. The Digital Accountant tools are now available!
```

## 🛠️ Available Tools

### Core Accounting Operations
- **`create-journal-entry`** - Create general journal entries
- **`post-transaction`** - Post draft transactions to the ledger
- **`reverse-transaction`** - Create reversing entries
- **`create-batch-journal`** - Process multiple journal entries

### Financial Transactions
- **`create-invoice`** - Generate customer invoices
- **`record-payment`** - Apply customer payments
- **`reconcile-bank`** - Auto-match bank transactions
- **`calculate-vat`** - Compute VAT for periods

### Reporting & Analysis
- **`generate-financial-report`** - P&L, Balance Sheet, Cash Flow
- **`check-compliance`** - Period status and compliance checks
- **`query-accounting`** - Natural language GL queries

## 📋 Tool Usage Examples

### Create Journal Entry
```javascript
{
  "tool": "create-journal-entry",
  "parameters": {
    "organization_id": "550e8400-e29b-41d4-a716-446655440000",
    "smart_code": "HERA.FIN.GL.TXN.JE.GENERAL.v1",
    "date": "2025-08-29",
    "reference": "ACCR-001",
    "status": "draft",
    "lines": [
      {
        "account_code": "6000",
        "account_name": "Marketing Expenses",
        "debit": 12000,
        "credit": 0,
        "memo": "August marketing accrual"
      },
      {
        "account_code": "2100",
        "account_name": "Accrued Expenses",
        "debit": 0,
        "credit": 12000,
        "memo": "August marketing accrual"
      }
    ]
  }
}
```

### Natural Language Query
```javascript
{
  "tool": "query-accounting",
  "parameters": {
    "organization_id": "550e8400-e29b-41d4-a716-446655440000",
    "query": "Post a journal to accrue $12,000 for August marketing expenses"
  }
}
```

## 🏗️ Architecture

### Smart Code System
Every accounting operation is governed by smart codes that encode business rules:
- `HERA.FIN.GL.TXN.JE.*` - Journal entries
- `HERA.FIN.AR.TXN.INV.*` - Invoices
- `HERA.FIN.AR.TXN.PMT.*` - Payments
- `HERA.FIN.BANK.RECON.*` - Reconciliation

### Security & Compliance
- **Multi-tenant isolation** via organization_id
- **Row Level Security** enforced at database level
- **Approval workflows** for high-value transactions
- **Audit trail** for all operations
- **Period controls** prevent posting to closed periods

### Integration with Universal Architecture
All accounting data is stored in HERA's sacred 6 tables:
- **universal_transactions** - Journal headers, invoices, payments
- **universal_transaction_lines** - Journal lines, invoice items
- **core_entities** - GL accounts, customers, vendors
- **core_relationships** - Approvals, applications
- **core_dynamic_data** - Custom fields, VAT rules
- **core_organizations** - Multi-tenant isolation

## 🔧 Configuration

### Environment Variables
```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional AI Integration
OPENAI_API_KEY=your-openai-key  # For NL processing
ANTHROPIC_API_KEY=your-claude-key  # Alternative AI
```

### Posting Rules Setup
Configure GL posting rules in `core_dynamic_data`:
```sql
-- Example: Invoice posting rule
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_value_text,
  smart_code
) VALUES (
  'your-org-id',
  null,
  'posting_rule:HERA.FIN.AR.TXN.INV.STANDARD.v1',
  '{"dr":["1200:AR"],"cr":["4000:Revenue","2300:VAT_Output"]}',
  'HERA.FIN.CONFIG.POSTING_RULE.v1'
);
```

## 📊 Monitoring & Telemetry

The MCP server includes built-in telemetry:
- Transaction success/failure rates
- Average processing time by operation
- Smart code usage analytics
- Error tracking with context

Access telemetry via:
```bash
# View real-time metrics
node hera-cli.js query-telemetry accounting

# Export telemetry data
node export-accounting-metrics.js --period "2025-08"
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Integration tests with test database
npm run test:integration

# Test specific tool
node test-tool.js create-journal-entry
```

## 🚨 Common Issues & Solutions

### "Journal doesn't balance"
Ensure total debits = total credits. The system enforces this at database level.

### "Cannot post to closed period"
Check period status with `check-compliance` tool. Only open periods accept postings.

### "Insufficient permissions"
Verify user has `post_journal` or `accountant` role via organization settings.

### "Smart code not recognized"
Use standard smart codes or configure custom ones in `core_dynamic_data`.

## 📚 Advanced Features

### Batch Processing
Process multiple journals efficiently:
```javascript
{
  "tool": "create-batch-journal",
  "parameters": {
    "organization_id": "org-id",
    "batch": [
      { /* journal 1 */ },
      { /* journal 2 */ },
      { /* journal 3 */ }
    ],
    "validation": "strict"
  }
}
```

### Multi-Currency Support
Specify currency on transactions:
```javascript
{
  "currency": "EUR",
  "exchange_rate": 1.18,
  "base_amount": 10000  // Auto-calculated
}
```

### Approval Workflows
High-value transactions auto-route for approval:
- < $10,000: Auto-approve
- $10,000 - $50,000: Manager approval
- > $50,000: CFO approval

## 🔗 Integration with Analytics Chat

The Digital Accountant integrates seamlessly with HERA Analytics Chat:

1. **Natural Language**: "Post a journal for August rent of $5,000"
2. **Intent Detection**: Recognizes accounting intent
3. **Smart Routing**: Routes to appropriate MCP tool
4. **Execution**: Creates draft transaction
5. **Confirmation**: Shows result with approval actions

## 🛡️ Security Best Practices

1. **Never use service role key in client code**
2. **Always validate organization_id**
3. **Implement rate limiting for API endpoints**
4. **Log all financial operations**
5. **Regular security audits of posting rules**

## 📖 Further Documentation

- [HERA Universal Architecture](../docs/UNIVERSAL-ARCHITECTURE.md)
- [Smart Code Reference](../docs/SMART-CODES.md)
- [API Documentation](../docs/api/DIGITAL-ACCOUNTANT.md)
- [Security Guide](../docs/SECURITY.md)

---

**The HERA Digital Accountant MCP - Enterprise accounting automation with sacred 6-table compliance** 🚀