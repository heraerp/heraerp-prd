# Fix RLS "app.current_org" Configuration Issue

## Problem Description
You're getting this error from Supabase:
```
400 Bad Request: unrecognized configuration parameter 'app.current_org'
```

This happens because the RLS (Row Level Security) policies in your database are trying to use a custom configuration parameter `app.current_org` that doesn't exist in Supabase.

## Root Cause
The issue is in the RLS functions and policies that were created to handle multi-tenant organization filtering. These functions try to access `current_setting('app.current_org')` which is not a valid Supabase configuration parameter.

## Solution Options

### Option 1: Quick Fix (Recommended)
Run the simple RLS fix that removes the problematic configuration dependencies:

```bash
cd mcp-server
node test-rls-fix.js
```

If the test shows the error still exists, apply the fix:

1. **Manual SQL Fix (Most Reliable)**:
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Copy the contents of `simple-rls-fix.sql` 
   - Execute the SQL
   - Run `node test-rls-fix.js` to verify

2. **Automated Fix**:
```bash
node execute-rls-app-current-org-fix.js
```

### Option 2: Complete RLS Overhaul
If you need proper organization-based filtering later, use:

```bash
# Apply the complete fix
psql -h your-supabase-host -U postgres -d postgres -f fix-rls-app-current-org-issue.sql
```

## Verification Steps

1. **Test the fix**:
```bash
node test-rls-fix.js
```

2. **Test your application**: Try querying core_dynamic_data through your Universal API

3. **Check for remaining errors**: Look for any 400 errors in your application logs

## Files Created

1. **`simple-rls-fix.sql`** - Simple fix that removes problematic policies
2. **`fix-rls-app-current-org-issue.sql`** - Complete fix with proper organization handling  
3. **`execute-rls-app-current-org-fix.js`** - Automated execution script
4. **`test-rls-fix.js`** - Verification script

## How the Fix Works

### Before (Problematic)
```sql
-- This causes the error
CREATE POLICY "policy_name" ON table_name
USING (organization_id = current_setting('app.current_org')::uuid);
```

### After (Fixed)
```sql  
-- This works with Supabase
CREATE POLICY "simple_access_policy" ON table_name
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);
```

## Long-term Organization Filtering

If you need proper multi-tenant organization filtering, you can:

1. **Use API-level filtering**: Filter by organization_id in your application code
2. **Use JWT claims**: Pass organization_id in JWT token claims
3. **Use request headers**: Pass organization_id in HTTP headers

The Universal API already handles this properly by accepting `organization_id` as a parameter.

## Testing Commands

```bash
# Test if the fix worked
cd mcp-server
node test-rls-fix.js

# Test specific queries
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('core_dynamic_data').select('*').limit(5).then(({data, error}) => {
  console.log(error ? 'Error:' + error.message : 'Success: Found ' + data.length + ' records');
});
"
```

## Prevention

To avoid this issue in the future:
1. Use standard Supabase configuration parameters only
2. Test RLS policies thoroughly before deployment
3. Use the Universal API's built-in organization filtering
4. Avoid custom `current_setting()` calls in RLS policies

## Support

If you continue to have issues:
1. Check Supabase Dashboard > Database > Policies
2. Ensure all policies are using standard Supabase patterns
3. Verify that the Universal API is receiving organization_id parameters correctly
4. Check your application logs for any remaining RLS-related errors