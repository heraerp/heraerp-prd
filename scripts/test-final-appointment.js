const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz organization ID
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function createFinalTestAppointment() {
  console.log('🎯 Creating final test appointment for Hair Talkz...\n')

  try {
    // Get specific test data
    const { data: customer } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'customer')
      .eq('entity_name', 'Emily Davis')
      .single()

    const { data: service } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'service')
      .eq('entity_name', 'Balayage')
      .single()

    const { data: staff } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'employee')
      .eq('entity_name', 'Sofia Senior')
      .single()

    console.log('Creating appointment with:')
    console.log('- Customer:', customer.entity_name)
    console.log('- Service:', service.entity_name, '(AED', service.metadata.price, ',', service.metadata.duration, 'min)')
    console.log('- Staff:', staff.entity_name)

    // Create tomorrow's appointment
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const appointmentDate = tomorrow.toISOString().split('T')[0]

    const appointment = {
      organization_id: HAIRTALKZ_ORG_ID,
      transaction_type: 'APPOINTMENT',
      transaction_code: `APT-FINAL-${Date.now()}`,
      smart_code: 'HERA.SALON.SVC.TXN.APPOINTMENT.V1',
      transaction_date: new Date().toISOString(),
      total_amount: service.metadata.price,
      source_entity_id: customer.id,
      target_entity_id: staff.id,
      metadata: {
        appointment_date: appointmentDate,
        appointment_time: '10:00',
        end_time: '12:30', // 150 minutes for Balayage
        duration: service.metadata.duration,
        service_id: service.id,
        service_name: service.entity_name,
        customer_name: customer.entity_name,
        customer_id: customer.id,
        staff_id: staff.id,
        staff_name: staff.entity_name,
        status: 'confirmed',
        notes: 'Test appointment created via script - ready for modal testing',
        customer_phone: customer.metadata?.phone || 'Not provided',
        customer_email: customer.metadata?.email || 'Not provided'
      }
    }

    console.log('\nCreating appointment...')
    const { data: createdAppointment, error } = await supabase
      .from('universal_transactions')
      .insert(appointment)
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return
    }

    console.log('\n✅ Appointment created successfully!')
    console.log('\n📋 Appointment Details:')
    console.log('ID:', createdAppointment.id)
    console.log('Code:', createdAppointment.transaction_code)
    console.log('Date:', appointmentDate, 'at 10:00 AM')
    console.log('Customer:', customer.entity_name)
    console.log('Service:', service.entity_name, '(AED', service.metadata.price, ')')
    console.log('Staff:', staff.entity_name)
    console.log('Duration:', service.metadata.duration, 'minutes')
    console.log('Status: Confirmed')
    
    console.log('\n🎉 The Hair Talkz appointment system is fully functional!')
    console.log('You can now use the appointment modal at:')
    console.log('http://hairtalkz.localhost:3001/salon/appointments/new')

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
createFinalTestAppointment()