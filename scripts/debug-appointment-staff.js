const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

    console.log('🔍 Checking appointment data structure...\n');

    // Get a sample appointment
    const { data: appointments, error: aptError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'appointment')
      .limit(3);

    if (aptError) {
      console.log('❌ Error fetching appointments:', aptError.message);
      return;
    }

    console.log(`📋 Found ${appointments?.length || 0} appointments\n`);

    for (const apt of appointments || []) {
      console.log('='.repeat(80));
      console.log('Appointment:', apt.entity_name);
      console.log('ID:', apt.id);
      console.log('='.repeat(80));

      // Get dynamic data for this appointment
      const { data: dynamicData } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', orgId)
        .eq('entity_id', apt.id);

      console.log('\n📊 Dynamic Fields:');
      console.log('Total fields:', dynamicData?.length || 0);

      const fieldsByName = {};
      for (const field of dynamicData || []) {
        fieldsByName[field.field_name] = {
          type: field.field_type,
          value_text: field.field_value_text,
          value_number: field.field_value_number,
          value_json: field.field_value_json
        };
      }

      // Check for staff/stylist related fields
      const staffFields = Object.keys(fieldsByName).filter(key =>
        key.toLowerCase().includes('staff') ||
        key.toLowerCase().includes('stylist')
      );

      console.log('\n🔑 Staff/Stylist Related Fields:', staffFields);

      for (const fieldName of staffFields) {
        console.log(`\n  ${fieldName}:`);
        console.log('    Type:', fieldsByName[fieldName].type);
        if (fieldsByName[fieldName].value_text) {
          console.log('    Value (text):', fieldsByName[fieldName].value_text);
        }
        if (fieldsByName[fieldName].value_number !== null) {
          console.log('    Value (number):', fieldsByName[fieldName].value_number);
        }
        if (fieldsByName[fieldName].value_json) {
          console.log('    Value (json):', JSON.stringify(fieldsByName[fieldName].value_json));
        }
      }

      // Check customer field too
      const customerFields = Object.keys(fieldsByName).filter(key =>
        key.toLowerCase().includes('customer')
      );

      console.log('\n👤 Customer Related Fields:', customerFields);

      for (const fieldName of customerFields) {
        console.log(`\n  ${fieldName}:`);
        console.log('    Type:', fieldsByName[fieldName].type);
        if (fieldsByName[fieldName].value_text) {
          console.log('    Value (text):', fieldsByName[fieldName].value_text);
        }
      }

      console.log('\n');
    }

    // Now check what staff entities exist
    console.log('\n' + '='.repeat(80));
    console.log('🧑 STAFF ENTITIES (uppercase)');
    console.log('='.repeat(80));

    const { data: staffUpper } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('organization_id', orgId)
      .eq('entity_type', 'STAFF');

    console.log('Count:', staffUpper?.length || 0);
    for (const s of staffUpper || []) {
      console.log(`  - ${s.entity_name} (${s.id})`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🧑 staff entities (lowercase)');
    console.log('='.repeat(80));

    const { data: staffLower } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('organization_id', orgId)
      .eq('entity_type', 'staff');

    console.log('Count:', staffLower?.length || 0);
    for (const s of staffLower || []) {
      console.log(`  - ${s.entity_name} (${s.id})`);
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
})();
