-- Seed 01: Tax Profile Template
-- Creates a generic tax profile entity
-- Placeholders: :org, :profile_name
-- Returns: :tax_profile_id

DO $$
DECLARE
    v_tax_profile_id uuid;
BEGIN
    INSERT INTO core_entities (
        entity_type,
        entity_code,
        entity_name,
        smart_code,
        business_rules,
        organization_id,
        status
    ) VALUES (
        'tax_profile',
        'TAX_PROFILE_TEMPLATE',
        :profile_name,
        'HERA.TAX.PROFILE.V1',
        jsonb_build_object(
            'jurisdiction', 'GLOBAL',
            'tax_system', 'VAT',
            'inclusive_prices', true,
            'rounding_method', 'line',
            'registration_threshold', jsonb_build_object(
                'amount', 0,
                'currency', 'XXX',
                'period', 'annual'
            ),
            'filing_frequency', 'monthly',
            'payment_terms', 30,
            'reverse_charge_applicable', false,
            'digital_services_rules', false
        ),
        :org::uuid,
        'active'
    ) RETURNING id INTO v_tax_profile_id;
    
    -- Return the ID for use in subsequent seeds
    RAISE NOTICE 'Tax Profile ID: %', v_tax_profile_id;
END $$;

-- Usage:
-- psql will capture the NOTICE and you can use it as :tax_profile_id
-- Or modify to use a function that returns the UUID