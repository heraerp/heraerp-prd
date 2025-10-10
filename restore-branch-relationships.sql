-- Restore Branch Relationships for Hair Talkz Salon
-- Organization: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
--
-- This script restores the missing relationships that make branches work:
-- 1. MEMBER_OF: Staff belonging to branches
-- 2. AVAILABLE_AT: Services offered at branches
-- 3. STOCK_AT: Products/inventory at branches
-- 4. BOOKED_AT: Appointments at branches

-- ========================================
-- STEP 1: Check current branch entities
-- ========================================

SELECT 
    id,
    entity_name,
    entity_code,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at;

-- ========================================
-- STEP 2: Check existing relationships
-- ========================================

-- Check what relationships exist for branches
SELECT 
    r.relationship_type,
    COUNT(*) as relationship_count,
    array_agg(DISTINCT e1.entity_name) as from_entities,
    array_agg(DISTINCT e2.entity_name) as to_entities
FROM core_relationships r
LEFT JOIN core_entities e1 ON r.from_entity_id = e1.id
LEFT JOIN core_entities e2 ON r.to_entity_id = e2.id
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND (
    e1.entity_type = 'BRANCH' OR 
    e2.entity_type = 'BRANCH' OR
    r.relationship_type IN ('MEMBER_OF', 'AVAILABLE_AT', 'STOCK_AT', 'BOOKED_AT')
  )
GROUP BY r.relationship_type
ORDER BY r.relationship_type;

-- ========================================
-- STEP 3: Check staff without branch relationships
-- ========================================

SELECT 
    s.id,
    s.entity_name as staff_name,
    s.entity_code,
    CASE 
        WHEN r.id IS NULL THEN 'NO BRANCH RELATIONSHIP'
        ELSE b.entity_name
    END as branch_status
FROM core_entities s
LEFT JOIN core_relationships r ON s.id = r.from_entity_id AND r.relationship_type = 'MEMBER_OF'
LEFT JOIN core_entities b ON r.to_entity_id = b.id AND b.entity_type = 'BRANCH'
WHERE s.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND s.entity_type IN ('STAFF', 'staff')
ORDER BY s.entity_name;

-- ========================================
-- STEP 4: Check services without branch relationships
-- ========================================

SELECT 
    s.id,
    s.entity_name as service_name,
    s.entity_code,
    COUNT(r.id) as branch_relationships
FROM core_entities s
LEFT JOIN core_relationships r ON s.id = r.from_entity_id AND r.relationship_type = 'AVAILABLE_AT'
WHERE s.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND s.entity_type IN ('SERVICE', 'service')
GROUP BY s.id, s.entity_name, s.entity_code
ORDER BY s.entity_name;

-- ========================================
-- STEP 5: Check products without branch relationships
-- ========================================

SELECT 
    p.id,
    p.entity_name as product_name,
    p.entity_code,
    COUNT(r.id) as branch_relationships
FROM core_entities p
LEFT JOIN core_relationships r ON p.id = r.from_entity_id AND r.relationship_type = 'STOCK_AT'
WHERE p.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND p.entity_type IN ('PRODUCT', 'product')
GROUP BY p.id, p.entity_name, p.entity_code
ORDER BY p.entity_name;

-- ========================================
-- STEP 6: Create staff-to-branch relationships (MEMBER_OF)
-- ========================================

-- Link all staff to all branches (you can modify this to be more specific)
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    created_at,
    updated_at
)
SELECT 
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    s.id as from_entity_id,
    b.id as to_entity_id,
    'MEMBER_OF',
    'HERA.SALON.STAFF.MEMBER.OF.BRANCH.V1',
    NOW(),
    NOW()
FROM core_entities s
CROSS JOIN core_entities b
WHERE s.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND s.entity_type IN ('STAFF', 'staff')
  AND b.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND b.entity_type = 'BRANCH'
  AND NOT EXISTS (
    SELECT 1 FROM core_relationships r 
    WHERE r.from_entity_id = s.id 
      AND r.to_entity_id = b.id 
      AND r.relationship_type = 'MEMBER_OF'
  );

-- ========================================
-- STEP 7: Create service-to-branch relationships (AVAILABLE_AT)
-- ========================================

