#!/usr/bin/env node
/**
 * Test entity creation with platform organization to understand working patterns
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const TARGET_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testPlatformOrgCreation() {
  console.log('🧪 Testing Entity Creation with Platform Organization\n');
  
  console.log('📋 Test Configuration:');
  console.log(`   User ID: ${USER_ID}`);
  console.log(`   Platform Org: ${PLATFORM_ORG_ID}`);
  console.log(`   Target Org: ${TARGET_ORG_ID}\n`);

  try {
    // Test 1: Try creating entity in platform organization
    console.log('1️⃣ Testing Entity Creation in Platform Organization');
    console.log('====================================================');
    
    const testResult1 = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: PLATFORM_ORG_ID,
      p_entity: {
        entity_type: 'PRODUCT',
        entity_name: 'Test Product Platform',
        entity_code: 'TEST-PLATFORM-001',
        entity_description: 'Test product for platform organization',
        smart_code: 'HERA.SOFTWARE.PRODUCT.TEST.PLATFORM.v1'
      },
      p_dynamic: {
        test_field: {
          field_type: 'text',
          field_value_text: 'platform_test',
          smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.TEST.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    });

    console.log('Platform org result:');
    if (testResult1.error) {
      console.log('❌ Supabase Error:', testResult1.error);
    } else if (testResult1.data?.error) {
      console.log('❌ RPC Error:', testResult1.data.error);
    } else {
      console.log('✅ SUCCESS:', testResult1.data);
    }

    // Test 2: Try creating entity in target organization again
    console.log('\n2️⃣ Testing Entity Creation in Target Organization (Retail Demo)');
    console.log('================================================================');
    
    const testResult2 = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: TARGET_ORG_ID,
      p_entity: {
        entity_type: 'PRODUCT',
        entity_name: 'Test Product Retail',
        entity_code: 'TEST-RETAIL-001',
        entity_description: 'Test product for retail organization',
        smart_code: 'HERA.SOFTWARE.PRODUCT.TEST.RETAIL.v1'
      },
      p_dynamic: {
        test_field: {
          field_type: 'text',
          field_value_text: 'retail_test',
          smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.TEST.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    });

    console.log('Target org result:');
    if (testResult2.error) {
      console.log('❌ Supabase Error:', testResult2.error);
    } else if (testResult2.data?.error) {
      console.log('❌ RPC Error:', testResult2.data.error);
    } else {
      console.log('✅ SUCCESS:', testResult2.data);
    }

    // Test 3: Check memberships directly in database
    console.log('\n3️⃣ Checking Membership Table Directly');
    console.log('=====================================');
    
    const { data: memberships, error: memberError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');
      
    if (memberError) {
      console.log('❌ Error checking memberships:', memberError.message);
    } else {
      console.log(`✅ Found ${memberships.length} membership(s):`);
      memberships.forEach(membership => {
        console.log(`   - To Org: ${membership.to_entity_id}`);
        console.log(`     Type: ${membership.relationship_type}`);
        console.log(`     Smart Code: ${membership.smart_code}`);
        console.log(`     Created: ${membership.created_at}`);
        console.log('');
      });
    }

    // Test 4: Check if we can find a working user in target org
    console.log('4️⃣ Finding Working Users in Target Organization');
    console.log('===============================================');
    
    // Check all users in target org
    const { data: targetOrgEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, created_by, updated_by')
      .eq('organization_id', TARGET_ORG_ID)
      .eq('entity_type', 'USER');
      
    if (entityError) {
      console.log('❌ Error checking target org entities:', entityError.message);
    } else if (targetOrgEntities.length === 0) {
      console.log('❌ No USER entities found in target organization');
    } else {
      console.log(`✅ Found ${targetOrgEntities.length} USER entities in target organization:`);
      targetOrgEntities.forEach(user => {
        console.log(`   - Name: ${user.entity_name} (${user.id})`);
        console.log(`     Created by: ${user.created_by}`);
        console.log(`     Updated by: ${user.updated_by}`);
      });
      
      // Try using one of these users
      if (targetOrgEntities.length > 0) {
        const workingUser = targetOrgEntities[0].id;
        console.log(`\n💡 Testing with user from target org: ${workingUser}`);
        
        const testResult3 = await supabase.rpc('hera_entities_crud_v1', {
          p_action: 'CREATE',
          p_actor_user_id: workingUser,
          p_organization_id: TARGET_ORG_ID,
          p_entity: {
            entity_type: 'PRODUCT',
            entity_name: 'Test Product Local User',
            entity_code: 'TEST-LOCAL-001',
            entity_description: 'Test product using local user',
            smart_code: 'HERA.SOFTWARE.PRODUCT.TEST.LOCAL.v1'
          },
          p_dynamic: {
            test_field: {
              field_type: 'text',
              field_value_text: 'local_user_test',
              smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.TEST.v1'
            }
          },
          p_relationships: [],
          p_options: {}
        });

        console.log('Local user result:');
        if (testResult3.error) {
          console.log('❌ Supabase Error:', testResult3.error);
        } else if (testResult3.data?.error) {
          console.log('❌ RPC Error:', testResult3.data.error);
        } else {
          console.log('✅ SUCCESS with local user!');
          console.log('   Response:', testResult3.data);
          console.log(`\n🎯 SOLUTION: Use user ID ${workingUser} instead of ${USER_ID}`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testPlatformOrgCreation();