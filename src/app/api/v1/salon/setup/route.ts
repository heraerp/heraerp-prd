import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

interface SetupRequest {
  organization_id: string
  business_name: string
  owner_name: string
  owner_email: string
  currency?: string
  timezone?: string
  include_demo_data?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: SetupRequest = await request.json()
    const { 
      organization_id, 
      business_name, 
      owner_name,
      owner_email,
      currency = 'AED',
      timezone = 'Asia/Dubai',
      include_demo_data = false
    } = body

    console.log('🏪 Setting up new salon:', business_name)

    // 1. Create default services
    const defaultServices = [
      { name: 'Haircut & Style', price: 150, duration: 45, category: 'Hair Services' },
      { name: 'Hair Color', price: 350, duration: 120, category: 'Hair Services' },
      { name: 'Hair Treatment', price: 200, duration: 60, category: 'Hair Services' },
      { name: 'Manicure', price: 80, duration: 45, category: 'Nail Services' },
      { name: 'Pedicure', price: 100, duration: 60, category: 'Nail Services' },
      { name: 'Gel Polish', price: 120, duration: 60, category: 'Nail Services' },
      { name: 'Facial Treatment', price: 200, duration: 75, category: 'Spa & Wellness' },
      { name: 'Eyebrow Threading', price: 40, duration: 15, category: 'Beauty' },
      { name: 'Makeup Application', price: 250, duration: 60, category: 'Beauty' }
    ]

    const servicePromises = defaultServices.map(service => 
      supabase.from('core_entities').insert({
        organization_id,
        entity_type: 'service',
        entity_name: service.name,
        entity_code: `SRV-${service.name.replace(/\s+/g, '-').toUpperCase()}`,
        status: 'active',
        metadata: {
          price: service.price,
          duration: service.duration,
          category: service.category,
          currency: currency
        },
        smart_code: `HERA.SALON.SERVICE.${service.category.replace(/\s+/g, '_').toUpperCase()}.v1`
      })
    )

    // 2. Create owner as staff member
    await supabase.from('core_entities').insert({
      organization_id,
      entity_type: 'employee',
      entity_name: owner_name,
      entity_code: 'EMP-OWNER',
      status: 'active',
      metadata: {
        role: 'Owner',
        email: owner_email,
        permissions: 'full_access',
        commission_rate: 0
      },
      smart_code: 'HERA.SALON.STAFF.OWNER.v1'
    })

    // 3. Create loyalty tiers
    const loyaltyTiers = [
      { name: 'Bronze Member', min_points: 0, discount: 0, color: '#CD7F32' },
      { name: 'Silver Member', min_points: 500, discount: 5, color: '#C0C0C0' },
      { name: 'Gold Member', min_points: 1000, discount: 10, color: '#FFD700' },
      { name: 'Platinum VIP', min_points: 2000, discount: 15, color: '#E5E4E2' }
    ]

    const tierPromises = loyaltyTiers.map(tier =>
      supabase.from('core_entities').insert({
        organization_id,
        entity_type: 'loyalty_tier',
        entity_name: tier.name,
        entity_code: `TIER-${tier.name.split(' ')[0].toUpperCase()}`,
        status: 'active',
        metadata: {
          min_points: tier.min_points,
          discount_percentage: tier.discount,
          tier_color: tier.color
        },
        smart_code: 'HERA.SALON.LOYALTY.TIER.v1'
      })
    )

    // 4. Create demo data if requested
    if (include_demo_data) {
      // Demo staff
      const demoStaff = [
        { name: 'Sarah Johnson', role: 'Senior Stylist', specialties: ['Hair Color', 'Styling'] },
        { name: 'Maria Garcia', role: 'Nail Technician', specialties: ['Manicure', 'Nail Art'] },
        { name: 'Emma Wilson', role: 'Spa Therapist', specialties: ['Facials', 'Massage'] }
      ]

      const staffPromises = demoStaff.map(staff =>
        supabase.from('core_entities').insert({
          organization_id,
          entity_type: 'employee',
          entity_name: staff.name,
          entity_code: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          status: 'active',
          metadata: {
            role: staff.role,
            specialties: staff.specialties,
            commission_rate: 30,
            working_hours: '9:00-18:00'
          },
          smart_code: 'HERA.SALON.STAFF.EMPLOYEE.v1'
        })
      )

      // Demo clients
      const demoClients = [
        { name: 'Fatima Al-Hassan', phone: '+971501234567', visits: 12 },
        { name: 'Aisha Mohammed', phone: '+971502345678', visits: 8 },
        { name: 'Layla Ahmed', phone: '+971503456789', visits: 15 }
      ]

      const clientPromises = demoClients.map(client =>
        supabase.from('core_entities').insert({
          organization_id,
          entity_type: 'customer',
          entity_name: client.name,
          entity_code: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          status: 'active',
          metadata: {
            phone: client.phone,
            visit_count: client.visits,
            loyalty_points: client.visits * 50,
            preferred_stylist: demoStaff[0].name
          },
          smart_code: 'HERA.SALON.CUSTOMER.REGULAR.v1'
        })
      )

      await Promise.all([...staffPromises, ...clientPromises])
    }

    // Execute all setup operations
    await Promise.all([...servicePromises, ...tierPromises])

    // 5. Create initial settings
    await supabase.from('core_dynamic_data').insert({
      organization_id,
      entity_id: organization_id, // Settings linked to org itself
      field_name: 'business_settings',
      field_value_json: {
        business_name,
        currency,
        timezone,
        operating_hours: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '10:00', close: '18:00' },
          sunday: { open: 'closed', close: 'closed' }
        },
        appointment_duration: 30,
        cancellation_policy: '24 hours notice required',
        booking_advance_days: 30,
        setup_completed: true,
        setup_date: new Date().toISOString()
      }
    })

    console.log('✅ Salon setup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Salon setup completed successfully',
      data: {
        organization_id,
        business_name,
        services_created: defaultServices.length,
        loyalty_tiers_created: loyaltyTiers.length,
        demo_data_created: include_demo_data
      }
    })

  } catch (error) {
    console.error('❌ Error setting up salon:', error)
    return NextResponse.json(
      { error: 'Failed to setup salon', details: error }, 
      { status: 500 }
    )
  }
}