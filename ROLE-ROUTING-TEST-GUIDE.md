# HERA Role Routing - Testing Guide

## Quick Fix Summary

The redirect loop was caused by **not extracting the role from the organizations array** when switching organizations. The introspection RPC already returns roles per organization, we just weren't using them!

### What Was Fixed

**Before (Broken):**
```typescript
// switchOrganization tried to fetch role from API again
await fetch('/api/v2/auth/resolve-membership', {...})
// This would return the DEFAULT org's role, not the selected org's role!
```

**After (Fixed):**
```typescript
// Extract role directly from organizations array (already have it!)
const roleForOrg = (
  fullOrgData.primary_role ||  // First choice
  fullOrgData.roles?.[0] ||    // Fallback
  'user'                       // Last resort
).toLowerCase().replace(/^org_/, '')
```

## How to Test

### Test 1: Login with Multi-Org User

```bash
1. Open browser console (F12)
2. Login as: demo@heraerp.com / Hera@2025
3. You'll see organization selector
4. Watch console logs for:
   "✅ Role extracted from organizations array: {...}"
5. Click on any organization
6. Should see:
   - Organization name
   - Primary role (ORG_OWNER, ORG_RECEPTIONIST, etc.)
   - Extracted role (owner, receptionist, etc.)
   - All roles array
```

### Test 2: Verify No API Call on Org Switch

```bash
1. Open Network tab in DevTools
2. Select an organization
3. You should NOT see:
   - POST /api/v2/auth/resolve-membership (this was the bug!)
4. You SHOULD see:
   - GET /salon/dashboard (redirect to dashboard)
5. Check console for:
   "✅ Updated localStorage with new organization and role: {...}"
```

### Test 3: Different Roles Per Org

```bash
# If demo user has different roles in different orgs:
1. Select "HERA Salon Demo" (owner role)
   → Console: "primary_role: ORG_OWNER, extractedRole: owner"
   → Should land on /salon/dashboard ✅

2. Switch to "HERA Cashew Demo" (different role)
   → Console: "primary_role: ORG_[ROLE], extractedRole: [role]"
   → Should land on appropriate dashboard ✅

3. Check localStorage:
   localStorage.getItem('salonRole')
   → Should match extracted role ✅
```

### Test 4: Role Persistence

```bash
1. Login and select organization
2. Check console: Role should be logged
3. Refresh page (F5)
4. Role should persist from localStorage
5. Check:
   localStorage.getItem('salonRole')
   localStorage.getItem('organizationId')
```

## Console Log Examples

### Successful Org Switch

```javascript
🔄 Switching to organization: a1b2c3d4-...
✅ Role extracted from organizations array: {
  orgId: "a1b2c3d4-...",
  orgName: "HERA Salon Demo",
  primaryRole: "ORG_OWNER",
  extractedRole: "owner",
  allRoles: ["ORG_OWNER", "ORG_ADMIN"]
}
✅ Updated localStorage with new organization and role: {
  orgId: "a1b2c3d4-...",
  orgName: "HERA Salon Demo",
  role: "owner"
}
```

### Role Mismatch Detected

```javascript
// If introspection returns wrong role:
⚠️ Role mismatch detected: {
  expected: "owner",
  actual: "receptionist",
  organizationId: "a1b2c3d4-..."
}
```

## Debugging Checklist

### If redirect loop still occurs:

1. **Check introspection response:**
```javascript
// In browser console after login:
const token = localStorage.getItem('supabase.auth.token')
fetch('/api/v2/auth/resolve-membership', {
  headers: { Authorization: `Bearer ${JSON.parse(token).access_token}` }
})
.then(r => r.json())
.then(console.log)

// Look for:
// - organizations array
// - Each org should have primary_role field
// - Each org should have apps array
```

2. **Check HERAAuth context:**
```javascript
// In React DevTools:
// Find HERAAuthProvider
// Check state:
// - organizations array (should have all orgs with roles)
// - role (should match current org's primary_role)
// - organizationId (should match selected org)
```

3. **Check localStorage:**
```javascript
console.log({
  organizationId: localStorage.getItem('organizationId'),
  salonRole: localStorage.getItem('salonRole'),
  salonOrgId: localStorage.getItem('salonOrgId')
})
// All three should be consistent
```

4. **Check role extraction:**
```javascript
// Add this temporarily to switchOrganization:
console.log('DEBUG org data:', JSON.stringify(fullOrgData, null, 2))

// Look for:
// - primary_role field (e.g., "ORG_OWNER")
// - roles array (e.g., ["ORG_OWNER", "ORG_ADMIN"])
// - If missing, introspection is not working correctly
```

## Common Issues

### Issue 1: Role shows as "user" for everyone
**Cause:** Introspection not returning primary_role
**Fix:** Check HAS_ROLE relationships in database

```sql
SELECT
  cr.from_entity_id,
  cr.organization_id,
  cr.relationship_type,
  cr.relationship_data->>'role_code' as role_code,
  cr.is_active
FROM core_relationships cr
WHERE cr.relationship_type = 'HAS_ROLE'
  AND cr.from_entity_id = 'user-entity-id'
ORDER BY cr.organization_id;
```

### Issue 2: Different role shows in different orgs (expected!)
**This is CORRECT behavior** - users can have different roles per org.

Example:
- User A in Org 1: ORG_OWNER (owner role)
- User A in Org 2: ORG_RECEPTIONIST (receptionist role)

This is by design!

### Issue 3: localStorage role doesn't match context
**Cause:** Stale localStorage from previous session
**Fix:**
```javascript
// Clear and re-login
localStorage.clear()
// Login again - should sync correctly
```

## Database Verification

### Check user's roles per organization:

```sql
SELECT
  o.organization_name,
  o.id as organization_id,
  r.relationship_data->>'role_code' as role_code,
  r.is_active,
  r.created_at
FROM core_relationships r
JOIN core_organizations o ON o.id = r.organization_id
WHERE r.relationship_type = 'HAS_ROLE'
  AND r.from_entity_id = 'user-entity-id-here'
ORDER BY o.organization_name;
```

### Check introspection directly:

```sql
SELECT hera_auth_introspect_v1('user-entity-id-here'::uuid);
```

Expected response structure:
```json
{
  "organizations": [
    {
      "id": "...",
      "name": "HERA Salon Demo",
      "primary_role": "ORG_OWNER",
      "roles": ["ORG_OWNER", "ORG_ADMIN"],
      "apps": [{"code": "SALON", "name": "HERA Salon"}],
      "is_owner": true,
      "is_admin": true
    }
  ]
}
```

## Success Criteria

✅ **No API call** to resolve-membership on organization switch
✅ **Role extracted** from organizations array in console
✅ **localStorage updated** with correct role and org ID
✅ **No redirect loop** between dashboards
✅ **Correct dashboard** loaded for user's role in that org

## Next Steps After Testing

If everything works:
1. Remove debug console.logs (or set debug: false)
2. Test with production data
3. Monitor for edge cases

If issues persist:
1. Check database for correct HAS_ROLE relationships
2. Verify introspection RPC returns primary_role
3. Ensure organizations array is populated in auth context
4. Check for middleware interfering with redirects
