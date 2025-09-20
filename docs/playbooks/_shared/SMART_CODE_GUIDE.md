# HERA DNA Smart Code Architecture Guide

## Role: HERA Smart-Code Architect

Every entity/transaction/line must carry a valid smart_code. When unsure, propose and self-validate before output.

## Smart Code Format Rules

### Structure
```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}
```
- **6-10 segments total**
- Starts with `HERA.`
- Ends with `.V{n}` (uppercase V)
- Example: `HERA.SALON.POS.CART.ACTIVE.V1`

### Character Rules
- **Segments**: `[A-Z0-9_]+` only
- **No spaces or hyphens**
- **Uppercase domains**
- **Version**: `V1`, `V2`, etc. (normalize lowercase `v` to uppercase `V`)

## Salon Industry Vocabulary

### POS Cart Lifecycle
```
HERA.SALON.POS.CART.ACTIVE.V1          # Active cart in progress
HERA.SALON.POS.CART.DRAFT.V1           # Draft cart
HERA.SALON.POS.CART.LOCKED.V1          # Cart locked for checkout
HERA.SALON.POS.CART.VOID.V1            # Voided cart
```

### Service & Retail Lines
```
HERA.SALON.SVC.LINE.STANDARD.V1        # Standard service line
HERA.SALON.SVC.LINE.ADDON.V1           # Add-on service
HERA.SALON.SVC.LINE.PACKAGE.V1         # Package service
HERA.SALON.RETAIL.LINE.PRODUCT.V1      # Retail product line
HERA.SALON.RETAIL.LINE.GIFT.V1         # Gift/promotional item
```

### Adjustments & Discounts
```
HERA.SALON.POS.ADJUST.DISCOUNT.LINE.PCT.V1    # Line-level % discount
HERA.SALON.POS.ADJUST.DISCOUNT.LINE.AMT.V1    # Line-level $ discount
HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1    # Cart-level % discount
HERA.SALON.POS.ADJUST.DISCOUNT.CART.AMT.V1    # Cart-level $ discount
HERA.SALON.POS.ADJUST.PRICE.OVERRIDE.V1       # Price override with reason
HERA.SALON.POS.ADJUST.COMP.V1                 # Complimentary item
```

### Tips
```
HERA.SALON.TIP.CASH.V1                 # Cash tip
HERA.SALON.TIP.CARD.V1                 # Card tip
HERA.SALON.TIP.SPLIT.V1                # Split tip among staff
```

### Tax
```
HERA.SALON.TAX.UK.VAT.STANDARD.V1      # UK 20% VAT
HERA.SALON.TAX.UK.VAT.REDUCED.V1       # UK reduced rate
HERA.SALON.TAX.UK.VAT.ZERO.V1          # UK zero rate
HERA.SALON.TAX.US.SALES.STATE.V1       # US state sales tax
HERA.SALON.TAX.US.SALES.LOCAL.V1       # US local sales tax
HERA.SALON.TAX.AE.VAT.STANDARD.V1      # UAE 5% VAT
```

### Inventory Management
```
HERA.SALON.INV.RESERVE.SOFT.V1         # Soft hold for cart
HERA.SALON.INV.RESERVE.RELEASE.V1      # Release reservation
HERA.SALON.INV.COMMIT.SALE.V1          # Commit on sale completion
HERA.SALON.INV.ADJUST.COUNT.V1         # Inventory count adjustment
HERA.SALON.INV.TRANSFER.LOCATION.V1    # Transfer between locations
```

### Payments & Checkout
```
HERA.SALON.PAYMENT.INTENT.CREATE.V1    # Payment intent creation
HERA.SALON.PAYMENT.CAPTURE.CARD.V1     # Card payment capture
HERA.SALON.PAYMENT.CAPTURE.CASH.V1     # Cash payment
HERA.SALON.PAYMENT.CAPTURE.GIFTCARD.V1 # Gift card payment
HERA.SALON.PAYMENT.CAPTURE.DEPOSIT.V1  # Use deposit/credit
HERA.SALON.PAYMENT.REFUND.FULL.V1      # Full refund
HERA.SALON.PAYMENT.REFUND.PARTIAL.V1   # Partial refund
```

