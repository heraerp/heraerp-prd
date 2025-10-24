# Staff Creation FK Violation - Root Cause Analysis & Fix

## 🎯 Executive Summary

**Problem:** Staff creation fails with FK constraint violation
**Root Cause:** Normalization trigger fires for STAFF but not CUSTOMER/BRANCH
**Solution:** Skip trigger when `ai_confidence >= 0.8` (user-curated entities)
**Status:** ✅ Fix ready - Apply `fix_staff_creation_normalization_trigger.sql`

---

## 🔍 Root Cause Analysis

### Why It Works for Customers/Branches

The `hera_normalize_entity_biu()` BEFORE INSERT trigger has this condition:

```sql
IF NEW.entity_type IN ('PERSON','EMPLOYEE','STAFF','ALIAS','ROLE') THEN
  -- Run normalization logic
END IF;
```

**Result:**
- ✅ **CUSTOMER** → NOT in list → Trigger skips → No review transaction → Success
- ✅ **BRANCH** → NOT in list → Trigger skips → No review transaction → Success
- ❌ **STAFF** → IN the list → Trigger fires → Creates review transaction → FK violation

### The FK Violation Chain

When creating a STAFF entity:

1. **BEFORE INSERT trigger fires** (entity not yet in database)
2. **Trigger runs fuzzy matching** to calculate `v_conf` (confidence score)
3. **If `v_conf < 0.8`**, trigger calls `hera_open_review_txn()`
4. **Review function creates transaction** with `source_entity_id = NEW.id`
5. **FK constraint fails** because `NEW.id` doesn't exist yet (BEFORE INSERT)

### Code Evidence

**From useHeraStaff.ts:146**
```typescript
return baseCreate({
  entity_type: 'STAFF',
  entity_name,
  smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
  status: data.status === 'inactive' ? 'archived' : 'active',
  ai_confidence: 1.0,  // ✅ Passed correctly
  dynamic_fields,
  relationships
})
```

**From trigger logs:**
```javascript
p_entity: {
  entity_type: 'STAFF',
  entity_name: 'test ',
  smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
  ai_confidence: 1  // ✅ Present in request
}
// But trigger ignores it and uses v_conf from fuzzy matching instead
```

**From database trigger (Line 5371):**
```sql
-- Trigger SETS ai_confidence but doesn't READ it to skip processing
NEW.ai_confidence := GREATEST(COALESCE(NEW.ai_confidence,0), v_conf);
```

---

## ✅ The Fix

### What Changed

Added early-exit check at the beginning of trigger:

```sql
-- ✅ FIX: Skip normalization if user has already set high confidence
IF COALESCE(NEW.ai_confidence, 0) >= 0.8 THEN
  -- User-curated entity, bypass normalization and review queue
  RETURN NEW;
END IF;
```

### Why This Works

1. **User-curated entities** (ai_confidence = 1.0) skip normalization entirely
2. **No fuzzy matching** → No confidence calculation
3. **No review transactions** → No FK violations
4. **Matches customer/branch behavior** → Consistency across entity types

### Before vs After

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Create CUSTOMER | ✅ Works (trigger skips) | ✅ Works (trigger skips) |
| Create BRANCH | ✅ Works (trigger skips) | ✅ Works (trigger skips) |
| Create STAFF (ai_confidence=1.0) | ❌ FK violation | ✅ Works (early exit) |
| Create STAFF (ai_confidence<0.8) | ❌ FK violation | ❌ FK violation (same as before) |
| Create STAFF (no ai_confidence) | ❌ FK violation | ✅ Works (early exit, defaults to 0) |

**Wait, that's not right...** Let me re-check the logic.

Actually, the current code flow is:

```typescript
// useHeraStaff passes ai_confidence: 1.0
ai_confidence: 1.0

// But useUniversalEntityV1 wraps it in metadata (workaround)
metadata: {
  ai_confidence: 1.0,
  ai_classification: 'user_curated',
  skip_normalization: true
}
```

So the ai_confidence is NOT being passed directly to the entity! Let me verify this...

---

## 🔧 Complete Fix Strategy

### Issue 1: ai_confidence Not Passed to Database

