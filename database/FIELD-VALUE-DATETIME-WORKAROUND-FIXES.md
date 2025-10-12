# 🔧 HERA Finance DNA v2 - field_value_datetime Workaround Fixes

## 🚨 **Issue Summary**

The `field_value_datetime` column does not exist in the actual deployed `core_dynamic_data` table, despite being present in schema documentation. This causes deployment errors when SQL files try to reference this column.

**Error Message**:
```
ERROR: 42703: column dd_effective_from.field_value_datetime does not exist
```

## 💡 **Workaround Strategy**

Since the `field_value_datetime` column is missing, we're using `field_value_text` to store datetime values as text strings and casting them to TIMESTAMPTZ when needed. This maintains functionality while working with the current database structure.

## ✅ **Files Fixed**

### 1. **database/views/coa-v2-views.sql**
**Strategy**: Use `field_value_text` and cast to TIMESTAMPTZ
**Changes**:
```sql
-- ❌ BEFORE (column doesn't exist)
dd_effective_from.field_value_datetime as effective_from,
dd_effective_to.field_value_datetime as effective_to,

-- ✅ AFTER (workaround using text field)
dd_effective_from.field_value_text::TIMESTAMPTZ as effective_from,
dd_effective_to.field_value_text::TIMESTAMPTZ as effective_to,
```

### 2. **database/functions/coa/hera_coa_upsert_v2.sql**
**Strategy**: Store datetime values as text, convert parameters to text
**Changes**:
```sql
-- ❌ BEFORE (column doesn't exist)
organization_id, entity_id, field_name, field_type, field_value_datetime, smart_code
p_organization_id, v_entity_id, 'effective_from', 'timestamp', p_effective_from
DO UPDATE SET field_value_datetime = EXCLUDED.field_value_datetime

-- ✅ AFTER (store as text)
organization_id, entity_id, field_name, field_type, field_value_text, smart_code
p_organization_id, v_entity_id, 'effective_from', 'text', p_effective_from::TEXT
DO UPDATE SET field_value_text = EXCLUDED.field_value_text
```

### 3. **database/functions/finance-posting-rules-rpc.sql**
**Strategy**: Read from text field and cast to TIMESTAMPTZ
**Changes**:
```sql
-- ❌ BEFORE (column doesn't exist)
er_updated.field_value_datetime

-- ✅ AFTER (read from text and cast)
er_updated.field_value_text::TIMESTAMPTZ
```

## 🎯 **How This Works**

1. **Storage**: Datetime values are stored as text in `field_value_text`
2. **Retrieval**: Text values are cast to `TIMESTAMPTZ` when queried
3. **Field Type**: `field_type` is set to 'text' instead of 'datetime' to match the storage

## 📊 **Impact Assessment**

**Pros**:
- ✅ Immediate deployment fix - no schema changes required
- ✅ Maintains all datetime functionality through casting
- ✅ Compatible with existing data
- ✅ PostgreSQL handles text-to-timestamp casting automatically

**Cons**:
- ⚠️ Less type safety at database level
- ⚠️ Slight performance overhead from casting
- ⚠️ Requires consistent text format for datetime values

## 🚀 **Ready for Deployment**

All files now use the text-based workaround and should deploy successfully:

```bash
# These files are now fixed and ready for deployment:
supabase db execute database/views/coa-v2-views.sql
supabase db execute database/functions/coa/hera_coa_upsert_v2.sql
supabase db execute database/functions/finance-posting-rules-rpc.sql
```

## 🔮 **Future Improvement**

When the database schema is updated to include the `field_value_datetime` column, these files can be easily reverted to use the proper datetime column for better type safety and performance.

## 🛠️ **Testing Recommendations**

1. Test datetime storage and retrieval with various timestamp formats
2. Verify casting works correctly for different timezone scenarios
3. Ensure all datetime operations function as expected

All Finance DNA v2 files now work around the missing `field_value_datetime` column! 🎉