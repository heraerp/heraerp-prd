-- Seed 10: Global Posting Schema
-- Creates a posting schema entity with DSL configuration
-- Placeholders: :org, :dsl_json

INSERT INTO core_entities (
    entity_type,
    entity_code,
    entity_name,
    smart_code,
    business_rules,
    organization_id,
    status
) VALUES (
    'posting_schema',
    'POSTING_SCHEMA_GLOBAL',
    'Global POS Posting Schema',
    'HERA.POS.POSTING.SCHEMA.v1',
    :dsl_json::jsonb, -- Must match posting schema DSL format
    :org::uuid,
    'active'
) RETURNING id AS posting_schema_id;

-- DSL JSON Structure Expected:
-- {
--   "ledgers": ["GL"],
--   "accounts": {
--     "revenue": "uuid-of-revenue-account",
--     "tax_output": "uuid-of-tax-payable-account",
--     "tips_payable": "uuid-of-tips-payable-account",
--     "clearing": "uuid-of-clearing-account",
--     "fees": "uuid-of-payment-fees-account"
--   },
--   "tax": {
--     "profile_ref": "uuid-of-tax-profile",
--     "inclusive_prices": true,
--     "rounding": "line"
--   },
--   "splits": {
--     "dimensions": ["org_unit", "staff_id"],
--     "rules": [
--       {
--         "event_pattern": "HERA\\.POS\\..*",
--         "split_by": "staff_id",
--         "allocation_method": "proportional"
--       }
--     ]
--   },
--   "dimension_requirements": [
--     {
--       "account_pattern": "^4.*",
--       "required_dimensions": ["org_unit", "staff_id"],
--       "enforcement": "error"
--     }
--   ],
--   "payments": {
--     "capture_type": "immediate",
--     "open_item": false
--   }
-- }