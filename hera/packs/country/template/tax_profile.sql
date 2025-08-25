-- Template Tax Profile
-- Copy this template and modify for new countries/jurisdictions

-- 1. Create the tax profile entity
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    smart_code,
    business_rules,
    organization_id,
    status
) VALUES (
    gen_random_uuid(), -- Generate new UUID for each country
    'tax_profile',
    'TAX_PROFILE_XX_TYPE', -- Replace XX with country code, TYPE with tax type
    'Country Tax Type Profile', -- Descriptive name
    'HERA.TAX.PROFILE.XX.TYPE.v1', -- Smart code pattern
    jsonb_build_object(
        'jurisdiction', 'XX', -- ISO country code
        'tax_system', 'TYPE', -- VAT, GST, Sales Tax, etc.
        'inclusive_prices', true, -- Are prices tax-inclusive?
        'rounding_method', 'line', -- none | line | total | swedish
        'registration_threshold', jsonb_build_object(
            'amount', 0,
            'currency', 'XXX', -- ISO currency code
            'period', 'annual' -- annual | monthly | quarterly
        ),
        'filing_frequency', 'monthly', -- monthly | quarterly | annual
        'payment_terms', 30, -- Days to pay after filing
        'reverse_charge_applicable', false,
        'digital_services_rules', false
    ),
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944', -- System organization
    'active'
);

-- 2. Standard rate
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'tax-profile-uuid', -- Reference the UUID from step 1
    'rate.standard',
    0.0, -- Standard rate percentage
    'Standard Tax Rate',
    'HERA.TAX.RATE.STANDARD.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'effective_from', 'YYYY-MM-DD',
        'applies_to', jsonb_build_array('goods.standard', 'services.standard'),
        'description', 'Standard rate for most goods and services'
    )
);

-- 3. Reduced rate (if applicable)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'tax-profile-uuid',
    'rate.reduced',
    0.0, -- Reduced rate percentage
    'Reduced Tax Rate',
    'HERA.TAX.RATE.REDUCED.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'categories', jsonb_build_array(
            'goods.essential',
            'services.healthcare',
            'services.education'
        ),
        'description', 'Reduced rate for essential items'
    )
);

-- 4. Zero rate (if applicable)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'tax-profile-uuid',
    'rate.zero',
    0.0,
    'Zero Rate',
    'HERA.TAX.RATE.ZERO.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'categories', jsonb_build_array(
            'goods.export',
            'services.international'
        ),
        'conditions', 'Must meet export documentation requirements'
    )
);

-- 5. Exempt categories
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'tax-profile-uuid',
    'rate.exempt',
    'Exempt from Tax',
    'HERA.TAX.RATE.EXEMPT.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'categories', jsonb_build_array(
            'services.financial',
            'services.insurance',
            'services.medical'
        ),
        'note', 'Exempt supplies may not claim input tax'
    )
);

-- 6. Special rules (customize as needed)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'tax-profile-uuid',
    'special_rules',
    'Special tax rules',
    'HERA.TAX.SPECIAL_RULES.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'small_supplier_scheme', jsonb_build_object(
            'threshold', 0,
            'rate', 0,
            'simplified_filing', true
        ),
        'cash_accounting_scheme', jsonb_build_object(
            'threshold', 0,
            'mandatory', false
        )
    )
);

-- 7. Filing information
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'tax-profile-uuid',
    'filing.information',
    'Tax filing requirements',
    'HERA.TAX.FILING.INFO.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'return_format', 'electronic', -- electronic | paper | both
        'payment_methods', jsonb_build_array('bank_transfer', 'online'),
        'penalties', jsonb_build_object(
            'late_filing', 'Description of penalties',
            'late_payment', 'Interest calculation method',
            'incorrect_return', 'Penalty structure'
        ),
        'tax_authority', jsonb_build_object(
            'name', 'Tax Authority Name',
            'website', 'https://tax.gov.xx',
            'helpline', '+XX XXX XXX XXXX'
        )
    )
);