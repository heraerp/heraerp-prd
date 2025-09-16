# HERA Owner Reports System

## Smart Code: HERA.DOC.REPORTS.OWNER.v1

Production-grade reporting suite for salon owners with real-time financial insights, comprehensive drill-downs, and professional export capabilities.

## 🎯 Overview

The HERA Owner Reports system provides four core reports built on the universal Sacred Six architecture:

- **Daily Sales Report** - Hourly revenue breakdown with service/product mix
- **Monthly Sales Report** - Daily trends with growth analysis and forecasting  
- **Profit & Loss Statement** - Complete P&L with hierarchical grouping and comparisons
- **Balance Sheet** - Real-time balance sheet with equation validation and financial ratios

## 🏗️ Architecture

### Data Sources

All reports use the universal Sacred Six tables with zero schema drift:

```sql
-- Primary data sources (no custom tables)
universal_transactions        -- Transaction headers (sales, payments, journal entries)
universal_transaction_lines   -- Transaction details (line items, GL postings)
core_entities                -- Business objects (customers, products, GL accounts)
core_dynamic_data            -- Custom fields and policies
core_relationships           -- Entity connections and hierarchies
core_organizations           -- Multi-tenant isolation
```

### Finance DNA Integration

The reports automatically reflect Finance DNA effects:

- **Auto-Journal Posting** - GL entries from POS sales, appointments, payments
- **VAT Calculations** - Automatic 5% VAT computation on sales transactions  
- **Commission Tracking** - Staff commission calculations (40% of service revenue)
- **Cost Allocation** - Product costs and inventory movements
- **Multi-Currency Support** - AED, USD, EUR with automatic conversion

### Smart Code Classification

Every transaction includes intelligent business context:

```typescript
// Sales transactions
'HERA.SALON.POS.SALE.TXN.v1'         // POS sale with auto-journal
'HERA.SALON.APPOINTMENT.SERVICE.v1'   // Appointment completion
'HERA.SALON.PAYMENT.CASH.v1'         // Cash payment processing

// Financial postings (auto-generated)
'HERA.FIN.GL.REVENUE.SALE.v1'        // Revenue recognition
'HERA.FIN.GL.VAT.PAYABLE.v1'         // VAT liability
'HERA.FIN.GL.COMMISSION.EXP.v1'      // Staff commission expense
```

## 📊 Report Details

### 1. Daily Sales Report (`/reports/sales/daily`)

**Purpose**: Detailed analysis of daily revenue performance with hourly breakdown.

**Key Features**:
- Hourly revenue tracking (9 AM - 8 PM)
- Service vs product revenue split
- VAT collection monitoring
- Staff tip tracking
- Average ticket analysis
- Real-time drill-down to individual transactions

**Summary Cards**:
- Gross Revenue (including VAT)
- Net Revenue (excluding VAT)  
- Service Revenue (with mix %)
- Product Revenue (with mix %)
- VAT Collected (5% calculation)
- Tips Collected (staff gratuities)
- Transaction Count
- Average Ticket Size

**Filters**:
- Date picker (defaults to today)
- Branch selection (multi-location support)
- Include/exclude tips toggle
- Service-only or product-only views

### 2. Monthly Sales Report (`/reports/sales/monthly`)

**Purpose**: Monthly performance trends with daily breakdown and growth analysis.

**Key Features**:
- Daily revenue progression
- Week-over-week comparisons
- Month-to-date vs targets
- Seasonal trend analysis
- Growth vs previous month
- Working days adjustment

**Summary Cards**:
- Total Monthly Revenue
- Average Daily Revenue  
- Monthly Growth Rate
- Working Days Count
- Best/Worst Day Performance
- Monthly Targets vs Actual

**Trend Analysis**:
- Revenue sparkline chart
- Daily variance indicators
- Weekly rolling averages  
- Seasonal adjustment factors

### 3. Profit & Loss Statement (`/reports/finance/pnl`)

