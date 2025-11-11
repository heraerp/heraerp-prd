# 🔧 How to Apply hera_user_orgs_list_v1 Fix

## 📋 Current Status

**RPC Status**: ❌ Still using stub implementation (returns dummy data)
**Error**: `materialize mode required, but it is not allowed in this context`
**Fix Status**: ✅ SQL fix created, ready to apply

## 🚀 Steps to Apply Fix

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your HERA project

2. **Open SQL Editor**
   - Click on "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy and Execute SQL Fix**
   - Copy the entire contents of `fix-hera-user-orgs-list-v1.sql`
   - Paste into SQL editor
   - Click "Run" button

4. **Verify Success**
   - Should see: "Success. No rows returned"
   - Function comment should appear in database

### Option 2: Supabase CLI (Advanced)

```bash
# If you have Supabase CLI installed
supabase db reset --db-url "your-database-url"
# Or apply migration file directly
```

## 🧪 Testing After Application

### Step 1: Run Test Script

```bash
cd mcp-server
node test-fixed-user-orgs-list.mjs
```

### Expected Results After Fix:

✅ **Test 1: Fixed RPC works without errors**
- No materialization error
- Returns actual organization memberships
- Includes role, is_primary, last_accessed fields

✅ **Test 2: Comparison with direct query**
- RPC count matches direct query count
- Data consistency verified

✅ **Test 3: Edge case handling**
- Non-existent user returns empty array
- No errors thrown

## 📊 What the Fix Changes

### Before (Stub Implementation):
```sql
BEGIN
  RETURN QUERY
    SELECT
      gen_random_uuid() as id,
      'Demo Org'::text as name,
      'admin'::text as role,
      true as is_primary,
      now()::timestamptz as last_accessed
    LIMIT 1;
END;
```

**Issues**:
- Returns dummy data
- Not querying actual relationships
- Would fail with materialization error on complex queries

### After (Production Implementation):
```sql
BEGIN
  RETURN QUERY
  SELECT
    org.id,
    org.entity_name::text AS name,
    COALESCE(rel.relationship_data->>'role', 'member')::text AS role,
    COALESCE((rel.relationship_data->>'is_primary')::boolean, false) AS is_primary,
    COALESCE((rel.relationship_data->>'last_accessed')::timestamptz, rel.updated_at) AS last_accessed
  FROM core_relationships rel
  INNER JOIN core_entities org ON org.id = rel.to_entity_id
  WHERE rel.from_entity_id = p_user_id
    AND rel.relationship_type = 'USER_MEMBER_OF_ORG'
    AND rel.is_active = true
    AND org.entity_type = 'ORG'
  ORDER BY
    COALESCE((rel.relationship_data->>'is_primary')::boolean, false) DESC,
    COALESCE((rel.relationship_data->>'last_accessed')::timestamptz, rel.updated_at) DESC,
    org.entity_name;
END;
```

**Improvements**:
✅ Queries actual core_relationships data
✅ Returns real organization memberships
✅ Extracts role/primary/last_accessed from relationship_data JSONB
✅ Properly ordered (primary first, then by last accessed)
✅ No materialization issues (simple INNER JOIN)

## 🎯 Success Criteria

After applying the fix, you should see:

1. **No Errors**: Test script runs without materialization error
2. **Actual Data**: Returns real organization memberships (not dummy data)
3. **Correct Fields**: Includes id, name, role, is_primary, last_accessed
4. **Proper Ordering**: Primary org first, then by last accessed time
5. **Edge Cases**: Non-existent user returns empty array without error

## 📁 Related Files

- **SQL Fix**: `fix-hera-user-orgs-list-v1.sql`
- **Test Script**: `test-fixed-user-orgs-list.mjs`
- **Purpose Documentation**: `RPC-PURPOSE-AND-DECISIONS.md`

## 🔮 Next Steps After Fix

Once this RPC is fixed and tested, we'll move to the next broken RPC:

**Candidates for next fix**:
1. `hera_user_remove_from_org_v1` - Missing metadata column
2. `hera_user_read_v1` - Missing metadata column

Or we may decide to **deprecate** these RPCs instead and use:
- `hera_entities_crud_v1` for user read operations
- Relationship deletion for removing users from orgs

---

**Generated**: 2025-11-07
**Status**: Ready to apply to database
**Action Required**: Manual SQL execution in Supabase Dashboard
