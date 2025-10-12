# 🔧 HERA Finance DNA v2 - Dynamic Data Field Name Fixes

## 🚨 **Issue Summary**

Several SQL files were using incorrect column names for storing datetime values in the `core_dynamic_data` table. According to the actual database schema, the correct field name is `field_value_datetime`, not `field_value_timestamp` or `field_value_timestamptz`.

## 📋 **Schema Reference**

From `/docs/schema/hera-sacred-six-schema.yaml`:

```yaml
field_value_datetime:
  type: "TIMESTAMP WITH TIME ZONE"
  purpose: "Storage for datetime values"
  required: false
  usage: "Used when field_type = 'datetime'"
```

## ✅ **Fixed Files**

### 1. **database/views/coa-v2-views.sql**
**Error**: `field_value_timestamp`
**Fix**: Changed to `field_value_datetime`
**Lines Fixed**: 40, 41, 117, 118

**Changes Made**:
```sql
-- ❌ BEFORE (incorrect)
dd_effective_from.field_value_timestamp as effective_from,
dd_effective_to.field_value_timestamp as effective_to,

-- ✅ AFTER (correct)
dd_effective_from.field_value_datetime as effective_from,
dd_effective_to.field_value_datetime as effective_to,
```

### 2. **database/functions/coa/hera_coa_upsert_v2.sql**
**Error**: `field_value_timestamp`
**Fix**: Changed to `field_value_datetime`
**Lines Fixed**: 358, 362, 367, 371

**Changes Made**:
```sql
-- ❌ BEFORE (incorrect)
organization_id, entity_id, field_name, field_type, field_value_timestamp, smart_code
DO UPDATE SET field_value_timestamp = EXCLUDED.field_value_timestamp

-- ✅ AFTER (correct)
organization_id, entity_id, field_name, field_type, field_value_datetime, smart_code
DO UPDATE SET field_value_datetime = EXCLUDED.field_value_datetime
```

### 3. **database/functions/finance-posting-rules-rpc.sql**
**Error**: `field_value_timestamptz`
**Fix**: Changed to `field_value_datetime`
**Lines Fixed**: 449

**Changes Made**:
```sql
-- ❌ BEFORE (incorrect)
er_updated.field_value_timestamptz

-- ✅ AFTER (correct)
er_updated.field_value_datetime
```

## 🔍 **Complete Verification**

All SQL files have been searched and corrected. No remaining instances of incorrect timestamp field names exist.

**Verified Files**: 
- ✅ All view files in `database/views/`
- ✅ All function files in `database/functions/`
- ✅ All other SQL files in the database directory

## 📊 **Impact**

These fixes resolve the PostgreSQL error:
```
ERROR: 42703: column dd_effective_from.field_value_timestamp does not exist
```

## 🚀 **Ready for Deployment**

All SQL files now use the correct column names and should deploy successfully:

```bash
# These files are now fixed and ready for deployment:
supabase db execute database/views/coa-v2-views.sql
supabase db execute database/functions/coa/hera_coa_upsert_v2.sql
supabase db execute database/functions/finance-posting-rules-rpc.sql
```

## 🎯 **Pattern for Future Development**

When working with `core_dynamic_data` fields, always use these correct column names:

```sql
-- ✅ CORRECT FIELD NAMES
field_value_text         -- For text data
field_value_number       -- For numeric data
field_value_boolean      -- For boolean data
field_value_date         -- For date data
field_value_datetime     -- For timestamp data
field_value_json         -- For JSON data

-- ❌ WRONG FIELD NAMES (DO NOT USE)
field_value_timestamp    -- DOES NOT EXIST
field_value_timestamptz  -- DOES NOT EXIST
```

All HERA Finance DNA v2 SQL files are now schema-compliant and ready for deployment! 🎉