const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRPC() {
  // Get organization ID
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id')
    .limit(1)
    .single();
  
  if (!orgs) {
    console.log('No organization found');
    return;
  }
  
  const orgId = orgs.id;
  console.log('🏢 Testing with organization:', orgId);
  
  // Call the RPC function
  const { data: result, error } = await supabase.rpc('hera_entity_read_v1', {
    p_organization_id: orgId,
    p_entity_type: 'BRANCH',
    p_status: null,
    p_include_relationships: false,
    p_include_dynamic_data: true,
    p_limit: 10,
    p_offset: 0
  });
  
  if (error) {
    console.error('❌ RPC Error:', error);
    return;
  }
  
  console.log('\n✅ RPC Response Structure:');
  console.log('- success:', result?.success);
  console.log('- data length:', result?.data?.length || 0);
  
  if (result?.data && result.data.length > 0) {
    const firstBranch = result.data[0];
    console.log('\n📦 First Branch Object:');
    console.log('- Keys:', Object.keys(firstBranch));
    console.log('- id:', firstBranch.id);
    console.log('- entity_name:', firstBranch.entity_name);
    console.log('- has dynamic_fields key:', 'dynamic_fields' in firstBranch);
    console.log('- dynamic_fields type:', typeof firstBranch.dynamic_fields);
    console.log('- dynamic_fields value:', JSON.stringify(firstBranch.dynamic_fields, null, 2));
    
    // Check if opening_time is at top level
    console.log('\n🔍 Opening/Closing Time Location:');
    console.log('- opening_time (top level):', firstBranch.opening_time);
    console.log('- closing_time (top level):', firstBranch.closing_time);
    
    if (firstBranch.dynamic_fields) {
      console.log('- opening_time (in dynamic_fields):', firstBranch.dynamic_fields.opening_time);
      console.log('- closing_time (in dynamic_fields):', firstBranch.dynamic_fields.closing_time);
    }
  }
}

testRPC().catch(console.error);
