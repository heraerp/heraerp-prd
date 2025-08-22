#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Use the default salon organization
const SALON_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

async function setupSalonDemoData() {
  console.log('🎯 Setting up salon demo data for customer presentation...')
  console.log(`📍 Organization ID: ${SALON_ORG_ID}`)

  try {
    // 1. Create Salon Services
    console.log('\n1️⃣ Creating salon services...')
    const services = [
      { name: 'Hair Cut & Style', duration: '45 min', price: 150, category: 'Hair' },
      { name: 'Hair Color', duration: '120 min', price: 350, category: 'Hair' },
      { name: 'Hair Color & Highlights', duration: '180 min', price: 550, category: 'Hair' },
      { name: 'Keratin Treatment', duration: '150 min', price: 800, category: 'Hair' },
      { name: 'Classic Manicure', duration: '45 min', price: 100, category: 'Nails' },
      { name: 'Gel Manicure', duration: '60 min', price: 150, category: 'Nails' },
      { name: 'Classic Pedicure', duration: '60 min', price: 120, category: 'Nails' },
      { name: 'Luxury Spa Pedicure', duration: '90 min', price: 200, category: 'Nails' },
      { name: 'Deep Cleansing Facial', duration: '75 min', price: 350, category: 'Skin' },
      { name: 'Anti-Aging Facial', duration: '90 min', price: 450, category: 'Skin' },
      { name: 'Full Body Massage', duration: '90 min', price: 400, category: 'Spa' },
      { name: 'Hot Stone Massage', duration: '90 min', price: 500, category: 'Spa' }
    ]

    const serviceResults = []
    for (const service of services) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'service',
          entity_name: service.name,
          entity_code: `SRV-${service.name.replace(/\s+/g, '-').toUpperCase()}`,
          status: 'active',
          smart_code: 'HERA.SALON.SERVICE.CATALOG.v1',
          metadata: {
            duration: service.duration,
            price: service.price,
            category: service.category,
            booking_enabled: true,
            popular: service.price > 300
          }
        })
        .select()
        .single()

      if (!error) {
        serviceResults.push(data)
        console.log(`✅ Created service: ${service.name}`)
      }
    }

    // 2. Create Salon Staff
    console.log('\n2️⃣ Creating salon staff...')
    const staff = [
      { name: 'Emma Johnson', role: 'Senior Stylist', specialties: ['Hair Color', 'Styling'] },
      { name: 'Lisa Chen', role: 'Nail Technician', specialties: ['Manicure', 'Nail Art'] },
      { name: 'Nina Patel', role: 'Esthetician', specialties: ['Facials', 'Skin Care'] },
      { name: 'Sarah Williams', role: 'Hair Stylist', specialties: ['Cutting', 'Styling'] },
      { name: 'Maria Rodriguez', role: 'Spa Therapist', specialties: ['Massage', 'Body Treatments'] }
    ]

    const staffResults = []
    for (const member of staff) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'employee',
          entity_name: member.name,
          entity_code: `STAFF-${member.name.split(' ')[1].toUpperCase()}`,
          status: 'active',
          smart_code: 'HERA.SALON.STAFF.EMPLOYEE.v1',
          metadata: {
            role: member.role,
            specialties: member.specialties,
            availability: 'full-time',
            rating: 4.5 + Math.random() * 0.5,
            experience_years: Math.floor(3 + Math.random() * 7)
          }
        })
        .select()
        .single()

      if (!error) {
        staffResults.push(data)
        console.log(`✅ Created staff: ${member.name} - ${member.role}`)
      }
    }

    // 3. Create Sample Customers
    console.log('\n3️⃣ Creating sample customers...')
    const customers = [
      { name: 'Fatima Al Rashid', phone: '+971501234567', email: 'fatima@email.com', vip: true },
      { name: 'Aisha Khan', phone: '+971502345678', email: 'aisha@email.com', vip: true },
      { name: 'Sarah Johnson', phone: '+971503456789', email: 'sarah@email.com', vip: false },
      { name: 'Maya Patel', phone: '+971504567890', email: 'maya@email.com', vip: false },
      { name: 'Leila Ahmed', phone: '+971505678901', email: 'leila@email.com', vip: true },
      { name: 'Zara Abdullah', phone: '+971506789012', email: 'zara@email.com', vip: false },
      { name: 'Noor Hassan', phone: '+971507890123', email: 'noor@email.com', vip: true },
      { name: 'Layla Mahmoud', phone: '+971508901234', email: 'layla@email.com', vip: false }
    ]

    const customerResults = []
    for (const customer of customers) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'customer',
          entity_name: customer.name,
          entity_code: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          status: 'active',
          smart_code: 'HERA.SALON.CUSTOMER.PROFILE.v1',
          metadata: {
            phone: customer.phone,
            email: customer.email,
            vip_status: customer.vip,
            loyalty_points: Math.floor(Math.random() * 1000),
            total_visits: Math.floor(Math.random() * 50),
            preferred_stylist: staff[Math.floor(Math.random() * staff.length)].name,
            last_visit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
        .select()
        .single()

      if (!error) {
        customerResults.push(data)
        console.log(`✅ Created customer: ${customer.name} ${customer.vip ? '⭐ VIP' : ''}`)
      }
    }

    // 4. Create Today's Appointments
    console.log('\n4️⃣ Creating today\'s appointments...')
    const today = new Date()
    const appointments = [
      { time: '09:00', customer: 0, service: 0, staff: 0 },
      { time: '10:00', customer: 1, service: 2, staff: 0 },
      { time: '10:30', customer: 2, service: 4, staff: 1 },
      { time: '11:00', customer: 3, service: 8, staff: 2 },
      { time: '14:00', customer: 4, service: 1, staff: 3 },
      { time: '14:30', customer: 5, service: 5, staff: 1 },
      { time: '15:00', customer: 6, service: 10, staff: 4 },
      { time: '16:00', customer: 7, service: 0, staff: 0 }
    ]

    for (const apt of appointments) {
      const customer = customerResults[apt.customer]
      const service = serviceResults[apt.service]
      const staffMember = staffResults[apt.staff]

      if (customer && service && staffMember) {
        const { error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: SALON_ORG_ID,
            transaction_type: 'appointment',
            transaction_code: `APT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            transaction_date: today.toISOString().split('T')[0],
            source_entity_id: customer.id,
            target_entity_id: staffMember.id,
            total_amount: service.metadata.price,
            transaction_currency_code: 'AED',
            base_currency_code: 'AED',
            exchange_rate: 1.0,
            exchange_rate_date: today.toISOString().split('T')[0],
            exchange_rate_type: 'SPOT',
            transaction_status: 'confirmed',
            smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
            metadata: {
              customer_name: customer.entity_name,
              customer_phone: customer.metadata.phone,
              customer_email: customer.metadata.email,
              service_id: service.id,
              service_name: service.entity_name,
              stylist_id: staffMember.id,
              stylist_name: staffMember.entity_name,
              appointment_time: apt.time,
              duration: service.metadata.duration,
              status: 'confirmed',
              reminder_sent: false
            }
          })

        if (!error) {
          console.log(`✅ Created appointment: ${apt.time} - ${customer.entity_name} with ${staffMember.entity_name}`)
        }
      }
    }

    // 5. Create Inventory Items (Products)
    console.log('\n5️⃣ Creating salon products...')
    const products = [
      { name: 'Moroccan Oil Treatment', brand: 'Moroccanoil', category: 'Hair Care', price: 180, stock: 25 },
      { name: 'Olaplex No.3 Hair Perfector', brand: 'Olaplex', category: 'Hair Care', price: 140, stock: 30 },
      { name: 'Kerastase Elixir Ultime', brand: 'Kerastase', category: 'Hair Care', price: 220, stock: 15 },
      { name: 'OPI Nail Polish Collection', brand: 'OPI', category: 'Nail Care', price: 45, stock: 50 },
      { name: 'CND Shellac Set', brand: 'CND', category: 'Nail Care', price: 350, stock: 10 },
      { name: 'La Mer Moisturizing Cream', brand: 'La Mer', category: 'Skin Care', price: 1200, stock: 5 },
      { name: 'SK-II Facial Treatment', brand: 'SK-II', category: 'Skin Care', price: 650, stock: 12 },
      { name: 'Dermalogica Daily Microfoliant', brand: 'Dermalogica', category: 'Skin Care', price: 280, stock: 20 }
    ]

    for (const product of products) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'product',
          entity_name: product.name,
          entity_code: `PROD-${product.name.split(' ')[0].toUpperCase()}`,
          status: 'active',
          smart_code: 'HERA.SALON.PRODUCT.RETAIL.v1',
          metadata: {
            brand: product.brand,
            category: product.category,
            retail_price: product.price,
            cost_price: product.price * 0.6,
            current_stock: product.stock,
            reorder_level: 5,
            barcode: `PRD${Date.now().toString().substr(-8)}`
          }
        })

      if (!error) {
        console.log(`✅ Created product: ${product.name} - Stock: ${product.stock}`)
      }
    }

    // 6. Create Recent Sales Transactions
    console.log('\n6️⃣ Creating recent sales...')
    const recentDays = 7
    for (let i = 0; i < recentDays; i++) {
      const saleDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dailySales = Math.floor(3 + Math.random() * 5)

      for (let j = 0; j < dailySales; j++) {
        const customer = customerResults[Math.floor(Math.random() * customerResults.length)]
        const service = serviceResults[Math.floor(Math.random() * serviceResults.length)]
        const amount = service.metadata.price

        const { error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: SALON_ORG_ID,
            transaction_type: 'sale',
            transaction_code: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            transaction_date: saleDate.toISOString().split('T')[0],
            source_entity_id: customer.id,
            total_amount: amount,
            currency_code: 'AED',
            status: 'active',
            smart_code: 'HERA.SALON.SALE.SERVICE.v1',
            metadata: {
              customer_name: customer.entity_name,
              service_name: service.entity_name,
              payment_method: ['cash', 'card', 'online'][Math.floor(Math.random() * 3)],
              completed: true
            }
          })

        if (!error) {
          console.log(`✅ Created sale: ${saleDate.toISOString().split('T')[0]} - AED ${amount}`)
        }
      }
    }

    console.log('\n✅ Salon demo data setup complete!')
    console.log('\n📊 Summary:')
    console.log(`- ${services.length} services created`)
    console.log(`- ${staff.length} staff members created`)
    console.log(`- ${customers.length} customers created`)
    console.log(`- ${appointments.length} appointments for today`)
    console.log(`- ${products.length} products in inventory`)
    console.log(`- Sales history for ${recentDays} days`)
    
    console.log('\n🚀 Your salon is ready for the customer demo!')
    console.log(`\n🌐 Access your salon at:`)
    console.log(`   http://localhost:3000/salon`)
    console.log(`   http://localhost:3000/salon/appointments`)
    console.log(`   http://localhost:3000/salon/appointments/new`)

  } catch (error) {
    console.error('❌ Error setting up demo data:', error)
  }
}

// Run the setup
setupSalonDemoData()