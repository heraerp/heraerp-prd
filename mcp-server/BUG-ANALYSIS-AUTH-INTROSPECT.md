# Bug Analysis: hera_auth_introspect_v1

**Date:** 2025-10-30
**Status:** ❌ IDENTIFIED - Data Quality Issue
**Priority:** HIGH

---

## 🐛 Error Message

```
more than one row returned by a subquery used as an expression
```

---

## 🔍 Root Cause

**Data Quality Issue:** User has **duplicate MEMBER_OF relationships** to the same organization.

**Diagnostic Results:**
```
User ID: 09b0b92a-d797-489e-bc03-5ca0a6272674 (michele)
Organization: 378f24fb-d496-4ff7-8afa-ea34895a0eb8 (Hairtalkz)

MEMBER_OF Relationships Found: 2 (DUPLICATE!)
1. Org ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8, Active: true
2. Org ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8, Active: true  ❌ DUPLICATE

HAS_ROLE Relationships Found: 1 (correct)
1. Org ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
   Role: ORG_OWNER
   is_primary: true
```

---

## 🎯 Impact

**Affected Operations:**
- ❌ `hera_auth_introspect_v1` - Cannot get user context
- ❌ User authentication flow - Blocks login introspection
- ❌ Organization app listing - Depends on introspection

**Workaround in Production:**
The `/salon-access` page uses `/api/v2/auth/resolve-membership` API endpoint which likely has better duplicate handling, so the login page is working despite this RPC failure.

---

## ✅ Solutions

### Solution 1: Fix Data (Quick Fix - Recommended)

**Delete the duplicate MEMBER_OF relationship:**

```sql
-- Find duplicates
SELECT
  from_entity_id,
  to_entity_id,
  organization_id,
  relationship_type,
  COUNT(*) as count,
  array_agg(id) as relationship_ids
FROM core_relationships
WHERE relationship_type = 'MEMBER_OF'
  AND from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid
GROUP BY from_entity_id, to_entity_id, organization_id, relationship_type
HAVING COUNT(*) > 1;

-- Keep the newest, delete the older one(s)
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY from_entity_id, to_entity_id, organization_id, relationship_type
      ORDER BY created_at DESC
    ) as rn
  FROM core_relationships
  WHERE relationship_type = 'MEMBER_OF'
    AND from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid
    AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
)
DELETE FROM core_relationships
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verify fix
SELECT COUNT(*) as member_of_count
FROM core_relationships
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid
  AND relationship_type = 'MEMBER_OF'
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid;
-- Expected: 1
```

---

### Solution 2: Make RPC Resilient (Long-term Fix)

**Update the RPC to handle duplicates with DISTINCT:**

```sql
-- In hera_auth_introspect_v1_FINAL.sql
-- Line ~30-38, change:

WITH memberships AS (
  SELECT DISTINCT ON (organization_id)  -- 🔧 ADD DISTINCT ON
    cr.organization_id,
    cr.created_at AS joined_at,
    cr.updated_at AS last_updated
  FROM public.core_relationships cr
  WHERE cr.relationship_type = 'MEMBER_OF'
    AND COALESCE(cr.is_active, true)
    AND cr.from_entity_id = p_actor_user_id
  ORDER BY cr.organization_id, cr.created_at DESC  -- 🔧 Keep newest
)
```

---

### Solution 3: Add Database Constraint (Preventive)

**Prevent future duplicates:**

```sql
-- Create unique index to prevent duplicate MEMBER_OF relationships
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_member_of_relationship
ON core_relationships (from_entity_id, organization_id, relationship_type)
WHERE relationship_type = 'MEMBER_OF'
  AND COALESCE(is_active, true);

COMMENT ON INDEX idx_unique_member_of_relationship IS
  'Prevents duplicate MEMBER_OF relationships for the same user-org pair.
   Only enforced for active relationships.';
```

---

## 🧪 Testing After Fix

### Test 1: Data Cleanup Verification
```bash
node -e "
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', '09b0b92a-d797-489e-bc03-5ca0a6272674')
  .eq('relationship_type', 'MEMBER_OF')
  .eq('organization_id', '378f24fb-d496-4ff7-8afa-ea34895a0eb8');

console.log('MEMBER_OF relationships:', data?.length || 0);
console.log('Expected: 1');
console.log('Status:', data?.length === 1 ? '✅ FIXED' : '❌ STILL DUPLICATE');
"
```

### Test 2: RPC Function Test
```bash
node -e "
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
});

if (error) {
  console.log('❌ FAIL:', error.message);
} else {
  console.log('✅ PASS: hera_auth_introspect_v1');
  console.log('Organizations:', data.organization_count);
  console.log('Default Org:', data.default_organization_id);
}
"
```

### Test 3: Full Test Suite
```bash
cd /home/san/PRD/heraerp-dev/mcp-server
node test-app-management-rpcs-v2.mjs
```

**Expected Results After Fix:**
- ✅ `hera_auth_introspect_v1` - Should PASS
- ✅ Test suite: 7/8 passing (up from 6/8)
- ✅ Only remaining failure: `hera_organizations_crud_v1` READ action

---

## 📊 How Did This Happen?

**Likely Causes:**
1. **Migration script ran multiple times** - MEMBER_OF relationships created twice
2. **Manual data entry** - Duplicate INSERT statements
3. **Code bug** - Application logic creating duplicate relationships
4. **Race condition** - Concurrent relationship creation

**Prevention:**
- ✅ Add unique constraint (Solution 3)
- ✅ Make RPC resilient with DISTINCT (Solution 2)
- ✅ Clean up existing duplicates (Solution 1)

---

## 🎯 Recommended Action Plan

### Immediate (30 minutes)
1. ✅ **Delete duplicate relationship** (Solution 1)
2. ✅ **Test RPC function** (Test 2)
3. ✅ **Run full test suite** (Test 3)

### Short-term (1 hour)
4. ✅ **Add unique constraint** (Solution 3 - prevents future duplicates)
5. ✅ **Check for other duplicate relationships** (scan entire table)

### Long-term (Optional)
6. ✅ **Update RPC with DISTINCT** (Solution 2 - defense in depth)
7. ✅ **Add data quality monitoring** (alert on duplicates)

---

## 📁 Related Files

**RPC Source:**
- `/db/rpc/hera_auth_introspect_v1_FINAL.sql`
- `/db/migrations/fix_hera_auth_introspect_v1_type_casting.sql`

**Test Suite:**
- `/mcp-server/test-app-management-rpcs-v2.mjs`

**Diagnosis Script:**
- `/mcp-server/BUG-ANALYSIS-AUTH-INTROSPECT.md` (this file)

**API Endpoint (working workaround):**
- `/src/app/api/v2/auth/resolve-membership/route.ts`

---

## ✅ Success Criteria

- [ ] No duplicate MEMBER_OF relationships for any user
- [ ] `hera_auth_introspect_v1` RPC passes for all users
- [ ] Unique constraint prevents future duplicates
- [ ] Full test suite at 7/8 passing (87.5%)

---

**Status:** Ready for cleanup and testing
**Priority:** HIGH (blocks auth introspection)
**Estimated Fix Time:** 30 minutes
