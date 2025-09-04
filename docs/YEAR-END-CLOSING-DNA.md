# HERA Year-End Closing DNA Pattern 🧬

## Overview

HERA's Year-End Closing DNA provides a complete, automated solution for fiscal year-end closing processes. This DNA pattern handles the entire closing cycle, from reconciliation to profit/loss carry forward, using HERA's universal 6-table architecture.

## Fiscal Year Configuration

### 1. **Fiscal Year Settings**
Your salon group is configured with:
- **Fiscal Year Type**: Calendar Year (January 1 - December 31)
- **Fiscal Periods**: 12 monthly periods
- **Current Fiscal Year**: 2025
- **Closing Accounts**:
  - Retained Earnings: 3200000
  - Current Year Earnings: 3300000

### 2. **Data Structure**

#### Fiscal Configuration Entity
```typescript
{
  entity_type: 'fiscal_configuration',
  entity_code: 'FISCAL-CONFIG-2025',
  smart_code: 'HERA.SALON.FISCAL.CONFIG.CALENDAR.v1',
  // Dynamic data fields:
  fiscal_year_start: '01-01',
  fiscal_year_end: '12-31',
  fiscal_year_type: 'calendar',
  current_fiscal_year: 2025,
  periods_per_year: 12
}
```

#### Fiscal Periods
```typescript
{
  entity_type: 'fiscal_period',
  entity_code: 'FY2025-P01', // through FY2025-P12
  smart_code: 'HERA.SALON.FISCAL.PERIOD.1.v1',
  // Dynamic data:
  period_number: 1,
  period_status: 'open', // open, current, closed
  start_date: '2025-01-01',
  end_date: '2025-01-31'
}
```

## Year-End Closing Process

### 1. **Pre-Closing Checklist** ✅

The system includes 15 checklist items stored as entities:

| Code | Task | Category |
|------|------|----------|
| YEC-01 | Reconcile all bank accounts | reconciliation |
| YEC-02 | Complete physical inventory count | inventory |
| YEC-03 | Review and adjust prepaid expenses | adjustments |
| YEC-04 | Accrue unpaid expenses | adjustments |
| YEC-05 | Calculate and book depreciation | adjustments |
| YEC-06 | Reconcile inter-branch accounts | reconciliation |
| YEC-07 | Review customer deposits and gift cards | liabilities |
| YEC-08 | Calculate commission payables | liabilities |
| YEC-09 | Review and adjust VAT accounts | tax |
| YEC-10 | Generate trial balance | reporting |
| YEC-11 | Review P&L by service category | reporting |
| YEC-12 | Close revenue accounts to P&L | closing |
| YEC-13 | Close expense accounts to P&L | closing |
| YEC-14 | Transfer P&L to retained earnings | closing |
| YEC-15 | Generate final financial statements | reporting |

### 2. **Automated Closing Steps**

The Year-End Closing DNA performs these steps automatically:

#### Step 1: Calculate Total Revenue
```sql
SELECT SUM(line_amount) 
FROM universal_transaction_lines
WHERE account_code LIKE '4%' -- All revenue accounts
AND fiscal_year = 2025
```

#### Step 2: Calculate Total Expenses
```sql
SELECT SUM(line_amount) 
FROM universal_transaction_lines
WHERE account_code LIKE '5%' -- All expense accounts
AND fiscal_year = 2025
```

#### Step 3: Calculate Net Income/Loss
```
Net Income = Total Revenue - Total Expenses
```

#### Step 4: Create Closing Journal Entry

**If Profit:**
```
DR: Current Year Earnings (3300000)    XXX
    CR: Retained Earnings (3200000)        XXX
```

**If Loss:**
```
DR: Retained Earnings (3200000)        XXX
    CR: Current Year Earnings (3300000)    XXX
```

### 3. **Multi-Branch Consolidation**

For your salon group with head office and branches:

1. **Branch Closing**: Each branch runs its own year-end closing
2. **Inter-Branch Elimination**: Head office eliminates inter-branch transactions
3. **Consolidated Closing**: Group-level P&L transferred to consolidated retained earnings

## Using the Year-End Closing DNA

### 1. **Via SQL Function**
```sql
-- Close fiscal year 2025 for Park Regis branch
SELECT hera_year_end_closing(
  'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', -- Park Regis org ID
  2025,                                     -- Fiscal year
  '2025-12-31'                             -- Closing date
);
```

