# Country Pack System

## Overview

Country Packs provide jurisdiction-specific tax configurations without modifying the 6-table schema. Each pack contains:

1. **Tax Profile Entity** - Configuration in `core_entities`
2. **Tax Rates** - Stored in `core_dynamic_data`
3. **Binding Function** - Links profiles to organizations

## Creating a New Country Pack

1. Copy the template folder:
```bash
cp -r template/ xx/  # Replace xx with country code
```

2. Edit `xx/tax_profile.sql`:
   - Generate new UUID for the profile
   - Set jurisdiction code (ISO 3166-1 alpha-2)
   - Configure tax system type (VAT, GST, Sales Tax)
   - Define rates and categories
   - Add special rules

3. Edit `xx/binding.sql`:
   - Update function name
   - Reference correct profile UUID
   - Add validation logic

## Available Country Packs

| Country | Code | Tax System | Standard Rate | Status |
|---------|------|------------|---------------|---------|
| UAE | ae | VAT | 5% | ✅ Complete |
| USA | us | Sales Tax | Varies by state | 🔄 Template |
| UK | gb | VAT | 20% | 🔄 Template |
| India | in | GST | 18% | 🔄 Template |
| EU | eu | VAT | Varies | 🔄 Template |

## Universal Tax Categories

All country packs must map to these universal categories:

### Goods
- `goods.standard` - Standard rated goods
- `goods.essential` - Essential items (often reduced rate)
- `goods.luxury` - Luxury items (may have higher rate)
- `goods.export` - Exported goods (usually zero-rated)

### Services
- `services.standard` - Standard rated services
- `services.professional` - Professional services
- `services.digital` - Digital/electronic services
- `services.financial` - Financial services (often exempt)
- `services.international` - Cross-border services

### Special
- `exempt` - Exempt from tax
- `out_of_scope` - Outside tax scope
- `reverse_charge` - Reverse charge mechanism

## Binding Profiles to Organizations

```sql
-- Bind UAE VAT profile
SELECT bind_uae_vat_profile(
    'org-uuid'::uuid,
    '100123456700003',  -- Tax registration number
    '2025-01-01'::date   -- Effective date
);
```

## Tax Calculation Flow

1. **Transaction Created** → Smart code identifies tax relevance
2. **Profile Lookup** → Find organization's active tax profile
3. **Category Resolution** → Determine tax category for each item
4. **Rate Application** → Apply rates based on category
5. **Special Rules** → Check for reverse charge, exemptions
6. **Rounding** → Apply jurisdiction-specific rounding

## Testing a Country Pack

```sql
-- 1. Create test organization
INSERT INTO core_organizations (name, smart_code) 
VALUES ('Test Org', 'HERA.TEST.ORG.v1')
RETURNING id;

-- 2. Bind tax profile
SELECT bind_tax_profile('org-id', 'profile-id');

-- 3. Create test transaction
-- Transaction will automatically use bound tax profile
```

## Best Practices

1. **Use System Organization** - Tax profiles belong to system org
2. **Effective Dates** - Always track when rates change
3. **Audit Trail** - Log all bindings and changes
4. **Categories** - Map local categories to universal ones
5. **Validation** - Include registration number format validation