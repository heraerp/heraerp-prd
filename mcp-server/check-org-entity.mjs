import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrganizationEntity() {
  // First, get the organization ID from core_organizations
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .limit(1);
  
  if (!orgs || orgs.length === 0) {
    console.log('No organizations found');
    return;
  }
  
  const orgId = orgs[0].id;
  console.log('Checking organization:', orgId, orgs[0].organization_name);
  console.log('---');
  
  // Check if there's an entity for this organization
  const { data: entities } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, smart_code')
    .eq('id', orgId);
  
  console.log('Entity lookup by ID:', entities);
  console.log('---');
  
  // Also check by organization_id
  const { data: orgEntities } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, smart_code, organization_id')
    .eq('organization_id', orgId)
    .eq('entity_type', 'ORGANIZATION');
  
  console.log('Entity lookup by organization_id + type:', orgEntities);
  console.log('---');
  
  // Check dynamic data for this organization
  const { data: dynamicData } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text, field_value_number')
    .eq('organization_id', orgId)
    .eq('entity_id', orgId);
  
  console.log('Dynamic data count:', dynamicData?.length || 0);
  console.log('Dynamic fields:', dynamicData?.map(d => d.field_name) || []);
  
  // Show sample dynamic data
  if (dynamicData && dynamicData.length > 0) {
    console.log('Sample dynamic data:');
    dynamicData.slice(0, 5).forEach(d => {
      const value = d.field_value_text || d.field_value_number;
      console.log('  ' + d.field_name + ': ' + value);
    });
  }
}

checkOrganizationEntity().catch(console.error);
