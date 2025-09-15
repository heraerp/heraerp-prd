-- Fix RLS policies for furniture demo user
-- This script ensures the demo@keralafurniture.com user can access all furniture organization data

-- First, let's check what policies exist
SELECT 'Current RLS policies:' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('core_entities', 'universal_transactions', 'core_dynamic_data', 'core_relationships')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Get the furniture demo user ID
SELECT 'Furniture demo user info:' as info;
SELECT id, email, raw_user_meta_data->>'organization_id' as org_id 
FROM auth.users 
WHERE email = 'demo@keralafurniture.com';

-- Kerala Furniture Works organization ID
-- f0af4ced-9d12-4a55-a649-b484368db249

-- Create or replace RLS policies for furniture demo access

-- 1. core_entities policies
CREATE POLICY IF NOT EXISTS "furniture_demo_entities_select" 
ON public.core_entities FOR SELECT 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_entities_insert" 
ON public.core_entities FOR INSERT 
TO authenticated
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_entities_update" 
ON public.core_entities FOR UPDATE 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
)
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

-- 2. universal_transactions policies
CREATE POLICY IF NOT EXISTS "furniture_demo_transactions_select" 
ON public.universal_transactions FOR SELECT 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_transactions_insert" 
ON public.universal_transactions FOR INSERT 
TO authenticated
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_transactions_update" 
ON public.universal_transactions FOR UPDATE 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
)
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

-- 3. core_dynamic_data policies
CREATE POLICY IF NOT EXISTS "furniture_demo_dynamic_select" 
ON public.core_dynamic_data FOR SELECT 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_dynamic_insert" 
ON public.core_dynamic_data FOR INSERT 
TO authenticated
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_dynamic_update" 
ON public.core_dynamic_data FOR UPDATE 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
)
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

-- 4. core_relationships policies  
CREATE POLICY IF NOT EXISTS "furniture_demo_relationships_select" 
ON public.core_relationships FOR SELECT 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_relationships_insert" 
ON public.core_relationships FOR INSERT 
TO authenticated
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_relationships_update" 
ON public.core_relationships FOR UPDATE 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
)
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

-- 5. universal_transaction_lines policies
CREATE POLICY IF NOT EXISTS "furniture_demo_lines_select" 
ON public.universal_transaction_lines FOR SELECT 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_lines_insert" 
ON public.universal_transaction_lines FOR INSERT 
TO authenticated
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

CREATE POLICY IF NOT EXISTS "furniture_demo_lines_update" 
ON public.universal_transaction_lines FOR UPDATE 
TO authenticated
USING (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
)
WITH CHECK (
    organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

-- 6. core_organizations policies
CREATE POLICY IF NOT EXISTS "furniture_demo_org_select" 
ON public.core_organizations FOR SELECT 
TO authenticated
USING (
    id = 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid
    AND auth.jwt()->>'email' = 'demo@keralafurniture.com'
);

-- Verify the policies were created
SELECT 'New RLS policies after creation:' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE policyname LIKE 'furniture_demo_%'
ORDER BY tablename, policyname;

-- Test the policies
SELECT 'Testing entity access for furniture demo:' as info;
SELECT COUNT(*) as employee_count 
FROM public.core_entities 
WHERE organization_id = 'f0af4ced-9d12-4a55-a649-b484368db249'
AND entity_type = 'employee';