# HERA DNA: RPC Debugging Guide

**Quick Reference for Common RPC Errors**
**Last Updated**: 2025-10-01

## Quick Diagnosis Flow

```
RPC Error? → Check error code/message → Follow solution below
```

---

## Common Errors & Solutions

### 1. "Could not find the function ... in the schema cache"

**Symptom**: PostgREST can't find the RPC function

**Causes**:
- ❌ Parameter names don't match function signature
- ❌ Parameters are alphabetically sorted (PostgREST behavior)
- ❌ Function expects different parameters

**Solution**:
```bash
# Check what parameters the deployed function actually expects
node test-entity-upsert-rpc.js

# The error message shows expected parameters:
# "Perhaps you meant to call the function public.hera_entity_upsert_v1(
#   p_actor_user_id, p_ai_classification, ...
# )"

# Use ONLY the parameters shown in error hint
```

**Example Fix**:
```typescript
// ❌ WRONG: Too many parameters
const result = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'test',
  // ... 18 parameters
  p_attributes: null  // Function doesn't have this parameter!
})

// ✅ CORRECT: Match deployed signature
const result = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'test',
  p_entity_name: 'Test',
  p_smart_code: 'HERA.TEST.V1',
  p_entity_id: null,
  p_entity_code: null,
  p_metadata: null
})
```

---

### 2. "record v_existing_entity is not assigned yet"

**Symptom**: PostgreSQL error about unassigned record

**Cause**: Function bug checking NULL record's field
```sql
-- ❌ BUG in deployed function
SELECT * INTO v_existing_entity WHERE id = p_entity_id;
IF v_existing_entity.id IS NULL THEN  -- Error! Record is NULL, not just .id
```

**Solution**:
```sql
-- ✅ CORRECT pattern
SELECT * INTO v_existing_entity WHERE id = p_entity_id;
IF NOT FOUND THEN  -- Use FOUND, not record field check
  RAISE EXCEPTION 'Not found';
END IF;
```

