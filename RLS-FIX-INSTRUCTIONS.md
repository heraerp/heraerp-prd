# 🚨 URGENT: Fix RLS Errors (400 Bad Request)

## The Issue
The RLS policies call functions that internally use `app.current_org` which Supabase doesn't support, causing 400 errors.

## Immediate Fix (2 minutes)

### Option 1: Run IMMEDIATE FIX SQL (Recommended)
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Run this file: `mcp-server/immediate-rls-fix.sql`

This creates simple authentication-based policies that work immediately.

### Option 2: Quick Manual Fix
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and run this SQL:

```sql
-- Drop problematic RLS policies
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable insert for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable update for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable delete for organization members" ON core_dynamic_data;

-- Create simple auth-based policies for core_dynamic_data
CREATE POLICY "auth_read_dynamic_data" ON core_dynamic_data
FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "auth_insert_dynamic_data" ON core_dynamic_data
FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "auth_update_dynamic_data" ON core_dynamic_data
FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "auth_delete_dynamic_data" ON core_dynamic_data
FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));

-- Repeat for other tables if needed
```

### Option 2: Disable RLS Temporarily
1. Go to **Authentication → Policies**
2. Find policies for `core_dynamic_data`
3. Toggle RLS OFF for this table temporarily

## Permanent Fix
Run the complete fix: `mcp-server/fix-hera-dna-auth-rls.sql`

This replaces all `app.current_org` references with proper JWT-based functions.

## Why This Happened
- Legacy RLS policies use PostgreSQL session variables
- Supabase doesn't support `current_setting('app.current_org')`
- The fix uses JWT claims instead: `auth.jwt() ->> 'organization_id'`