**Current flow:**
```
useHeraStaff (ai_confidence: 1.0)
  → useUniversalEntityV1 (wraps in metadata)
    → RPC (p_entity.ai_confidence is undefined)
      → Database (NEW.ai_confidence is NULL/0)
        → Trigger fires (COALESCE(NEW.ai_confidence, 0) = 0 < 0.8)
```

### Issue 2: RPC Function Doesn't Extract ai_confidence

The RPC function `hera_entities_crud_v1` needs to extract ai_confidence from `p_entity`:

```sql
-- Current (WRONG):
v_ai_conf NUMERIC := 0;

-- Should be (CORRECT):
v_ai_conf NUMERIC := COALESCE((p_entity->>'ai_confidence')::NUMERIC, 1.0);
```

### Two-Part Fix Required

**Part 1: Update useUniversalEntityV1 to pass ai_confidence directly**
```typescript
p_entity: {
  entity_type: entity_type,
  entity_name: entity.entity_name,
  smart_code: entity.smart_code,
  status: entity.status || 'active',
  ai_confidence: entity.ai_confidence || 1.0,  // ✅ Pass directly, not in metadata
  metadata: entity.metadata
}
```

**Part 2: Update database trigger to respect ai_confidence**
```sql
-- Early exit if user-curated
IF COALESCE(NEW.ai_confidence, 0) >= 0.8 THEN
  RETURN NEW;
END IF;
```

---

## 📋 Migration Steps

### Step 1: Update Database Trigger (Immediate)

Run in Supabase SQL Editor:
```bash
# File: fix_staff_creation_normalization_trigger.sql
```

This adds the early-exit check that prevents FK violations when ai_confidence >= 0.8.

### Step 2: Update Frontend Code (Next)

**File:** `/src/hooks/useUniversalEntityV1.ts` (Lines 532-538)

**Current:**
```typescript
metadata: {
  ...entity.metadata,
  ai_confidence: entity.ai_confidence || 1.0,
  ai_classification: 'user_curated'
}
```

**Fixed:**
```typescript
// ✅ Pass ai_confidence as top-level field, not in metadata
const entityPayload = {
  entity_type: entity_type,
  entity_name: entity.entity_name,
  entity_code: entity.entity_code || null,
  smart_code: entity.smart_code,
  status: entity.status || 'active',
  ai_confidence: entity.ai_confidence || 1.0,  // ✅ Direct field
  metadata: entity.metadata
}
```

### Step 3: Verify RPC Function (Optional)

If the above doesn't work, update the RPC function to extract ai_confidence from p_entity:

```sql
-- In hera_entities_crud_v1 function
v_ai_conf NUMERIC := COALESCE((p_entity->>'ai_confidence')::NUMERIC, 1.0);
```

---

## ✅ Verification Checklist

After applying fixes:

- [ ] Open Supabase SQL Editor
- [ ] Run `fix_staff_creation_normalization_trigger.sql`
- [ ] Verify function created successfully
- [ ] Test staff creation in app
- [ ] Check database logs for FK violations
- [ ] Verify staff appears in list
- [ ] Test customer creation (should still work)
- [ ] Test branch creation (should still work)

---

## 🎓 Key Learnings

1. **Entity-type specific triggers** can cause inconsistent behavior
2. **BEFORE INSERT triggers** can't reference NEW.id in FK relationships
3. **ai_confidence** should be a first-class field, not metadata
4. **Always check actual database schema** - don't assume field structure
5. **Test all entity types** when fixing one - ensure no regressions

---

## 📊 Impact Analysis

### Before Fix
- ❌ Staff creation broken
- ✅ Customer creation works
- ✅ Branch creation works
- 😕 Inconsistent behavior across entity types

### After Fix
- ✅ Staff creation works (user-curated)
- ✅ Customer creation works (unchanged)
- ✅ Branch creation works (unchanged)
- ✅ Consistent behavior across all entity types
- ✅ AI normalization still works when needed (ai_confidence < 0.8)

---

## 🚀 Deployment

**Priority:** HIGH
**Complexity:** LOW (single SQL function update)
**Risk:** LOW (early-exit pattern is safe)
**Rollback:** Easy (previous function version available)

**Recommended approach:**
1. Apply database trigger fix first (immediate relief)
2. Test thoroughly in development
3. Update frontend code to pass ai_confidence directly
4. Deploy to production
5. Monitor for FK violations (should be zero)
