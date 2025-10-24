# Leave System - Complete Verification & Fix

**Date**: October 24, 2025
**Status**: 🔍 **DEBUGGING IN PROGRESS**

---

## 🎯 Current Status

### ✅ What's Working:
1. **Policy Creation**: Successfully creates entity in database
   - Entity ID: `2851381c-5242-4760-8faf-f3643656903f`
   - Entity Type: `LEAVE_POLICY` (correct uppercase)
   - Smart Code: `HERA.SALON.LEAVE.POLICY.ANNUAL.v1` (correct lowercase .v1)
   - Status: `active`
   - Organization ID: Correctly set
   - Actor stamping: `created_by` and `updated_by` correctly populated

2. **Policy READ Operation**: Successfully queries database
   - Response format: `data.list` array (correct)
   - Each item has: `{entity, dynamic_data[], relationships[]}`
   - Dynamic data contains 11 fields (all policy fields)

### ❌ What's Not Working:
1. **UI Display**: Page shows "0 policies" even though database has 1 policy
2. **Staff Loading**: Modal shows "Loading staff members..." indicator

---

## 🔍 RPC Response Analysis

### CREATE Response (✅ Working):
```json
{
  "data": {
    "entity": {
      "id": "2851381c-5242-4760-8faf-f3643656903f",
      "entity_type": "LEAVE_POLICY",
      "smart_code": "HERA.SALON.LEAVE.POLICY.ANNUAL.v1"
    },
    "dynamic_data": [...],
    "relationships": []
  },
  "action": "CREATE",
  "success": true,
  "entity_id": "2851381c-5242-4760-8faf-f3643656903f"
}
```

### READ Response (✅ Working):
```json
{
  "data": {
    "list": [
      {
        "entity": {
          "id": "2851381c-5242-4760-8faf-f3643656903f",
          "entity_name": "Annual ",
          "entity_type": "LEAVE_POLICY",
          "smart_code": "HERA.SALON.LEAVE.POLICY.ANNUAL.v1",
          "status": "active"
        },
        "dynamic_data": [
          { "field_name": "leave_type", "field_value_text": "ANNUAL" },
          { "field_name": "annual_entitlement", "field_value_number": 30 },
          // ... 9 more fields
        ],
        "relationships": []
      }
    ]
  },
  "action": "READ",
  "success": true
}
```

---

## 🐛 Root Cause Analysis

### Issue #1: UI Shows 0 Policies

**Hypothesis**: The `useMemo` transformation in `useHeraLeave.ts` might not be triggering correctly.

**Evidence**:
- Database query returns 1 policy
- Response structure is correct: `data.list[0].entity`
- Policy has all required fields

**Investigation Steps**:
1. Check if `policiesData` is being received by the hook
2. Verify the `useMemo` dependency array
3. Confirm the data transformation logic handles `data.list` format
4. Check if React Query is caching stale data

### Issue #2: Staff Loading

**Hypothesis**: Staff query might be returning empty results or wrong entity_type.

**Evidence**:
- Modal shows "Loading staff members..." indicator
- This appears when `!staff || staff.length === 0`

**Investigation Steps**:
1. Check if STAFF entities exist in database
2. Verify `entity_type: 'STAFF'` filter is correct (should be uppercase)
3. Check if staff query has `enabled: !!organizationId && !!user?.id`
4. Verify staff data transformation handles `data.list` format

---

## 🔧 Diagnostic Plan

### Step 1: Add Debug Logging to Hook

Add comprehensive logging to `useHeraLeave.ts`:

