# HERA V2 Entity CRUD Fix Documentation

## Summary

This fix addresses issues with the Universal Entity v2 CRUD operations in the HERA DNA system, specifically:

1. RPC function signature mismatches with the actual database schema
2. Foreign key constraint errors when writing to universal_transactions
3. Incorrect response formats from API routes
4. Proper handling of soft delete operations

## Key Changes

### 1. Database Functions

Created v2 versions of the RPC functions that match the actual schema:

- **`hera_entity_read_v2`**: 
  - Fixed references to non-existent `is_deleted` column
  - Uses `is_active` for relationships instead of `is_deleted`
  - Returns dynamic fields as an aggregated object
  - Handles `status = 'all'` parameter correctly

- **`hera_entity_delete_v2`**:
  - Uses `status = 'archived'` for soft delete
  - Fixed relationship activity checking
  - Removed references to non-existent columns
  - Proper error handling and response format

### 2. API Route Updates

Updated `/api/v2/entities/route.ts`:
- Use `hera_entity_read_v2` instead of v1
- Fixed POST response to include both `id` and `entity_id`
- Improved error handling for RPC failures
- Better handling of RPC response format

Updated `/api/v2/entities/[id]/route.ts`:
- Use `hera_entity_delete_v2` instead of v1
- Maintained fallback logic for compatibility

### 3. Client Hook Improvements

Enhanced `useUniversalEntity` hook:
- Better error handling in create mutation
- Support for multiple ID formats in response
- Improved error messages

## Deployment Instructions

### 1. Deploy Database Functions

**Option A: Via Supabase Dashboard**
```bash
node scripts/generate-v2-functions-sql.js > v2-functions.sql
```
Then copy content to Supabase SQL Editor and run.

**Option B: Via Supabase CLI**
```bash
supabase migration new v2_entity_functions
# Copy SQL from database/functions/v2/*.sql files
supabase db push
```

### 2. Test the Implementation

Run the test script to verify CRUD operations:
```bash
node scripts/test-entity-crud.js
```

## Files Changed

1. **Database Functions**:
   - `database/functions/v2/hera_entity_read_v2.sql` (new)
   - `database/functions/v2/hera_entity_delete_v2.sql` (new)
   - `database/functions/v2/README.md` (new)

2. **API Routes**:
   - `src/app/api/v2/entities/route.ts`
   - `src/app/api/v2/entities/[id]/route.ts`

3. **Client Code**:
   - `src/hooks/useUniversalEntity.ts`

4. **Scripts**:
   - `scripts/deploy-v2-functions.js` (new)
   - `scripts/generate-v2-functions-sql.js` (new)
   - `scripts/test-entity-crud.js` (new)

## Testing

The service categories page should now:
1. Load data properly without RPC errors
2. Create new categories successfully
3. Update existing categories
4. Soft delete categories (archive)
5. Filter by status correctly

## Schema Reference

Key columns in actual schema:
- `core_entities`: Uses `status` field (not `is_deleted`)
- `core_relationships`: Uses `is_active` field (not `is_deleted`)
- `core_dynamic_data`: No `is_deleted` field
- Status values: 'active', 'inactive', 'archived', 'deleted'

## Future Considerations

1. Consider creating a migration to add missing columns if needed
2. Update other RPC functions to v2 for consistency
3. Add more comprehensive error handling
4. Consider implementing the recover function for archived entities