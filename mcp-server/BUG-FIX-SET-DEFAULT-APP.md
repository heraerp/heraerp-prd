# Bug Fix: hera_org_set_default_app_v1 Smart Code Extraction

**Date:** 2025-10-30
**Priority:** HIGH
**Status:** ✅ FIX READY FOR DEPLOYMENT

---

## 🐛 Bug Description

**Error Message:**
```
APP smart_code segment 5 must match code "SALON"
```

**Root Cause:**
The `REGEXP_REPLACE` function was not correctly extracting segment 5 from the smart code pattern. The regex replacement was returning an empty string instead of the expected app code.

**Smart Code Format:**
```
HERA.PLATFORM.APP.ENTITY.SALON.v1
 1    2        3   4      5     6
```

Expected extraction: Segment 5 = `SALON`
Actual extraction: Empty string

---

## ✅ Solution

Replace `REGEXP_REPLACE` with `split_part` for reliable segment extraction.

**Before (Line 130 in original):**
```sql
REGEXP_REPLACE(v_app_sc, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1')
```

**After (Fixed):**
```sql
v_extracted_code := split_part(v_app_sc, '.', 5);
```

**Why This Works:**
- `split_part(string, delimiter, position)` splits the string on '.' and returns the 5th segment
- More straightforward than regex capture groups
- PostgreSQL built-in function with reliable behavior
- Matches the smart code structure exactly

---

## 📋 Deployment Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Navigate to Supabase SQL Editor:**
   ```
   https://ralywraqvuqgdezttfde.supabase.co/project/_/sql/new
   ```

2. **Copy the entire contents of:**
   ```
   /home/san/PRD/heraerp-dev/db/rpc/hera_org_set_default_app_v1_FIXED.sql
   ```

3. **Paste into SQL Editor and click "Run"**

4. **Verify success:**
   ```
   Expected: "Success. No rows returned"
   ```

### Option 2: Command Line (if psql configured)

```bash
cd /home/san/PRD/heraerp-dev
psql $DATABASE_URL < db/rpc/hera_org_set_default_app_v1_FIXED.sql
```

---

## 🧪 Testing

**After deployment, run the test suite:**
```bash
cd /home/san/PRD/heraerp-dev/mcp-server
node test-app-management-rpcs-v2.mjs
```

**Expected Results:**

**Before Fix:**
```
❌ FAIL hera_org_set_default_app_v1 - Set default app to SALON
   Error: APP smart_code segment 5 must match code "SALON"
```

**After Fix:**
```
✅ PASS hera_org_set_default_app_v1 - Set default app to SALON
   Result: {
     "action": "SET_DEFAULT_APP",
     "organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
     "old_default_app_code": null,
     "new_default_app_code": "SALON",
     "app": {
       "code": "SALON",
       "name": "HERA Salon Management",
       "smart_code": "HERA.PLATFORM.APP.ENTITY.SALON.v1"
     }
   }
```

---

## 📊 Impact Analysis

**Affected Operations:**
- ✅ Setting default app for organizations
- ✅ Auth introspection (depends on default app)
- ✅ User routing to default app dashboard

**Downstream Effects:**
- Unblocks `hera_auth_introspect_v1` testing
- Enables proper user onboarding flow
- Allows organization-level app preferences

**Test Coverage:**
- Current passing: 3/10 tests
- After fix: Expected 4/10 tests passing
- Remaining issues: Auth introspect (separate bug), Org CRUD READ action

---

## 🔍 Verification Steps

### 1. Verify Smart Code Extraction

```sql
-- Test the split_part extraction
SELECT
  smart_code,
  split_part(smart_code, '.', 5) AS extracted_code,
  entity_code,
  split_part(smart_code, '.', 5) = entity_code AS match
FROM core_entities
WHERE entity_type = 'APP' AND entity_code = 'SALON';

-- Expected result:
-- smart_code: HERA.PLATFORM.APP.ENTITY.SALON.v1
-- extracted_code: SALON
-- entity_code: SALON
-- match: true
```

### 2. Test Function Call

```sql
-- Set SALON as default app
SELECT hera_org_set_default_app_v1(
  '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,  -- michele user
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,  -- Hairtalkz org
  'SALON'
);

-- Should return success JSON without errors
```

### 3. Verify Settings Updated

```sql
-- Check organization settings
SELECT
  organization_name,
  settings->>'default_app_code' AS default_app
FROM core_organizations
WHERE id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid;

-- Expected: default_app = 'SALON'
```

---

## 📝 Related Issues

**Other Bugs Found:**
1. ✅ **hera_org_set_default_app_v1** - Smart code extraction (THIS FIX)
2. ⏳ **hera_auth_introspect_v1** - "more than one row returned by subquery" error
3. ⏳ **hera_organizations_crud_v1** - "Unsupported action: READ" error

**Next Steps:**
After deploying this fix, address the remaining two bugs to get full test suite passing.

---

## 📚 Files

**Fixed SQL:**
```
/home/san/PRD/heraerp-dev/db/rpc/hera_org_set_default_app_v1_FIXED.sql
```

**Test Suite:**
```
/home/san/PRD/heraerp-dev/mcp-server/test-app-management-rpcs-v2.mjs
```

**Debug Script:**
```
/home/san/PRD/heraerp-dev/mcp-server/debug-smart-code-regex.mjs
```

**Documentation:**
```
/home/san/PRD/heraerp-dev/docs/rpc/HERA-APP-MANAGEMENT-RPC-GUIDE.md
```

---

## ✅ Success Criteria

- [ ] SQL file deployed successfully to Supabase
- [ ] Test `hera_org_set_default_app_v1` passes
- [ ] Organization settings updated correctly
- [ ] No regression in other RPC functions
- [ ] Auth introspection includes default_app field

---

**Prepared By:** Claude Code
**Review Status:** Ready for deployment
**Risk Level:** LOW (Only changes extraction logic, no schema changes)
