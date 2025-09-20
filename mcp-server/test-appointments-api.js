require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

async function testAppointmentsAPI() {
  console.log('🔍 Testing appointments API for Hair Talkz salon...\n');

  try {
    // 1. Get appointments
    const { data: appointments, error: aptError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false })
      .limit(5);

    if (aptError) throw aptError;

    console.log(`✅ Found ${appointments.length} appointments\n`);

    // 2. Get dynamic data for first appointment
    if (appointments.length > 0) {
      const firstApt = appointments[0];
      console.log('📋 First appointment details:');
      console.log(`  - ID: ${firstApt.id}`);
      console.log(`  - Name: ${firstApt.entity_name}`);
      console.log(`  - Code: ${firstApt.entity_code}`);
      console.log(`  - Smart Code: ${firstApt.smart_code}`);

      // Get dynamic data
      const { data: dynamicData, error: dynError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', firstApt.id)
        .eq('organization_id', orgId);

      if (dynError) throw dynError;

      console.log(`\n  Dynamic fields (${dynamicData.length} total):`);
      dynamicData.forEach(field => {
        const value = field.field_value_text || field.field_value_number || field.field_value_date || field.field_value_json;
        console.log(`    - ${field.field_name}: ${value}`);
      });
    }

    // 3. Test date range query
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`\n📅 Testing appointments for today (${today.toDateString()})...`);

    // Get all appointments and filter by date
    const { data: allAppointments, error: allError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'appointment');

    if (allError) throw allError;

    const appointmentIds = allAppointments.map(a => a.id);
    
    // Get dynamic data for start_time
    const { data: todayDynamic, error: todayError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', appointmentIds.slice(0, 100)) // Limit to first 100
      .eq('field_name', 'start_time')
      .gte('field_value_date', today.toISOString())
      .lt('field_value_date', tomorrow.toISOString());

    if (todayError) throw todayError;

    console.log(`  Found ${todayDynamic.length} appointments scheduled for today`);

    // 4. Test appointment statuses
    const { data: statuses, error: statusError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .in('entity_id', appointmentIds.slice(0, 100))
      .eq('field_name', 'status');

    if (statusError) throw statusError;

    const statusCounts = statuses.reduce((acc, s) => {
      acc[s.field_value_text] = (acc[s.field_value_text] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Appointment status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\n✨ API test completed successfully!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

testAppointmentsAPI();