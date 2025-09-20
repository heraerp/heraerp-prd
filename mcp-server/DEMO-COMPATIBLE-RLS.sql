-- ========================================
-- DEMO-COMPATIBLE RLS POLICIES
-- ========================================
-- These policies work with both:
-- 1. Regular JWT tokens with organization_id claims
-- 2. Demo sessions (authenticated users)
-- ========================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;
DROP POLICY IF EXISTS "entities_org_isolation" ON core_entities;
DROP POLICY IF EXISTS "relationships_org_isolation" ON core_relationships;
DROP POLICY IF EXISTS "transactions_org_isolation" ON universal_transactions;
DROP POLICY IF EXISTS "transaction_lines_org_isolation" ON universal_transaction_lines;
DROP POLICY IF EXISTS "organizations_org_access" ON core_organizations;

-- Also drop the authenticated policies from previous attempt
DROP POLICY IF EXISTS "dynamic_data_authenticated" ON core_dynamic_data;
DROP POLICY IF EXISTS "entities_authenticated" ON core_entities;
DROP POLICY IF EXISTS "relationships_authenticated" ON core_relationships;
DROP POLICY IF EXISTS "transactions_authenticated" ON universal_transactions;
DROP POLICY IF EXISTS "transaction_lines_authenticated" ON universal_transaction_lines;

-- Create hybrid policies that work for both JWT and demo sessions

-- Core Organizations
CREATE POLICY "organizations_access" ON core_organizations
FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated' OR
    (auth.jwt() ->> 'organization_id')::uuid = id
);

-- Core Entities  
CREATE POLICY "entities_hybrid" ON core_entities
FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated' OR
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
);

-- Core Dynamic Data
CREATE POLICY "dynamic_data_hybrid" ON core_dynamic_data
FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated' OR
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
);

-- Core Relationships
CREATE POLICY "relationships_hybrid" ON core_relationships
FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated' OR
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
);

-- Universal Transactions  
CREATE POLICY "transactions_hybrid" ON universal_transactions
FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated' OR
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
);

-- Universal Transaction Lines
CREATE POLICY "transaction_lines_hybrid" ON universal_transaction_lines
FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated' OR
    EXISTS (
        SELECT 1 FROM universal_transactions ut
        WHERE ut.id = transaction_id
        AND (
            auth.role() = 'service_role' OR
            auth.role() = 'authenticated' OR
            ut.organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
    )
);

-- Verify the policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'core_organizations',
    'core_entities',
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
)
ORDER BY tablename, policyname;

-- Final message
SELECT 'Demo-compatible RLS policies applied successfully!' as status;