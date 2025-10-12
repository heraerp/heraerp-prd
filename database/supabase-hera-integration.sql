-- =====================================================================
-- HERA Universal ERP - Supabase Integration Schema
-- Complete 6-Table Universal Architecture for Supabase
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. CORE ORGANIZATIONS - WHO: Multi-tenant business isolation
-- =====================================================================
CREATE TABLE IF NOT EXISTS core_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    organization_code VARCHAR(100) UNIQUE NOT NULL,
    organization_type VARCHAR(50) DEFAULT 'business_unit',
    industry_classification VARCHAR(100),
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_core_organizations_code ON core_organizations(organization_code);
CREATE INDEX IF NOT EXISTS idx_core_organizations_status ON core_organizations(status);
CREATE INDEX IF NOT EXISTS idx_core_organizations_type ON core_organizations(organization_type);

-- =====================================================================
-- 2. CORE ENTITIES - WHAT: All business objects 
-- =====================================================================
CREATE TABLE IF NOT EXISTS core_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_code VARCHAR(100),
    entity_category VARCHAR(100),
    description TEXT,
    smart_code VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Entity indexes
CREATE INDEX IF NOT EXISTS idx_core_entities_org ON core_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_entities_type ON core_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_core_entities_code ON core_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_core_entities_status ON core_entities(status);
CREATE INDEX IF NOT EXISTS idx_core_entities_smart_code ON core_entities(smart_code);

-- =====================================================================
-- 3. CORE DYNAMIC DATA - HOW: Unlimited custom fields
-- =====================================================================
CREATE TABLE IF NOT EXISTS core_dynamic_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES core_entities(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    field_value_text TEXT,
    field_value_number DECIMAL(20,6),
    field_value_date TIMESTAMP WITH TIME ZONE,
    field_value_boolean BOOLEAN,
    field_value_json JSONB,
    smart_code VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Dynamic data indexes
CREATE INDEX IF NOT EXISTS idx_core_dynamic_data_entity ON core_dynamic_data(entity_id);
CREATE INDEX IF NOT EXISTS idx_core_dynamic_data_field ON core_dynamic_data(field_name);
CREATE INDEX IF NOT EXISTS idx_core_dynamic_data_smart_code ON core_dynamic_data(smart_code);

-- =====================================================================
-- 4. CORE RELATIONSHIPS - WHY: Universal entity connections
-- =====================================================================
CREATE TABLE IF NOT EXISTS core_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    parent_entity_id UUID NOT NULL REFERENCES core_entities(id) ON DELETE CASCADE,
    child_entity_id UUID NOT NULL REFERENCES core_entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    relationship_name VARCHAR(255),
    smart_code VARCHAR(255),
    properties JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_core_relationships_org ON core_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_relationships_parent ON core_relationships(parent_entity_id);
CREATE INDEX IF NOT EXISTS idx_core_relationships_child ON core_relationships(child_entity_id);
CREATE INDEX IF NOT EXISTS idx_core_relationships_type ON core_relationships(relationship_type);

-- =====================================================================
-- 5. UNIVERSAL TRANSACTIONS - WHEN: All business transaction headers
-- =====================================================================
CREATE TABLE IF NOT EXISTS universal_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    transaction_type VARCHAR(100) NOT NULL,
    transaction_number VARCHAR(100) UNIQUE,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference_entity_id UUID REFERENCES core_entities(id),
    counterpart_entity_id UUID REFERENCES core_entities(id),
    total_amount DECIMAL(20,6) DEFAULT 0,
    currency_code VARCHAR(3) DEFAULT 'USD',
    smart_code VARCHAR(255),
    description TEXT,
    properties JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_universal_transactions_org ON universal_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_universal_transactions_type ON universal_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_universal_transactions_number ON universal_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_universal_transactions_date ON universal_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_universal_transactions_ref_entity ON universal_transactions(reference_entity_id);

-- =====================================================================
-- 6. UNIVERSAL TRANSACTION LINES - DETAILS: Transaction line items
-- =====================================================================
CREATE TABLE IF NOT EXISTS universal_transaction_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES universal_transactions(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    line_entity_id UUID REFERENCES core_entities(id),
    line_type VARCHAR(100),
    description TEXT,
    quantity DECIMAL(20,6) DEFAULT 1,
    unit_price DECIMAL(20,6) DEFAULT 0,
    line_amount DECIMAL(20,6) DEFAULT 0,
    smart_code VARCHAR(255),
    properties JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Transaction lines indexes
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_txn ON universal_transaction_lines(transaction_id);
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_entity ON universal_transaction_lines(line_entity_id);
CREATE INDEX IF NOT EXISTS idx_universal_transaction_lines_type ON universal_transaction_lines(line_type);

-- =====================================================================
-- 7. CORE MEMBERSHIPS - User organization relationships
-- =====================================================================
CREATE TABLE IF NOT EXISTS core_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Membership indexes
CREATE INDEX IF NOT EXISTS idx_core_memberships_org ON core_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_core_memberships_user ON core_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_core_memberships_role ON core_memberships(role);

-- =====================================================================
-- 8. ROW LEVEL SECURITY (RLS) - Perfect Multi-Tenancy
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_memberships ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization
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

-- Organization policies
CREATE POLICY "Users can view their organization" ON core_organizations
    FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "Users can update their organization" ON core_organizations  
    FOR UPDATE USING (id = get_user_organization_id());

-- Entity policies
CREATE POLICY "Users can access their organization entities" ON core_entities
    FOR ALL USING (organization_id = get_user_organization_id());

-- Dynamic data policies
CREATE POLICY "Users can access their organization dynamic data" ON core_dynamic_data
    FOR ALL USING (
        entity_id IN (
            SELECT id FROM core_entities 
            WHERE organization_id = get_user_organization_id()
        )
    );

-- Relationship policies
CREATE POLICY "Users can access their organization relationships" ON core_relationships
    FOR ALL USING (organization_id = get_user_organization_id());

-- Transaction policies
CREATE POLICY "Users can access their organization transactions" ON universal_transactions
    FOR ALL USING (organization_id = get_user_organization_id());

-- Transaction line policies
CREATE POLICY "Users can access their organization transaction lines" ON universal_transaction_lines
    FOR ALL USING (
        transaction_id IN (
            SELECT id FROM universal_transactions 
            WHERE organization_id = get_user_organization_id()
        )
    );

-- Membership policies
CREATE POLICY "Users can view their own memberships" ON core_memberships
    FOR SELECT USING (user_id = auth.uid());

-- =====================================================================
-- 9. AUTOMATIC USER ENTITY CREATION TRIGGER
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
BEGIN
    -- Extract organization info from user metadata
    org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Default Organization');
    org_code := CONCAT('ORG-', EXTRACT(EPOCH FROM NOW())::TEXT);
    
    -- Create or get organization
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
    )
    ON CONFLICT (organization_code) DO NOTHING
    RETURNING id INTO org_uuid;
    
    -- If organization already exists, get its ID or use first organization
    IF org_uuid IS NULL THEN
        SELECT id INTO org_uuid 
        FROM core_organizations 
        WHERE organization_name = org_name 
        OR id = (SELECT id FROM core_organizations LIMIT 1)
        LIMIT 1;
    END IF;
    
    -- If still no organization, create a default one
    IF org_uuid IS NULL THEN
        INSERT INTO core_organizations (
            organization_name,
            organization_code,
            organization_type,
            status,
            created_by
        ) VALUES (
            'Default Organization',
            CONCAT('ORG-DEFAULT-', EXTRACT(EPOCH FROM NOW())::TEXT),
            'business_unit',
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
        'HERA.USER.PROFILE.V1',
        'active',
        NEW.id
    );
    
    -- Store user properties in core_dynamic_data
    INSERT INTO core_dynamic_data(entity_id, field_name, field_value_text, created_by) VALUES
    (NEW.id, 'email', NEW.email, NEW.id),
    (NEW.id, 'auth_provider', 'supabase', NEW.id),
    (NEW.id, 'signup_date', NOW()::text, NEW.id);
    
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
    );
    
    RETURN NEW;
