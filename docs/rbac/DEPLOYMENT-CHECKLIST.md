# HERA RBAC Deployment Checklist

**Date:** 2025-10-27
**Status:** ✅ **READY FOR DEPLOYMENT**
**Reviewer:** Claude Code (MCP Server)

---

## 📋 Deployment Summary

This checklist consolidates all HERA RBAC work completed in this session:

1. ✅ **User Documentation Created** - Complete API reference for all RBAC RPC functions
2. ✅ **Migration Executed** - 6 users migrated from MEMBER_OF to HAS_ROLE pattern
3. ✅ **Login API Upgraded** - `/api/v2/auth/resolve-membership` now uses modern RPC
4. ✅ **Introspect Function Fixed** - PostgREST type casting issue resolved
5. ✅ **Test Scripts Ready** - Comprehensive test coverage for all components

---

## 📚 Documentation Deliverables

### 1. HERA RBAC User Management API
**File:** `/docs/rbac/HERA-RBAC-USER-MANAGEMENT-API.md`

**Purpose:** Complete reference documentation for RBAC RPC functions

**Contents:**
- `_hera_role_rank()` - Role precedence helper
- `_hera_resolve_org_role()` - Primary role resolution
- `hera_onboard_user_v1()` - User onboarding with role assignment
- `hera_organizations_crud_v1()` - Organization management
- `hera_auth_introspect_v1()` - Full authentication context

**Usage:** Reference this document when implementing authentication flows

---

### 2. HERA RBAC Migration Report
**File:** `/docs/rbac/HERA-RBAC-MIGRATION-REPORT.md`

**Purpose:** Documents the MEMBER_OF → HAS_ROLE migration results

**Key Findings:**
- 29 total MEMBER_OF relationships analyzed
- 6 users successfully migrated to HAS_ROLE
- 23 users without roles (need assignment)
- 2 ROLE entities created (ORG_OWNER, ORG_EMPLOYEE)

**Next Steps:** Assign roles to remaining 23 users using `hera_onboard_user_v1`

---

### 3. Salon Access Upgrade Summary
**File:** `/docs/rbac/SALON-ACCESS-UPGRADE-SUMMARY.md`

**Purpose:** Documents login API upgrade to modern RPC pattern

**Changes Made:**
- API now calls `_hera_resolve_org_role` for each organization
- Supports both HAS_ROLE (primary) and MEMBER_OF (fallback)
- Removed hardcoded organization IDs
- 100% backward compatible with existing frontend

**Status:** ✅ **DEPLOYED TO PRODUCTION** - Working correctly

---

### 4. Auth Introspect Deployment Review
**File:** `/docs/rbac/HERA-AUTH-INTROSPECT-DEPLOYMENT-REVIEW.md`

**Purpose:** Pre-deployment review for `hera_auth_introspect_v1` type casting fix

**Key Points:**
- ✅ Approved for deployment
- Fixes PostgREST "polymorphic type" error
- Adds explicit `to_jsonb()` casting to all fields
- Low risk - current API doesn't use it yet
- Provides future optimization option

**Status:** ⏳ **PENDING USER DEPLOYMENT**

---

## 🗄️ Database Migration Files

### 1. Fix Auth Introspect Type Casting
**File:** `/db/migrations/fix_hera_auth_introspect_v1_type_casting.sql`

**Purpose:** Fixes PostgREST type inference issue in `hera_auth_introspect_v1`

**Deployment Steps:**
```sql
-- Option 1: Via Supabase SQL Editor
-- Copy contents and paste into Supabase SQL Editor, then execute

-- Option 2: Via Supabase CLI
supabase db execute --file db/migrations/fix_hera_auth_introspect_v1_type_casting.sql
```

**Expected Result:** Function deployable and callable via `.rpc()` without errors

**Verification:** Run test script after deployment

---

## 🧪 Test Scripts

### 1. Test Introspect V2 (After Deployment)
**File:** `/mcp-server/test-introspect-v2.mjs`

**Purpose:** Test `hera_auth_introspect_v1` after deploying type casting fix

**Run Command:**
```bash
cd /home/san/PRD/heraerp-dev
node mcp-server/test-introspect-v2.mjs
```

**Expected Output:**
```
✅ RPC Call Successful!
📊 Auth Context Structure: {...}
🔍 Field Validation:
   ✅ user_id exists: true
   ✅ introspected_at exists: true
   ✅ organizations is array: true
```

**Success Criteria:**
- No "polymorphic type" errors
- Returns well-formed JSON object
- All fields properly typed

---

### 2. Test Upgraded API
**File:** `/mcp-server/test-upgraded-api.mjs`

**Purpose:** Verify `/api/v2/auth/resolve-membership` using modern RPC

**Run Command:**
```bash
cd /home/san/PRD/heraerp-dev
node mcp-server/test-upgraded-api.mjs
```

**Expected Output:**
```
✅ Role Resolution for org xxxxxxxx:
   Resolved Role: ORG_OWNER
   Organization: [Organization Name]
```

**Success Criteria:**
- RPC `_hera_resolve_org_role` returns correct role
- Handles both HAS_ROLE and MEMBER_OF patterns
- No errors

---

### 3. Verify Migration
**File:** `/mcp-server/verify-migration.mjs`

