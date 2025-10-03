# HERA Universal Transactions (Kernel)

## Purpose
Single, stable kernel for all financial postings across the HERA platform.

## Core Tables
- `universal_transactions` - Transaction headers containing the main posting information
- `universal_transaction_lines` - Detailed lines for each transaction (1..N per header)

## Kernel Taxonomy
The `transaction_type` field uses a small, controlled set of kernel-owned values:
- `JOURNAL` - General journal entries
- `SALES_INVOICE` - Customer invoices 
- `SALES_RECEIPT` - Customer payments received
- `PURCHASE_BILL` - Vendor bills
- `PAYMENT` - Payments made
- `ADJUSTMENT` - Inventory/other adjustments

## Invariants
1. **Balance Rule**: Headers must balance - `amount_total = sum(lines.amount)`
2. **Line Structure**: Lines must be one-sided (debit XOR credit), never both
3. **Organization Isolation**: All rows inherit `organization_id` from header
4. **RLS Enforcement**: All rows must pass RLS for the caller's organization
5. **Smart Code Required**: Every transaction and line must have valid smart codes

## Entity vs Transaction Types
- **Application Layer**: Rich `entity_type` values (e.g., `SERVICE_SALE`, `APPOINTMENT_CHARGE`)
- **Kernel Layer**: Stable `transaction_type` values (limited set above)
- **Mapping**: Configuration-driven mapping from entity_type → transaction_type
- **Enforcement**: Posting RPC validates allowed mappings

## RPC Contracts (v2)
### `hera_txn_post_v2(p_organization_id, p_payload jsonb)`
Validates and posts transactions with full business logic enforcement.

**Validations**:
- Organization access rights
- Transaction balance (debits = credits)
- Allowed transaction_type values
- Smart code format and validity
- GL account existence
- Currency support

**Returns**:
```json
{
  "success": true,
  "data": {
    "header": { /* transaction header */ },
    "lines": [ /* transaction lines */ ]
  },
  "errors": []
}
```

## Versioning Strategy
- **Backwards Compatible**: Changes that don't break existing behavior keep current version
- **Breaking Changes**: Semantic changes to posting logic increment version (Vn+1)
- **Smart Code Evolution**: New smart codes for new behaviors, old codes remain stable

## Example Usage
```sql
-- Post a simple journal entry
SELECT * FROM hera_txn_post_v2(
  'org-uuid-here',
  '{
    "transaction_type": "JOURNAL",
    "currency": "USD",
    "description": "Monthly rent payment",
    "lines": [
      {
        "gl_account_code": "6100",
        "debit": 5000,
        "credit": 0,
        "memo": "Rent expense"
      },
      {
        "gl_account_code": "1000", 
        "debit": 0,
        "credit": 5000,
        "memo": "Cash payment"
      }
    ]
  }'::jsonb
);
```