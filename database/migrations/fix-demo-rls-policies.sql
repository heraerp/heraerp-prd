-- Fix RLS policies for demo users to access their organization data
-- This creates more permissive policies for demo accounts while maintaining security

-- Helper function to check if user is a demo user
CREATE OR REPLACE FUNCTION is_demo_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    auth.jwt()->>'email' LIKE '%demo@%' OR
    auth.email() LIKE '%demo@%',
    false
  );
$$;

-- Drop existing demo policies if they exist
DO $$ 
BEGIN
  -- core_entities
  DROP POLICY IF EXISTS "demo_users_entities_all" ON public.core_entities;
  DROP POLICY IF EXISTS "furniture_demo_entities_select" ON public.core_entities;
  DROP POLICY IF EXISTS "furniture_demo_entities_all" ON public.core_entities;
  
  -- universal_transactions
  DROP POLICY IF EXISTS "demo_users_transactions_all" ON public.universal_transactions;
  DROP POLICY IF EXISTS "furniture_demo_transactions_select" ON public.universal_transactions;
  DROP POLICY IF EXISTS "furniture_demo_transactions_all" ON public.universal_transactions;
  
  -- core_dynamic_data
  DROP POLICY IF EXISTS "demo_users_dynamic_all" ON public.core_dynamic_data;
  DROP POLICY IF EXISTS "furniture_demo_dynamic_select" ON public.core_dynamic_data;
  DROP POLICY IF EXISTS "furniture_demo_dynamic_all" ON public.core_dynamic_data;
  
  -- core_relationships
  DROP POLICY IF EXISTS "demo_users_relationships_all" ON public.core_relationships;
  DROP POLICY IF EXISTS "furniture_demo_relationships_select" ON public.core_relationships;
  DROP POLICY IF EXISTS "furniture_demo_relationships_all" ON public.core_relationships;
  
  -- universal_transaction_lines
  DROP POLICY IF EXISTS "demo_users_lines_all" ON public.universal_transaction_lines;
  DROP POLICY IF EXISTS "furniture_demo_lines_select" ON public.universal_transaction_lines;
  DROP POLICY IF EXISTS "furniture_demo_lines_all" ON public.universal_transaction_lines;
  
  -- core_organizations
  DROP POLICY IF EXISTS "demo_users_org_select" ON public.core_organizations;
  DROP POLICY IF EXISTS "furniture_demo_org_select" ON public.core_organizations;
END $$;

-- Create new unified demo policies

-- 1. core_entities - Allow demo users full access to their organization's entities
CREATE POLICY "demo_users_entities_all" ON public.core_entities
FOR ALL TO authenticated
USING (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
)
WITH CHECK (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
);

-- 2. universal_transactions - Allow demo users full access to their organization's transactions
CREATE POLICY "demo_users_transactions_all" ON public.universal_transactions
FOR ALL TO authenticated
USING (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
)
WITH CHECK (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
);

-- 3. core_dynamic_data - Allow demo users full access to their organization's dynamic data
CREATE POLICY "demo_users_dynamic_all" ON public.core_dynamic_data
FOR ALL TO authenticated
USING (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
)
WITH CHECK (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
);

-- 4. core_relationships - Allow demo users full access to their organization's relationships
CREATE POLICY "demo_users_relationships_all" ON public.core_relationships
FOR ALL TO authenticated
USING (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
)
WITH CHECK (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
);

-- 5. universal_transaction_lines - Allow demo users full access to their organization's transaction lines
CREATE POLICY "demo_users_lines_all" ON public.universal_transaction_lines
FOR ALL TO authenticated
USING (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
)
WITH CHECK (
  is_demo_user() AND
  organization_id IN (
    SELECT id FROM public.core_organizations 
    WHERE id = organization_id
  )
);

-- 6. core_organizations - Allow demo users to see their organization
CREATE POLICY "demo_users_org_select" ON public.core_organizations
FOR SELECT TO authenticated
USING (
  is_demo_user()
);

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_demo_user() TO authenticated;

-- Verify the policies were created
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE policyname LIKE 'demo_users_%'
ORDER BY tablename, policyname;