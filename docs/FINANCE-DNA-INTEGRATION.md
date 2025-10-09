# ⚠️ DEPRECATED: Finance DNA v1 Integration (LEGACY)

**IMPORTANT**: This documentation is for Finance DNA v1 which is now deprecated. 

**Please use Finance DNA v2**: See `/docs/FINANCE-DNA-V2-INTEGRATION.md` for the current production system.

---

# HERA Finance DNA v1 Integration - Universal Financial Integration Pattern (LEGACY)

## Overview

The Finance DNA Integration is a revolutionary pattern that gives every HERA app (restaurant, salon, ice-cream, healthcare, etc.) automatic enterprise-grade financial integration without any custom development. It's built into HERA's DNA, ensuring perfect Finance↔SD↔MM↔HR integration out of the box.

## Core Principles

1. **Universal Event Contract**: All modules emit the same payload structure
2. **Smart Code Intelligence**: Business meaning derived from smart codes, not hard-coded logic
3. **Policy as Data**: Posting rules stored in database, not code
4. **Zero Schema Changes**: Uses the sacred 6-table architecture
5. **Automatic GL Posting**: Every business event creates proper journal entries

## Architecture

### Universal Finance Event Structure

```typescript
// Every business event follows this structure
{
  // Header (universal_transactions)
  organization_id: "ORG-123",
  smart_code: "HERA.RESTAURANT.FOH.ORDER.POSTED.v1",
  event_time: "2025-09-08T10:11:12Z",
  currency: "USD",
  source_system: "RestaurantPOS",
  origin_txn_id: "ORDER-12345",
  ai_confidence: 0.98,
  
  // Lines (universal_transaction_lines)
  lines: [
    { entity_id: "COA:110000", role: "Cash", dr: 100, cr: 0 },
    { entity_id: "COA:400000", role: "Revenue", dr: 0, cr: 95 },
    { entity_id: "COA:220000", role: "Tax", dr: 0, cr: 5 }
  ]
}
```

### Smart Code Registry

Posting rules are stored as data, not code:

```yaml
- smart_code: HERA.RESTAURANT.FOH.ORDER.POSTED.v1
  posting_recipe:
    - DR Cash/Card → payment.method.clearing_account
    - CR Food Revenue → product.category.revenue_account  
    - CR Sales Tax → tax.jurisdiction.liability_account
  outcomes:
    auto_post_if: ai_confidence >= 0.95
    else: stage_for_review
```

### Activation Matrix

Per-organization configuration:

```json
{
  "modules_enabled": { "SD": true, "MM": true, "HR": true },
  "finance_policy": {
    "default_coa_id": "COA-RESTAURANT-US",
    "tax_profile_id": "TAX-US-NY",
    "fx_source": "ECB"
  },
  "deactivation_behaviour": {
    "HR": "suppress_events"
  }
}
```

## Implementation Guide

### 1. Enable Finance DNA for Your Organization

```typescript
import { FinanceDNAActivation } from '@/lib/dna/integration/finance-dna-loader'

await FinanceDNAActivation.activate(organizationId, {
  industryType: 'restaurant',
  country: 'US',
  currency: 'USD'
})
```

### 2. Use the Finance Event Processor in Your App

```typescript
import { useFinanceProcessor } from '@/lib/dna/integration/finance-event-processor'

function RestaurantPOS() {
  const { processor } = useFinanceProcessor(organizationId)
  
  const handleOrderComplete = async (order) => {
    // This automatically posts to GL!
    const result = await processor.postRevenue({
      amount: order.total,
      currency: 'USD',
      payment_method: order.payment_method,
      revenue_type: 'RESTAURANT_SALE',
      tax_amount: order.tax,
      reference: order.id,
      metadata: {
        table_number: order.table,
        server: order.server_id
      }
    })
    
    if (result.success) {
      console.log('Posted to GL:', result.journal_code)
    }
  }
}
```

### 3. For Complex Events, Use Direct Processing

```typescript
const result = await processor.processBusinessEvent({
  smart_code: 'HERA.RESTAURANT.INV.WASTAGE.v1',
  source_system: 'KitchenApp',
  origin_txn_id: 'WASTE-001',
  currency: 'USD',
  lines: [
    {
      entity_id: 'COA:502000',
      role: 'Wastage Expense',
      amount: 50,
      type: 'debit'
    },
    {
      entity_id: 'COA:130000',
      role: 'Food Inventory',
      amount: 50,
      type: 'credit'
    }
  ]
})
```

## Industry-Specific Configurations

