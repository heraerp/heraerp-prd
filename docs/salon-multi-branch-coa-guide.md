# HERA Universal COA - Multi-Branch Salon Business Guide

## Overview

This guide explains how to use HERA's Universal Chart of Accounts system for a multi-branch salon business with full IFRS compliance and consolidation capabilities.

## Organizations Structure

### Head Office
- **Name**: Salon Group
- **ID**: `849b6efe-2bf0-438f-9c70-01835ac2fe15`
- **Role**: Consolidated reporting, inter-branch coordination
- **Special Accounts**: Consolidation accounts (9000000 series)

### Branch 1
- **Name**: Hair Talkz • Park Regis Kris Kin (Karama)
- **ID**: `e3a9ff9e-bb83-43a8-b062-b85e7a2b4258`
- **Special Accounts**: Inter-branch receivables/payables

### Branch 2
- **Name**: Hair Talkz • Mercure Gold (Al Mina Rd)
- **ID**: `0b1b37cd-4096-4718-8cd4-e370f234005b`
- **Special Accounts**: Inter-branch receivables/payables

## Chart of Accounts Structure

### 1. Assets (1000000-1999999)

#### Current Assets (1100000-1199999)
- **Cash & Cash Equivalents**
  - `1111000` - Petty Cash - Salon (Branch specific)
  - `1111100` - Cash Register - Hair Services (Branch specific)
  - `1111200` - Cash Register - Product Sales (Branch specific)
  - `1112000` - Bank Account - Operating
  - `1113000` - Bank Account - Payroll

- **Receivables**
  - `1121000` - Customer Receivables - Services (Branch specific)
  - `1122000` - Customer Receivables - Products (Branch specific)
  - `1123000` - Gift Card Receivables (Branch specific)
  - `1125000` - Staff Advances (Branch specific)
  - `1128000` - Inter-Branch Receivables (Branches only)

- **Inventory**
  - `1131000` - Hair Care Products (Branch specific)
  - `1132000` - Hair Color Products (Branch specific)
  - `1133000` - Styling Products (Branch specific)
  - `1134000` - Salon Supplies (Branch specific)
  - `1135000` - Retail Products for Sale (Branch specific)

#### Non-Current Assets (1200000-1299999)
- **Property, Plant & Equipment**
  - `1211000` - Leasehold Improvements (Branch specific)
  - `1212000` - Salon Equipment - Chairs (Branch specific)
  - `1213000` - Salon Equipment - Wash Stations (Branch specific)
  - `1214000` - Hair Styling Equipment (Branch specific)
  - `1215000` - Computer Equipment
  - `1216000` - POS Systems (Branch specific)
  - `1217000` - Furniture & Fixtures (Branch specific)

### 2. Liabilities (2000000-2999999)

#### Current Liabilities (2100000-2199999)
- **Payables**
  - `2111000` - Suppliers - Hair Products (Branch specific)
  - `2112000` - Suppliers - Salon Supplies (Branch specific)
  - `2113000` - Utilities Payable (Branch specific)
  - `2114000` - Rent Payable (Branch specific)

- **Employee Liabilities**
  - `2121000` - Salaries Payable (Branch specific)
  - `2122000` - Commission Payable - Stylists (Branch specific)
  - `2123000` - Tips Payable (Branch specific)
  - `2124000` - Payroll Tax Payable

- **Customer Liabilities**
  - `2131000` - Customer Deposits (Branch specific)
  - `2132000` - Gift Card Liabilities (Branch specific)
  - `2133000` - Loyalty Points Liability (Branch specific)
  - `2134000` - Service Package Liabilities (Branch specific)

- **Inter-Branch**
  - `2180000` - Inter-Branch Payables (Branches only)

### 3. Equity (3000000-3999999)
- `3100000` - Share Capital
- `3200000` - Retained Earnings
- `3300000` - Current Year Earnings
- `3400000` - Investment in Subsidiaries (Head Office only)

### 4. Revenue (4000000-4999999)

#### Service Revenue (4100000-4199999)
- **Hair Services**
  - `4111000` - Haircut Revenue - Men (Branch specific)
  - `4112000` - Haircut Revenue - Women (Branch specific)
  - `4113000` - Hair Coloring Revenue (Branch specific)
  - `4114000` - Hair Treatment Revenue (Branch specific)
  - `4115000` - Hair Styling Revenue (Branch specific)
  - `4116000` - Bridal & Special Event Revenue (Branch specific)