**Purpose**: Complete financial performance with hierarchical account grouping.

**Account Grouping Structure**:
```
REVENUE
├── Service Revenue (Hair services, treatments)
├── Product Revenue (Retail products, care items)
└── Other Revenue (Training, rentals)

COST OF GOODS SOLD  
├── Product Costs (Direct product costs)
└── Service Costs (Materials, supplies)

GROSS PROFIT (Revenue - COGS)

OPERATING EXPENSES
├── Staff Costs (Salaries, commissions, benefits)
├── Facility Costs (Rent, utilities, maintenance)  
├── Marketing (Advertising, promotions)
└── Administrative (Insurance, software, professional fees)

OPERATING PROFIT (Gross Profit - Operating Expenses)

OTHER INCOME/EXPENSES
├── Interest Income
└── Interest Expense

NET INCOME (Operating Profit + Other)
```

**Key Features**:
- Expandable/collapsible account groups
- Percentage of revenue calculations
- Prior period comparisons (optional)
- Account-level drill-downs to transactions
- Consolidated vs branch-specific views
- Margin analysis (gross, operating, net)

### 4. Balance Sheet (`/reports/finance/balance-sheet`)

**Purpose**: Real-time financial position with balance equation validation.

**Account Structure**:
```
ASSETS
├── Current Assets
│   ├── Cash in Bank
│   ├── Accounts Receivable  
│   ├── Inventory - Products
│   └── Prepaid Expenses
└── Fixed Assets
    ├── Salon Equipment
    ├── Furniture & Fixtures
    └── Accumulated Depreciation

LIABILITIES  
├── Current Liabilities
│   ├── Accounts Payable
│   ├── Accrued Salaries
│   └── VAT Payable
└── Long-term Liabilities
    └── Equipment Loans

EQUITY
├── Owner Capital
└── Retained Earnings
```

**Balance Validation**:
- Real-time equation check: Assets = Liabilities + Equity
- Tolerance-based validation (±0.01 AED)
- Visual balance status indicator
- Automatic difference calculation

**Financial Ratios** (calculated automatically):
- Current Ratio (Current Assets ÷ Current Liabilities)
- Debt-to-Equity Ratio (Total Liabilities ÷ Total Equity)
- Asset composition percentages

## 🔄 Filters and Drill-downs

### Universal Filter System

All reports support consistent filtering:

```typescript
interface ReportFilters {
  organization_id: string    // Always present (multi-tenant isolation)
  branch_id?: string        // Branch-specific reporting
  date_range: {
    from: string            // YYYY-MM-DD format
    to: string              // YYYY-MM-DD format
  }
  currency: string          // AED, USD, EUR (defaults to organization currency)
  include_tips: boolean     // Sales reports only
  consolidated: boolean     // Financial reports only
}
```

### Drill-down Capabilities

Every report supports multiple drill-down levels:

**Level 1: Summary Cards**
- Click any summary metric to view filtered transactions
- Example: Click "Service Revenue" → Show all service transactions

**Level 2: Table Rows**  
- Click any table row amount to view contributing transactions
- Example: Click "10:00 AM" revenue → Show hourly transactions

**Level 3: Transaction Details**
- Click individual transaction to view complete details:
  - Transaction header with smart code
  - All line items with descriptions
  - Related entities (customer, staff, products)
  - Auto-generated journal entries (if applicable)

**Level 4: Smart Code Analysis**
- Every transaction shows its smart code
- Smart codes reveal:
  - Business context and classification
  - Auto-journal posting rules applied
  - Industry-specific processing logic

### Drill-down UI Components

```typescript
// Drill-down drawer with transaction list
<DrilldownDrawer
  title="Service Revenue Transactions"
  subtitle="March 15, 2024 • 10:00-11:00 AM"
  data={transactionList}
  selectedTransaction={transactionDetail}
  onTransactionClick={handleTransactionClick}
  currency="AED"
/>

// Transaction detail view with smart codes
<TransactionDetail>
  <SmartCodeBadge code="HERA.SALON.POS.SALE.TXN.v1" />
  <TransactionLines items={lineItems} />
  <AutoJournalEntries entries={glEntries} />
</TransactionDetail>
```