-- Link all services to all branches
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    created_at,
    updated_at
)
SELECT 
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    s.id as from_entity_id,
    b.id as to_entity_id,
    'AVAILABLE_AT',
    'HERA.SALON.SERVICE.AVAILABLE.AT.BRANCH.V1',
    NOW(),
    NOW()
FROM core_entities s
CROSS JOIN core_entities b
WHERE s.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND s.entity_type IN ('SERVICE', 'service')
  AND b.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND b.entity_type = 'BRANCH'
  AND NOT EXISTS (
    SELECT 1 FROM core_relationships r 
    WHERE r.from_entity_id = s.id 
      AND r.to_entity_id = b.id 
      AND r.relationship_type = 'AVAILABLE_AT'
  );

-- ========================================
-- STEP 8: Create product-to-branch relationships (STOCK_AT)
-- ========================================

-- Link all products to all branches
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    created_at,
    updated_at
)
SELECT 
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    p.id as from_entity_id,
    b.id as to_entity_id,
    'STOCK_AT',
    'HERA.SALON.PRODUCT.STOCK.AT.BRANCH.V1',
    NOW(),
    NOW()
FROM core_entities p
CROSS JOIN core_entities b
WHERE p.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND p.entity_type IN ('PRODUCT', 'product')
  AND b.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND b.entity_type = 'BRANCH'
  AND NOT EXISTS (
    SELECT 1 FROM core_relationships r 
    WHERE r.from_entity_id = p.id 
      AND r.to_entity_id = b.id 
      AND r.relationship_type = 'STOCK_AT'
  );

-- ========================================
-- STEP 9: Update appointments to have branch_id in metadata
-- ========================================

-- Get branch IDs for the new branches
WITH branch_mapping AS (
    SELECT 
        id,
        entity_name,
        entity_code
    FROM core_entities 
    WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
      AND entity_type = 'BRANCH'
),
random_branch AS (
    SELECT id as branch_id FROM branch_mapping ORDER BY RANDOM() LIMIT 1
)
-- Update appointments that don't have branch_id to use a random branch
UPDATE universal_transactions 
SET metadata = metadata || jsonb_build_object('branch_id', (SELECT branch_id FROM random_branch))
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND transaction_type = 'APPOINTMENT'
  AND (metadata->>'branch_id' IS NULL OR metadata->>'branch_id' = '');

-- ========================================
-- STEP 10: Verification
-- ========================================

-- Check relationships were created
SELECT 
    r.relationship_type,
    COUNT(*) as relationship_count,
    array_agg(DISTINCT e1.entity_type) as from_entity_types,
    array_agg(DISTINCT e2.entity_type) as to_entity_types
FROM core_relationships r
LEFT JOIN core_entities e1 ON r.from_entity_id = e1.id
LEFT JOIN core_entities e2 ON r.to_entity_id = e2.id
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND r.relationship_type IN ('MEMBER_OF', 'AVAILABLE_AT', 'STOCK_AT', 'BOOKED_AT')
GROUP BY r.relationship_type
ORDER BY r.relationship_type;

-- Check appointments now have branch_id
SELECT 
    metadata->>'branch_id' as branch_id,
    COUNT(*) as appointment_count
FROM universal_transactions 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND transaction_type = 'APPOINTMENT'
GROUP BY metadata->>'branch_id'
ORDER BY appointment_count DESC;

-- Final summary
SELECT 
    'BRANCHES' as entity_type,
    COUNT(*) as count
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'

UNION ALL

SELECT 
    'STAFF' as entity_type,
    COUNT(*) as count
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type IN ('STAFF', 'staff')

UNION ALL

SELECT 
    'SERVICES' as entity_type,
    COUNT(*) as count
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type IN ('SERVICE', 'service')

UNION ALL

SELECT 
    'PRODUCTS' as entity_type,
    COUNT(*) as count
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type IN ('PRODUCT', 'product')

UNION ALL

SELECT 
    'APPOINTMENTS' as entity_type,
    COUNT(*) as count
FROM universal_transactions 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND transaction_type = 'APPOINTMENT'

ORDER BY entity_type;