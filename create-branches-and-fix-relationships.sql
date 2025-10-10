-- Create Missing Salon Branches and Fix Relationships
-- Organization: Hair Talkz (378f24fb-d496-4ff7-8afa-ea34895a0eb8)
-- 
-- This comprehensive SQL script:
-- 1. Creates the two missing salon branches
-- 2. Checks existing appointment branch_id references
-- 3. Updates appointment metadata to link to correct branches
-- 4. Ensures branch filter works properly

-- ========================================
-- STEP 1: Check current state
-- ========================================

-- Check existing branches
SELECT 
    id, 
    entity_name, 
    entity_code,
    created_at,
    metadata
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at;

-- Check existing appointments and their branch_id values
SELECT 
    id,
    transaction_code,
    metadata->>'branch_id' as current_branch_id,
    metadata->>'customer_name' as customer_name,
    metadata->>'start_time' as appointment_time,
    created_at
FROM universal_transactions 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND transaction_type = 'APPOINTMENT'
ORDER BY created_at DESC
LIMIT 10;

-- Count appointments by branch_id
SELECT 
    metadata->>'branch_id' as branch_id,
    COUNT(*) as appointment_count
FROM universal_transactions 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND transaction_type = 'APPOINTMENT'
GROUP BY metadata->>'branch_id'
ORDER BY appointment_count DESC;

-- ========================================
-- STEP 2: Create the missing branches
-- ========================================

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
        "address": "Al Karama, Dubai, U.A.E",
        "description": "Hair Talkz Salon at Park Regis Kris Kin Hotel",
        "status": "active",
        "business_type": "salon",
        "timezone": "Asia/Dubai",
        "location_type": "hotel_salon"
    }'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING
RETURNING id, entity_name, entity_code;

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
        "address": "Al Mina Road, Jumeirah, Dubai, U.A.E",
        "description": "Hair Talkz Salon at Mercure Gold Hotel",
        "status": "active",
        "business_type": "salon",
        "timezone": "Asia/Dubai",
        "location_type": "hotel_salon"
    }'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING
RETURNING id, entity_name, entity_code;

-- ========================================
-- STEP 3: Get the new branch IDs
-- ========================================

-- Get the branch IDs for the newly created branches
WITH new_branches AS (
    SELECT 
        id,
        entity_name,
        entity_code
    FROM core_entities 
    WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
      AND entity_type = 'BRANCH'
      AND entity_code IN ('PARK-REGIS', 'MERCURE-GOLD')
)
SELECT * FROM new_branches;

-- ========================================
-- STEP 4: Create dynamic data fields (optional, for better integration)
-- ========================================

-- Add address dynamic data for Park Regis
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    smart_code,
    created_at,
    updated_at
)
SELECT 
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    id,
    'address',
    'text',
    'Park Regis Kris Kin Hotel, Al Karama, Dubai, U.A.E',
    'HERA.SALON.BRANCH.ADDRESS.V1',
    NOW(),
    NOW()
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
  AND entity_code = 'PARK-REGIS'
ON CONFLICT DO NOTHING;

-- Add address dynamic data for Mercure Gold
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    smart_code,
    created_at,
    updated_at
)
SELECT 
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    id,
    'address',
    'text',
    'Mercure Gold Hotel, Al Mina Road, Jumeirah, Dubai, U.A.E',
    'HERA.SALON.BRANCH.ADDRESS.V1',
    NOW(),
    NOW()
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
  AND entity_code = 'MERCURE-GOLD'
ON CONFLICT DO NOTHING;

-- ========================================
-- STEP 5: Optional - Update existing appointments to have branch_id
-- ========================================

-- If you want to link existing appointments to specific branches based on patterns,
-- uncomment and modify these queries:

-- Example: Update appointments that mention "Park Regis" in notes or customer names
/*
UPDATE universal_transactions 
SET metadata = metadata || jsonb_build_object(
    'branch_id', 
    (SELECT id FROM core_entities 
     WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
       AND entity_code = 'PARK-REGIS' 
     LIMIT 1)
)
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND transaction_type = 'APPOINTMENT'
  AND (
    metadata->>'notes' ILIKE '%park regis%' 
    OR metadata->>'customer_name' ILIKE '%park regis%'
    OR metadata->>'branch_id' IS NULL
  );
*/

-- ========================================
-- STEP 6: Verification
-- ========================================

-- Verify branches were created
SELECT 
    id,
    entity_name,
    entity_code,
    metadata,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at;

-- Check dynamic data was created
SELECT 
    cd.entity_id,
    e.entity_name as branch_name,
    cd.field_name,
    cd.field_value_text
FROM core_dynamic_data cd
JOIN core_entities e ON cd.entity_id = e.id
WHERE cd.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND e.entity_type = 'BRANCH'
  AND cd.field_name = 'address'
ORDER BY e.entity_name;

-- Final branch count and summary
SELECT 
    COUNT(*) as total_branches,
    array_agg(entity_name ORDER BY entity_name) as branch_names,
    array_agg(entity_code ORDER BY entity_name) as branch_codes
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH';

-- Check if branch filter will work (this should return the branches)
SELECT 
    id,
    entity_name as name,
    entity_code as code
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY entity_name;

-- Test appointment filtering (sample query)
SELECT 
    t.id,
    t.transaction_code,
    t.metadata->>'customer_name' as customer,
    t.metadata->>'branch_id' as branch_id,
    b.entity_name as branch_name
FROM universal_transactions t
LEFT JOIN core_entities b ON t.metadata->>'branch_id' = b.id::text
WHERE t.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND t.transaction_type = 'APPOINTMENT'
ORDER BY t.created_at DESC
LIMIT 5;