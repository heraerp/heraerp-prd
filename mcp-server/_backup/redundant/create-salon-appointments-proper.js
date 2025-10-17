#!/usr/bin/env node
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function createProperSalonAppointments() {
  console.log('🌟 Creating salon appointments with proper metadata...')

  try {
    // Get existing entities
    console.log('📋 Fetching existing entities...')
    const { data: customers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'customer')
      .limit(3)

    const { data: stylists } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'staff')
      .limit(3)

    const { data: services } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service')
      .limit(4)

    console.log(`Found ${customers?.length || 0} customers, ${stylists?.length || 0} stylists, ${services?.length || 0} services`)

    if (!customers?.length || !stylists?.length || !services?.length) {
      console.log('❌ Not enough entities found. Please run create-salon-demo-appointments.js first')
      return
    }

    // Create appointments with proper metadata structure
    const appointments = [
      {
        customer: customers[0],
        stylist: stylists[0],
        service: services[0],
        date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        time: '14:00',
        status: 'CONFIRMED'
      },
      {
        customer: customers[1],
        stylist: stylists[1],
        service: services[1],
        date: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        time: '15:00',
        status: 'CONFIRMED'
      },
      {
        customer: customers[2],
        stylist: stylists[2],
        service: services[2],
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '10:00',
        status: 'DRAFT'
      }
    ]

    for (const apt of appointments) {
      const appointmentDate = new Date(apt.date)
      const [hours, minutes] = apt.time.split(':')
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0)

      const { data, error } = await supabase.from('universal_transactions').insert({
        organization_id: SALON_ORG_ID,
        transaction_type: 'appointment',
        transaction_code: `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        transaction_date: appointmentDate.toISOString(),
        source_entity_id: apt.customer.id,
        target_entity_id: apt.stylist.id,
        total_amount: apt.service.metadata?.price || 0,
        transaction_status: apt.status.toLowerCase(),
        smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.CREATE.v1',
        metadata: {
          // This is the structure our UI expects
          customer_name: apt.customer.entity_name,
          stylist_name: apt.stylist.entity_name,
          services: [apt.service.entity_name],
          service_name: apt.service.entity_name, // Also add this for backward compatibility
          status: apt.status,
          duration: apt.service.metadata?.duration || 60,
          notes: `Appointment for ${apt.customer.entity_name}`,
          price: apt.service.metadata?.price || 0,
          appointment_time: apt.time,
          customer_phone: apt.customer.metadata?.phone || '',
          customer_email: apt.customer.metadata?.email || '',
          stylist_level: apt.stylist.metadata?.level || 'senior'
        }
      }).select().single()

      if (error) {
        console.error('Error creating appointment:', error)
      } else {
        console.log(`✅ Created appointment for: ${apt.customer.entity_name} with ${apt.stylist.entity_name}`)
        console.log(`   - Service: ${apt.service.entity_name}`)
        console.log(`   - Time: ${apt.time} on ${appointmentDate.toLocaleDateString()}`)
        console.log(`   - Status: ${apt.status}`)
        console.log(`   - Code: ${data.transaction_code}`)
        
        // Create transaction line for the service
        await supabase.from('universal_transaction_lines').insert({
          organization_id: SALON_ORG_ID,
          transaction_id: data.id,
          line_number: 1,
          line_entity_id: apt.service.id,
          line_type: 'service',
          description: apt.service.entity_name,
          quantity: 1,
          unit_amount: apt.service.metadata?.price || 0,
          line_amount: apt.service.metadata?.price || 0,
          smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.LINE.SERVICE.v1'
        })
      }
    }

    console.log('✨ Salon appointments created successfully!')

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

createProperSalonAppointments()