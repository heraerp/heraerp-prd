/**
 * Quick Appointment Seed for Testing
 * Uses existing entities to create appointments
 */

const { createClient } = require('@supabase/supabase-js')
const { format, addDays, setHours, setMinutes } = require('date-fns')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_SALON_ORG_ID = 'e7c5e7aa-9866-4574-ac48-30f6a8c96bb7'

// Appointment smart codes
const SMART_CODES = {
  APPOINTMENT: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
}

async function quickSeedAppointments(organizationId = DEFAULT_SALON_ORG_ID) {
  console.log('🌟 Quick Appointment Seed...')
  console.log(`📍 Organization ID: ${organizationId}`)
  
  try {
    // Get existing customers, services, and staff
    const { data: customers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')
      .limit(5)
    
    const { data: services } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'service')
      .limit(10)
      
    const { data: staff } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .limit(3)

    console.log(`\nFound: ${customers?.length || 0} customers, ${services?.length || 0} services, ${staff?.length || 0} staff`)

    if (!customers?.length || !services?.length || !staff?.length) {
      console.log('❌ Not enough data found. Please run setup scripts first.')
      return
    }

    // Create appointments for the next 7 days
    const appointmentCount = 20
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled']
    
    for (let i = 0; i < appointmentCount; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const service = services[Math.floor(Math.random() * services.length)]
      const staffMember = staff[Math.floor(Math.random() * staff.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      // Generate appointment date (today to next 7 days)
      const daysOffset = Math.floor(Math.random() * 7)
      const appointmentDate = addDays(new Date(), daysOffset)
      
      // Generate appointment time (9 AM to 5 PM)
      const hour = 9 + Math.floor(Math.random() * 8)
      const minute = Math.random() > 0.5 ? 30 : 0
      const appointmentDateTime = setMinutes(setHours(appointmentDate, hour), minute)
      
      // Get service details
      const duration = service.metadata?.duration || 60
      const price = service.metadata?.price || 100
      
      const appointmentData = {
        transaction_type: 'appointment',
        smart_code: SMART_CODES.APPOINTMENT,
        reference_number: `APT-${Date.now()}-${i}`,
        transaction_date: new Date().toISOString(),
        total_amount: price,
        from_entity_id: customer.id,
        to_entity_id: staffMember.id,
        organization_id: organizationId,
        metadata: {
          appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
          appointment_time: format(appointmentDateTime, 'HH:mm'),
          end_time: format(new Date(appointmentDateTime.getTime() + duration * 60000), 'HH:mm'),
          duration: duration,
          service_id: service.id,
          service_name: service.entity_name,
          customer_name: customer.entity_name,
          customer_id: customer.id,
          staff_id: staffMember.id,
          staff_name: staffMember.entity_name,
          status: status,
          notes: Math.random() > 0.7 ? 'Special request: Use organic products' : null
        }
      }
      
      const { data: appointment, error } = await supabase
        .from('universal_transactions')
        .insert(appointmentData)
        .select()
        .single()
      
      if (!error) {
        // Create transaction line
        await supabase
          .from('universal_transaction_lines')
          .insert({
            transaction_id: appointment.id,
            line_number: 1,
            line_entity_id: service.id,
            quantity: 1,
            unit_price: price,
            line_amount: price,
            organization_id: organizationId,
            metadata: {
              service_name: service.entity_name,
              duration: duration,
              staff_name: staffMember.entity_name
            }
          })
        
        console.log(`✅ Created ${status} appointment: ${customer.entity_name} with ${staffMember.entity_name} for ${service.entity_name} on ${appointmentData.metadata.appointment_date} at ${appointmentData.metadata.appointment_time}`)
      } else {
        console.error(`❌ Error creating appointment:`, error.message)
      }
    }
    
    console.log('\n✅ Quick appointment seeding completed!')
    
    // Show summary
    const { data: appointmentSummary } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'appointment')
    
    if (appointmentSummary && appointmentSummary.length > 0) {
      const statusCounts = appointmentSummary.reduce((acc, apt) => {
        const status = apt.metadata?.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
      
      console.log('\n📊 Appointment Summary:')
      console.log(`   Total appointments: ${appointmentSummary.length}`)
      console.log('\n📈 Status Breakdown:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
  }
}

// Run the seeding script
quickSeedAppointments()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })