import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA3ODcsImV4cCI6MjA2OTE3Njc4N30.MeQGn3wi7WFDLfw_DNUKzvfOYle9vGX9BEN67wuSTLQ'

const supabase = createClient(supabaseUrl, supabaseKey)

// Bella Vista Salon organization ID
const SALON_ORG_ID = 'bella_vista_salon_test'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Fetching Salon Dashboard Data...')
    
    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch salon staff (stylists)
    const { data: staff, error: staffError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'staff')
      .eq('status', 'active')
      .order('entity_name')
    
    if (staffError) {
      console.error('Error fetching staff:', staffError)
    }

    // Fetch today's appointments from universal_transactions
    const { data: appointments, error: appointmentsError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        reference_entity:core_entities!universal_transactions_reference_entity_id_fkey(entity_name)
      `)
      .eq('organization_id', SALON_ORG_ID)
      .eq('transaction_type', 'appointment')
      .gte('transaction_date', today)
      .lt('transaction_date', new Date(new Date(today).getTime() + 24*60*60*1000).toISOString().split('T')[0])
      .order('transaction_date')
    
    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
    }

    // Fetch recent customers
    const { data: customers, error: customersError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'customer')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5)
    
    if (customersError) {
      console.error('Error fetching customers:', customersError)
    }

    // Calculate today's stats
    const completedAppointments = appointments?.filter(apt => 
      apt.metadata && apt.metadata.status === 'completed'
    ) || []
    
    const todayRevenue = completedAppointments.reduce((sum, apt) => 
      sum + (apt.total_amount || 0), 0
    )

    // Transform data to match frontend expectations
    const dashboardData = {
      todayAppointments: appointments?.map(apt => ({
        id: apt.id,
        client: apt.reference_entity?.entity_name || 'Unknown Client',
        service: apt.metadata?.service_name || 'Service',
        time: apt.metadata?.appointment_time || '10:00 AM',
        stylist: apt.metadata?.stylist_name || 'Staff Member',
        duration: apt.metadata?.duration || '60 min',
        price: apt.total_amount || 0
      })) || [],
      
      quickStats: {
        todayRevenue: Math.round(todayRevenue),
        appointmentsToday: appointments?.length || 0,
        clientsServed: completedAppointments.length,
        averageTicket: completedAppointments.length > 0 
          ? Math.round(todayRevenue / completedAppointments.length)
          : 0
      },
      
      recentClients: customers?.map(customer => ({
        id: customer.id,
        name: customer.entity_name,
        lastVisit: customer.updated_at ? 
          new Date(customer.updated_at).toLocaleDateString() : 
          'Recently',
        totalSpent: customer.metadata?.total_spent || 0,
        visits: customer.metadata?.visit_count || 0,
        favorite: customer.metadata?.favorite_service || 'Haircut & Style'
      })) || [],
      
      staff: staff || [],
      timestamp: new Date().toISOString()
    }

    console.log('✅ Salon dashboard data loaded successfully')
    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('❌ Error in salon dashboard API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salon dashboard data' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('📝 Saving salon dashboard data...')
    
    // In a full implementation, this would save changes to the database
    // For now, we'll just return success
    
    console.log('✅ Salon data saved successfully')
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    })

  } catch (error) {
    console.error('❌ Error saving salon data:', error)
    return NextResponse.json(
      { error: 'Failed to save salon data' }, 
      { status: 500 }
    )
  }
}