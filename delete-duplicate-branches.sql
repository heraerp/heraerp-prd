-- Delete Duplicate Hair Talkz Main Salon Branches
-- Organization: Hair Talkz (378f24fb-d496-4ff7-8afa-ea34895a0eb8)
-- 
-- This SQL deletes the two duplicate "Hair Talkz Main Salon" branches:
-- 1. cf22a451-78ba-422f-9297-8b99d96684bb (created 2025-10-09 19:03:38)
-- 2. c4ef193b-9399-4824-bf28-96bdb44b43d7 (created 2025-10-09 19:27:42)

-- First, let's verify these branches exist and see their details
SELECT 
    id, 
    entity_name, 
    entity_code,
    created_at,
    metadata
FROM core_entities 
WHERE id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
)
ORDER BY created_at;

-- Check if there are any related dynamic data entries
SELECT 
    id,
    entity_id,
    field_name,
    field_value_text,
    smart_code
FROM core_dynamic_data 
WHERE entity_id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
);

-- Check if there are any relationships involving these branches
SELECT 
    id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code
FROM core_relationships 
WHERE from_entity_id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
)
OR to_entity_id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
);

-- Delete related dynamic data first (if any)
DELETE FROM core_dynamic_data 
WHERE entity_id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
);

-- Delete related relationships (if any)
DELETE FROM core_relationships 
WHERE from_entity_id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
)
OR to_entity_id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
);

-- Delete the duplicate branch entities
DELETE FROM core_entities 
WHERE id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
);

-- Verify deletion - these should return no rows
SELECT 
    id, 
    entity_name, 
    entity_code,
    created_at
FROM core_entities 
WHERE id IN (
    'cf22a451-78ba-422f-9297-8b99d96684bb',
    'c4ef193b-9399-4824-bf28-96bdb44b43d7'
);

-- Check remaining branches for the organization
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

-- Count total branches remaining
SELECT 
    COUNT(*) as total_branches,
    array_agg(entity_name ORDER BY entity_name) as branch_names
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH';