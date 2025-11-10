#!/usr/bin/env node
/**
 * Debug what the RPC returns for organization loading
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'; // HERA Salon Demo
const actorUserId = 'ebd0e099-e25a-476b-b6dc-4b3c26fae4a7'; // salon@heraerp.com

console.log('🔍 Testing organization RPC loading...');
console.log('📋 Organization ID:', orgId);
console.log('👤 Actor User ID:', actorUserId);
console.log('');

try {
  // Test the RPC call that the frontend is making
  console.log('📞 Calling hera_entities_crud_v1 with READ action...');

  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'ORG',
      entity_id: orgId
    },
    p_dynamic: {},
    p_options: {
      include_dynamic: true,
      include_relationships: false
    }
  });

  if (error) {
    console.log('❌ RPC Error:', error);
  } else {
    console.log('✅ RPC Success!');
    console.log('');
    console.log('📦 Full Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    // Analyze the response
    if (data?.data?.entity) {
      console.log('📋 Entity found in data.data.entity:');
      console.log('   ID:', data.data.entity.id);
      console.log('   Entity Name:', data.data.entity.entity_name);
      console.log('   Entity Code:', data.data.entity.entity_code);
      console.log('   Entity Type:', data.data.entity.entity_type);
      console.log('');

      console.log('📊 Dynamic Data Array Length:', data.data.dynamic_data?.length || 0);
      if (data.data.dynamic_data && data.data.dynamic_data.length > 0) {
        console.log('📋 Dynamic Data Fields:');
        data.data.dynamic_data.forEach(field => {
          console.log(`   - ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_boolean}`);
        });
      } else {
        console.log('⚠️ No dynamic data found!');
      }
    } else {
      console.log('⚠️ Entity not found in expected path (data.data.entity)');
    }
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('🔍 Checking core_organizations table directly...');
  console.log('');

  const { data: orgData, error: orgError } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (orgError) {
    console.log('❌ Error querying core_organizations:', orgError);
  } else {
    console.log('✅ Organization found in core_organizations:');
    console.log('   ID:', orgData.id);
    console.log('   Name:', orgData.organization_name);
    console.log('   Code:', orgData.organization_code);
    console.log('   Type:', orgData.organization_type);
    console.log('   Status:', orgData.status);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('🔍 Checking if organization exists as entity in core_entities...');
  console.log('');

  const { data: entityData, error: entityError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', orgId)
    .eq('entity_type', 'ORG')
    .single();

  if (entityError) {
    console.log('⚠️ Organization NOT found as entity in core_entities');
    console.log('   Error:', entityError.message);
    console.log('');
    console.log('💡 This is the problem! The organization exists in core_organizations,');
    console.log('   but NOT in core_entities. The RPC expects it to be in core_entities.');
  } else {
    console.log('✅ Organization found in core_entities:');
    console.log('   ID:', entityData.id);
    console.log('   Entity Name:', entityData.entity_name);
    console.log('   Entity Code:', entityData.entity_code);
    console.log('   Entity Type:', entityData.entity_type);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('🔍 Checking dynamic data for organization...');
  console.log('');

  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_id', orgId);

  if (dynamicError) {
    console.log('❌ Error querying dynamic data:', dynamicError);
  } else {
    console.log(`📊 Found ${dynamicData?.length || 0} dynamic data fields`);
    if (dynamicData && dynamicData.length > 0) {
      dynamicData.forEach(field => {
        const value = field.field_value_text || field.field_value_number || field.field_value_boolean || field.field_value_date;
        console.log(`   - ${field.field_name}: ${value}`);
      });
    } else {
      console.log('   No dynamic data found for this organization');
    }
  }

} catch (error) {
  console.error('💥 Unexpected error:', error);
}
