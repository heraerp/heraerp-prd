#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkV2Functions() {
  console.log('🔍 Checking v2 functions deployment...\n');

  const functions = [
    'hera_entity_upsert_v2',
    'hera_entity_read_v2',
    'hera_entity_delete_v2',
    'hera_dynamic_data_set_batch_v2'
  ];

  for (const funcName of functions) {
    try {
      // Try to check if function exists by querying pg_proc
      const { data, error } = await supabase.rpc('execute_sql', {
        p_query: `
          SELECT EXISTS (
            SELECT 1 
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = '${funcName}'
          ) as exists
        `
      });

      if (error) {
        console.log(`❌ ${funcName}: Cannot verify (execute_sql not available)`);
        continue;
      }

      if (data && data[0]?.exists) {
        console.log(`✅ ${funcName}: Deployed`);
      } else {
        console.log(`❌ ${funcName}: Not found`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: Error checking - ${err.message}`);
    }
  }

  console.log('\n📝 To deploy v2 functions:');
  console.log('1. Run: node scripts/generate-v2-functions-sql.js > v2-functions.sql');
  console.log('2. Copy the contents of v2-functions.sql');
  console.log('3. Paste and run in Supabase SQL Editor');
}

async function testEntityCreation() {
  console.log('\n🧪 Testing entity creation...\n');

  try {
    // Get a test organization
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, name')
      .limit(1);

    if (orgError || !orgs?.length) {
      console.log('❌ No organizations found for testing');
      return;
    }

    const testOrgId = orgs[0].id;
    console.log(`📍 Using organization: ${orgs[0].name} (${testOrgId})`);

    // Try to create a test entity
    const { data, error } = await supabase.rpc('hera_entity_upsert_v2', {
      p_organization_id: testOrgId,
      p_entity_id: null,
      p_entity_type: 'TEST_CATEGORY',
      p_entity_name: 'Test Category',
      p_smart_code: 'HERA.TEST.CATEGORY.ENTITY.ITEM.V1',
      p_metadata: {}
    });

    if (error) {
      console.log('❌ Entity creation failed:', error.message);
      console.log('   This likely means v2 functions need to be deployed');
    } else {
      console.log('✅ Entity creation successful:', data);
      
      // Clean up test entity
      if (data?.id) {
        await supabase.rpc('hera_entity_delete_v2', {
          p_organization_id: testOrgId,
          p_entity_id: data.id,
          p_hard_delete: true
        });
        console.log('🧹 Test entity cleaned up');
      }
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

async function main() {
  console.log('🚀 HERA v2 Functions Deployment Verification\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using service role key: ${supabaseServiceKey.substring(0, 20)}...`);
  console.log('');

  await checkV2Functions();
  await testEntityCreation();

  console.log('\n✨ Verification complete');
}

main().catch(console.error);