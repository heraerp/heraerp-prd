import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLeavePolicies() {
  console.log('\n🔍 Checking Leave Policies in Database...\n');
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID;
  
  // Check core_entities table directly
  console.log('1️⃣ Direct query to core_entities:');
  const { data: entities, error: entitiesError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .ilike('entity_type', '%LEAVE%')
    .order('created_at', { ascending: false });
  
  if (entitiesError) {
    console.error('❌ Error querying entities:', entitiesError);
  } else {
    console.log(`✅ Found ${entities.length} entities with LEAVE in type:`);
    entities.forEach(e => {
      console.log(`   - ID: ${e.id}`);
      console.log(`     Type: "${e.entity_type}" (exact case)`);
      console.log(`     Name: ${e.entity_name}`);
      console.log(`     Smart Code: ${e.smart_code}`);
      console.log('');
    });
  }
  
  // Check with RPC using exact case
  console.log('\n2️⃣ RPC call with LEAVE_POLICY (uppercase):');
  const { data: rpcData, error: rpcError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7',
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'LEAVE_POLICY'
    },
    p_options: {
      include_dynamic: true,
      include_relationships: false
    }
  });
  
  if (rpcError) {
    console.error('❌ RPC Error:', rpcError);
  } else {
    console.log('✅ RPC Response:');
    console.log('   Success:', rpcData.success);
    console.log('   Action:', rpcData.action);
    console.log('   List count:', rpcData.data?.list?.length || 0);
    if (rpcData.data?.list?.length > 0) {
      console.log('\n   First item:');
      console.log('   Entity Type:', rpcData.data.list[0].entity.entity_type);
      console.log('   Entity Name:', rpcData.data.list[0].entity.entity_name);
      console.log('   Dynamic Fields:', rpcData.data.list[0].dynamic_data?.length || 0);
    }
  }
  
  // Check with lowercase
  console.log('\n3️⃣ RPC call with leave_policy (lowercase):');
  const { data: rpcData2, error: rpcError2 } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7',
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'leave_policy'
    },
    p_options: {
      include_dynamic: true,
      include_relationships: false
    }
  });
  
  if (rpcError2) {
    console.error('❌ RPC Error:', rpcError2);
  } else {
    console.log('✅ RPC Response:');
    console.log('   Success:', rpcData2.success);
    console.log('   List count:', rpcData2.data?.list?.length || 0);
  }
  
  // Check dynamic data
  if (entities.length > 0) {
    console.log('\n4️⃣ Checking dynamic_data for first entity:');
    const { data: dynamicData, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', entities[0].id)
      .order('field_name');
    
    if (dynError) {
      console.error('❌ Error:', dynError);
    } else {
      console.log(`✅ Found ${dynamicData.length} dynamic fields:`);
      dynamicData.forEach(f => {
        const value = f.field_value_text || f.field_value_number || f.field_value_boolean;
        console.log(`   - ${f.field_name}: ${value} (${f.field_type})`);
      });
    }
  }
}

checkLeavePolicies().catch(console.error);
