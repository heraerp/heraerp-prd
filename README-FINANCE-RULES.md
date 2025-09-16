# 📚 Finance DNA Rules Viewer

Production-ready policy-as-data management for Finance DNA automatic journal posting rules.

## 🎯 Overview

The Finance DNA Rules Viewer provides a comprehensive interface for managing posting rules that drive automatic journal entry creation. All rules are stored as policy-as-data in `core_dynamic_data`, enabling flexible configuration without schema changes.

## 🏗️ Architecture

### Policy-as-Data Model
- **Storage**: Rules stored in `core_dynamic_data` with keys like `FIN_DNA.RULES.{NAME}.v{N}`
- **Organization Scoped**: Every rule isolated by `organization_id`
- **Versioned**: Rules use semantic versioning (v1, v2, etc.)
- **Sacred Six Compliant**: No schema changes required

### Rule Structure
```typescript
interface PostingRule {
  key: string                    // FIN_DNA.RULES.POS_SALE.v1
  title: string                  // Human-readable name
  description?: string           // Optional detailed description
  category: string               // pos|payments|inventory|commissions|fiscal|other
  enabled: boolean               // Active/inactive flag
  smart_code: string            // HERA.* smart code for audit
  applies_to: string[]          // Transaction smart codes this rule processes
  conditions: object            // Optional conditional logic (JSON)
  mappings: Mapping[]           // Account mappings (at least one required)
  last_run_at?: string          // Last execution timestamp
  version: string               // v1, v2, etc.
  created_at?: string
  updated_at?: string
}

interface Mapping {
  account: string               // GL account code (e.g., "4100")
  side: 'debit' | 'credit'      // Accounting side
  amount_source: string         // net|tax|gross|tip|discount|cogs|commission|custom
  multiplier: number            // Factor to apply (default: 1)
  memo?: string                 // Optional description
}
```

## 📋 Rule Categories

### POS
Rules for point-of-sale transactions
- Sales revenue posting
- Tax liability recording
- Cash/card receipt processing

### Payments
Rules for payment processing
- Customer payments
- Vendor payments
- Refunds and adjustments

### Inventory
Rules for inventory movements
- Cost of goods sold
- Inventory receipts
- Stock adjustments

### Commissions
Rules for commission calculations
- Staff commission accruals
- Commission payments
- Performance bonuses

### Fiscal
Rules for year-end and period closing
- Revenue/expense calculations
- Retained earnings transfers
- P&L account closures

### Other
Custom rules not fitting standard categories

## 🛠️ Key Features

### Rule Management
- **Create**: Define new posting rules with structured form
- **Edit**: Modify existing rules (key remains immutable)
- **Clone**: Create new version (v2, v3, etc.) for breaking changes
- **Toggle**: Enable/disable rules without deletion
- **Delete**: Soft delete by disabling

### Filtering & Search
- **Search**: By key or title
- **Category Filter**: Show only specific rule types
- **Enabled Only**: Hide disabled rules
- **Real-time Updates**: Instant filtering as you type

### Rule Editor
- **Tabbed Interface**: General, Mappings, Conditions, Preview
- **Structured Forms**: No free-form JSON editing
- **Validation**: Real-time form validation
- **Preview**: See complete rule JSON before saving

### Mappings Table
- **Dynamic Rows**: Add/remove account mappings
- **Account Validation**: Minimum 2 characters
- **Amount Sources**: Predefined options for consistency
- **Multipliers**: Support for percentage calculations
- **Memos**: Optional descriptions for clarity

### JSON Viewer
- **Syntax Highlighting**: Color-coded JSON display
- **Collapsible Sections**: Expand/collapse nested objects
- **Smart Code Badges**: Visual highlighting of HERA codes
- **Copy Function**: One-click copy to clipboard

## 🔄 Versioning Strategy

### When to Version
- **Breaking Changes**: Changes that affect posting logic
- **Account Changes**: Different GL accounts
- **Formula Changes**: Modified calculations

### Version Process
1. Click "Clone to vN+1" on existing rule
2. New rule created as disabled copy
3. Modify the new version
4. Test thoroughly
5. Enable new version
6. Disable old version

### Version Naming
- `v1` - Initial version
- `v2` - First revision
- `v3` - Second revision
- Continue incrementing...

## 🚀 Usage Examples

