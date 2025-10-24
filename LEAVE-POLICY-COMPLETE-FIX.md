# Leave Policy System - Complete Fix Summary

**Date**: October 24, 2025
**Status**: ✅ **ALL ISSUES FIXED - READY FOR TESTING**

---

## 🎯 Issues Identified and Fixed

### 1. ✅ Import Path Error
**Problem**: `callRPC` was being imported from wrong module
**Fix**: Changed import from `@/lib/supabase` to `@/lib/universal-api-v2-client`
**File**: `/src/hooks/useHeraLeave.ts` line 5

### 2. ✅ RPC Parameter Structure
**Problem**: Parameters didn't match official `hera_entities_crud_v1` signature
**Fixes Applied**:
- Moved `entity_type` inside `p_entity` object (was separate parameter)
- Changed dynamic fields to SIMPLE format: `{value, type, smart_code}`
- Changed empty relationships from `[]` to `{}`
- Fixed option names: `include_dynamic` (was `include_dynamic_data`)
- Added `p_actor_user_id` to READ operations

**Files**: `/src/hooks/useHeraLeave.ts` lines 202-213, 232-244, 493-580

### 3. ✅ Response Structure Mismatch
**Problem**: Hook expected `data.items` but RPC returns `data.list`
**Fix**: Updated data transformation to handle `data.list` format with array-to-object conversion for `dynamic_data`
**Files**: `/src/hooks/useHeraLeave.ts` lines 279-320, 322-354

### 4. ✅ Smart Code Format
**Problem**: Smart codes had mixed formats
**Fix**: Standardized all smart codes to lowercase `.v1` (matching services pattern)
- Entity smart codes: `HERA.SALON.LEAVE.POLICY.${type}.v1`
- Transaction smart codes: `HERA.SALON.HR.LEAVE.${type}.v1`
- Dynamic field smart codes: `HERA.SALON.LEAVE.FIELD.*.v1`
- All use **dots** (not underscores/snake_case)
- All use lowercase `.v1` (not uppercase `.V1`)

**Files**: `/src/hooks/useHeraLeave.ts` lines 500, 508-573, 618, 641

---

## 📋 Technical Details

### Correct RPC Call Format

**CREATE Policy:**
```typescript
await callRPC('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: user.id,  // WHO
  p_organization_id: organizationId,  // WHERE
  p_entity: {
    entity_type: 'LEAVE_POLICY',  // Inside p_entity
    entity_name: data.policy_name,
    smart_code: `HERA.SALON.LEAVE.POLICY.${data.leave_type}.v1`,
    status: 'active'
  },
  p_dynamic: {
    leave_type: {
      value: data.leave_type,  // String value
      type: 'text',  // Field type
      smart_code: 'HERA.SALON.LEAVE.FIELD.TYPE.v1'  // HERA DNA
    },
    annual_entitlement: {
      value: String(data.annual_entitlement),  // Number as string
      type: 'number',
      smart_code: 'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.v1'
    }
    // ... more fields
  },
  p_relationships: {},  // Empty object, not array
  p_options: {
    include_dynamic: true,  // Correct option name
    include_relationships: false
  }
})
```

**READ Policies:**
```typescript
await callRPC('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: user?.id || '',  // Required for all operations
  p_organization_id: organizationId,
  p_entity: {
    entity_type: 'LEAVE_POLICY'  // Inside p_entity
  },
  p_options: {
    include_dynamic: true,
    include_relationships: false
  }
})
```

### Response Structure Handling

**RPC Returns:**
```json
{
  "data": {
    "list": [
      {
        "entity": {
          "id": "uuid",
          "entity_name": "Annual Leave",
          "entity_type": "LEAVE_POLICY",
          "smart_code": "HERA.SALON.LEAVE.POLICY.ANNUAL.v1"
        },
        "dynamic_data": [
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
    ]
  }
}
```

**Hook Transforms To:**
```typescript
const policies = policiesData?.list.map((item) => {
  const entity = item.entity
  const dynamicDataArray = item.dynamic_data

  // Convert array to object
  const dynamicData = {}
  dynamicDataArray.forEach((field) => {
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
    leave_type: dynamicData.leave_type,
    annual_entitlement: dynamicData.annual_entitlement
    // ... other fields
  }
})
```

---

## 🧬 Smart Code Standards (Verified)

Based on `/salon/services` page implementation:

### Format Rules:
- **Structure**: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v1`
- **Separators**: Dots only (no underscores or snake_case)
- **Case**: UPPERCASE for segments, lowercase for version `.v1`
- **Version**: Always `.v1` (lowercase v)

### Correct Examples:
```typescript
// Entity smart codes
'HERA.SALON.LEAVE.POLICY.ANNUAL.v1'
'HERA.SALON.SERVICE.ENTITY.SERVICE.v1'
'HERA.SALON.PRODUCT.ENTITY.TREATMENT.v1'

// Transaction smart codes
'HERA.SALON.HR.LEAVE.ANNUAL.v1'
'HERA.SALON.POS.SALE.PAYMENT.v1'

// Dynamic field smart codes
'HERA.SALON.LEAVE.FIELD.TYPE.v1'
'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.v1'
'HERA.SALON.SERVICE.FIELD.PRICE.v1'

// Transaction line smart codes
'HERA.SALON.HR.LINE.ANNUAL.v1'
'HERA.SALON.POS.LINE.PRODUCT.v1'
```

### ❌ Invalid Examples:
```typescript
// Wrong version case
'HERA.SALON.LEAVE.POLICY.ANNUAL.V1'  // ❌ Uppercase V

