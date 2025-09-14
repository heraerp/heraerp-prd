# 🧬 HERA DNA Pricing Procedure - Universal Pricing Intelligence

## Overview

HERA's Pricing Procedure is a **revolutionary DNA component** that delivers enterprise-grade pricing capabilities using only the universal 6-table architecture. No custom tables, no schema changes - just intelligent configuration that works across all industries.

## 🏗️ Architecture: How Pricing Lives in the Sacred Six

### 1. **core_entities** - Pricing Artifacts as Entities

```sql
-- Pricing Procedure Entity
{
  id: 'uuid-procedure-001',
  entity_type: 'pricing_procedure',
  entity_name: 'Standard Sales Pricing 2025',
  entity_code: 'PROC-SALES-STD-2025',
  smart_code: 'HERA.SALES.PRICING.PROCEDURE.STANDARD.v1',
  organization_id: 'org-uuid',
  metadata: {
    currency_support: ['USD', 'EUR', 'AED'],
    applicable_regions: ['NA', 'EMEA', 'APAC'],
    priority: 100
  }
}

-- Pricing Condition Entities
{
  entity_type: 'pricing_condition',
  entity_name: 'Volume Discount Tier 1',
  smart_code: 'HERA.SALES.PRICING.CONDITION.VOLUME_DISCOUNT.v2'
}
```

### 2. **core_dynamic_data** - Pricing Logic & Rules

```javascript
// Stored against pricing_condition entities
{
  field_name: 'pricing_rule',
  field_value_json: {
    "condition_type": "DISCOUNT",
    "calculation_type": "PERCENTAGE",
    "basis": "quantity",
    "tiers": [
      { "min": 0, "max": 99, "rate": 0 },
      { "min": 100, "max": 499, "rate": 0.05 },
      { "min": 500, "max": 999, "rate": 0.10 },
      { "min": 1000, "max": null, "rate": 0.15 }
    ],
    "calculation_sequence": 20,
    "exclusive_groups": ["VOLUME_DISCOUNTS"],
    "prerequisite_conditions": ["BASE_PRICE"],
    "applicable_products": ["smart_code LIKE 'HERA.FURN.PROD.%'"],
    "applicable_customers": ["customer_group IN ('WHOLESALE', 'DISTRIBUTOR')"],
    "valid_from": "2025-01-01",
    "valid_to": "2025-12-31",
    "formula": "base_price * (1 - rate)"
  },
  smart_code: 'HERA.SALES.PRICING.RULE.VOLUME_TIER.v1'
}
```

### 3. **core_relationships** - Procedure Orchestration

```sql
-- Pricing Procedure → Condition Relationships
{
  from_entity_id: 'procedure-uuid',      -- Pricing Procedure
  to_entity_id: 'condition-base-uuid',   -- Base Price Condition
  relationship_type: 'HAS_PRICING_STEP',
  smart_code: 'HERA.SALES.PRICING.REL.STEP.v1',
  metadata: {
    sequence: 10,
    mandatory: true,
    stop_on_error: true
  }
}

-- Condition Dependencies
{
  from_entity_id: 'condition-discount-uuid',
  to_entity_id: 'condition-base-uuid',
  relationship_type: 'DEPENDS_ON',
  smart_code: 'HERA.SALES.PRICING.REL.DEPENDENCY.v1'
}
```

### 4. **universal_transactions** - Pricing Execution Header

```javascript
{
  transaction_type: 'pricing_execution',
  transaction_code: 'PRICE-2025-001234',
  smart_code: 'HERA.SALES.PRICING.TX.ORDER.v1',
  total_amount: 4250.00,  // Final calculated price
  from_entity_id: 'customer-uuid',
  to_entity_id: 'sales-order-uuid',
  metadata: {
    procedure_used: 'PROC-SALES-STD-2025',
    currency: 'USD',
    pricing_date: '2025-01-15',
    context: {
      customer_group: 'WHOLESALE',
      region: 'NA',
      channel: 'B2B'
    }
  }
}
```

### 5. **universal_transaction_lines** - Applied Conditions

