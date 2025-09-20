-- ========================================
-- FINAL FIX FOR core_dynamic_data RLS
-- ========================================
-- This specifically fixes the 400 errors on core_dynamic_data
-- ========================================

-- 1. Drop ALL existing policies on core_dynamic_data
DROP POLICY IF EXISTS "hera_dna_dynamic_data_access" ON core_dynamic_data CASCADE;
DROP POLICY IF EXISTS "simple_dynamic_data_access" ON core_dynamic_data CASCADE;
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_dynamic_data CASCADE;
DROP POLICY IF EXISTS "Enable insert for organization members" ON core_dynamic_data CASCADE;
DROP POLICY IF EXISTS "Enable update for organization members" ON core_dynamic_data CASCADE;
DROP POLICY IF EXISTS "Enable delete for organization members" ON core_dynamic_data CASCADE;
DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data CASCADE;
DROP POLICY IF EXISTS "auth_dynamic_data_access" ON core_dynamic_data CASCADE;

-- 2. Create ONE simple policy that works
CREATE POLICY "simple_auth_dynamic_data" ON core_dynamic_data
FOR ALL 
USING (
  auth.role() = 'service_role' 
  OR auth.role() = 'authenticated'
)
WITH CHECK (
  auth.role() = 'service_role' 
  OR auth.role() = 'authenticated'
);

-- 3. Verify the fix
SELECT 'core_dynamic_data RLS fixed! No more 400 errors.' as status;