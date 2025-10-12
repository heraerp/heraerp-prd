-- Seed 02: Tax Rates Template
-- Inserts tax rates into dynamic data for the tax profile
-- Placeholders: :org, :tax_profile_id

-- Standard rate (placeholder 5%)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    :tax_profile_id::uuid,
    'rate.standard',
    5.0,  -- Placeholder rate - adjust for jurisdiction
    'Standard Tax Rate',
    'HERA.TAX.RATE.STANDARD.V1',
    :org::uuid,
    jsonb_build_object(
        'effective_from', CURRENT_DATE,
        'applies_to', jsonb_build_array('goods.standard', 'services.standard'),
        'description', 'Standard rate for most goods and services'
    )
);

-- Zero rate
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    :tax_profile_id::uuid,
    'rate.zero',
    0.0,
    'Zero Rate',
    'HERA.TAX.RATE.ZERO.V1',
    :org::uuid,
    jsonb_build_object(
        'categories', jsonb_build_array(
            'goods.export',
            'services.international'
        ),
        'description', 'Zero-rated items'
    )
);

-- Exempt categories
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    :tax_profile_id::uuid,
    'rate.exempt',
    'Exempt from Tax',
    'HERA.TAX.RATE.EXEMPT.V1',
    :org::uuid,
    jsonb_build_object(
        'categories', jsonb_build_array(
            'services.financial',
            'services.medical'
        ),
        'note', 'Exempt supplies cannot claim input tax'
    )
);

-- Consolidated rates object (for quick lookups)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    :tax_profile_id::uuid,
    'rates',
    '{}',  -- Will be populated by trigger/function
    'HERA.TAX.RATES.CONSOLIDATED.V1',
    :org::uuid,
    jsonb_build_object(
        'standard', 5.0,
        'zero', 0.0,
        'reduced', null,
        'super_reduced', null,
        'parking': null,
        'updated_at', CURRENT_TIMESTAMP
    )
);