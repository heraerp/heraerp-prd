# 🧬 HERA DNA Quick Reference Card

## 🚦 Before You Code - The DNA Checklist

```typescript
✅ import { HeraDNAClient, createOrganizationId, createSmartCode } from '@hera/dna-sdk';
✅ const orgId = createOrganizationId('your-org-uuid');
✅ const smartCode = createSmartCode('HERA.MODULE.DOMAIN.TYPE.v1');
❌ import { createClient } from '@supabase/supabase-js'; // FORBIDDEN!
```

## 📊 The Six Sacred Tables (ONLY THESE!)

| Table | Purpose | What Goes Here |
|-------|---------|----------------|
| `core_organizations` | WHO | Business/tenant isolation |
| `core_entities` | WHAT | Customers, products, employees, GL accounts |
| `core_dynamic_data` | HOW | Custom fields, attributes, properties |
| `core_relationships` | WHY | Status, hierarchies, assignments |
| `universal_transactions` | WHEN | Orders, invoices, payments, journals |
| `universal_transaction_lines` | DETAILS | Line items, entries, messages |

## 🏷️ Smart Code Pattern

```
HERA.{MODULE}.{DOMAIN}.{TYPE}.{SUBTYPE}.v{VERSION}
```

### Examples by Module:
```typescript
// CRM
'HERA.CRM.CUST.ENT.PROF.v1'          // Customer profile
'HERA.CRM.LEAD.ENT.PROSPECT.v1'      // Lead/prospect
'HERA.CRM.SALE.TXN.ORDER.v1'         // Sales order

// Finance
'HERA.FIN.GL.ACC.ASSET.v1'           // Asset account
'HERA.FIN.GL.TXN.JOURNAL.v1'         // Journal entry
'HERA.FIN.AR.TXN.INVOICE.v1'         // Customer invoice

// HR
'HERA.HR.EMP.ENT.STAFF.v1'           // Employee
'HERA.HR.PAYROLL.TXN.RUN.v1'         // Payroll run
'HERA.HR.LEAVE.TXN.REQUEST.v1'       // Leave request

// WhatsApp
'HERA.WHATSAPP.INBOX.THREAD.v1'      // Conversation
'HERA.WHATSAPP.MESSAGE.TEXT.v1'      // Text message
'HERA.WHATSAPP.CAMPAIGN.OUTBOUND.v1' // Campaign
```

## ⚡ Quick Patterns

### Create Entity
```typescript
const customer = await DNA.entity(orgId)
  .type('customer')
  .name('ACME Corp')
  .code('CUST-001')
  .smartCode('HERA.CRM.CUST.ENT.PROF.v1')
  .withMetadata({ industry: 'tech' })
  .build();
```

### Create Transaction
```typescript
const order = await DNA.transaction(orgId)
  .type('sale')
  .smartCode('HERA.CRM.SALE.TXN.ORDER.v1')
  .fromEntity(customerId)
  .amount(1000)
  .withLines([...])
  .build();
```

### Set Dynamic Field
```typescript
await client.setDynamicField(
  entityId,
  'credit_limit',
  50000,
  createSmartCode('HERA.CRM.CUST.DYN.CREDIT.v1')
);
```

### Create Status Relationship
```typescript
await client.createRelationship({
  fromEntityId: orderId,
  toEntityId: approvedStatusId,
  relationshipType: 'has_status',
  smartCode: createSmartCode('HERA.WORKFLOW.STATUS.ASSIGN.v1')
});
```

## 🚫 Common Mistakes (DON'T DO THIS!)

```typescript
// ❌ WRONG - Direct DB access
const { data } = await supabase.from('core_entities').select('*');

// ❌ WRONG - Missing organization_id
await createEntity({ type: 'customer', name: 'Test' });

// ❌ WRONG - Plain string smart code
const smartCode = 'HERA.CRM.CUST.ENT.PROF.v1';

// ❌ WRONG - Status column
entity.status = 'active';

// ❌ WRONG - Custom table
await supabase.from('custom_customers').insert({...});
```

## ✅ Always Remember

1. **Organization ID** - Required on EVERY operation
2. **Smart Code** - Required on EVERY entity/transaction
3. **Six Tables Only** - No exceptions, ever
4. **Use Relationships** - For status, assignments, hierarchies
5. **Dynamic Data** - For custom fields and attributes

## 🛠️ DNA Commands

```bash
# Check your code
npm run dna:lint

# Validate before build
npm run dna:gate

# Generate SDK functions
npm run dna:generate

# Full build (includes DNA gates)
npm run build
```

## 🆘 Getting Help

```typescript
// See all available smart codes
import { SMART_CODE_CATALOG } from '@hera/dna-sdk';

// Validate a smart code
const isValid = validateSmartCode('HERA.CRM.CUST.ENT.PROF.v1');

// Get examples
import { DNA_EXAMPLES } from '@hera/dna-sdk/examples';
```

---

**Remember**: If TypeScript compiles it, build passes it, and MCP accepts it, then it's HERA DNA compliant! 🧬✨