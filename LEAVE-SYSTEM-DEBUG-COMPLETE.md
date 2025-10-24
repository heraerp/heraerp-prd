# Leave System - Complete Debug & Verification Guide

**Date**: October 24, 2025
**Status**: ✅ **ALL FIXES APPLIED - READY FOR TESTING**

---

## 🎯 Executive Summary

### What Was Fixed:

1. ✅ **Manager Field Removed** - No longer required in UI or validation
2. ✅ **Enterprise Error Logging** - Comprehensive error tracking added
3. ✅ **Debug Logging** - Complete data flow visibility
4. ✅ **Transaction Handling** - Already enterprise-grade (no changes needed)
5. ✅ **Staff Loading Diagnostics** - Added visibility into staff data loading

### What's Working:

1. ✅ **Policy Creation** - Successfully creates entities with correct format:
   - Entity Type: `LEAVE_POLICY` (uppercase)
   - Smart Codes: `HERA.SALON.LEAVE.POLICY.*.v1` (lowercase .v1)
   - All dynamic fields correctly stored

2. ✅ **Transaction Handling** - Enterprise-grade implementation:
   - Transaction Type: `'LEAVE'` (uppercase)
   - Transaction Status: `'submitted'`, `'approved'`, `'rejected'`, `'cancelled'`
   - Smart Codes: `HERA.SALON.HR.LEAVE.*.v1` (lowercase .v1)

### What to Investigate:

1. 🔍 **UI Display** - Why page shows "0 policies" despite database having 1 policy
2. 🔍 **Staff Loading** - Why modal shows "Loading staff members..." indicator

---

## 📋 Testing Instructions

### Step 1: Run MCP Database Verification

```bash
cd mcp-server
node check-leave-data.mjs
```

**Expected Output:**
```
📋 LEAVE POLICIES:
✅ Found 1 leave policies:
  1. Annual
     - ID: 2851381c-5242-4760-8faf-f3643656903f
     - Type: LEAVE_POLICY
     - Smart Code: HERA.SALON.LEAVE.POLICY.ANNUAL.v1
     - Status: active

👥 STAFF ENTITIES:
✅ Found X staff members:
  1. [Staff Name]
     - ID: [uuid]
     - Status: active

🧬 LEAVE POLICY DYNAMIC DATA:
✅ Found 11 dynamic fields:
  1. leave_type (text): ANNUAL
  2. annual_entitlement (number): 30
  ... (9 more fields)
```

### Step 2: Test in Browser with Console Open

1. **Open Browser Console** (F12)
2. **Navigate to** `/salon/leave`
3. **Watch Console Output** - You should see:

```javascript
// When page loads
🔍 [useHeraLeave] Fetching staff: {
  organizationId: "...",
  userId: "...",
  enabled: true
}

🔍 [useHeraLeave] Staff RPC result: {
  hasError: false,
  hasData: true,
  dataKeys: ['data', 'action', 'success'],
  listLength: X,  // Should be > 0
  firstItem: { entity: {...}, dynamic_data: [...] }
}

🔍 [useHeraLeave] Transforming staff: {
  hasStaffData: true,
  staffDataKeys: ['data', 'action', 'success'],
  listLength: X,
  itemsLength: 0
}

🔍 [useHeraLeave] Processing X staff members

// Policies
🔍 [useHeraLeave] Policies RPC result: {
  hasError: false,
  hasData: true,
  dataKeys: ['data', 'action', 'success'],
  listLength: 1,  // Should be 1 after creating policy
  firstItem: { entity: {...}, dynamic_data: [...] }
}

🔍 [useHeraLeave] Transforming policies: {
  hasPoliciesData: true,
  policiesDataKeys: ['data', 'action', 'success'],
  listLength: 1,
  itemsLength: 0
}

🔍 [useHeraLeave] Processing 1 policies
```

### Step 3: Create a Test Policy