- **Beauty Services**
  - `4121000` - Facial Treatment Revenue (Branch specific)
  - `4122000` - Manicure Revenue (Branch specific)
  - `4123000` - Pedicure Revenue (Branch specific)
  - `4124000` - Waxing Revenue (Branch specific)
  - `4125000` - Massage Revenue (Branch specific)

#### Product Sales (4200000-4299999)
- `4210000` - Hair Care Product Sales (Branch specific)
- `4220000` - Beauty Product Sales (Branch specific)
- `4230000` - Accessories Sales (Branch specific)

### 5. Cost of Sales (5000000-5999999)
- **Direct Service Costs**
  - `5111000` - Stylist Base Salaries (Branch specific)
  - `5112000` - Stylist Commissions (Branch specific)
  - `5113000` - Stylist Benefits (Branch specific)

- **Product Costs**
  - `5210000` - Hair Color Products Used (Branch specific)
  - `5220000` - Hair Treatment Products Used (Branch specific)
  - `5230000` - Styling Products Used (Branch specific)
  - `5240000` - Beauty Products Used (Branch specific)

- **Cost of Goods Sold**
  - `5310000` - COGS - Hair Care Products (Branch specific)
  - `5320000` - COGS - Beauty Products (Branch specific)
  - `5330000` - COGS - Accessories (Branch specific)

### 6. Operating Expenses (6000000-6999999)
- **Administrative** (6100000-6199999)
- **Occupancy Costs** (6200000-6299999)
- **Marketing & Advertising** (6300000-6399999)
- **Training & Development** (6400000-6499999)
- **Depreciation** (6800000-6899999)
- **Other Operating** (6900000-6999999)

### 9. Consolidation Accounts (9000000-9999999) - Head Office Only
- `9100000` - Elimination - Intercompany Sales
- `9200000` - Elimination - Intercompany Purchases
- `9300000` - Elimination - Intercompany Receivables
- `9400000` - Elimination - Intercompany Payables
- `9500000` - Elimination - Investment in Subsidiaries

## Key Features

### 1. IFRS Compliance
Every account includes:
- **IFRS Classification**: Proper categorization per IFRS standards
- **IFRS Code**: Reference to specific IFRS standard (e.g., IAS1.54, IFRS15.113)
- **Statement Type**: SFP (Balance Sheet) or SPL (P&L Statement)
- **Normal Balance**: Debit or Credit

### 2. Multi-Branch Support
- **Branch-Specific Accounts**: Marked with `branch_specific: true`
- **Inter-Branch Accounts**: Special accounts for branch transactions
- **Consolidation Method**: Automatic elimination of inter-branch balances

### 3. Smart Codes
Every GL account has a unique smart code:
- Format: `HERA.SALON.GL.{TYPE}.{ACCOUNT_CODE}.v1`
- Example: `HERA.SALON.GL.ASSET.1111000.v1`

### 4. Dynamic Data
Additional fields stored in `core_dynamic_data`:
- IFRS lineage information
- Consolidation methods
- Branch-specific flags
- Normal balance indicators

## Common Transactions

### 1. Service Revenue Recording (Branch)
```sql
-- Create a hair coloring service transaction
INSERT INTO universal_transactions (
    organization_id, 
    transaction_type,
    transaction_code,
    transaction_date,
    total_amount,
    metadata
) VALUES (
    'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', -- Branch 1
    'service_sale',
    'SRV-2024-001',
    CURRENT_DATE,
    150.00,
    jsonb_build_object(
        'service_type', 'hair_coloring',
        'stylist_id', 'stylist_123',
        'smart_code', 'HERA.SALON.TXN.SERVICE.COLOR.v1'
    )
);

-- Transaction lines
INSERT INTO universal_transaction_lines (
    transaction_id,
    organization_id,
    line_description,
    line_amount,
    gl_account_code
) VALUES 
    (transaction_id, org_id, 'Hair Coloring Service', 150.00, '4113000'),
    (transaction_id, org_id, 'Color Products Used', -30.00, '5210000');
```

### 2. Inter-Branch Product Transfer
```sql
-- Branch 1 sends products to Branch 2
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_code,
    is_intercompany,
    intercompany_source_org,
    intercompany_target_org,
    total_amount,
    metadata
) VALUES (
    'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', -- Branch 1
    'inter_branch_transfer',
    'IBT-2024-001',
    true,
    'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', -- Branch 1
    '0b1b37cd-4096-4718-8cd4-e370f234005b', -- Branch 2
    500.00,
    jsonb_build_object(
        'transfer_type', 'product',
        'elimination_required', true,
        'smart_code', 'HERA.SALON.TXN.INTER.TRANSFER.v1'
    )
);
```

