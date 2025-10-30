# 🚀 HERA Transaction Query Fix - Deployment Instructions

## 🐛 Issue Summary

**Problem:** Leave requests showing "Unknown" for staff names and "Not set" for dates.

**Root Cause:** The RPC function `hera_txn_query_v1` was only returning 8 fields instead of all transaction fields:
- ❌ Missing: `source_entity_id`, `target_entity_id`, `metadata`, `created_at`, `updated_at`, etc.
- ✅ Database has all data (verified)
- ❌ RPC function was selecting only subset of columns

**Solution:** Replace `hera_txn_query_v1` with full field projection.

---

## 📋 Deployment Steps

### Step 1: Open Supabase SQL Editor

1. Navigate to: https://supabase.com/dashboard/project/qqagokigwuujyeyrgdkq/sql
2. Click "New Query"

### Step 2: Paste SQL

Copy the entire contents of:
```
./fix-hera-txn-query-v1-full-projection.sql
```

Or use this direct SQL (already displayed above).

### Step 3: Execute

1. Click **"Run"** button
2. Wait for "Success. No rows returned" message

### Step 4: Verify Fix

Run verification script:
```bash
node verify-txn-query-fix.mjs
```

Expected output:
```
✅ SUCCESS! All required fields are now returned by hera_txn_query_v1
```

### Step 5: Test UI

1. Refresh leave management page
2. Verify:
   - ✅ Staff names display correctly (not "Unknown")
   - ✅ Dates display correctly (not "Not set")
   - ✅ Leave reasons display
   - ✅ Created/updated timestamps display

---

## 🔍 What Changed

### Before (8 fields only):
```json
{
  "id": "...",
  "smart_code": "...",
  "total_amount": 2,
  "organization_id": "...",
  "transaction_code": "...",
  "transaction_date": "...",
  "transaction_type": "LEAVE",
  "transaction_status": "submitted"
}
```

### After (35+ fields):
```json
{
  "id": "...",
  "organization_id": "...",
  "transaction_type": "LEAVE",
  "transaction_code": "...",
  "transaction_date": "...",
  "source_entity_id": "...",          // ✅ NOW INCLUDED
  "target_entity_id": "...",          // ✅ NOW INCLUDED
  "metadata": {                       // ✅ NOW INCLUDED
    "leave_type": "ANNUAL",
    "start_date": "2025-10-30",
    "end_date": "2025-10-31",
    "reason": "Family commitment...",
    "total_days": 2
  },
  "created_at": "...",                // ✅ NOW INCLUDED
  "updated_at": "...",                // ✅ NOW INCLUDED
  "created_by": "...",                // ✅ NOW INCLUDED
  "updated_by": "...",                // ✅ NOW INCLUDED
  "business_context": {...},         // ✅ NOW INCLUDED
  // ... 20+ more enterprise fields
}
```

---

## 🛡️ Safety & Impact

✅ **Zero Breaking Changes**
- Same function signature: `hera_txn_query_v1(p_org_id uuid, p_filters jsonb)`
- Same response structure: `{ success, action, data: { items, limit, offset, total } }`
- Backwards compatible: Existing code continues to work

✅ **No Changes Needed to Other Code**
- `hera_txn_crud_v1` - No changes required (just relays payload)
- `useUniversalTransactionV1` - No changes required (already handles all fields)
- `useHeraLeave` - No changes required (already transforms all fields)

✅ **Security Maintained**
- `SECURITY DEFINER` with locked `search_path`
- Organization isolation enforced
- Proper GRANT/REVOKE patterns

✅ **Performance Optimized**
- Single CTE for count
- Single CTE for page
- Proper pagination with LIMIT/OFFSET
- ORDER BY for consistent results

---

## ✅ Success Criteria

After deployment, verify:

1. **RPC Returns Full Data**
   ```bash
   node test-rpc-query.mjs
   ```
   Should show: `Has metadata: ✅`, `Has source_entity_id: ✅`, etc.

2. **Verification Script Passes**
   ```bash
   node verify-txn-query-fix.mjs
   ```
   Should show: `✅ SUCCESS! All required fields are now returned`

3. **UI Displays Correctly**
   - Staff names: Real names (not "Unknown")
   - Dates: Actual dates (not "Not set")
   - Reasons: Leave request text
   - Timestamps: Created/updated times

---

## 🔄 Rollback (If Needed)

If any issues occur, you can rollback by running the old version (contact me for the SQL).

However, this is **extremely unlikely** as:
- Same function signature
- Same response structure
- Only **adding** fields, not removing or changing existing ones

---

## 📞 Support

If deployment encounters issues:
1. Check Supabase SQL Editor for error messages
2. Run `node verify-txn-query-fix.mjs` for diagnostics
3. Check browser console for frontend errors
4. Verify organization ID is correct: `378f24fb-d496-4ff7-8afa-ea34895a0eb8`

---

**Deployment Time:** ~30 seconds
**Downtime:** Zero (hot replacement)
**Risk Level:** Very Low (additive change only)
**Rollback Available:** Yes (if needed)