### Sale Completion
```
HERA.SALON.POS.SALE.COMMIT.V1          # Finalize sale
HERA.SALON.POS.SALE.MIXED.V1           # Mixed payment sale
HERA.SALON.POS.SALE.VOID.V1            # Void completed sale
```

### Appointments
```
HERA.SALON.APPT.STANDARD.V1            # Standard appointment
HERA.SALON.APPT.BOOKING.V1             # Appointment booking
HERA.SALON.APPT.STATUS.UPDATE.V1       # Status change event
HERA.SALON.APPT.CANCEL.V1              # Cancellation
HERA.SALON.APPT.NOSHOW.V1              # No-show marking
```

### Relationships
```
HERA.SALON.POS.REL.CART_FROM_APPT.V1   # Cart originates from appointment
HERA.SALON.POS.REL.CART_BILLS_CUSTOMER.V1  # Cart bills to customer
HERA.SALON.POS.REL.LINE_PERFORMED_BY_STAFF.V1  # Line performed by staff
HERA.SALON.POS.REL.SALE_FULFILLS_APPT.V1   # Sale fulfills appointment
```

### Finance DNA Integration
```
HERA.FIN.POSTING.GL.JOURNAL.V1         # GL journal entry
HERA.FIN.POSTING.GL.REVENUE.V1         # Revenue posting
HERA.FIN.POSTING.GL.TAX.V1             # Tax posting
HERA.FIN.POSTING.GL.TIPS.V1            # Tips liability posting
```

## Validation Checklist

Before using any smart code, verify:

✅ **Exactly 6-10 segments?**
✅ **Starts with `HERA.` and ends with `.V{n}`?**
✅ **All segments contain only `[A-Z0-9_]+`?**
✅ **Reuses existing family when applicable?**
✅ **Would pass Guardrail validation?**

## Code Selection Process

1. **Check existing families first** - Don't create new patterns
2. **Be specific over generic** - `DISCOUNT.CART.PCT.V1` > `ADJ.LINE.V1`
3. **Industry alignment** - Use `SALON` for salon operations, `FIN` for GL posting
4. **Version immutability** - Content changes require version bump to `V2`

## Examples

### Example A: Cart-wide percentage discount
```
Input: "Apply 15% discount to entire cart"
Output: HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1
Why: SALON industry, POS module, ADJUST type, DISCOUNT.CART scope, PCT kind
```

### Example B: Service line from appointment
```
Input: "Hair color service from appointment"
Output: HERA.SALON.SVC.LINE.STANDARD.V1
Metadata: { appointment_line_id: "aln_123", source: "APPOINTMENT" }
```

### Example C: Inventory soft hold
```
Input: "Reserve 2 units of shampoo for cart"
Output: HERA.SALON.INV.RESERVE.SOFT.V1
```

### Example D: Card payment capture
```
Input: "Process £85.50 card payment"
Output: HERA.SALON.PAYMENT.CAPTURE.CARD.V1
```

## Common Fixes

| Issue | Fix |
|-------|-----|
| Lowercase `.v1` | Normalize to `.V1` |
| Too few segments | Add missing TYPE/SUBTYPE |
| Novel family exists | Map to nearest canonical |
| Spaces/hyphens | Replace with underscores |
| Wrong industry | Use SALON for salon, FIN for GL |

## Validation Functions

```typescript
// Regex pattern for validation
const SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$/;

// Validate smart code
export function validateSmartCode(code: string): boolean {
  return SMART_CODE_PATTERN.test(code);
}

// Normalize version to uppercase
export function normalizeSmartCode(code: string): string {
  return code.replace(/\.[Vv](\d+)$/, (_, n) => `.V${n}`);
}
```

## Integration with HERA DNA

This guide integrates with:
- **Guardrails**: Enforces smart code presence and format
- **Universal API**: Validates codes on entity/transaction creation
- **Finance DNA**: Maps codes to GL posting rules
- **Auto-Journal Engine**: Uses codes for transaction classification
- **Audit Trail**: Smart codes provide business context

---

**Remember**: Every operation in HERA requires a valid smart code. When in doubt, consult this guide and validate before proceeding.