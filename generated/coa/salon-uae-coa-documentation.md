# Salon UAE - Chart of Accounts Documentation

## Overview

This Chart of Accounts (COA) has been generated using HERA DNA COA system specifically for a Beauty & Wellness Salon operating in the United Arab Emirates. The COA is fully compliant with UAE regulations including VAT requirements and follows IFRS standards.

## Key Features

### 🇦🇪 UAE Compliance
- **VAT Ready**: Input (1251) and Output (2251) VAT accounts at 5%
- **Gratuity Provisions**: According to UAE Labor Law
- **End of Service Benefits**: Proper accrual accounts
- **Multi-Currency Support**: AED as primary currency

### 💅 Salon Industry Specific
- **Service Categories**: Hair, Nails, Spa, Facial, Makeup, Bridal, Men's Grooming
- **Commission Tracking**: Stylist commission accounts
- **Tips Management**: Tips receivable and payable accounts
- **Package & Membership**: Deferred revenue recognition
- **Gift Cards**: Liability tracking with breakage revenue

## Account Structure

### 1000-1999: Assets
- **1100s**: Cash & Bank Accounts
  - Petty Cash, Registers, Bank Accounts
  - Credit Card & Digital Wallet Receivables
- **1200s**: Receivables
  - Service, Package, Gift Card, Insurance Receivables
  - VAT Input Receivable
- **1300s**: Inventory
  - Retail Products, Professional Products, Supplies
- **1600s**: Fixed Assets
  - Salon Equipment (Hair/Spa), Furniture, Computers
- **1700s**: Accumulated Depreciation

### 2000-2999: Liabilities
- **2100s**: Current Liabilities
  - Accounts Payable, Commission Payable, Tips Payable
- **2200s**: Deferred Revenue
  - Unearned Service Revenue, Gift Cards, Packages
  - VAT Output Payable
- **2300s**: Payroll Liabilities
  - Salaries, Gratuity, Leave, EOSB

### 3000-3999: Equity
- Share Capital, Retained Earnings, Current Year Earnings, Drawings

### 4000-4999: Revenue
- **4100s**: Service Revenue (by category)
- **4200s**: Product Sales
- **4300s**: Package & Membership Revenue
- **4900s**: Revenue Adjustments (Discounts, Refunds)

### 5000-5999: Cost of Sales
- **5100s**: Direct Service Costs
  - Products Used, Supplies, Commissions
- **5200s**: Product COGS

### 6000-6999: Operating Expenses
- **6100s**: Staff Costs (Non-Commission)
- **6200s**: Occupancy Costs (Rent, Utilities)
- **6300s**: Marketing & Advertising
- **6400s**: Administrative Expenses
- **6500s**: Equipment & Depreciation

## Smart Code System

Each account has a unique Smart Code following the pattern:
```
HERA.FIN.GL.UAE.SALON.{CATEGORY}.{SUBCATEGORY}.v1
```

Examples:
- `HERA.FIN.GL.UAE.SALON.REV.HAIR.v1` - Hair Service Revenue
- `HERA.FIN.GL.UAE.SALON.LIAB.COMMISSION.v1` - Commission Payable
- `HERA.FIN.GL.UAE.SALON.ASSET.VAT.INPUT.v1` - VAT Input Receivable

## Auto-Journal Integration

The COA includes pre-configured auto-journal rules for common salon transactions:

### Service Sale Transaction
```
When: Service completed
DR: Cash/Card (1110-1150)
CR: Service Revenue (4110-4170)
CR: VAT Output Payable (2251) @ 5%
```

### Commission Accrual
```
When: Service revenue recognized
DR: Commission Expense (5130)
CR: Commission Payable (2150)
```

### Gift Card Sale
```
When: Gift card purchased
DR: Cash/Card (1110-1150)
CR: Gift Card Liability (2220)
```

### Package Sale
```
When: Package sold
DR: Cash/Card (1110-1150)
CR: Package Liability (2230)
```

## KPI Tracking

Built-in accounts support key salon metrics:

1. **Service Mix Analysis**
   - Revenue by service category
   - Average ticket size tracking

2. **Commission Ratios**
   - Commission % by stylist
   - Commission vs revenue analysis

3. **Product Margins**
   - Retail product profitability
   - Service product consumption

4. **Customer Loyalty**
   - Gift card utilization
   - Package redemption rates

## Implementation Steps

1. **Replace Organization ID**
   ```sql
   -- Replace ${organizationId} with your actual organization UUID
   ```

2. **Execute SQL Script**
   ```bash
   psql -d your_database -f salon-uae-coa.sql
   ```

3. **Verify Account Creation**
   ```sql
   SELECT COUNT(*) FROM core_entities 
   WHERE entity_type = 'gl_account' 
   AND organization_id = 'your-org-id';
   -- Expected: 92 accounts
   ```

4. **Configure Opening Balances**
   - Add opening balances via journal entries
   - Ensure balance sheet balances

5. **Test Auto-Journal Rules**
   - Create test service sale
   - Verify automatic posting

## Customization Options

### Add Service Categories
```sql
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata)
VALUES ('${organizationId}', 'gl_account', '4180', 'Laser Treatment Revenue', 
        'HERA.FIN.GL.UAE.SALON.REV.LASER.v1',
        '{"account_type": "revenue", "service_category": "laser", "vat_applicable": true}');
```

### Add Expense Categories
```sql
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata)
VALUES ('${organizationId}', 'gl_account', '6350', 'Influencer Marketing', 
        'HERA.FIN.GL.UAE.SALON.EXP.INFLUENCER.v1',
        '{"account_type": "expense", "expense_type": "operating"}');
```

## Best Practices

1. **Daily Operations**
   - Close cash register daily
   - Reconcile tips daily
   - Track product usage

2. **Monthly Close**
   - Accrue commissions
   - Update package liabilities
   - Calculate VAT payable

3. **Reporting**
   - Service revenue by category
   - Stylist performance reports
   - Product profitability analysis

## Support

For assistance with this COA:
- Documentation: [HERA Universal COA DNA Guide](/docs/universal-coa-dna)
- API Reference: [Universal API Documentation](/docs/api/universal)
- Support: support@heraerp.com