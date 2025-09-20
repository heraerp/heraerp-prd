# HERA Salon POS Pricing System

## 🎯 Overview

Complete server-side pricing engine for salon POS operations with automatic reprice hooks, discount/tip management, and tax calculations. All pricing logic implemented as YAML procedures in the Sacred Six tables architecture.

## 🏗️ Architecture

### **Core Principles**
- **Server-Side Pricing Only**: No client-provided prices accepted
- **Discounts/Tips as Lines**: Never mutate base line prices  
- **Idempotent Operations**: Safe retry with same results
- **Fast Performance**: <150ms target with warm cache
- **Complete Audit Trail**: Every pricing decision logged

### **Procedure Components**

1. **HERA.SALON.POS.PRICING.EVAL.V1** - Base pricing from pricebook + membership + packages
2. **HERA.SALON.TAX.UK.VAT.STANDARD.V1** - VAT calculation (tips non-taxable)
3. **HERA.SALON.POS.CART.REPRICE.V1** - Orchestrates complete repricing workflow

### **Automatic Reprice Hooks**
Cart repricing runs automatically after any line changes via orchestration:
- After `ADD_LINE` → `REPRICE`
- After `UPDATE_LINE` → `REPRICE` 
- After `DELETE_LINE` → `REPRICE`

## 🔌 API

### **POST /api/v1/salon/pos/carts/:id/reprice**

**Headers:**
```
Idempotency-Key: <uuid>  # Required for safe retries
```

**Request Body:**
```json
{
  "discount": {
    "type": "percent" | "amount",
    "value": 10,
    "reason": "LOYALTY"
  },
  "tip": {
    "method": "card" | "cash", 
    "amount": 8.00
  },
  "options": {
    "tax_smart_code": "HERA.SALON.TAX.UK.VAT.STANDARD.V1",
    "force_refresh": false
  }
}
```

**Response:**
```json
{
  "pricing_summary": {
    "subtotal": 100.00,
    "discounts": 10.00,
    "tax": 18.00,
    "tip": 8.00,
    "total": 116.00,
    "line_count": 7,
    "notes": "VAT 20% on services/retail only; tips excluded"
  },
  "lines_changed": ["ln_discount_cart", "ln_tip", "ln_tax"]
}
```

## 📊 Data Model

### **Cart Lines (universal_transaction_lines)**

**Base Lines:**
- `SERVICE` → Service smart code (e.g., `HERA.SALON.SVC.COLOR.TONER.V1`)
- `RETAIL` → Product smart code (e.g., `HERA.SALON.RETAIL.SHAMPOO.COLORSAFE.V1`)

**Adjustment Lines:**
- `DISCOUNT` → `HERA.SALON.POS.ADJUST.DISCOUNT.CART.{PCT|AMT}.V1`
- `TIP` → `HERA.SALON.TIP.{CARD|CASH}.V1`
- `TAX` → `HERA.SALON.TAX.UK.VAT.STANDARD.V1`

### **Organization Policy (core_dynamic_data)**

```json
{
  "pricing": {
    "pricebook": {
      "version": "v2024.1",
      "cache_ttl_minutes": 60
    },
    "rounding": {
      "mode": "BANKERS",
      "scale": 2
    }
  },
  "tax": {
    "standard_rate_pct": 20,
    "tips_taxable": false,
    "inclusive_pricing": false
  },
  "discount": {
    "policy": {
      "max_pct": 50,
      "requires_approval_above": 25
    }
  },
  "membership": {
    "tiers": {
      "VIP": { "discount_pct": 10 },
      "PLATINUM": { "discount_pct": 15 }
    }
  }
}
```

### **Cart Header (universal_transactions.metadata)**

```json
{
  "pricing_summary": {
    "subtotal": 100.00,
    "discounts": 10.00,
    "tax": 18.00,
    "tip": 8.00,
    "total": 116.00,
    "line_count": 7
  },
  "last_reprice_at": "2025-09-18T09:30:00Z",
  "last_reprice_version": "v1.2.0",
  "idempotency_key": "uuid-key"
}
```

## 🔄 Workflow

### **1. Pricing Evaluation**
```yaml
Input: organization_id, cart_id
Process:
  - Load pricebook + membership + packages
  - Price each SERVICE/RETAIL line from server data
  - Apply membership discounts
  - Apply package entitlements
  - Store original_unit_price for strike-through display
Output: subtotal, priced_line_ids
```

### **2. Discount Application**
```yaml
Input: discount {type, value, reason}
Process:
  - Validate against org policy max_pct
  - Calculate discount amount
  - Upsert DISCOUNT line with appropriate smart code:
    - percent → HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1
    - amount → HERA.SALON.POS.ADJUST.DISCOUNT.CART.AMT.V1
Output: discount_amount, line_id
```

### **3. Tip Processing**
```yaml
Input: tip {method, amount}
Process:
  - Validate tip amount > 0
  - Upsert TIP line with method-specific smart code:
    - card → HERA.SALON.TIP.CARD.V1
    - cash → HERA.SALON.TIP.CASH.V1
Output: tip_amount, line_id
```

### **4. Tax Calculation**
```yaml
Input: organization_id, cart_id
Process:
  - Calculate taxable_base = sum(SERVICE + RETAIL - DISCOUNTS)
  - Exclude TIPS from tax base
  - Apply org tax rate (default 20% VAT)
  - Round per org rounding policy
  - Upsert single TAX line
Output: tax_amount, taxable_base, rate_pct
```

