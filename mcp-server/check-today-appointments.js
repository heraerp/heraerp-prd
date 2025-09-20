require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

async function checkTodayAppointments() {
  console.log('🔍 Checking appointments for today...\n');

  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Make today start at midnight
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    console.log(`Today: ${today.toISOString()}`);
    console.log(`Tomorrow: ${tomorrow.toISOString()}\n`);

    // Get all appointment start times
    const { data: startTimes, error } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_value_date')
      .eq('organization_id', orgId)
      .eq('field_name', 'start_time')
      .order('field_value_date', { ascending: true })
      .limit(50);

    if (error) throw error;

    console.log(`Found ${startTimes.length} appointments with start times:\n`);

    // Group by date
    const byDate = {};
    startTimes.forEach(apt => {
      const date = new Date(apt.field_value_date);
      const dateStr = date.toDateString();
      if (!byDate[dateStr]) byDate[dateStr] = [];
      byDate[dateStr].push({
        id: apt.entity_id,
        time: date.toLocaleTimeString()
      });
    });

    // Show appointments by date
    Object.entries(byDate).forEach(([date, apts]) => {
      console.log(`${date}: ${apts.length} appointments`);
      if (date === today.toDateString()) {
        console.log('  ^ TODAY\'s appointments:');
        apts.forEach(apt => console.log(`    - ${apt.time} (ID: ${apt.id.substring(0, 8)}...)`));
      }
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

checkTodayAppointments();