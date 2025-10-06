# Appointments Proper RPC Fix - Using Correct Wrapper Functions

**Date**: October 6, 2025
**Issue**: Not using the proper HERA RPC wrapper functions
**Root Cause**: Calling endpoints directly instead of using universal-api-v2-client wrappers

---

## 🔍 The Discovery

After reviewing the codebase, I found that HERA has **proper RPC wrapper functions** in `universal-api-v2-client.ts` that we should be using instead of direct fetch calls.

### The Proper RPC Chain

```typescript
// 1. Application calls wrapper function
import { getTransactions } from '@/lib/universal-api-v2-client'
const txns = await getTransactions({ orgId, transactionType: 'APPOINTMENT' })

// 2. Wrapper calls v2 API endpoint
// universal-api-v2-client.ts:
fetch(`/api/v2/transactions?...`)

// 3. v2 endpoint delegates to RPC endpoint
// /api/v2/transactions/route.ts GET:
universalPath = '/api/v2/universal/txn-query'

// 4. RPC endpoint calls database function
// /api/v2/universal/txn-query/route.ts:
await supabase.rpc('hera_txn_query_v1', { p_org_id, p_filters })

// 5. Database function executes
// /database/functions/v2/txn-crud.sql:
CREATE FUNCTION hera_txn_query_v1(p_org_id UUID, p_filters JSONB)
```

---

## 🔧 The Fix

### Before (Wrong) - Direct Endpoint Calls

```typescript
// ❌ WRONG: Calling RPC endpoint directly
const response = await fetch('/api/v2/universal/txn-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ organization_id, transaction_type: 'APPOINTMENT' })
})
```

### After (Correct) - Using Wrapper Functions

```typescript
// ✅ CORRECT: Using proper RPC wrapper
import { getTransactions, getEntities } from '@/lib/universal-api-v2-client'

// Fetch transactions
const transactions = await getTransactions({
  orgId: organizationId,
  transactionType: 'APPOINTMENT'  // UPPERCASE - server-side filtering
})

// Fetch entities
const customers = await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'CUSTOMER',  // UPPERCASE
  p_status: null,  // Get all statuses
  p_include_dynamic: false,
  p_include_relationships: false
})
```

---

## ✅ What's Now Correct

### 1. Transaction Fetching ✅
```typescript
// Uses getTransactions() from universal-api-v2-client
// → Calls /api/v2/transactions GET
//   → Delegates to /api/v2/universal/txn-query POST
//     → Calls hera_txn_query_v1 RPC
```

**Benefits**:
- ✅ Automatic auth headers injection
- ✅ Organization context handling
- ✅ Error handling and validation
- ✅ Response normalization (handles both array and {data:[]} formats)
- ✅ Server-side transaction_type filtering via RPC

### 2. Entity Fetching ✅
```typescript
// Uses getEntities() from universal-api-v2-client
// → Calls /api/v2/entities GET
//   → Calls hera_entity_read_v1 RPC
```

**Benefits**:
- ✅ Automatic auth headers injection
- ✅ Organization context handling
- ✅ Entity type filtering via RPC parameters
- ✅ Status filtering support
- ✅ Dynamic data and relationships support

---

## 📊 Complete Architecture

```
useHeraAppointments Hook
  │
  ├─ getTransactions({ orgId, transactionType: 'APPOINTMENT' })
  │   └─ /api/v2/transactions GET
  │       └─ /api/v2/universal/txn-query POST
  │           └─ hera_txn_query_v1 RPC
  │               └─ SELECT FROM universal_transactions WHERE transaction_type = 'APPOINTMENT'
  │
  ├─ getEntities({ p_entity_type: 'CUSTOMER' })
  │   └─ /api/v2/entities GET
  │       └─ hera_entity_read_v1 RPC
  │           └─ SELECT FROM core_entities WHERE entity_type = 'CUSTOMER'
  │
  ├─ getEntities({ p_entity_type: 'STAFF' })
  │   └─ /api/v2/entities GET
  │       └─ hera_entity_read_v1 RPC
  │           └─ SELECT FROM core_entities WHERE entity_type = 'STAFF'
  │
  └─ getEntities({ p_entity_type: 'staff' })
      └─ /api/v2/entities GET
          └─ hera_entity_read_v1 RPC
              └─ SELECT FROM core_entities WHERE entity_type = 'staff'
```

---

## 🎯 Key Benefits

### 1. Proper Abstraction Layers
- **Application Layer**: Calls simple wrapper functions
- **API Layer**: Handles auth, validation, delegation
- **RPC Layer**: Database functions with business logic
- **Database Layer**: Actual data queries