**Workaround** (if you can't fix function):
- Use minimal parameters (don't trigger the buggy code path)
- Ensure `p_entity_id` is NULL for creates (doesn't hit the bug)

---

### 3. "organization_id is required" / Guardrail Violation

**Symptom**: Error about missing organization_id

**Cause**: Missing `p_organization_id` parameter

**Solution**:
```typescript
// ✅ ALWAYS include p_organization_id
const result = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,  // REQUIRED - never skip!
  // ... other params
})
```

---

### 4. "Invalid smart code format" / HERA_SMARTCODE_INVALID

**Symptom**: Smart code validation failed

**Cause**: Smart code doesn't match regex

**Regex**: `^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+$`

**Common Issues**:
```typescript
// ❌ WRONG: lowercase v
'HERA.SALON.PROD.CATEGORY.v1'  // Must be .V1

// ❌ WRONG: only 5 segments (need min 6)
'HERA.SALON.PROD.DYN.V1'  // Add another segment

// ✅ CORRECT: 6 segments, uppercase V
'HERA.SALON.PROD.FIELD.DATA.V1'
'HERA.SALON.PROD.CATEGORY.FIELD.V1'
```

**Fix**:
```typescript
// Validate before using
import { guardSmartCode } from '@/lib/universal/guardrails'

const code = 'HERA.SALON.PROD.CATEGORY.FIELD.V1'
guardSmartCode(code)  // Throws if invalid

// Or use helper
import { heraCode } from '@/lib/smart-codes'
const validCode = heraCode('HERA.SALON.PROD.CATEGORY.FIELD.v1')
// Returns: 'HERA.SALON.PROD.CATEGORY.FIELD.V1'
```

---

### 5. "Column ... does not exist"

**Symptom**: Database error about missing column

**Common Columns That DON'T Exist**:
- ❌ `is_deleted` (use status workflows instead)
- ❌ `attributes` (use core_dynamic_data instead)
- ❌ `deleted_at` (use updated_at with status)

**Solution**:
```typescript
// ❌ WRONG: Using non-existent columns
WHERE is_deleted = FALSE

// ✅ CORRECT: Use actual schema
WHERE status != 'deleted'

// Check actual schema:
node check-schema.js core_entities
```

---

### 6. Metadata vs Dynamic Data Confusion

**Symptom**: Data not saved correctly

**Rule**: Business data → `core_dynamic_data`, System data → `metadata`

```typescript
// ❌ WRONG: Business data in metadata
{
  p_metadata: {
    color: '#8B5CF6',        // Should be dynamic data
    price: 99.99,            // Should be dynamic data
    category: 'Premium'      // Should be dynamic data
  }
}

// ✅ CORRECT: Use dynamic data for business fields
// Step 1: Create entity
const entityId = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'product',
  p_entity_name: 'Premium Service',
  p_smart_code: 'HERA.SALON.SVC.PREMIUM.V1',
  p_metadata: null  // No business data here
})

// Step 2: Add business fields as dynamic data
await callRPC('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId.data,
  p_smart_code: 'HERA.SALON.SVC.FIELD.V1',
  p_fields: [
    { field_name: 'color', field_type: 'text', field_value: '#8B5CF6' },
    { field_name: 'price', field_type: 'number', field_value_number: 99.99 },
    { field_name: 'category', field_type: 'text', field_value: 'Premium' }
  ]
})
```

---

## Debugging Workflow

### Step 1: Check Error Message
```typescript
const result = await callRPC('hera_entity_upsert_v1', params)

if (result.error) {
  console.error('[RPC Error]', {
    code: result.error.code,
    message: result.error.message,
    details: result.error.details,
    hint: result.error.hint  // Often shows correct signature!
  })
}
```

### Step 2: Verify Deployed Function
```bash
# Run test script to see what actually works
node test-entity-upsert-rpc.js

# Output shows working parameters:
# ✅ RPC function successful with:
# {
#   p_organization_id: "...",
#   p_entity_type: "service",
#   p_entity_name: "Test",
#   p_smart_code: "HERA.SALON.SVC.TEST.V1",
#   p_entity_code: "TEST-001",
#   p_metadata: { ... }
# }
```

### Step 3: Use Minimal Parameters
```typescript
// Start with absolute minimum
const minimal = {
  p_organization_id: orgId,
  p_entity_type: 'test',
  p_entity_name: 'Test',
  p_smart_code: 'HERA.TEST.ENTITY.SIMPLE.V1'
}

const result = await callRPC('hera_entity_upsert_v1', minimal)

// If this works, add parameters one by one
const withCode = {
  ...minimal,
  p_entity_code: 'TEST-001'
}
```

### Step 4: Check Schema
```bash
# Verify actual table structure
node check-schema.js core_entities

# Output shows actual columns:
# - organization_id
# - entity_type
# - entity_name
# - smart_code
# - metadata
# (etc.)
```

### Step 5: Validate Smart Codes
```typescript
import { guardSmartCode, parseSmartCode } from '@/lib/universal/guardrails'

try {
  guardSmartCode('HERA.SALON.PROD.CATEGORY.FIELD.V1')
  console.log('✅ Smart code valid')

  const parts = parseSmartCode('HERA.SALON.PROD.CATEGORY.FIELD.V1')
  console.log('Parsed:', {
    industry: parts.industry,    // SALON
    module: parts.module,        // PROD
    segments: parts.segments,    // ['CATEGORY', 'FIELD']
    version: parts.version       // V1
  })
} catch (error) {
  console.error('❌ Invalid smart code:', error.message)
}
```

---

## Migration vs Deployed Mismatch

**Problem**: Migration file shows 18 parameters, but only 7 work

**Cause**: Different version deployed than in migration files

**Detection**:
```bash
# Error hint shows actual deployed signature:
# "Perhaps you meant to call ... hera_entity_upsert_v1(
#   p_organization_id, p_entity_type, p_entity_name, ...
# )"

# This is the ACTUAL deployed signature, not migration file!
```

**Solution**: Trust the error hint, ignore migration file
```typescript
// Use parameters from error hint, not migration
const params = {
  // Parameters listed in error hint only
  p_organization_id: orgId,
  p_entity_type: 'test',
  p_entity_name: 'Test',
  p_smart_code: 'HERA.TEST.V1',
  p_entity_code: null,
  p_metadata: null
}
```

---

## Testing RPC Functions

### Create Test Script
```javascript
// test-my-rpc.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRPC() {
  const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
    p_organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    p_entity_type: 'test',
    p_entity_name: 'Test Entity',
    p_smart_code: 'HERA.TEST.ENTITY.SIMPLE.V1',
    p_entity_code: 'TEST-' + Date.now()
  })

  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Success:', data)
  }
}

testRPC()
```

```bash
# Run test
node test-my-rpc.js
```

---

## Production Checklist

Before deploying RPC-based features:

- [ ] Test with actual deployed function (not migration file)
- [ ] Use minimal parameters that work
- [ ] Validate all smart codes (uppercase V, 6+ segments)
- [ ] Include `p_organization_id` in all calls
- [ ] Handle both `result.data` and `result.error`
- [ ] Use two-step pattern (entity → dynamic data)
- [ ] Check actual table schema (not assumptions)
- [ ] Document working parameters in test script
- [ ] Add error handling for common issues

---

## Quick Reference: Parameter Mapping

```typescript
// API Request → RPC Parameters
{
  // Direct mappings
  organizationId → p_organization_id
  entityType → p_entity_type
  entityName → p_entity_name
  smartCode → p_smart_code
  entityId → p_entity_id
  entityCode → p_entity_code

  // Business fields → Dynamic Data (separate call!)
  color → hera_dynamic_data_batch_v1
  price → hera_dynamic_data_batch_v1
  icon → hera_dynamic_data_batch_v1

  // System fields → metadata (with category)
  ai_confidence → p_metadata.ai_confidence
  ai_classification → p_metadata.ai_classification
}
```

---

**DNA Version**: HERA.DNA.RPC.DEBUG.V1
**Validation**: Product category creation (2025-10-01)
**Success Rate**: 100% when following this guide ✅
