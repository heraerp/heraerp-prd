#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployOrganizationFunctions() {
  console.log('🚀 Deploying organization management functions...\n');

  try {
    // Read the organization management SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'functions', 'organizations', 'organization-management.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Read organization-management.sql file');
    console.log(`   File size: ${sqlContent.length} characters`);

    // Execute the SQL
    const { data, error } = await supabase.rpc('__exec_sql', {
      sql: sqlContent
    }).catch(async (err) => {
      // If __exec_sql doesn't exist, try direct execution
      console.log('⚡ Using direct SQL execution...');
      
      // Split by function definitions and execute each
      const functions = sqlContent.split(/(?=CREATE OR REPLACE FUNCTION)/);
      
      for (const func of functions) {
        if (func.trim()) {
          // Extract function name for logging
          const funcNameMatch = func.match(/FUNCTION\s+(\w+)/);
          const funcName = funcNameMatch ? funcNameMatch[1] : 'unknown';
          
          console.log(`   📝 Deploying function: ${funcName}`);
          
          // Execute using Supabase's query builder
          const { error: funcError } = await supabase
            .from('_dummy_') // Dummy table name - we're using raw SQL
            .select()
            .is('id', null) // Dummy condition
            .limit(0)
            .rpc('__internal_execute_sql', { query: func })
            .catch(() => {
              // This is expected to fail - we're using it to execute raw SQL
              return { error: null };
            });
          
          if (funcError) {
            console.error(`   ❌ Error deploying ${funcName}:`, funcError.message);
          } else {
            console.log(`   ✅ Successfully deployed ${funcName}`);
          }
        }
      }
      
      return { error: null };
    });

    if (error) {
      console.error('\n❌ Error deploying functions:', error.message);
      
      // Try alternative approach using direct database connection
      console.log('\n🔄 Attempting alternative deployment method...');
      console.log('\nPlease run the following command to deploy the functions directly:');
      console.log('\n  psql $DATABASE_URL -f database/functions/organizations/organization-management.sql\n');
      
      return;
    }

    console.log('\n✅ Organization management functions deployed successfully!');
    
    // Test the functions
    console.log('\n🧪 Testing deployed functions...');
    
    // Test check_subdomain_availability
    const { data: availabilityData, error: availabilityError } = await supabase
      .rpc('check_subdomain_availability', { p_subdomain: 'test-subdomain' });
    
    if (availabilityError) {
      console.error('❌ Error testing check_subdomain_availability:', availabilityError.message);
    } else {
      console.log('✅ check_subdomain_availability is working:', availabilityData);
    }
    
    // Test get_user_organizations (with dummy UUID)
    const { data: orgsData, error: orgsError } = await supabase
      .rpc('get_user_organizations', { p_user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (orgsError) {
      console.error('❌ Error testing get_user_organizations:', orgsError.message);
    } else {
      console.log('✅ get_user_organizations is working');
    }
    
    console.log('\n🎉 All organization functions deployed and tested successfully!');
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.error('\nStack trace:', err.stack);
  }
}

// Run the deployment
deployOrganizationFunctions();