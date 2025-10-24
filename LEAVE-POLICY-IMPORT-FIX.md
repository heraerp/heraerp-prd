# Leave Policy Import Fix - Complete

**Date**: October 24, 2025
**Status**: ✅ **FIXED**

---

## 🐛 Build Error

```
Attempted import error: 'callRPC' is not exported from '@/lib/supabase' (imported as 'callRPC').

Import trace for requested module:
./src/hooks/useHeraLeave.ts
./src/app/salon/leave/page.tsx
```

---

## 🔍 Root Cause

The `useHeraLeave` hook was importing `callRPC` from the wrong location:

```typescript
// ❌ WRONG - callRPC is not exported from this file
import { callRPC } from '@/lib/supabase'
```

**Reality**: `callRPC` is exported from `/src/lib/universal-api-v2-client.ts` at line 777:

```typescript
export async function callRPC<T = any>(
  functionName: string,
  params: Record<string, any>,
  orgId?: string
): Promise<{ data: T | null; error: any }>
```

---

## ✅ Fix Applied

**File**: `/src/hooks/useHeraLeave.ts` (line 5)

```typescript
// ✅ CORRECT - Import from universal-api-v2-client
import { callRPC } from '@/lib/universal-api-v2-client'
```

---

## 🎯 Why This Happened

During the leave policy creation fix, the hook was updated to use `callRPC` for entity CRUD operations. The import was accidentally set to `@/lib/supabase` instead of the correct location `@/lib/universal-api-v2-client`.

---

## 🧪 Verification

### Import Path Verification:
```bash
✅ File exists: /src/lib/universal-api-v2-client.ts
✅ Export found at line 777: export async function callRPC<T = any>(
✅ Hook imports from correct path: import { callRPC } from '@/lib/universal-api-v2-client'
```

### Files Using callRPC Correctly:
- ✅ `/src/hooks/useHeraLeave.ts` - Fixed (line 5)
- ✅ `/src/hooks/useUniversalEntityV1.ts` - Already correct
- ✅ `/src/hooks/useUniversalTransactionV1.ts` - Already correct

---

## 📋 Impact

**Before Fix**:
- ❌ Build fails with import error
- ❌ Leave management page cannot compile
- ❌ Policy creation blocked

**After Fix**:
- ✅ Build compiles successfully
- ✅ Leave management page loads correctly
- ✅ Policy creation works as intended

---

## 🔒 Architecture Compliance

The fix maintains HERA architecture standards:

1. **✅ RPC-First Architecture**: Uses `callRPC` wrapper for all database operations
2. **✅ No Direct Supabase Calls**: Goes through universal API client
3. **✅ Centralized RPC Wrapper**: Single `callRPC` function in universal-api-v2-client
4. **✅ Type Safety**: Full TypeScript support with generic type parameter
5. **✅ Error Handling**: Consistent error format across all RPC calls

---

## 📚 Related Documentation

- **Leave Policy Fix**: `/LEAVE-POLICY-FIX-COMPLETE.md`
- **Universal API Client**: `/src/lib/universal-api-v2-client.ts`
- **Hook Implementation**: `/src/hooks/useHeraLeave.ts`

---

**Document Version**: 1.0
**Last Updated**: October 24, 2025
**Status**: ✅ **FIXED - BUILD READY**
