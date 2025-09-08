/**
 * Seed Appointment Data Script
 * 
 * This script populates appointment data for a salon using the Sacred 6-table architecture:
 * - Creates customers, services, and staff in core_entities
 * - Creates appointments as universal_transactions
 * - Sets up proper relationships and metadata
 */

const { createClient } = require('@supabase/supabase-js')
const { format, addDays, addHours, setHours, setMinutes } = require('date-fns')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_SALON_ORG_ID = 'e7c5e7aa-9866-4574-ac48-30f6a8c96bb7'

// Appointment smart codes
const SMART_CODES = {
  CUSTOMER: 'HERA.SALON.CRM.CUSTOMER.v1',
  SERVICE: 'HERA.SALON.SERVICE.CATALOG.v1',
  STAFF: 'HERA.SALON.STAFF.PROFILE.v1',
  APPOINTMENT: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
}

// Sample data
const customerData = [
  { name: 'Sarah Johnson', phone: '+971 50 123 4567', email: 'sarah.j@email.com' },
  { name: 'Emily Davis', phone: '+971 50 234 5678', email: 'emily.d@email.com' },
  { name: 'Jessica Wilson', phone: '+971 50 345 6789', email: 'jessica.w@email.com' },
  { name: 'Maria Garcia', phone: '+971 50 456 7890', email: 'maria.g@email.com' },
  { name: 'Fatima Al Rashid', phone: '+971 50 567 8901', email: 'fatima.ar@email.com' },
  { name: 'Aisha Khan', phone: '+971 50 678 9012', email: 'aisha.k@email.com' },
  { name: 'Layla Ahmed', phone: '+971 50 789 0123', email: 'layla.a@email.com' },
  { name: 'Sophie Laurent', phone: '+971 50 890 1234', email: 'sophie.l@email.com' },
  { name: 'Nina Patel', phone: '+971 50 901 2345', email: 'nina.p@email.com' },
  { name: 'Zara Mohammed', phone: '+971 50 012 3456', email: 'zara.m@email.com' }
]

const serviceData = [
  { name: 'Hair Cut & Style', duration: 60, price: 150 },
  { name: 'Hair Color', duration: 120, price: 350 },
  { name: 'Hair Highlights', duration: 180, price: 450 },
  { name: 'Hair Treatment', duration: 90, price: 250 },
  { name: 'Blow Dry', duration: 45, price: 100 },
  { name: 'Hair Extension', duration: 240, price: 800 },
  { name: 'Manicure', duration: 45, price: 80 },
  { name: 'Pedicure', duration: 60, price: 120 },
  { name: 'Facial Treatment', duration: 75, price: 200 },
  { name: 'Eyebrow Threading', duration: 30, price: 50 }
]

const staffData = [
  { name: 'Maya Chen', specialization: 'Hair Styling', department: 'salon' },
  { name: 'Lisa Anderson', specialization: 'Hair Coloring', department: 'salon' },
  { name: 'Anna Martinez', specialization: 'Hair Treatments', department: 'salon' },
  { name: 'Sophia Kim', specialization: 'Nail Care', department: 'salon' },
  { name: 'Priya Singh', specialization: 'Facial Specialist', department: 'salon' }
]

