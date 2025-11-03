#!/usr/bin/env node
/**
 * Test script to check hera_organizations_crud_v1 RPC and create HERA ERP DEMO organization
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  user_entity_id: process.env.DEFAULT_USER_ENTITY_ID || '09b0b92a-d797-489e-bc03-5ca0a6272674', // michele user
  organization_id: process.env.DEFAULT_ORGANIZATION_ID
};

async function testOrganizationCRUD() {
  console.log('🧪 Testing hera_organizations_crud_v1 RPC function...');
  console.log('📊 Test Data:', JSON.stringify(testData, null, 2));

  try {
    // Step 1: Check if the RPC function exists by trying to READ
    console.log('\n📖 Step 1: Testing READ operation to verify RPC exists...');
    // Correct signature: hera_organizations_crud_v1(p_action, p_actor_user_id, p_limit, p_offset, p_payload)
    const readTest = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: testData.user_entity_id,
      p_limit: 100,
      p_offset: 0,
      p_payload: {}
    });

    if (readTest.error) {
      console.log('❌ RPC Function Error:', JSON.stringify(readTest.error, null, 2));
      console.log('\n🔍 Checking alternative function names...');

      // Try alternative name patterns
      const alternatives = [
        'hera_organization_crud_v1',
        'hera_org_crud_v1',
        'create_organization',
        'manage_organization'
      ];

      for (const funcName of alternatives) {
        console.log(`   Trying: ${funcName}...`);
        const altTest = await supabase.rpc(funcName, {
          p_action: 'READ',
          p_actor_user_id: testData.user_entity_id,
          p_organization: {}
        });

        if (!altTest.error) {
          console.log(`   ✅ Found working function: ${funcName}`);
          break;
        }
      }

      return;
    }

    console.log('✅ RPC Function exists and is accessible!');
    console.log('📦 Current organizations:', JSON.stringify(readTest.data, null, 2));

    // Step 2: Check if HERA ERP DEMO already exists
    console.log('\n🔍 Step 2: Checking if "HERA ERP DEMO" organization already exists...');
    const { data: existingOrgs, error: queryError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_name', 'HERA ERP DEMO');

    if (queryError) {
      console.log('⚠️ Cannot query organizations directly:', queryError.message);
    } else if (existingOrgs && existingOrgs.length > 0) {
      console.log('✅ HERA ERP DEMO already exists!');
      console.log('📦 Existing organization:', JSON.stringify(existingOrgs[0], null, 2));
      return;
    } else {
      console.log('ℹ️  HERA ERP DEMO does not exist yet.');
    }

    // Step 3: Create the HERA ERP DEMO organization
    console.log('\n🔬 Step 3: Creating HERA ERP DEMO organization...');
    console.log('Using correct signature: p_action, p_actor_user_id, p_limit, p_offset, p_payload');

    const createResult = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.user_entity_id,
      p_limit: null,
      p_offset: null,
      p_payload: {
        organization_name: 'HERA ERP DEMO',
        organization_code: 'HERA-DEMO',
        organization_type: 'DEMO',
        industry_classification: 'MULTI_INDUSTRY',
        status: 'active'
      }
    });

    if (createResult.error) {
      console.log('❌ CREATE Error:', JSON.stringify(createResult.error, null, 2));

      // If error mentions signature, show what we tried
      if (createResult.error.message?.includes('signature') || createResult.error.message?.includes('parameters')) {
        console.log('\n📋 We tried the following parameters:');
        console.log('   - p_action: "CREATE"');
        console.log('   - p_actor_user_id: (user entity ID)');
        console.log('   - p_organization: (organization object)');
        console.log('   - p_options: {}');
        console.log('\n💡 The function may require different parameters.');
        console.log('   Please check the Supabase dashboard or RPC function definition.');
      }
    } else {
      console.log('✅ CREATE Success!');
      console.log('🎉 HERA ERP DEMO organization created:');
      console.log(JSON.stringify(createResult.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.details) {
      console.error('📋 Error details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
  }
}

// Run the test
testOrganizationCRUD();
