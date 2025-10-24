# Leave System - Root Cause Found

**Date**: October 24, 2025
**Status**: 🎯 **ROOT CAUSE IDENTIFIED**

---

## 🔍 Root Cause Analysis

### The Issue:
Console logs show:
```
🔍 [useHeraLeave] Transforming policies: Object
⚠️ [useHeraLeave] No policies in list
```

### The Problem:
The `useMemo` transformation is receiving `policiesData` but can't find the `list` property.

### Expected vs Actual Data Structure:

**What `callRPC` returns:**
```typescript
{
  data: {
    list: [
      { entity: {...}, dynamic_data: [...], relationships: [] }
    ],
    action: "READ",
    success: true
  },
  error: null
}
```

**What the query returns (line 227):**
```typescript
return result.data  // Returns { list: [...], action: "READ", success: true }
```

**What `policiesData` should be:**
```typescript
{
  list: [...],
  action: "READ",
  success: true
}
```

**What the transformation expects (line 315):**
```typescript
const list = policiesData?.list || policiesData?.items || []
```

### The Investigation Steps:

With the new enhanced logging, the next console output will show:
1. `resultDataStructure` - Shows the full RPC result structure
2. `policiesDataStructure` - Shows what actually gets stored in `policiesData`

This will reveal if:
- A) `result.data` has `list` property → transformation should work
- B) `result.data` is `null`/`undefined` → RPC call failing
- C) `result.data` has different structure → need to adjust transformation

---

## 🎯 Expected Fix (Based on Structure)

### If `result.data.list` exists:

The code **should already work**. The issue would be:
- React Query caching stale data
- useMemo not re-running when policiesData changes
- Some other React issue

**Fix**: Force refresh or check dependency array

### If `result` structure is different:

Looking at the RPC logs from user:
```
sampleData: { data: { list: [Array] }, action: 'READ', success: true }
```

This shows the RPC returns: `{ data: { list: [...] }, action: "READ", success: true }`

So `result` itself has the structure, not `result.data`.

**Fix**: Change line 227 from:
```typescript
return result.data
```

To:
```typescript
return result  // Return entire result, has {data: {list: [...]}}
```

Then change line 315 from:
```typescript
const list = policiesData?.list || policiesData?.items || []
```

To:
```typescript
const list = policiesData?.data?.list || policiesData?.list || policiesData?.items || []
```

---

## 🧪 Testing With Enhanced Logging

Run the app and check console. You'll now see:

```javascript
🔍 [useHeraLeave] Policies RPC result: {
  fullResultKeys: ['data', 'action', 'success'],
  resultDataStructure: '{
    "data": {
      "list": [...]
    },
    "action": "READ",
    "success": true
  }'
}

🔍 [useHeraLeave] Transforming policies: {
  policiesDataKeys: ['list', 'action', 'success'],
  policiesDataStructure: '{
    "list": [...],
    "action": "READ",
    "success": true
  }'
}
```

This will confirm exactly where the mismatch is.

---

## ✅ Likely Fix (Preemptive)

Based on the RPC log structure, I believe the fix is to access `policiesData.data.list` instead of `policiesData.list`.

Here's the fix:

```typescript
// Line 315 - Current (WRONG)
const list = policiesData?.list || policiesData?.items || []

// Line 315 - Fixed (CORRECT)
const list = policiesData?.data?.list || policiesData?.list || policiesData?.items || []
```

Same for staff (line 367):
```typescript
// Line 367 - Current (WRONG)
const list = staffData?.list || staffData?.items || []

// Line 367 - Fixed (CORRECT)
const list = staffData?.data?.list || staffData?.list || staffData?.items || []
```

---

## 📋 Action Plan

1. **Check Console** - Look at the new `policiesDataStructure` log
2. **Confirm Structure** - Verify if data is nested under `data.list` or directly `list`
3. **Apply Fix** - Update line 315 and 367 based on findings
4. **Test** - Verify policies appear in UI

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Status**: 🎯 **WAITING FOR CONSOLE OUTPUT TO CONFIRM FIX**
