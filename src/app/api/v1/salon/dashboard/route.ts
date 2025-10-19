import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Use the default organization ID from environment or fallback
const DEFAULT_SALON_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

export async function GET(request: NextRequest) {
  try {
    // Get organization_id from query params or use default
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || DEFAULT_SALON_ORG_ID

    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0]

    // Fetch salon staff (stylists)
    const { data: staff, error: staffError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .eq('status', 'active')
      .order('entity_name')

    if (staffError) {
      console.error('Error fetching staff:', staffError)
    }

    // Fetch today's appointments from universal_transactions
    const { data: appointments, error: appointmentsError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'APPOINTMENT') // Use uppercase to match schema
      .gte('transaction_date', today)
      .lt(
        'transaction_date',
        new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      )
      .order('transaction_date')

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
    }

    // Fetch recent customers
    const { data: customers, error: customersError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (customersError) {
      console.error('Error fetching customers:', customersError)
    }

    // Calculate today's stats
    const completedAppointments =
      appointments?.filter(apt => apt.metadata && apt.metadata.status === 'completed') || []

    const todayRevenue = completedAppointments.reduce(
      (sum, apt) => sum + (apt.total_amount || 0),
      0
    )

    // Transform data to match frontend expectations
    const dashboardData = {
      todayAppointments:
        appointments?.map(apt => ({
          id: apt.id,
          client: (apt.metadata as any)?.customer_name || 'Unknown Client',
          service: (apt.metadata as any)?.service_name || 'Service',
          time: (apt.metadata as any)?.appointment_time || '10:00 AM',
          stylist: (apt.metadata as any)?.stylist_name || 'Staff Member',
          duration: (apt.metadata as any)?.duration || '60 min',
          price: apt.total_amount || 0
        })) || [],

      quickStats: {
        todayRevenue: Math.round(todayRevenue),
        appointmentsToday: appointments?.length || 0,
        clientsServed: completedAppointments.length,
        averageTicket:
          completedAppointments.length > 0
            ? Math.round(todayRevenue / completedAppointments.length)
            : 0
      },

      recentClients:
        customers?.map(customer => ({
          id: customer.id,
          name: customer.entity_name,
          lastVisit: customer.updated_at
            ? new Date(customer.updated_at).toLocaleDateString()
            : 'Recently',
          totalSpent: (customer.metadata as any)?.total_spent || 0,
          visits: (customer.metadata as any)?.visit_count || 0,
          favorite: (customer.metadata as any)?.favorite_service || 'Haircut & Style'
        })) || [],

      staff: staff || [],
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('❌ Error in salon dashboard API:', error)
    return NextResponse.json({ error: 'Failed to fetch salon dashboard data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // In a full implementation, this would save changes to the database
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error saving salon data:', error)
    return NextResponse.json({ error: 'Failed to save salon data' }, { status: 500 })
  }
}
