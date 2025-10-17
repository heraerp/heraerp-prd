# Finance DNA v2.2 (Org-agnostic)

**HERA Finance DNA v2.2** provides enterprise-grade financial transaction management with runtime organization resolution and lazy Chart of Accounts (COA) provisioning. No organization IDs are hardcoded anywhere.

## 🎯 Overview

- **Org-agnostic**: Resolves `org_id` from JWT claim or `HERA_ORG_ID` environment variable
- **Lazy COA**: Automatically provisions Chart of Accounts per organization on first use
- **Salon Integration**: Pattern-based posting rules work with any salon organization
- **Sacred Six Compliance**: All business data routed to `core_dynamic_data`
- **Actor Stamping**: Comprehensive audit trail enforcement
- **GL Balancing**: Per-currency debits/credits validation

## 🏗️ Architecture

### Policy Bundle (`/guardrails/finance/finance_dna_v2_2.json`)
- Smart code pattern enforcement
- Multi-tenant organization isolation
- Account entity semantics (GL/STAT)
- Transaction header/line validation
- Automated posting rules for common patterns

### COA Pack (`/packs/chart_of_accounts/coa_default.json`)
- Standard chart of accounts template
- Account codes with smart code mappings
- GL and STAT account types
- Org-agnostic design for multi-tenant use

### Salon Pack (`/packs/salon/salon_posting_overrides.json`)
- Service category to account mappings
- Commission and VAT account mappings
- Tax rate defaults
- Pattern-based rules (no hardcoded org IDs)

## 🚀 Setup

### 1. Apply Database Components

```bash
# Apply actor stamping triggers
psql -f db/triggers/enforce_actor_stamp.sql

# Create account entities view
psql -f db/views/v_core_entities_accounts.sql
```

### 2. Configure Environment

```bash
# Authentication (required)
export HERA_JWT="<your-jwt-token-with-org-claim>"

# API endpoint (optional, defaults to production)
export HERA_API="https://www.heraerp.com/api/v2"

# Organization override (optional, JWT org_id takes precedence)
export HERA_ORG_ID="<organization-uuid>"
```

### 3. Register Policy Components

Load the following files into your HERA Rules Engine:

- `guardrails/finance/finance_dna_v2_2.json` → Guardrails/Policy Bundle
- `packs/salon/salon_posting_overrides.json` → Rules/Posting Overrides

### 4. Seed Sample Transactions

```bash
# Install dependencies
npm install

# Compile TypeScript (if needed)
npm run build

# Run transaction seeder
node tools/seed/seed_post_transactions.js
```

### 5. Run Tests

```bash
# Point CI at test suite
npx hera-test-runner tests/finance/finance_dna_v2_2.yml
```

## 🔧 Usage

### Runtime Organization Resolution

The system automatically resolves the target organization using this priority:

1. `HERA_ORG_ID` environment variable (explicit override)
2. `org_id` or `organization_id` claim from JWT token
3. Error if neither is available

```typescript
import { resolveOrgId } from './tools/org_runtime/resolve_org_and_accounts.js';

// Automatically resolves from environment/JWT
const orgId = await resolveOrgId();
console.log(`Operating on organization: ${orgId}`);
```

### Lazy COA Provisioning

Chart of Accounts is automatically created per organization on first transaction:

```typescript
import { ensureCOA, resolveAccountIds } from './tools/org_runtime/resolve_org_and_accounts.js';

// Ensure COA exists for organization
const accountMap = await ensureCOA(orgId);

// Resolve specific account codes to entity IDs
const neededAccounts = ['1000', '4000', '2100'];
const entityIds = await resolveAccountIds(orgId, neededAccounts);

console.log('Cash account entity ID:', entityIds['1000']);
```

### Template-Based Transaction Posting

Transactions are defined as templates with account codes, then resolved to entity IDs at runtime:

```json
{
  "transaction": {
    "smart_code": "HERA.FINANCE.TXN.SALE.v1",
    "transaction_type": "SALE",
    "business_context": {
      "gross_total": 472.50,
      "net_of_tax": 450.00,
      "tax_total": 22.50
    }
  },
  "lines": [
    {
      "line_number": 10,
      "account_code": "1000",
      "amount_expr": "gross_total", 
      "side": "DR"
    },
    {
      "line_number": 20,
      "account_code": "4000",
      "amount_expr": "net_of_tax",
      "side": "CR"
    }
  ]
}
```

## 📊 Sample Transactions

### Salon Service Sale

**Template**: `seeds/finance/tx_sale_salon.template.json`

