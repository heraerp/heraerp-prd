# Leave Policy RPC Parameter Fix - Complete

**Date**: October 24, 2025
**Status**: ✅ **FIXED - Correct RPC Parameters**

---

## 🐛 Issue Discovered

The `useHeraLeave` hook was calling `hera_entities_crud_v1` with incorrect parameter format that doesn't match the official RPC function signature.

### ❌ Incorrect Parameters (Before)

```typescript
await callRPC('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: user.id,
  p_organization_id: organizationId,
  p_entity_type: 'LEAVE_POLICY',  // ❌ WRONG: Separate parameter
  p_entity: {
    entity_name: data.policy_name,
    smart_code: '...',
    status: 'active'
  },
  p_dynamic: {
    leave_type: data.leave_type,  // ❌ WRONG: Direct values
    annual_entitlement: data.annual_entitlement
  },
  p_relationships: [],  // ❌ WRONG: Array format
  p_options: {
    include_dynamic_data: true,  // ❌ WRONG: Property name
  }
})
```

**Problems**:
1. ❌ `p_entity_type` as separate parameter (should be inside `p_entity`)
2. ❌ `p_dynamic` fields as direct values (should be `{value, type, smart_code}` objects)
3. ❌ `p_relationships` as array (should be object with relationship type keys)
4. ❌ `include_dynamic_data` option name (should be `include_dynamic`)
5. ❌ Missing `p_actor_user_id` in READ operations

---

## ✅ Correct Parameters (After)

According to `/docs/api/v2/RPC_FUNCTIONS_GUIDE.md`, the correct format is:

### CREATE Operation

```typescript
await callRPC('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: user.id,
  p_organization_id: organizationId,
  p_entity: {
    entity_type: 'LEAVE_POLICY',  // ✅ CORRECT: Inside p_entity
    entity_name: data.policy_name,
    smart_code: 'HERA.SALON.LEAVE.POLICY.ANNUAL.v1',
    status: 'active'
  },
  p_dynamic: {
    // ✅ CORRECT: SIMPLE format with {value, type, smart_code}
    annual_entitlement: {
      value: String(data.annual_entitlement),
      type: 'number',
      smart_code: 'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.V1'
    },
    leave_type: {
      value: data.leave_type,
      type: 'text',
      smart_code: 'HERA.SALON.LEAVE.FIELD.TYPE.V1'
    }
  },
  p_relationships: {},  // ✅ CORRECT: Empty object for no relationships
  p_options: {
    include_dynamic: true,  // ✅ CORRECT: include_dynamic
    include_relationships: false
  }
})
```

### READ Operation

```typescript
await callRPC('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: user.id,  // ✅ CORRECT: Required for all operations
  p_organization_id: organizationId,
  p_entity: {
    entity_type: 'LEAVE_POLICY'  // ✅ CORRECT: Inside p_entity
  },
  p_options: {
    include_dynamic: true,  // ✅ CORRECT: include_dynamic
    include_relationships: false
  }
})
```

---

## 🔧 Fixes Applied

### 1. Fixed CREATE Operation (`useHeraLeave.ts` lines 436-524)

**Changes**:
- Moved `entity_type` inside `p_entity` object
- Converted all `p_dynamic` fields to SIMPLE format `{value, type, smart_code}`
- Changed `p_relationships` from array `[]` to object `{}`
- Changed option from `include_dynamic_data` to `include_dynamic`

**Dynamic Fields with Smart Codes**:
```typescript
{
  leave_type: { value: 'ANNUAL', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.TYPE.V1' },
  annual_entitlement: { value: '30', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.V1' },
  carry_over_cap: { value: '5', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.CARRYOVER.V1' },
  min_notice_days: { value: '7', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.NOTICE.V1' },
  max_consecutive_days: { value: '15', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.MAXDAYS.V1' },
  min_leave_days: { value: '0.5', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.MINDAYS.V1' },
  accrual_method: { value: 'MONTHLY', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.ACCRUAL.V1' },
  probation_period_months: { value: '3', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.PROBATION.V1' },
  applies_to: { value: 'ALL', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.APPLIES.V1' },
  effective_from: { value: '2025-01-01T00:00:00Z', type: 'date', smart_code: 'HERA.SALON.LEAVE.FIELD.EFFECTIVEFROM.V1' },
  description: { value: 'Annual leave policy', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.DESCRIPTION.V1' },
  active: { value: 'true', type: 'boolean', smart_code: 'HERA.SALON.LEAVE.FIELD.ACTIVE.V1' }
}
```

### 2. Fixed READ Operations (lines 202-213, 232-244)

**Policies Query**:
```typescript
await callRPC('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: user?.id || '',  // ✅ Added
  p_organization_id: organizationId,
  p_entity: {
    entity_type: 'LEAVE_POLICY'  // ✅ Fixed
  },
  p_options: {
    include_dynamic: true,  // ✅ Fixed
    include_relationships: false
  }
})
```

**Staff Query**:
```typescript
await callRPC('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: user?.id || '',  // ✅ Added
  p_organization_id: organizationId,
  p_entity: {
    entity_type: 'STAFF',  // ✅ Fixed
    status: 'active'  // ✅ Filter by status
  },
  p_options: {
    include_dynamic: true,  // ✅ Fixed
    include_relationships: false
  }
})
```

### 3. Updated Query Enable Conditions

