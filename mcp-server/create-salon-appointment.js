#!/usr/bin/env node
// ================================================================================
// CREATE SALON APPOINTMENT
// Creates a salon appointment for today using HERA Universal API
// ================================================================================

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createAppointment() {
  try {
    console.log('🎯 Creating salon appointment for today...')
    
    // 1. Create customer entity
    const customerData = {
      organization_id: SALON_ORG_ID,
      entity_type: 'customer',
      entity_name: 'Sarah Johnson',
      entity_code: `CUST-${Date.now()}`,
      smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.v1',
      metadata: {
        phone: '+971 50 123 4567',
        email: 'sarah.johnson@example.com',
        preferences: 'Prefers morning appointments'
      }
    }
    
    console.log('Creating customer...')
    const { data: customer, error: customerError } = await supabase
      .from('core_entities')
      .insert(customerData)
      .select()
      .single()
      
    if (customerError) throw customerError
    console.log('✅ Customer created:', customer.entity_name)
    
    // 2. Create stylist entity (if not exists)
    const stylistData = {
      organization_id: SALON_ORG_ID,
      entity_type: 'employee',
      entity_name: 'Emma Chen',
      entity_code: `STAFF-${Date.now()}`,
      smart_code: 'HERA.SALON.HR.STAFF.STYLIST.v1',
      metadata: {
        role: 'Senior Stylist',
        specialties: ['Hair Color', 'Styling', 'Hair Treatments']
      }
    }
    
    console.log('Creating stylist...')
    const { data: stylist, error: stylistError } = await supabase
      .from('core_entities')
      .insert(stylistData)
      .select()
      .single()
      
    if (stylistError) throw stylistError
    console.log('✅ Stylist created:', stylist.entity_name)
    
    // 3. Create appointment transaction
    const now = new Date()
    const appointmentTime = new Date()
    appointmentTime.setHours(14, 0, 0, 0) // 2 PM today
    
    const appointmentData = {
      organization_id: SALON_ORG_ID,
      transaction_type: 'appointment',
      transaction_code: `APT-${Date.now()}`,
      transaction_date: now.toISOString().split('T')[0], // Date only
      source_entity_id: customer.id,  // Customer
      target_entity_id: stylist.id,   // Stylist
      total_amount: 150,              // Service price
      smart_code: 'HERA.SALON.APPT.BOOKING.CONFIRMED.v1',
      metadata: {
        appointment_time: appointmentTime.toISOString(),
        duration_minutes: 60,
        service: 'Hair Cut & Style',
        status: 'confirmed',
        stylist_name: stylist.entity_name,
        customer_name: customer.entity_name,
        notes: 'First-time customer, referred by friend'
      }
    }
    
    console.log('Creating appointment...')
    const { data: appointment, error: appointmentError } = await supabase
      .from('universal_transactions')
      .insert(appointmentData)
      .select()
      .single()
      
    if (appointmentError) throw appointmentError
    console.log('✅ Appointment created:', appointment.transaction_code)
    
    // 4. Create transaction line for the service
    const lineData = {
      organization_id: SALON_ORG_ID,
      transaction_id: appointment.id,
      line_number: 1,
      line_type: 'service',
      quantity: '1',
      unit_amount: 150,
      line_amount: 150,
      description: 'Hair Cut & Style',
      smart_code: 'HERA.SALON.SVC.LINE.STANDARD.v1',
      line_data: {
        service_name: 'Hair Cut & Style',
        service_duration: 60,
        service_category: 'Hair Services'
      }
    }
    
    console.log('Adding service details...')
    const { data: line, error: lineError } = await supabase
      .from('universal_transaction_lines')
      .insert(lineData)
      .select()
      .single()
      
    if (lineError) throw lineError
    console.log('✅ Service details added')
    
    console.log('\n✨ Appointment successfully created!')
    console.log('Details:')
    console.log(`- Customer: ${customer.entity_name}`)
    console.log(`- Stylist: ${stylist.entity_name}`)
    console.log(`- Service: Hair Cut & Style`)
    console.log(`- Time: ${appointmentTime.toLocaleTimeString()} today`)
    console.log(`- Price: AED ${appointment.total_amount}`)
    console.log(`- Status: Confirmed`)
    console.log(`- Appointment Code: ${appointment.transaction_code}`)
    
  } catch (error) {
    console.error('❌ Error creating appointment:', error.message)
    if (error.details) console.error('Details:', error.details)
  }
}

// Run the script
createAppointment()