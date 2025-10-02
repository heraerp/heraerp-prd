#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function compareRPCvsDirectQuery() {
  console.log('🔍 Comparing RPC Function vs Direct Query Results');
  console.log('=' . repeat(60));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz Salon - DNA Testing

  // 1. Try Direct Query (what Universal API v2 currently does)
  console.log('\n📊 Method 1: Direct Query (Current Universal API v2)');
  console.log('-'.repeat(40));
  try {
    const { data: directData, error: directError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'service')
      .limit(5);

    if (directError) {
      console.error('❌ Direct query error:', directError);
    } else {
      console.log(`✅ Direct query successful: Found ${directData?.length || 0} services`);
      if (directData && directData.length > 0) {
        directData.forEach((service, i) => {
          console.log(`  ${i + 1}. ${service.entity_name} (${service.entity_code || 'no code'})`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Direct query exception:', err);
  }

  // 2. Try RPC Function (currently broken)
  console.log('\n📊 Method 2: RPC Function hera_entity_read_v1');
  console.log('-'.repeat(40));
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('hera_entity_read_v1', {
      p_organization_id: orgId,
      p_entity_type: 'service',
      p_limit: 5,
      p_include_dynamic_data: false, // Set to false to avoid the metadata error
      p_include_relationships: false
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError.message);
    } else {
      console.log('✅ RPC function successful');
      if (rpcData?.success && rpcData?.data) {
        console.log(`  Found ${rpcData.data.length} services`);
        rpcData.data.forEach((service, i) => {
          console.log(`  ${i + 1}. ${service.entity_name} (${service.entity_code || 'no code'})`);
        });
      } else if (rpcData?.entities) {
        // Alternative structure
        console.log(`  Found ${rpcData.entities.length} services`);
        rpcData.entities.forEach((service, i) => {
          console.log(`  ${i + 1}. ${service.entity_name} (${service.entity_code || 'no code'})`);
        });
      }
    }
  } catch (err) {
    console.error('❌ RPC exception:', err);
  }

  // 3. Try with dynamic data separately
  console.log('\n📊 Method 3: Direct Query with Dynamic Data Join');
  console.log('-'.repeat(40));
  try {
    const { data: entitiesWithDynamic, error: joinError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_number,
          field_value_json
        )
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'service')
      .limit(5);

    if (joinError) {
      console.error('❌ Join query error:', joinError);
    } else {
      console.log(`✅ Join query successful: Found ${entitiesWithDynamic?.length || 0} services`);
      if (entitiesWithDynamic && entitiesWithDynamic.length > 0) {
        entitiesWithDynamic.forEach((service, i) => {
          console.log(`  ${i + 1}. ${service.entity_name}`);
          if (service.core_dynamic_data && service.core_dynamic_data.length > 0) {
            console.log(`     Dynamic fields: ${service.core_dynamic_data.map(f => f.field_name).join(', ')}`);
          }
        });
      }
    }
  } catch (err) {
    console.error('❌ Join query exception:', err);
  }

  console.log('\n' + '=' . repeat(60));
  console.log('📋 Summary:');
  console.log('- Direct queries work fine');
  console.log('- RPC function has metadata column error when include_dynamic_data=true');
  console.log('- Migration file created to fix the RPC function');
  console.log('- Universal API v2 should either:');
  console.log('  1. Continue using direct queries (current approach)');
  console.log('  2. Switch to RPC functions after fixing them');
}

compareRPCvsDirectQuery();