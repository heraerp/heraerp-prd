# Fiscal Year & Year-End Closing - Quick Reference

## 🚀 Quick Start

### Setup Fiscal Year (30 seconds)
```typescript
import { createFiscalYearManager } from '@/lib/dna/fiscal-year/universal-fiscal-year';

const fiscalManager = createFiscalYearManager(organizationId);

// Calendar Year (Most Common)
await fiscalManager.setupFiscalYear({
  fiscalType: 'calendar',
  currentYear: 2025
});

// Fiscal Year (Custom Start)
await fiscalManager.setupFiscalYear({
  fiscalType: 'fiscal',
  startMonth: 7,  // July start
  currentYear: 2025
});

// Custom Periods (Retail)
await fiscalManager.setupFiscalYear({
  fiscalType: 'custom',
  periodsPerYear: 13,
  customPeriodLength: 28
});
```

### Execute Year-End Closing
```typescript
// Simple closing
const result = await fiscalManager.executeYearEndClosing(2025);

// With options
const result = await fiscalManager.executeYearEndClosing(
  2025,
  new Date('2025-12-31'),
  {
    revenuePattern: '4%',      // Revenue accounts pattern
    expensePattern: '5%',      // Expense accounts pattern
    includeOtherIncome: true,  // Include accounts 6xxx
    includeOtherExpenses: true // Include accounts 7xxx
  }
);
```

## 📋 Common Commands

### MCP CLI Tools
```bash
# Setup fiscal year for organization
node setup-fiscal-year.js --org-id "your-org-id" --type calendar --year 2025

# Check fiscal periods
node hera-query.js fiscal-periods --year 2025

# Run year-end closing
node execute-closing.js --org-id "your-org-id" --year 2025

# Generate closing reports
node fiscal-reports.js year-end --org-id "your-org-id" --year 2025
```

### API Endpoints
```typescript
// Get fiscal configuration
GET /api/v1/fiscal/configuration?year=2025

// Get fiscal periods
GET /api/v1/fiscal/periods?year=2025

// Update period status
PUT /api/v1/fiscal/periods/:periodId
{
  "status": "closed"
}

// Execute closing
POST /api/v1/fiscal/year-end-closing
{
  "fiscalYear": 2025,
  "closingDate": "2025-12-31"
}
```

## 🔧 Configuration Options

### Fiscal Types
| Type | Description | Start | End | Periods |
|------|-------------|-------|-----|---------|
| `calendar` | Standard Jan-Dec | Jan 1 | Dec 31 | 12 |
| `fiscal` | Custom 12-month | Configurable | +12 months | 12 |
| `custom` | 4-4-5, 13-period, etc | Varies | Varies | 12-13 |

### Period Status
- `open` - Transactions allowed
- `current` - Active period
- `closed` - No new transactions

### Closing Account Configuration
```typescript
{
  retainedEarningsAccount: '3200000',  // P&L transferred here
  currentEarningsAccount: '3300000',   // Current year P&L
  revenuePattern: '4%',                // Revenue accounts
  expensePattern: '5%',                // Expense accounts
}
```

## 📊 Database Structure

### Fiscal Configuration Entity
```sql
core_entities:
  entity_type: 'fiscal_configuration'
  entity_code: 'FISCAL-CONFIG-2025'
  smart_code: 'HERA.FISCAL.CONFIG.CALENDAR.v1'

core_dynamic_data:
  fiscal_type: 'calendar'
  start_month: 1
  periods_per_year: 12
  current_year: 2025
  retained_earnings_account: '3200000'
```

### Fiscal Period Entity
```sql
core_entities:
  entity_type: 'fiscal_period'
  entity_code: 'FY2025-P01'
  smart_code: 'HERA.FISCAL.PERIOD.1.v1'

core_dynamic_data:
  period_number: 1
  period_status: 'open'
  start_date: '2025-01-01'
  end_date: '2025-01-31'
```

### Closing Journal Entry
```sql
universal_transactions:
  transaction_type: 'journal_entry'
  transaction_code: 'JE-CLOSING-2025'
  smart_code: 'HERA.CLOSING.JE.YEAREND.v1'

universal_transaction_lines:
  -- If Profit:
  Line 1: DR Current Year Earnings
  Line 2: CR Retained Earnings
  
  -- If Loss:
  Line 1: DR Retained Earnings
  Line 2: CR Current Year Earnings
```

## 🎯 Smart Codes Reference

### Configuration Smart Codes
```
HERA.FISCAL.CONFIG.CALENDAR.v1    - Calendar year configuration
HERA.FISCAL.CONFIG.FISCAL.v1      - Fiscal year configuration
HERA.FISCAL.CONFIG.CUSTOM.v1      - Custom period configuration
```

