const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function queryAllPlaybookModes() {
  // Get all playbook mode fields for the organization
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
    .like('field_name', '%playbook%')
    .order('field_name', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('\n🎯 PLAYBOOK MODE FEATURE FLAGS FOR ORGANIZATION 0fd09e31-d257-4329-97eb-7d7f522ed6f0\n');
    console.log('Total playbook fields found:', data.length);
    console.log('\n' + '='.repeat(80) + '\n');
    
    data.forEach((record, index) => {
      console.log(`${index + 1}. ${record.field_name}`);
      console.log('   - Value:', record.field_value_boolean !== null ? record.field_value_boolean : record.field_value_text);
      console.log('   - Type:', record.field_type);
      console.log('   - Entity ID:', record.entity_id);
      console.log('   - Smart Code:', record.smart_code || 'None');
      console.log('   - Created:', new Date(record.created_at).toLocaleString());
      console.log('   - Updated:', new Date(record.updated_at).toLocaleString());
      console.log('');
    });
    
    // Summary
    console.log('='.repeat(80));
    console.log('\nSUMMARY:');
    const activePlaybooks = data.filter(d => d.field_value_boolean === true);
    const inactivePlaybooks = data.filter(d => d.field_value_boolean === false);
    console.log(`✅ Active playbook modes: ${activePlaybooks.length}`);
    console.log(`❌ Inactive playbook modes: ${inactivePlaybooks.length}`);
    
    if (activePlaybooks.length > 0) {
      console.log('\nActive playbook modes:');
      activePlaybooks.forEach(p => console.log(`  - ${p.field_name}`));
    }
    
    if (inactivePlaybooks.length > 0) {
      console.log('\nInactive playbook modes:');
      inactivePlaybooks.forEach(p => console.log(`  - ${p.field_name}`));
    }
    
  } else {
    console.log('No playbook fields found for organization 0fd09e31-d257-4329-97eb-7d7f522ed6f0');
  }
}

queryAllPlaybookModes();