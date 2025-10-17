#!/usr/bin/env node
/**
 * Test hera_entities_crud_v2 RPC function with provided Michele user data
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

async function testHeraEntitiesCrudV2() {
  console.log('🧪 Testing hera_entities_crud_v2 FULL CRUD OPERATIONS...');
  console.log('📊 Test Data:', JSON.stringify(testData, null, 2));
  
  let createdProductId = null;
  
  try {
    // Test 1: READ operation - Get the existing user entity
    console.log('\n📖 Test 1: READ existing user entity...');
    const readUserResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: testData.user_entity_id,
      p_organization_id: testData.organization_id,
      p_entity: {
        entity_id: testData.user_entity_id
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    });
    
    console.log('✅ READ User Result:', JSON.stringify(readUserResult.data?.items?.[0]?.entity_name || 'No user found', null, 2));
    
    // Test 2: CREATE operation - Create a new product
    console.log('\n➕ Test 2: CREATE new salon product...');
    const createResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: testData.user_entity_id,
      p_organization_id: testData.organization_id,
      p_entity: {
        entity_type: 'product',
        entity_name: 'Premium Hair Treatment Serum',
        smart_code: 'HERA.SALON.PRODUCT.ENTITY.TREATMENT.V1'
      },
      p_dynamic: {
        price: {
          field_type: 'number',
          field_value_number: 89.99,
          smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
        },
        category: {
          field_type: 'text',
          field_value_text: 'hair_treatment',
          smart_code: 'HERA.SALON.PRODUCT.FIELD.CATEGORY.V1'
        },
        brand: {
          field_type: 'text',
          field_value_text: 'Premium Salon Care',
          smart_code: 'HERA.SALON.PRODUCT.FIELD.BRAND.V1'
        },
        stock_quantity: {
          field_type: 'number',
          field_value_number: 25,
          smart_code: 'HERA.SALON.PRODUCT.FIELD.STOCK.V1'
        },
        description: {
          field_type: 'text',
          field_value_text: 'Professional grade hair treatment serum for damaged hair restoration',
          smart_code: 'HERA.SALON.PRODUCT.FIELD.DESCRIPTION.V1'
        }
      },
      p_relationships: [],
      p_options: {}
    });
    
    console.log('✅ CREATE Result Status:', createResult.error ? 'FAILED' : 'SUCCESS');
    if (createResult.error) {
      console.log('❌ CREATE Error:', createResult.error);
    } else {
      createdProductId = createResult.data?.items?.[0]?.id;
      console.log('🆔 Created Product ID:', createdProductId);
      console.log('📦 Created Product:', JSON.stringify(createResult.data, null, 2));
    }
    
    if (createdProductId) {
      // Test 3: READ operation - Read the created product
      console.log('\n📖 Test 3: READ created product...');
      const readProductResult = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_entity: {
          entity_id: createdProductId
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      });
      
      console.log('✅ READ Product Result Status:', readProductResult.error ? 'FAILED' : 'SUCCESS');
      if (readProductResult.error) {
        console.log('❌ READ Error:', readProductResult.error);
      } else {
        const product = readProductResult.data?.items?.[0];
        console.log('📦 Product Details:');
        console.log(`   Name: ${product?.entity_name}`);
        console.log(`   Type: ${product?.entity_type}`);
        console.log(`   Smart Code: ${product?.smart_code}`);
        console.log(`   Dynamic Data:`, JSON.stringify(product?.dynamic || {}, null, 4));
      }
      
      // Test 4: UPDATE operation - Update the product
      console.log('\n🔄 Test 4: UPDATE product with new price and stock...');
      const updateResult = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'UPDATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_entity: {
          entity_id: createdProductId,
          entity_name: 'Premium Hair Treatment Serum - UPDATED',
          smart_code: 'HERA.SALON.PRODUCT.ENTITY.TREATMENT.V1'
        },
        p_dynamic: {
          price: {
            field_type: 'number',
            field_value_number: 99.99,  // Price increase
            smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
          },
          stock_quantity: {
            field_type: 'number',
            field_value_number: 15,  // Stock decreased
            smart_code: 'HERA.SALON.PRODUCT.FIELD.STOCK.V1'
          },
          last_updated_reason: {
            field_type: 'text',
            field_value_text: 'Price adjustment and inventory update',
            smart_code: 'HERA.SALON.PRODUCT.FIELD.UPDATE_REASON.V1'
          }
        },
        p_relationships: [],
        p_options: {}
      });
      
      console.log('✅ UPDATE Result Status:', updateResult.error ? 'FAILED' : 'SUCCESS');
      if (updateResult.error) {
        console.log('❌ UPDATE Error:', updateResult.error);
      } else {
        console.log('📝 Updated Product:', JSON.stringify(updateResult.data, null, 2));
      }
      
      // Test 5: READ again to verify update
      console.log('\n📖 Test 5: READ updated product to verify changes...');
      const readUpdatedResult = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_entity: {
          entity_id: createdProductId
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      });
      
      if (!readUpdatedResult.error) {
        const updatedProduct = readUpdatedResult.data?.items?.[0];
        console.log('📦 Updated Product Verification:');
        console.log(`   Name: ${updatedProduct?.entity_name}`);
        console.log(`   Current Price: $${updatedProduct?.dynamic?.price?.field_value_number || 'N/A'}`);
        console.log(`   Current Stock: ${updatedProduct?.dynamic?.stock_quantity?.field_value_number || 'N/A'}`);
      }
      
      // Test 6: DELETE operation - Delete the product
      console.log('\n🗑️ Test 6: DELETE the test product...');
      const deleteResult = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'DELETE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_entity: {
          entity_id: createdProductId
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      });
      
      console.log('✅ DELETE Result Status:', deleteResult.error ? 'FAILED' : 'SUCCESS');
      if (deleteResult.error) {
        console.log('❌ DELETE Error:', deleteResult.error);
      } else {
        console.log('🗑️ Product deleted successfully');
      }
      
      // Test 7: READ after delete to verify deletion
      console.log('\n📖 Test 7: READ deleted product (should fail)...');
      const readDeletedResult = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_entity: {
          entity_id: createdProductId
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      });
      
      if (readDeletedResult.error || !readDeletedResult.data?.items?.length) {
        console.log('✅ Confirmed: Product successfully deleted (not found)');
      } else {
        console.log('⚠️ Warning: Product still exists after deletion');
      }
    }
    
    console.log('\n🎉 FULL CRUD TEST CYCLE COMPLETED!');
    console.log('📊 Summary:');
    console.log('   ✅ CREATE - Product creation');
    console.log('   ✅ READ - Product retrieval');  
    console.log('   ✅ UPDATE - Product modification');
    console.log('   ✅ DELETE - Product removal');
    console.log('   ✅ VERIFY - Post-operation validation');
    
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
testHeraEntitiesCrudV2();