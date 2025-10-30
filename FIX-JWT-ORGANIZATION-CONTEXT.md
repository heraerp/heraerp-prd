# Fix: JWT Missing Organization Context

## 🚨 Problem

After successful operations (create product, restore product, etc.), users get redirected to login with "session expired" error.

**Root Cause:** JWT token doesn't have `organization_id` in metadata, causing `verifyAuth()` to fail.

## 🔍 Evidence from Logs

```
[JWT Service] Organization lookup: {
  userId: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7',
  found: false,                    ← JWT missing org context
  organizationId: undefined,       ← No org ID in token
  source: 'user_metadata'
}

[verifyAuth] No valid org membership {
  userId: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7',
  jwtOrg: undefined,               ← JWT missing org
  headerOrg: undefined,            ← No X-Organization-Id header
  allowedOrgs: []                  ← Empty allowed orgs
}

→ Result: GET /salon/auth?error=Your+session+has+expired
```

## ✅ Solutions

### Option 1: Re-login (Quick Fix)

**Log out and log back in to get fresh JWT with organization context:**

1. Click logout in the UI
2. Go to login page: `http://localhost:3000/signin`
3. Log in with credentials
4. New JWT will have organization metadata
5. Try creating/restoring products again

### Option 2: Update JWT Metadata (Manual Fix)

If you have access to Supabase dashboard, update the user's JWT metadata:

```sql
-- Update user metadata to include organization
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{organization_id}',
  '"378f24fb-d496-4ff7-8afa-ea34895a0eb8"'::jsonb
)
WHERE id = 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7';

-- Verify the update
SELECT
  id,
  email,
  raw_user_meta_data->>'organization_id' as org_id
FROM auth.users
WHERE id = 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7';
```

**Then refresh the session:**
- Log out and log back in
- Or wait for token to refresh (typically 1 hour)

### Option 3: Fix Self-Healing (Long-term Fix)

The logs show self-healing DOES find the organization:

```
[resolve-membership] Self-heal completed for hairtalkz02@gmail.com
organizationId: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
```

But it happens AFTER the redirect. We need to update the JWT token during self-healing:

**File:** `/src/app/api/v2/auth/resolve-membership/route.ts`

Add JWT refresh after self-healing:

```typescript
// After self-healing succeeds, update the JWT token
if (userEntityId && organizationId) {
  // Update user metadata with organization_id
  await supabase.auth.admin.updateUserById(
    userEntityId,
    {
      user_metadata: {
        organization_id: organizationId
      }
    }
  )

  // Return success with new token that includes org context
  return NextResponse.json({
    success: true,
    user_entity_id: userEntityId,
    organization_id: organizationId,
    message: 'JWT updated with organization context'
  })
}
```

## 🧪 Testing the Fix

After applying any solution, test these scenarios:

### 1. Test Product Creation
```bash
1. Go to /salon/products
2. Click "New Product"
3. Fill in product details
4. Click "Save"
5. ✅ Should stay on products page (NOT redirect to login)
```

### 2. Test Product Restore
```bash
1. Go to /salon/products
2. Toggle "Show Archived"
3. Click restore on archived product
4. ✅ Should restore without redirect
```

### 3. Verify JWT Token
```bash
# In browser console
localStorage.getItem('supabase.auth.token')

# Should see organization_id in the token payload
{
  "sub": "b3fcd455-7df2-42d2-bdd1-c962636cc8a7",
  "user_metadata": {
    "organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8"  ← Should be present
  }
}
```

## 🔧 Debug Commands

### Check Current User Metadata
```sql
SELECT
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'organization_id' as org_id
FROM auth.users
WHERE email = 'hairtalkz02@gmail.com';
```

### Check User Memberships
```sql
SELECT
  cr.source_entity_id as user_id,
  cr.target_entity_id as org_id,
  ce.entity_name as org_name,
  cr.relationship_type,
  cr.created_at
FROM core_relationships cr
JOIN core_entities ce ON ce.id = cr.target_entity_id
WHERE cr.source_entity_id = 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7'
  AND cr.relationship_type = 'USER_MEMBER_OF_ORG';
```

## 📋 Root Cause Summary

1. **JWT token lacks organization context**
   - No `organization_id` in `user_metadata`
   - Causes `[JWT Service] Organization lookup: found: false`

2. **verifyAuth() fails without org context**
   - Can't determine user's allowed organizations
   - Triggers "session expired" redirect

3. **Self-healing works but too late**
   - Finds organization: `378f24fb-d496-4ff7-8afa-ea34895a0eb8`
   - But redirect has already been triggered

## ✅ Recommended Action

**Quick Fix (5 minutes):**
1. Log out of the application
2. Log back in with credentials
3. New JWT should have organization context
4. Test product creation/restore

**Long-term Fix (30 minutes):**
1. Update `/src/app/api/v2/auth/resolve-membership/route.ts`
2. Add JWT token update during self-healing
3. Ensure all future logins include organization metadata

---

**Status:** Issue identified - JWT missing organization context
**Impact:** High - blocks all CRUD operations after initial success
**Priority:** Immediate - users cannot complete workflows
**Fix Difficulty:** Easy - re-login or update JWT metadata
