#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRPCFunction() {
  console.log('🧪 Testing hera_entities_crud_v2 RPC function\n');

  // Get organization ID from env
  const orgId = process.env.DEFAULT_ORGANIZATION_ID;

  if (!orgId) {
    console.log('⚠️  DEFAULT_ORGANIZATION_ID not set in .env');
    return;
  }

  console.log(`📋 Using organization_id: ${orgId}\n`);

  // Test 1: List entities
  console.log('Test 1: List entities (READ operation)');
  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_operation: 'read',
      p_organization_id: orgId,
      p_entity_type: 'product',
      p_limit: 5
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success! Found', data?.length || 0, 'products');
      if (data && data.length > 0) {
        console.log('   Sample entity:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Create entity
  console.log('Test 2: Create entity (CREATE operation)');
  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_operation: 'create',
      p_organization_id: orgId,
      p_entity_type: 'test_product',
      p_entity_name: 'Test Product ' + Date.now(),
      p_smart_code: 'HERA.TEST.PRODUCT.ITEM.V1'
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success! Created entity with ID:', data);
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Check if function exists at all
  console.log('Test 3: List all available hera_ RPC functions');
  try {
    // Try calling a known function to verify connection
    const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: orgId,
      p_entity_type: 'test',
      p_entity_name: 'Connection Test'
    });

    if (error && error.code === 'PGRST202') {
      console.log('❌ Connection issue or function not exposed via PostgREST');
    } else if (error) {
      console.log('⚠️  Function exists but returned error:', error.message);
    } else {
      console.log('✅ Connection to Supabase RPC working fine');
      console.log('   Known function hera_entity_upsert_v1 is accessible');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('💡 Note: If hera_entities_crud_v2 errors with PGRST202,');
  console.log('   it means the function either:');
  console.log('   1. Does not exist in the database');
  console.log('   2. Exists but is not exposed via PostgREST API');
  console.log('   3. Has different parameter names than expected');
}

testRPCFunction();
