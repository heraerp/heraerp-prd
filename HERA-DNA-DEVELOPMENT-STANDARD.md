# 🧬 HERA DNA Development Standard

## The Universal Truth: 6 Tables. Infinite Business Complexity. Zero Schema Changes.

This document defines the **mandatory development standard** for ALL HERA modules. Every feature, every module, every line of code MUST follow this DNA.

## 🛡️ The Three Layers of Protection

### 1️⃣ **Authoring Time** - TypeScript Can't Lie
```typescript
// ❌ THIS WON'T EVEN COMPILE
const result = await createTransaction({
  amount: 1000,
  type: 'sale'
  // Missing organization_id and smart_code!
});

// ✅ ENFORCED BY TYPES
const result = await createTransaction({
  organizationId: createOrganizationId('uuid-here'), // Branded type
  smartCode: createSmartCode('HERA.FIN.SALE.TXN.v1'), // Validated
  amount: 1000,
  type: 'sale'
});
```

**What's Protected:**
- `OrganizationId` - Not just a string, a validated UUID
- `SmartCode` - Must match HERA pattern
- `EntityId` - Type-safe entity references  
- `TransactionId` - Type-safe transaction references
- `SacredTable` - Only the 6 tables exist in types

### 2️⃣ **Build Time** - The DNA Gate
```json
// package.json
{
  "scripts": {
    "build": "npm run dna:gate && next build"
    // Build STOPS if DNA is violated
  }
}
```

**What's Checked:**
- ❌ No `ALTER TABLE` or `CREATE TABLE` in codebase
- ❌ No status columns (`status`, `is_deleted`, `deleted_at`)
- ❌ No direct Supabase access (`supabase.from()`)
- ✅ Every payload has `organization_id`
- ✅ Every entity/transaction has valid `smart_code`
- ✅ Only sacred tables used

### 3️⃣ **Runtime** - MCP Is The Only Way
```typescript
// This is the ONLY path to the database
await mcp('entity.create', {
  organization_id: orgId,     // Validated
  smart_code: smartCode,      // Validated
  entity_type: 'customer',    // Checked against allowed types
  // ...
});
```

**What's Enforced:**
- Organization isolation (no cross-org access)
- Smart code validation (regex + catalog)
- Six table discipline (no custom tables)
- Idempotency (deduplication by key)
- GL balancing (debits = credits)
- Audit trail (who, what, when, why)

## 📋 The DNA Rules (Non-Negotiable)

### Rule 1: The Six Sacred Tables
```typescript
type SacredTable =
  | 'core_organizations'      // WHO - Multi-tenant isolation
  | 'core_entities'          // WHAT - All business objects
  | 'core_dynamic_data'      // HOW - Custom fields
  | 'core_relationships'     // WHY - Connections & workflows
  | 'universal_transactions' // WHEN - Transaction headers
  | 'universal_transaction_lines'; // DETAILS - Line items
```

### Rule 2: Smart Codes Are Mandatory
```typescript
// Pattern: HERA.{MODULE}.{DOMAIN}.{TYPE}.{SUBTYPE}.v{VERSION}
'HERA.FIN.GL.ACC.ASSET.v1'        // GL Account
'HERA.CRM.CUST.ENT.PROF.v1'      // Customer Profile
'HERA.WHATSAPP.MESSAGE.TEXT.v1'   // WhatsApp Message
'HERA.HR.EMP.ENT.STAFF.v1'       // Employee Record
```

### Rule 3: Organization Isolation Is Sacred
```typescript
// EVERY operation MUST have organization_id
// NEVER query without organization filter
// NEVER allow cross-org data access
```

### Rule 4: No Status Columns - Use Relationships
```typescript
// ❌ WRONG
entity.status = 'active';

// ✅ RIGHT
await createRelationship({
  fromEntityId: entity.id,
  toEntityId: activeStatus.id,
  relationshipType: 'has_status',
  smartCode: 'HERA.WORKFLOW.STATUS.ASSIGN.v1'
});
```

### Rule 5: Business Data Goes in Metadata/Dynamic
```typescript
// ❌ WRONG - Adding columns
ALTER TABLE core_entities ADD COLUMN phone VARCHAR(20);

// ✅ RIGHT - Using dynamic data
await setDynamicField(entityId, 'phone', '+971501234567');
```

## 🚀 Module Development Checklist

When building ANY new module (WhatsApp, HR, Finance, Inventory, etc.):

### 1. **Start with DNA SDK**
```typescript
import { HeraDNAClient, createOrganizationId, createSmartCode } from '@hera/dna-sdk';

const client = new HeraDNAClient({
  organizationId: createOrganizationId('your-org-id')
});
```

### 2. **Define Your Smart Codes**
```typescript
const HR_SMART_CODES = {
  EMPLOYEE_CREATE: createSmartCode('HERA.HR.EMP.ENT.STAFF.v1'),
  PAYROLL_RUN: createSmartCode('HERA.HR.PAYROLL.TXN.RUN.v1'),
  LEAVE_REQUEST: createSmartCode('HERA.HR.LEAVE.TXN.REQUEST.v1')
};
```

### 3. **Use DNA Builders**
```typescript
const employee = await DNA.entity(orgId)
  .type('employee')
  .name('John Doe')
  .smartCode(HR_SMART_CODES.EMPLOYEE_CREATE)
  .withMetadata({
    department: 'Engineering',
    startDate: '2024-01-01'
  })
  .build();
```

### 4. **Follow Universal Patterns**
- **Entities**: Employees, departments, positions
- **Transactions**: Payroll runs, leave requests, timesheets
- **Relationships**: Reports to, member of, assigned to
- **Dynamic Data**: Salary history, certifications, skills

### 5. **Test with DNA Gates**
```bash
npm run dna:lint    # Check for violations
npm run dna:gate    # Full validation
npm run build       # Will fail if DNA violated
```

## 🏆 What You Get

1. **Zero Schema Changes** - Business evolves without database changes
2. **Perfect Multi-Tenancy** - Organization data isolation guaranteed
3. **Universal Intelligence** - Smart codes enable cross-module learning
4. **Instant Implementation** - New modules in hours, not months
5. **Self-Documenting** - Smart codes describe business intent
6. **Future-Proof** - AI-ready, blockchain-ready, any-tech-ready

## 🔥 The HERA Promise

**Every module built on HERA DNA automatically inherits:**
- Type safety at compile time
- Validation at build time  
- Guardrails at runtime
- Zero schema changes forever
- Perfect multi-tenant isolation
- Universal business intelligence

## 📌 Remember

> "If it's not in the 6 tables with a smart code and organization_id, it's not HERA."

This is not a guideline. This is not a suggestion. This is **THE LAW**.

Every developer, every module, every feature follows the HERA DNA.

**6 Tables. Infinite Possibilities. Zero Compromises.** 🚀