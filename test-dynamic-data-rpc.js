#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDynamicDataRPC() {
  console.log('🧪 Testing Dynamic Data RPC vs Universal API setDynamicField');
  console.log('=' . repeat(70));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

  // Use an existing service entity for testing
  console.log('\n📋 Finding an existing service entity for testing...');
  const { data: services, error: servicesError } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', orgId)
    .eq('entity_type', 'service')
    .limit(1);

  if (servicesError || !services || services.length === 0) {
    console.error('❌ No services found for testing:', servicesError?.message);
    return;
  }

  const testEntityId = services[0].id;
  const testEntityName = services[0].entity_name;
  console.log(`✅ Using entity: ${testEntityName} (ID: ${testEntityId})`);

  // Method 1: Universal API v2 setDynamicField (Direct Supabase)
  console.log('\n📊 Method 1: Universal API v2 setDynamicField (Direct Supabase)');
  console.log('-'.repeat(50));

  const testField = {
    organization_id: orgId,
    entity_id: testEntityId,
    field_name: 'test_field_direct',
    field_type: 'text',
    field_value_text: 'Direct API Test Value',
    smart_code: 'HERA.TEST.DYNAMIC.DATA.FIELD.DIRECT.V1' // 6 segments with uppercase V1
  };

  try {
    // First, try to delete any existing field with same name
    await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', testEntityId)
      .eq('field_name', 'test_field_direct');

    // Then insert the new field
    const { data: directData, error: directError } = await supabase
      .from('core_dynamic_data')
      .insert([testField])
      .select()
      .single();

    if (directError) {
      console.error('❌ Direct dynamic data error:', directError.message);
    } else {
      console.log('✅ Direct dynamic data successful');
      console.log(`  Field ID: ${directData.id}`);
      console.log(`  Field Name: ${directData.field_name}`);
      console.log(`  Field Value: ${directData.field_value_text}`);
      console.log(`  Smart Code: ${directData.smart_code}`);
    }
  } catch (err) {
    console.error('❌ Direct dynamic data exception:', err.message);
  }

  // Method 2: Test available RPC functions for dynamic data
  console.log('\n📊 Method 2: Testing Dynamic Data RPC Functions');
  console.log('-'.repeat(50));

  // Try hera_dynamic_data_set_v1
  console.log('\nTesting hera_dynamic_data_set_v1...');
  try {
    const { data: setRpcData, error: setRpcError } = await supabase.rpc('hera_dynamic_data_set_v1', {
      p_organization_id: orgId,
      p_entity_id: testEntityId,
      p_field_name: 'test_field_rpc',
      p_field_type: 'text',
      p_field_value_text: 'RPC Test Value',
      p_smart_code: 'HERA.TEST.DYNAMIC.DATA.FIELD.RPC.V1' // 6 segments with uppercase V1
    });

    if (setRpcError) {
      console.error('❌ RPC set error:', setRpcError.message);
    } else {
      console.log('✅ RPC set successful');
      console.log('  Response:', JSON.stringify(setRpcData, null, 2));
    }
  } catch (err) {
    console.error('❌ RPC set exception:', err.message);
  }

  // Try hera_dynamic_data_get_v1 (we fixed this one)
  console.log('\nTesting hera_dynamic_data_get_v1...');
  try {
    const { data: getRpcData, error: getRpcError } = await supabase.rpc('hera_dynamic_data_get_v1', {
      p_organization_id: orgId,
      p_entity_id: testEntityId,
      p_limit: 10
    });

    if (getRpcError) {
      console.error('❌ RPC get error:', getRpcError.message);
    } else {
      console.log('✅ RPC get successful');
      if (getRpcData?.success && getRpcData?.data) {
        console.log(`  Found ${getRpcData.data.length} dynamic fields:`);
        getRpcData.data.forEach((field, i) => {
          console.log(`    ${i + 1}. ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_json || 'null'}`);
        });
      } else {
        console.log('  Response:', JSON.stringify(getRpcData, null, 2));
      }
    }
  } catch (err) {
    console.error('❌ RPC get exception:', err.message);
  }

  // Method 3: Compare Direct Query vs RPC Get
  console.log('\n📊 Method 3: Direct Query vs RPC Get Comparison');
  console.log('-'.repeat(50));

  try {
    const { data: directQueryData, error: directQueryError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_id', testEntityId)
      .limit(10);

    if (directQueryError) {
      console.error('❌ Direct query error:', directQueryError.message);
    } else {
      console.log(`✅ Direct query successful - Found ${directQueryData.length} fields:`);
      directQueryData.forEach((field, i) => {
        console.log(`  ${i + 1}. ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_json || 'null'}`);
      });
    }
  } catch (err) {
    console.error('❌ Direct query exception:', err.message);
  }

  // Cleanup test fields
  console.log('\n🧹 Cleaning up test fields...');
  try {
    await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', testEntityId)
      .in('field_name', ['test_field_direct', 'test_field_rpc']);
    console.log('✅ Test fields cleaned up');
  } catch (err) {
    console.log('⚠️ Cleanup may have failed:', err.message);
  }

  console.log('\n' + '=' . repeat(70));
  console.log('📋 Dynamic Data Comparison Summary:');
  console.log('- Direct Supabase: Fast upsert operations with conflict resolution');
  console.log('- RPC functions: May have validation, business logic, structured responses');
  console.log('- Both methods should handle multi-tenant isolation');
}

testDynamicDataRPC();