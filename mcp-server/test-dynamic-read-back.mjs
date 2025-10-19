#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDynamicReadBack() {
  const testOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  const testActorId = '09b0b92a-d797-489e-bc03-5ca0a6272674';

  // 1. Create with dynamic fields
  console.log('1️⃣ Creating entity with dynamic fields...\n');
  const { data: createData, error: createError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'CREATE',
    p_actor_user_id: testActorId,
    p_organization_id: testOrgId,
    p_entity: {
      entity_type: 'product',
      entity_name: 'Test Product READ BACK',
      smart_code: 'HERA.SALON.PRODUCT.ENTITY.TEST.V1'
    },
    p_dynamic: {
      price: {
        field_type: 'number',
        field_value_number: 199.99,
        smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
      }
    },
    p_relationships: [],
    p_options: {}
  });

  if (createError) {
    console.log('❌ Create error:', createError);
    return;
  }

  const entityId = createData?.items?.[0]?.id;
  console.log('✅ Created entity:', entityId);
  console.log('📦 Create response:', JSON.stringify(createData, null, 2));

  // 2. Read back using GET function
  console.log('\n2️⃣ Reading dynamic data using hera_dynamic_data_get_v1...\n');
  const { data: getData, error: getError } = await supabase.rpc('hera_dynamic_data_get_v1', {
    p_organization_id: testOrgId,
    p_entity_id: entityId
  });

  if (getError) {
    console.log('❌ Get error:', getError);
  } else {
    console.log('✅ Dynamic data found:', getData.data.length, 'fields');
    console.log('📊 Dynamic fields:', JSON.stringify(getData.data, null, 2));
  }

  // 3. Read back using CRUD function
  console.log('\n3️⃣ Reading entity using hera_entities_crud_v2...\n');
  const { data: readData, error: readError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'READ',
    p_actor_user_id: testActorId,
    p_organization_id: testOrgId,
    p_entity: {
      entity_id: entityId
    },
    p_dynamic: {},
    p_relationships: [],
    p_options: {}
  });

  if (readError) {
    console.log('❌ Read error:', readError);
  } else {
    console.log('✅ Entity read back');
    console.log('📦 Read response:', JSON.stringify(readData, null, 2));
  }

  // 4. Cleanup
  console.log('\n4️⃣ Cleaning up...\n');
  await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'DELETE',
    p_actor_user_id: testActorId,
    p_organization_id: testOrgId,
    p_entity: { entity_id: entityId },
    p_dynamic: {},
    p_relationships: [],
    p_options: {}
  });
  console.log('✅ Deleted');
}

testDynamicReadBack();