### Creating a POS Sale Rule
```typescript
{
  key: "FIN_DNA.RULES.POS_SALE.v1",
  title: "POS Sale Posting",
  category: "pos",
  smart_code: "HERA.FIN.POSTING.POS.SALE.v1",
  applies_to: ["HERA.POS.SALE.v1", "HERA.POS.SALE.LINE.v1"],
  mappings: [
    { account: "1100", side: "debit", amount_source: "gross", multiplier: 1 },
    { account: "4100", side: "credit", amount_source: "net", multiplier: 1 },
    { account: "2250", side: "credit", amount_source: "tax", multiplier: 1 }
  ]
}
```

### Creating a Commission Rule
```typescript
{
  key: "FIN_DNA.RULES.COMMISSION.ACCRUAL.v1",
  title: "Staff Commission Accrual",
  category: "commissions",
  smart_code: "HERA.FIN.COMMISSION.ACCRUAL.v1",
  applies_to: ["HERA.SALON.SERVICE.COMPLETE.v1"],
  mappings: [
    { account: "5500", side: "debit", amount_source: "commission", multiplier: 0.35 },
    { account: "2300", side: "credit", amount_source: "commission", multiplier: 0.35 }
  ]
}
```

## 🔐 Security & Compliance

### Organization Isolation
- All rules filtered by `organization_id`
- No cross-organization data access
- Automatic context from auth token

### Audit Trail
- Every change tracked with timestamps
- Smart codes provide business context
- Complete history in `universal_transactions`

### Permissions
- View: Read access to rules
- Create: Add new rules
- Edit: Modify existing rules
- Delete: Disable rules

## ⚡ Runtime Behavior

### Important Notes
- **Future Only**: Rule changes affect future transactions only
- **No Retroactive**: Existing journal entries remain unchanged
- **Server-Side**: Posting happens during transaction processing
- **Immediate Effect**: Enabled rules apply instantly to new transactions

### Processing Flow
1. Transaction created with smart code
2. Finance DNA finds matching rules (by `applies_to`)
3. Evaluates conditions (if any)
4. Applies mappings to create journal lines
5. Posts to general ledger

## 🎨 UI/UX Features

### Accessibility (WCAG AA)
- Keyboard navigation throughout
- Proper ARIA labels
- High contrast theme support
- Focus indicators

### Theme Integration
- Violet/pink salon theme
- Consistent with HERA design system
- Dark mode support
- Responsive layout

### Visual Indicators
- Smart code badges
- Category color coding
- Enabled/disabled states
- Version badges

## 📊 Data Storage

### Dynamic Data Keys
```
FIN_DNA.RULES.POS_SALE.v1
FIN_DNA.RULES.POS_SALE.v2
FIN_DNA.RULES.PAYMENT.CARD.v1
FIN_DNA.RULES.INVENTORY.COGS.v1
FIN_DNA.RULES.COMMISSION.ACCRUAL.v1
```

### Example Stored Rule
```json
{
  "key": "FIN_DNA.RULES.POS_SALE.v1",
  "title": "POS Sale Posting",
  "description": "Posts point-of-sale transactions to revenue accounts",
  "category": "pos",
  "enabled": true,
  "smart_code": "HERA.FIN.POSTING.POS.SALE.v1",
  "applies_to": ["HERA.POS.SALE.v1"],
  "conditions": {},
  "mappings": [
    {
      "account": "1100",
      "side": "debit",
      "amount_source": "gross",
      "multiplier": 1,
      "memo": "Cash receipt"
    },
    {
      "account": "4100",
      "side": "credit",
      "amount_source": "net",
      "multiplier": 1,
      "memo": "Sales revenue"
    }
  ],
  "last_run_at": "2025-01-15T10:30:00Z",
  "version": "v1",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

## 🧪 Testing

### Unit Tests
```bash
npm test tests/unit/financeRules.schemas.spec.ts
```

### E2E Tests
```bash
npm run test:e2e tests/e2e/finance-rules-viewer.spec.ts
```

## 🚨 Guardrails

1. **No Schema Changes**: Everything in Sacred Six tables
2. **Organization Isolation**: Every operation includes `organization_id`
3. **Smart Code Validation**: Must start with `HERA.`
4. **Version Safety**: Keys are immutable, use cloning
5. **Required Mappings**: At least one mapping per rule
6. **Required Applies To**: At least one transaction code

---

**Smart Code**: `HERA.UI.FINANCE.POSTING_RULES_VIEWER.v1`