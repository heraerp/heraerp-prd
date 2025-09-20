require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

async function testAppointmentsComplete() {
  console.log('🔍 Testing complete appointment data for Hair Talkz salon...\n');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's appointments with all dynamic data
    const { data: appointmentIds } = await supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('organization_id', orgId)
      .eq('field_name', 'start_time')
      .gte('field_value_date', today.toISOString())
      .lt('field_value_date', tomorrow.toISOString())
      .order('field_value_date', { ascending: true });

    if (!appointmentIds || appointmentIds.length === 0) {
      console.log('❌ No appointments found for today');
      return;
    }

    const uniqueIds = [...new Set(appointmentIds.map(a => a.entity_id))];
    console.log(`✅ Found ${uniqueIds.length} appointments for today (${today.toDateString()})\n`);

    // Get entity details
    const { data: entities } = await supabase
      .from('core_entities')
      .select('*')
      .in('id', uniqueIds);

    // Get all dynamic data for these appointments
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', uniqueIds)
      .eq('organization_id', orgId);

    // Build complete appointment objects
    const appointments = uniqueIds.map(id => {
      const entity = entities.find(e => e.id === id);
      const dynamics = dynamicData.filter(d => d.entity_id === id);
      
      const apt = {
        id,
        entity_name: entity?.entity_name,
        entity_code: entity?.entity_code,
        smart_code: entity?.smart_code,
        dynamic_fields: {}
      };

      dynamics.forEach(d => {
        apt.dynamic_fields[d.field_name] = 
          d.field_value_text || 
          d.field_value_number || 
          d.field_value_date || 
          d.field_value_json;
      });

      return apt;
    });

    // Display appointments
    console.log('📅 Today\'s Appointments:\n');
    appointments.forEach((apt, i) => {
      console.log(`${i + 1}. ${apt.entity_name || 'Unnamed Appointment'}`);
      console.log(`   ID: ${apt.id.substring(0, 8)}...`);
      console.log(`   Code: ${apt.entity_code || 'N/A'}`);
      console.log(`   Smart Code: ${apt.smart_code || 'N/A'}`);
      console.log('   Dynamic Fields:');
      Object.entries(apt.dynamic_fields).forEach(([key, value]) => {
        if (key === 'start_time' && value) {
          const date = new Date(value);
          console.log(`     - ${key}: ${date.toLocaleTimeString()}`);
        } else {
          console.log(`     - ${key}: ${value || 'N/A'}`);
        }
      });
      console.log('');
    });

    // Summary statistics
    const stats = {
      total: appointments.length,
      withCustomer: appointments.filter(a => a.dynamic_fields.customer_id).length,
      withStylist: appointments.filter(a => a.dynamic_fields.stylist_id).length,
      withStatus: appointments.filter(a => a.dynamic_fields.status).length,
      statuses: {}
    };

    appointments.forEach(a => {
      const status = a.dynamic_fields.status || 'unknown';
      stats.statuses[status] = (stats.statuses[status] || 0) + 1;
    });

    console.log('📊 Summary:');
    console.log(`  - Total appointments: ${stats.total}`);
    console.log(`  - With customer: ${stats.withCustomer}`);
    console.log(`  - With stylist: ${stats.withStylist}`);
    console.log(`  - With status: ${stats.withStatus}`);
    console.log('  - Status breakdown:');
    Object.entries(stats.statuses).forEach(([status, count]) => {
      console.log(`    * ${status}: ${count}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

testAppointmentsComplete();