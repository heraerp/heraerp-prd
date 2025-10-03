# HERA V2 Entity Functions

This directory contains the v2 versions of HERA entity CRUD functions, fixed to work with the actual database schema.

## Functions

### hera_entity_read_v2
- Fixed column references (no `is_deleted` column)
- Uses `status` field for soft delete checking
- Returns data in the format expected by the API
- Supports dynamic fields aggregation

### hera_entity_delete_v2
- Uses `status = 'archived'` for soft delete
- Fixed relationship checking (uses `is_active` not `is_deleted`)
- Handles cascade operations correctly
- Returns proper error messages

## Deployment

1. **Via Supabase Dashboard:**
   ```bash
   node scripts/generate-v2-functions-sql.js > v2-functions.sql
   ```
   Then copy the content to Supabase SQL Editor and run.

2. **Via Migration:**
   ```bash
   supabase migration new v2_entity_functions
   # Copy the SQL files content to the migration
   supabase db push
   ```

## Key Fixes

1. **Schema Alignment**: Functions now use actual column names from the database
2. **Status Management**: Soft delete uses `status = 'archived'` instead of non-existent `is_deleted`
3. **Dynamic Fields**: Proper aggregation of dynamic fields into objects
4. **Error Handling**: Better error messages and fallback handling