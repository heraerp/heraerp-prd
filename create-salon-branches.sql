-- Create Missing Salon Branches
-- Organization: Hair Talkz (378f24fb-d496-4ff7-8afa-ea34895a0eb8)
-- 
-- This SQL creates the two missing salon branches:
-- 1. Park Regis Kris Kin Hotel, Al Karama, Dubai, U.A.E
-- 2. Mercure Gold Hotel, Al Mina Road, Jumeirah, Dubai, U.A.E

-- First, let's check existing branches to avoid duplicates
SELECT 
    id, 
    entity_name, 
    entity_code,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at;

-- Create Park Regis Kris Kin Hotel Branch
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata,
    created_at,
    updated_at
) VALUES (
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    'BRANCH',
    'Park Regis Kris Kin Hotel',
    'PARK-REGIS',
    'HERA.SALON.BRANCH.LOCATION.V1',
    '{
        "location": "Al Karama, Dubai, U.A.E",
        "description": "Hair Talkz Salon at Park Regis Kris Kin Hotel",
        "status": "active",
        "business_type": "salon",
        "timezone": "Asia/Dubai"
    }'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Create Mercure Gold Hotel Branch  
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata,
    created_at,
    updated_at
) VALUES (
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    'BRANCH',
    'Mercure Gold Hotel',
    'MERCURE-GOLD',
    'HERA.SALON.BRANCH.LOCATION.V1',
    '{
        "location": "Al Mina Road, Jumeirah, Dubai, U.A.E",
        "description": "Hair Talkz Salon at Mercure Gold Hotel",
        "status": "active",
        "business_type": "salon",
        "timezone": "Asia/Dubai"
    }'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Optional: Add dynamic data fields for better integration
-- Get the branch IDs first (run this after the above inserts)
WITH branch_ids AS (
    SELECT 
        id,
        entity_name,
        entity_code
    FROM core_entities 
    WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
      AND entity_type = 'BRANCH'
      AND entity_code IN ('PARK-REGIS', 'MERCURE-GOLD')
)
SELECT 
    id,
    entity_name,
    entity_code,
    'INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code) VALUES (''' ||
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8' || ''', ''' ||
    id || ''', ''address'', ''text'', ''' ||
    CASE 
        WHEN entity_code = 'PARK-REGIS' THEN 'Park Regis Kris Kin Hotel, Al Karama, Dubai, U.A.E'
        WHEN entity_code = 'MERCURE-GOLD' THEN 'Mercure Gold Hotel, Al Mina Road, Jumeirah, Dubai, U.A.E'
    END || ''', ''HERA.SALON.BRANCH.ADDRESS.V1'');' as insert_statement
FROM branch_ids;

-- Verify the branches were created
SELECT 
    id,
    entity_name,
    entity_code,
    smart_code,
    metadata,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
  AND entity_code IN ('PARK-REGIS', 'MERCURE-GOLD')
ORDER BY created_at;

-- Check total branch count
SELECT 
    COUNT(*) as total_branches,
    array_agg(entity_name ORDER BY entity_name) as branch_names
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH';