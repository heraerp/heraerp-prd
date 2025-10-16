# Permanent RLS Fix for HERA Authentication

## Root Cause
The `core_relationships` table has overly restrictive RLS policies that prevent users from reading their own MEMBER_OF relationships, breaking the user-entity-resolver.

## Permanent Solution Steps

### 1. Fix RLS Policies (Database Admin Required)
```sql
-- Connect to Supabase dashboard SQL editor or use database admin access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "core_relationships_select" ON core_relationships;
DROP POLICY IF EXISTS "core_relationships_read" ON core_relationships;

-- Create proper policy allowing users to read their own relationships
CREATE POLICY "users_can_read_own_relationships" ON core_relationships
  FOR SELECT
  USING (
    -- Users can read relationships where they are the source
    auth.uid()::text = from_entity_id
    OR
    -- Users can read relationships where they are the target
    auth.uid()::text = to_entity_id
    OR
    -- Admins can read all relationships in their organization
    EXISTS (
      SELECT 1 FROM core_relationships admin_rel
      WHERE admin_rel.from_entity_id = auth.uid()::text
      AND admin_rel.relationship_type = 'MEMBER_OF'
      AND admin_rel.organization_id = core_relationships.organization_id
      AND admin_rel.is_active = true
      AND (admin_rel.relationship_data->>'role' IN ('OWNER', 'ADMIN'))
    )
  );

-- Ensure RLS is enabled
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON core_relationships TO authenticated;
```

### 2. Remove Temporary Workaround
Once RLS is fixed, remove the hardcoded fallback from `user-entity-resolver.ts`:

```typescript
// REMOVE THIS BLOCK:
if (authUserId === '09b0b92a-d797-489e-bc03-5ca0a6272674') {
  console.log('🛠️ Using fallback organization for Michele (temporary RLS workaround)')
  // ... hardcoded return
}
```

### 3. Test with Multiple Users
- Create test users in different organizations
- Verify each user can only see their own relationships
- Ensure cross-tenant isolation is maintained

## Benefits of Permanent Fix
1. ✅ **Scalable** - Works for all users automatically
2. ✅ **Secure** - Proper RLS enforcement
3. ✅ **HERA Compliant** - Dynamic data lookup
4. ✅ **Maintainable** - No hardcoded values
5. ✅ **Production Ready** - Follows database security best practices

## Alternative Approaches
If direct RLS modification isn't possible:

1. **Service Role Proxy** - Create an API endpoint that uses service role to lookup relationships
2. **Cached Context** - Store relationship data in JWT or session storage
3. **Database Function** - Create a security definer function for relationship lookup