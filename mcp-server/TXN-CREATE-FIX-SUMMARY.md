# hera_txn_create_v1 Testing & Fix Summary

## 🔍 Problem Identified

The API endpoint `/api/v2/universal/txn-emit` was calling `hera_txn_create_v1` with the **wrong parameter signature**.

### ❌ What Was Wrong:
```typescript
// API was calling with 27+ individual parameters
await callFunction('hera_txn_create_v1', {
  p_organization_id: ...,
  p_transaction_type: ...,
  p_smart_code: ...,
  p_transaction_code: ...,
  p_transaction_date: ...,
  // ... 22 more parameters
})
```

### ✅ Correct Function Signature:
```sql
CREATE OR REPLACE FUNCTION hera_txn_create_v1(
  p_header jsonb,         -- All header fields as JSON object
  p_lines jsonb,          -- All lines as JSON array
  p_actor_user_id uuid    -- Optional user ID
)
RETURNS jsonb
```

## 🛠️ Fixes Applied

### 1. Updated API Route
**File**: `/src/app/api/v2/universal/txn-emit/route.ts`

**Changes**:
- Restructured parameters to match function signature
- Header fields → `p_header` (jsonb object)
- Transaction lines → `p_lines` (jsonb array)
- Actor user ID → `p_actor_user_id` (uuid)

```typescript
// ✅ AFTER FIX
const p_header = {
  organization_id: body.organization_id,
  transaction_type: body.transaction_type,
  smart_code: body.smart_code,
  transaction_code: body.transaction_number ?? `TXN-${Date.now()}`,
  transaction_date: body.transaction_date ?? new Date().toISOString(),
  // ... all header fields
}

const p_lines = body.lines ?? []
const p_actor_user_id = body.actor_user_id ?? null

await callFunction('hera_txn_create_v1', {
  p_header,
  p_lines,
  p_actor_user_id
})
```

### 2. Updated Documentation
**File**: `/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md`

**Changes**:
- Added complete function signature
- Documented p_header structure (32 fields)
- Documented p_lines structure (10 fields)
- Added usage examples
- Added important notes about auto-calculation and normalization

### 3. Created Test Scripts
**Files Created**:
1. `/mcp-server/test-txn-functions.cjs` - Comprehensive test suite
2. `/mcp-server/test-txn-create-final.cjs` - Focused create test

## 📊 Test Results

### Function Availability:
| Function | Status |
|----------|--------|
| `hera_txn_create_v1` | ✅ EXISTS (needs column fix) |
| `hera_txn_read_v1` | ✅ EXISTS |
| `hera_txn_query_v1` | ✅ EXISTS |
| `hera_txn_reverse_v1` | ✅ EXISTS |
| `hera_txn_validate_v1` | ✅ EXISTS |

### Known Issues:
⚠️ **Function has column reference error**:
- References `debit_amount` column which doesn't exist
- Should use `line_amount` instead
- This is in the SQL function provided by user

## 🔧 Remaining Issue

The SQL function provided has a bug referencing non-existent columns. The actual table schema uses:

**universal_transaction_lines columns**:
- `unit_amount` (NOT unit_price)
- `line_amount` (NOT debit_amount)
- `entity_id` (NOT line_entity_id)

The SQL function needs to be corrected to match the actual schema.

## ✅ What's Fixed

1. ✅ API parameter structure now matches function signature
2. ✅ Documentation updated with correct usage
3. ✅ Test scripts created for validation
4. ✅ Both `/api/v2/transactions` and `/api/v2/universal/txn-emit` routes fixed

## 🚀 Next Steps

1. **Deploy Corrected SQL Function**
   - Fix column references in the SQL function
   - Use actual schema column names
   - Deploy to Supabase

2. **Test End-to-End**
   ```bash
   cd mcp-server
   node test-txn-create-final.cjs
   ```

3. **Verify in Application**
   - Create an appointment
   - Verify transaction is created correctly
   - Check transaction lines are saved

## 📝 Summary

**Root Cause**: Parameter signature mismatch between API and database function

**Impact**: All transaction creation was failing with "function not found" error

**Resolution**: Updated API to use correct 3-parameter signature with JSONB objects

**Status**: ✅ API FIXED | ⚠️ SQL FUNCTION NEEDS COLUMN FIX
