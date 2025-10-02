#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEntityDelete() {
  console.log('🧪 Testing hera_entity_delete_v1 RPC vs Universal API deleteEntity');
  console.log('=' . repeat(70));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

  // First, create test entities using RPC (since we know it works)
  console.log('\n📋 Step 1: Creating test entities for deletion testing');
  console.log('-'.repeat(50));

  let testEntity1Id = null;
  let testEntity2Id = null;

  try {
    // Create entity 1 for RPC deletion test
    const { data: entity1Data, error: entity1Error } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: orgId,
      p_entity_type: 'service',
      p_entity_name: 'Test Delete Service 1 - RPC Method',
      p_entity_code: 'DELETE-TEST-RPC-' + Date.now(),
      p_smart_code: 'HERA.SALON.SVC.DELETE.TEST.v1',
      p_metadata: { test_purpose: 'RPC deletion test' }
    });

    if (entity1Error) {
      console.error('❌ Failed to create test entity 1:', entity1Error.message);
    } else {
      testEntity1Id = entity1Data; // RPC returns just the ID
      console.log(`✅ Created test entity 1: ${testEntity1Id}`);
    }

    // Create entity 2 for direct deletion test
    const { data: entity2Data, error: entity2Error } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: orgId,
      p_entity_type: 'service',
      p_entity_name: 'Test Delete Service 2 - Direct Method',
      p_entity_code: 'DELETE-TEST-DIRECT-' + Date.now(),
      p_smart_code: 'HERA.SALON.SVC.DELETE.TEST.v1',
      p_metadata: { test_purpose: 'Direct deletion test' }
    });

    if (entity2Error) {
      console.error('❌ Failed to create test entity 2:', entity2Error.message);
    } else {
      testEntity2Id = entity2Data; // RPC returns just the ID
      console.log(`✅ Created test entity 2: ${testEntity2Id}`);
    }
  } catch (err) {
    console.error('❌ Exception creating test entities:', err.message);
    return;
  }

  if (!testEntity1Id || !testEntity2Id) {
    console.error('❌ Failed to create test entities. Cannot proceed with deletion tests.');
    return;
  }

  // Method 1: RPC Function hera_entity_delete_v1
  console.log('\n📊 Method 1: RPC Function hera_entity_delete_v1');
  console.log('-'.repeat(50));

  try {
    const { data: rpcDeleteData, error: rpcDeleteError } = await supabase.rpc('hera_entity_delete_v1', {
      p_entity_id: testEntity1Id,
      p_organization_id: orgId,
      p_soft_delete: true // Test soft delete first
    });

    if (rpcDeleteError) {
      console.error('❌ RPC delete error:', rpcDeleteError.message);
    } else {
      console.log('✅ RPC delete successful');
      console.log('  Response:', JSON.stringify(rpcDeleteData, null, 2));

      // Verify the entity is marked as deleted (check what method RPC uses)
      const { data: checkData, error: checkError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', testEntity1Id)
        .single();

      if (checkError) {
        console.log('  Entity not found after RPC delete (hard delete)');
      } else {
        console.log(`  Entity still exists - Status: ${checkData.status || 'no status field'}`);
        console.log(`  Entity metadata: ${JSON.stringify(checkData.metadata || {})}`);
      }
    }
  } catch (err) {
    console.error('❌ RPC delete exception:', err.message);
  }

  // Method 2: Universal API v2 deleteEntity (Direct Supabase)
  console.log('\n📊 Method 2: Universal API v2 deleteEntity (Direct Supabase)');
  console.log('-'.repeat(50));

  try {
    // Universal API v2 likely does direct delete or soft delete via status update
    // Let's try both approaches

    // First try: Update status to 'deleted' (soft delete)
    const { data: directSoftData, error: directSoftError } = await supabase
      .from('core_entities')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', testEntity2Id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (directSoftError) {
      console.error('❌ Direct soft delete error:', directSoftError.message);

      // If soft delete fails, try hard delete
      console.log('  Trying hard delete...');
      const { data: directHardData, error: directHardError } = await supabase
        .from('core_entities')
        .delete()
        .eq('id', testEntity2Id)
        .eq('organization_id', orgId);

      if (directHardError) {
        console.error('❌ Direct hard delete error:', directHardError.message);
      } else {
        console.log('✅ Direct hard delete successful');
      }
    } else {
      console.log('✅ Direct soft delete successful');
      console.log(`  Updated entity status: ${directSoftData.status}`);
      console.log(`  Updated at: ${directSoftData.updated_at}`);
    }
  } catch (err) {
    console.error('❌ Direct delete exception:', err.message);
  }

  // Summary
  console.log('\n' + '=' . repeat(70));
  console.log('📋 Delete Method Comparison:');
  console.log('- RPC hera_entity_delete_v1: May implement soft/hard delete logic');
  console.log('- Universal API v2: Uses direct Supabase delete or status updates');
  console.log('- Both should handle organization_id filtering properly');

  // Final cleanup - try to remove any remaining test entities
  console.log('\n🧹 Final cleanup of any remaining test entities...');
  try {
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', orgId)
      .like('entity_code', 'DELETE-TEST-%');
    console.log('✅ Cleanup completed');
  } catch (err) {
    console.log('⚠️ Cleanup may have failed:', err.message);
  }
}

testEntityDelete();