## 📤 Export and Print

### Export Formats

**CSV Export** (Built-in):
- Header with report metadata
- Summary section with key metrics
- Detailed data rows with all columns
- Footer with currency and generation timestamp

**Excel Export** (Optional backend integration):
- Formatted spreadsheet with styling
- Multiple sheets (Summary + Details)
- Charts and formulas embedded
- Professional layout suitable for distribution

**PDF Export** (Optional backend integration):
- Print-optimized formatting
- Company header and branding
- Page breaks and section separators
- Professional financial statement layout

### Print Functionality

**Print Styles**:
```css
@media print {
  /* Force black text on white background */
  body { color: black !important; background: white !important; }
  
  /* Hide interactive elements */
  button, .no-print { display: none !important; }
  
  /* Table formatting */
  table { border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #333; padding: 4px 6px; }
  
  /* Amount columns */
  .amount { text-align: right; font-family: monospace; }
  
  /* Page breaks */
  .page-break-before { page-break-before: always; }
}
```

**Print Header Components**:
- Organization logo and details
- Report title and period  
- Generation timestamp
- Applied filters summary
- Currency and measurement units

**Print Footer**:
- Page numbers
- Disclaimer text ("All amounts in AED")
- HERA system attribution
- Organization contact information

## 🎨 Styling and Theme

### Salon Theme Colors

All reports use the consistent salon theme:

```css
/* Primary palette */
--primary-violet: #8B5CF6    /* Main brand color */
--primary-pink: #EC4899      /* Secondary accent */
--emerald-revenue: #10B981   /* Positive revenue indicators */
--red-expense: #EF4444       /* Negative/expense indicators */
--blue-neutral: #3B82F6      /* Neutral metrics */

/* Background gradients */
.report-header {
  background: linear-gradient(135deg, 
    hsl(252 94.2% 85.1%) 0%, 
    hsl(314 100% 86.7%) 100%);
}

/* Card styling */
.report-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid hsl(252 30% 85%);
  backdrop-filter: blur(10px);
}
```

### Accessibility Compliance (WCAG 2.1 AA)

**Keyboard Navigation**:
- All interactive elements focusable with Tab
- Clear focus indicators on all controls
- Logical tab order throughout interface

**Screen Reader Support**:  
- Table headers with proper `scope` attributes
- Form labels explicitly associated with inputs
- Descriptive button text and ARIA labels
- Status messages announced to screen readers

**Color Contrast**:
- All text meets 4.5:1 contrast ratio minimum
- Color is never the only indicator of meaning
- High contrast mode support for accessibility tools

**Visual Design**:
- Consistent typography hierarchy
- Adequate white space and visual separation
- Clear visual grouping of related elements
- Responsive design for all device sizes

## 🚀 Performance and Caching

### Query Optimization

**React Query Integration**:
```typescript
// Stable query keys for optimal caching
const queryKey = [
  'reports', 
  reportType,           // 'daily_sales' | 'monthly_sales' | 'pnl' | 'balance_sheet'
  organizationId, 
  JSON.stringify(filters)
]

// Query configuration
const queryConfig = {
  staleTime: 5 * 60 * 1000,      // 5 minutes
  cacheTime: 30 * 60 * 1000,     // 30 minutes
  refetchOnWindowFocus: false,    // Prevent excessive refetching
  retry: 2                        // Retry failed requests
}
```

**Pagination for Drill-downs**:
- Transaction lists paginated at 100 records per page
- Infinite scroll for smooth user experience
- Server-side filtering to reduce data transfer
- Optimistic UI updates for responsive feel

### Loading States

**Progressive Loading**:
1. Summary cards load first (fastest queries)
2. Table data loads second (more complex aggregations)  
3. Drill-down data loads on-demand (detailed transactions)