END $$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================================
-- 10. UTILITY FUNCTIONS
-- =====================================================================

-- Function to get user's organization info
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

-- Function to create entity with dynamic data
CREATE OR REPLACE FUNCTION create_entity_with_data(
    p_entity_type TEXT,
    p_entity_name TEXT,
    p_entity_code TEXT DEFAULT NULL,
    p_smart_code TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_dynamic_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_entity_id UUID;
    v_org_id UUID;
    key TEXT;
    value TEXT;
BEGIN
    -- Get user's organization
    SELECT organization_id INTO v_org_id FROM core_memberships 
    WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
    
    -- Create entity
    INSERT INTO core_entities (
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        description,
        created_by
    ) VALUES (
        v_org_id,
        p_entity_type,
        p_entity_name,
        COALESCE(p_entity_code, CONCAT(UPPER(p_entity_type), '-', EXTRACT(EPOCH FROM NOW())::TEXT)),
        p_smart_code,
        p_description,
        auth.uid()
    ) RETURNING id INTO v_entity_id;
    
    -- Add dynamic data
    FOR key, value IN SELECT * FROM jsonb_each_text(p_dynamic_data)
    LOOP
        INSERT INTO core_dynamic_data (
            entity_id,
            field_name,
            field_value_text,
            created_by
        ) VALUES (
            v_entity_id,
            key,
            value,
            auth.uid()
        );
    END LOOP;
    
    RETURN v_entity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 11. SAMPLE DATA INSERTION (Optional)
-- =====================================================================

-- Insert sample organization for testing (if none exists)
INSERT INTO core_organizations (
    organization_name,
    organization_code,
    organization_type,
    industry_classification,
    settings,
    status
) VALUES (
    'HERA Demo Organization',
    'ORG-DEMO-001',
    'business_unit',
    'technology',
    '{"demo_mode": true, "features": ["crm", "finance", "inventory"]}'::jsonb,
    'active'
) ON CONFLICT (organization_code) DO NOTHING;

-- =====================================================================
-- Success Message
-- =====================================================================
DO $$
BEGIN
    RAISE NOTICE '🎉 HERA Universal ERP Schema installed successfully!';
    RAISE NOTICE '✅ 6-table universal architecture ready';
    RAISE NOTICE '🔐 Row Level Security enabled';
    RAISE NOTICE '🚀 Automatic user entity creation configured';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test user registration';
    RAISE NOTICE '2. Verify entity creation';
    RAISE NOTICE '3. Check organization setup';
END $$;