### 3. Consolidated Reporting Query
```sql
-- Get consolidated revenue across all branches
WITH branch_revenue AS (
    SELECT 
        e.entity_code,
        e.entity_name,
        SUM(tl.line_amount) as total_amount,
        e.metadata->>'ifrs_classification' as classification
    FROM core_entities e
    JOIN universal_transaction_lines tl ON tl.gl_account_code = e.entity_code
    WHERE e.entity_type = 'gl_account'
      AND e.entity_code LIKE '4%' -- Revenue accounts
      AND e.organization_id IN (
          'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
          '0b1b37cd-4096-4718-8cd4-e370f234005b'
      )
    GROUP BY e.entity_code, e.entity_name, e.metadata
)
SELECT 
    entity_code,
    entity_name,
    classification,
    SUM(total_amount) as consolidated_revenue
FROM branch_revenue
GROUP BY entity_code, entity_name, classification
ORDER BY entity_code;
```

## Reporting Capabilities

### 1. Branch-Level P&L
Each branch can generate its own P&L statement using branch-specific accounts.

### 2. Consolidated Financial Statements
Head office can produce consolidated statements with automatic elimination of:
- Inter-branch receivables/payables
- Inter-branch sales/purchases
- Investment in subsidiaries

### 3. Management Reports
- Service-wise revenue analysis
- Product profitability reports
- Stylist performance metrics
- Branch comparison reports

## Best Practices

### 1. Transaction Recording
- Always use appropriate smart codes
- Mark inter-branch transactions with `is_intercompany = true`
- Include stylist/therapist information in metadata

### 2. Month-End Procedures
- Reconcile inter-branch accounts
- Review branch-specific expenses
- Validate consolidation eliminations
- Generate branch and consolidated reports

### 3. Inventory Management
- Track product usage vs. sales
- Monitor branch-specific inventory levels
- Regular inter-branch stock reconciliation

### 4. Cost Allocation
- Allocate head office costs to branches based on revenue
- Track direct vs. indirect costs at branch level
- Monitor commission structures by branch

## Integration with HERA Features

### 1. Universal API
```typescript
// Create service transaction
await universalApi.createTransaction({
  organization_id: branchId,
  transaction_type: 'service_sale',
  total_amount: 150.00,
  metadata: {
    service_type: 'hair_coloring',
    gl_postings: [
      { account: '4113000', amount: 150.00, type: 'credit' },
      { account: '1111100', amount: 150.00, type: 'debit' }
    ]
  }
});
```

### 2. Smart Code System
All transactions automatically inherit GL posting rules based on smart codes.

### 3. Auto-Journal Engine
Transactions automatically create journal entries following the COA structure.

### 4. Multi-Tenant Security
Each branch sees only its own data, while head office sees consolidated view.

## Troubleshooting

### Common Issues

1. **Inter-branch balance mismatch**
   - Ensure both sides of transfer are recorded
   - Check elimination flags are set correctly

2. **Consolidation errors**
   - Verify organization IDs are correct
   - Check consolidation mapping exists

3. **Missing IFRS data**
   - Run `add_gl_account_dynamic_data()` function
   - Verify all accounts have classifications

## SQL Execution

To set up the COA, run:
```bash
psql -U your_user -d your_database -f /path/to/salon-multi-branch-coa.sql
```

Or through HERA CLI:
```bash
cd mcp-server
node hera-cli.js query "SELECT create_salon_coa('org_id'::uuid, is_head_office);"
```

## Verification Queries

Check COA setup:
```sql
-- Account count by organization
SELECT 
    o.organization_name,
    COUNT(e.id) as total_accounts,
    COUNT(CASE WHEN e.metadata->>'branch_specific' = 'true' THEN 1 END) as branch_accounts
FROM core_organizations o
JOIN core_entities e ON e.organization_id = o.id
WHERE e.entity_type = 'gl_account'
GROUP BY o.organization_name;

-- IFRS compliance check
SELECT 
    COUNT(*) as total_accounts,
    COUNT(dd.id) as accounts_with_ifrs,
    COUNT(*) - COUNT(dd.id) as missing_ifrs
FROM core_entities e
LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id 
    AND dd.field_name = 'ifrs_classification'
WHERE e.entity_type = 'gl_account';
```

This Chart of Accounts provides a complete, IFRS-compliant foundation for multi-branch salon operations with full consolidation capabilities.