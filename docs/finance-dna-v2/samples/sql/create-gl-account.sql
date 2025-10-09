-- Finance DNA v2 - GL Account Creation Example
-- Smart Code: HERA.ACCOUNTING.SAMPLE.GL.ACCOUNT.CREATE.v2

-- Create GL Account Entity
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'gl_account',
    'Cash - Primary Operating Account',
    '1100',
    'HERA.ACCOUNTING.GL.ACC.ENTITY.v2',
    jsonb_build_object(
        'account_type', 'ASSET',
        'account_category', 'CURRENT_ASSETS',
        'normal_balance', 'DEBIT',
        'ifrs_classification', 'Financial Assets at Amortized Cost',
        'statement_presentation', 'Balance Sheet',
        'parent_account_code', '1000'
    )
) RETURNING id;

-- Add account properties via dynamic data
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    field_value_number,
    field_value_boolean,
    smart_code
) VALUES 
-- Bank account details
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    (SELECT id FROM core_entities WHERE entity_code = '1100' AND organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid),
    'bank_account_number',
    'text',
    '1234567890',
    NULL,
    NULL,
    'HERA.ACCOUNTING.GL.ACC.BANK.ACCOUNT.NUMBER.v2'
),
-- Credit limit
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    (SELECT id FROM core_entities WHERE entity_code = '1100' AND organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid),
    'credit_limit',
    'number',
    NULL,
    50000.00,
    NULL,
    'HERA.ACCOUNTING.GL.ACC.CREDIT.LIMIT.v2'
),
-- Active status
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    (SELECT id FROM core_entities WHERE entity_code = '1100' AND organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid),
    'is_active',
    'boolean',
    NULL,
    NULL,
    true,
    'HERA.ACCOUNTING.GL.ACC.STATUS.ACTIVE.v2'
);

-- Create account hierarchy relationship (if parent exists)
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    metadata
) 
SELECT 
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    child.id,
    parent.id,
    'CHILD_OF',
    'HERA.ACCOUNTING.GL.ACC.HIERARCHY.CHILD.v2',
    jsonb_build_object(
        'hierarchy_level', 2,
        'rollup_enabled', true
    )
FROM core_entities child
CROSS JOIN core_entities parent
WHERE child.entity_code = '1100'
  AND parent.entity_code = '1000'
  AND child.organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
  AND parent.organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
  AND child.entity_type = 'gl_account'
  AND parent.entity_type = 'gl_account';

-- Log account creation in audit trail
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    smart_code,
    metadata
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'GL_ACCOUNT_CREATE',
    'HERA.ACCOUNTING.AUDIT.GL.ACCOUNT.CREATE.v2',
    jsonb_build_object(
        'account_code', '1100',
        'account_name', 'Cash - Primary Operating Account',
        'account_type', 'ASSET',
        'created_by', current_setting('app.current_user_id', true),
        'creation_timestamp', NOW()
    )
);