-- UAE VAT Profile
-- Standard VAT implementation for United Arab Emirates
-- Effective from January 1, 2018

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
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- Fixed UUID for system profile
    'tax_profile',
    'TAX_PROFILE_AE_VAT',
    'UAE VAT Standard Profile',
    'HERA.TAX.PROFILE.AE.VAT.v1',
    jsonb_build_object(
        'jurisdiction', 'AE',
        'tax_system', 'VAT',
        'inclusive_prices', true,
        'rounding_method', 'line',
        'registration_threshold', jsonb_build_object(
            'amount', 375000,
            'currency', 'AED', 
            'period', 'annual'
        ),
        'filing_frequency', 'quarterly',
        'payment_terms', 30,
        'reverse_charge_applicable', true,
        'digital_services_rules', true,
        'tourist_refund_scheme', true
    ),
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944', -- System organization
    'active'
);

-- 2. Standard VAT rate (5%)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rate.standard',
    5.0,
    'Standard VAT Rate',
    'HERA.TAX.RATE.STANDARD.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'effective_from', '2018-01-01',
        'applies_to', jsonb_build_array('goods.standard', 'services.standard'),
        'description', 'Standard 5% VAT rate for most goods and services'
    )
);

-- 3. Zero rate (0%)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rate.zero',
    0.0,
    'Zero Rate',
    'HERA.TAX.RATE.ZERO.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'categories', jsonb_build_array(
            'goods.export',
            'services.international_transport',
            'precious_metals.investment',
            'education.qualifying',
            'healthcare.preventive',
            'residential.first_supply',
            'crude_oil',
            'natural_gas'
        ),
        'conditions', 'Must meet specific criteria per FTA guidelines'
    )
);

-- 4. Exempt categories
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rate.exempt',
    'Exempt from VAT',
    'HERA.TAX.RATE.EXEMPT.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'categories', jsonb_build_array(
            'services.financial.qualifying',
            'residential.rental',
            'land.bare',
            'local_transport.passenger'
        ),
        'note', 'Exempt supplies cannot claim input VAT'
    )
);

-- 5. Reverse charge items
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'reverse_charge.items',
    'Items subject to reverse charge',
    'HERA.TAX.REVERSE_CHARGE.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'categories', jsonb_build_array(
            'services.imported',
            'goods.imported_b2b',
            'gold.investment',
            'diamonds.unworked'
        ),
        'mechanism', 'Recipient accounts for VAT'
    )
);

-- 6. Special schemes
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'schemes.margin',
    'Profit Margin Scheme',
    'HERA.TAX.SCHEME.MARGIN.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'applies_to', jsonb_build_array(
            'second_hand_goods',
            'art_works',
            'antiques'
        ),
        'calculation', 'VAT on profit margin only'
    )
);

-- 7. Tourist refund thresholds
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_number,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'tourist_refund.min_purchase',
    250.0,
    'Minimum purchase for tourist refund',
    'HERA.TAX.TOURIST_REFUND.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'currency', 'AED',
        'per_invoice', true,
        'processing_fee_percent', 5.0,
        'excluded_items', jsonb_build_array(
            'accommodation',
            'services',
            'consumables'
        )
    )
);

-- 8. Filing deadlines
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    smart_code,
    organization_id,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'filing.deadlines',
    'VAT return filing deadlines',
    'HERA.TAX.FILING.DEADLINES.v1',
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    jsonb_build_object(
        'quarterly', jsonb_build_object(
            'Q1', '2025-04-28',
            'Q2', '2025-07-28',
            'Q3', '2025-10-28',
            'Q4', '2026-01-28'
        ),
        'payment_due', 'Same as filing deadline',
        'penalties', jsonb_build_object(
            'late_filing', 'AED 1,000 first time, AED 2,000 repeat',
            'late_payment', '2% monthly on outstanding amount'
        )
    )
);