- **DR** 1000 (Cash) - Gross total including VAT
- **CR** 4000 (Revenue) - Net service amount  
- **CR** 2100 (VAT Payable) - Tax amount
- **DR** 5000 (Commission) - Stylist commission

### Foreign Exchange Expense

**Template**: `seeds/finance/tx_expense_fx.template.json`

- Multi-currency transaction (USD → AED)
- Exchange rate and date tracking
- **DR** 6100 (Office Supplies) - USD 100
- **CR** 2101 (Accounts Payable) - USD 100

### Year-End Close

**Template**: `seeds/finance/tx_close_ye.template.json`

- P&L transfer to retained earnings
- **CR** 3200 (Retained Earnings) - P&L total
- **DR** 9999 (P&L Control) - P&L total

## 🛡️ Security & Compliance

### Actor Stamping Enforcement

All Sacred Six table writes require proper actor stamping:

```sql
-- Automatically enforced by triggers
INSERT INTO universal_transactions (..., created_by, updated_by) 
VALUES (..., current_actor_id, current_actor_id);
```

### Organization Isolation

Every operation is scoped to a specific organization:

```typescript
// All queries automatically include organization filter
const transactions = await hera_transactions_crud_v2({
  p_action: 'READ',
  p_organization_id: resolvedOrgId,  // Sacred boundary
  // ...
});
```

### Smart Code Validation

All entities and transactions must follow HERA DNA patterns:

```
✅ HERA.FINANCE.TXN.SALE.v1
✅ HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1
❌ invalid-smart-code
```

### GL Balancing

Debits and credits are automatically validated per currency:

```typescript
// Automatically enforced for GL transactions
lines: [
  { side: 'DR', amount: 100, currency: 'AED' },  // +100 AED
  { side: 'CR', amount: 100, currency: 'AED' }   // -100 AED = Balanced ✅
]
```

## 📂 File Structure

```
/guardrails/finance/
  └── finance_dna_v2_2.json              # Policy bundle

/packs/
  ├── chart_of_accounts/
  │   └── coa_default.json               # Default COA template
  └── salon/
      └── salon_posting_overrides.json   # Salon-specific mappings

/db/
  ├── triggers/
  │   └── enforce_actor_stamp.sql        # Actor audit enforcement
  └── views/
      └── v_core_entities_accounts.sql   # Account entities view

/tools/
  ├── org_runtime/
  │   └── resolve_org_and_accounts.ts    # Runtime resolution logic
  └── seed/
      └── seed_post_transactions.ts      # Transaction seeder

/seeds/finance/
  ├── tx_sale_salon.template.json       # Salon sale template
  ├── tx_expense_fx.template.json       # FX expense template
  └── tx_close_ye.template.json         # Year-end close template

/tests/finance/
  └── finance_dna_v2_2.yml              # Test suite

/.cache/
  └── coa_map.{org_id}.json             # Cached account mappings
```

## 🔍 Troubleshooting

### Missing Environment Variables

```bash
# Check environment configuration
node -e "
import { getEnvironmentInfo } from './tools/org_runtime/resolve_org_and_accounts.js';
console.log(JSON.stringify(getEnvironmentInfo(), null, 2));
"
```

### Account Resolution Issues

```bash
# Clear cache and retry
rm -rf .cache/
node tools/seed/seed_post_transactions.js
```

### JWT Token Issues

```bash
# Decode JWT to verify org claim
node -e "
const jwt = require('jsonwebtoken');
const payload = jwt.decode(process.env.HERA_JWT);
console.log('JWT payload:', JSON.stringify(payload, null, 2));
"
```

## 🎯 Integration Notes

### Sacred Six Compliance

- ✅ No new database tables required
- ✅ All business data routed to `core_dynamic_data`
- ✅ Account entities use standard `core_entities`
- ✅ Complete audit trail via actor stamping

### Multi-Tenant Safe

- ✅ No hardcoded organization IDs
- ✅ Runtime organization resolution
- ✅ Per-org COA provisioning
- ✅ Sacred boundary enforcement

### Salon Integration Ready

- ✅ Pattern-based service mappings
- ✅ Commission account handling
- ✅ VAT calculation and posting
- ✅ Works with any salon organization

---

## 🚀 Next Steps

1. **Deploy Database Components**: Apply triggers and views
2. **Configure Environment**: Set JWT and API endpoint
3. **Load Policy Bundle**: Register guardrails and salon pack
4. **Test Transaction Flow**: Run seeder and verify results
5. **Integrate with Applications**: Use runtime resolution in your apps

**Finance DNA v2.2 is production-ready for Michele's Hair Salon and any HERA organization! 🏆**