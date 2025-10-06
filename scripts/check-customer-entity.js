const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // Get a sample appointment with customer_id
    const { data: appointments, error: aptError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text')
      .eq('field_name', 'customer_id')
      .limit(1);

    if (aptError) {
      console.log('Error fetching appointments:', aptError.message);
      return;
    }

    if (!appointments || appointments.length === 0) {
      console.log('❌ No appointments with customer_id found');
      return;
    }

    const customerId = appointments[0].field_value_text;
    console.log('🔍 Sample customer_id from appointment:', customerId);

    // Look up what this customer_id points to
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, entity_code, organization_id')
      .eq('id', customerId)
      .maybeSingle();

    if (entityError) {
      console.log('❌ Error:', entityError.message);
    } else if (!entity) {
      console.log('❌ Customer entity not found in core_entities!');
      console.log('   This means customer_id points to a non-existent entity');
    } else {
      console.log('\n📋 Customer entity found:');
      console.log('   Type:', entity.entity_type);
      console.log('   Name:', entity.entity_name);
      console.log('   Code:', entity.entity_code);
      console.log('   Org:', entity.organization_id);
    }

    // Check what entity types exist for this org
    const { data: aptEntity } = await supabase
      .from('core_entities')
      .select('organization_id')
      .eq('id', appointments[0].entity_id)
      .maybeSingle();
    const orgId = aptEntity?.organization_id;

    if (orgId) {
      console.log('\n🔍 Checking entity types in this organization:', orgId);
      const { data: orgEntities } = await supabase
        .from('core_entities')
        .select('entity_type')
        .eq('organization_id', orgId);

      const types = {};
      orgEntities.forEach(e => {
        types[e.entity_type] = (types[e.entity_type] || 0) + 1;
      });

      Object.entries(types).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} entities`);
      });
    }

  } catch (err) {
    console.log('❌ Caught error:', err.message, err.stack);
  }
})();
