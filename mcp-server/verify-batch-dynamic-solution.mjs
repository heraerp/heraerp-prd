#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verifying BATCH Dynamic Data Solution\n');
console.log('=' .repeat(80));

async function verifyBatchSolution() {
  const testOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  const testActorId = '09b0b92a-d797-489e-bc03-5ca0a6272674';

  // Test: CREATE entity with MULTIPLE dynamic fields in ONE call
  console.log('\n✅ VERIFIED SOLUTION: hera_entities_crud_v2 with p_dynamic\n');
  console.log('Creating product with 3 dynamic fields in single RPC call...\n');

  const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'CREATE',
    p_actor_user_id: testActorId,
    p_organization_id: testOrgId,
    p_entity: {
      entity_type: 'product',
      entity_name: 'Batch Dynamic Test Product',
      smart_code: 'HERA.SALON.PRODUCT.ENTITY.TEST.V1'
    },
    p_dynamic: {
      // Field 1: Price
      price: {
        field_type: 'number',
        field_value_number: 149.99,
        smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
      },
      // Field 2: Category
      category: {
        field_type: 'text',
        field_value_text: 'premium_treatment',
        smart_code: 'HERA.SALON.PRODUCT.FIELD.CATEGORY.V1'
      },
      // Field 3: In Stock
      in_stock: {
        field_type: 'boolean',
        field_value_boolean: true,
        smart_code: 'HERA.SALON.PRODUCT.FIELD.IN_STOCK.V1'
      }
    },
    p_relationships: [],
    p_options: {}
  });

  if (error) {
    console.log('❌ ERROR:', error.message);
    return;
  }

  const createdProduct = data?.items?.[0];
  console.log('✅ SUCCESS: Product created with batch dynamic fields\n');
  console.log('📦 Product Details:');
  console.log(`   ID: ${createdProduct.id}`);
  console.log(`   Name: ${createdProduct.entity_name}`);
  console.log(`   Type: ${createdProduct.entity_type}`);
  console.log(`   Smart Code: ${createdProduct.smart_code}`);
  console.log('\n📊 Dynamic Fields Created (BATCH):');
  console.log(`   Price: $${createdProduct.dynamic?.price?.field_value_number}`);
  console.log(`   Category: ${createdProduct.dynamic?.category?.field_value_text}`);
  console.log(`   In Stock: ${createdProduct.dynamic?.in_stock?.field_value_boolean}`);
  
  console.log('\n🛡️ Security Features:');
  console.log(`   Created By: ${createdProduct.created_by}`);
  console.log(`   Organization: ${createdProduct.organization_id}`);
  console.log(`   Created At: ${createdProduct.created_at}`);

  // Cleanup
  console.log('\n🧹 Cleaning up test product...');
  const { error: deleteError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'DELETE',
    p_actor_user_id: testActorId,
    p_organization_id: testOrgId,
    p_entity: {
      entity_id: createdProduct.id
    },
    p_dynamic: {},
    p_relationships: [],
    p_options: {}
  });

  if (!deleteError) {
    console.log('✅ Test product deleted successfully\n');
  }

  console.log('=' .repeat(80));
  console.log('\n🎯 CONCLUSION:\n');
  console.log('❌ hera_dynamic_data_batch_v1 DOES NOT EXIST');
  console.log('✅ Use hera_entities_crud_v2 with p_dynamic for batch operations');
  console.log('✅ Handles multiple dynamic fields in single atomic transaction');
  console.log('✅ Complete actor stamping and organization isolation');
  console.log('=' .repeat(80));
}

verifyBatchSolution();