```typescript
// After policiesData is fetched (line 220)
console.log('🔍 [useHeraLeave] Policies data received:', {
  hasData: !!policiesData,
  dataKeys: policiesData ? Object.keys(policiesData) : [],
  listLength: policiesData?.list?.length,
  itemsLength: policiesData?.items?.length,
  firstItem: policiesData?.list?.[0] || policiesData?.items?.[0]
})

// In the policies useMemo (line 280)
console.log('🔍 [useHeraLeave] Transforming policies:', {
  policiesDataKeys: policiesData ? Object.keys(policiesData) : [],
  listLength: list.length,
  transformedCount: policies.length
})

// After staffData is fetched (line 250)
console.log('🔍 [useHeraLeave] Staff data received:', {
  hasData: !!staffData,
  dataKeys: staffData ? Object.keys(staffData) : [],
  listLength: staffData?.list?.length,
  itemsLength: staffData?.items?.length,
  firstItem: staffData?.list?.[0] || staffData?.items?.[0]
})

// In the staff useMemo (line 322)
console.log('🔍 [useHeraLeave] Transforming staff:', {
  staffDataKeys: staffData ? Object.keys(staffData) : [],
  listLength: list.length,
  transformedCount: staff.length
})
```

### Step 2: Verify Database State

Create MCP script to check both policies and staff:

```javascript
// mcp-server/check-leave-data.mjs
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const orgId = process.env.DEFAULT_ORGANIZATION_ID

console.log('🔍 Checking Leave Policies...')
const { data: policies, error: policiesError } = await supabase
  .from('core_entities')
  .select('id, entity_type, entity_name, smart_code, status, created_at')
  .eq('organization_id', orgId)
  .eq('entity_type', 'LEAVE_POLICY')
  .order('created_at', { ascending: false })

if (policiesError) {
  console.error('❌ Policies Error:', policiesError)
} else {
  console.log(`✅ Found ${policies.length} policies:`)
  policies.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.entity_name} (${p.smart_code})`)
  })
}

console.log('\n🔍 Checking Staff Entities...')
const { data: staff, error: staffError } = await supabase
  .from('core_entities')
  .select('id, entity_type, entity_name, smart_code, status, created_at')
  .eq('organization_id', orgId)
  .eq('entity_type', 'STAFF')
  .order('created_at', { ascending: false })
  .limit(10)

if (staffError) {
  console.error('❌ Staff Error:', staffError)
} else {
  console.log(`✅ Found ${staff.length} staff members:`)
  staff.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.entity_name} (${s.status})`)
  })
}
```

### Step 3: Check React Query Cache

Add this to the page component to inspect cache:

```typescript
// In the page component, after useHeraLeave hook
useEffect(() => {
  console.log('🔍 [LeavePage] Hook data:', {
    policiesCount: policies?.length || 0,
    staffCount: staff?.length || 0,
    requestsCount: requests?.length || 0,
    isLoading,
    policies: policies?.map(p => ({ id: p.id, name: p.entity_name })),
    staff: staff?.map(s => ({ id: s.id, name: s.entity_name }))
  })
}, [policies, staff, requests, isLoading])
```

---

## 🎯 Expected Fixes

### Fix #1: Ensure Data Transformation Works

The transformation logic in `useHeraLeave.ts` lines 279-320 looks correct, but verify:

```typescript
const policies: LeavePolicy[] = React.useMemo(() => {
  // ✅ This should work with the response format
  const list = policiesData?.list || policiesData?.items || []

  console.log('🔍 Policy transformation:', {
    hasPoliciesData: !!policiesData,
    listLength: list.length,
    firstItem: list[0]
  })

  if (!list.length) return []

  return list.map((item: any) => {
    // This should correctly extract entity and dynamic_data
    const entity = item.entity || item
    const dynamicDataArray = item.dynamic_data || []

    // Convert array to object
    const dynamicData: Record<string, any> = {}
    dynamicDataArray.forEach((field: any) => {
      const value = field.field_value_text ||
                   field.field_value_number ||
                   field.field_value_boolean ||
                   field.field_value_date ||
                   field.field_value_json
      dynamicData[field.field_name] = value
    })

    return {
      id: entity.id,
      entity_name: entity.entity_name,
      leave_type: dynamicData.leave_type || 'ANNUAL',
      // ... other fields
    }
  })
}, [policiesData]) // ✅ Correct dependency
```

### Fix #2: Staff Query Enabled Condition

Verify staff query is enabled:

