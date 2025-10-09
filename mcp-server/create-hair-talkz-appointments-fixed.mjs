import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('=== CREATING HAIR TALKZ APPOINTMENTS (FIXED) ===')

async function createSampleAppointments() {
  try {
    // First get the entities we created
    const { data: services } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'SERVICE')
    
    const { data: staff } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'STAFF')
    
    const { data: customers } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'CUSTOMER')
    
    console.log('Found:', {
      services: services?.length || 0,
      staff: staff?.length || 0,
      customers: customers?.length || 0
    })
    
    if (!services?.length || !staff?.length || !customers?.length) {
      console.log('❌ Missing required entities - please run create-hair-talkz-sample-data.mjs first')
      return
    }
    
    console.log('\\n1. Creating appointment transactions...')
    
    const today = new Date()
    const appointments = []
    
    // Create appointments for the next few days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const appointmentDate = new Date(today)
      appointmentDate.setDate(today.getDate() + dayOffset)
      
      // 2-3 appointments per day
      const appointmentsPerDay = Math.floor(Math.random() * 2) + 2
      
      for (let i = 0; i < appointmentsPerDay; i++) {
        const randomService = services[Math.floor(Math.random() * services.length)]
        const randomStaff = staff[Math.floor(Math.random() * staff.length)]
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)]
        
        // Random time between 9 AM and 6 PM
        const hour = 9 + Math.floor(Math.random() * 9)
        const minute = Math.random() < 0.5 ? 0 : 30
        appointmentDate.setHours(hour, minute, 0, 0)
        
        const appointment = {
          id: crypto.randomUUID(),
          organization_id: hairTalkzOrgId,
          transaction_type: 'APPOINTMENT',
          transaction_code: `APPT-${appointmentDate.getFullYear()}${(appointmentDate.getMonth()+1).toString().padStart(2,'0')}${appointmentDate.getDate().toString().padStart(2,'0')}-${hour}${minute.toString().padStart(2,'0')}`,
          smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
          transaction_date: appointmentDate.toISOString(),
          source_entity_id: randomCustomer.id, // Customer
          target_entity_id: randomStaff.id, // Staff member
          total_amount: randomService.metadata.base_price || 85.00,
          transaction_currency_code: 'AED',
          transaction_status: dayOffset === 0 ? 'completed' : (dayOffset <= 1 ? 'confirmed' : 'scheduled'),
          metadata: {
            service_id: randomService.id,
            service_name: randomService.entity_name,
            customer_name: randomCustomer.entity_name,
            staff_name: randomStaff.entity_name,
            duration_minutes: randomService.metadata.duration_minutes || 60,
            appointment_notes: dayOffset === 0 ? 'Completed successfully' : 'Regular appointment',
            booking_source: 'walk_in'
          }
        }
        
        appointments.push(appointment)
      }
    }
    
    // Insert appointments
    for (const appointment of appointments) {
      const { error: apptError } = await supabase
        .from('universal_transactions')
        .insert(appointment)
      
      if (apptError) {
        console.error(`❌ Failed to create appointment:`, apptError)
      } else {
        const date = new Date(appointment.transaction_date).toLocaleDateString()
        const time = new Date(appointment.transaction_date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        console.log(`✅ ${appointment.transaction_status}: ${appointment.metadata.customer_name} → ${appointment.metadata.service_name} (${date} ${time})`)
      }
    }
    
    console.log('\\n2. Creating appointment line items...')
    
    // Create line items for each appointment
    for (const appointment of appointments) {
      const lineItem = {
        id: crypto.randomUUID(),
        transaction_id: appointment.id,
        organization_id: hairTalkzOrgId,
        line_number: 1,
        line_entity_id: appointment.metadata.service_id,
        line_type: 'service',
        quantity: 1,
        unit_price: appointment.total_amount,
        line_amount: appointment.total_amount,
        smart_code: 'HERA.SALON.APPOINTMENT.LINE.SERVICE.V1',
        metadata: {
          service_name: appointment.metadata.service_name,
          duration_minutes: appointment.metadata.duration_minutes
        }
      }
      
      const { error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert(lineItem)
      
      if (lineError) {
        console.error(`❌ Failed to create line item:`, lineError)
      }
    }
    
    console.log('\\n3. Verification - checking created appointments...')
    
    const { data: appointmentCount } = await supabase
      .from('universal_transactions')
      .select('id, transaction_status')
      .eq('organization_id', hairTalkzOrgId)
      .eq('transaction_type', 'APPOINTMENT')
    
    const statusCounts = appointmentCount?.reduce((acc, appt) => {
      acc[appt.transaction_status] = (acc[appt.transaction_status] || 0) + 1
      return acc
    }, {})
    
    console.log('\\n📊 HAIR TALKZ APPOINTMENTS SUMMARY:')
    console.log('===================================')
    console.log(`✅ Total Appointments: ${appointmentCount?.length || 0}`)
    if (statusCounts) {
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`)
      })
    }
    
    // Calculate total revenue
    const totalRevenue = appointmentCount?.reduce((sum, appt) => sum + (appt.total_amount || 0), 0) || 0
    console.log(`💰 Total Revenue: ${totalRevenue} AED`)
    console.log('')
    console.log('🎉 APPOINTMENT DATA CREATION COMPLETE!')
    console.log('')
    console.log('📋 Michele can now:')
    console.log('  • View appointment calendar with real bookings')
    console.log('  • See completed, confirmed, and scheduled appointments')
    console.log('  • Manage appointment scheduling and staff assignments')
    console.log('  • Track revenue from appointment services')
    console.log('  • Access complete salon business dashboard')
    console.log('  • View realistic business metrics and reports')
    
  } catch (error) {
    console.error('💥 Appointment creation failed:', error)
  }
}

createSampleAppointments().catch(console.error)