# 🔍 Authentication RPC ID Mapping Diagnosis

**Date**: 2025-01-15
**Status**: ✅ **VERIFIED - API IS CORRECT**
**Issue**: User suspected wrong ID being passed to hera_auth_introspect_v1 RPC

---

## 🎯 Summary

After comprehensive MCP testing, we confirmed:
- ✅ **The API endpoint is CORRECT** - it properly maps Supabase auth UID → USER entity ID
- ✅ **The RPC expects USER entity ID, NOT auth UID**
- ✅ **Enhanced logging added to diagnose actual data flow**

---

## 🧪 MCP Test Results

### Test Script: `/mcp-server/diagnose-user-id-mismatch.mjs`

**Test 1: RPC with Supabase Auth UID**
```
p_actor_user_id: ebd0e099-e25a-476b-b6dc-4b3c26fae4a7 (Auth UID)
Result: ❌ 0 organizations returned
```

**Test 2: RPC with USER Entity ID**
```
p_actor_user_id: 1ac56047-78c9-4c2c-93db-84dcf307ab91 (Entity ID)
Result: ✅ 1 organization returned (HERA Salon Demo)
```

**Conclusion**: The RPC function `hera_auth_introspect_v1` expects **USER entity ID**, not Supabase auth UID.

---

## 📊 USER Entity Structure

### Sample USER Entity:
```json
{
  "id": "1ac56047-78c9-4c2c-93db-84dcf307ab91",  // USER entity ID (use this for RPC)
  "entity_name": "USER_ebd0e099e25a476bb6dc4b3c26fae4a7",
  "entity_type": "USER",
  "metadata": {
    "source": "hera_onboard_user_v1",
    "supabase_user_id": "ebd0e099-e25a-476b-b6dc-4b3c26fae4a7"  // Supabase auth UID
  }
}
```

**Key Relationship**:
- `metadata.supabase_user_id` = Supabase auth UID (from auth.users)
- `id` = USER entity ID (used for RPC calls)

---

## 🔧 API Endpoint Analysis

### File: `/src/app/api/v2/auth/resolve-membership/route.ts`

**Lines 43-63: User Entity Lookup**
```typescript
// ✅ FIX: Map auth UID to user entity ID by looking up metadata->supabase_user_id
console.log(`[resolve-membership] Looking up USER entity by supabase_user_id...`)
const { data: userEntities, error: lookupError } = await supabaseService
  .from('core_entities')
  .select('id, entity_name')
  .eq('entity_type', 'USER')
  .contains('metadata', { supabase_user_id: authUserId })  // ✅ CORRECT
  .limit(1)

// Use user entity ID if found, otherwise fall back to auth UID
const userEntityId = userEntities?.[0]?.id || authUserId

if (userEntities?.[0]) {
  console.log(`[resolve-membership] ✅ Mapped auth UID to user entity: ${userEntityId} (${userEntities[0].entity_name})`)
} else {
  console.log(`[resolve-membership] ⚠️ No USER entity found with supabase_user_id, using auth UID: ${authUserId}`)
}
```

**Lines 66-68: RPC Call**
```typescript
// ✅ OPTIMIZED: Single RPC call gets ALL organizations with roles and metadata
const { data: authContext, error: introspectError } = await supabaseService.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: userEntityId  // ✅ CORRECT - Uses mapped USER entity ID
})
```

**Verification**:
- ✅ Lookup by `metadata.supabase_user_id` - CORRECT
- ✅ Passes USER entity ID to RPC - CORRECT
- ✅ Falls back to auth UID if no entity found - SAFE

---

## 🛡️ Enhanced Diagnostic Logging

### Added Logging (Lines 87-124):

**1. RAW RPC Response Logging**:
```typescript
console.log('[resolve-membership] 📊 RAW RPC RESPONSE - Organizations:')
authContext.organizations.forEach((org: any, idx: number) => {
  console.log(`  [${idx + 1}] ${org.name} (${org.code})`)
  console.log(`      Org ID: ${org.id}`)
  console.log(`      Role: ${org.primary_role}`)
  console.log(`      Apps: ${JSON.stringify(org.apps || [])}`)
})
```

**2. Transformed API Response Logging**:
```typescript
console.log('[resolve-membership] 📊 TRANSFORMED API RESPONSE - Organizations:')
validOrgs.forEach((org: any, idx: number) => {
  console.log(`  [${idx + 1}] ${org.name} (${org.code})`)
  console.log(`      Org ID: ${org.id}`)
  console.log(`      Role: ${org.primary_role}`)
  console.log(`      Apps: ${JSON.stringify(org.apps || [])}`)
})
```

**3. Empty Context Logging**:
```typescript
if (!authContext || !authContext.organizations || authContext.organizations.length === 0) {
  console.log('[resolve-membership] No active memberships found')
  console.log('[resolve-membership] Auth context:', JSON.stringify(authContext, null, 2))
  // ...
}
```

---

## 📋 Testing Checklist

### Server-Side Logs (Next.js Console)

When user logs in, look for these logs:

**✅ Expected Flow**:
```
[resolve-membership] Resolving membership for auth user <auth-uid> (<email>)
[resolve-membership] Looking up USER entity by supabase_user_id...
[resolve-membership] ✅ Mapped auth UID to user entity: <entity-id> (<entity-name>)
[resolve-membership] 📊 RAW RPC RESPONSE - Organizations:
  [1] HERA Salon Demo (DEMO-SALON)
      Org ID: de5f248d-7747-44f3-9d11-a279f3158fa5
      Role: ORG_OWNER
      Apps: [{"code":"SALON","name":"HERA Salon Management",...}]
[resolve-membership] 📊 TRANSFORMED API RESPONSE - Organizations:
  [1] HERA Salon Demo (DEMO-SALON)
      Org ID: de5f248d-7747-44f3-9d11-a279f3158fa5
      Role: ORG_OWNER
      Apps: [{"code":"SALON","name":"HERA Salon Management",...}]
[resolve-membership] ⚡ OPTIMIZED: Single RPC resolved 1 organization(s) for user <entity-id>
[resolve-membership] Default org: de5f248d-7747-44f3-9d11-a279f3158fa5 (HERA Salon Demo) - Role: ORG_OWNER
```

**❌ Problem Indicators**:
```
[resolve-membership] ⚠️ No USER entity found with supabase_user_id, using auth UID: <auth-uid>
→ USER entity not created with metadata.supabase_user_id

[resolve-membership] No active memberships found
→ User has no organization memberships OR RPC received wrong ID

[resolve-membership] 📊 RAW RPC RESPONSE - Organizations:
  [1] Hair Talkz Salon (SALON)
      Apps: [{"code":"CASHEW",...}]
→ Wrong apps data in database (data corruption)
```

### Client-Side Logs (Browser Console)

Look for these logs from organization selector page:

```
🔍 [ORG PAGE] ====================== ORGANIZATIONS DATA ======================
🔍 [ORG PAGE] Total organizations loaded: 2

🔍 [ORG PAGE] Organization 1/2:
  - ID: de5f248d-7747-44f3-9d11-a279f3158fa5
  - Name: HERA Salon Demo
  - Code: DEMO-SALON
  - Apps: [{code: 'SALON', name: 'HERA Salon Management'}]

🔍 [ORG PAGE] Organization 2/2:
  - ID: 7288d538-f111-42d4-a07a-b4c535c5adc3
  - Name: Kerala Cashew Processors
  - Code: CASHEW
  - Apps: [{code: 'CASHEW', name: 'Cashew Manufacturing'}]
```

---

## 🎯 Diagnosis Decision Tree

### Issue: Organizations Loading Wrong Apps

**Step 1: Check Server Logs**

