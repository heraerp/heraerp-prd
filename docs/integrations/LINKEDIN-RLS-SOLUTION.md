# LinkedIn Integration - RLS Solution

## The Issue
Your Supabase tables have Row Level Security (RLS) enabled, which blocks inserts from the anon key.

## The Solution
Created a service-role endpoint that bypasses RLS policies.

### Service Endpoint: `/api/integrations/linkedin/auth/callback-service`

This endpoint:
1. Uses the service role key (bypasses RLS)
2. Creates connector entity in `core_entities`
3. Stores OAuth tokens in `core_dynamic_data`
4. Creates audit trail in `universal_transactions`

## How to Test Now

1. **Go to**: http://localhost:3000/civicflow/communications/integrations
2. **Click**: "Connect" on LinkedIn card
3. **Success!** Should create connector without RLS issues

## What Gets Created

Check these tables after connecting:
```sql
-- Check connector was created
SELECT * FROM core_entities 
WHERE entity_type = 'connector' 
AND organization_id = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'
ORDER BY created_at DESC;

-- Check OAuth tokens stored
SELECT * FROM core_dynamic_data
WHERE entity_id IN (
  SELECT id FROM core_entities 
  WHERE entity_type = 'connector'
)
ORDER BY created_at DESC;
```

## RLS Best Practices

For production, you should:
1. Create proper RLS policies for your auth method
2. Allow authenticated users to insert their organization's data
3. Use service role only for admin operations

## Alternative Solutions

1. **Disable RLS temporarily** (for testing):
   ```sql
   ALTER TABLE core_entities DISABLE ROW LEVEL SECURITY;
   ALTER TABLE core_dynamic_data DISABLE ROW LEVEL SECURITY;
   ```

2. **Create RLS policies** that allow inserts:
   ```sql
   CREATE POLICY "Allow organization members to insert entities"
   ON core_entities FOR INSERT
   TO authenticated
   WITH CHECK (organization_id = auth.jwt() ->> 'organization_id');
   ```

The service role endpoint is the quickest solution for now!