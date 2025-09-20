import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || 'today'
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Calculate date range - default to 7 days for better data visibility
    let startDate = new Date()
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case '7d':
      default:
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'mtd':
        startDate.setDate(1)
        break
      case 'ytd':
        startDate = new Date(startDate.getFullYear(), 0, 1)
        break
    }

    // Get total revenue from transactions
    const { data: revenueData, error: revenueError } = await supabase
      .from('universal_transactions')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', startDate.toISOString())

    if (revenueError) {
      console.error('Revenue error:', revenueError)
      throw revenueError
    }

    const totalRevenue = revenueData?.reduce((sum, txn) => sum + (txn.total_amount || 0), 0) || 0

    // Get total customers
    const { data: customersData, error: customersError } = await supabase
      .from('core_entities')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')

    if (customersError) {
      console.error('Customers error:', customersError)
    }

    const totalCustomers = customersData?.length || 0

    // Get total appointments
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('core_entities')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('entity_type', 'appointment')

    if (appointmentsError) {
      console.error('Appointments error:', appointmentsError)
    }

    const totalAppointments = appointmentsData?.length || 0

    // Calculate average ticket
    const transactionCount = revenueData?.length || 0
    const averageTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0

    // Get previous period data for comparison (simplified)
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - 7)

    const { data: prevRevenueData } = await supabase
      .from('universal_transactions')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', prevStartDate.toISOString())
      .lt('transaction_date', startDate.toISOString())

    const prevRevenue = prevRevenueData?.reduce((sum, txn) => sum + (txn.total_amount || 0), 0) || 0
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        revenueToday: {
          value: totalRevenue,
          change: revenueChange,
          label: range === 'today' ? 'Revenue Today' : `Revenue (${range})`,
          format: 'currency'
        },
        upcomingAppts: {
          value: totalAppointments,
          change: 0,
          label: 'Total Appointments',
          format: 'number'
        },
        avgTicket: {
          value: averageTicket,
          change: 0,
          label: 'Average Ticket',
          format: 'currency'
        },
        utilization: {
          value: 75, // Placeholder
          change: 5,
          label: 'Utilization',
          format: 'percentage'
        }
      }
    })
  } catch (error) {
    console.error('KPIs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPIs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}