**Loading Indicators**:
- Skeleton screens during initial load
- Shimmer effects for table rows
- Progress bars for export operations
- Spinner overlays for drill-down drawers

### Error Handling

**Graceful Degradation**:
- Failed summary cards show "N/A" instead of breaking
- Table shows cached data with error indicator if refresh fails
- Export operations show clear error messages with retry options
- Network errors display user-friendly messages with suggested actions

## 🧪 Testing Strategy

### Unit Tests (`/tests/unit/reports.calculations.spec.ts`)

**Math Validation**:
- Sales totals calculation across multiple rows
- P&L subtotal grouping (revenue, COGS, expenses, other)
- Balance sheet equation validation (Assets = Liabilities + Equity)
- Service/product mix percentage calculations
- Currency formatting across different locales

**Edge Cases**:
- Empty data sets (zero transactions)
- Negative amounts (refunds, returns)
- Large numbers (million+ values)
- Precision handling (decimal places)
- Invalid input handling

**Example Test**:
```typescript
it('should calculate P&L subtotals correctly', () => {
  const pnlRows = [
    { group: 'revenue', amount: -100000, is_subtotal: false },
    { group: 'cogs', amount: 30000, is_subtotal: false },
    { group: 'expenses', amount: 25000, is_subtotal: false }
  ]
  
  const subtotals = ReportCalculations.calculatePnLSubtotals(pnlRows)
  
  expect(subtotals.revenue).toBe(100000)
  expect(subtotals.gross_profit).toBe(70000)
  expect(subtotals.net_income).toBe(45000)
})
```

### E2E Tests (`/tests/e2e/reports-flow.spec.ts`)

**Complete User Journeys**:

1. **Daily Sales Flow**:
   - Login → Navigate to daily sales
   - Change date filter → Verify data updates
   - Toggle service/product filters → Verify filtering
   - Click drill-down → Verify transaction drawer opens
   - Export CSV → Verify download starts
   - Print report → Verify print styles apply

2. **P&L Flow**:
   - Navigate to P&L report
   - Change date range → Verify data refresh  
   - Expand/collapse account groups → Verify UI updates
   - Click account details → Verify drill-down drawer
   - Verify smart codes visible in transaction details
   - Toggle consolidated view → Verify branch filtering

3. **Balance Sheet Flow**:
   - Navigate to balance sheet
   - Change as-of date → Verify balance recalculation
   - Verify balance check indicator (✅ or ⚠️)
   - Test group expansion/collapse
   - Drill-down on account balances
   - Verify print preview functionality

**Cross-browser Testing**:
- Chrome, Firefox, Safari, Edge
- Mobile responsive testing on iOS/Android
- Keyboard-only navigation testing
- Screen reader compatibility testing

## 🔧 Configuration and Customization

### Organization-specific Settings

```typescript
interface ReportSettings {
  currency: 'AED' | 'USD' | 'EUR' | 'SAR'
  locale: 'en-AE' | 'en-US' | 'ar-AE'
  fiscal_year_start: number        // 1-12 (month)
  vat_rate: number                 // 0.05 for UAE
  working_days: number[]           // [1,2,3,4,5] = Mon-Fri
  business_hours: {
    open: string                   // "09:00"
    close: string                  // "20:00"
  }
  chart_of_accounts: {
    revenue_accounts: string[]      // ['4100', '4200', '4300']
    cogs_accounts: string[]         // ['5100', '5200']
    expense_accounts: string[]      // ['6000'-'6999']
  }
}
```

### Customizable Elements

**Branding**:
- Organization logo in print headers
- Custom color schemes (maintaining accessibility)
- Company-specific disclaimers and footers

**Account Groupings**:
- Custom P&L account hierarchies
- Industry-specific account naming
- Configurable subtotal calculations

**KPI Calculations**:
- Custom performance metrics
- Industry benchmarking comparisons
- Target vs actual variance thresholds

