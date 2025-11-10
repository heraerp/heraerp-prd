# LTV Update Fix - Summary

## Problem
LTV (Lifetime Value) was showing 0.00 in /salon/customers page even though sales were being completed successfully. Database showed 0 LTV records in `core_dynamic_data` table.

## Root Cause
The `customer-ltv-service.ts` was using the **WRONG format** for `hera_entities_crud_v1` RPC's `p_dynamic` parameter.

### Wrong Format (Database Column Format)
```typescript
p_dynamic: {
  lifetime_value: {
    field_type: 'number',          // ❌ WRONG
    field_value_number: finalLTV,  // ❌ WRONG
    smart_code: SMART_CODE_LTV
  }
}
```

###  Correct Format (Simple Format)
```typescript
p_dynamic: {
  lifetime_value: {
    value: finalLTV.toString(),  // ✅ CORRECT: String representation
    type: 'number',              // ✅ CORRECT: Simple property name
    smart_code: SMART_CODE_LTV   // ✅ CORRECT
  }
}
```

## Reference Implementation
Confirmed correct format by examining `/mcp-server/test-service-dynamic-fields.mjs` (lines 34-63) which successfully creates services with dynamic fields using the SIMPLE format.

## Additional Fix
Also corrected the RPC response structure parsing:

### Before (Wrong)
```typescript
const customer = readResult.data
const dynamicFields = customer.dynamic_fields  // ❌ Wrong path
```

### After (Correct)
```typescript
const responseData = readResult.data
const customer = responseData.entity           // ✅ Correct: nested under .entity
const dynamicData = responseData.dynamic_data  // ✅ Correct: separate array
```

## Files Modified
1. `/src/lib/salon/customer-ltv-service.ts` - Fixed p_dynamic format and response parsing (lines 64-83, 99-116)

## Testing
Created test script `/mcp-server/test-ltv-correct-format.mjs` to verify the correct format works with `hera_entities_crud_v1`.

## Expected Result
After this fix:
1. ✅ Sales will create LTV records in `core_dynamic_data` table
2. ✅ Customer list will show actual LTV values
3. ✅ LTV will increment with each sale
4. ✅ Console will show `[LTV] ✅ Updated` AND database will have matching values

## Verification Steps
1. Complete a new sale in /pos page
2. Check console for `[LTV] ✅ Updated` message
3. Navigate to /customers page
4. Verify customer's LTV shows the correct value
5. Run `node mcp-server/quick-check-ltv.mjs` to verify database has records

## Additional Notes
- The documentation in `/docs/api/v2/RPC_FUNCTIONS_GUIDE.md` shows the SIMPLE format but was not being followed
- The format difference exists because:
  - **RPC input**: Uses SIMPLE format (`value`, `type`, `smart_code`)
  - **Database storage**: Uses column format (`field_type`, `field_value_number`)
  - **RPC handles conversion** internally
