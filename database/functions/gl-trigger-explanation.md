# GL Balance Trigger - Smart Code Filtering

## Why Appointments Don't Trigger GL Validation

### The Problem
Originally, the GL balance trigger was firing on **ALL** transaction lines, including:
- ❌ Appointments (`HERA.SALON.APPOINTMENT.BOOKING.V1`)
- ❌ POS Sales (`HERA.SALON.POS.SALE.V1`) 
- ❌ Inventory moves (`HERA.INVENTORY.TRANSFER.V1`)

### The Solution
Now the trigger **ONLY** fires for actual GL (General Ledger) transactions:
- ✅ Journal Entries (`HERA.ACCOUNTING.GL.JOURNAL.V1`)
- ✅ GL Postings (`HERA.FINANCE.GL.DEBIT.CASH.V1`)
- ✅ Financial adjustments (`HERA.ACCOUNTING.GL.ADJUSTMENT.V1`)

### Implementation
```sql
-- Trigger only fires when smart_code contains '.GL.'
WHEN (
  (NEW.smart_code IS NOT NULL AND NEW.smart_code ~* '\.GL\.') OR
  (OLD.smart_code IS NOT NULL AND OLD.smart_code ~* '\.GL\.')
)
```

### Transaction Type Examples

| Transaction Type | Smart Code Pattern | GL Trigger? |
|-----------------|-------------------|-------------|
| Appointment | `HERA.SALON.APPOINTMENT.*` | ❌ No |
| POS Sale | `HERA.SALON.POS.*` | ❌ No |
| Invoice | `HERA.BILLING.INVOICE.*` | ❌ No |
| GL Journal | `HERA.ACCOUNTING.GL.*` | ✅ Yes |
| GL Posting | `HERA.FINANCE.GL.*` | ✅ Yes |

### Performance Benefits
- Eliminates unnecessary GL validation for operational transactions
- Trigger only fires when actually needed
- Faster appointment booking and POS operations
- Maintains accounting integrity for financial transactions only

### When to Use GL Smart Codes
Only use `.GL.` in smart codes when creating actual accounting entries that need debit/credit balance validation:

```typescript
// ❌ Don't use for appointments
'HERA.SALON.APPOINTMENT.BOOKING.V1'

// ✅ Use for GL entries
'HERA.ACCOUNTING.GL.JOURNAL.REVENUE.V1'
'HERA.FINANCE.GL.DEBIT.CASH.V1'
'HERA.FINANCE.GL.CREDIT.REVENUE.V1'
```