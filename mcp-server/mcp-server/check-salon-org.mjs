import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSalonOrganization() {
  // Get all organizations (not platform)
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Organizations found:', orgs?.length || 0);
  
  for (const org of orgs || []) {
    console.log('\n=== Organization:', org.organization_name, '===');
    console.log('ID:', org.id);
    
    // Check if there's an entity for this organization
    const { data: entity } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code')
      .eq('id', org.id)
      .single();
    
    console.log('Entity:', entity);
    
    // Check dynamic data
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_number, field_value_boolean')
      .eq('organization_id', org.id)
      .eq('entity_id', org.id);
    
    console.log('Dynamic data count:', dynamicData?.length || 0);
    
    if (dynamicData && dynamicData.length > 0) {
      console.log('Dynamic fields:');
      dynamicData.forEach(d => {
        const value = d.field_value_text || d.field_value_number || d.field_value_boolean;
        console.log('  ' + d.field_name + ': ' + value);
      });
    }
  }
}

checkSalonOrganization().catch(console.error);
