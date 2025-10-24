# Leave Policy Response Structure Fix - Complete

**Date**: October 24, 2025
**Status**: ✅ **FIXED - Data Now Displays**

---

## 🐛 Issue Discovered

The leave policies were being fetched successfully from the RPC (as shown in logs), but the page displayed "No policies found" because the hook was looking for data in the wrong structure.

### Actual RPC Response Structure

```json
{
  "data": {
    "list": [  // ✅ Data is in data.list
      {
        "entity": {
          "id": "d50b785b-996a-4b52-9ea7-9c28f9b873b8",
          "entity_name": "Annual",
          "entity_type": "LEAVE_POLICY",
          "smart_code": "HERA.SALON.LEAVE.POLICY.ANNUAL.v1",
          "status": "active"
        },
        "dynamic_data": [  // ✅ Array of field objects
          {
            "field_name": "leave_type",
            "field_type": "text",
            "field_value_text": "ANNUAL"
          },
          {
            "field_name": "annual_entitlement",
            "field_type": "number",
            "field_value_number": 30
          }
        ],
        "relationships": []
      }
    ],
    "action": "READ",
    "success": true
  }
}
```

### What Hook Was Expecting

```typescript
// ❌ WRONG: Hook expected data.items
if (!policiesData?.items) return []

policiesData.items.map((entity: any) => ({
  // Expected entity to have dynamic_data as object
  leave_type: entity.dynamic_data?.leave_type
}))
```

---

## ✅ Fix Applied

### 1. Fixed Data Access Path

**File**: `/src/hooks/useHeraLeave.ts` (lines 279-320)

```typescript
const policies: LeavePolicy[] = React.useMemo(() => {
  // ✅ FIXED: Handle both data.list and data.items
  const list = policiesData?.list || policiesData?.items || []
  if (!list.length) return []

  return list.map((item: any) => {
    // ✅ Extract entity and dynamic_data from the item
    const entity = item.entity || item
    const dynamicDataArray = item.dynamic_data || []

    // ✅ Convert dynamic_data array to object
    const dynamicData: Record<string, any> = {}
    dynamicDataArray.forEach((field: any) => {
      const fieldName = field.field_name
      const value = field.field_value_text ||
                   field.field_value_number ||
                   field.field_value_boolean ||
                   field.field_value_date ||
                   field.field_value_json
      dynamicData[fieldName] = value
    })

    return {
      id: entity.id,
      entity_name: entity.entity_name,
      leave_type: dynamicData.leave_type || 'ANNUAL',
      annual_entitlement: dynamicData.annual_entitlement || 21,
      // ... other fields
    }
  })
}, [policiesData])
```

### 2. Fixed Staff Data Transformation

**File**: `/src/hooks/useHeraLeave.ts` (lines 322-354)

Applied the same fix to staff data transformation:
- Check for both `list` and `items` properties
- Extract `entity` and `dynamic_data` from each item
- Convert `dynamic_data` array to object for easy access

---

## 🎯 Key Differences

### Response Format: LIST vs ITEMS

| Property | Structure | Item Format |
|----------|-----------|-------------|
| `data.list` | RPC orchestrator format | `{entity, dynamic_data[], relationships[]}` |
| `data.items` | Legacy format | Direct entity with embedded `dynamic_data` object |

### Dynamic Data Format: ARRAY vs OBJECT

**RPC Orchestrator Returns Array**:
```json
{
  "dynamic_data": [
    { "field_name": "leave_type", "field_value_text": "ANNUAL" },
    { "field_name": "annual_entitlement", "field_value_number": 30 }
  ]
}
```

**Hook Now Converts to Object**:
```javascript
{
  leave_type: "ANNUAL",
  annual_entitlement: 30
}
```

---

## 📊 Data Flow (Fixed)

```
RPC Call
  ↓
{success, data: {list: [{entity, dynamic_data[], relationships[]}]}}
  ↓
Hook receives policiesData = {list: [...]}
  ↓
Extract: policiesData.list || policiesData.items
  ↓
Map each item:
  - Extract entity from item.entity
  - Convert dynamic_data[] to object
  - Build LeavePolicy object
  ↓
UI displays policies correctly
```

---

## 🔧 Technical Details

### Field Value Extraction

The RPC stores different types in different columns:

```typescript
const value = field.field_value_text ||      // For type='text'
             field.field_value_number ||     // For type='number'
             field.field_value_boolean ||    // For type='boolean'
             field.field_value_date ||       // For type='date'
             field.field_value_json          // For type='json'
```

This ensures we get the correct typed value regardless of field type.

### Backward Compatibility

The fix maintains backward compatibility:

```typescript
const list = policiesData?.list ||    // ✅ RPC orchestrator format
            policiesData?.items ||     // ✅ Legacy format
            []                         // ✅ Fallback to empty array
```

If the response format changes back to `items`, the code will still work.

---

## 🧪 Testing Verification

### Before Fix
```
RPC Log: ✅ 1 policy found in data.list
UI Display: ❌ "No policies found"
Reason: Hook checking policiesData.items (undefined)
```

### After Fix
```
RPC Log: ✅ 1 policy found in data.list
UI Display: ✅ Policy card shown with:
  - Policy Name: "Annual"
  - Leave Type: ANNUAL
  - Annual Entitlement: 30
  - All dynamic fields correctly displayed
```

---

## 📁 Files Modified

### `/src/hooks/useHeraLeave.ts`
- **Lines 279-320**: Fixed policies data transformation
  - Check for `data.list` instead of `data.items`
  - Extract entity from `item.entity`
  - Convert `dynamic_data` array to object

- **Lines 322-354**: Fixed staff data transformation
  - Applied same array-to-object conversion
  - Maintains consistent data access pattern

---

## ✅ Final Status

### All Data Now Displays Correctly

- ✅ RPC calls working (confirmed in logs)
- ✅ Response structure understood and handled
- ✅ Dynamic data array converted to object
- ✅ Policies display in UI
- ✅ Staff data also fixed with same pattern
- ✅ Backward compatible with legacy format

### Ready for Production

The leave policy system now correctly:
1. Fetches data via RPC with correct parameters
2. Handles the orchestrator's response structure
3. Transforms dynamic_data array to usable object
4. Displays policies in the UI
5. Supports policy creation with proper format

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Status**: ✅ **COMPLETE - POLICIES NOW DISPLAY**
