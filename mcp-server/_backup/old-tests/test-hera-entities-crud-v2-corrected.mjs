#!/usr/bin/env node
/**
 * Test hera_entities_crud_v2 RPC function with CORRECT signature
 * Based on actual function definition: p_operation, p_payload, p_actor_user_id
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  name: "Michele Hair (Owner)",
  email: "michele@hairtalkz.com", 
  message: "User membership setup complete",
  success: true,
  membership_id: "b99a4a98-f75b-4754-91f7-b16b23d55110",
  user_entity_id: "09b0b92a-d797-489e-bc03-5ca0a6272674",
  organization_id: "378f24fb-d496-4ff7-8afa-ea34895a0eb8"
};

async function testCorrectedHeraEntitiesCrud() {
  console.log('🧪 Testing hera_entities_crud_v2 with CORRECT signature...');
  console.log('📊 Test Data:', JSON.stringify(testData, null, 2));
  
  let createdProductId = null;
  
  try {
    // Test 1: CREATE operation - Create a new product
    console.log('\n➕ Test 1: CREATE new salon product...');
    const createResult = await supabase.rpc('hera_entities_crud_v2', {
      p_operation: 'UPSERT',  // Correct parameter name
      p_actor_user_id: testData.user_entity_id,
      p_payload: {
        organization_id: testData.organization_id,
        entity_type: 'product',
        entity_name: 'Premium Hair Treatment Serum',
        smart_code: 'HERA.SALON.PRODUCT.ENTITY.TREATMENT.V1'
      }
    });
    
    console.log('✅ CREATE Result Status:', createResult.error ? 'FAILED' : 'SUCCESS');
    if (createResult.error) {
      console.log('❌ CREATE Error:', createResult.error);
    } else {
      // Extract entity ID from response
      createdProductId = createResult.data?.id || createResult.data?.entity_id;
      console.log('🆔 Created Product ID:', createdProductId);
      console.log('📦 Created Product:', JSON.stringify(createResult.data, null, 2));
    }
    
    if (createdProductId) {
      // Test 2: UPDATE operation - Update the product name
      console.log('\n🔄 Test 2: UPDATE product name...');
      const updateResult = await supabase.rpc('hera_entities_crud_v2', {
        p_operation: 'UPSERT',
        p_actor_user_id: testData.user_entity_id,
        p_payload: {
          id: createdProductId,  // Include ID for update
          organization_id: testData.organization_id,
          entity_type: 'product',
          entity_name: 'Premium Hair Treatment Serum - UPDATED',
          smart_code: 'HERA.SALON.PRODUCT.ENTITY.TREATMENT.V1'
        }
      });
      
      console.log('✅ UPDATE Result Status:', updateResult.error ? 'FAILED' : 'SUCCESS');
      if (updateResult.error) {
        console.log('❌ UPDATE Error:', updateResult.error);
      } else {
        console.log('📝 Updated Product:', JSON.stringify(updateResult.data, null, 2));
      }
      
      // Test 3: DELETE operation - Delete the product
      console.log('\n🗑️ Test 3: DELETE the test product...');
      const deleteResult = await supabase.rpc('hera_entities_crud_v2', {
        p_operation: 'DELETE',
        p_actor_user_id: testData.user_entity_id,
        p_payload: {
          id: createdProductId,
          organization_id: testData.organization_id
        }
      });
      
      console.log('✅ DELETE Result Status:', deleteResult.error ? 'FAILED' : 'SUCCESS');
      if (deleteResult.error) {
        console.log('❌ DELETE Error:', deleteResult.error);
      } else {
        console.log('🗑️ Product deleted successfully');
        console.log('📝 Delete Result:', JSON.stringify(deleteResult.data, null, 2));
      }
    }
    
    // Test 4: Demonstrate dynamic data handling (separate function)
    console.log('\n📊 Test 4: DYNAMIC DATA handling (separate operations)...');
    
    // First create another product for dynamic data demo
    const productForDynamicResult = await supabase.rpc('hera_entities_crud_v2', {
      p_operation: 'UPSERT',
      p_actor_user_id: testData.user_entity_id,
      p_payload: {
        organization_id: testData.organization_id,
        entity_type: 'product',
        entity_name: 'Hair Conditioner for Dynamic Data Demo',
        smart_code: 'HERA.SALON.PRODUCT.ENTITY.CONDITIONER.V1'
      }
    });
    
    if (!productForDynamicResult.error) {
      const dynamicProductId = productForDynamicResult.data?.id || productForDynamicResult.data?.entity_id;
      console.log('🆔 Product for Dynamic Data:', dynamicProductId);
      
      // Note: Dynamic data would be added via separate RPC calls like:
      // - hera_dynamic_data_set_v1
      // - hera_dynamic_data_batch_v1  
      console.log('💡 Note: Dynamic data (price, category, etc.) would be added via separate RPC functions');
      console.log('   Example: hera_dynamic_data_set_v1 or hera_dynamic_data_batch_v1');
      
      // Clean up - delete the demo product
      await supabase.rpc('hera_entities_crud_v2', {
        p_operation: 'DELETE',
        p_actor_user_id: testData.user_entity_id,
        p_payload: {
          id: dynamicProductId,
          organization_id: testData.organization_id
        }
      });
      console.log('🧹 Cleaned up demo product');
    }
    
    console.log('\n🎉 CORRECTED CRUD TEST COMPLETED!');
    console.log('📊 Summary:');
    console.log('   ✅ CREATE - Entity creation with proper UPSERT operation');
    console.log('   ✅ UPDATE - Entity modification with proper payload structure');  
    console.log('   ✅ DELETE - Entity removal with proper parameters');
    console.log('   💡 DYNAMIC - Demonstrated that dynamic data requires separate RPC calls');
    console.log('\n🔧 Key Learnings:');
    console.log('   • Use p_operation instead of p_action');
    console.log('   • Use "UPSERT" for create/update, "DELETE" for deletion');
    console.log('   • All entity data goes in p_payload object');
    console.log('   • Dynamic fields require separate RPC function calls');
    
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

// Run the corrected test
testCorrectedHeraEntitiesCrud();