### **5. Summary Computation**
```yaml
Process:
  - Sum all line amounts
  - Compute total = subtotal - discounts + tax + tip
  - Verify sum(lines) == total within rounding tolerance
  - Update cart header with pricing_summary
  - Store reprice timestamp and version
Output: complete pricing_summary
```

## 🧪 Test Scenarios

### **Unit Tests**
- ✅ Pricing: Pricebook lookup + membership discount applied
- ✅ Discount validation: Percent > policy → error
- ✅ Tips: Excluded from tax base calculation
- ✅ Tax: Rate from org policy + proper rounding
- ✅ Client price rejection: Server-side pricing enforced

### **E2E Test Cases**

**Base Cart:**
```
Services: £40 + £60 = £100 subtotal
VAT: 20% × £100 = £20 tax
Total: £120
```

**Apply 10% Discount:**
```
Subtotal: £100
Discount: £10 (10% of £100)
Tax: £18 (20% of £90 taxable base)
Total: £108
```

**Add £8 Card Tip:**
```
Subtotal: £100
Discount: £10
Tax: £18 (tips non-taxable)
Tip: £8
Total: £116
```

**Remove Discount:**
```
Subtotal: £100
Discount: £0
Tax: £20 (back to full rate)
Tip: £8
Total: £128
```

**Change Org VAT to 5%:**
```
Subtotal: £100
Tax: £5 (5% rate)
Total: £105
```

### **Property Tests**
- ✅ `sum(lines) == pricing_summary.total` (within rounding)
- ✅ Idempotency: Same key + payload → identical result
- ✅ Performance: Reprice completes <150ms

## 🚀 Implementation Status

### **✅ Completed**
- [x] Smart code constraint fix (uppercase/lowercase V support)
- [x] Pricing evaluation procedure (`HERA.SALON.POS.PRICING.EVAL.V1`)
- [x] UK VAT tax procedure (`HERA.SALON.TAX.UK.VAT.STANDARD.V1`)
- [x] Composite reprice procedure (`HERA.SALON.POS.CART.REPRICE.V1`)
- [x] API handler with idempotency support
- [x] Comprehensive test suite
- [x] Automatic reprice hooks in orchestration
- [x] All procedures registered in Sacred Six tables

### **🎯 Smart Codes Implemented**

**Discount Lines:**
- `HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1` - Percent discount
- `HERA.SALON.POS.ADJUST.DISCOUNT.CART.AMT.V1` - Amount discount

**Tip Lines:**
- `HERA.SALON.TIP.CARD.V1` - Card tip
- `HERA.SALON.TIP.CASH.V1` - Cash tip

**Tax Lines:**
- `HERA.SALON.TAX.UK.VAT.STANDARD.V1` - UK VAT calculation

**Procedures:**
- `HERA.SALON.POS.PRICING.EVAL.V1` - Base pricing evaluation
- `HERA.SALON.TAX.UK.VAT.STANDARD.V1` - Tax calculation
- `HERA.SALON.POS.CART.REPRICE.V1` - Complete reprice workflow

## 🔧 Configuration

### **Organization Tax Policy**
```sql
INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_json)
VALUES (
  'your-org-id',
  'your-org-entity-id', 
  'tax_policy',
  '{
    "standard_rate_pct": 20,
    "tips_taxable": false,
    "rounding_mode": "BANKERS",
    "rounding_scale": 2
  }'
);
```

### **Discount Policy**
```sql
INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_json)
VALUES (
  'your-org-id',
  'your-org-entity-id',
  'discount_policy', 
  '{
    "max_pct": 50,
    "requires_approval_above": 25,
    "allowed_reasons": ["LOYALTY", "BIRTHDAY", "EMPLOYEE", "MANAGER_OVERRIDE"]
  }'
);
```

## 📈 Performance Metrics

### **Target Performance**
- Reprice operation: <150ms (warm cache)
- Pricing evaluation: <100ms per cart
- Tax calculation: <50ms per cart
- Database queries: <20ms per operation

### **Monitoring**
- `pricing_eval_duration_ms`
- `tax_calc_duration_ms`
- `reprice_total_duration_ms`
- `lines_changed_count`
- `discount_amount_applied`
- `tax_amount_calculated`

## 🔒 Security & Validation

### **Input Validation**
- Discount value: 0 ≤ value ≤ org.max_pct
- Tip amount: amount > 0 and reasonable limit
- Cart status: Must be ACTIVE for repricing
- Organization context: Required for all operations

### **Business Rules Enforced**
- No client-provided pricing accepted
- Single tax line per cart (summary approach)
- Tips excluded from tax calculations
- Discount/tip lines are upserted (no duplicates)
- Complete audit trail for all pricing decisions

## 🚨 Error Handling

### **Common Error Codes**
- `CART_NOT_FOUND` - Invalid cart ID
- `CART_NOT_ACTIVE` - Cart not in active status
- `CLIENT_PRICE_REJECTED` - Client attempted to set price
- `DISCOUNT_EXCEEDS_POLICY` - Discount > org maximum
- `INVALID_TIP_AMOUNT` - Tip amount validation failed
- `TAX_POLICY_NOT_CONFIGURED` - Missing org tax setup
- `IDEMPOTENCY_CONFLICT` - Same key, different payload

### **Fallback Behaviors**
- Missing tax policy → Default 20% VAT rate
- Missing discount policy → Default 50% maximum
- Pricing evaluation failure → Return error (no fallback pricing)
- Tax calculation failure → Return error (no tax estimation)

This implementation provides a complete, production-ready pricing system that handles all salon POS pricing scenarios with proper validation, audit trails, and performance optimization.