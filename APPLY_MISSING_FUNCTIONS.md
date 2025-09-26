# 🚨 CRITICAL: Apply Missing V2 RPC Functions

## Problem Identified
The salon service data fetching is currently using **direct Supabase queries** instead of the V2 API. Testing revealed that key RPC functions are missing from the database.

## Missing Functions Found
The following critical functions need to be applied to the database:
- `hera_entity_upsert_v1` - Create/update entities
- `hera_entity_query_v1` - Query entities with filters
- `hera_dynamic_data_upsert_v1` - Manage dynamic fields
- `hera_relationship_upsert_v1` - Manage relationships

## Action Required

### Step 1: Apply Missing Functions
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the entire content of: `database/functions/v2/hera_entity_crud_v1.sql`
4. Paste and execute in SQL Editor
5. Verify no errors occur

### Step 2: Verify Functions
Run this test script to verify functions are working:
```bash
npx tsx create-and-test-salon-data.ts
```

### Step 3: Refactor Salon Services
Once functions are working, we'll refactor the salon services to use the V2 API instead of direct queries.

## Current Flow (PROBLEMATIC)
```
Frontend → useServicesPlaybook → fetchSalonServices → /api/playbook/salon/services
                                                          ↓
                                            Direct Supabase Queries (BAD)
```

## Target Flow (CORRECT)
```
Frontend → useServicesPlaybook → V2 API Client → /api/v2/universal/*
                                                     ↓
                                          RPC Functions (GOOD)
```

## Benefits of Migration
- ✅ Enterprise validation and error handling
- ✅ Structured logging and audit trails
- ✅ Smart code business intelligence
- ✅ Consistent API patterns
- ✅ Better performance with optimized queries
- ✅ Multi-tenant security enforcement

## Files to Update
1. `/src/hooks/useServicesPlaybook.ts` - Switch to V2 API client
2. `/src/lib/api/salon.ts` - Update to use V2 endpoints
3. `/src/app/api/playbook/salon/services/route.ts` - Deprecate or update to use V2

## Next Steps
1. Apply the missing functions (CRITICAL - do this first!)
2. Test with `create-and-test-salon-data.ts`
3. Refactor salon services to use V2 API
4. Validate all functionality works correctly