### 2. Automatic Features
- ✅ **Auth Headers**: Automatically injected with Supabase session
- ✅ **Organization Context**: Passed via `x-hera-org` header
- ✅ **Error Handling**: Consistent error responses
- ✅ **Response Normalization**: Works with different response formats
- ✅ **Type Safety**: TypeScript interfaces for all parameters

### 3. Maintainability
- ✅ **Single Source of Truth**: All RPC calls go through wrappers
- ✅ **Easy Updates**: Change implementation in one place
- ✅ **Consistent Patterns**: Same approach across all hooks
- ✅ **Testing**: Easier to mock wrapper functions than fetch calls

---

## 📝 Files Modified

1. ✅ `/src/hooks/useHeraAppointments.ts` - Now uses proper RPC wrappers
   - `getTransactions()` for appointment transactions
   - `getEntities()` for customers and staff

2. ✅ `/src/app/api/v2/transactions/route.ts` - Fixed two critical issues
   - Now supports both `p_organization_id` and `organization_id` parameters (403 fix)
   - Converts GET → POST when delegating to txn-query endpoint (500 fix)
   - Matches the entities endpoint pattern for consistency

3. ✅ `/src/lib/universal-api-v2-client.ts` - Fixed response parsing
   - Updated `getTransactions()` to handle `body.transactions` format
   - Now supports multiple response formats for flexibility

4. ✅ `/APPOINTMENTS-PROPER-RPC-FIX.md` - This documentation

---

## 🐛 Bug Fixes Applied

### Bug Fix #1: 403 Forbidden Error

**Problem**: After implementing the RPC wrapper functions, getting "Failed to load resource: the server responded with a status of 403 (Forbidden)" error.

**Root Cause**: Parameter naming mismatch between wrapper functions and API endpoints:
- **Wrapper functions** (`universal-api-v2-client.ts`): Send `p_organization_id` in query parameters
- **Transactions endpoint** (`/api/v2/transactions/route.ts`): Only checked for `organization_id` (without `p_` prefix)
- **Entities endpoint** (`/api/v2/entities/route.ts`): Already supported both `p_organization_id` and `organization_id`

**Solution**: Updated `/api/v2/transactions/route.ts` to support both parameter naming conventions:

```typescript
// Before (line 84)
const organizationId = searchParams.get('organization_id')

// After (line 85)
const organizationId = searchParams.get('p_organization_id') || searchParams.get('organization_id')
```

**Verification**:
- ✅ Wrapper functions send `p_organization_id`
- ✅ Transactions endpoint now accepts both `p_organization_id` and `organization_id`
- ✅ Organization isolation still enforced: `organizationId !== authResult.organizationId` returns 403
- ✅ Consistent with entities endpoint parameter handling

---

### Bug Fix #2: 500 Internal Server Error - HTTP Method Mismatch

**Problem**: After fixing the 403 error, getting "Failed to load resource: the server responded with a status of 500 (Internal Server Error)" when calling `/api/v2/transactions?p_organization_id=XXX&p_transaction_type=APPOINTMENT`

**Root Cause**: HTTP method mismatch in delegation chain:
- **Wrapper function** (`getTransactions()`): Makes **GET** request to `/api/v2/transactions`
- **Transactions endpoint**: Delegates to `/api/v2/universal/txn-query` with **GET** method
- **txn-query endpoint**: Only has **POST** handler, no GET handler!

**Solution**: Updated `/api/v2/transactions/route.ts` GET handler to convert query parameters to POST body when delegating to txn-query:

```typescript
// Before - Tried to call non-existent GET handler
const universalRequest = new NextRequest(
  new URL(universalPath + '?' + searchParams.toString(), request.url),
  { method: 'GET', headers: request.headers }
)
const { GET: universalHandler } = await import('../universal/txn-query/route')  // ❌ Doesn't exist!
return await universalHandler(universalRequest)

// After - Converts GET params to POST body
const body: any = { organization_id: organizationId }
const transactionType = searchParams.get('p_transaction_type') || searchParams.get('transaction_type')
if (transactionType) body.transaction_type = transactionType
// ... extract all other parameters

const universalRequest = new NextRequest(new URL(universalPath, request.url), {
  method: 'POST',  // ✅ Use POST method
  headers: request.headers,
  body: JSON.stringify(body)
})

const { POST: universalHandler } = await import('../universal/txn-query/route')  // ✅ POST handler exists!
return await universalHandler(universalRequest)
```

**Supported Parameters Converted**:
- `organization_id` (required)
- `transaction_type` - Filter by transaction type (e.g., "APPOINTMENT")
- `source_entity_id` - Filter by source entity (customer)
- `target_entity_id` - Filter by target entity (staff)
- `smart_code_like` - Filter by smart code pattern
- `date_from` / `date_to` - Date range filters
- `limit` / `offset` - Pagination
- `include_lines` - Include transaction lines

