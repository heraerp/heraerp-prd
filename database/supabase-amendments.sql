-- =====================================================================
-- HERA Supabase Amendments - Safe Updates Only
-- Only adds missing columns, indexes, and functions
-- Does NOT drop or recreate existing tables
-- =====================================================================

-- Add missing columns to existing tables (IF NOT EXISTS)
-- =====================================================================

-- Amendments to core_organizations
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'core_organizations' AND column_name = 'industry_classification') THEN
        ALTER TABLE core_organizations ADD COLUMN industry_classification VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'core_organizations' AND column_name = 'settings') THEN
        ALTER TABLE core_organizations ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'core_organizations' AND column_name = 'metadata') THEN
        ALTER TABLE core_organizations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Amendments to core_entities
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'core_entities' AND column_name = 'smart_code') THEN
        ALTER TABLE core_entities ADD COLUMN smart_code VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'core_entities' AND column_name = 'entity_category') THEN
        ALTER TABLE core_entities ADD COLUMN entity_category VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'core_entities' AND column_name = 'metadata') THEN
        ALTER TABLE core_entities ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add missing indexes (IF NOT EXISTS)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_core_organizations_code ON core_organizations(organization_code);
CREATE INDEX IF NOT EXISTS idx_core_organizations_status ON core_organizations(status);
CREATE INDEX IF NOT EXISTS idx_core_organizations_type ON core_organizations(organization_type);

CREATE INDEX IF NOT EXISTS idx_core_entities_org ON core_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_entities_type ON core_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_core_entities_code ON core_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_core_entities_status ON core_entities(status);
CREATE INDEX IF NOT EXISTS idx_core_entities_smart_code ON core_entities(smart_code);

CREATE INDEX IF NOT EXISTS idx_core_dynamic_data_entity ON core_dynamic_data(entity_id);
CREATE INDEX IF NOT EXISTS idx_core_dynamic_data_field ON core_dynamic_data(field_name);

CREATE INDEX IF NOT EXISTS idx_core_relationships_org ON core_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_relationships_parent ON core_relationships(parent_entity_id);
CREATE INDEX IF NOT EXISTS idx_core_relationships_child ON core_relationships(child_entity_id);
CREATE INDEX IF NOT EXISTS idx_core_relationships_type ON core_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_universal_transactions_org ON universal_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_universal_transactions_type ON universal_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_universal_transactions_number ON universal_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_universal_transactions_date ON universal_transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_txn ON universal_transaction_lines(transaction_id);
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_entity ON universal_transaction_lines(line_entity_id);

-- Create core_memberships table if it doesn't exist
-- =====================================================================
CREATE TABLE IF NOT EXISTS core_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References auth.users(id)
    role VARCHAR(100) NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_core_memberships_org ON core_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_memberships_user ON core_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_core_memberships_role ON core_memberships(role);

-- Enable RLS on all tables (safe operation)
-- =====================================================================
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_memberships ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization
-- =====================================================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM core_memberships 
        WHERE user_id = auth.uid() 
        AND status = 'active'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user context
