// Test appointment creation in universal_transactions
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = process.env.DEFAULT_SALON_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function testAppointmentCreation() {
  console.log('\n🧪 Testing Appointment Creation');
  console.log(`Organization ID: ${SALON_ORG_ID}`);
  
  try {
    // 1. Query recent appointments
    console.log('\n📋 Checking recent appointments in universal_transactions...');
    const { data: appointments, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('transaction_type', 'APPOINTMENT') // Must be uppercase
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error querying appointments:', error);
      return;
    }

    console.log(`\n✅ Found ${appointments.length} recent appointments:\n`);
    
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.transaction_code}`);
      console.log(`   ID: ${apt.id}`);
      console.log(`   Date: ${new Date(apt.transaction_date).toLocaleString()}`);
      console.log(`   Created: ${new Date(apt.created_at).toLocaleString()}`);
      console.log(`   Customer: ${apt.source_entity_id || apt.target_entity_id}`);
      console.log(`   Total: AED ${apt.total_amount}`);
      console.log(`   Status: ${apt.status || 'not set'}`);
      console.log(`   Metadata: ${JSON.stringify(apt.metadata, null, 2)}`);
      console.log('');
    });

    // 2. Check transaction lines for latest appointment
    if (appointments.length > 0) {
      const latestAppointment = appointments[0];
      console.log(`\n📋 Checking transaction lines for latest appointment ${latestAppointment.transaction_code}...`);
      
      const { data: lines, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('transaction_id', latestAppointment.id)
        .order('line_number');

      if (linesError) {
        console.error('Error querying lines:', linesError);
      } else {
        console.log(`Found ${lines.length} line items:`);
        lines.forEach((line, index) => {
          console.log(`\n   Line ${line.line_number}:`);
          console.log(`     Entity ID: ${line.entity_id || line.line_entity_id}`);
          console.log(`     Quantity: ${line.quantity}`);
          console.log(`     Unit Amount: AED ${line.unit_amount}`);
          console.log(`     Line Amount: AED ${line.line_amount}`);
          console.log(`     Metadata: ${JSON.stringify(line.line_data || line.metadata, null, 2)}`);
        });
      }
    }

    // 3. Create a test appointment to verify the process
    console.log('\n\n🔧 Creating a test appointment...');
    
    // First get a customer
    const { data: customers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'customer')
      .limit(1);

    if (customers && customers.length > 0) {
      const testCustomer = customers[0];
      console.log(`Using customer: ${testCustomer.entity_name} (${testCustomer.id})`);

      // Create test appointment transaction
      const testAppointment = {
        organization_id: SALON_ORG_ID,
        transaction_type: 'APPOINTMENT', // Must be uppercase
        transaction_code: `APT-TEST-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: testCustomer.id, // Customer
        target_entity_id: null, // Stylist (optional)
        total_amount: 150,
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.HEADER.v1', // Correct smart code format
        metadata: {
          status: 'DRAFT',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60 minutes later
          duration_minutes: 60,
          notes: 'Test appointment created by script',
          service_name: 'Test Service',
          created_via: 'TEST_SCRIPT',
          created_at: new Date().toISOString()
        }
      };

      console.log('\nCreating transaction with data:', JSON.stringify(testAppointment, null, 2));

      const { data: newAppointment, error: createError } = await supabase
        .from('universal_transactions')
        .insert([testAppointment])
        .select()
        .single();

      if (createError) {
        console.error('\n❌ Error creating appointment:', createError);
      } else {
        console.log('\n✅ Successfully created test appointment!');
        console.log(`   ID: ${newAppointment.id}`);
        console.log(`   Code: ${newAppointment.transaction_code}`);
        console.log(`   Total: AED ${newAppointment.total_amount}`);
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testAppointmentCreation();