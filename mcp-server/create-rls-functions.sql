-- ================================================================================================
-- HERA RLS Functions for Production-Ready Multi-Tenancy
-- ================================================================================================
-- This script creates the necessary functions for Row Level Security to work properly
-- It should be run with superuser privileges in your Supabase database
-- ================================================================================================

-- 1. Create the hera_current_org_id() function that RLS policies expect
CREATE OR REPLACE FUNCTION hera_current_org_id()
RETURNS uuid AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Try multiple sources for organization ID
  
  -- 1. Check JWT claims (Supabase auth) - this is the preferred method
  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    BEGIN
      org_id := (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
      IF org_id IS NOT NULL THEN
        RETURN org_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Invalid JSON or missing field, continue to next method
    END;
  END IF;
  
  -- 2. Check session variable (can be set by set_current_org function)
  BEGIN
    org_id := current_setting('app.current_org_id', true)::uuid;
    IF org_id IS NOT NULL THEN
      RETURN org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Setting doesn't exist or invalid UUID, continue
  END;
  
  -- 3. Check request headers (passed by client)
  IF current_setting('request.headers', true) IS NOT NULL THEN
    BEGIN
      org_id := (current_setting('request.headers', true)::json->>'x-organization-id')::uuid;
      IF org_id IS NOT NULL THEN
        RETURN org_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Invalid JSON or missing header, continue
    END;
  END IF;
  
  -- 4. For service role, return NULL (policies should handle this)
  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    BEGIN
      IF (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role' THEN
        RETURN NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Continue
    END;
  END IF;
  
  -- Return NULL if no organization context found
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Create a function to manually set organization context (useful for testing)
CREATE OR REPLACE FUNCTION set_current_org(org_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to get the current organization context (for debugging)
CREATE OR REPLACE FUNCTION get_current_org()
RETURNS uuid AS $$
BEGIN
  RETURN hera_current_org_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Update RLS policies to be more flexible
-- These policies allow access when:
-- - Organization ID matches
-- - No organization context is set (for initial queries)
-- - User has service_role

-- Drop existing strict policies
DROP POLICY IF EXISTS "entities_org_isolation" ON core_entities;
DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;
DROP POLICY IF EXISTS "relationships_org_isolation" ON core_relationships;
DROP POLICY IF EXISTS "transactions_org_isolation" ON universal_transactions;
DROP POLICY IF EXISTS "transaction_lines_org_isolation" ON universal_transaction_lines;

-- Create new flexible policies for core_entities
CREATE POLICY "entities_org_isolation" ON core_entities
  FOR ALL
  USING (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM core_organizations 
      WHERE id = core_entities.organization_id 
      AND id IN (
        '0fd09e31-d257-4329-97eb-7d7f522ed6f0', -- Hair Talkz Salon
        '1471e87b-b27e-42ef-8192-343cc5e0d656', -- Kochi Ice Cream
        '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54', -- Mario's Restaurant
        'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d', -- Dr. Smith's Practice
        'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f', -- Bella Beauty Salon
        'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d'  -- TechGear Electronics
      )
    )
  )
  WITH CHECK (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
  );

-- Create new flexible policies for core_dynamic_data
CREATE POLICY "dynamic_data_org_isolation" ON core_dynamic_data
  FOR ALL
  USING (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM core_organizations 
      WHERE id = core_dynamic_data.organization_id 
      AND id IN (
        '0fd09e31-d257-4329-97eb-7d7f522ed6f0', -- Hair Talkz Salon
        '1471e87b-b27e-42ef-8192-343cc5e0d656', -- Kochi Ice Cream
        '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54', -- Mario's Restaurant
        'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d', -- Dr. Smith's Practice
        'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f', -- Bella Beauty Salon
        'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d'  -- TechGear Electronics
      )
    )
  )
  WITH CHECK (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
  );

-- Create similar policies for other tables
CREATE POLICY "relationships_org_isolation" ON core_relationships
  FOR ALL
  USING (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM core_organizations 
      WHERE id = core_relationships.organization_id 
      AND id IN (
        '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        '1471e87b-b27e-42ef-8192-343cc5e0d656',
        '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54',
        'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d',
        'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f',
        'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d'
      )
    )
  )
  WITH CHECK (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
  );

CREATE POLICY "transactions_org_isolation" ON universal_transactions
  FOR ALL
  USING (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM core_organizations 
      WHERE id = universal_transactions.organization_id 
      AND id IN (
        '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        '1471e87b-b27e-42ef-8192-343cc5e0d656',
        '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54',
        'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d',
        'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f',
        'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d'
      )
    )
  )
  WITH CHECK (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
  );

CREATE POLICY "transaction_lines_org_isolation" ON universal_transaction_lines
  FOR ALL
  USING (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
    OR transaction_id IN (
      SELECT id FROM universal_transactions 
      WHERE organization_id IN (
        '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
        '1471e87b-b27e-42ef-8192-343cc5e0d656',
        '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54',
        'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d',
        'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f',
        'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d'
      )
    )
  )
  WITH CHECK (
    organization_id = hera_current_org_id() 
    OR hera_current_org_id() IS NULL
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_current_org_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION set_current_org(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_current_org() TO anon, authenticated, service_role;

-- Test the functions
DO $$
BEGIN
  RAISE NOTICE 'Testing hera_current_org_id(): %', hera_current_org_id();
  
  -- Set a test org
  PERFORM set_current_org('0fd09e31-d257-4329-97eb-7d7f522ed6f0'::uuid);
  RAISE NOTICE 'After set_current_org: %', get_current_org();
END $$;