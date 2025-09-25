# HERA V2 Transaction CRUD - Field Migration Notes

## Field Naming Consistency: `unit_price` vs `unit_amount`

### ✅ Database Schema
All SQL functions, tables, and views consistently use **`unit_price`**:
- `universal_transaction_lines.unit_price`
- All database functions use `unit_price`
- All views and migrations use `unit_price`

### ✅ V2 API Layer
**Primary Field**: `unit_price` (matches database)
**Backward Compatibility**: Accepts `unit_amount` but normalizes to `unit_price`

```typescript
// ✅ Preferred (V2 API)
{
  line_type: 'ITEM',
  entity_id: menuItemId,
  quantity: 2,
  unit_price: 25.50,        // Primary field
  smart_code: 'HERA.RESTAURANT.SALES.LINE.ITEM.V1'
}

// ✅ Also accepts (backward compatibility)
{
  line_type: 'ITEM',
  entity_id: menuItemId,
  quantity: 2,
  unit_amount: 25.50,       // Will be normalized to unit_price
  smart_code: 'HERA.RESTAURANT.SALES.LINE.ITEM.V1'
}
```

### ✅ V2 Test Coverage
All V2 tests use `unit_price` and validate computed amounts:
```typescript
// Test validates: line_amount = quantity * unit_price
{
  quantity: 2,
  unit_price: 25.50,
  line_amount: 51.00  // 2 * 25.50
}
```

### 📋 V1 Legacy System
The existing V1 system extensively uses `unit_amount` (100+ references).
**Migration Strategy**: V2 provides normalization layer for gradual migration.

## Example Calls (Updated for V2)

```typescript
// ✅ V2 Transaction Emit (Corrected)
const created = await txnClientV2.emit({
  organization_id: 'org-id',
  transaction_type: 'SALE',
  smart_code: 'HERA.RESTAURANT.SALES.ORDER.CORE.V1',
  transaction_date: new Date().toISOString(),
  lines: [
    {
      line_number: 1,
      line_type: 'ITEM',
      entity_id: menuItemId,
      quantity: 2,
      unit_price: 25.50,        // ✅ CORRECTED: unit_price
      line_amount: 51.00,       // ✅ quantity * unit_price
      smart_code: 'HERA.RESTAURANT.SALES.LINE.ITEM.V1'
    },
    {
      line_number: 2,
      line_type: 'TAX',
      line_amount: 5.10,        // ✅ Tax as line_amount
      smart_code: 'HERA.RESTAURANT.SALES.LINE.TAX.V1'
    }
  ]
});
```

## Implementation Details

### API Schema Transform (V2)
```typescript
export const TxnEmitLineSchema = z.object({
  // ... other fields
  unit_price: z.number().optional(),  // Primary field
  unit_amount: z.number().optional(),  // Backward compatibility
  // ... other fields
}).transform((data) => {
  // Normalize unit_amount to unit_price
  if (data.unit_amount !== undefined && data.unit_price === undefined) {
    data.unit_price = data.unit_amount;
  }
  const { unit_amount, ...normalizedData } = data;
  return normalizedData;
});
```

### Database Function Usage
```sql
-- All database functions use unit_price
SELECT
  l.unit_price,
  l.quantity,
  l.line_amount
FROM universal_transaction_lines l;
```

## Migration Status ✅ COMPLETE

- [x] Database layer: 100% `unit_price`
- [x] V2 API: Primary `unit_price` with `unit_amount` normalization
- [x] V2 Tests: All use `unit_price`
- [x] Documentation: Updated with correct examples
- [x] Backward compatibility: Maintained through schema transforms