```typescript
const {
  data: staffData,
  isLoading: staffLoading,
  error: staffError
} = useQuery({
  queryKey: ['staff', organizationId],
  queryFn: async () => {
    console.log('🔍 [useHeraLeave] Fetching staff:', {
      organizationId,
      userId: user?.id
    })

    const result = await callRPC('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: user?.id || '',
      p_organization_id: organizationId,
      p_entity: {
        entity_type: 'STAFF', // ✅ UPPERCASE
        status: 'active'
      },
      p_options: {
        include_dynamic: true,
        include_relationships: false
      }
    })

    console.log('🔍 [useHeraLeave] Staff result:', {
      hasError: !!result.error,
      hasData: !!result.data,
      listLength: result.data?.list?.length
    })

    if (result.error) throw new Error(result.error.message)
    return result.data
  },
  enabled: !!organizationId && !!user?.id // ✅ Check both conditions
})
```

---

## 📋 Testing Checklist

### Policy Creation & Display:
- [ ] Open browser console (F12)
- [ ] Navigate to /salon/leave
- [ ] Click "Configure Policy"
- [ ] Fill in form and submit
- [ ] Watch console for debug logs
- [ ] Verify success toast appears
- [ ] Check if policy card appears in UI
- [ ] Run `cd mcp-server && node check-leave-data.mjs`
- [ ] Verify database has entity

### Staff Loading:
- [ ] Open browser console (F12)
- [ ] Navigate to /salon/leave
- [ ] Click "New Leave Request"
- [ ] Watch console for staff data logs
- [ ] Check if staff dropdown is populated
- [ ] Verify no "Loading staff members..." message
- [ ] Run `cd mcp-server && node check-leave-data.mjs`
- [ ] Verify database has STAFF entities

---

## 🚀 Next Steps

1. **Add Debug Logging**: Insert console.log statements in useHeraLeave.ts
2. **Run MCP Verification**: Create and run check-leave-data.mjs
3. **Test in Browser**: Open console and watch data flow
4. **Analyze Results**: Compare expected vs actual data structure
5. **Apply Targeted Fix**: Based on findings from steps 1-4

---

## 📊 Current Transaction Handling Status

### ✅ Already Enterprise-Grade:

1. **Transaction Type**: `'LEAVE'` - ✅ UPPERCASE (line 616)
2. **Transaction Status**: `'submitted'` - ✅ Correct value (line 623)
3. **Status Values**: `'approved'`, `'rejected'`, `'cancelled'` - ✅ All correct (lines 705-709)
4. **Smart Codes**: All use lowercase `.v1` format - ✅ Correct
5. **Manager Field Removed**: ✅ Removed from validation and UI
6. **Auto-assign Manager**: ✅ Implemented in submit handler (line 130)

### Transaction Creation Format:
```typescript
const result = await createTransaction({
  transaction_type: 'LEAVE',           // ✅ UPPERCASE
  transaction_code: transactionCode,
  smart_code: `HERA.SALON.HR.LEAVE.${data.leave_type}.v1`, // ✅ lowercase .v1
  transaction_date: new Date().toISOString(),
  source_entity_id: data.staff_id,
  target_entity_id: data.manager_id,
  total_amount: totalDays,
  transaction_status: 'submitted',     // ✅ Enterprise-grade status
  metadata: { /* ... */ },
  lines: [
    {
      line_number: 1,
      line_type: 'LEAVE',
      description: `${data.leave_type} Leave: ${totalDays} days`,
      quantity: totalDays,
      unit_amount: 1,
      line_amount: totalDays,
      smart_code: `HERA.SALON.HR.LINE.${data.leave_type}.v1` // ✅ lowercase .v1
    }
  ]
})
```

**Status**: ✅ **Transaction handling is already enterprise-grade - no changes needed**

---

## 📝 Files Modified

1. `/src/hooks/useHeraLeave.ts` - All RPC fixes applied
2. `/src/app/salon/leave/LeaveModal.tsx` - Manager field removed, debug logging added
3. `/mcp-server/check-leave-data.mjs` - To be created for verification

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Status**: 🔍 **AWAITING DEBUG RESULTS**
