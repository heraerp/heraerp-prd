# Service Creation Error Fix - useUniversalEntityV1 Response Handling

## 🐛 Issue Description

**Error:** Service creation was failing with the following console warnings:
```
[useUniversalEntityV1] ❌ No entity in response: Object
[useUniversalEntityV1] ⚠️ RPC returned success but no entity - will trigger refetch
[useUniversalEntityV1] ⚠️ Entity created but no data returned - triggering refetch
```

**Location:** `/salon/services` page when creating a new service

**Root Cause:** The `useUniversalEntityV1` hook was not properly handling all response formats returned by the `hera_entities_crud_v1` RPC function. Specifically, it was missing handlers for:
- `{ data: { success: true, entity_id: 'uuid' } }` (Format 7)
- `{ success: true, entity_id: 'uuid' }` (Format 8)

## ✅ Solution

Updated `/src/hooks/useUniversalEntityV1.ts` (lines 526-614) to add:

1. **Enhanced logging** to debug response structures:
   ```typescript
   console.log('[useUniversalEntityV1] 📦 Raw CREATE response:', {
     has_data: !!data,
     data_keys: data ? Object.keys(data) : [],
     data_structure: JSON.stringify(data, null, 2).substring(0, 500)
   })
   ```

2. **Two new response format handlers**:

   **Format 7:** Nested RPC success response
   ```typescript
   else if (data?.data?.success && data?.data?.entity_id) {
     console.log('[useUniversalEntityV1] 📦 Format 7: RPC success with entity_id - will refetch')
     createdEntity = {
       id: data.data.entity_id,
       entity_type: entity_type,
       entity_name: entity.entity_name,
       smart_code: entity.smart_code,
       status: entity.status || 'active',
       _incomplete: true  // Triggers refetch
     }
   }
   ```

   **Format 8:** Bare RPC success response
   ```typescript
   else if (data?.success && data?.entity_id) {
     console.log('[useUniversalEntityV1] 📦 Format 8: Bare RPC success with entity_id - will refetch')
     createdEntity = {
       id: data.entity_id,
       entity_type: entity_type,
       entity_name: entity.entity_name,
       smart_code: entity.smart_code,
       status: entity.status || 'active',
       _incomplete: true  // Triggers refetch
     }
   }
   ```

## 🔄 How It Works

When the RPC returns a minimal success response with just `entity_id`:

1. Hook creates a minimal entity object with `_incomplete: true` flag
2. `onSuccess` handler (line 609-620) detects the `_incomplete` flag
3. Triggers immediate refetch to get complete entity data:
   ```typescript
   if ((newEntity as any)._incomplete) {
     console.warn('[useUniversalEntityV1] ⚠️ Entity created but no data returned - triggering refetch')
     await queryClient.invalidateQueries({ queryKey })
     await refetch()
     console.log('✅ [useUniversalEntityV1] Refetch completed after incomplete response')
     return
   }
   ```

## 📊 Supported Response Formats (Complete List)

The hook now handles **8 different response formats** from `hera_entities_crud_v1`:

| Format | Structure | Example | Handler Added |
|--------|-----------|---------|---------------|
| 0 | Nested wrapper | `{ data: { data: { entity: {...}, dynamic_data: [] } } }` | Existing |
| 1 | Direct entity | `{ entity: {...} }` | Existing |
| 2 | Data wrapper (full) | `{ data: { entity: {...}, dynamic_data: [], relationships: [] } }` | Existing |
| 2b | Data wrapper (entity only) | `{ data: { entity: {...} } }` | Existing |
| 3 | Nested data with id | `{ data: { data: {...} } }` where `data.data.id` exists | Existing |
| 4 | Direct object | `{ id: 'uuid', entity_name: '...' }` | Existing |
| 5 | Data is entity | `{ data: { id: 'uuid', entity_name: '...' } }` | Existing |
| 6 | Minimal with entity_id | `{ entity_id: 'uuid' }` | Existing |
| **7** | **Nested RPC success** | **`{ data: { success: true, entity_id: 'uuid' } }`** | **✅ NEW** |
| **8** | **Bare RPC success** | **`{ success: true, entity_id: 'uuid' }`** | **✅ NEW** |

## 🧪 Testing Recommendations

1. **Create a new service** in `/salon/services`:
   - Click "New Service" button
   - Fill in required fields (name, category, price, duration)
   - Save and verify no console errors
   - Verify service appears in the list immediately

2. **Check console logs**:
   - Should see `📦 Raw CREATE response:` with full response structure
   - Should see format detection (e.g., `📦 Format 8: Bare RPC success with entity_id`)
   - Should see `✅ [useUniversalEntityV1] Refetch completed after incomplete response` (if refetch triggered)
   - Should NOT see `❌ No entity in response`

3. **Verify behavior**:
   - Service should appear in the list without page refresh
   - No error toasts or warnings
   - Service data should be complete (all fields visible)

## 🎯 Impact

**Pages affected:** Any page using `useUniversalEntityV1` hook:
- `/salon/services` - Service creation ✅
- `/salon/staff` - Staff creation
- `/salon/customers` - Customer creation
- Any other entity CRUD operations using this hook

**Performance:** Minimal impact - refetch only triggers when incomplete response is returned (which is a graceful fallback)

**Backward compatibility:** ✅ Fully backward compatible - existing response formats still work

## 📝 Related Files

- **Fixed:** `/src/hooks/useUniversalEntityV1.ts` (lines 526-614)
- **RPC Client:** `/src/lib/universal-api-v2-client.ts` (lines 831-882)
- **Calling Page:** `/src/app/salon/services/page.tsx` (lines 395-411)

## 🔗 HERA Standards Compliance

✅ **Follows HERA v2.2 patterns:**
- Actor-based authentication (p_actor_user_id)
- Organization isolation (p_organization_id)
- Smart code validation
- Atomic operations with graceful fallback
- Complete audit trail maintained

✅ **Sacred Six compliance:**
- No schema changes required
- All business data in dynamic_data
- Relationships handled properly
- RPC-first architecture maintained

## ✨ Next Steps

1. ✅ **Deploy to development** - Ready for testing
2. ⏳ **User testing** - Create services and verify no errors
3. ⏳ **Monitor logs** - Watch console for format detection patterns
4. ⏳ **Production deployment** - After successful dev testing

---

**Fixed by:** Claude Code Assistant
**Date:** 2025-10-30
**Priority:** High (Blocks service creation)
**Status:** ✅ READY FOR TESTING
