const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function executeSQLStatements() {
  console.log('🚀 Executing RLS fix SQL statements...\n')
  
  const statements = [
    {
      name: 'Drop core_clients FK constraint',
      sql: 'ALTER TABLE core_organizations DROP CONSTRAINT IF EXISTS core_organizations_client_id_fkey'
    },
    {
      name: 'Create hera_current_org_id function',
      sql: `
        CREATE OR REPLACE FUNCTION hera_current_org_id()
        RETURNS uuid AS $$
        DECLARE
          org_id uuid;
        BEGIN
          -- Check JWT claims
          org_id := COALESCE(
            current_setting('request.jwt.claims', true)::json->>'organization_id',
            current_setting('request.jwt.claims', true)::json->>'org_id'
          )::uuid;
          
          IF org_id IS NOT NULL THEN
            RETURN org_id;
          END IF;
          
          -- Check session variables
          BEGIN
            org_id := current_setting('app.current_org_id', true)::uuid;
            IF org_id IS NOT NULL THEN
              RETURN org_id;
            END IF;
          EXCEPTION
            WHEN OTHERS THEN
              NULL;
          END;
          
          -- Check headers
          org_id := COALESCE(
            current_setting('request.headers', true)::json->>'x-organization-id',
            current_setting('request.headers', true)::json->>'X-Organization-Id'
          )::uuid;
          
          IF org_id IS NOT NULL THEN
            RETURN org_id;
          END IF;
          
          -- For demo/system operations
          IF auth.uid() IS NULL OR 
             current_setting('request.jwt.claims', true)::json->>'session_type' = 'demo' THEN
            RETURN NULL;
          END IF;
          
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql STABLE SECURITY DEFINER
      `
    },
    {
      name: 'Grant permissions on hera_current_org_id',
      sql: 'GRANT EXECUTE ON FUNCTION hera_current_org_id() TO authenticated, anon'
    },
    {
      name: 'Create hera_is_demo_session function',
      sql: `
        CREATE OR REPLACE FUNCTION hera_is_demo_session()
        RETURNS boolean AS $$
        BEGIN
          RETURN COALESCE(
            current_setting('request.jwt.claims', true)::json->>'session_type' = 'demo',
            false
          );
        END;
        $$ LANGUAGE plpgsql STABLE SECURITY DEFINER
      `
    },
    {
      name: 'Grant permissions on hera_is_demo_session',
      sql: 'GRANT EXECUTE ON FUNCTION hera_is_demo_session() TO authenticated, anon'
    }
  ]
  
  // Execute each statement separately
  for (const stmt of statements) {
    console.log(`📝 ${stmt.name}...`)
    
    try {
      // Use raw HTTP request to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: stmt.sql })
      })
      
      if (response.ok) {
        console.log('✅ Success')
      } else {
        const errorText = await response.text()
        console.log(`❌ HTTP ${response.status}: ${errorText}`)
        
        // Try alternative approach
        console.log('   Trying alternative approach...')
        
        // Direct database query
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: stmt.sql 
        })
        
        if (error) {
          console.log(`   ❌ Alternative failed: ${error.message}`)
        } else {
          console.log('   ✅ Alternative succeeded')
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
  
  console.log('\n🧪 Testing the functions...')
  
  // Test if functions exist
  try {
    const { data, error } = await supabase
      .rpc('hera_current_org_id')
    
    if (error) {
      console.log('❌ hera_current_org_id test failed:', error.message)
    } else {
      console.log('✅ hera_current_org_id works, returns:', data)
    }
  } catch (e) {
    console.log('❌ Function test error:', e.message)
  }
  
  // Test dynamic data query
  try {
    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select('field_name')
      .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
      .limit(3)
    
    if (error) {
      console.log('❌ Dynamic data query failed:', error.message)
    } else {
      console.log(`✅ Dynamic data query works: Found ${data?.length || 0} records`)
    }
  } catch (e) {
    console.log('❌ Query test error:', e.message)
  }
  
  console.log('\n📋 If errors persist, please copy the SQL from:')
  console.log('   mcp-server/complete-rls-fix.sql')
  console.log('   and run it in your Supabase Dashboard SQL Editor')
}

executeSQLStatements().catch(console.error)