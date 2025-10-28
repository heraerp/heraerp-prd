# Leave Report Approver Name Fix - Summary

## Problem
When generating leave reports in Excel, the "Approved By" column was displaying truncated UUIDs (e.g., "5ac911a5") instead of the actual approver's name.

## Root Causes Identified

### 1. React Query Not Executing
The `useQuery` hook for fetching users had an incorrect `enabled` condition:
```typescript
// ❌ WRONG - user.id wasn't loaded when query was evaluated
enabled: !!user?.id

// ✅ FIXED - organizationId loads earlier and is sufficient
enabled: !!organizationId
```

**Impact**: The query never executed, resulting in an empty users array (`usersCount: 0`).

### 2. Wrong Organization ID
Initially attempted to query USER entities from Platform Organization:
```typescript
// ❌ WRONG - Based on incorrect understanding of HERA architecture
p_organization_id: PLATFORM_ORGANIZATION_ID
```

**Correction**: USER entities are stored in the **tenant organization**, not the Platform Organization.
```typescript
// ✅ CORRECT - Query tenant organization
p_organization_id: organizationId // tenant org
```

### 3. Incomplete User Lookup Map
The Excel export was only mapping USER entity IDs, but `approved_by` might contain:
- USER entity IDs (from HERA core_entities)
- Supabase Auth UIDs (from metadata)

## Solution Implemented

### 1. Fixed Query Location (/src/app/salon/leave/page.tsx:204-210)
```typescript
// ✅ CORRECT: Query USER entities from TENANT organization
const tenantUsers = await getEntities('', {
  p_organization_id: organizationId, // Tenant org, NOT Platform Org
  p_entity_type: 'USER',
  p_status: null, // Get all users regardless of status
  p_include_dynamic: false,
  p_include_relationships: false
})
```

### 2. Enhanced User Lookup Map (/src/lib/reports/leaveReportExport.ts:193-206)
```typescript
// Create user lookup map (approved_by could be USER entity id OR supabase_uid)
const userMap = new Map<string, string>()

// Build map with both entity ID and supabase_uid as keys
(data.users || []).forEach(u => {
  // Map by entity ID
  userMap.set(u.id, u.entity_name)

  // Also map by supabase_uid if it exists in metadata
  const supabaseUid = (u as any).metadata?.supabase_uid
  if (supabaseUid) {
    userMap.set(supabaseUid, u.entity_name)
  }
})
```

**Benefit**: The map now supports lookups by both:
- `user.id` (HERA USER entity ID)
- `user.metadata.supabase_uid` (Supabase Auth UID)

This ensures that regardless of which identifier is stored in `approved_by`, the approver's name will be resolved correctly.

### 3. Enhanced Debug Logging
Added comprehensive console logs to track data flow:

**In page.tsx** (lines 212-216):
```typescript
console.log('✅ Fetched USER entities from tenant org:', {
  count: tenantUsers?.length || 0,
  organizationId,
  sampleUser: tenantUsers?.[0]
})
```

**In LeaveReportTab.tsx** (lines 654-669):
```typescript
console.log('📊 [Excel Export] Complete data snapshot:', {
  users: {
    count: users?.length || 0,
    array: users,
    sampleUser: users?.[0],
    allUserIds: users?.map(u => u.id).slice(0, 5),
    allUserNames: users?.map(u => u.entity_name).slice(0, 5)
  },
  requests: {
    count: requests?.length || 0,
    approvedRequests: requests?.filter(r => r.approved_by)?.length || 0,
    sampleApprovedBy: requests?.find(r => r.approved_by)?.approved_by,
    allApprovedByIds: requests?.filter(r => r.approved_by).map(r => r.approved_by).slice(0, 5)
  }
})
```

**In leaveReportExport.ts** (lines 209-215, 237-246):
```typescript
// User map creation log
console.log('📊 [createRequestsSheet] User map with supabase_uid:', {
  usersProvided: data.users?.length || 0,
  userMapSize: userMap.size,
  userMapKeys: Array.from(userMap.keys()),
  sampleRequest: data.requests?.[0],
  sampleUserMetadata: (data.users?.[0] as any)?.metadata
})

// Approver lookup log (per request)
if (request.approved_by) {
  console.log('🔍 [Approver Lookup]', {
    requestCode: request.transaction_code,
    approved_by: request.approved_by,
    foundInMap: userMap.has(request.approved_by),
    resolvedName: approverName,
    userMapSize: userMap.size,
    allMapKeys: Array.from(userMap.keys()).slice(0, 5)
  })
}
```

## Files Modified

1. **`/src/app/salon/leave/page.tsx`**
   - Fixed React Query `enabled` condition
   - Corrected organization ID from Platform to tenant
   - Enhanced logging for user fetch

2. **`/src/lib/reports/leaveReportExport.ts`**
   - Enhanced user lookup map to support dual identifiers
   - Added comprehensive debug logging
   - Improved approver name resolution logic

3. **`/src/app/salon/leave/LeaveReportTab.tsx`**
   - Added detailed logging before Excel export
   - Verified users array is passed correctly to export function

## Expected Outcome

After this fix:

1. **Users Query Executes**: React Query now runs successfully and fetches USER entities from the tenant organization
2. **Correct Data Source**: USER entities are fetched from the correct organization
3. **Complete Lookup Map**: The userMap contains both entity IDs and supabase_uid values as keys
4. **Approver Names Display**: The "Approved By" column in Excel should now show full names instead of truncated UUIDs

## Testing Checklist

To verify the fix:

1. Navigate to `/salon/leave`
2. Click on the "Report" tab
3. Click "Download Excel" button
4. Check browser console for these logs:
   - `✅ Fetched USER entities from tenant org:` - Should show count > 0
   - `📊 [Excel Export] Complete data snapshot:` - Should show users array populated
   - `📊 [createRequestsSheet] User map with supabase_uid:` - Should show userMapSize > user count (due to dual keys)
   - `🔍 [Approver Lookup]` - Should show `foundInMap: true` and resolved names
5. Open the downloaded Excel file
6. Check the "Leave Requests" sheet
7. Verify the "Approved By" column shows full names (e.g., "John Doe") instead of truncated UUIDs (e.g., "5ac911a5")

## Additional Notes

### HERA Architecture Clarification
- **USER entities** are stored in the **tenant organization** (e.g., `378f24fb-d496-4ff7-8afa-ea34895a0eb8`)
- **NOT** in the Platform Organization (`00000000-0000-0000-0000-000000000000`)
- This is consistent with HERA's multi-tenant isolation architecture

### Dual Identifier System
HERA supports two types of user identifiers:
1. **USER entity ID** - HERA's internal entity ID from `core_entities`
2. **Supabase UID** - Supabase Auth UID stored in `metadata.supabase_uid`

The enhanced lookup map ensures compatibility with both identifier types.

## Related Documentation
- HERA Multi-Tenant Architecture: `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`
- Universal API V2 Patterns: `/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md`
- Sacred Six Schema: `/docs/schema/hera-sacred-six-schema.yaml`

---

**Status**: ✅ **FIXED AND READY FOR TESTING**

**Date**: 2025-01-27
**Developer**: Claude Code
**Issue**: Leave report Excel export showing truncated UUIDs instead of approver names