-- =====================================================================
CREATE OR REPLACE FUNCTION get_user_context()
RETURNS TABLE(
    user_id UUID,
    organization_id UUID,
    organization_name TEXT,
    user_role TEXT,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id,
        m.organization_id,
        o.organization_name,
        m.role as user_role,
        m.permissions
    FROM core_memberships m
    JOIN core_organizations o ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated trigger function for new users
-- =====================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    org_uuid UUID;
    org_name TEXT;
    org_code TEXT;
    existing_entity UUID;
BEGIN
    -- Check if user entity already exists
    SELECT id INTO existing_entity FROM core_entities 
    WHERE id = NEW.id AND entity_type = 'user';
    
    -- If entity already exists, skip creation
    IF existing_entity IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Extract organization info from user metadata
    org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Default Organization');
    org_code := CONCAT('ORG-', EXTRACT(EPOCH FROM NOW())::TEXT);
    
    -- Try to find existing organization first
    SELECT id INTO org_uuid FROM core_organizations 
    WHERE organization_name = org_name 
    LIMIT 1;
    
    -- If no organization exists, create one
    IF org_uuid IS NULL THEN
        INSERT INTO core_organizations (
            organization_name,
            organization_code,
            organization_type,
            industry_classification,
            settings,
            status,
            created_by
        ) VALUES (
            org_name,
            org_code,
            'business_unit',
            COALESCE(NEW.raw_user_meta_data->>'industry', 'general'),
            '{}'::jsonb,
            'active',
            NEW.id
        ) RETURNING id INTO org_uuid;
    END IF;
    
    -- Create user as core_entity
    INSERT INTO core_entities(
        id,
        organization_id, 
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        status,
        created_by
    ) VALUES (
        NEW.id,  -- Use Supabase user ID
        org_uuid,
        'user',
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        CONCAT('USER-', EXTRACT(EPOCH FROM NOW())::TEXT),
        'HERA.USER.PROFILE.v1',
        'active',
        NEW.id
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Store user properties in core_dynamic_data
    INSERT INTO core_dynamic_data(entity_id, field_name, field_value_text, created_by) VALUES
    (NEW.id, 'email', NEW.email, NEW.id),
    (NEW.id, 'auth_provider', 'supabase', NEW.id),
    (NEW.id, 'signup_date', NOW()::text, NEW.id)
    ON CONFLICT DO NOTHING;
    
    -- Create membership
    INSERT INTO core_memberships(
        organization_id,
        user_id,
        role,
        permissions,
        status,
        created_by
    ) VALUES (
        org_uuid,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
        '["user_management", "entity_management", "transaction_management"]'::jsonb,
        'active',
        NEW.id
    ) ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    RETURN NEW;
END $$;

-- Recreate trigger (safe operation)
-- =====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies (DROP and recreate to ensure they're correct)
-- =====================================================================

-- Drop existing policies (will fail silently if they don't exist)
DROP POLICY IF EXISTS "Users can view their organization" ON core_organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON core_organizations;
DROP POLICY IF EXISTS "Users can access their organization entities" ON core_entities;
DROP POLICY IF EXISTS "Users can access their organization dynamic data" ON core_dynamic_data;
DROP POLICY IF EXISTS "Users can access their organization relationships" ON core_relationships;
DROP POLICY IF EXISTS "Users can access their organization transactions" ON universal_transactions;
DROP POLICY IF EXISTS "Users can access their organization transaction lines" ON universal_transaction_lines;
DROP POLICY IF EXISTS "Users can view their own memberships" ON core_memberships;

-- Create updated policies
CREATE POLICY "Users can view their organization" ON core_organizations
    FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "Users can update their organization" ON core_organizations  
    FOR UPDATE USING (id = get_user_organization_id());

CREATE POLICY "Users can access their organization entities" ON core_entities
    FOR ALL USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can access their organization dynamic data" ON core_dynamic_data
    FOR ALL USING (
        entity_id IN (
            SELECT id FROM core_entities 
            WHERE organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can access their organization relationships" ON core_relationships
    FOR ALL USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can access their organization transactions" ON universal_transactions
    FOR ALL USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can access their organization transaction lines" ON universal_transaction_lines
    FOR ALL USING (
        transaction_id IN (
            SELECT id FROM universal_transactions 
            WHERE organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can view their own memberships" ON core_memberships
    FOR SELECT USING (user_id = auth.uid());

-- Manual setup for existing user (your user)
-- =====================================================================
DO $$
DECLARE
    existing_user_id UUID := '1acd429b-dd0d-4ec4-a7f8-108e8dd41ebc';
    org_id UUID;
    entity_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user entity already exists
    SELECT EXISTS(SELECT 1 FROM core_entities WHERE id = existing_user_id AND entity_type = 'user') INTO entity_exists;
    
    IF NOT entity_exists THEN
        -- Find or create organization
        SELECT id INTO org_id FROM core_organizations LIMIT 1;
        
        IF org_id IS NULL THEN
            INSERT INTO core_organizations (
                organization_name,
                organization_code,
                organization_type,
                industry_classification,
                status,
                created_by
            ) VALUES (
                'HERA Demo Organization',
                'ORG-HERA-DEMO-001',
                'business_unit',
                'technology',
                'active',
                existing_user_id
            ) RETURNING id INTO org_id;
        END IF;
        
        -- Create user entity
        INSERT INTO core_entities (
            id,
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            smart_code,
            status,
            created_by
        ) VALUES (
            existing_user_id,
            org_id,
            'user',
            'santhoshlal',
            'USER-SANTHOS-001',
            'HERA.USER.PROFILE.v1',
            'active',
            existing_user_id
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Create membership
        INSERT INTO core_memberships (
            organization_id,
            user_id,
            role,
            permissions,
            status,
            created_by
        ) VALUES (
            org_id,
            existing_user_id,
            'admin',
            '["user_management", "entity_management", "transaction_management"]'::jsonb,
            'active',
            existing_user_id
        ) ON CONFLICT (organization_id, user_id) DO NOTHING;
        
        -- Add dynamic data
        INSERT INTO core_dynamic_data (entity_id, field_name, field_value_text, created_by) VALUES
        (existing_user_id, 'email', 'santhoshlal@gmail.com', existing_user_id),
        (existing_user_id, 'auth_provider', 'supabase', existing_user_id),
        (existing_user_id, 'setup_date', NOW()::text, existing_user_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Created HERA entity for existing user: %', existing_user_id;
    ELSE
        RAISE NOTICE '✅ User entity already exists: %', existing_user_id;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 HERA Supabase amendments completed successfully!';
    RAISE NOTICE '✅ All tables updated with missing columns';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ Row Level Security policies updated';
    RAISE NOTICE '✅ User entity creation trigger updated';
    RAISE NOTICE '✅ Existing user setup completed';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to test:';
    RAISE NOTICE '1. Login at /login-supabase';
    RAISE NOTICE '2. Access /dashboard';
    RAISE NOTICE '3. Test /api/v1/supabase-test';
END $$;