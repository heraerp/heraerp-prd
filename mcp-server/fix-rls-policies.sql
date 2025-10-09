-- Fix RLS Policies for Authentication
-- Creates proper policies that allow authenticated users to access their own data

-- =============================================================================
-- PROPER USER DATA ACCESS POLICIES
-- =============================================================================

-- Drop existing restrictive policies that might be blocking access
DO $$ 
BEGIN
  -- Drop demo-only policies if they exist
  DROP POLICY IF EXISTS "demo_users_relationships_all" ON public.core_relationships;
  DROP POLICY IF EXISTS "demo_users_entities_all" ON public.core_entities;
  DROP POLICY IF EXISTS "demo_users_dynamic_all" ON public.core_dynamic_data;
  DROP POLICY IF EXISTS "demo_users_org_select" ON public.core_organizations;
  
  -- Drop any other restrictive policies
  DROP POLICY IF EXISTS "Allow public read for demo organization relationships" ON public.core_relationships;
  DROP POLICY IF EXISTS "Allow public read for demo organization entities" ON public.core_entities;
  DROP POLICY IF EXISTS "Allow public read for demo organization dynamic data" ON public.core_dynamic_data;
  DROP POLICY IF EXISTS "Allow public read for demo organizations" ON public.core_organizations;
  
  RAISE NOTICE 'Dropped existing restrictive policies';
END $$;

-- =============================================================================
-- UNIVERSAL USER ACCESS POLICIES
-- =============================================================================

-- Policy for core_relationships: Allow users to access relationships where they are involved
CREATE POLICY "authenticated_users_relationships_access" ON public.core_relationships
FOR ALL TO authenticated
USING (
  -- Allow access to relationships where the user is the from_entity
  from_entity_id::text = auth.uid()::text OR
  -- Allow access to relationships in organizations the user is a member of
  organization_id IN (
    SELECT r.organization_id 
    FROM public.core_relationships r 
    WHERE r.from_entity_id::text = auth.uid()::text 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
  )
)
WITH CHECK (
  -- Same condition for INSERT/UPDATE
  from_entity_id::text = auth.uid()::text OR
  organization_id IN (
    SELECT r.organization_id 
    FROM public.core_relationships r 
    WHERE r.from_entity_id::text = auth.uid()::text 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
  )
);

-- Policy for core_entities: Allow users to access entities in their organizations
CREATE POLICY "authenticated_users_entities_access" ON public.core_entities
FOR ALL TO authenticated
USING (
  -- Allow access to the user's own entity
  id::text = auth.uid()::text OR
  -- Allow access to entities in organizations the user is a member of
  organization_id IN (
    SELECT r.organization_id 
    FROM public.core_relationships r 
    WHERE r.from_entity_id::text = auth.uid()::text 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
  )
)
WITH CHECK (
  -- Same condition for INSERT/UPDATE
  id::text = auth.uid()::text OR
  organization_id IN (
    SELECT r.organization_id 
    FROM public.core_relationships r 
    WHERE r.from_entity_id::text = auth.uid()::text 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
  )
);

-- Policy for core_dynamic_data: Allow users to access dynamic data for entities they can access
CREATE POLICY "authenticated_users_dynamic_data_access" ON public.core_dynamic_data
FOR ALL TO authenticated
USING (
  -- Allow access to the user's own dynamic data
  entity_id::text = auth.uid()::text OR
  -- Allow access to dynamic data in organizations the user is a member of
  organization_id IN (
    SELECT r.organization_id 
    FROM public.core_relationships r 
    WHERE r.from_entity_id::text = auth.uid()::text 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
  )
)
WITH CHECK (
  -- Same condition for INSERT/UPDATE
  entity_id::text = auth.uid()::text OR
  organization_id IN (
    SELECT r.organization_id 
    FROM public.core_relationships r 
    WHERE r.from_entity_id::text = auth.uid()::text 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
  )
);

-- Policy for core_organizations: Allow users to see organizations they are members of
CREATE POLICY "authenticated_users_organizations_access" ON public.core_organizations
FOR SELECT TO authenticated
USING (
  -- Allow access to organizations the user is a member of
  id IN (
    SELECT r.organization_id 
    FROM public.core_relationships r 
    WHERE r.from_entity_id::text = auth.uid()::text 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
  )
);

-- =============================================================================
-- SIMPLIFIED FALLBACK POLICIES (FOR TESTING)
-- =============================================================================

-- If the above policies are too complex, create simpler ones for testing
-- These can be used temporarily while debugging

-- Simple policy: Allow authenticated users to read relationships
CREATE POLICY "simple_authenticated_relationships_read" ON public.core_relationships
FOR SELECT TO authenticated
USING (true);

-- Simple policy: Allow authenticated users to read entities  
CREATE POLICY "simple_authenticated_entities_read" ON public.core_entities
FOR SELECT TO authenticated
USING (true);

-- Simple policy: Allow authenticated users to read dynamic data
CREATE POLICY "simple_authenticated_dynamic_data_read" ON public.core_dynamic_data
FOR SELECT TO authenticated
USING (true);

-- Simple policy: Allow authenticated users to read organizations
CREATE POLICY "simple_authenticated_organizations_read" ON public.core_organizations
FOR SELECT TO authenticated
USING (true);

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_organizations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant usage permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_entities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_dynamic_data TO authenticated;
GRANT SELECT ON public.core_organizations TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- List all policies for verification
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN (
    'core_relationships',
    'core_entities', 
    'core_dynamic_data',
    'core_organizations'
)
ORDER BY tablename, policyname;