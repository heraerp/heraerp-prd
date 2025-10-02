#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEntityUpsert() {
  console.log('🧪 Testing hera_entity_upsert_v1 RPC vs Universal API createEntity');
  console.log('=' . repeat(70));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

  // Test data for a new service
  const testService = {
    organization_id: orgId,
    entity_type: 'service',
    entity_name: 'Test Service - RPC vs API Comparison',
    entity_code: 'TEST-SERVICE-' + Date.now(),
    smart_code: 'HERA.SALON.SVC.TEST.COMPARISON.v1',
    metadata: {
      price: 99.99,
      duration: 45,
      test_type: 'RPC vs API comparison'
    }
  };

  console.log('\n📋 Test Service Data:');
  console.log(JSON.stringify(testService, null, 2));

  // Method 1: Universal API v2 createEntity (Direct Supabase)
  console.log('\n📊 Method 1: Universal API v2 createEntity (Direct Supabase)');
  console.log('-'.repeat(50));

  let directEntityId = null;
  try {
    const { data: directData, error: directError } = await supabase
      .from('core_entities')
      .insert([testService])
      .select()
      .single();

    if (directError) {
      console.error('❌ Direct insert error:', directError.message);
    } else {
      directEntityId = directData.id;
      console.log('✅ Direct insert successful');
      console.log(`  Entity ID: ${directData.id}`);
      console.log(`  Entity Name: ${directData.entity_name}`);
      console.log(`  Entity Code: ${directData.entity_code}`);
      console.log(`  Smart Code: ${directData.smart_code}`);
      console.log(`  Metadata: ${JSON.stringify(directData.metadata)}`);
    }
  } catch (err) {
    console.error('❌ Direct insert exception:', err.message);
  }

  // Method 2: RPC Function hera_entity_upsert_v1
  console.log('\n📊 Method 2: RPC Function hera_entity_upsert_v1');
  console.log('-'.repeat(50));

  const rpcService = {
    ...testService,
    entity_code: 'TEST-SERVICE-RPC-' + Date.now(),
    entity_name: 'Test Service - RPC Method'
  };

  let rpcEntityId = null;
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: rpcService.organization_id,
      p_entity_type: rpcService.entity_type,
      p_entity_name: rpcService.entity_name,
      p_entity_code: rpcService.entity_code,
      p_smart_code: rpcService.smart_code,
      p_metadata: rpcService.metadata
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError.message);
    } else {
      console.log('✅ RPC function successful');
      if (rpcData?.success && rpcData?.data) {
        rpcEntityId = rpcData.data.id || rpcData.data.entity_id;
        console.log(`  Entity ID: ${rpcEntityId}`);
        console.log(`  Entity Name: ${rpcData.data.entity_name}`);
        console.log(`  Entity Code: ${rpcData.data.entity_code}`);
        console.log(`  Smart Code: ${rpcData.data.smart_code}`);
        console.log(`  Metadata: ${JSON.stringify(rpcData.data.metadata)}`);
        console.log(`  Full Response: ${JSON.stringify(rpcData, null, 2)}`);
      } else {
        console.log('  Unexpected response structure:', JSON.stringify(rpcData, null, 2));
      }
    }
  } catch (err) {
    console.error('❌ RPC exception:', err.message);
  }

  // Method 3: Test UPDATE with RPC (if create worked)
  if (rpcEntityId) {
    console.log('\n📊 Method 3: Test RPC UPDATE functionality');
    console.log('-'.repeat(50));

    try {
      const { data: updateData, error: updateError } = await supabase.rpc('hera_entity_upsert_v1', {
        p_entity_id: rpcEntityId,
        p_organization_id: orgId,
        p_entity_name: 'Test Service - RPC Method (UPDATED)',
        p_metadata: {
          price: 129.99,
          duration: 60,
          test_type: 'RPC update test',
          updated: true
        }
      });

      if (updateError) {
        console.error('❌ RPC update error:', updateError.message);
      } else {
        console.log('✅ RPC update successful');
        if (updateData?.success && updateData?.data) {
          console.log(`  Updated Name: ${updateData.data.entity_name}`);
          console.log(`  Updated Metadata: ${JSON.stringify(updateData.data.metadata)}`);
        }
      }
    } catch (err) {
      console.error('❌ RPC update exception:', err.message);
    }
  }

  // Cleanup: Remove test entities
  console.log('\n🧹 Cleaning up test entities...');

  if (directEntityId) {
    try {
      await supabase.from('core_entities').delete().eq('id', directEntityId);
      console.log('✅ Direct entity cleaned up');
    } catch (err) {
      console.log('⚠️ Direct entity cleanup failed:', err.message);
    }
  }

  if (rpcEntityId) {
    try {
      await supabase.from('core_entities').delete().eq('id', rpcEntityId);
      console.log('✅ RPC entity cleaned up');
    } catch (err) {
      console.log('⚠️ RPC entity cleanup failed:', err.message);
    }
  }

  console.log('\n' + '=' . repeat(70));
  console.log('📋 Comparison Summary:');
  console.log('- Direct Supabase insert: Simple, fast, direct access');
  console.log('- RPC function: May have additional validation, error handling');
  console.log('- Both methods should create entities with same structure');
}

testEntityUpsert();