### Period Smart Codes
```
HERA.FISCAL.PERIOD.{1-13}.v1      - Period entities
HERA.FISCAL.PERIOD.STATUS.v1      - Period status changes
HERA.FISCAL.PERIOD.LOCK.v1        - Period locking
```

### Closing Smart Codes
```
HERA.CLOSING.JE.YEAREND.v1        - Year-end closing entry
HERA.CLOSING.JE.INTERIM.v1        - Interim closing entry
HERA.CLOSING.JE.ADJUSTMENT.v1     - Closing adjustments
HERA.CLOSING.CHECKLIST.*.v1       - Checklist items
```

## ✅ Closing Checklist

### Pre-Closing (Required)
- [ ] Bank reconciliations complete
- [ ] Inventory count finished
- [ ] AR/AP reconciled
- [ ] Prepaid expenses adjusted
- [ ] Accruals booked
- [ ] Depreciation calculated

### Closing Execution
- [ ] Run trial balance
- [ ] Review P&L accounts
- [ ] Execute closing function
- [ ] Verify journal entry
- [ ] Check retained earnings

### Post-Closing
- [ ] Generate financial statements
- [ ] Create new fiscal year
- [ ] Archive documentation
- [ ] Distribute reports

## 🛠️ Common Operations

### Check if Posting Allowed
```typescript
const canPost = await fiscalManager.canPostToDate(transactionDate);
if (!canPost) {
  throw new Error('Period is closed for posting');
}
```

### Update Period Status
```typescript
// Close a period
await fiscalManager.updatePeriodStatus(periodId, 'closed');

// Reopen a period (requires permission)
await fiscalManager.updatePeriodStatus(periodId, 'open');
```

### Get Period Information
```typescript
const periods = await fiscalManager.getFiscalPeriods(2025);
const currentPeriod = periods.find(p => p.status === 'current');
```

### Rollover to New Year
```typescript
// Copy configuration from 2025 to 2026
await fiscalManager.rolloverFiscalYear(2025, 2026);
```

## 🎨 UI Components

### Year-End Closing Wizard
```tsx
import { YearEndClosingWizard } from '@/components/accounting/YearEndClosingWizard';

<YearEndClosingWizard 
  fiscalYear={2025}
  onComplete={(result) => {
    console.log('Net Income:', result.netIncome);
    console.log('Closing Entry:', result.closingEntryId);
  }}
/>
```

### Fiscal Period Grid
```tsx
import { FiscalPeriodGrid } from '@/components/accounting/FiscalPeriodGrid';

<FiscalPeriodGrid 
  fiscalYear={2025}
  onPeriodClick={(period) => {
    // Handle period selection
  }}
/>
```

## 🚨 Troubleshooting

### Common Issues

**"Period is closed"**
```typescript
// Check period status before posting
const period = await getPeriodForDate(transactionDate);
if (period.status === 'closed') {
  // Request approval or post to current period
}
```

**"Unbalanced closing entry"**
```typescript
// Ensure all accounts are properly classified
// Check that COA includes retained earnings account
// Verify revenue/expense patterns are correct
```

**"Cannot find fiscal configuration"**
```typescript
// Run setup if not exists
const config = await fiscalManager.getFiscalConfig(2025);
if (!config) {
  await fiscalManager.setupFiscalYear({ currentYear: 2025 });
}
```

## 📈 Best Practices

### 1. Monthly Soft Close
```typescript
// Run monthly to catch issues early
const monthlyClose = await fiscalManager.runSoftClose(
  currentMonth,
  { validateOnly: true }
);
```

### 2. Pre-Closing Validation
```typescript
// Always validate before closing
const validation = await fiscalManager.validateClosing(2025);
if (validation.errors.length > 0) {
  // Fix errors before proceeding
}
```

### 3. Backup Before Closing
```typescript
// Export data before major operations
const backup = await exportFiscalData(2025);
await saveBackup(backup, `fiscal-2025-pre-closing.json`);
```

## 🔗 Related Documentation

- [Universal Fiscal Year DNA Reference](/docs/UNIVERSAL-FISCAL-YEAR-DNA-REFERENCE.md)
- [Chart of Accounts Guide](/docs/UNIVERSAL-COA-DNA-REFERENCE.md)
- [Multi-Entity Consolidation](/docs/guides/consolidation)
- [Audit Preparation Guide](/docs/guides/audit-prep)

## 💡 Pro Tips

1. **Always test in development first** - Use a copy of production data
2. **Run closing during off-hours** - Minimize business disruption
3. **Keep documentation current** - Document any special procedures
4. **Review before executing** - Double-check all parameters
5. **Monitor the process** - Watch for any warnings or errors

---

*Need help? Contact fiscal-support@heraerp.com or use the in-app chat for immediate assistance.*