**Verification**:
- ✅ Wrapper function makes GET request with query parameters
- ✅ Transactions endpoint converts GET → POST when delegating to txn-query
- ✅ txn-query receives proper POST request with JSON body
- ✅ RPC function `hera_txn_query_v1` executes successfully
- ✅ Transactions filtered by type at database level (server-side filtering)

---

### Bug Fix #3: 0 Transactions Returned - Response Parsing Issue

**Problem**: After fixing both 403 and 500 errors, API call succeeds but returns 0 transactions. Console shows:
```
[useHeraAppointments] Final summary: {transactions: 0, appointments: 0, filtered: 0, customersLoaded: true, staffUpperLoaded: true}
```

**Root Cause**: Response format mismatch between endpoint and wrapper function:
- **txn-query endpoint** returns: `{ api_version: 'v2', transactions: [...], total, limit, offset }`
- **Wrapper function** was checking: `body.data ?? []`
- **Result**: Missing the `transactions` array, returning empty array instead

**Solution**: Updated `getTransactions()` in `universal-api-v2-client.ts` to support multiple response formats:

```typescript
// Before (line 338)
const body = await res.json()
return Array.isArray(body) ? body : (body.data ?? [])

// After (lines 337-342)
const body = await res.json()
// Support multiple response formats:
// 1. Direct array: [...]
// 2. { data: [...] }
// 3. { transactions: [...] } (from txn-query endpoint)
return Array.isArray(body) ? body : (body.transactions ?? body.data ?? [])
```

**Verification**:
- ✅ Checks `body.transactions` first (txn-query format)
- ✅ Falls back to `body.data` (entities format)
- ✅ Falls back to `[]` if neither exists
- ✅ Supports direct array responses for backward compatibility
- ✅ Now correctly extracts transactions from txn-query response

---

## 🔍 RPC Functions Used

### From `/database/functions/v2/txn-crud.sql`:

**`hera_txn_query_v1(p_org_id UUID, p_filters JSONB)`**
- Filters: source_entity_id, target_entity_id, transaction_type, smart_code_like, date_from, date_to
- Returns: Paginated transactions with metadata
- Security: Organization isolation enforced

### From `/database/functions/v2/hera_entity_read_v1.sql`:

**`hera_entity_read_v1(p_organization_id UUID, p_entity_type TEXT, ...)`**
- Filters: entity_type, status, parent_entity_id, smart_code
- Optional: include_dynamic, include_relationships
- Returns: Entities with optional dynamic data and relationships
- Security: Organization isolation enforced

---

## 🎓 HERA Development Principles Applied

### 1. Use Wrapper Functions, Not Direct Calls ✅
```typescript
// ❌ DON'T
await fetch('/api/v2/universal/txn-query', {...})

// ✅ DO
await getTransactions({...})
```

### 2. Let Wrappers Handle Auth ✅
```typescript
// ❌ DON'T manually get auth headers
const { data: { session } } = await supabase.auth.getSession()
const headers = { Authorization: `Bearer ${session.access_token}` }

// ✅ DO let wrapper handle it
await getTransactions({...})  // Auth automatic
```

### 3. Trust the Abstraction Layers ✅
```typescript
// ✅ Application calls wrapper
const txns = await getTransactions({...})

// Wrapper → API → RPC → Database
// Each layer handles its responsibility
```

### 4. Use Uppercase Entity/Transaction Types ✅
```typescript
// ✅ Always uppercase for standards
transactionType: 'APPOINTMENT'
p_entity_type: 'CUSTOMER'
p_entity_type: 'STAFF'
```

---

## 🚀 Expected Results

When you navigate to `/appointments`:

1. **Console Logs**:
```
[useHeraAppointments] Fetching with getTransactions RPC: { transaction_type: 'APPOINTMENT', organizationId: '...' }
[useHeraAppointments] RPC Response: { count: 33, first: {...} }

[useHeraAppointments] Fetching CUSTOMER entities with RPC
[useHeraAppointments] Customers response: { count: 10 }

[useHeraAppointments] Fetching STAFF entities with RPC
[useHeraAppointments] Staff (UPPER) response: { count: 0 }

[useHeraAppointments] Fetching staff entities (lowercase) with RPC
[useHeraAppointments] Staff (lower) response: { count: 7 }

[useHeraAppointments] Staff map: { total: 7, sample: [...] }

[useHeraAppointments] Final summary: { transactions: 33, appointments: 33, filtered: 33, isFullyLoaded: true }
```

2. **UI Displays**:
- ✅ All 33 appointments load
- ✅ Customer names display correctly
- ✅ Staff names display correctly
- ✅ Appointment details (times, status) show correctly

---

## 💡 Why This Matters

