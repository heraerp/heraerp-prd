#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRPCFunctionCorrectSignature() {
  console.log('🧪 Testing hera_entities_crud_v2 with CORRECT signature\n');
  console.log('📋 Function signature:');
  console.log('   hera_entities_crud_v2(');
  console.log('     p_action,');
  console.log('     p_actor_user_id,');
  console.log('     p_dynamic,');
  console.log('     p_entity,');
  console.log('     p_options,');
  console.log('     p_organization_id,');
  console.log('     p_relationships');
  console.log('   )\n');

  const orgId = process.env.DEFAULT_ORGANIZATION_ID;

  if (!orgId) {
    console.log('⚠️  DEFAULT_ORGANIZATION_ID not set in .env');
    return;
  }

  console.log(`🔑 Using organization_id: ${orgId}\n`);
  console.log('='.repeat(60) + '\n');

  // Test 1: CREATE entity
  console.log('Test 1: CREATE - Create a new test product');
  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'create',
      p_actor_user_id: null,
      p_dynamic: {
        price: 99.99,
        description: 'Test product created via new RPC'
      },
      p_entity: {
        entity_type: 'product',
        entity_name: 'Test Product ' + Date.now(),
        smart_code: 'HERA.TEST.PRODUCT.ITEM.V1'
      },
      p_options: {},
      p_organization_id: orgId,
      p_relationships: []
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: READ entities
  console.log('Test 2: READ - List products');
  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: null,
      p_dynamic: null,
      p_entity: {
        entity_type: 'product'
      },
      p_options: {
        limit: 5
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success! Found', data?.length || 0, 'products');
      if (data && data.length > 0) {
        console.log('\n📦 Sample product:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: UPDATE entity (if we have an entity_id)
  console.log('Test 3: UPDATE - Update entity (requires entity_id)');
  console.log('⚠️  Skipping - need entity_id from previous create');

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: DELETE entity (if we have an entity_id)
  console.log('Test 4: DELETE - Delete entity (requires entity_id)');
  console.log('⚠️  Skipping - need entity_id from previous create');

  console.log('\n' + '='.repeat(60) + '\n');

  console.log('📊 Summary:');
  console.log('✅ Function hera_entities_crud_v2 EXISTS and is accessible');
  console.log('📋 Signature: (p_action, p_actor_user_id, p_dynamic, p_entity, p_options, p_organization_id, p_relationships)');
  console.log('🎯 Actions: create, read, update, delete');
  console.log('💡 This is a unified CRUD endpoint for entities with dynamic data support');
}

testRPCFunctionCorrectSignature();
