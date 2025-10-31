# BUG REPORT: hera_txn_crud_v1 UPDATE/READ Failure

## 🚨 CRITICAL: Database RPC Function Bug

### Issue Summary
The `hera_txn_crud_v1` RPC function is failing for both UPDATE and READ operations with a SQL error:

```
column cr.source_entity_id does not exist
```

### Impact
- ✅ **CREATE operations work** - New appointments can be created
- ❌ **READ operations fail** - Cannot fetch existing appointments via RPC
- ❌ **UPDATE operations fail** - Cannot update appointment times (reschedule feature broken)
- ❌ **DELETE operations untested** - Likely affected by same bug

### Error Details

**Error Message:**
```json
{
  "error": "column cr.source_entity_id does not exist",
  "action": "READ|UPDATE",
  "success": false,
  "runtime_version": "v1",
  "membership_validated": false
}
```

**Test Case:**
```javascript
// READ Test
const readPayload = {
  p_action: 'READ',
  p_actor_user_id: 'f0f4ced2-877a-4a0c-8860-f5bc574652f6',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_transaction: {
    transaction_id: '47e2b010-ff0e-406a-b5a2-4b395f0a522d'
  },
  p_lines: [],
  p_options: { include_lines: true }
}

const { data, error } = await supabase.rpc('hera_txn_crud_v1', readPayload)
// Result: error = "column cr.source_entity_id does not exist"

// UPDATE Test
const updatePayload = {
  p_action: 'UPDATE',
  p_actor_user_id: 'f0f4ced2-877a-4a0c-8860-f5bc574652f6',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_transaction: {
    transaction_id: '47e2b010-ff0e-406a-b5a2-4b395f0a522d',
    header: {
      smart_code: 'HERA.SALON.TXN.APPOINTMENT.BOOKED.v1',
      transaction_date: '2025-01-15T14:00:00Z',
      metadata: {
        start_time: '2025-01-15T14:00:00Z',
        end_time: '2025-01-15T15:30:00Z'
      }
    }
  },
  p_lines: [],
  p_options: {}
}

const { data, error } = await supabase.rpc('hera_txn_crud_v1', updatePayload)
// Result: error = "column cr.source_entity_id does not exist"
```

### Root Cause Analysis

According to `/docs/schema/hera-sacred-six-schema.yaml`, the correct field names in `core_relationships` are:

```yaml
core_relationships:
  fields:
    source_entity_id:
      type: "UUID"
      purpose: "Source entity in the relationship"
      required: true
      foreign_key: "core_entities.id"
      note: "ACTUAL FIELD NAME - not from_entity_id"

    target_entity_id:
      type: "UUID"
      purpose: "Target entity in the relationship"
      required: true
      foreign_key: "core_entities.id"
      note: "ACTUAL FIELD NAME - not to_entity_id"
```

**The schema fields are correct**, but the RPC function SQL query is likely using:
- ❌ Wrong table alias `cr` that doesn't exist in the FROM clause
- ❌ Missing JOIN statement for `core_relationships` table
- ❌ Incorrect reference to relationship fields

### Expected vs Actual Behavior

**Expected:**
```sql
-- RPC should build queries like this:
SELECT
  t.*,
  cr.source_entity_id,
  cr.target_entity_id
FROM universal_transactions t
LEFT JOIN core_relationships cr ON cr.source_entity_id = t.id OR cr.target_entity_id = t.id
WHERE t.id = $transaction_id
  AND t.organization_id = $organization_id;
```

**Actual:**
The RPC function is failing because `cr.source_entity_id` cannot be resolved in the SQL query context.

### Affected User Features

1. **Appointment Reschedule** - Users cannot change appointment times
2. **Appointment Details View** - Cannot fetch full appointment data via RPC
3. **Calendar Refresh** - READ operations fail when refreshing appointment list

### Workaround Status

**Current Workaround:**
The application is using direct Supabase table queries as a fallback:

```typescript
// Workaround in useHeraAppointments.ts
const { data: transactions, error } = await supabase
  .from('universal_transactions')
  .select(`
    *,
    lines:universal_transaction_lines(*)
  `)
  .eq('organization_id', organizationId)
  .eq('transaction_type', 'appointment')
  .order('transaction_date', { ascending: false })

// This bypasses the broken RPC but works for READ operations
```

**Workaround Limitations:**
- ✅ READ operations can be replaced with direct table queries
- ❌ UPDATE operations require RPC for guardrail validation
- ❌ Bypassing RPC means:
  - No guardrail enforcement
  - No audit trail stamping
  - No Smart Code validation
  - No actor tracking

### Database Fix Required

**Location:** Supabase database function `hera_txn_crud_v1`

**Required Changes:**
1. Fix the SQL query in the READ action handler to properly JOIN `core_relationships`
2. Fix the SQL query in the UPDATE action handler to properly JOIN `core_relationships`
3. Ensure the table alias `cr` is correctly defined in the FROM/JOIN clause
4. Test all CRUD operations after the fix

**Migration File Needed:**
```sql
-- File: supabase/migrations/YYYYMMDD_fix_hera_txn_crud_v1_relationships.sql

-- Drop and recreate the function with fixed SQL
DROP FUNCTION IF EXISTS hera_txn_crud_v1;

CREATE OR REPLACE FUNCTION hera_txn_crud_v1(
  p_action text,
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_transaction jsonb,
  p_lines jsonb,
  p_options jsonb
)
RETURNS jsonb AS $$
DECLARE
  -- ... existing declarations ...
BEGIN
  -- FIX: Ensure core_relationships is properly aliased
  -- Update all queries that reference cr.source_entity_id
  -- Example fix:

  IF p_action = 'READ' THEN
    SELECT jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'data', to_jsonb(t),
        'lines', COALESCE(lines_array, '[]'::jsonb)
      )
    ) INTO result
    FROM universal_transactions t
    -- FIX: Add proper JOIN for relationships
    LEFT JOIN core_relationships cr ON (
      cr.source_entity_id = t.id
      OR cr.target_entity_id = t.id
    )
    WHERE t.id = (p_transaction->>'transaction_id')::uuid
      AND t.organization_id = p_organization_id;
  END IF;

  -- Similar fixes for UPDATE, DELETE actions
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Testing Checklist

After database fix is deployed:

- [ ] CREATE appointment works (already working)
- [ ] READ appointment by ID returns full data
- [ ] READ appointment list returns all appointments
- [ ] UPDATE appointment time/date works
- [ ] UPDATE appointment status works
- [ ] DELETE appointment works
- [ ] Guardrail validation still enforced
- [ ] Actor stamping still working
- [ ] Smart Code validation still enforced
- [ ] Relationship data properly included in response

### Priority

**CRITICAL** - This blocks core salon functionality:
- Appointment reschedule is a primary user feature
- Users cannot modify appointment times
- Workarounds bypass security guardrails

### Next Steps

1. **Immediate:** Use direct table queries for READ operations (workaround active)
2. **Short-term:** Create database migration to fix RPC function SQL
3. **Testing:** Run comprehensive test suite after fix
4. **Deployment:** Deploy fix to production Supabase
5. **Verification:** Remove workarounds and verify RPC works correctly

---

## Test Script

Use `/mcp-server/test-appointment-update.mjs` to verify the fix:

```bash
cd /home/san/PRD/heraerp-dev/mcp-server
node test-appointment-update.mjs
```

Expected output after fix:
```
✅ READ Response Status: SUCCESS
✅ UPDATE Response Status: SUCCESS
✅ VERIFY Response Status: SUCCESS
```

---

**Reported:** 2025-01-31
**Reporter:** Claude Code
**Status:** OPEN - Awaiting Database Fix
**Severity:** CRITICAL