### Restaurant
- **Revenue**: Food, Beverage, Delivery, Catering
- **COGS**: Real-time inventory depletion on order
- **Special**: Tips handling, wastage tracking
- **Posting Rules**: 7 pre-configured patterns

### Salon
- **Revenue**: Service revenue by type, product sales, booth rental
- **Commission**: Automatic stylist commission calculation
- **Special**: Tips distribution, supply usage tracking
- **Posting Rules**: 7 pre-configured patterns

### Healthcare (Coming Soon)
- **Revenue**: Patient services, insurance reimbursements
- **Special**: Deferred revenue, insurance adjustments
- **Compliance**: HIPAA-compliant audit trails

### Manufacturing (Coming Soon)
- **WIP Tracking**: Automatic work-in-process accounting
- **Variance**: Material, labor, overhead variance calculation
- **Costing**: Standard or actual costing methods

## Key Benefits

1. **Zero Integration Code**: Apps just emit events with smart codes
2. **Automatic GL Posting**: Every event creates proper journal entries
3. **Multi-Currency**: Built-in FX handling with gain/loss calculation
4. **Tax Compliance**: Automatic tax calculation and posting
5. **Period Control**: Respects fiscal periods and closing dates
6. **Audit Trail**: Complete traceability from source to GL
7. **Industry Templates**: Pre-configured for common industries

## Database Storage

### Posting Rules (core_dynamic_data)
```sql
-- Posting rules stored as dynamic data
INSERT INTO core_dynamic_data (
  organization_id,
  field_name,
  field_category,
  field_key,
  field_value_json,
  smart_code
) VALUES (
  'ORG-123',
  'posting_rule',
  'finance_dna',
  'HERA.RESTAURANT.FOH.ORDER.POSTED.v1',
  '{"smart_code": "...", "posting_recipe": {...}}',
  'HERA.DNA.FINANCE.POSTING_RULE.v1'
);
```

### Organization Config (core_organizations.metadata)
```sql
-- Activation matrix in org metadata
UPDATE core_organizations 
SET metadata = jsonb_set(
  metadata, 
  '{finance_dna}',
  '{"modules_enabled": {...}, "finance_policy": {...}}'
)
WHERE organization_id = 'ORG-123';
```

### GL Accounts (core_entities)
```sql
-- Chart of accounts as entities
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_code,
  entity_name,
  smart_code
) VALUES (
  'ORG-123',
  'gl_account',
  '110000',
  'Cash on Hand',
  'HERA.FIN.GL.ACCOUNT.ASSET.v1'
);
```

## Monitoring & Observability

### Key Metrics
- Event→GL posting latency (target: <2s)
- Auto-post rate vs manual review rate
- Exception queue depth
- Daily balance verification

### Dashboards
- Real-time posting status
- Exception queue with drill-down
- GL reconciliation status
- Period closing readiness

## FAQ

**Q: What happens if a module is disabled?**
A: Events are either suppressed or posted to a suspense account based on configuration.

**Q: Can I customize posting rules?**
A: Yes, posting rules are data-driven. You can modify them per organization.

**Q: How are multi-currency transactions handled?**
A: Exchange rates are captured at event time. Revaluation is a separate process.

**Q: What about inter-company transactions?**
A: Each organization posts independently. Inter-company clearing is handled separately.

**Q: Can I preview GL impact before posting?**
A: Yes, use the processor in "preview" mode to see GL lines without committing.

## Next Steps

1. **Activate Finance DNA** for your organization
2. **Review posting rules** for your industry
3. **Test with sample transactions** 
4. **Monitor the dashboards** for exceptions
5. **Go live** with confidence!

---

## ⚠️ MIGRATION NOTICE

**This Finance DNA v1 documentation is deprecated.** 

**Migrate to Finance DNA v2:**
- **New Integration Guide**: `/docs/FINANCE-DNA-V2-INTEGRATION.md`
- **Performance**: 10x+ faster with sub-second operations
- **Features**: Professional reporting, multi-currency, advanced guardrails
- **CLI**: Enhanced `finance-dna-v2-ci-runner.js` commands
- **API**: Complete TypeScript client with React hooks
- **Testing**: 100+ comprehensive test cases
- **Enterprise**: 99% deployment reliability with automated CI/CD

**Migration Path**: Finance DNA v2 includes automatic compatibility layer for zero-downtime migration.

---

*~~The Finance DNA Integration ensures every HERA app speaks the language of finance fluently, automatically, and accurately.~~*

**Finance DNA v2 delivers enterprise-grade financial systems with revolutionary performance and reliability.** 🚀