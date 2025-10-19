# HERA Smart Code Guide

## 🎯 Purpose

Smart codes are HERA's DNA system - unique identifiers that provide business context and enable AI-powered automation. Every entity, field, and relationship must have a valid smart code.

## 📋 Pattern Requirements

### ✅ Valid Format
```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{NUMBER}
```

**Rules:**
- **Exactly 6 parts** (HERA + 4 segments + version)
- **All segments UPPERCASE letters only** (A-Z)
- **No underscores** (`_`)
- **No numbers** in segments (only in version)
- **No special characters** (`.` only as separator)
- **Version must be uppercase `V` followed by number** (V1, V2, etc.)

### ❌ Invalid Examples
```typescript
'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1'    // ❌ 7 parts + lowercase v
'HERA.SALON.PRODUCT.REL.STOCK_AT.v1'         // ❌ Contains underscore
'HERA.SALON.SERVICE.REL.HAS_CATEGORY.v1'    // ❌ 7 parts + lowercase v
'HERA.SALON.PRODUCT.DYN.PRICE_MARKET.V1'    // ❌ Contains underscore
```

### ✅ Correct Examples
```typescript
'HERA.SALON.PRODUCT.DYN.MARKET.V1'          // ✅ 6 parts, uppercase V
'HERA.SALON.PRODUCT.REL.LOCATION.V1'        // ✅ No underscores
'HERA.SALON.SERVICE.REL.CATEGORY.V1'        // ✅ Simple word
'HERA.SALON.CUSTOMER.DYN.PHONE.V1'          // ✅ Perfect format
```

## 🔧 Using the Smart Code Generator

### Installation

```typescript
import { SmartCodeBuilder, validateSmartCode } from '@/lib/dna/smart-code-generator'
```

### Quick Generation

```typescript
// Generate entity smart code
const entityCode = SmartCodeBuilder.entity('SALON', 'PRODUCT', 'ITEM')
// → 'HERA.SALON.PRODUCT.ENT.ITEM.V1'

// Generate relationship smart code
const relCode = SmartCodeBuilder.relationship('SALON', 'PRODUCT', 'CATEGORY')
// → 'HERA.SALON.PRODUCT.REL.CATEGORY.V1'

// Generate dynamic field smart code
const fieldCode = SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'PRICE')
// → 'HERA.SALON.PRODUCT.DYN.PRICE.V1'

// Generate transaction smart code
const txnCode = SmartCodeBuilder.transaction('SALON', 'POS', 'SALE')
// → 'HERA.SALON.POS.TXN.SALE.V1'

// Generate workflow smart code
const wfCode = SmartCodeBuilder.workflow('SALON', 'BOOKING', 'CONFIRMED')
// → 'HERA.SALON.BOOKING.WF.CONFIRMED.V1'
```

### Validation

```typescript
import { validateSmartCode } from '@/lib/dna/smart-code-generator'

const validation = validateSmartCode('HERA.SALON.PRODUCT.DYN.PRICE.V1')

if (!validation.valid) {
  console.error('Invalid smart code:', validation.errors)
  // Output: []
}

// Invalid example
const badValidation = validateSmartCode('HERA.SALON.PRODUCT.DYN.PRICE_MARKET.v1')
console.log(badValidation.errors)
// Output: [
//   'Segment 4 (PRICE_MARKET) can only contain uppercase letters',
//   'Version must be uppercase V followed by number'
// ]
```

## 📚 Common Patterns Reference

### Product Smart Codes

```typescript
// ✅ CORRECT
'HERA.SALON.PRODUCT.DYN.MARKET.V1'     // Market price
'HERA.SALON.PRODUCT.DYN.COST.V1'       // Cost price
'HERA.SALON.PRODUCT.DYN.SKU.V1'        // SKU
'HERA.SALON.PRODUCT.DYN.QUANTITY.V1'   // Stock quantity
'HERA.SALON.PRODUCT.DYN.BARCODE.V1'    // Barcode
'HERA.SALON.PRODUCT.REL.CATEGORY.V1'   // Category relationship
'HERA.SALON.PRODUCT.REL.LOCATION.V1'   // Location relationship
'HERA.SALON.PRODUCT.REL.SUPPLIER.V1'   // Supplier relationship
```

### Service Smart Codes

```typescript
// ✅ CORRECT
'HERA.SALON.SERVICE.DYN.MARKET.V1'     // Market price
'HERA.SALON.SERVICE.DYN.DURATION.V1'   // Duration in minutes
'HERA.SALON.SERVICE.DYN.COMMISSION.V1' // Commission rate
'HERA.SALON.SERVICE.REL.CATEGORY.V1'   // Category relationship
'HERA.SALON.SERVICE.REL.ROLE.V1'       // Role relationship
'HERA.SALON.SERVICE.REL.PRODUCT.V1'    // Product requirement
'HERA.SALON.SERVICE.REL.LOCATION.V1'   // Location availability
```

### Staff Smart Codes

```typescript
// ✅ CORRECT
'HERA.SALON.STAFF.DYN.PHONE.V1'        // Phone number
'HERA.SALON.STAFF.DYN.EMAIL.V1'        // Email address
'HERA.SALON.STAFF.DYN.RATE.V1'         // Hourly rate
'HERA.SALON.STAFF.DYN.HIRED.V1'        // Hire date
'HERA.SALON.STAFF.REL.ROLE.V1'         // Role relationship
'HERA.SALON.STAFF.REL.BRANCH.V1'       // Branch membership
'HERA.SALON.STAFF.REL.MANAGER.V1'      // Reports to
```

### Customer Smart Codes

```typescript
// ✅ CORRECT
'HERA.SALON.CUSTOMER.DYN.PHONE.V1'     // Phone number
'HERA.SALON.CUSTOMER.DYN.EMAIL.V1'     // Email address
'HERA.SALON.CUSTOMER.DYN.VIP.V1'       // VIP status
'HERA.SALON.CUSTOMER.DYN.LOYALTY.V1'   // Loyalty points
'HERA.SALON.CUSTOMER.REL.REFERRER.V1'  // Referred by
'HERA.SALON.CUSTOMER.REL.STYLIST.V1'   // Preferred stylist
```

## 🔍 Validation Script

Run validation on all smart codes in your codebase:

```bash
npx tsx scripts/validate-smart-codes.ts
```

This will:
- ✅ Validate all smart codes in `entityPresets.ts`
- ❌ Report any invalid patterns
- 💡 Suggest corrections for each issue

## 🛠️ Naming Guidelines

### Segment Types

1. **INDUSTRY** (Segment 1): Business vertical
   - `SALON` - Beauty/salon industry
   - `REST` - Restaurant industry
   - `RETAIL` - Retail industry
   - `JEWELRY` - Jewelry industry
   - `HCM` - Human capital management

2. **MODULE** (Segment 2): Feature area
   - `PRODUCT` - Product management
   - `SERVICE` - Service management
   - `CUSTOMER` - Customer management
   - `STAFF` - Staff management
   - `POS` - Point of sale
   - `BOOKING` - Appointments/bookings

3. **TYPE** (Segment 3): Smart code category
   - `ENT` - Entity (core business object)
   - `DYN` - Dynamic field (flexible attributes)
   - `REL` - Relationship (entity connections)
   - `TXN` - Transaction (business events)
   - `WF` - Workflow (process states)

4. **SUBTYPE** (Segment 4): Specific identifier
   - Keep it short and descriptive
   - Use single word or acronym
   - No underscores or special characters
   - Examples: `PRICE`, `CATEGORY`, `LOCATION`, `STATUS`

### Simplification Tips

When converting complex names to smart codes:

```typescript
// ❌ TOO COMPLEX
'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.V1'      // 7 parts
'HERA.SALON.SERVICE.REL.PERFORMED_BY_ROLE.V1' // Underscore

// ✅ SIMPLIFIED
'HERA.SALON.PRODUCT.DYN.MARKET.V1'      // Use context (it's obvious it's price)
'HERA.SALON.SERVICE.REL.ROLE.V1'        // Shorter, clearer
```

## 🚀 Best Practices

### 1. Use the Generator
```typescript
// ❌ DON'T manually construct
const smartCode = 'HERA.SALON.PRODUCT.DYN.PRICE_MARKET.v1'

// ✅ DO use the builder
const smartCode = SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'MARKET')
```

### 2. Validate Before Saving
```typescript
const smartCode = SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'MARKET')
const validation = validateSmartCode(smartCode)

if (!validation.valid) {
  throw new Error(`Invalid smart code: ${validation.errors.join(', ')}`)
}
```

### 3. Use Common Patterns
```typescript
import { COMMON_PATTERNS } from '@/lib/dna/smart-code-generator'

// Use pre-validated patterns
const categoryCode = COMMON_PATTERNS.PRODUCT_CATEGORY
const locationCode = COMMON_PATTERNS.PRODUCT_LOCATION
```

### 4. Keep Segments Simple
```typescript
// ❌ DON'T use multi-word compound names
'HERA.SALON.PRODUCT.DYN.MARKETING_PRICE.V1'

// ✅ DO use simple, contextual names
'HERA.SALON.PRODUCT.DYN.MARKET.V1'  // Context makes it clear
```

## 📊 Migration from Old Format

If you have old smart codes, use the generator to create correct versions:

```typescript
// Old format (INVALID)
const oldCode = 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1'

// New format (VALID)
const newCode = SmartCodeBuilder.dynamic('SALON', 'PRODUCT', 'MARKET')
// → 'HERA.SALON.PRODUCT.DYN.MARKET.V1'
```

## 🔧 Testing

```bash
# Run smart code validation tests
npm run test -- smart-code-generator.test.ts

# Validate all entity presets
npx tsx scripts/validate-smart-codes.ts
```

## ❓ FAQ

### Q: Can I use numbers in segments?
**A:** No, only uppercase letters (A-Z). Numbers are only allowed in the version segment (V1, V2).

### Q: What about abbreviations like "SKU" or "VIP"?
**A:** Yes! Abbreviations are perfect - they're short and clear. Just ensure they're all uppercase.

### Q: How do I handle multi-word concepts like "market price"?
**A:** Use context. Since you're in `PRODUCT.DYN`, just use `MARKET` - it's obvious it's a price field.

### Q: Can I use hyphens or underscores?
**A:** No. Only letters (A-Z) in segments. Use dots (.) only as separators between the 6 main parts.

### Q: What if I need more than 4 segments?
**A:** You don't. The 4-segment structure is designed to provide enough context without complexity. Simplify your naming.

## 🎯 Summary

**Golden Rules:**
1. ✅ Always use `SmartCodeBuilder` to generate codes
2. ✅ Validate with `validateSmartCode()` before saving
3. ✅ Keep segments simple (one word or acronym)
4. ✅ Use uppercase letters only in segments
5. ✅ Use uppercase `V` in version (V1, not v1)
6. ❌ Never use underscores, numbers, or special characters in segments
7. ❌ Never exceed 6 total parts

**The pattern is your friend:**
```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{NUMBER}
     └────────┬──────────┘  └─┬──┘  └───┬────┘   └┬┘
              4 segments      Type     Name     Version
```
