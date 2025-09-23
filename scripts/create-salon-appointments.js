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
const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function createTestAppointments() {
  console.log('🚀 Creating test appointments for Hair Talkz salon...')

  try {
    // First, get some entities (customers, services, staff) from the organization
    let { data: customers } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'customer')
      .limit(3)

    let { data: services } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service')
      .limit(3)

    let { data: staff } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'employee')
      .limit(3)

    console.log('Found:', {
      customers: customers?.length || 0,
      services: services?.length || 0,
      staff: staff?.length || 0
    })
    
    console.log('Details:', {
      customers: customers?.map(c => c.entity_name),
      services: services?.map(s => s.entity_name),
      staff: staff?.map(s => s.entity_name)
    })

    // If we don't have enough entities, create some
    if (!customers?.length || !services?.length || !staff?.length) {
      console.log('Creating sample entities...')

      // Create customers if needed
      if (!customers?.length) {
        const { data: newCustomers } = await supabase
          .from('core_entities')
          .insert([
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'customer',
              entity_name: 'Sarah Johnson',
              entity_code: 'CUST-001',
              smart_code: 'HERA.SALON.CRM.CUSTOMER.V1'
            },
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'customer',
              entity_name: 'Emily Davis',
              entity_code: 'CUST-002',
              smart_code: 'HERA.SALON.CRM.CUSTOMER.V1'
            },
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'customer',
              entity_name: 'Jessica Williams',
              entity_code: 'CUST-003',
              smart_code: 'HERA.SALON.CRM.CUSTOMER.V1'
            }
          ])
          .select()
        customers = newCustomers
      }

      // Create services if needed
      if (!services?.length) {
        const { data: newServices } = await supabase
          .from('core_entities')
          .insert([
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'service',
              entity_name: 'Hair Cut & Style',
              entity_code: 'SVC-001',
              smart_code: 'HERA.SALON.SERVICE.CATALOG.V1',
              metadata: { price: 150, duration: 45 }
            },
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'service',
              entity_name: 'Hair Color',
              entity_code: 'SVC-002',
              smart_code: 'HERA.SALON.SERVICE.CATALOG.V1',
              metadata: { price: 350, duration: 120 }
            },
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'service',
              entity_name: 'Manicure & Pedicure',
              entity_code: 'SVC-003',
              smart_code: 'HERA.SALON.SERVICE.CATALOG.V1',
              metadata: { price: 200, duration: 60 }
            }
          ])
          .select()
        services = newServices
      }

      // Create staff if needed
      if (!staff?.length) {
        console.log('Creating staff members...')
        const { data: newStaff, error: staffError } = await supabase
          .from('core_entities')
          .insert([
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'employee',
              entity_name: 'Maria Stylist',
              entity_code: 'STAFF-MARIA-HT',
              smart_code: 'HERA.SALON.HR.STAFF.STYLIST.V1'
            },
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'employee',
              entity_name: 'Sofia Senior',
              entity_code: 'STAFF-SOFIA-HT',
              smart_code: 'HERA.SALON.HR.STAFF.STYLIST.V1'
            },
            {
              organization_id: SALON_ORG_ID,
              entity_type: 'employee',
              entity_name: 'Anna Expert',
              entity_code: 'STAFF-ANNA-HT',
              smart_code: 'HERA.SALON.HR.STAFF.STYLIST.V1'
            }
          ])
          .select()
        
        if (staffError) {
          console.error('Error creating staff:', staffError)
        } else {
          staff = newStaff
          console.log(`Created ${newStaff?.length || 0} staff members`)
        }
      }
    }

    // Create appointments as transactions
    const today = new Date()
    const appointments = []

    // Create appointments for today and next few days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const appointmentDate = new Date(today)
      appointmentDate.setDate(today.getDate() + dayOffset)
      
      // Create 2-3 appointments per day
      const appointmentsPerDay = Math.floor(Math.random() * 2) + 2
      
      for (let i = 0; i < appointmentsPerDay; i++) {
        if (!customers?.length || !services?.length || !staff?.length) {
          console.error('Missing required entities')
          continue
        }
        
        const customer = customers[Math.floor(Math.random() * customers.length)]
        const service = services[Math.floor(Math.random() * services.length)]
        const staffMember = staff[Math.floor(Math.random() * staff.length)]
        
        // Random time between 9 AM and 6 PM
        const hour = 9 + Math.floor(Math.random() * 9)
        const minutes = Math.random() > 0.5 ? '00' : '30'
        const appointmentTime = `${hour.toString().padStart(2, '0')}:${minutes}`
        
        const appointment = {
          organization_id: SALON_ORG_ID,
          transaction_type: 'appointment', // lowercase as per appointment-api
          transaction_code: `APT-${Date.now()}-${i}-${dayOffset}`,
          smart_code: 'HERA.SALON.SVC.TXN.APPOINTMENT.V1',
          transaction_date: new Date().toISOString(),
          total_amount: service.metadata?.price || 200,
          source_entity_id: customer.id,
          target_entity_id: staffMember.id,
          metadata: {
            appointment_date: appointmentDate.toISOString().split('T')[0],
            appointment_time: appointmentTime,
            end_time: `${(hour + Math.ceil((service.metadata?.duration || 60) / 60)).toString().padStart(2, '0')}:${minutes}`,
            duration: service.metadata?.duration || 60,
            service_id: service.id,
            service_name: service.entity_name,
            customer_name: customer.entity_name,
            customer_id: customer.id,
            staff_id: staffMember.id,
            staff_name: staffMember.entity_name,
            status: dayOffset === 0 && i === 0 ? 'checked_in' : 'booked',
            notes: `Test appointment for ${customer.entity_name}`
          }
        }
        
        appointments.push(appointment)
      }
    }

    // Insert all appointments
    console.log(`\n📅 Creating ${appointments.length} appointments...`)
    
    const { data: createdAppointments, error } = await supabase
      .from('universal_transactions')
      .insert(appointments)
      .select()

    if (error) {
      console.error('Error creating appointments:', error)
      return
    }

    console.log(`✅ Successfully created ${createdAppointments.length} appointments!`)
    
    // Create transaction lines for each appointment
    const transactionLines = []
    for (const appointment of createdAppointments) {
      const serviceId = appointment.metadata.service_id
      const service = services.find(s => s.id === serviceId)
      
      transactionLines.push({
        organization_id: SALON_ORG_ID,
        transaction_id: appointment.id,
        line_number: 1,
        line_entity_id: serviceId,
        quantity: 1,
        unit_price: service?.metadata?.price || 200,
        line_amount: service?.metadata?.price || 200,
        smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
        metadata: {
          service_name: service?.entity_name,
          duration: service?.metadata?.duration || 60,
          staff_name: appointment.metadata.staff_name
        }
      })
    }

    const { data: createdLines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .insert(transactionLines)
      .select()

    if (linesError) {
      console.error('Error creating transaction lines:', linesError)
    } else {
      console.log(`✅ Created ${createdLines.length} transaction lines`)
    }

    // Show summary
    console.log('\n📊 Appointment Summary:')
    const appointmentsByDate = appointments.reduce((acc, apt) => {
      const date = apt.metadata.appointment_date
      if (!acc[date]) acc[date] = []
      acc[date].push({
        time: apt.metadata.appointment_time,
        customer: apt.metadata.customer_name,
        service: apt.metadata.service_name,
        staff: apt.metadata.staff_name,
        status: apt.metadata.status
      })
      return acc
    }, {})

    Object.entries(appointmentsByDate).forEach(([date, apts]) => {
      console.log(`\n📅 ${date}:`)
      apts.forEach(apt => {
        console.log(`   ${apt.time} - ${apt.customer} - ${apt.service} with ${apt.staff} (${apt.status})`)
      })
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
createTestAppointments()