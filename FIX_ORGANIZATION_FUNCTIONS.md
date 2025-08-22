# Fix Organization Functions - Quick Guide

## Issue
The organization creation is failing because the required database functions (`check_subdomain_availability` and `create_organization_with_owner`) are not deployed to your Supabase database.

## Solution Options

### Option 1: Using Supabase SQL Editor (Recommended - Quickest)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of: `/database/migrations/002_organization_functions.sql`
4. Click "Run" to execute the SQL

### Option 2: Using psql Command Line

```bash
# Make sure you have DATABASE_URL in your environment
export DATABASE_URL="your-supabase-database-url"

# Run the migration
psql "$DATABASE_URL" -f database/migrations/002_organization_functions.sql
```

### Option 3: Using the Deployment Script

```bash
# Run the simple deployment script
./scripts/deploy-org-functions-simple.sh
```

### Option 4: Using Node.js Script

```bash
# Run the Node.js deployment script
node scripts/deploy-organization-functions.js
```

## Verification

After deploying, you can verify the functions exist:

```sql
-- Check if functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('check_subdomain_availability', 'create_organization_with_owner', 'get_user_organizations', 'get_organization_by_subdomain');
```

## What These Functions Do

1. **`check_subdomain_availability`** - Validates if a subdomain is available for use
2. **`create_organization_with_owner`** - Creates a new organization with owner setup
3. **`get_user_organizations`** - Retrieves all organizations a user belongs to
4. **`get_organization_by_subdomain`** - Gets organization details by subdomain

## Files Created

- `/database/migrations/002_organization_functions.sql` - Complete migration file
- `/scripts/deploy-organization-functions.js` - Node.js deployment script
- `/scripts/deploy-org-functions-simple.sh` - Shell deployment script

## Next Steps

1. Deploy the functions using one of the methods above
2. Test organization creation again
3. The error should be resolved!