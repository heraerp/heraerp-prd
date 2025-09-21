#!/usr/bin/env node

// ============================================================================
// HERA • Check Salon Appointments Summary
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Constants
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function checkSalonAppointments() {
  console.log('📊 Salon Appointments Summary\n');

  // Get all salon appointments
  const { data: appointments, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('transaction_type', 'appointment')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching appointments:', error);
    return;
  }

  console.log(`🎯 Total Appointments: ${appointments.length}\n`);

  // Group by status
  const statusCounts = {};
  const dateRange = {};

  appointments.forEach(appt => {
    const status = appt.metadata?.status || 'UNKNOWN';
    const date = appt.transaction_date;
    
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    if (!dateRange.start || date < dateRange.start) dateRange.start = date;
    if (!dateRange.end || date > dateRange.end) dateRange.end = date;
  });

  console.log('📅 Date Range:');
  console.log(`   From: ${dateRange.start}`);
  console.log(`   To: ${dateRange.end}\n`);

  console.log('📈 Status Distribution:');
  Object.entries(statusCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([status, count]) => {
      const percentage = ((count / appointments.length) * 100).toFixed(1);
      console.log(`   ${status.padEnd(12)}: ${count.toString().padStart(3)} (${percentage}%)`);
    });

  // Sample appointments by date
  console.log('\n📋 Sample Appointments by Date:');
  const appointmentsByDate = {};
  appointments.forEach(appt => {
    const date = appt.transaction_date;
    if (!appointmentsByDate[date]) appointmentsByDate[date] = [];
    appointmentsByDate[date].push(appt);
  });

  Object.keys(appointmentsByDate)
    .sort()
    .slice(0, 5) // Show first 5 days
    .forEach(date => {
      const dayAppts = appointmentsByDate[date];
      console.log(`\n   ${date} (${dayAppts.length} appointments):`);
      
      dayAppts.slice(0, 3).forEach(appt => {
        const customer = appt.metadata?.customer_name || 'Unknown';
        const service = appt.metadata?.service_name || 'Unknown';
        const staff = appt.metadata?.staff_name || 'Unknown';
        const status = appt.metadata?.status || 'UNKNOWN';
        const time = appt.metadata?.start ? new Date(appt.metadata.start).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : 'N/A';
        
        console.log(`     ${time} | ${status.padEnd(10)} | ${customer} - ${service} (${staff})`);
      });
      
      if (dayAppts.length > 3) {
        console.log(`     ... and ${dayAppts.length - 3} more`);
      }
    });

  console.log('\n✨ Salon appointment data is ready for the Kanban board!');
}

// Run the check
checkSalonAppointments()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error checking appointments:', error);
    process.exit(1);
  });