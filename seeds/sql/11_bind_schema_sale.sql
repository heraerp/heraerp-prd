-- Seed 11: Bind Posting Schema to Sale Event
-- Creates relationship between posting schema and event type
-- Placeholders: :org, :schema_id

INSERT INTO core_relationships (
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    organization_id,
    metadata,
    status
) VALUES (
    :schema_id::uuid,  -- posting_schema entity
    NULL,              -- No specific target entity
    'applies_to',
    'HERA.CONFIG.BINDING.EVENT.V1',
    :org::uuid,
    jsonb_build_object(
        'event_smart_code', 'HERA.POS.SALE.V1',
        'binding_type', 'posting_schema',
        'priority', 1,
        'effective_date', CURRENT_DATE
    ),
    'active'
) RETURNING id AS binding_id;

-- Note: This creates a binding that says:
-- "When processing event HERA.POS.SALE.V1, use this posting schema"
-- The MCP/engine will query for relationships where:
-- - from_entity_id = posting schema
-- - relationship_type = 'applies_to'
-- - metadata->>'event_smart_code' = incoming event code