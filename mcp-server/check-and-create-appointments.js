const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkAndCreateAppointments() {
  console.log('📅 Checking and creating salon appointments...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
  
  // First, check existing appointments
  console.log('1️⃣ Checking existing appointments:');
  const { data: existingAppts, error: checkError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', new Date().toISOString().split('T')[0])
    .order('transaction_date', { ascending: true });
    
  if (checkError) {
    console.log('❌ Error checking appointments:', checkError.message);
  } else {
    console.log(`Found ${existingAppts?.length || 0} existing appointments for today and future`);
  }
  
  // Get some customers and services
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'customer')
    .limit(5);
    
  const { data: services } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'service')
    .limit(5);
    
  const { data: stylists } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'employee')
    .limit(3);
    
  if (!customers?.length || !services?.length) {
    console.log('❌ No customers or services found. Creating demo data first...');
    return;
  }
  
  console.log(`\n✅ Found ${customers.length} customers, ${services.length} services, ${stylists?.length || 0} stylists`);
  
  // Create appointments for today and tomorrow
  const today = new Date();
  const appointments = [];
  
  // Today's appointments
  const todayTimes = ['10:00', '11:30', '14:00', '15:30', '17:00'];
  const statuses = ['confirmed', 'confirmed', 'in_progress', 'confirmed', 'pending'];
  
  todayTimes.forEach((time, idx) => {
    const appointmentDate = new Date(today);
    const [hours, minutes] = time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    appointments.push({
      organization_id: organizationId,
      transaction_type: 'appointment',
      transaction_code: `APT-${Date.now()}-${idx}`,
      transaction_date: appointmentDate.toISOString(),
      source_entity_id: customers[idx % customers.length].id,
      target_entity_id: stylists?.[idx % (stylists.length || 1)]?.id || null,
      total_amount: services[idx % services.length].metadata?.base_price || 150,
      smart_code: 'HERA.SALON.SVC.TXN.APPOINTMENT.v1',
      transaction_status: statuses[idx],
      metadata: {
        appointment_time: time,
        service_id: services[idx % services.length].id,
        service_name: services[idx % services.length].entity_name,
        duration_minutes: 60,
        notes: `Appointment for ${customers[idx % customers.length].entity_name}`
      }
    });
  });
  
  // Tomorrow's appointments
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = ['09:00', '10:30', '13:00', '16:00'];
  
  tomorrowTimes.forEach((time, idx) => {
    const appointmentDate = new Date(tomorrow);
    const [hours, minutes] = time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    appointments.push({
      organization_id: organizationId,
      transaction_type: 'appointment',
      transaction_code: `APT-${Date.now()}-T${idx}`,
      transaction_date: appointmentDate.toISOString(),
      source_entity_id: customers[(idx + 1) % customers.length].id,
      target_entity_id: stylists?.[idx % (stylists.length || 1)]?.id || null,
      total_amount: services[(idx + 1) % services.length].metadata?.base_price || 200,
      smart_code: 'HERA.SALON.SVC.TXN.APPOINTMENT.v1',
      transaction_status: 'confirmed',
      metadata: {
        appointment_time: time,
        service_id: services[(idx + 1) % services.length].id,
        service_name: services[(idx + 1) % services.length].entity_name,
        duration_minutes: 45,
        notes: `Appointment for ${customers[(idx + 1) % customers.length].entity_name}`
      }
    });
  });
  
  console.log(`\n2️⃣ Creating ${appointments.length} demo appointments...`);
  
  let created = 0;
  for (const appointment of appointments) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert(appointment);
      
    if (error) {
      console.log(`❌ Failed to create appointment: ${error.message}`);
    } else {
      created++;
    }
  }
  
  console.log(`\n✅ Created ${created} appointments successfully!`);
  
  // Verify by querying again
  console.log('\n3️⃣ Verifying appointments:');
  const { data: finalAppts, error: finalError } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      source_entity:core_entities!universal_transactions_source_entity_id_fkey(entity_name),
      target_entity:core_entities!universal_transactions_target_entity_id_fkey(entity_name)
    `)
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', new Date().toISOString().split('T')[0])
    .order('transaction_date', { ascending: true })
    .limit(10);
    
  if (finalError) {
    console.log('❌ Error verifying:', finalError.message);
  } else {
    console.log(`\n📅 Upcoming appointments (${finalAppts?.length || 0} total):`);
    finalAppts?.forEach(apt => {
      const date = new Date(apt.transaction_date);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`- ${date.toDateString()} ${timeStr}: ${apt.source_entity?.entity_name} - ${apt.metadata?.service_name} (${apt.transaction_status})`);
    });
  }
}

checkAndCreateAppointments().catch(console.error);