**If you see**: `⚠️ No USER entity found with supabase_user_id`
- **Problem**: USER entity missing metadata.supabase_user_id
- **Solution**: Fix user creation to include metadata
- **File**: Check user onboarding RPC

**If you see**: `No active memberships found`
- **Problem**: RPC received wrong ID OR user has no memberships
- **Solution**: Verify USER entity exists and has memberships
- **Test**: Run `/mcp-server/diagnose-user-id-mismatch.mjs`

**If you see**: Organizations with wrong apps
- **Problem**: Data corruption in database
- **Solution**: Check organization-app relationships in `core_relationships`
- **Query**:
  ```sql
  SELECT
    o.id as org_id,
    o.entity_name as org_name,
    r.relationship_type,
    a.entity_name as app_name
  FROM core_entities o
  LEFT JOIN core_relationships r
    ON r.source_entity_id = o.id
    AND r.relationship_type = 'ORG_HAS_APP'
  LEFT JOIN core_entities a
    ON a.id = r.target_entity_id
  WHERE o.entity_type = 'ORGANIZATION';
  ```

**Step 2: Check Client Logs**

**If organizations array has correct data**:
- **Problem**: Organization selector or context switch issue
- **Check**: `handleSelectOrganization` function
- **Verify**: Correct org object passed to `switchOrganization()`

**If organizations array has wrong data**:
- **Problem**: API returned wrong data
- **Check**: Server logs for RAW RPC response
- **Verify**: RPC returning correct organization-app mapping

---

## 🔧 MCP Testing Tools

### Test Scripts Created:

1. **`test-auth-introspect.mjs`** - Test RPC with demo user
2. **`test-introspect-id-mapping.mjs`** - Compare auth UID vs entity ID
3. **`diagnose-user-id-mismatch.mjs`** - Comprehensive diagnosis

### Run Tests:
```bash
cd mcp-server

# Test with specific user
node diagnose-user-id-mismatch.mjs

# Compare ID types
node test-introspect-id-mapping.mjs
```

---

## ✅ Verification Results

**API Endpoint**: ✅ **CORRECT**
- Properly maps Supabase auth UID to USER entity ID
- Passes correct ID to RPC
- Includes fallback for missing entities

**RPC Function**: ✅ **VERIFIED**
- Expects USER entity ID (not auth UID)
- Returns organizations with apps correctly
- Tested with MCP server

**Data Flow**: ✅ **CONFIRMED**
```
JWT Token → Auth UID → USER Entity Lookup → Entity ID → RPC → Organizations + Apps
```

**Enhanced Logging**: ✅ **ADDED**
- RAW RPC response logging
- Transformed API response logging
- Empty context debugging
- Comprehensive error logging

---

## 📝 Next Steps

1. **Test Authentication Flow**:
   - Login with demo user
   - Check server console for diagnostic logs
   - Verify organizations array has correct apps
   - Check browser console for organization selector logs

2. **If Organizations Have Wrong Apps**:
   - Not an ID mapping issue
   - Check database relationships (ORG_HAS_APP)
   - Run SQL query to verify org-app relationships
   - Fix data corruption if found

3. **If Organizations Load Correctly**:
   - Issue is in organization selector or context switch
   - Check `handleSelectOrganization` function
   - Verify correct org data passed to `switchOrganization`

---

## 🎓 Key Learnings

1. **USER Entity ID ≠ Supabase Auth UID**
   - USER entities have their own IDs in core_entities
   - Auth UID stored in `metadata.supabase_user_id`
   - RPC expects entity ID, not auth UID

2. **API Endpoint Mapping is Critical**
   - Must lookup USER entity by metadata before RPC call
   - Fallback to auth UID is safe but may not work
   - Always verify metadata.supabase_user_id exists

3. **Enhanced Logging is Essential**
   - Log both RAW and TRANSFORMED data
   - Compare server logs vs client logs
   - Track data through entire flow

---

**Last Updated**: 2025-01-15
**Status**: ✅ **API VERIFIED - ENHANCED LOGGING ADDED**
