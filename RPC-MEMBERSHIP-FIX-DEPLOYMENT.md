# RPC Membership Check Fix - Deployment Guide

## 🎯 Root Cause Identified

The `HERA_ACTOR_NOT_MEMBER` error occurs because:

1. **User has MEMBER_OF relationship** pointing to entity `c0771739-ddb6-47fb-ae82-d34febedf098` (entity_type: `ORGANIZATION`)
2. **RPC function expects** relationship pointing to `378f24fb-d496-4ff7-8afa-ea34895a0eb8` (the `organization_id` from `core_organizations`)
3. **Both entities represent the same organization** (Hairtalkz) but have different entity types:
   - `378f24fb-d496-4ff7-8afa-ea34895a0eb8` → entity_type: `ORG`
   - `c0771739-ddb6-47fb-ae82-d34febedf098` → entity_type: `ORGANIZATION`

## ✅ Solution Implemented

Updated the RPC membership check to handle both entity types by joining with `core_entities` table.

### Original Code (Lines 111-120):
```sql
IF NOT EXISTS (
  SELECT 1 FROM core_relationships
   WHERE organization_id = p_organization_id
     AND from_entity_id  = p_actor_user_id
     AND to_entity_id    = p_organization_id  -- ❌ Too strict - only checks org_id
     AND relationship_type = 'MEMBER_OF'
     AND is_active = true
) THEN
  RAISE EXCEPTION 'HERA_ACTOR_NOT_MEMBER';
END IF;
```

### Fixed Code (Lines 111-124):
```sql
-- ✅ FIXED: Check for MEMBER_OF relationship to ORGANIZATION entity
-- The to_entity_id might be an ORGANIZATION entity (not the org_id itself)
IF NOT EXISTS (
  SELECT 1 FROM core_relationships cr
  INNER JOIN core_entities ce ON ce.id = cr.to_entity_id
   WHERE cr.organization_id = p_organization_id
     AND cr.from_entity_id  = p_actor_user_id
     AND cr.relationship_type = 'MEMBER_OF'
     AND cr.is_active = true
     AND ce.entity_type IN ('ORG', 'ORGANIZATION')  -- ✅ Handles both types
     AND ce.organization_id = p_organization_id      -- ✅ Validates correct org
) THEN
  RAISE EXCEPTION 'HERA_ACTOR_NOT_MEMBER';
END IF;
```

## 📋 Deployment Steps

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and Execute**
   - Copy the entire contents of `hera_entities_crud_v1_fixed.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify Deployment**
   - You should see: "Success. No rows returned"
   - Function is now updated

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset --db-url "postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres"

# Or apply migration directly
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres" < hera_entities_crud_v1_fixed.sql
```

### Option 3: Database Client (pgAdmin, DBeaver, etc.)

1. Connect to your Supabase database
2. Open the query editor
3. Copy contents of `hera_entities_crud_v1_fixed.sql`
4. Execute the SQL

## 🧪 Testing After Deployment

### Test 1: Verify the Function Update

```sql
-- Check function definition includes the fix
SELECT pg_get_functiondef('hera_entities_crud_v1'::regproc);
```

Look for the INNER JOIN with `core_entities` in the membership check.

### Test 2: Verify Membership Query Works

```sql
-- This query should now return 1 row (the MEMBER_OF relationship)
SELECT 1 FROM core_relationships cr
INNER JOIN core_entities ce ON ce.id = cr.to_entity_id
 WHERE cr.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
   AND cr.from_entity_id  = '001a2eb9-b14c-4dda-ae8c-595fb377a982'
   AND cr.relationship_type = 'MEMBER_OF'
   AND cr.is_active = true
   AND ce.entity_type IN ('ORG', 'ORGANIZATION')
   AND ce.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
```

Expected result: 1 row returned

### Test 3: Try Creating a Service

1. Refresh the browser to clear any cached errors
2. Navigate to `/salon/services`
3. Click "New Service"
4. Fill in service details:
   - Name: "Test Service"
   - Category: "Hair"
   - Price: 100
   - Duration: 60
5. Click "Save"

Expected result: ✅ Service created successfully, no `HERA_ACTOR_NOT_MEMBER` error

## 📊 What This Fix Does

### Before Fix:
```
RPC checks: to_entity_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' (ORG)
Database has: to_entity_id = 'c0771739-ddb6-47fb-ae82-d34febedf098' (ORGANIZATION)
Result: ❌ HERA_ACTOR_NOT_MEMBER error
```

### After Fix:
```
RPC checks:
  1. to_entity_id points to an entity with type 'ORG' or 'ORGANIZATION'
  2. That entity belongs to organization_id '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
Database has: to_entity_id = 'c0771739-ddb6-47fb-ae82-d34febedf098' (ORGANIZATION)
  - Entity type: ORGANIZATION ✅
  - organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8' ✅
Result: ✅ Membership validated successfully
```

## 🎯 Benefits of This Approach

1. **Flexible Entity Types**: Handles both `ORG` and `ORGANIZATION` entity types
2. **Maintains Security**: Still validates organization boundary
3. **No Data Migration**: Works with existing relationships
4. **Backward Compatible**: Still works if `to_entity_id = organization_id`
5. **Defense-in-Depth**: Keeps RPC-level membership validation for security

## 🔄 Rollback Plan (If Needed)

If this causes issues, you can rollback to the original check:

```sql
-- Rollback SQL (lines 111-120)
IF NOT EXISTS (
  SELECT 1 FROM core_relationships
   WHERE organization_id = p_organization_id
     AND from_entity_id  = p_actor_user_id
     AND to_entity_id    = p_organization_id
     AND relationship_type = 'MEMBER_OF'
     AND is_active = true
) THEN
  RAISE EXCEPTION 'HERA_ACTOR_NOT_MEMBER';
END IF;
```

But you'll need to fix the data instead (create relationship pointing to `378f24fb...`).

## 📝 Related Files

- **RPC Function**: `/hera_entities_crud_v1_fixed.sql` (lines 111-124)
- **Root Cause Analysis**: `/ACTOR-MEMBERSHIP-ERROR-FIX.md`
- **Database Investigation**: MCP query results showing entity mismatch

---

**Status**: ✅ Code fix complete, awaiting deployment
**Impact**: Fixes service creation errors for all users with ORGANIZATION entity type
**Risk**: Low - adds flexibility without breaking existing functionality
**Date**: 2025-10-30
