# Tax Profile Model - Country Pack Architecture

## Overview
Tax profiles are stored as `core_entities` rows with `entity_type = 'tax_profile'`. Tax rates and rules are stored in `core_dynamic_data`. This allows infinite tax complexity without schema changes.

## Tax Profile Entity Structure

```typescript
// Tax Profile as core_entities row
{
  id: 'uuid-v4',
  entity_type: 'tax_profile',
  entity_code: 'TAX_PROFILE_AE_VAT',
  entity_name: 'UAE VAT Standard Profile',
  smart_code: 'HERA.TAX.PROFILE.AE.VAT.v1',
  business_rules: {
    // Core tax configuration
    jurisdiction: 'AE',
    tax_system: 'VAT',
    inclusive_prices: true,
    rounding_method: 'line', // none | line | total | swedish
    
    // Registration thresholds
    registration_threshold: {
      amount: 375000,
      currency: 'AED',
      period: 'annual'
    },
    
    // Filing requirements
    filing_frequency: 'quarterly',
    payment_terms: 30,
    
    // Special rules
    reverse_charge_applicable: true,
    digital_services_rules: true
  },
  organization_id: 'system', // System profiles available to all orgs
  status: 'active'
}
```

## Tax Rates in core_dynamic_data

```typescript
// Standard rate
{
  entity_id: 'tax-profile-uuid',
  field_name: 'rate.standard',
  field_value_number: 5.0,
  field_value_text: 'Standard VAT Rate',
  smart_code: 'HERA.TAX.RATE.STANDARD.v1',
  metadata: {
    effective_from: '2018-01-01',
    applies_to: ['goods', 'services']
  }
}

// Zero rate
{
  entity_id: 'tax-profile-uuid',
  field_name: 'rate.zero',
  field_value_number: 0.0,
  field_value_text: 'Zero Rate (Exports, Education, Healthcare)',
  smart_code: 'HERA.TAX.RATE.ZERO.v1',
  metadata: {
    categories: ['exports', 'education', 'healthcare', 'residential_first_supply']
  }
}

// Exempt categories
{
  entity_id: 'tax-profile-uuid',
  field_name: 'rate.exempt',
  field_value_text: 'Exempt from VAT',
  smart_code: 'HERA.TAX.RATE.EXEMPT.v1',
  metadata: {
    categories: ['financial_services', 'residential_rental', 'bare_land']
  }
}

// Special rates (e.g., excise)
{
  entity_id: 'tax-profile-uuid',
  field_name: 'rate.excise.tobacco',
  field_value_number: 100.0,
  field_value_text: 'Tobacco Products Excise',
  smart_code: 'HERA.TAX.RATE.EXCISE.v1',
  metadata: {
    tax_type: 'excise',
    calculation_method: 'percentage',
    product_categories: ['tobacco']
  }
}
```

## Binding Tax Profiles to Organizations

```typescript
// Organization selects tax profile via relationship
{
  from_entity_id: 'organization-entity-id',
  to_entity_id: 'tax-profile-id',
  relationship_type: 'uses_tax_profile',
  smart_code: 'HERA.TAX.BINDING.PRIMARY.v1',
  metadata: {
    effective_date: '2025-01-01',
    tax_registration_number: '100123456700003'
  }
}
```

## Country Pack Structure

```
hera/packs/country/
├── ae/                         # UAE
│   ├── vat_profile.sql        # Standard VAT profile
│   ├── excise_profile.sql     # Excise tax profile
│   └── binding.sql            # How to bind to orgs
├── us/                         # United States
│   ├── sales_tax_profile.sql  # State-based sales tax
│   └── binding.sql
├── eu/                         # European Union
│   ├── vat_profile.sql        # EU VAT with OSS
│   └── binding.sql
└── template/                   # Template for new countries
    ├── tax_profile.sql
    └── binding.sql
```

## Universal Tax Categories

All tax profiles use these universal categories for consistent rate application:

```typescript
enum UniversalTaxCategory {
  // Goods
  GOODS_STANDARD = 'goods.standard',
  GOODS_ESSENTIAL = 'goods.essential',
  GOODS_LUXURY = 'goods.luxury',
  GOODS_EXPORT = 'goods.export',
  
  // Services  
  SERVICES_STANDARD = 'services.standard',
  SERVICES_PROFESSIONAL = 'services.professional',
  SERVICES_DIGITAL = 'services.digital',
  SERVICES_FINANCIAL = 'services.financial',
  
  // Special
  EXEMPT = 'exempt',
  OUT_OF_SCOPE = 'out_of_scope',
  REVERSE_CHARGE = 'reverse_charge'
}
```

## Benefits of This Architecture

1. **No Schema Changes**: All tax complexity handled in existing tables
2. **Infinite Flexibility**: Any tax system can be modeled
3. **Multi-Jurisdiction**: Organizations can use multiple tax profiles
4. **Audit Trail**: All rate changes tracked with effective dates
5. **Smart Integration**: Smart codes enable automatic tax determination