**Purpose:** Check migration results and user role assignments

**Run Command:**
```bash
cd /home/san/PRD/heraerp-dev
node mcp-server/verify-migration.mjs
```

**Expected Output:**
```
📊 Migration Statistics:
   Users with HAS_ROLE: 6
   Users with MEMBER_OF only: 23
```

**Success Criteria:**
- Migrated users have both MEMBER_OF and HAS_ROLE
- Role resolution working correctly

---

## 🚀 Deployment Order

Follow this sequence for safe deployment:

### Phase 1: ✅ **COMPLETED**
- [x] Created RBAC documentation
- [x] Migrated 6 users to HAS_ROLE pattern
- [x] Upgraded login API to use `_hera_resolve_org_role`
- [x] Verified API upgrade working in production

### Phase 2: ⏳ **PENDING USER ACTION**
- [ ] Deploy `fix_hera_auth_introspect_v1_type_casting.sql` to Supabase
- [ ] Run `test-introspect-v2.mjs` to verify deployment
- [ ] Document successful deployment

### Phase 3: 📅 **FUTURE (OPTIONAL)**
- [ ] Assign roles to remaining 23 users
- [ ] (Optional) Migrate API to use `hera_auth_introspect_v1` for single-call auth
- [ ] Add caching layer for role resolution

---

## 🛡️ Rollback Plan

If any issues occur after deploying `hera_auth_introspect_v1`:

### Option 1: Do Nothing
**Current API doesn't use introspect function, so no impact to production**
- `/api/v2/auth/resolve-membership` uses `_hera_resolve_org_role` (working)
- Frontend continues to work normally

### Option 2: Drop Function
```sql
-- Only if causing issues
DROP FUNCTION IF EXISTS public.hera_auth_introspect_v1(uuid);
```

**Risk Level:** ⚠️ **LOW** - Function not used in production yet

---

## 📊 Current System State

### Users with HAS_ROLE (6 users)
1. ✅ `d6118aa6` - PLATFORM_ADMIN
2. ✅ `09b0b92a` - ORG_OWNER
3. ✅ `3ced4979` - ORG_OWNER
4. ✅ `5ac911a5` - ORG_OWNER
5. ✅ `4578ce6d` - ORG_EMPLOYEE
6. ✅ `b3fcd455` - ORG_EMPLOYEE

### Users Without Roles (23 users)
**Status:** Using MEMBER_OF fallback mechanism (working)

**To Assign Roles:**
```typescript
await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: userId,
  p_organization_id: orgId,
  p_actor_user_id: adminId,
  p_role: 'member' // or appropriate role
})
```

---

## 🎯 Success Criteria

**Phase 1 (Current):** ✅ **ACHIEVED**
- [x] Login API using modern RPC pattern
- [x] Role precedence working correctly
- [x] Backward compatibility maintained
- [x] Complete documentation delivered

**Phase 2 (Pending Deployment):** ⏳ **READY**
- [ ] `hera_auth_introspect_v1` deployable via PostgREST
- [ ] Type casting fix verified
- [ ] No regression in production

**Phase 3 (Future):** 📅 **PLANNED**
- [ ] All users have explicit HAS_ROLE relationships
- [ ] (Optional) Single-call authentication via introspect
- [ ] Performance optimizations (caching)

---

## 📞 Support & Troubleshooting

### Issue: "polymorphic type" error after deployment
**Solution:** Verify all `to_jsonb()` casts are present in deployed function

### Issue: User role not updating after assignment
**Solution:** Clear localStorage cache: `localStorage.clear()`

### Issue: API returns 404 "no_membership"
**Solution:** User needs MEMBER_OF relationship via `hera_onboard_user_v1`

### Issue: Wrong role displayed
**Solution:** Check `is_primary` flag in HAS_ROLE relationships

---

## 🔗 Related Files

**API Route (Production):**
- `/src/app/api/v2/auth/resolve-membership/route.ts` - Upgraded API route

**Frontend (No Changes Needed):**
- `/src/app/salon-access/page.tsx` - Login page (backward compatible)

**Database Functions (Supabase):**
- `_hera_role_rank(text)` - Helper function
- `_hera_resolve_org_role(uuid, uuid)` - Used in production
- `hera_auth_introspect_v1(uuid)` - Pending deployment fix
- `hera_onboard_user_v1(uuid, uuid, uuid, text)` - User onboarding

---

## ✅ Final Checklist

Before marking this work as complete:

- [x] ✅ RBAC user documentation created
- [x] ✅ Migration executed (6 users to HAS_ROLE)
- [x] ✅ Login API upgraded to modern RPC
- [x] ✅ API upgrade tested and verified
- [x] ✅ Type casting fix reviewed and approved
- [x] ✅ Deployment SQL file created
- [x] ✅ Test scripts ready
- [x] ✅ Comprehensive documentation delivered
- [ ] ⏳ User deploys `fix_hera_auth_introspect_v1_type_casting.sql`
- [ ] ⏳ User runs `test-introspect-v2.mjs` verification

---

**Session Completed By:** Claude Code (MCP Server)
**Date:** 2025-10-27
**Overall Status:** ✅ **PRODUCTION READY - PENDING USER DEPLOYMENT**

**Next Action:** User should deploy the SQL migration to Supabase and run verification tests.