// Wrong separators
'HERA.SALON.LEAVE_POLICY.ANNUAL.v1'  // ❌ Snake case
'HERA-SALON-LEAVE-POLICY-ANNUAL-v1'  // ❌ Hyphens

// Missing version
'HERA.SALON.LEAVE.POLICY.ANNUAL'     // ❌ No version
```

---

## 🧪 Testing Instructions

### 1. Test Policy Creation

**Navigate to**: `/salon/leave` → Policies tab

**Create Test Policy**:
- Click "Configure Policy"
- Fill in form:
  - Policy Name: "Annual Leave Policy"
  - Leave Type: ANNUAL
  - Annual Entitlement: 30
  - Accrual Method: MONTHLY
  - Applies To: ALL
  - Min Notice Days: 7
  - Max Consecutive Days: 15
  - Min Leave Days: 0.5
- Click "Create Policy"

**Expected Results**:
- ✅ Success toast appears
- ✅ Policy card displays in UI
- ✅ Console shows debug logs with correct parameters
- ✅ Database has entity in `core_entities`
- ✅ Database has dynamic fields in `core_dynamic_data`

### 2. Verify Database State

**Check Entity:**
```bash
cd mcp-server
node check-leave-policies.mjs
```

**Expected Output**:
```
✅ Found 1 entities with LEAVE in type:
   - ID: <uuid>
     Type: "LEAVE_POLICY" (exact case)
     Name: Annual Leave Policy
     Smart Code: HERA.SALON.LEAVE.POLICY.ANNUAL.v1
```

**Check Dynamic Data:**
```javascript
// Should find 11+ dynamic fields with correct types:
// leave_type (text)
// annual_entitlement (number)
// carry_over_cap (number)
// min_notice_days (number)
// max_consecutive_days (number)
// min_leave_days (number)
// accrual_method (text)
// probation_period_months (number)
// applies_to (text)
// effective_from (date)
// active (boolean)
```

### 3. Check Console Logs

**Look for debug output**:
```
🔍 [useHeraLeave] Creating policy with params: {
  actor: <user-uuid>,
  org: <org-uuid>,
  policy_name: "Annual Leave Policy",
  leave_type: "ANNUAL"
}

🔍 [useHeraLeave] CREATE result: {
  hasError: false,
  hasData: true,
  success: true,
  action: "CREATE",
  entityId: <uuid>,
  fullResult: { ... }
}
```

---

## 📁 Files Modified

### `/src/hooks/useHeraLeave.ts`
- **Line 5**: Fixed import path
- **Lines 202-213**: Fixed policies READ operation
- **Lines 232-244**: Fixed staff READ operation
- **Lines 279-320**: Fixed policies data transformation
- **Lines 322-354**: Fixed staff data transformation
- **Lines 486-602**: Fixed policy CREATE operation with:
  - Correct parameter structure
  - SIMPLE format dynamic fields
  - Correct smart code format (lowercase `.v1`)
  - Debug logging
  - Error handling

---

## ✅ Verification Checklist

Before marking as complete, verify:

- [ ] ✅ Import path uses `@/lib/universal-api-v2-client`
- [ ] ✅ All RPC calls have correct parameter structure
- [ ] ✅ `entity_type` is inside `p_entity` object
- [ ] ✅ Dynamic fields use SIMPLE format `{value, type, smart_code}`
- [ ] ✅ Empty relationships use `{}` not `[]`
- [ ] ✅ Options use `include_dynamic` not `include_dynamic_data`
- [ ] ✅ READ operations include `p_actor_user_id`
- [ ] ✅ Data transformation handles `data.list` format
- [ ] ✅ Dynamic data array converted to object
- [ ] ✅ All smart codes use lowercase `.v1`
- [ ] ✅ No underscores/snake_case in smart codes
- [ ] ✅ Debug logging added to CREATE operation
- [ ] ✅ Error handling checks both `error` and `success` flag

---

## 🎓 Key Learnings

### 1. Always Reference Working Examples
The `/salon/services` page implementation is production-proven and should be the reference for:
- RPC parameter structure
- Smart code format
- Dynamic field handling
- Relationship management

### 2. Smart Code Format is Standardized
- UPPERCASE segments
- Dots as separators (no underscores)
- Lowercase version suffix `.v1`
- Pattern: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v1`

### 3. RPC Response Structure
- Orchestrator returns `data.list` (not `data.items`)
- Each item has `{entity, dynamic_data[], relationships[]}`
- Dynamic data is array of typed fields
- Must convert array to object for easy access

### 4. Parameter Structure Matters
- `entity_type` must be inside `p_entity` object
- Dynamic fields require `{value, type, smart_code}` format
- Relationships must be object with type keys
- Actor user ID required for ALL operations (including READ)

---

## 🚀 Next Steps

1. **Test in Development**:
   - Run the application
   - Create a test policy
   - Verify database state
   - Check console logs

2. **Verify Data Display**:
   - Ensure policies appear in list
   - Check all dynamic fields display correctly
   - Verify relationships work

3. **Test Full Workflow**:
   - Create policy
   - Edit policy
   - Archive policy
   - Restore policy
   - Delete policy (with proper fallback to archive)

4. **Production Deployment**:
   - Verify all tests pass
   - Check build succeeds
   - Deploy to staging first
   - Monitor for errors
   - Deploy to production

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Status**: ✅ **COMPLETE - ALL FIXES APPLIED**
