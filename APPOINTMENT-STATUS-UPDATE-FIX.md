# Appointment Status Update Fix - RPC Pattern Implementation

## 🎯 Problem Summary

**Issues Fixed:**
1. ❌ Appointment status updates were failing silently
2. ❌ Direct `fetch()` calls instead of RPC wrapper functions
3. ❌ `transaction_status` column not being updated (only metadata)
4. ❌ Not following HERA enterprise pattern of using RPC wrappers

## ✅ Solution Implemented

### 1. **API Route Fix** (`/src/app/api/v2/transactions/[id]/route.ts`)

Added proper `transaction_status` column update:

```typescript
// Update transaction_status if provided (CRITICAL for appointments)
if (body.p_status || body.status) {
  updateData.transaction_status = body.p_status || body.status
}
```

**Why Critical:** Previously, status was only updated in `metadata.status`, not in the actual `transaction_status` column that queries filter on.

### 2. **RPC Wrapper Functions** (`/src/lib/universal-api-v2-client.ts`)

Added enterprise-grade RPC wrapper functions:

```typescript
// Update transaction
export async function updateTransaction(
  transactionId: string,
  orgId: string,
  body: {
    p_transaction_date?: string
    p_source_entity_id?: string
    p_target_entity_id?: string | null
    p_total_amount?: number
    p_status?: string              // ✅ Updates transaction_status
    p_metadata?: Json
    p_smart_code?: string
  }
)

// Delete transaction
export async function deleteTransaction(
  transactionId: string,
  orgId: string,
  options?: {
    force?: boolean
  }
)
```

**Benefits:**
- ✅ Centralized authentication handling
- ✅ Consistent error handling
- ✅ Proper organization isolation
- ✅ Automatic header management (`x-hera-api-version`, `Authorization`, `x-hera-org`)

### 3. **Hook Refactor** (`/src/hooks/useHeraAppointments.ts`)

Converted from direct `fetch()` calls to RPC wrappers:

**Before (Direct fetch ❌):**
```typescript
const response = await fetch(`/api/v2/transactions/${id}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify(payload)
})
```

**After (RPC wrapper ✅):**
```typescript
import { updateTransaction, deleteTransaction } from '@/lib/universal-api-v2-client'

const result = await updateTransaction(id, options.organizationId, {
  ...(data.status && { p_status: data.status }), // ✅ Updates transaction_status
  p_metadata: updatedMetadata,
  p_smart_code: `HERA.SALON.APPOINTMENT.UPDATE.${status}.V1`
})
```

## 🔧 Technical Details

### Status Update Flow

1. **Client calls hook:**
   ```typescript
   await updateAppointmentStatus({ id: 'appt-123', status: 'checked_in' })
   ```

2. **Hook validates transition:**
   ```typescript
   if (!canTransitionTo(currentStatus, newStatus)) {
     throw new Error('Invalid transition')
   }
   ```

3. **RPC wrapper adds auth:**
   ```typescript
   const authHeaders = await getAuthHeaders()
   headers: {
     'x-hera-org': orgId,
     'Authorization': `Bearer ${token}`,
     'x-hera-api-version': 'v2'
   }
   ```

4. **API updates both:**
   ```typescript
   updateData.transaction_status = 'checked_in'  // ✅ Column
   updateData.metadata.status = 'checked_in'     // ✅ Metadata
   ```

5. **Query invalidated:**
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['appointment-transactions'] })
   ```

## 📋 Status Workflow

Valid status transitions enforced by `useHeraAppointments`:

```
draft → booked → checked_in → in_progress → payment_pending → completed
  ↓        ↓          ↓
cancelled  no_show  cancelled
```

## 🎯 Enterprise Patterns Followed

### 1. **No Direct Supabase Queries**
- ❌ `supabase.from('universal_transactions').update()`
- ✅ `updateTransaction()` RPC wrapper

### 2. **Centralized Auth Management**
- ❌ Manual token extraction in every component
- ✅ Automatic via `getAuthHeaders()`

### 3. **Proper Error Handling**
- ❌ `if (!response.ok) { throw 'error' }`
- ✅ Structured error responses with context

### 4. **Organization Isolation**
- ❌ Missing `x-hera-org` header
- ✅ Automatic via `h(orgId)` helper

### 5. **Smart Code Integration**
- ❌ Generic smart codes
- ✅ Context-aware: `HERA.SALON.APPOINTMENT.UPDATE.CHECKED_IN.V1`

## 🧪 Testing

### Update Status
```typescript
const { updateAppointmentStatus } = useHeraAppointments({
  organizationId: 'org-123'
})

await updateAppointmentStatus({
  id: 'appt-123',
  status: 'checked_in'
})
```

### Update Full Appointment
```typescript
const { updateAppointment } = useHeraAppointments({
  organizationId: 'org-123'
})

await updateAppointment({
  id: 'appt-123',
  data: {
    status: 'in_progress',
    stylist_id: 'staff-456',
    notes: 'Customer arrived early'
  }
})
```

## 📊 Files Changed

1. **`/src/app/api/v2/transactions/[id]/route.ts`**
   - Added `transaction_status` update handling

2. **`/src/lib/universal-api-v2-client.ts`**
   - Added `updateTransaction()` RPC wrapper
   - Added `deleteTransaction()` RPC wrapper

3. **`/src/hooks/useHeraAppointments.ts`**
   - Imported RPC wrappers
   - Refactored `updateMutation` to use `updateTransaction()`
   - Refactored `deleteMutation` to use `deleteTransaction()`
   - Added `p_status` parameter for transaction_status update

## ✅ Verification Checklist

- [x] No direct `fetch()` calls in hooks
- [x] All updates use RPC wrappers
- [x] `transaction_status` column properly updated
- [x] `metadata.status` also updated for backward compatibility
- [x] Authentication automatic via `getAuthHeaders()`
- [x] Organization isolation via `x-hera-org` header
- [x] Smart codes context-aware
- [x] Status transitions validated
- [x] Query invalidation after mutations

## 🚀 Benefits

1. **Maintainability:** Single source of truth for API calls
2. **Security:** Automatic auth and org isolation
3. **Consistency:** Same patterns across all hooks
4. **Type Safety:** TypeScript interfaces for all RPC calls
5. **Error Handling:** Centralized and structured
6. **Testing:** Easier to mock RPC functions than raw fetch
7. **Performance:** Automatic query invalidation and refetching

## 📝 Notes

- **Breaking Change:** None - API contract unchanged
- **Backward Compatibility:** Full - works with existing code
- **Migration Required:** None - automatic
- **Database Changes:** None - uses existing schema

---

**Status:** ✅ Ready for Production
**Version:** 2025-01-10
**Author:** HERA DNA System
