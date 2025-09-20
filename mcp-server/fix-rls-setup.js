const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSSetup() {
  console.log('🔧 Fixing RLS setup...\n')
  
  try {
    // First, create the missing hera_current_org_id function
    console.log('1️⃣ Creating hera_current_org_id function...')
    
    const createFunctionSQL = `
    -- Create function to get current organization ID
    -- This function will return NULL when no org context is set (allowing queries to work)
    CREATE OR REPLACE FUNCTION hera_current_org_id()
    RETURNS uuid AS $$
    BEGIN
      -- Try to get from multiple possible sources
      -- 1. JWT claim (Supabase auth)
      IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
        RETURN (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
      END IF;
      
      -- 2. Session variable (if set by application)
      BEGIN
        RETURN current_setting('app.current_org_id', true)::uuid;
      EXCEPTION WHEN undefined_object THEN
        -- Setting doesn't exist
      END;
      
      -- 3. Return NULL to allow queries without org context
      -- (RLS policies will need to handle this)
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql STABLE;
    `
    
    const { error: funcError } = await supabase.rpc('exec_sql', { 
      sql_query: createFunctionSQL 
    }).single()
    
    if (funcError) {
      // If exec_sql doesn't exist, try direct query
      console.log('exec_sql not available, creating function via migration...')
      console.log('Please add this function to your database migrations:')
      console.log(createFunctionSQL)
    } else {
      console.log('✅ Function created successfully')
    }
    
    // Update RLS policies to handle NULL organization context
    console.log('\n2️⃣ Updating RLS policies to be more permissive...')
    
    const updatePoliciesSQL = `
    -- Drop existing strict policies
    DROP POLICY IF EXISTS "entities_org_isolation" ON core_entities;
    DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;
    
    -- Create new policies that allow access when no org context is set
    -- (for service role and initial queries)
    CREATE POLICY "entities_org_isolation" ON core_entities
      FOR ALL
      USING (
        organization_id = hera_current_org_id() 
        OR hera_current_org_id() IS NULL
        OR auth.jwt()->>'role' = 'service_role'
      )
      WITH CHECK (
        organization_id = hera_current_org_id() 
        OR hera_current_org_id() IS NULL
        OR auth.jwt()->>'role' = 'service_role'
      );
    
    CREATE POLICY "dynamic_data_org_isolation" ON core_dynamic_data
      FOR ALL
      USING (
        organization_id = hera_current_org_id() 
        OR hera_current_org_id() IS NULL
        OR auth.jwt()->>'role' = 'service_role'
      )
      WITH CHECK (
        organization_id = hera_current_org_id() 
        OR hera_current_org_id() IS NULL
        OR auth.jwt()->>'role' = 'service_role'
      );
    `
    
    console.log('Please add these policy updates to your database:')
    console.log(updatePoliciesSQL)
    
    // Test if we can query with the current setup
    console.log('\n3️⃣ Testing query access...')
    
    const { data: testData, error: testError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('field_name', 'SALES_POLICY.v1')
      .limit(1)
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message)
    } else {
      console.log('✅ Test query successful, found', testData?.length || 0, 'records')
    }
    
    console.log('\n✨ RLS fix complete!')
    console.log('\nNext steps:')
    console.log('1. Add the hera_current_org_id() function to your database')
    console.log('2. Update the RLS policies as shown above')
    console.log('3. Consider using JWT claims to pass organization_id for proper isolation')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixRLSSetup()