#!/usr/bin/env node
/**
 * Verify specific retail user ID
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const RETAIL_USER_ID = 'b9789231-866a-4bca-921f-9148deb36eac';
const TARGET_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyRetailUser() {
  console.log('🔍 Verifying Retail User ID\n');
  
  console.log('📋 Configuration:');
  console.log(`   Retail User ID: ${RETAIL_USER_ID}`);
  console.log(`   Target Org: ${TARGET_ORG_ID}\n`);

  try {
    // Check if user exists
    console.log('1️⃣ Checking User Entity');
    console.log('========================');
    
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', RETAIL_USER_ID);
      
    if (userError) {
      console.log('❌ Error fetching user:', userError.message);
      return;
    }
    
    if (!userEntity || userEntity.length === 0) {
      console.log('❌ User not found with this ID');
      return;
    }
    
    const user = userEntity[0];
    console.log('✅ User found:');
    console.log(`   Name: ${user.entity_name}`);
    console.log(`   Type: ${user.entity_type}`);
    console.log(`   Code: ${user.entity_code}`);
    console.log(`   Organization: ${user.organization_id}`);
    console.log(`   Created: ${user.created_at}`);

    // Check if user is in correct organization
    console.log('\n2️⃣ Organization Check');
    console.log('======================');
    
    if (user.organization_id === TARGET_ORG_ID) {
      console.log('✅ User is in the target organization!');
    } else {
      console.log(`❌ User is in different organization: ${user.organization_id}`);
      console.log(`   Expected: ${TARGET_ORG_ID}`);
    }

    // Test entity creation with this user
    console.log('\n3️⃣ Testing Entity Creation');
    console.log('============================');
    
    const testResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: RETAIL_USER_ID,
      p_organization_id: TARGET_ORG_ID,
      p_entity: {
        entity_type: 'PRODUCT',
        entity_name: 'Test Product Verification',
        entity_code: 'TEST-VERIFY-001',
        entity_description: 'Test product to verify user works',
        smart_code: 'HERA.SOFTWARE.PRODUCT.TEST.VERIFY.v1'
      },
      p_dynamic: {
        test_field: {
          field_type: 'text',
          field_value_text: 'verification_test',
          smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.TEST.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    });

    console.log('Test creation result:');
    if (testResult.error) {
      console.log('❌ Supabase Error:', testResult.error);
    } else if (testResult.data?.error) {
      console.log('❌ RPC Error:', testResult.data.error);
      console.log('   Context:', testResult.data.context);
    } else {
      console.log('✅ SUCCESS! User can create entities');
      console.log('   Response:', testResult.data);
      
      const entityId = testResult.data?.items?.[0]?.id || 
                      testResult.data?.entity_id ||
                      testResult.data?.id;
      
      if (entityId) {
        console.log(`   Entity ID: ${entityId}`);
        console.log('\n🎯 PERFECT! This user works for entity creation');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

verifyRetailUser();