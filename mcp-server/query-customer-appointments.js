// Query appointments for a specific customer
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = process.env.DEFAULT_SALON_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
const CUSTOMER_ID = process.argv[2] || '35ba5d47-0f23-4576-b09d-b2381dff5d74';

async function queryCustomerAppointments() {
  console.log('\n🏭 Querying appointments for customer');
  console.log(`Organization ID: ${SALON_ORG_ID}`);
  console.log(`Customer ID: ${CUSTOMER_ID}`);
  
  try {
    // Query appointment transactions
    const { data: appointments, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('transaction_type', 'APPOINTMENT') // Must be uppercase
      .or(`source_entity_id.eq.${CUSTOMER_ID},target_entity_id.eq.${CUSTOMER_ID}`)
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error querying appointments:', error);
      return;
    }

    console.log(`\n✅ Found ${appointments.length} appointments:\n`);
    
    if (appointments.length === 0) {
      console.log('No appointments found for this customer.');
      return;
    }

    // Display appointment details with lines
    for (const appointment of appointments) {
      console.log(`\n📅 Appointment ${appointment.transaction_code}`);
      console.log(`   ID: ${appointment.id}`);
      console.log(`   Date: ${new Date(appointment.transaction_date).toLocaleString()}`);
      console.log(`   Status: ${appointment.status}`);
      console.log(`   Total: AED ${appointment.total_amount}`);
      console.log(`   Metadata: ${JSON.stringify(appointment.metadata, null, 2)}`);
      
      // Get transaction lines (services)
      const { data: lines, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select(`
          *,
          entity:entity_id (
            entity_name,
            entity_code,
            entity_type
          )
        `)
        .eq('transaction_id', appointment.id);

      if (!linesError && lines && lines.length > 0) {
        console.log(`   Services (${lines.length}):`);
        lines.forEach((line, index) => {
          console.log(`     ${index + 1}. ${line.entity?.entity_name || 'Unknown Service'}`);
          console.log(`        Quantity: ${line.quantity}`);
          console.log(`        Price: AED ${line.unit_amount}`);
          console.log(`        Line Total: AED ${line.line_amount}`);
        });
      } else {
        console.log('   No service details found');
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the query
queryCustomerAppointments();