#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRelationshipsRPC() {
  console.log('🧪 Testing Relationship RPC vs Universal API createRelationship');
  console.log('=' . repeat(70));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

  // Get two existing entities for relationship testing
  console.log('\n📋 Finding existing entities for relationship testing...');
  const { data: entities, error: entitiesError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('organization_id', orgId)
    .limit(2);

  if (entitiesError || !entities || entities.length < 2) {
    console.error('❌ Need at least 2 entities for testing:', entitiesError?.message);
    return;
  }

  const entity1 = entities[0];
  const entity2 = entities[1];
  console.log(`✅ Entity 1: ${entity1.entity_name} (${entity1.entity_type})`);
  console.log(`✅ Entity 2: ${entity2.entity_name} (${entity2.entity_type})`);

  // Method 1: Universal API v2 createRelationship (Direct Supabase)
  console.log('\n📊 Method 1: Universal API v2 createRelationship (Direct Supabase)');
  console.log('-'.repeat(50));

  const testRelationship = {
    organization_id: orgId,
    from_entity_id: entity1.id,
    to_entity_id: entity2.id,
    relationship_type: 'test_relationship',
    smart_code: 'HERA.TEST.REL.SERVICE.RELATED.v1',
    relationship_data: {
      test_purpose: 'RPC vs API comparison',
      created_method: 'direct_supabase'
    }
  };

  let directRelationshipId = null;
  try {
    const { data: directData, error: directError } = await supabase
      .from('core_relationships')
      .insert([testRelationship])
      .select()
      .single();

    if (directError) {
      console.error('❌ Direct relationship error:', directError.message);
    } else {
      directRelationshipId = directData.id;
      console.log('✅ Direct relationship successful');
      console.log(`  Relationship ID: ${directData.id}`);
      console.log(`  From Entity: ${entity1.entity_name}`);
      console.log(`  To Entity: ${entity2.entity_name}`);
      console.log(`  Type: ${directData.relationship_type}`);
      console.log(`  Smart Code: ${directData.smart_code}`);
    }
  } catch (err) {
    console.error('❌ Direct relationship exception:', err.message);
  }

  // Method 2: Test relationship RPC functions
  console.log('\n📊 Method 2: Testing Relationship RPC Functions');
  console.log('-'.repeat(50));

  // Try different RPC function names
  const rpcFunctions = [
    'hera_relationship_create_v1',
    'hera_relationship_upsert_v1',
    'hera_relationship_read_v1'
  ];

  for (const funcName of rpcFunctions) {
    console.log(`\nTesting ${funcName}...`);
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(funcName, {
        p_organization_id: orgId,
        p_from_entity_id: entity1.id,
        p_to_entity_id: entity2.id,
        p_relationship_type: 'test_rpc_relationship',
        p_smart_code: 'HERA.TEST.REL.RPC.METHOD.v1'
      });

      if (rpcError) {
        if (rpcError.message.includes('Could not find the function')) {
          console.log(`  ❌ Function ${funcName} not found`);
        } else {
          console.log(`  ❌ Function error: ${rpcError.message}`);
        }
      } else {
        console.log(`  ✅ Function ${funcName} successful`);
        console.log(`  Response:`, JSON.stringify(rpcData, null, 2));
      }
    } catch (err) {
      console.log(`  ❌ Function exception: ${err.message}`);
    }
  }

  // Method 3: Read relationships via direct query vs RPC
  console.log('\n📊 Method 3: Reading Relationships - Direct vs RPC');
  console.log('-'.repeat(50));

  // Direct query
  try {
    const { data: directReadData, error: directReadError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', orgId)
      .eq('relationship_type', 'test_relationship')
      .limit(5);

    if (directReadError) {
      console.error('❌ Direct relationship read error:', directReadError.message);
    } else {
      console.log(`✅ Direct read successful - Found ${directReadData.length} relationships`);
      directReadData.forEach((rel, i) => {
        console.log(`  ${i + 1}. ${rel.relationship_type} (${rel.smart_code})`);
      });
    }
  } catch (err) {
    console.error('❌ Direct read exception:', err.message);
  }

  // Try RPC read
  try {
    const { data: rpcReadData, error: rpcReadError } = await supabase.rpc('hera_relationship_read_v1', {
      p_organization_id: orgId,
      p_relationship_type: 'test_relationship'
    });

    if (rpcReadError) {
      if (rpcReadError.message.includes('Could not find the function')) {
        console.log('❌ RPC relationship read function not found');
      } else {
        console.log('❌ RPC read error:', rpcReadError.message);
      }
    } else {
      console.log('✅ RPC read successful');
      console.log('  Response:', JSON.stringify(rpcReadData, null, 2));
    }
  } catch (err) {
    console.log('❌ RPC read exception:', err.message);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test relationships...');
  if (directRelationshipId) {
    try {
      await supabase
        .from('core_relationships')
        .delete()
        .eq('id', directRelationshipId);
      console.log('✅ Direct relationship cleaned up');
    } catch (err) {
      console.log('⚠️ Cleanup failed:', err.message);
    }
  }

  // Also cleanup any other test relationships
  try {
    await supabase
      .from('core_relationships')
      .delete()
      .eq('organization_id', orgId)
      .in('relationship_type', ['test_relationship', 'test_rpc_relationship']);
    console.log('✅ All test relationships cleaned up');
  } catch (err) {
    console.log('⚠️ General cleanup failed:', err.message);
  }

  console.log('\n' + '=' . repeat(70));
  console.log('📋 Relationship Comparison Summary:');
  console.log('- Direct Supabase: Simple insert/select operations');
  console.log('- RPC functions: May provide relationship validation and business logic');
  console.log('- Both should maintain referential integrity and multi-tenant isolation');
}

testRelationshipsRPC();