# HERA Furniture Manufacturing Module - Cochin, India

## Overview

The HERA Furniture Manufacturing module provides complete end-to-end business process management for furniture manufacturers in India, built on HERA's Sacred Six tables architecture with zero schema changes.

## Module Details

- **Namespace**: `HERA.MANUFACTURING.FURNITURE`
- **Version**: v1
- **Region**: Cochin, India
- **Compliance**: GST (CGST/SGST), EPF/ESI, Indian FY (Apr-Mar)

## Sacred Six Tables Usage

### 1. **core_organizations**

- Multi-tenant isolation for furniture manufacturers

### 2. **core_entities**

- Products (FG/RM/WIP)
- Bill of Materials (BOM)
- Production Routing
- Work Centers & Machines
- Storage Locations
- Employees (with PF/ESI details)
- Chart of Accounts

### 3. **core_dynamic_data**

- Product specifications (dimensions, materials, finishes)
- Employee compliance data (PF/ESI numbers)
- GST registration details
- Custom pricing rules
- Quality parameters

### 4. **core_relationships**

- Product → BOM components
- Product → Routing operations
- Routing → Work Center assignments
- Employee → Department/Supervisor hierarchy
- GL Account parent-child relationships

### 5. **universal_transactions**

- Sales Orders, Invoices, Dispatch notes
- Production Orders
- Payroll Runs
- Journal Entries (auto-generated)

### 6. **universal_transaction_lines**

- Order line items
- Material requirements
- Operation details
- Payroll components (earnings, deductions)
- GL posting lines

## Business Process Flows

### Sales Flow

1. **Proforma** → Customer quotation
2. **Sales Order** → Confirmed order with advance
3. **Production Trigger** → Auto-create production orders
4. **Dispatch** → Delivery note generation
5. **Invoice** → GST-compliant tax invoice
6. **GL Posting** → Automatic journal entries

### Manufacturing Flow

1. **Production Order** → From sales order
2. **Material Planning** → BOM explosion
3. **Material Issue** → RM to WIP movement
4. **Operation Execution** → Track labor/machine time
5. **FG Receipt** → Completed goods to inventory
6. **Costing** → Material + Labor + Overhead

### Finance Integration

Every business event generates balanced GL postings:

- Material Issue: Dr WIP / Cr RM Inventory
- Labor Applied: Dr WIP / Cr Wages Payable
- FG Receipt: Dr FG / Cr WIP
- COGS: Dr COGS / Cr FG (on dispatch)
- GST: Split CGST/SGST postings

### HR/Payroll Flow

1. **Monthly Payroll Run** → Calculate earnings
2. **Statutory Deductions** → PF (12% EE, 12% ER), ESI (0.75% EE, 3.25% ER)
3. **Bank Disbursement** → Net salary payments
4. **Compliance** → PF/ESI remittance with ECR/challan

## Smart Code Structure

Format: `HERA.MANUFACTURING.FURNITURE.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}`

Examples:

- Master: `HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.V1`
- Transaction: `HERA.MANUFACTURING.FURNITURE.SALES.SO.HEADER.V1`
- GL Line: `HERA.MANUFACTURING.FURNITURE.FINANCE.COST.MATERIAL_ISSUE.GL.LINE.v1`

## Configuration

### GST Setup

```json
{
  "gst_rates": {
    "furniture_hsn_94": 0.18,
    "wood_hsn_44": 0.12
  }
}
```

### PF/ESI Rates

```json
{
  "pf_rates": {
    "employee": 0.12,
    "employer": 0.12
  },
  "esi_rates": {
    "employee": 0.0075,
    "employer": 0.0325
  }
}
```

## Data Loading Instructions

### 1. Load Masters

```sql
-- Products
INSERT INTO core_entities (organization_id, entity_type, entity_name, entity_code, smart_code)
VALUES ('your-org-id', 'product', 'Standard Classroom Desk', 'DESK-STD-001',
        'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.V1');

-- Add specifications
INSERT INTO core_dynamic_data (entity_id, field_name, field_value_text, smart_code)
VALUES ('product-id', 'product_type', 'FINISHED_GOOD',
        'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.V1');
```

### 2. Create Transactions

```sql
-- Sales Order
INSERT INTO universal_transactions (
  organization_id, transaction_type, transaction_code,
  transaction_date, smart_code, total_amount, metadata
) VALUES (
  'your-org-id', 'sales_order', 'SO-2025-001234',
  '2025-01-09', 'HERA.MANUFACTURING.FURNITURE.SALES.SO.HEADER.V1',
  354000.00, '{"business_context": {...}}'::jsonb
);
```

### 3. Finance DNA Integration

The Finance DNA engine automatically generates GL postings based on smart codes. No manual journal entries required.

## CI/CD Checks

### Smart Code Validation

```bash
# Regex pattern check
grep -E "HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$" event_samples.json

# All caps check
! grep -E "HERA\..*[a-z]" smart_code_registry.json
```

### Organization Filter Check

```bash
# Ensure all queries include organization_id
grep -c "organization_id" api_calls.log

# No cross-tenant data leakage
SELECT COUNT(*) FROM core_entities WHERE organization_id IS NULL; -- Must be 0
```

### GL Balance Check

```bash
# For each transaction with GL lines (debit positive, credit negative)
SELECT transaction_id,
       SUM(CASE WHEN line_amount >= 0 THEN line_amount ELSE 0 END) AS debits,
       SUM(CASE WHEN line_amount < 0 THEN -line_amount ELSE 0 END) AS credits
FROM universal_transaction_lines
WHERE smart_code LIKE '%.GL.LINE.%'
GROUP BY transaction_id
HAVING debits != credits; -- Must return 0 rows
```

### Schema naming note (live vs docs)

- Live environments often use `transaction_code` for the transaction header identifier; some documentation references `transaction_number`. Prefer `transaction_code` in queries and UIs; ensure compatibility by selecting all columns when in doubt.
- For lines, use `line_number` and `line_amount` (there is no `gl_type`/`amount`). Determine debit/credit using the sign of `line_amount`.

## Deployment Steps

1. **Load Configuration**

   ```bash
   psql -f posting_rules.json
   ```

2. **Initialize Masters**

   ```bash
   ./scripts/load-furniture-masters.sh
   ```

3. **Start Services**

   ```bash
   npm run furniture:api
   ```

4. **Run Tests**
   ```bash
   npm test furniture
   ```

## Support

For issues or questions:

- Check smart code registry
- Validate against Sacred Six tables
- Ensure organization_id on all operations
- Verify GL postings balance

## Version History

- v1.0.0 - Initial release with Sales, Manufacturing, Finance, HR modules