```javascript
// Line 1: Base Price
{
  line_number: 1,
  line_type: 'BASE_PRICE',
  line_amount: 5000.00,
  smart_code: 'HERA.SALES.PRICING.LINE.BASE.v1',
  metadata: {
    condition_id: 'condition-base-uuid',
    calculation: 'list_price',
    product_id: 'product-uuid'
  }
}

// Line 2: Volume Discount Applied
{
  line_number: 2,
  line_type: 'DISCOUNT',
  line_amount: -500.00,  // 10% of 5000
  smart_code: 'HERA.SALES.PRICING.LINE.VOLUME_DISCOUNT.v2',
  metadata: {
    condition_id: 'condition-vol-disc-uuid',
    calculation: '5000 * 0.10',
    tier_applied: 'TIER_3',
    quantity: 750
  }
}

// Line 3: Customer Special Discount
{
  line_number: 3,
  line_type: 'DISCOUNT',
  line_amount: -250.00,  // 5% additional
  smart_code: 'HERA.SALES.PRICING.LINE.CUSTOMER_SPECIAL.v1'
}

// Line 4: Tax
{
  line_number: 4,
  line_type: 'TAX',
  line_amount: 0.00,  // Tax-exempt customer
  smart_code: 'HERA.SALES.PRICING.LINE.TAX_EXEMPT.v1'
}
```

### 6. **core_organizations** - Multi-tenant Pricing Isolation

Each organization can have completely different pricing procedures, conditions, and rules - perfect data isolation.

## 🎯 Key Features

### 1. **Condition Types Library**
```javascript
const PRICING_CONDITIONS = {
  // Price Determination
  BASE_PRICE: 'List price from product master',
  COST_PLUS: 'Cost + markup calculation',
  
  // Discounts
  VOLUME_DISCOUNT: 'Quantity-based tiers',
  CUSTOMER_DISCOUNT: 'Customer-specific rates',
  PROMOTIONAL_DISCOUNT: 'Time-bound campaigns',
  CASH_DISCOUNT: 'Early payment terms',
  
  // Surcharges
  FREIGHT_CHARGE: 'Delivery costs',
  HANDLING_FEE: 'Special handling',
  RUSH_CHARGE: 'Expedited processing',
  
  // Taxes & Duties
  SALES_TAX: 'Regional tax rates',
  VAT: 'Value-added tax',
  CUSTOMS_DUTY: 'Import duties',
  
  // Special
  PRICE_OVERRIDE: 'Manual price entry',
  COMPETITOR_MATCH: 'Match external price'
}
```

### 2. **Calculation Sequences**
```javascript
// Typical sequence in core_relationships
10: BASE_PRICE        // Start with list price
20: VOLUME_DISCOUNT   // Apply quantity breaks
30: CUSTOMER_DISCOUNT // Layer customer discount
40: PROMO_DISCOUNT    // Campaign discounts
50: SUBTOTAL         // Calculate subtotal
60: FREIGHT          // Add delivery
70: TAX              // Calculate tax
80: TOTAL            // Final price
```

### 3. **Advanced Pricing Features**

#### **Tiered Pricing**
```javascript
{
  "tiers": [
    { "min": 1, "max": 99, "rate": 0, "fixed_discount": 0 },
    { "min": 100, "max": 499, "rate": 0.05, "fixed_discount": 0 },
    { "min": 500, "max": 999, "rate": 0.08, "fixed_discount": 50 },
    { "min": 1000, "max": null, "rate": 0.10, "fixed_discount": 100 }
  ],
  "tier_type": "GRADUATED"  // or "VOLUME"
}
```

#### **Bundle Pricing**
```javascript
{
  "bundle_components": [
    { "product": "CHAIR", "quantity": 4, "discount": 0.10 },
    { "product": "TABLE", "quantity": 1, "discount": 0.05 }
  ],
  "bundle_discount": 0.15,  // Additional bundle discount
  "min_bundle_value": 1000
}
```

#### **Date-based Pricing**
```javascript
{
  "seasonal_rates": [
    { "period": "PEAK", "months": [6,7,8,12], "multiplier": 1.25 },
    { "period": "REGULAR", "months": [3,4,5,9,10,11], "multiplier": 1.0 },
    { "period": "OFF_PEAK", "months": [1,2], "multiplier": 0.85 }
  ]
}
```

#### **Customer Group Pricing**
```javascript
{
  "customer_groups": {
    "RETAIL": { "discount": 0, "payment_terms": "NET30" },
    "WHOLESALE": { "discount": 0.15, "payment_terms": "NET45" },
    "DISTRIBUTOR": { "discount": 0.25, "payment_terms": "NET60" },
    "VIP": { "discount": 0.30, "payment_terms": "NET90" }
  }
}
```

## 🚀 Implementation Examples

### Example 1: Restaurant Menu Pricing
```javascript
// Happy Hour Pricing Procedure
const happyHourProcedure = {
  entity_type: 'pricing_procedure',
  entity_name: 'Happy Hour Pricing',
  smart_code: 'HERA.REST.PRICING.PROCEDURE.HAPPY_HOUR.v1'
}

// Time-based Condition
const happyHourCondition = {
  entity_type: 'pricing_condition',
  smart_code: 'HERA.REST.PRICING.CONDITION.TIME_BASED.v1',
  dynamic_data: {
    condition_type: 'DISCOUNT',
    rate: 0.30,  // 30% off
    applicable_hours: { start: '15:00', end: '18:00' },
    applicable_days: [1,2,3,4,5],  // Mon-Fri
    applicable_categories: ['BEVERAGES', 'APPETIZERS']
  }
}
```

### Example 2: B2B Furniture Pricing
```javascript
// Volume + Customer Type Pricing
const b2bProcedure = {
  steps: [
    { seq: 10, condition: 'BASE_PRICE', source: 'product_master' },
    { seq: 20, condition: 'VOLUME_DISCOUNT', tiers: 'quantity_based' },
    { seq: 30, condition: 'TRADE_DISCOUNT', rate: 'by_customer_type' },
    { seq: 40, condition: 'LOYALTY_BONUS', calculation: 'purchase_history' },
    { seq: 50, condition: 'FREIGHT', method: 'weight_distance' },
    { seq: 60, condition: 'TAX', rate: 'by_jurisdiction' }
  ]
}
```

### Example 3: Healthcare Service Pricing
```javascript
// Insurance-based Pricing
const healthcareProcedure = {
  steps: [
    { seq: 10, condition: 'SERVICE_FEE', source: 'fee_schedule' },
    { seq: 20, condition: 'INSURANCE_ADJUSTMENT', contract: 'payer_specific' },
    { seq: 30, condition: 'COPAY', patient_responsibility: true },
    { seq: 40, condition: 'DEDUCTIBLE', annual_tracking: true }
  ]
}
```

## 🔧 API Usage

```typescript
// Create a pricing procedure
const procedure = await universalApi.createEntity({
  entity_type: 'pricing_procedure',
  entity_name: 'Q1 2025 Sales Pricing',
  smart_code: 'HERA.SALES.PRICING.PROCEDURE.Q1_2025.v1'
})

// Add pricing conditions
const volumeDiscount = await universalApi.createEntity({
  entity_type: 'pricing_condition',
  entity_name: 'Volume Discount Tiers',
  smart_code: 'HERA.SALES.PRICING.CONDITION.VOLUME.v1'
})

// Define the rule logic
await universalApi.setDynamicField(volumeDiscount.id, 'pricing_rule', {
  condition_type: 'DISCOUNT',
  calculation_type: 'TIERED',
  tiers: [
    { min: 100, rate: 0.05 },
    { min: 500, rate: 0.10 },
    { min: 1000, rate: 0.15 }
  ]
})

// Link condition to procedure
await universalApi.createRelationship({
  from_entity_id: procedure.id,
  to_entity_id: volumeDiscount.id,
  relationship_type: 'HAS_PRICING_STEP',
  metadata: { sequence: 20 }
})

// Execute pricing
const pricingResult = await universalApi.executePricing({
  procedure_id: procedure.id,
  context: {
    customer_id: 'customer-uuid',
    products: [{ id: 'product-uuid', quantity: 750 }],
    currency: 'USD',
    date: '2025-01-15'
  }
})
```

## 💡 Business Benefits

### **1. Zero Custom Development**
- No pricing tables to design
- No schema migrations
- Works with existing 6-table architecture

### **2. Infinite Flexibility**
- Any pricing model possible
- Complex multi-tier calculations
- Industry-specific rules

### **3. Complete Audit Trail**
- Every price calculation stored
- Full transparency on applied conditions
- Historical pricing reconstruction

### **4. Multi-tenant Ready**
- Each org has isolated pricing
- Different procedures per tenant
- Shared or unique conditions

### **5. Real-time Modifications**
- Change rules instantly
- No code deployment needed
- A/B test pricing strategies

## 🛡️ Guardrail Enforcement

1. **No Custom Columns**: All pricing data in core_dynamic_data
2. **Smart Code Required**: Every pricing element has context
3. **Organization Isolation**: Pricing never leaks between tenants
4. **Audit Everything**: Complete transaction history
5. **Version Control**: Smart code versions track changes

## 🎯 Summary

HERA's Pricing Procedure DNA proves that complex enterprise pricing can be achieved with just the universal 6-table architecture:

- **Procedures & Rules** = `core_entities` + `core_dynamic_data`
- **Sequencing & Dependencies** = `core_relationships`
- **Execution & Audit** = `universal_transactions` + `universal_transaction_lines`
- **Governance** = Smart codes + Guardrails

**Result**: Enterprise-grade pricing without enterprise complexity. Any business, any model, zero schema changes.