-- Fix client association for restaurant demo
-- This creates a client record and associates it with our demo organization

-- Disable RLS temporarily
ALTER TABLE core_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE core_organizations DISABLE ROW LEVEL SECURITY;

-- Create Mario's Italian Bistro client if it doesn't exist
INSERT INTO core_clients (
  id,
  client_name,
  client_code,
  client_type,
  headquarters_country,
  primary_contact_email,
  status,
  subscription_tier
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001', -- Client ID
  'Mario''s Italian Bistro',
  'MARIO_BISTRO',
  'restaurant',
  'USA',
  'mario@restaurant.com',
  'active',
  'enterprise'
) ON CONFLICT (id) DO NOTHING;

-- Update the organization to have this client_id
UPDATE core_organizations 
SET client_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Re-enable RLS
ALTER TABLE core_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Client record created and associated with restaurant organization';
    RAISE NOTICE '🏢 Client: Mario''s Italian Bistro (550e8400-e29b-41d4-a716-446655440001)';
    RAISE NOTICE '🏗️  Organization: Mario''s Restaurant Demo (550e8400-e29b-41d4-a716-446655440000)';
    RAISE NOTICE '🚀 Menu creation should now work!';
END $$;