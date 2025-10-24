# Staff Relationship Smart Code Fix - Complete Solution

## 🎯 Problem Summary

Staff creation fails with NULL smart_code constraint violation when creating relationships:
```
null value in column "smart_code" of relation "core_relationships" violates not-null constraint
```

**Root Cause:** The RPC function `hera_entities_crud_v1` doesn't have access to the relationship preset definitions (those are frontend-only), so it can't look up smart_codes for relationship types.

---

## 🔍 Root Cause Chain

1. **Frontend** (`useHeraStaff.ts`): Creates staff with relationship `STAFF_HAS_ROLE`
2. **Middleware** (`useUniversalEntityV1.ts`): Passes relationships as `{ STAFF_HAS_ROLE: [role_uuid] }`
3. **RPC** (`hera_entities_crud_v1`): Tries to create relationship but `v_relationship_smart_code` is NULL
4. **Database**: `hera_relationship_upsert_v1` receives NULL smart_code → constraint violation

The issue is that the RPC doesn't know what smart_code to use for `STAFF_HAS_ROLE` relationship type.

---

## ✅ Complete Fix (3 Parts)

### Part 1: Frontend - Match Relationship Type Names ✅ DONE

**File:** `/src/hooks/useHeraStaff.ts` (Lines 138, 183)

**Issue:** Using `HAS_ROLE` but preset defines `STAFF_HAS_ROLE`

**Fix:**
```typescript
// Before
relationships.HAS_ROLE = [data.role_id]

// After
relationships.STAFF_HAS_ROLE = [data.role_id]  // ✅ Match preset
```

### Part 2: Frontend - Pass Smart Code Map ✅ DONE

**File:** `/src/hooks/useUniversalEntityV1.ts`

**Changes:**

1. **Update `transformRelationshipsToFlatFormat` function** (Line 176):
```typescript
/**
 * ✅ FIX: Transform relationships with smart_code_map
 */
function transformRelationshipsToFlatFormat(
  relationships: Record<string, string[]> | undefined,
  relationshipDefs?: RelationshipDef[]
): { relationships: Record<string, string[]>, smart_code_map: Record<string, string> } {
  if (!relationships || !relationshipDefs) {
    return { relationships: {}, smart_code_map: {} }
  }

  const smart_code_map: Record<string, string> = {}

  // Build smart_code_map from relationship definitions
  Object.keys(relationships).forEach(relType => {
    const relDef = relationshipDefs.find(r => r.type === relType)
    if (relDef) {
      smart_code_map[relType] = relDef.smart_code
    }
  })

  return {
    relationships,
    smart_code_map
  }
}
```

2. **Update CREATE mutation** (Line 533):
```typescript
// Extract both relationships and smart_code_map
const { relationships: p_relationships, smart_code_map } = transformRelationshipsToFlatFormat(
  entity.relationships,
  config.relationships
)

// Pass smart_code_map in p_options
p_options: {
  include_dynamic: true,
  include_relationships: true,
  relationships_mode: 'UPSERT',
  relationship_smart_code_map: smart_code_map  // ✅ NEW
}
```

3. **Update UPDATE mutation** (Line 809):
```typescript
// Same pattern for UPDATE
const { relationships: p_relationships, smart_code_map } = transformRelationshipsToFlatFormat(
  relationships_patch,
  config.relationships
)

p_options: {
  include_dynamic: true,
  include_relationships: true,
  relationships_mode: 'REPLACE',
  relationship_smart_code_map: smart_code_map  // ✅ NEW
}
```

### Part 3: Database RPC - Extract Smart Code from Map ⏳ TODO

**File:** Database function `hera_entities_crud_v1`

**Change Required:**

Inside the relationships processing loop (around line 268), add smart_code extraction:

```sql
-- Old code (line 17):
v_relationship_smart_code text := NULLIF(p_options->>'relationship_smart_code','');

-- Change to (line 17):
v_relationship_smart_code text := NULL;  -- Will be set per relationship type

-- Inside FOREACH k IN ARRAY v_rel_types LOOP (after line 268):
-- ADD THIS LINE:
v_relationship_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');
```

**Complete fixed loop:**
```sql
FOREACH k IN ARRAY v_rel_types LOOP
  -- ✅ FIX: Extract smart_code per relationship type from map
  v_relationship_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');

  IF v_relationships_mode='UPSERT' THEN
    FOR t_to IN SELECT value::uuid FROM jsonb_array_elements_text(coalesce(p_relationships->k,'[]'::jsonb))
    LOOP
      PERFORM public.hera_relationship_upsert_v1(
        p_organization_id, v_entity_id, t_to, k,
        v_relationship_smart_code,  -- Now has correct value!
        'forward', 1.0,
        '{}'::jsonb, 'DRAFT', 0.0, NULL,
        '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
        true, now(), NULL, v_effective_actor
      );
    END LOOP;
  ELSE
    -- REPLACE mode (same fix)
    -- ...
  END IF;
END LOOP;
```

---

## 📋 Testing

### Test Script

Run the test to verify the fix:
```bash
node scripts/test-staff-relationship-smart-codes.mjs
```