```typescript
enabled: !!organizationId && !!user?.id  // ✅ Now requires user.id
```

---

## 📊 Parameter Format Comparison

| Parameter | ❌ Before | ✅ After |
|-----------|----------|----------|
| **entity_type** | `p_entity_type: 'LEAVE_POLICY'` | `p_entity: { entity_type: 'LEAVE_POLICY' }` |
| **Dynamic fields** | `p_dynamic: { price: 99.99 }` | `p_dynamic: { price: { value: '99.99', type: 'number', smart_code: '...' } }` |
| **Relationships** | `p_relationships: []` | `p_relationships: {}` or `{ TYPE: ['id1', 'id2'] }` |
| **Options** | `include_dynamic_data: true` | `include_dynamic: true` |
| **READ actor** | Missing | `p_actor_user_id: user.id` (required) |

---

## 🎯 Key Learnings

### 1. RPC Function Signature (Official)

```sql
CREATE OR REPLACE FUNCTION hera_entities_crud_v1(
  p_action            text,          -- 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id     uuid,          -- WHO (required for ALL actions)
  p_organization_id   uuid,          -- WHERE (required)
  p_entity            jsonb DEFAULT '{}'::jsonb,  -- Entity data including entity_type
  p_dynamic           jsonb DEFAULT '{}'::jsonb,  -- Dynamic fields in SIMPLE format
  p_relationships     jsonb DEFAULT '{}'::jsonb,  -- Relationships as object
  p_options           jsonb DEFAULT '{}'::jsonb   -- Operation options
)
```

### 2. Dynamic Field SIMPLE Format

The orchestrator expects **string values** with type specification:

```typescript
{
  field_name: {
    value: string,      // Always string (converted by RPC)
    type: 'text' | 'number' | 'boolean' | 'date' | 'json',
    smart_code: string  // HERA DNA pattern
  }
}
```

**Type Conversion**:
- Numbers: `String(99.99)` → `"99.99"` → Stored as NUMERIC
- Booleans: `String(true)` → `"true"` → Stored as BOOLEAN
- Dates: ISO string → Stored as TIMESTAMPTZ
- Text: Direct string → Stored as TEXT

### 3. Relationships Format

**Object with Relationship Type Keys**:
```typescript
{
  STAFF_HAS_ROLE: ['role-uuid-1', 'role-uuid-2'],
  ASSIGNED_TO_BRANCH: ['branch-uuid']
}
```

**Empty relationships**:
```typescript
{}  // NOT []
```

### 4. Actor Required for ALL Actions

Even READ operations require `p_actor_user_id` for audit trails and membership validation.

---

## 🔒 Architecture Compliance

### ✅ Standards Met

1. **✅ RPC-First Architecture** - Uses `hera_entities_crud_v1` orchestrator
2. **✅ Actor Stamping** - `p_actor_user_id` included for all operations
3. **✅ Organization Isolation** - `p_organization_id` enforced
4. **✅ Smart Code Validation** - Every dynamic field has smart code
5. **✅ Proper Parameter Format** - Matches official RPC signature
6. **✅ Type Safety** - SIMPLE format ensures correct type conversion

---

## 📁 Files Modified

### `/src/hooks/useHeraLeave.ts`
- **Lines 202-213**: Fixed policies READ operation
- **Lines 232-244**: Fixed staff READ operation
- **Lines 436-524**: Fixed policy CREATE operation with SIMPLE format dynamic fields
- **Lines 218, 249**: Added `user?.id` to query enable conditions

---

## 🧪 Testing Checklist

To verify the fix works correctly:

1. **Navigate to `/salon/leave` → Policies tab**
2. **Click "Configure Policy"**
3. **Fill in policy form**:
   - Policy Name: "Annual Leave Policy"
   - Leave Type: ANNUAL
   - Annual Entitlement: 30
   - Accrual Method: MONTHLY
   - Applies To: ALL
   - Min Notice Days: 7
   - Max Consecutive Days: 15
   - Min Leave Days: 0.5
4. **Click "Create Policy"**
5. **Verify**:
   - ✅ No console errors about wrong parameters
   - ✅ Success toast appears
   - ✅ New policy appears in list
   - ✅ Database has correct `core_entities` entry
   - ✅ Database has correct `core_dynamic_data` entries

### Expected Database State

**`core_entities` table**:
```sql
SELECT * FROM core_entities
WHERE entity_type = 'LEAVE_POLICY'
AND organization_id = 'your-org-id'
ORDER BY created_at DESC LIMIT 1;
```

**`core_dynamic_data` table**:
```sql
SELECT field_name, field_type, field_value_text, field_value_number, field_value_boolean, smart_code
FROM core_dynamic_data
WHERE entity_id = 'policy-entity-id'
ORDER BY field_name;
```

Should contain 11+ rows with correct field types and smart codes.

---

## ✅ Final Status

### All Parameters Now Correct

- ✅ `entity_type` inside `p_entity` object
- ✅ Dynamic fields in SIMPLE format with smart codes
- ✅ Relationships as object (not array)
- ✅ Correct option names (`include_dynamic`)
- ✅ Actor required for READ operations
- ✅ Query enable conditions check for user

### Build Status

- ✅ Import errors fixed (`callRPC` from correct location)
- ✅ Parameter format corrected (matches RPC signature)
- ✅ Ready for build and deployment

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Status**: ✅ **FIXED - PARAMETERS CORRECT**