1. **Click "Configure Policy"**
2. **Fill in form:**
   - Policy Name: "Annual Leave Test"
   - Leave Type: ANNUAL
   - Annual Entitlement: 30
   - Accrual Method: MONTHLY
   - Applies To: ALL
   - Min Notice Days: 7
   - Max Consecutive Days: 15
   - Min Leave Days: 0.5

3. **Click "Create Policy"**

4. **Watch Console for:**
```javascript
🔍 [useHeraLeave] Creating policy with params: {
  actor: "...",
  org: "...",
  policy_name: "Annual Leave Test",
  leave_type: "ANNUAL"
}

🔍 [useHeraLeave] CREATE result: {
  hasError: false,
  hasData: true,
  success: true,
  action: "CREATE",
  entityId: "...",
  fullResult: {...}
}
```

5. **Verify:**
   - ✅ Success toast appears
   - ✅ Console shows no errors
   - ✅ Policy card appears in UI (if this doesn't work, we have data flow issue)

### Step 4: Test Leave Request Creation

1. **Click "New Leave Request"**
2. **Watch Console for:**
```javascript
🔍 [LeaveModal] Staff data updated: {
  staffCount: X,  // Should be > 0
  staffLoaded: true,
  staffSample: { id: "...", entity_name: "..." }
}
```

3. **Check Modal UI:**
   - ✅ Staff dropdown should have options
   - ❌ Should NOT show "Loading staff members..." indicator
   - ✅ Should be able to select staff member

4. **Fill in form and submit:**
   - Staff Member: Select from dropdown
   - Leave Type: ANNUAL
   - Start Date: Tomorrow
   - End Date: Tomorrow + 2 days
   - Reason: "Test leave request"

5. **Watch Console for:**
```javascript
🔍 [LeaveModal] Submitting leave request: {
  staff_id: "...",
  manager_id: "...",  // Auto-assigned
  leave_type: "ANNUAL",
  start_date: "...",
  end_date: "...",
  total_days: 3
}
```

---

## 🔍 Diagnostic Decision Tree

### Issue: Page shows "0 policies" despite database having 1 policy

**Check Console:**
- ✅ If `listLength: 1` in RPC result → Data is returned from API
  - ✅ If `listLength: 1` in transformation → Data is being processed
    - ❌ If UI still shows 0 → **UI rendering issue** (check page.tsx)
  - ❌ If `listLength: 0` in transformation → **useMemo dependency issue**
- ❌ If `listLength: 0` in RPC result → **Database query issue**
  - Check MCP script output
  - Verify `entity_type: 'LEAVE_POLICY'` filter

### Issue: Staff dropdown shows "Loading staff members..."

**Check Console:**
- ✅ If `listLength: X` in Staff RPC result → Data is returned from API
  - ✅ If `listLength: X` in transformation → Data is being processed
    - ✅ If console shows "Processing X staff" → **Modal props issue**
      - Check if `staff` prop is passed correctly to LeaveModal
    - ❌ If transformation shows 0 → **useMemo dependency issue**
- ❌ If `listLength: 0` in Staff RPC result → **Database has no STAFF entities**
  - Run MCP script to verify
  - May need to create staff entities first

---

## 🛠️ Files Modified

### `/src/hooks/useHeraLeave.ts`
**Lines Modified:**
- **215-222**: Added policies RPC result logging
- **241-268**: Added staff fetch and result logging
- **304-318**: Added policies transformation logging
- **359-373**: Added staff transformation logging

**Purpose**: Complete visibility into data flow from API to UI

### `/src/app/salon/leave/LeaveModal.tsx`
**Lines Modified:**
- **20-39**: Removed `manager_id` from Zod validation
- **70-93**: Added enterprise error logging and staff data monitoring
- **119-171**: Modified submit handler to auto-assign manager
- **277-298**: Added UI indicator for staff loading status
- **392-456**: Removed manager field from form UI

**Purpose**: Manager field removal and better diagnostics

### `/mcp-server/check-leave-data.mjs` (NEW FILE)
**Purpose**: Database verification script for:
- Leave policies
- Staff entities
- Policy dynamic data
- Leave request transactions

---

## 📊 Known Data Structure (Verified)

### RPC Response Format:
```typescript
{
  data: {
    list: [
      {
        entity: {
          id: "uuid",
          entity_type: "LEAVE_POLICY",
          entity_name: "Annual ",
          smart_code: "HERA.SALON.LEAVE.POLICY.ANNUAL.v1",
          status: "active",
          organization_id: "uuid",
          created_by: "uuid",
          updated_by: "uuid"
        },
        dynamic_data: [
          { field_name: "leave_type", field_value_text: "ANNUAL" },
          { field_name: "annual_entitlement", field_value_number: 30 },
          // ... 9 more fields
        ],
        relationships: []
      }
    ]
  },
  action: "READ",
  success: true
}
```

### Hook Transformation (Expected):
```typescript
{
  id: "uuid",
  entity_name: "Annual ",
  leave_type: "ANNUAL",
  annual_entitlement: 30,
  carry_over_cap: 5,
  min_notice_days: 7,
  max_consecutive_days: 15,
  min_leave_days: 0.5,
  accrual_method: "MONTHLY",
  probation_period_months: 3,
  applies_to: "ALL",
  effective_from: "2025-10-24T...",
  active: true
}
```

---

## ✅ Verification Checklist

Before marking as complete, verify:

### Code Changes:
- [x] ✅ Manager field removed from LeaveModal validation
- [x] ✅ Manager field removed from LeaveModal UI
- [x] ✅ Auto-assign manager logic implemented
- [x] ✅ Enterprise error logging added
- [x] ✅ Debug logging added to hook (policies)
- [x] ✅ Debug logging added to hook (staff)
- [x] ✅ Debug logging added to modal
- [x] ✅ MCP verification script created
- [x] ✅ Transaction handling verified (already correct)

### Runtime Testing:
- [ ] MCP script shows policies in database
- [ ] MCP script shows staff in database
- [ ] Browser console shows RPC results
- [ ] Browser console shows transformation logs
- [ ] UI displays correct policy count
- [ ] Modal dropdown shows staff members
- [ ] Can create policy successfully
- [ ] Can create leave request successfully

---

## 🚀 Next Actions

1. **Run MCP Verification**
   ```bash
   cd mcp-server
   node check-leave-data.mjs
   ```

2. **Test in Browser**
   - Open console (F12)
   - Navigate to `/salon/leave`
   - Create a policy
   - Create a leave request
   - Watch console output

3. **Analyze Results**
   - Compare console logs to expected output
   - Identify where data flow breaks (if any)
   - Apply targeted fix based on findings

4. **Report Findings**
   - Copy console logs
   - Share MCP script output
   - Describe observed behavior vs expected

---

## 📝 Expected Console Output Pattern

**Successful Flow:**
```
🔍 [useHeraLeave] Policies RPC result: { listLength: 1 }
🔍 [useHeraLeave] Transforming policies: { listLength: 1 }
🔍 [useHeraLeave] Processing 1 policies
🔍 [useHeraLeave] Fetching staff: { enabled: true }
🔍 [useHeraLeave] Staff RPC result: { listLength: 5 }
🔍 [useHeraLeave] Transforming staff: { listLength: 5 }
🔍 [useHeraLeave] Processing 5 staff members
🔍 [LeaveModal] Staff data updated: { staffCount: 5 }
```

**Problem Flow (Example):**
```
🔍 [useHeraLeave] Policies RPC result: { listLength: 1 }
🔍 [useHeraLeave] Transforming policies: { listLength: 0 }  // ❌ PROBLEM
⚠️ [useHeraLeave] No policies in list
```

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Status**: ✅ **READY FOR TESTING - ALL DEBUG TOOLS IN PLACE**