### 2. **Via API**
```typescript
// Using Universal API
const closingResult = await universalApi.executeYearEndClosing({
  organizationId: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
  fiscalYear: 2025,
  closingDate: '2025-12-31'
});
```

### 3. **Via UI Component**
```typescript
import { YearEndClosingWizard } from '@/components/accounting/YearEndClosingWizard';

<YearEndClosingWizard 
  organizationId={currentOrganization.id}
  fiscalYear={2025}
  onComplete={(result) => {
    console.log('Closing completed:', result);
  }}
/>
```

## Period Management

### Opening/Closing Periods
```typescript
// Close a period
await universalApi.updateFiscalPeriod({
  periodId: 'period-uuid',
  status: 'closed'
});

// Prevent posting to closed periods
if (period.status === 'closed') {
  throw new Error('Cannot post to closed period');
}
```

### Rolling Forward
When closing a year, the system automatically:
1. Sets all periods to 'closed' status
2. Creates new periods for the next fiscal year
3. Sets January of new year as 'current' period
4. Zeroes out P&L accounts for fresh start

## Reporting

### Year-End Reports Available:
1. **Final Trial Balance** - Before and after closing
2. **Income Statement** - Annual P&L by branch
3. **Balance Sheet** - As of year-end date
4. **Retained Earnings Statement** - Movement analysis
5. **Closing Journal Entries** - Audit trail

### Branch vs Consolidated Reports:
```typescript
// Branch report
const branchReport = await generateYearEndReport({
  organizationId: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
  reportType: 'income_statement',
  fiscalYear: 2025
});

// Consolidated report
const consolidatedReport = await generateYearEndReport({
  organizationId: '849b6efe-2bf0-438f-9c70-01835ac2fe15', // Head office
  reportType: 'consolidated_income_statement',
  fiscalYear: 2025,
  includeSubsidiaries: true
});
```

## Best Practices

1. **Pre-Closing Review**
   - Run trial balance to verify all accounts balance
   - Review unusual transactions
   - Ensure all accruals are booked

2. **Backup Before Closing**
   - Export all transaction data
   - Document account balances
   - Save closing checklist status

3. **Post-Closing Verification**
   - Verify P&L accounts show zero balance
   - Confirm retained earnings updated correctly
   - Generate and review financial statements

4. **Multi-Branch Considerations**
   - Close branches before head office
   - Verify inter-branch accounts net to zero
   - Run consolidated reports after all closings

## Smart Codes for Year-End Closing

```typescript
// Fiscal Configuration
'HERA.SALON.FISCAL.CONFIG.CALENDAR.v1'
'HERA.SALON.FISCAL.PERIOD.*.v1'
'HERA.SALON.CLOSING.CONFIG.v1'

// Closing Transactions
'HERA.SALON.CLOSING.JE.YEAREND.v1'
'HERA.SALON.CLOSING.JE.INTERCO.v1'
'HERA.SALON.CLOSING.JE.CONSOLIDATION.v1'

// Closing Status
'HERA.SALON.CLOSING.STATUS.STARTED.v1'
'HERA.SALON.CLOSING.STATUS.COMPLETED.v1'
'HERA.SALON.CLOSING.STATUS.REVERSED.v1'
```

## Integration with HERA Features

### 1. **Auto-Journal Engine**
- Year-end adjustments automatically create journal entries
- Accruals and deferrals handled by smart rules

### 2. **Multi-Tenant Security**
- Each organization's closing is completely isolated
- No data leakage between branches

### 3. **Audit Trail**
- Every closing step logged with timestamp
- Reversal capability with full tracking

### 4. **Universal Architecture**
- Uses standard 6-table structure
- No special tables or schema changes needed

## Troubleshooting

### Common Issues:

1. **"Cannot close period with unreconciled items"**
   - Review reconciliation status
   - Clear pending transactions

2. **"Inter-branch accounts don't balance"**
   - Run inter-branch reconciliation report
   - Verify all transfers are matched

3. **"Prior year adjustment needed"**
   - Use special adjustment period (Period 13)
   - Create manual journal entry with appropriate smart code

## Summary

HERA's Year-End Closing DNA provides:
- ✅ Complete fiscal year management
- ✅ Automated closing processes
- ✅ Multi-branch consolidation
- ✅ Full audit trail
- ✅ Integrated with universal architecture
- ✅ No custom tables needed

Your salon group now has enterprise-grade year-end closing capabilities that handle the complexity of multi-branch operations while maintaining the simplicity of HERA's universal design!