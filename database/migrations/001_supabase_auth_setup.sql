-- HERA Supabase Authentication Setup
-- Version 2.0 - Fixed for common Supabase issues
-- This migration sets up automatic user entity creation when users sign up via Supabase Auth

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view their organizations" ON core_organizations;
    DROP POLICY IF EXISTS "Users can view entities in their organizations" ON core_entities;
    DROP POLICY IF EXISTS "Users can view dynamic data for their entities" ON core_dynamic_data;
    DROP POLICY IF EXISTS "Users can view their own memberships" ON core_memberships;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- 1. Create core_organizations table
CREATE TABLE IF NOT EXISTS core_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(255) NOT NULL,
    organization_code VARCHAR(50) UNIQUE NOT NULL,
    organization_type VARCHAR(50) DEFAULT 'business_unit',
    industry_classification VARCHAR(100),
    parent_organization_id UUID REFERENCES core_organizations(id),
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    ai_classification VARCHAR(255),
    ai_confidence_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create core_entities table
CREATE TABLE IF NOT EXISTS core_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_code VARCHAR(100),
    smart_code VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    ai_classification VARCHAR(255),
    ai_confidence_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, entity_code)
);

-- 3. Create core_dynamic_data table
CREATE TABLE IF NOT EXISTS core_dynamic_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES core_entities(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_value_number DECIMAL(20,4),
    field_value_date TIMESTAMP WITH TIME ZONE,
    field_value_json JSONB,
    field_type VARCHAR(50),
    smart_code VARCHAR(255),
    validation_rules JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create core_memberships table
CREATE TABLE IF NOT EXISTS core_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core_organizations(id),
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entities_org_type ON core_entities(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_smart_code ON core_entities(smart_code);
CREATE INDEX IF NOT EXISTS idx_dynamic_data_entity ON core_dynamic_data(entity_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON core_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON core_memberships(organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with proper checks
-- Organizations: Users can only see organizations they're members of
CREATE POLICY "Users can view their organizations" ON core_organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM core_memberships 
            WHERE core_memberships.organization_id = core_organizations.id
            AND core_memberships.user_id = auth.uid() 
            AND core_memberships.status = 'active'
        )
    );

-- Entities: Users can only see entities in their organizations
CREATE POLICY "Users can view entities in their organizations" ON core_entities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM core_memberships 
            WHERE core_memberships.organization_id = core_entities.organization_id
            AND core_memberships.user_id = auth.uid() 
            AND core_memberships.status = 'active'
        )
    );

-- Dynamic data: Users can only see data for entities they can access
CREATE POLICY "Users can view dynamic data for their entities" ON core_dynamic_data
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM core_entities 
            JOIN core_memberships ON core_memberships.organization_id = core_entities.organization_id
            WHERE core_entities.id = core_dynamic_data.entity_id
            AND core_memberships.user_id = auth.uid() 
            AND core_memberships.status = 'active'
        )
    );

-- Memberships: Users can only see their own memberships
CREATE POLICY "Users can view their own memberships" ON core_memberships
    FOR SELECT
    USING (user_id = auth.uid());

-- Drop existing trigger and function to recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the automatic user entity creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_uuid UUID;
    org_name TEXT;
    org_code TEXT;
    user_name TEXT;
    user_code TEXT;
    existing_org_id UUID;
BEGIN
    -- Extract data from user metadata with defaults
    org_name := COALESCE(
        NEW.raw_user_meta_data->>'organization_name',
        NEW.raw_app_meta_data->>'organization_name',
        'Default Organization'
    );
    
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_app_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Generate unique codes with timestamp
    org_code := 'ORG-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-') || LEFT(MD5(NEW.id::TEXT || random()::TEXT), 8);
    user_code := 'USER-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS-') || LEFT(MD5(NEW.id::TEXT || random()::TEXT), 8);
    
    -- First, check if an organization with this name already exists for this user
    SELECT id INTO existing_org_id
    FROM public.core_organizations
    WHERE organization_name = org_name
    AND created_by = NEW.id
    AND status = 'active'
    LIMIT 1;
    
    IF existing_org_id IS NOT NULL THEN
        org_uuid := existing_org_id;
    ELSE
        -- Create new organization
        BEGIN
            INSERT INTO public.core_organizations (
                organization_name,
                organization_code,
                organization_type,
                industry_classification,
                settings,
                metadata,
                status,
                created_by
            ) VALUES (
                org_name,
                org_code,
                'business_unit',
                COALESCE(NEW.raw_user_meta_data->>'industry', 'general'),
                jsonb_build_object(
                    'signup_source', 'supabase_auth',
                    'signup_date', NOW()::TEXT,
                    'email_verified', COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
                ),
                jsonb_build_object(
                    'source_user_id', NEW.id,
                    'email', NEW.email,
                    'created_from', 'auth_trigger'
                ),
                'active',
                NEW.id
            )
            RETURNING id INTO org_uuid;
        EXCEPTION
            WHEN unique_violation THEN
                -- If unique constraint violation, try to find the existing org
                SELECT id INTO org_uuid
                FROM public.core_organizations
                WHERE organization_code = org_code
                LIMIT 1;
                
                -- If still null, generate a new code and try again
                IF org_uuid IS NULL THEN
                    org_code := org_code || '-' || LEFT(MD5(random()::TEXT), 4);
                    INSERT INTO public.core_organizations (
                        organization_name,
                        organization_code,
                        organization_type,
                        industry_classification,
                        settings,
                        metadata,
                        status,
                        created_by
                    ) VALUES (
                        org_name,
                        org_code,
                        'business_unit',
                        COALESCE(NEW.raw_user_meta_data->>'industry', 'general'),
                        jsonb_build_object(
                            'signup_source', 'supabase_auth',
                            'signup_date', NOW()::TEXT
                        ),
                        jsonb_build_object(
                            'source_user_id', NEW.id,
                            'email', NEW.email
                        ),
                        'active',
                        NEW.id
                    )
                    RETURNING id INTO org_uuid;
                END IF;
        END;
    END IF;

    -- Create user as core_entity (using Supabase user ID as entity ID)
    BEGIN
        INSERT INTO public.core_entities(
            id,
            organization_id, 
            entity_type,
            entity_name,
            entity_code,
            smart_code,
            metadata,
            status,
            created_by
        ) VALUES (
            NEW.id,  -- Use Supabase user ID as entity ID
            org_uuid,
            'user',
            user_name,
            user_code,
            'HERA.USER.PROFILE.v1',
            jsonb_build_object(
                'auth_provider', 'supabase',
                'email', NEW.email,
                'email_confirmed', COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                'phone', NEW.phone,
                'created_from', 'auth_trigger'
            ),
            'active',
            NEW.id
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Update existing entity if it somehow exists
            UPDATE public.core_entities
            SET 
                organization_id = org_uuid,
                entity_name = user_name,
                updated_at = NOW()
            WHERE id = NEW.id;
    END;
    
    -- Store user properties in core_dynamic_data
    -- Delete any existing properties first (in case of re-registration)
    DELETE FROM public.core_dynamic_data WHERE entity_id = NEW.id;
    
    -- Insert fresh properties
    INSERT INTO public.core_dynamic_data(
        entity_id, 
        field_name, 
        field_value,
        field_type,
        smart_code,
        created_by
    ) VALUES
    (NEW.id, 'email', NEW.email, 'text', 'HERA.USER.EMAIL.v1', NEW.id),
    (NEW.id, 'auth_provider', 'supabase', 'text', 'HERA.USER.AUTH_PROVIDER.v1', NEW.id),
    (NEW.id, 'signup_date', NOW()::TEXT, 'datetime', 'HERA.USER.SIGNUP_DATE.v1', NEW.id),
    (NEW.id, 'full_name', user_name, 'text', 'HERA.USER.FULL_NAME.v1', NEW.id);
    
    -- Add phone if provided
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        INSERT INTO public.core_dynamic_data(
            entity_id, 
            field_name, 
            field_value,
            field_type,
            smart_code,
            created_by
        ) VALUES
        (NEW.id, 'phone', NEW.phone, 'text', 'HERA.USER.PHONE.v1', NEW.id);
    END IF;
    
    -- Create membership (upsert to handle re-registration)
    INSERT INTO public.core_memberships(
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
        CASE 
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'admin' 
            THEN '["entities:*", "transactions:*", "reports:*", "settings:*"]'::jsonb
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'manager'
            THEN '["entities:*", "transactions:*", "reports:read"]'::jsonb
            ELSE '["entities:read", "transactions:read", "reports:read"]'::jsonb
        END,
        'active',
        NEW.id
    )
    ON CONFLICT (organization_id, user_id) 
    DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        status = EXCLUDED.status,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END $$;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions (with error handling)
DO $$
BEGIN
    GRANT USAGE ON SCHEMA auth TO postgres, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, service_role;
EXCEPTION
    WHEN OTHERS THEN
        -- Some permissions might already exist
        NULL;
END $$;

-- Create helper function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID)
RETURNS TABLE (
    organization_id UUID,
    organization_name VARCHAR(255),
    organization_code VARCHAR(50),
    role VARCHAR(50),
    permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.organization_name,
        o.organization_code,
        m.role,
        m.permissions
    FROM public.core_memberships m
    JOIN public.core_organizations o ON m.organization_id = o.id
    WHERE m.user_id = user_uuid
    AND m.status = 'active'
    AND o.status = 'active';
END $$;

-- Create function to manually process existing users (useful for migrations)
CREATE OR REPLACE FUNCTION public.process_existing_user(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result BOOLEAN := FALSE;
BEGIN
    -- Find the user
    SELECT * INTO user_record
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    IF user_record.id IS NOT NULL THEN
        -- Manually call the trigger function
        PERFORM handle_new_user() FROM auth.users WHERE id = user_record.id;
        result := TRUE;
    END IF;
    
    RETURN result;
END $$;

-- Verification queries (commented out, run manually to verify)
/*
-- Check if trigger exists
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT 
    proname as function_name,
    pronargs as num_arguments
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Test the setup with a specific user
SELECT * FROM public.get_user_organizations('user-uuid-here');

-- Check all users and their entities
SELECT 
    u.email,
    e.entity_name,
    e.entity_type,
    o.organization_name,
    (r.metadata->>'role')::TEXT as role
FROM auth.users u
LEFT JOIN core_entities e ON e.id = u.id
LEFT JOIN core_organizations o ON e.organization_id = o.id
LEFT JOIN core_relationships r ON r.from_entity_id = u.id AND r.to_entity_id = o.id AND r.relationship_type = 'member_of'
ORDER BY u.created_at DESC;
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'HERA Supabase Authentication setup completed successfully!';
    RAISE NOTICE 'New users will automatically have entities created.';
    RAISE NOTICE 'To process existing users, use: SELECT process_existing_user(''email@example.com'');';
END $$;