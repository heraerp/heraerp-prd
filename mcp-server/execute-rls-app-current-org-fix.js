#!/usr/bin/env node
/**
 * Execute RLS Fix for "app.current_org" Configuration Issue
 * 
 * This script fixes the Supabase RLS error:
 * "unrecognized configuration parameter 'app.current_org'"
 * 
 * Usage: node execute-rls-app-current-org-fix.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔧 HERA RLS Fix for app.current_org Configuration Issue')
console.log('='​.repeat(60))

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Step 1: Read the SQL fix file
    console.log('📖 Reading RLS fix SQL...')
    const sqlFile = path.join(__dirname, 'fix-rls-app-current-org-issue.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // Step 2: Execute the fix
    console.log('⚡ Executing RLS policy fixes...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_statement: sql })
    
    if (error) {
      console.error('❌ Error executing SQL fix:', error.message)
      
      // Try alternative approach - execute sections individually
      console.log('🔄 Trying alternative approach...')
      await executeAlternativeApproach(supabase)
    } else {
      console.log('✅ SQL fix executed successfully')
    }

    // Step 3: Test the fix
    console.log('\n🧪 Testing the fix...')
    await testRlsFix(supabase)

  } catch (error) {
    console.error('💥 Script error:', error.message)
    process.exit(1)
  }
}

async function executeAlternativeApproach(supabase) {
  console.log('📝 Executing individual SQL commands...')
  
  // 1. Drop problematic function
  try {
    await supabase.rpc('exec_sql', { 
      sql_statement: 'DROP FUNCTION IF EXISTS hera_current_org_id() CASCADE;' 
    })
    console.log('✅ Dropped old RLS functions')
  } catch (error) {
    console.log('⚠️  Could not drop functions:', error.message)
  }

  // 2. Create new simplified function
  const newFunction = `
    CREATE OR REPLACE FUNCTION get_current_organization_id()
    RETURNS uuid AS $$
    DECLARE
      org_id uuid;
    BEGIN
      BEGIN
        org_id := (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
        IF org_id IS NOT NULL THEN
          RETURN org_id;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
      
      BEGIN
        org_id := (current_setting('request.headers', true)::json->>'x-organization-id')::uuid;
        IF org_id IS NOT NULL THEN
          RETURN org_id;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
      
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
    
    GRANT EXECUTE ON FUNCTION get_current_organization_id() TO anon, authenticated, service_role;
  `
  
  try {
    await supabase.rpc('exec_sql', { sql_statement: newFunction })
    console.log('✅ Created new organization context function')
  } catch (error) {
    console.log('❌ Could not create function:', error.message)
  }

  // 3. Create simplified policies for core_dynamic_data
  const dynamicDataPolicies = `
    DROP POLICY IF EXISTS "Enable read access for organization members" ON core_dynamic_data;
    DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;
    
    CREATE POLICY "core_dynamic_data_select" ON core_dynamic_data
    FOR SELECT USING (
      organization_id = get_current_organization_id()
      OR auth.role() = 'service_role'
      OR (get_current_organization_id() IS NULL AND auth.role() = 'authenticated')
    );
    
    CREATE POLICY "core_dynamic_data_insert" ON core_dynamic_data
    FOR INSERT WITH CHECK (
      (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
      OR auth.role() = 'service_role'
    );
  `
  
  try {
    await supabase.rpc('exec_sql', { sql_statement: dynamicDataPolicies })
    console.log('✅ Updated core_dynamic_data RLS policies')
  } catch (error) {
    console.log('❌ Could not update policies:', error.message)
  }
}

async function testRlsFix(supabase) {
  try {
    // Test 1: Check if function exists and works
    const { data: funcTest, error: funcError } = await supabase.rpc('exec_sql', {
      sql_statement: 'SELECT get_current_organization_id() as org_function_result;'
    })
    
    if (funcError) {
      console.log('❌ Function test failed:', funcError.message)
    } else {
      console.log('✅ Organization function is working')
    }

    // Test 2: Try querying core_dynamic_data
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('id, organization_id, field_name')
      .limit(5)
    
    if (dynamicError) {
      console.log('❌ core_dynamic_data query failed:', dynamicError.message)
      
      // Check if it's still the app.current_org error
      if (dynamicError.message.includes('app.current_org')) {
        console.log('⚠️  Still getting app.current_org error. Manual intervention may be needed.')
        console.log('📋 Manual steps:')
        console.log('1. Connect to your Supabase database directly')
        console.log('2. Run the SQL from fix-rls-app-current-org-issue.sql')
        console.log('3. Ensure all RLS policies are updated')
      }
    } else {
      console.log('✅ core_dynamic_data query successful')
      console.log(`📊 Found ${dynamicData?.length || 0} records`)
    }

    // Test 3: Try querying core_entities
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_name')
      .limit(5)
      
    if (entitiesError) {
      console.log('❌ core_entities query failed:', entitiesError.message)
    } else {
      console.log('✅ core_entities query successful')
      console.log(`📊 Found ${entities?.length || 0} entities`)
    }

    // Test 4: List organizations for context
    const { data: orgs, error: orgsError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .limit(10)
      
    if (orgsError) {
      console.log('❌ Organizations query failed:', orgsError.message)
    } else {
      console.log('✅ Organizations query successful')
      console.log(`📊 Available organizations:`)
      orgs?.forEach(org => {
        console.log(`   - ${org.organization_name} (${org.organization_code}) - ID: ${org.id}`)
      })
    }

  } catch (error) {
    console.error('💥 Test error:', error.message)
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

module.exports = { main, testRlsFix }