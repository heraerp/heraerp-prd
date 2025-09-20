require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixAppointmentDates() {
  try {
    const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

    // Get appointments with start_time
    const { data: dynamicData, error } = await supabase
      .from('core_dynamic_data')
      .select('id, entity_id, field_value_date')
      .eq('organization_id', orgId)
      .eq('field_name', 'start_time')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching dynamic data:', error);
      return;
    }

    console.log(`Found ${dynamicData.length} appointments with start_time to update`);

    // Update dates to spread across today and next few days
    const baseDate = new Date();
    
    for (let i = 0; i < dynamicData.length; i++) {
      const record = dynamicData[i];
      const date = new Date(baseDate);
      
      // Spread appointments across today and next 3 days
      date.setDate(date.getDate() + Math.floor(i / 8));
      date.setHours(9 + (i % 8), i % 2 === 0 ? 0 : 30, 0, 0);
      
      // Update the date
      const { error: updateError } = await supabase
        .from('core_dynamic_data')
        .update({
          field_value_date: date.toISOString()
        })
        .eq('id', record.id);
        
      if (updateError) {
        console.error(`Error updating record ${record.id}:`, updateError);
      } else {
        console.log(`✅ Updated appointment ${i + 1}: ${date.toLocaleString()}`);
      }
    }

    console.log('\n✨ Appointment dates fixed successfully!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

fixAppointmentDates();