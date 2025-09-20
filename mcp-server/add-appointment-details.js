require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addAppointmentDetails() {
  try {
    const orgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

    // Get appointments
    const { data: appointments, error } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching appointments:', error);
      return;
    }

    console.log(`Found ${appointments.length} appointments to update`);

    // Add dynamic data for each appointment
    const startTimes = [];
    const baseDate = new Date();
    
    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      const date = new Date(baseDate);
      
      // Spread appointments across today and next few days
      date.setDate(date.getDate() + Math.floor(i / 3));
      date.setHours(9 + (i % 8), i % 2 === 0 ? 0 : 30, 0, 0);
      
      const dynamicData = [
        {
          entity_id: appointment.id,
          organization_id: orgId,
          field_name: 'start_time',
          field_value_date: date.toISOString(),
          smart_code: 'HERA.SALON.APPT.FIELD.START_TIME.v1'
        },
        {
          entity_id: appointment.id,
          organization_id: orgId,
          field_name: 'status',
          field_value_text: i === 0 ? 'booked' : i === 1 ? 'checked_in' : i < 5 ? 'booked' : 'completed',
          smart_code: 'HERA.SALON.APPT.FIELD.STATUS.v1'
        },
        {
          entity_id: appointment.id,
          organization_id: orgId,
          field_name: 'duration_minutes',
          field_value_number: 60,
          smart_code: 'HERA.SALON.APPT.FIELD.DURATION.v1'
        }
      ];

      // First check if data exists
      for (const field of dynamicData) {
        const { data: existing } = await supabase
          .from('core_dynamic_data')
          .select('id')
          .eq('entity_id', field.entity_id)
          .eq('field_name', field.field_name)
          .eq('organization_id', field.organization_id)
          .single();

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('core_dynamic_data')
            .update({
              field_value_text: field.field_value_text,
              field_value_date: field.field_value_date,
              field_value_number: field.field_value_number
            })
            .eq('id', existing.id);
            
          if (updateError) {
            console.error(`Error updating field ${field.field_name}:`, updateError);
          }
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('core_dynamic_data')
            .insert(field);
            
          if (insertError) {
            console.error(`Error inserting field ${field.field_name}:`, insertError);
          }
        }
      }

      console.log(`✅ Updated appointment: ${appointment.entity_name} - ${date.toLocaleString()}`);
    }

    console.log('\\n✨ Appointment details added successfully!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

addAppointmentDetails();