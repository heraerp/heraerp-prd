#!/usr/bin/env node
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function createSalonDemoData() {
  console.log('🌟 Creating salon demo data...')

  try {
    // 1. Create customers
    const customers = [
      { name: 'Sarah Johnson', code: 'CUST-001', phone: '+971501234567', email: 'sarah@example.com' },
      { name: 'Emma Davis', code: 'CUST-002', phone: '+971502345678', email: 'emma@example.com' },
      { name: 'Olivia Williams', code: 'CUST-003', phone: '+971503456789', email: 'olivia@example.com' }
    ]

    const createdCustomers = []
    for (const customer of customers) {
      const { data, error } = await supabase.from('core_entities').insert({
        organization_id: SALON_ORG_ID,
        entity_type: 'customer',
        entity_name: customer.name,
        entity_code: customer.code,
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.v1',
        status: 'active',
        metadata: {
          phone: customer.phone,
          email: customer.email,
          vip_level: 'gold'
        }
      }).select().single()

      if (error) {
        console.error('Error creating customer:', error)
      } else {
        console.log('✅ Created customer:', customer.name)
        createdCustomers.push(data)
      }
    }

    // 2. Create stylists
    const stylists = [
      { name: 'Rocky', code: 'STAFF-001', level: 'celebrity', skills: ['Brazilian Blowout', 'Keratin', 'Color'] },
      { name: 'Maya', code: 'STAFF-002', level: 'senior', skills: ['Hair Color', 'Highlights', 'Treatments'] },
      { name: 'Sophia', code: 'STAFF-003', level: 'senior', skills: ['Hair Cut', 'Styling', 'Bridal'] }
    ]

    const createdStylists = []
    for (const stylist of stylists) {
      const { data, error } = await supabase.from('core_entities').insert({
        organization_id: SALON_ORG_ID,
        entity_type: 'staff',
        entity_name: stylist.name,
        entity_code: stylist.code,
        smart_code: 'HERA.SALON.HR.STAFF.PROFILE.v1',
        status: 'active',
        metadata: {
          level: stylist.level,
          skills: stylist.skills,
          working_hours: { start: 9, end: 18 }
        }
      }).select().single()

      if (error) {
        console.error('Error creating stylist:', error)
      } else {
        console.log('✅ Created stylist:', stylist.name)
        createdStylists.push(data)
      }
    }

    // 3. Create services
    const services = [
      { name: 'Brazilian Blowout', code: 'SRV-001', duration: 240, price: 500, category: 'Chemical Treatment' },
      { name: 'Hair Color', code: 'SRV-002', duration: 120, price: 250, category: 'Coloring' },
      { name: 'Haircut & Style', code: 'SRV-003', duration: 60, price: 150, category: 'Cut & Style' },
      { name: 'Deep Conditioning', code: 'SRV-004', duration: 45, price: 100, category: 'Treatment' }
    ]

    const createdServices = []
    for (const service of services) {
      const { data, error } = await supabase.from('core_entities').insert({
        organization_id: SALON_ORG_ID,
        entity_type: 'service',
        entity_name: service.name,
        entity_code: service.code,
        smart_code: 'HERA.SALON.SVC.SERVICE.CATALOG.v1',
        status: 'active',
        metadata: {
          duration: service.duration,
          price: service.price,
          category: service.category,
          buffer_before: 5,
          buffer_after: 10
        }
      }).select().single()

      if (error) {
        console.error('Error creating service:', error)
      } else {
        console.log('✅ Created service:', service.name)
        createdServices.push(data)
      }
    }

    // 4. Create appointments
    if (createdCustomers.length > 0 && createdStylists.length > 0 && createdServices.length > 0) {
      const appointments = [
        {
          customer: createdCustomers[0],
          stylist: createdStylists[0],
          service: createdServices[0],
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          time: '10:00',
          status: 'CONFIRMED'
        },
        {
          customer: createdCustomers[1],
          stylist: createdStylists[1],
          service: createdServices[1],
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          time: '14:00',
          status: 'CONFIRMED'
        },
        {
          customer: createdCustomers[2],
          stylist: createdStylists[2],
          service: createdServices[2],
          date: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
          time: '11:00',
          status: 'DRAFT'
        }
      ]

      for (const apt of appointments) {
        const appointmentDate = new Date(apt.date)
        appointmentDate.setHours(parseInt(apt.time.split(':')[0]), parseInt(apt.time.split(':')[1]), 0)

        const { data, error } = await supabase.from('universal_transactions').insert({
          organization_id: SALON_ORG_ID,
          transaction_type: 'appointment',
          transaction_code: `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          transaction_date: appointmentDate.toISOString(),
          source_entity_id: apt.customer.id,
          target_entity_id: apt.stylist.id,
          total_amount: apt.service.metadata.price,
          transaction_status: apt.status.toLowerCase(),
          smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.CREATE.v1',
          metadata: {
            customer_name: apt.customer.entity_name,
            stylist_name: apt.stylist.entity_name,
            services: [apt.service.entity_name],
            status: apt.status,
            duration: apt.service.metadata.duration,
            notes: `${apt.service.entity_name} appointment`
          }
        }).select().single()

        if (error) {
          console.error('Error creating appointment:', error)
        } else {
          console.log('✅ Created appointment for:', apt.customer.entity_name)
          
          // Create transaction line for the service
          await supabase.from('universal_transaction_lines').insert({
            organization_id: SALON_ORG_ID,
            transaction_id: data.id,
            line_number: 1,
            line_entity_id: apt.service.id,
            line_type: 'service',
            description: apt.service.entity_name,
            quantity: 1,
            unit_amount: apt.service.metadata.price,
            line_amount: apt.service.metadata.price,
            smart_code: 'HERA.SALON.CALENDAR.APPOINTMENT.LINE.SERVICE.v1'
          })
        }
      }
    }

    console.log('✨ Demo data created successfully!')

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

createSalonDemoData()