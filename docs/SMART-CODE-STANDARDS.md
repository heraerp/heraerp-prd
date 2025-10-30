# HERA Smart Code Standards & Prevention Guide

## 🚨 Critical Rules (Must Follow)

### 1. Version MUST be lowercase
```typescript
// ❌ WRONG - Will cause RPC validation error
smart_code: 'HERA.SALON.POS.SALE.COMMIT.V1'

// ✅ CORRECT
smart_code: 'HERA.SALON.POS.SALE.COMMIT.v1'
```

### 2. Must have 6-10 segments
```typescript
// ❌ WRONG - Only 5 segments
smart_code: 'HERA.SALON.SALE.TXN.v1'

// ✅ CORRECT - 6 segments
smart_code: 'HERA.SALON.POS.SALE.COMMIT.v1'
```

### 3. All segments UPPERCASE (except version)
```typescript
// ❌ WRONG - lowercase segments
smart_code: 'HERA.salon.pos.sale.commit.v1'

// ✅ CORRECT
smart_code: 'HERA.SALON.POS.SALE.COMMIT.v1'
```

## 📋 Validation Pattern

The official RPC validation regex:
```regex
^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$
```

**Breakdown:**
- `^HERA\.` - Must start with "HERA."
- `[A-Z0-9]{3,15}` - Industry segment (3-15 uppercase chars/numbers)
- `(?:\.[A-Z0-9_]{2,30}){3,8}` - 3-8 additional segments (2-30 chars each)
- `\.v[0-9]+$` - Must end with lowercase ".v" + version number

## 🛡️ Prevention Strategies

### Strategy 1: Use Pre-Defined Constants (Safest)

```typescript
import { HERA_SMART_CODES } from '@/lib/utils/smart-code-validator'

// ✅ Use validated constants
const transaction = {
  smart_code: HERA_SMART_CODES.POS_SALE_COMMIT
}
```

### Strategy 2: Use Smart Code Builder

```typescript
import { SmartCodeBuilder } from '@/lib/utils/smart-code-validator'

// ✅ Type-safe builder with automatic validation
const code = new SmartCodeBuilder()
  .industry('SALON')
  .module('POS')
  .type('SALE')
  .subtype('COMMIT')
  .version(1) // Returns: 'HERA.SALON.POS.SALE.COMMIT.v1'
```

### Strategy 3: Validate Before Use

```typescript
import { validateSmartCode, ensureValidSmartCode } from '@/lib/utils/smart-code-validator'

// Option A: Validate and throw if invalid
const result = validateSmartCode(myCode)
if (!result.isValid) {
  throw new Error(result.error)
}

// Option B: Auto-normalize (fixes .V to .v)
const fixedCode = ensureValidSmartCode('HERA.SALON.POS.SALE.COMMIT.V1')
// Returns: 'HERA.SALON.POS.SALE.COMMIT.v1'
```

## 🔧 Fixing Existing Issues

### Step 1: Run Bulk Fix Script
```bash
# Fix all uppercase versions across codebase
./scripts/fix-smart-codes.sh
```

### Step 2: Verify Changes
```bash
# Check for remaining issues
npm run lint
npm run typecheck

# Review changes
git diff
```

### Step 3: Test Affected Pages
- Test POS checkout
- Test appointment booking
- Test any pages using smart codes

## 📚 Common Smart Codes Reference

### POS Transactions
```typescript
'HERA.SALON.POS.SALE.COMMIT.v1'     // Finalize sale
'HERA.SALON.POS.SALE.MIXED.v1'      // Mixed payment sale
'HERA.SALON.POS.SALE.VOID.v1'       // Void sale
```

### Service & Product Lines
```typescript
'HERA.SALON.SVC.LINE.STANDARD.v1'   // Service line
'HERA.SALON.RETAIL.LINE.PRODUCT.v1' // Product line
```

### Adjustments
```typescript
'HERA.SALON.POS.ADJUST.DISCOUNT.CART.v1' // Cart discount
'HERA.SALON.POS.ADJUST.DISCOUNT.LINE.v1' // Line discount
```

### Payments
```typescript
'HERA.SALON.PAYMENT.CAPTURE.CASH.v1' // Cash payment
'HERA.SALON.PAYMENT.CAPTURE.CARD.v1' // Card payment
```

### Tax
```typescript
'HERA.SALON.TAX.AE.VAT.STANDARD.v1' // UAE VAT (5%)
'HERA.SALON.TAX.UK.VAT.STANDARD.v1' // UK VAT (20%)
```

## 🚀 ESLint Integration (Coming Soon)

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "smart-code-validator/enforce-lowercase-version": "error"
  }
}
```

## 🐛 Common Errors & Solutions

### Error: "SMART_CODE_INVALID: header.smart_code must match pattern"
**Cause:** Uppercase version (.V1 instead of .v1)
```typescript
// ❌ Wrong
smart_code: 'HERA.SALON.TXN.SALE.CREATE.V1'

// ✅ Fix
smart_code: 'HERA.SALON.TXN.SALE.CREATE.v1'
```

### Error: "chk_utl_smart_code_pattern constraint violation"
**Cause:** Too few segments (need 6-10, not 4-5)
```typescript
// ❌ Wrong - Only 5 segments
smart_code: 'HERA.SALON.DISCOUNT.TXN.v1'

// ✅ Fix - 8 segments
smart_code: 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.v1'
```

## ✅ Code Review Checklist

Before committing code with smart codes:
- [ ] Version is lowercase (.v1 not .V1)
- [ ] Has 6-10 segments total
- [ ] All segments are UPPERCASE except version
- [ ] Matches HERA DNA pattern
- [ ] Uses constants from HERA_SMART_CODES when possible
- [ ] Validated with validateSmartCode() if custom

## 📖 Additional Resources

- Smart Code Guide: `/docs/playbooks/_shared/SMART_CODE_GUIDE.md`
- Validator Utility: `/src/lib/utils/smart-code-validator.ts`
- Fix Script: `/scripts/fix-smart-codes.sh`
- Sacred Six Schema: `/docs/schema/hera-sacred-six-schema.yaml`

---

**Remember:** Smart codes are validated at the database level. Invalid codes will cause RPC failures and break your application. Always validate before deployment!
