-- ========================================
-- SIMPLE RLS FOR DEMO - TEMPORARY SOLUTION
-- ========================================
-- These policies are simplified for demo purposes
-- For production, use proper JWT-based policies
-- ========================================

-- Enable RLS on all tables
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
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
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Create very simple policies for demo
-- These allow all authenticated users and service role to access all data

CREATE POLICY "allow_all_authenticated" ON core_organizations
FOR ALL USING (
    auth.role() IN ('service_role', 'authenticated', 'anon')
);

CREATE POLICY "allow_all_authenticated" ON core_entities
FOR ALL USING (
    auth.role() IN ('service_role', 'authenticated', 'anon')
);

CREATE POLICY "allow_all_authenticated" ON core_dynamic_data
FOR ALL USING (
    auth.role() IN ('service_role', 'authenticated', 'anon')
);

CREATE POLICY "allow_all_authenticated" ON core_relationships
FOR ALL USING (
    auth.role() IN ('service_role', 'authenticated', 'anon')
);

CREATE POLICY "allow_all_authenticated" ON universal_transactions
FOR ALL USING (
    auth.role() IN ('service_role', 'authenticated', 'anon')
);

CREATE POLICY "allow_all_authenticated" ON universal_transaction_lines
FOR ALL USING (
    auth.role() IN ('service_role', 'authenticated', 'anon')
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

-- Note for production
SELECT '⚠️ DEMO RLS APPLIED - DO NOT USE IN PRODUCTION!' as warning,
       'These policies allow ALL authenticated users to see ALL data' as note,
       'For production, implement proper organization-based isolation' as recommendation;