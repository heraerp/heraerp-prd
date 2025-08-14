-- ================================================================================
-- HERA SUPABASE AUTHENTICATION SETUP
-- Ensures proper integration between Supabase Auth and HERA's 6-table architecture
-- ================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================================
-- STEP 1: ADD AUTH COLUMNS IF MISSING
-- ================================================================================

-- Add auth columns to core_organizations if they don't exist
ALTER TABLE core_organizations 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS auth_settings JSONB DEFAULT '{}';

-- Add auth columns to core_entities if they don't exist
ALTER TABLE core_entities 
ADD COLUMN IF NOT EXISTS auth_user_id UUID,
ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- ================================================================================
-- STEP 2: CREATE TRIGGER FOR AUTO USER PROFILE CREATION
-- ================================================================================

-- Function to automatically create user profile in core_entities when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
    v_org_id UUID;
    v_user_entity_id UUID;
BEGIN
    -- For demo purposes, use a default organization or create one
    -- In production, this would be handled differently
    IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
        v_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    ELSE
        -- Create a new organization for the user
        INSERT INTO core_organizations (
            organization_name,
            organization_type,
            status,
            metadata
        ) VALUES (
            COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.email || '''s Organization'),
            COALESCE(NEW.raw_user_meta_data->>'business_type', 'general'),
            'active',
            jsonb_build_object(
                'created_by_auth', NEW.id,
                'owner_email', NEW.email
            )
        ) RETURNING id INTO v_org_id;
    END IF;

    -- Create user entity in core_entities
    INSERT INTO core_entities (
        organization_id,
        entity_type,
        entity_code,
        entity_name,
        description,
        status,
        auth_user_id,
        is_system_user,
        metadata
    ) VALUES (
        v_org_id,
        'user_profile',
        NEW.id::TEXT,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'User profile for ' || NEW.email,
        'active',
        NEW.id,
        false,
        jsonb_build_object(
            'email', NEW.email,
            'role', COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
            'created_at', NEW.created_at
        )
    ) RETURNING id INTO v_user_entity_id;

    -- Create dynamic data entries for user
    INSERT INTO core_dynamic_data (
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value
    ) VALUES 
    (v_org_id, v_user_entity_id, 'email', 'text', NEW.email),
    (v_org_id, v_user_entity_id, 'role', 'text', COALESCE(NEW.raw_user_meta_data->>'role', 'owner')),
    (v_org_id, v_user_entity_id, 'auth_id', 'text', NEW.id::TEXT);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================================
-- STEP 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================================

-- Enable RLS on all HERA tables
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own organization's data
CREATE POLICY "Users can view own organization data" ON core_organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM core_entities 
            WHERE auth_user_id = auth.uid() 
            AND entity_type = 'user_profile'
        )
    );

CREATE POLICY "Users can view own organization entities" ON core_entities
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM core_entities 
            WHERE auth_user_id = auth.uid() 
            AND entity_type = 'user_profile'
        )
    );

CREATE POLICY "Users can manage own organization entities" ON core_entities
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM core_entities 
            WHERE auth_user_id = auth.uid() 
            AND entity_type = 'user_profile'
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can view own organization dynamic data" ON core_dynamic_data
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM core_entities 
            WHERE auth_user_id = auth.uid() 
            AND entity_type = 'user_profile'
        )
    );

CREATE POLICY "Users can manage own organization dynamic data" ON core_dynamic_data
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM core_entities 
            WHERE auth_user_id = auth.uid() 
            AND entity_type = 'user_profile'
        )
    );

-- ================================================================================
-- STEP 4: HELPER FUNCTIONS FOR AUTHENTICATION
-- ================================================================================

-- Function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM core_entities 
        WHERE auth_user_id = auth.uid() 
        AND entity_type = 'user_profile'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's profile
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE (
    user_id UUID,
    organization_id UUID,
    entity_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.auth_user_id as user_id,
        e.organization_id,
        e.id as entity_id,
        e.entity_name as full_name,
        dd_email.field_value as email,
        dd_role.field_value as role
    FROM core_entities e
    LEFT JOIN core_dynamic_data dd_email 
        ON e.id = dd_email.entity_id 
        AND dd_email.field_name = 'email'
    LEFT JOIN core_dynamic_data dd_role 
        ON e.id = dd_role.entity_id 
        AND dd_role.field_name = 'role'
    WHERE e.auth_user_id = auth.uid() 
    AND e.entity_type = 'user_profile'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- STEP 5: CREATE DEMO USER IF NEEDED
-- ================================================================================

-- Note: This should be run manually or through a seed script
-- DO $$
-- DECLARE
--     v_demo_user_id UUID;
-- BEGIN
--     -- Check if demo user exists
--     SELECT id INTO v_demo_user_id
--     FROM auth.users
--     WHERE email = 'mario@restaurant.com';
--     
--     -- Create demo user if not exists
--     IF v_demo_user_id IS NULL THEN
--         -- This would need to be done through Supabase Auth API
--         -- Cannot directly insert into auth.users
--         RAISE NOTICE 'Demo user needs to be created through Supabase Auth API';
--     END IF;
-- END $$;