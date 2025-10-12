-- Seed 03: Bind Posting Schema to Tax Profile
-- Creates relationship between posting schema and tax profile
-- Placeholders: :org, :schema_id, :tax_profile_id

INSERT INTO core_relationships (
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    organization_id,
    metadata,
    status
) VALUES (
    :schema_id::uuid,        -- posting_schema entity
    :tax_profile_id::uuid,   -- tax_profile entity
    'uses_tax_profile',
    'HERA.CONFIG.BINDING.TAX.V1',
    :org::uuid,
    jsonb_build_object(
        'binding_type', 'posting_schema_tax',
        'priority', 1,
        'effective_date', CURRENT_DATE,
        'notes', 'Links posting schema to tax profile for automatic tax calculation'
    ),
    'active'
) RETURNING id AS tax_binding_id;

-- Note: This relationship allows the posting engine to:
-- 1. Find the posting schema for an event (via 'applies_to')
-- 2. Find the tax profile for that schema (via 'uses_tax_profile')
-- 3. Apply tax rates during journal generation