**Expected Output:**
```
✅ Test 1 PASSED: No RPC error
✅ Test 2 PASSED: success = true
✅ Test 3 PASSED: entity_id = [uuid]
✅ Test 4 PASSED: Entity object returned
✅ Test 5 PASSED: entity_name = "Test Staff Member"
✅ Test 6 PASSED: dynamic_data array with 3 fields
✅ Test 7 PASSED: relationships array with 1 items
✅ Test 8 PASSED: STAFF_HAS_ROLE relationship exists
✅ Test 9 PASSED: Relationship smart_code = HERA.SALON.STAFF.REL.HAS_ROLE.v1
✅ Test 10 PASSED: smart_code matches expected pattern

✅✅✅ ALL TESTS PASSED ✅✅✅
```

### Current Test Results (Before Part 3)

```
❌ Test 2 FAILED: success !== true
   Error: null value in column "smart_code" violates not-null constraint
```

This confirms that Parts 1 & 2 are complete, but Part 3 (RPC fix) is still needed.

---

## 🚀 Deployment Steps

### Step 1: Verify Frontend Changes ✅ DONE
- `useHeraStaff.ts` updated (Lines 138, 183)
- `useUniversalEntityV1.ts` updated (Lines 176-206, 533-589, 809-833)

### Step 2: Apply Database Fix ⏳ TODO

1. Open Supabase SQL Editor
2. Copy the fixed function from `/db/migrations/apply_relationship_smart_code_map_fix.sql`
3. Execute the SQL
4. Verify function updated successfully

### Step 3: Test Staff Creation ⏳ TODO

1. Run test script: `node scripts/test-staff-relationship-smart-codes.mjs`
2. Verify all 10 tests pass
3. Test in UI: Create staff with role assignment
4. Verify no NULL smart_code errors

---

## 📊 Data Flow (After Fix)

**Frontend → RPC → Database:**

```javascript
// 1. useHeraStaff.ts:138
createStaff({ role_id: 'uuid' })
  relationships: { STAFF_HAS_ROLE: ['uuid'] }

// 2. useUniversalEntityV1.ts:533
transformRelationshipsToFlatFormat(relationships, relationshipDefs)
  →  {
      relationships: { STAFF_HAS_ROLE: ['uuid'] },
      smart_code_map: { STAFF_HAS_ROLE: 'HERA.SALON.STAFF.REL.HAS_ROLE.v1' }
    }

// 3. RPC Payload
p_relationships: { STAFF_HAS_ROLE: ['uuid'] }
p_options: {
  relationship_smart_code_map: {
    STAFF_HAS_ROLE: 'HERA.SALON.STAFF.REL.HAS_ROLE.v1'
  }
}

// 4. RPC (hera_entities_crud_v1) - Inside loop
FOREACH k IN ARRAY ['STAFF_HAS_ROLE'] LOOP
  v_relationship_smart_code := p_options->'relationship_smart_code_map'->>'STAFF_HAS_ROLE'
  -- v_relationship_smart_code = 'HERA.SALON.STAFF.REL.HAS_ROLE.v1' ✅

  -- Call hera_relationship_upsert_v1 with smart_code
  PERFORM hera_relationship_upsert_v1(..., v_relationship_smart_code, ...)
END LOOP

// 5. Database
INSERT INTO core_relationships (..., smart_code, ...)
VALUES (..., 'HERA.SALON.STAFF.REL.HAS_ROLE.v1', ...)  -- ✅ No NULL!
```

---

## 🎓 Key Learnings

1. **Frontend presets don't reach the database** - RPC functions need explicit smart_code passing
2. **Relationship types must match preset definitions exactly** - `HAS_ROLE` ≠ `STAFF_HAS_ROLE`
3. **One smart_code per relationship type** - Can't use a single value for all relationship types
4. **Test RPC directly** - Use test scripts to validate RPC behavior before UI testing
5. **Map vs single value** - `relationship_smart_code_map` object > `relationship_smart_code` string

---

## ✅ Success Criteria

After applying all 3 parts:

- [ ] Test script passes all 10 tests
- [ ] Staff creation works in UI without errors
- [ ] Relationships created with correct smart_codes
- [ ] No NULL constraint violations in logs
- [ ] Other relationship types still work (CUSTOMER, BRANCH, etc.)

---

## 📝 Files Modified

### Frontend
1. `/src/hooks/useHeraStaff.ts` - Relationship type names fixed
2. `/src/hooks/useUniversalEntityV1.ts` - Smart code map generation and passing

### Database (TODO)
1. `hera_entities_crud_v1` function - Extract smart_code per relationship type

### Test Scripts
1. `/scripts/test-staff-relationship-smart-codes.mjs` - Validation test

### Documentation
1. `/db/migrations/fix_relationship_smart_code_map.sql` - Explanation
2. `/db/migrations/apply_relationship_smart_code_map_fix.sql` - Full SQL fix
3. `/STAFF_RELATIONSHIP_SMART_CODE_FIX.md` - This document

---

**STATUS:** Parts 1 & 2 complete (frontend). Part 3 (RPC) ready to apply.