### Performance
- ✅ **Server-side filtering**: Database filters by transaction_type, not JavaScript
- ✅ **Optimized queries**: RPC functions use proper indexes
- ✅ **Connection pooling**: Managed by Supabase client

### Security
- ✅ **Organization isolation**: RPC enforces `WHERE organization_id = p_org_id`
- ✅ **Auth verification**: Middleware checks JWT before RPC call
- ✅ **SQL injection prevention**: Parameterized RPC calls

### Maintainability
- ✅ **Single code path**: All appointments use same RPC
- ✅ **Easy debugging**: Clear call stack from hook → wrapper → API → RPC
- ✅ **Future updates**: Change RPC implementation without touching hook

---

## 🎯 Summary

**Before**:
- ❌ Direct fetch() calls to RPC endpoints
- ❌ Manual auth header construction
- ❌ Bypassed proper abstraction layers
- ❌ Client-side filtering (inefficient)
- ❌ Parameter naming mismatch causing 403 errors
- ❌ HTTP method mismatch causing 500 errors
- ❌ Response parsing mismatch returning 0 transactions

**After**:
- ✅ Proper RPC wrapper functions (`getTransactions`, `getEntities`)
- ✅ Automatic auth header injection
- ✅ Proper abstraction layers (App → Wrapper → API → RPC → DB)
- ✅ Server-side filtering via RPC parameters
- ✅ Uppercase transaction_type and entity_type
- ✅ Organization isolation enforced at all layers
- ✅ Parameter naming compatibility (`p_organization_id` and `organization_id` both supported)
- ✅ HTTP method conversion (GET → POST when needed for RPC delegation)
- ✅ Response format handling (supports `transactions`, `data`, and direct arrays)

---

**Status**: ✅ COMPLETE - Now using proper HERA RPC wrapper pattern
**Architecture**: ✅ CORRECT - Full abstraction chain implemented
**Performance**: ✅ OPTIMIZED - Server-side filtering via RPC
**Bug Fixes**: ✅ RESOLVED - Fixed all three critical bugs:
  - **Bug #1**: 403 Forbidden (parameter naming mismatch)
  - **Bug #2**: 500 Internal Error (HTTP method mismatch)
  - **Bug #3**: 0 Transactions (response parsing mismatch)

## 🔄 Complete Request Flow (Now Working)

```
1. UI Component (useHeraAppointments)
   ↓ calls getTransactions({ orgId, transactionType: 'APPOINTMENT' })

2. Wrapper Function (universal-api-v2-client.ts)
   ↓ GET /api/v2/transactions?p_organization_id=XXX&p_transaction_type=APPOINTMENT
   ↓ includes: x-hera-org header + Authorization bearer token

3. Transactions Endpoint (/api/v2/transactions/route.ts)
   ↓ validates organization_id (supports both p_ and non-p_ parameters)
   ↓ converts GET request → POST request with JSON body
   ↓ delegates to /api/v2/universal/txn-query

4. Universal RPC Endpoint (/api/v2/universal/txn-query/route.ts)
   ↓ validates request body against schema
   ↓ calls supabase.rpc('hera_txn_query_v1', { p_org_id, p_filters })

5. Database RPC Function (hera_txn_query_v1)
   ↓ filters transactions by organization_id and transaction_type
   ↓ returns paginated results with metadata

6. Response Chain (bubbles back up)
   ← txn-query returns: { api_version: 'v2', transactions: [...], total, limit, offset }
   ← transactions endpoint passes through response
   ← wrapper function extracts body.transactions (or body.data as fallback)
   ← useHeraAppointments receives transactions array with all appointment data
   ← Hook enriches transactions with customer/staff names from entity lookups
   ← UI displays appointments with customer names, staff names, times, status
```

## ✅ Expected Console Output (After All Fixes)

```javascript
[useHeraAppointments] Fetching with getTransactions RPC: { transaction_type: 'APPOINTMENT', organizationId: '...' }
[useHeraAppointments] RPC Response: { count: 33, first: { id: '...', transaction_type: 'APPOINTMENT', ... } }

[useHeraAppointments] Fetching CUSTOMER entities with RPC
[useHeraAppointments] Customers response: { count: 10 }

[useHeraAppointments] Fetching STAFF entities with RPC
[useHeraAppointments] Staff (UPPER) response: { count: 0 }

[useHeraAppointments] Fetching staff entities (lowercase) with RPC
[useHeraAppointments] Staff (lower) response: { count: 7 }

[useHeraAppointments] Staff map: { total: 7, sample: [...] }

[useHeraAppointments] Final summary: {
  transactions: 33,
  appointments: 33,
  filtered: 33,
  customersLoaded: true,
  staffUpperLoaded: true,
  staffLowerLoaded: true,
  isFullyLoaded: true
}
```