## 🚦 Deployment Checklist

### ✅ Pre-deployment Validation

**Build Process**:
- [ ] `npm run build` completes without errors
- [ ] TypeScript strict mode passes (0 errors)
- [ ] All unit tests pass (`npm run test`)
- [ ] E2E tests pass in CI environment
- [ ] Bundle size under acceptable limits (< 2MB total)

**Functionality Testing**:
- [ ] All four report types load without errors
- [ ] Date filters work correctly across timezones  
- [ ] Branch filtering applies properly (if multi-location)
- [ ] Drill-downs open and display transaction details
- [ ] Smart codes visible in transaction details
- [ ] CSV export generates valid files
- [ ] Print styles render correctly

**Accessibility Testing**:
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces content properly
- [ ] Color contrast meets WCAG AA standards (4.5:1)
- [ ] All tables have proper headers and captions
- [ ] Form labels are properly associated

**Performance Testing**:
- [ ] Reports load within 3 seconds on 3G connection
- [ ] Large datasets (1000+ transactions) handle gracefully
- [ ] Memory usage remains stable during extended use
- [ ] No memory leaks in React components

**Security Validation**:
- [ ] Organization isolation enforced (no cross-tenant data)
- [ ] Authentication required for all report access
- [ ] API endpoints protected with proper authorization
- [ ] No sensitive data in client-side logs or errors

### 🔐 Production Hardening

**API Security**:
```typescript
// All report endpoints must include organization filtering
app.get('/api/v1/reports/:type', authenticateUser, (req, res) => {
  const { organization_id } = req.user
  // Organization ID automatically included in all queries
  // No way to access data from other organizations
})
```

**Data Protection**:
- All financial data encrypted at rest
- TLS 1.3 encryption for data in transit
- No sensitive data in URL parameters
- Audit trail for all report access

**Error Handling**:
```typescript
// Production error responses (no sensitive details)
try {
  const reportData = await generateReport(filters)
  res.json({ success: true, data: reportData })
} catch (error) {
  logger.error('Report generation failed', { 
    organizationId, 
    reportType, 
    error: error.message 
  })
  res.status(500).json({ 
    success: false, 
    error: 'Report temporarily unavailable' 
  })
}
```

## 📈 Monitoring and Analytics

### Key Metrics to Track

**Usage Analytics**:
- Report generation frequency by type
- Most popular filters and date ranges
- Export format preferences
- Average time spent in drill-down views

**Performance Metrics**:
- Report generation time (target: <3s)
- Database query execution time
- Cache hit/miss ratios
- Error rates by report type

**Business Metrics**:
- Data accuracy vs manual calculations
- User satisfaction scores
- Time saved vs manual reporting
- Adoption rate across organizations

### Health Monitoring

**Database Performance**:
```sql
-- Monitor slow queries affecting reports
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
WHERE query LIKE '%universal_transactions%'
ORDER BY mean_time DESC;
```

**Application Monitoring**:
```typescript
// Report generation telemetry
import { trackEvent } from '@/lib/analytics'

export function trackReportGeneration(reportType: string, duration: number) {
  trackEvent('report_generated', {
    report_type: reportType,
    duration_ms: duration,
    success: true
  })
}
```

---

## 🎉 Summary

The HERA Owner Reports system delivers professional-grade financial reporting with:

- **Zero Schema Changes** - Built entirely on Sacred Six tables
- **Real-time Data** - Live integration with Finance DNA auto-journal posting  
- **Complete Drill-downs** - From summaries to individual transactions with smart codes
- **Professional Export** - CSV, Excel, and print with proper formatting
- **Accessibility Compliant** - WCAG 2.1 AA standards throughout
- **Production Ready** - Comprehensive testing and monitoring

The system empowers salon owners with the financial insights they need to make data-driven business decisions while maintaining the architectural purity that makes HERA universally scalable.

**Ready for production deployment with confidence.** ✅