async function seedAppointmentData(organizationId = DEFAULT_SALON_ORG_ID) {
  console.log('🌟 Starting Appointment Data Seed...')
  console.log(`📍 Organization ID: ${organizationId}`)
  
  try {
    // 1. Create customers
    console.log('\n1️⃣ Creating customers...')
    const customers = []
    for (const customer of customerData) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'customer',
          entity_name: customer.name,
          entity_code: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organization_id: organizationId,
          smart_code: SMART_CODES.CUSTOMER,
          metadata: {
            phone: customer.phone,
            email: customer.email,
            preferred_contact: 'phone',
            vip_status: Math.random() > 0.7 ? 'gold' : 'regular'
          }
        })
        .select()
        .single()
      
      if (!error) {
        customers.push(data)
        console.log(`   ✅ Created customer: ${customer.name}`)
      } else {
        console.error(`   ❌ Error creating customer ${customer.name}:`, error)
      }
    }
    
    // 2. Create services
    console.log('\n2️⃣ Creating services...')
    const services = []
    for (const service of serviceData) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'service',
          entity_name: service.name,
          entity_code: `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organization_id: organizationId,
          smart_code: SMART_CODES.SERVICE,
          metadata: {
            duration: service.duration,
            price: service.price,
            category: service.name.includes('Hair') ? 'Hair Services' : 
                     service.name.includes('Nail') || service.name.includes('cure') ? 'Nail Services' :
                     'Beauty Services',
            active: true
          }
        })
        .select()
        .single()
      
      if (!error) {
        services.push(data)
        console.log(`   ✅ Created service: ${service.name}`)
      } else {
        console.error(`   ❌ Error creating service ${service.name}:`, error)
      }
    }
    
    // 3. Create staff members
    console.log('\n3️⃣ Creating staff members...')
    const staff = []
    for (const member of staffData) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'employee',
          entity_name: member.name,
          entity_code: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organization_id: organizationId,
          smart_code: SMART_CODES.STAFF,
          metadata: {
            role: 'stylist',
            department: member.department,
            specialization: member.specialization,
            working_hours: {
              monday: { start: '09:00', end: '18:00' },
              tuesday: { start: '09:00', end: '18:00' },
              wednesday: { start: '09:00', end: '18:00' },
              thursday: { start: '09:00', end: '18:00' },
              friday: { start: '09:00', end: '18:00' },
              saturday: { start: '10:00', end: '17:00' },
              sunday: 'off'
            }
          }
        })
        .select()
        .single()
      
      if (!error) {
        staff.push(data)
        console.log(`   ✅ Created staff: ${member.name}`)
      } else {
        console.error(`   ❌ Error creating staff ${member.name}:`, error)
      }
    }
    
    // 4. Create appointments
    console.log('\n4️⃣ Creating appointments...')
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled']
    const appointmentCount = 30
    
    for (let i = 0; i < appointmentCount; i++) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)]
      const randomService = services[Math.floor(Math.random() * services.length)]
      const randomStaff = staff[Math.floor(Math.random() * staff.length)]
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      
      // Generate appointment date (past 7 days to next 14 days)
      const daysOffset = Math.floor(Math.random() * 21) - 7
      const appointmentDate = addDays(new Date(), daysOffset)
      
      // Generate appointment time (9 AM to 5 PM)
      const hour = 9 + Math.floor(Math.random() * 8)
      const minute = Math.random() > 0.5 ? 30 : 0
      const appointmentDateTime = setMinutes(setHours(appointmentDate, hour), minute)
      
      const appointmentData = {
        transaction_type: 'appointment',
        smart_code: SMART_CODES.APPOINTMENT,
        reference_number: `APT-${Date.now()}-${i}`,
        transaction_date: new Date().toISOString(),
        total_amount: randomService.metadata.price,
        from_entity_id: randomCustomer.id,
        to_entity_id: randomStaff.id,
        organization_id: organizationId,
        metadata: {
          appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
          appointment_time: format(appointmentDateTime, 'HH:mm'),
          end_time: format(addHours(appointmentDateTime, randomService.metadata.duration / 60), 'HH:mm'),
          duration: randomService.metadata.duration,
          service_id: randomService.id,
          service_name: randomService.entity_name,
          customer_name: randomCustomer.entity_name,
          customer_id: randomCustomer.id,
          staff_id: randomStaff.id,
          staff_name: randomStaff.entity_name,
          status: randomStatus,
          notes: Math.random() > 0.7 ? 'Special request: Use organic products only' : null
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
            line_entity_id: randomService.id,
            quantity: 1,
            unit_price: randomService.metadata.price,
            line_amount: randomService.metadata.price,
            organization_id: organizationId,
            metadata: {
              service_name: randomService.entity_name,
              duration: randomService.metadata.duration,
              staff_name: randomStaff.entity_name
            }
          })
        
        console.log(`   ✅ Created appointment: ${randomCustomer.entity_name} - ${randomService.entity_name} on ${appointmentData.metadata.appointment_date} at ${appointmentData.metadata.appointment_time}`)
      } else {
        console.error(`   ❌ Error creating appointment:`, error)
      }
    }
    
    console.log('\n✅ Appointment data seeding completed!')
    
    // Show summary
    const { data: appointmentSummary } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'appointment')
    
    console.log('\n📊 Summary:')
    console.log(`   - Total customers: ${customers.length}`)
    console.log(`   - Total services: ${services.length}`)
    console.log(`   - Total staff: ${staff.length}`)
    console.log(`   - Total appointments: ${appointmentSummary?.length || 0}`)
    
    if (appointmentSummary && appointmentSummary.length > 0) {
      const statusCounts = appointmentSummary.reduce((acc, apt) => {
        const status = apt.metadata?.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
      
      console.log('\n📈 Appointment Status Breakdown:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
  }
}

// Run the seeding script
seedAppointmentData()
  .then(() => {
    console.log('\n🎉 Seeding script completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })