-- Fix RLS policies to allow users to see their own MEMBER_OF relationships
-- This is critical for the user-entity-resolver to work

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "core_relationships_select" ON core_relationships;
DROP POLICY IF EXISTS "core_relationships_read" ON core_relationships;
DROP POLICY IF EXISTS "Users can read their own relationships" ON core_relationships;

-- Create new policy that allows users to read relationships where they are the source
CREATE POLICY "Users can read their own relationships" ON core_relationships
  FOR SELECT
  USING (
    -- Allow reading if the user is the source of the relationship
    auth.uid()::text = from_entity_id
    OR
    -- Allow reading if the user is the target of the relationship  
    auth.uid()::text = to_entity_id
    OR
    -- Allow if they have OWNER/ADMIN role in the organization
    EXISTS (
      SELECT 1 FROM core_relationships r
      WHERE r.from_entity_id = auth.uid()::text 
      AND r.to_entity_id = core_relationships.organization_id
      AND r.relationship_type = 'MEMBER_OF'
      AND r.is_active = true
      AND (r.relationship_data->>'role' IN ('OWNER', 'ADMIN'))
    )
  );

-- Ensure RLS is enabled
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON core_relationships TO authenticated;
GRANT SELECT ON core_relationships TO anon;