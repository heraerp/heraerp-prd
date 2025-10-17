require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addAppointmentRelationships() {
  try {
    const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

    // Get customers
    const { data: customers } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'customer')
      .limit(50);

    // Get employees (stylists)
    const { data: stylists } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'employee')
      .limit(20);

    // Get appointments that have start_time today
    const { data: todayAppointments } = await supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('organization_id', orgId)
      .eq('field_name', 'start_time')
      .gte('field_value_date', new Date().toISOString().split('T')[0])
      .order('field_value_date', { ascending: true })
      .limit(30);

    if (!customers?.length || !stylists?.length || !todayAppointments?.length) {
      console.log('Missing required data:', { 
        customers: customers?.length, 
        stylists: stylists?.length, 
        appointments: todayAppointments?.length 
      });
      return;
    }

    console.log(`Found ${customers.length} customers, ${stylists.length} stylists, ${todayAppointments.length} appointments`);

    // Add customer and stylist IDs to appointments
    for (let i = 0; i < todayAppointments.length; i++) {
      const appointment = todayAppointments[i];
      const customer = customers[i % customers.length];
      const stylist = stylists[i % stylists.length];

      // Add customer_id
      const { error: custError } = await supabase
        .from('core_dynamic_data')
        .upsert({
          entity_id: appointment.entity_id,
          organization_id: orgId,
          field_name: 'customer_id',
          field_value_text: customer.id,
          smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_ID.v1'
        }, {
          onConflict: 'entity_id,field_name,organization_id'
        });

      if (custError) console.error('Customer error:', custError);

      // Add customer_name for display
      const { error: custNameError } = await supabase
        .from('core_dynamic_data')
        .upsert({
          entity_id: appointment.entity_id,
          organization_id: orgId,
          field_name: 'customer_name',
          field_value_text: customer.entity_name,
          smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_NAME.v1'
        }, {
          onConflict: 'entity_id,field_name,organization_id'
        });

      // Add stylist_id
      const { error: stylError } = await supabase
        .from('core_dynamic_data')
        .upsert({
          entity_id: appointment.entity_id,
          organization_id: orgId,
          field_name: 'stylist_id',
          field_value_text: stylist.id,
          smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_ID.v1'
        }, {
          onConflict: 'entity_id,field_name,organization_id'
        });

      if (stylError) console.error('Stylist error:', stylError);

      // Add stylist_name for display
      const { error: stylNameError } = await supabase
        .from('core_dynamic_data')
        .upsert({
          entity_id: appointment.entity_id,
          organization_id: orgId,
          field_name: 'stylist_name',
          field_value_text: stylist.entity_name,
          smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_NAME.v1'
        }, {
          onConflict: 'entity_id,field_name,organization_id'
        });

      console.log(`✅ Updated appointment ${i + 1}: ${customer.entity_name} with ${stylist.entity_name}`);
    }

    console.log('\n✨ Appointment relationships added successfully!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

addAppointmentRelationships();