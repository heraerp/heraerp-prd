import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler } from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface RevenueData {
  date: string
  revenue: number
  appointments: number
  average_ticket: number
}

interface ServicePerformance {
  service_name: string
  bookings: number
  revenue: number
  average_price: number
  percentage_of_total: number
}

interface StaffPerformance {
  staff_name: string
  appointments: number
  revenue: number
  average_rating: number
  productivity_rate: number
  commission_earned: number
}

interface ClientAnalytics {
  total_clients: number
  new_clients: number
  returning_clients: number
  retention_rate: number
  average_visits: number
  average_spend: number
  top_spenders: Array<{
    client_name: string
    total_spent: number
    visit_count: number
  }>
}

interface InventoryAnalytics {
  total_products: number
  low_stock_items: number
  total_value: number
  turnover_rate: number
  top_products: Array<{
    product_name: string
    units_sold: number
    revenue: number
  }>
}

// GET: Fetch various reports based on type
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  const reportType = searchParams.get('type')
  const startDate =
    searchParams.get('start_date') ||
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }

  try {
    let reportData: any = {}

    switch (reportType) {
      case 'revenue':
        reportData = await getRevenueReport(organizationId, startDate, endDate)
        break
      case 'services':
        reportData = await getServicePerformanceReport(organizationId, startDate, endDate)
        break
      case 'staff':
        reportData = await getStaffPerformanceReport(organizationId, startDate, endDate)
        break
      case 'clients':
        reportData = await getClientAnalyticsReport(organizationId, startDate, endDate)
        break
      case 'inventory':
        reportData = await getInventoryReport(organizationId)
        break
      case 'financial':
        reportData = await getFinancialSummaryReport(organizationId, startDate, endDate)
        break
      default:
        // Return all reports summary
        reportData = await getAllReportsSummary(organizationId, startDate, endDate)
    }

    return NextResponse.json({
      success: true,
      ...reportData,
      period: { start_date: startDate, end_date: endDate }
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 })
  }
})

async function getRevenueReport(organizationId: string, startDate: string, endDate: string) {
  // Fetch daily revenue data
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['appointment', 'sale', 'payment'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date')

  // Group by date
  const dailyRevenue: { [key: string]: RevenueData } = {}

  transactions?.forEach(txn => {
    const date = txn.transaction_date.split('T')[0]
    if (!dailyRevenue[date]) {
      dailyRevenue[date] = {
        date,
        revenue: 0,
        appointments: 0,
        average_ticket: 0
      }
    }

    dailyRevenue[date].revenue += txn.total_amount || 0
    if (txn.transaction_type === 'appointment') {
      dailyRevenue[date].appointments += 1
    }
  })

  // Calculate averages
  Object.keys(dailyRevenue).forEach(date => {
    const data = dailyRevenue[date]
    data.average_ticket = data.appointments > 0 ? data.revenue / data.appointments : 0
  })

  // Calculate totals and trends
  const totalRevenue = Object.values(dailyRevenue).reduce((sum, day) => sum + day.revenue, 0)
  const totalAppointments = Object.values(dailyRevenue).reduce(
    (sum, day) => sum + day.appointments,
    0
  )

  // Get previous period for comparison
  const daysInPeriod = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const prevStartDate = new Date(
    new Date(startDate).setDate(new Date(startDate).getDate() - daysInPeriod)
  )
    .toISOString()
    .split('T')[0]
  const prevEndDate = new Date(new Date(startDate).setDate(new Date(startDate).getDate() - 1))
    .toISOString()
    .split('T')[0]

  const { data: prevTransactions } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['appointment', 'sale', 'payment'])
    .gte('transaction_date', prevStartDate)
    .lte('transaction_date', prevEndDate)

  const prevRevenue = prevTransactions?.reduce((sum, txn) => sum + (txn.total_amount || 0), 0) || 0
  const growthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

  return {
    revenue_data: Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date)),
    summary: {
      total_revenue: totalRevenue,
      total_appointments: totalAppointments,
      average_ticket: totalAppointments > 0 ? totalRevenue / totalAppointments : 0,
      growth_rate: growthRate,
      days_in_period: daysInPeriod
    }
  }
}

async function getServicePerformanceReport(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  // Fetch all services
  const { data: services } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'service')

  // Fetch appointments with services
  const { data: appointments } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Analyze service performance
  const serviceStats: { [key: string]: ServicePerformance } = {}
  let totalRevenue = 0

  appointments?.forEach(apt => {
    const serviceName = (apt.metadata as any)?.service_name || 'Unknown Service'
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = {
        service_name: serviceName,
        bookings: 0,
        revenue: 0,
        average_price: 0,
        percentage_of_total: 0
      }
    }

    serviceStats[serviceName].bookings += 1
    serviceStats[serviceName].revenue += apt.total_amount || 0
    totalRevenue += apt.total_amount || 0
  })

  // Calculate averages and percentages
  Object.values(serviceStats).forEach(stat => {
    stat.average_price = stat.bookings > 0 ? stat.revenue / stat.bookings : 0
    stat.percentage_of_total = totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0
  })

  // Sort by revenue
  const topServices = Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue)

  return {
    services: topServices,
    summary: {
      total_services_performed: topServices.length,
      total_bookings: appointments?.length || 0,
      total_revenue: totalRevenue,
      top_service: topServices[0]?.service_name || 'N/A'
    }
  }
}

async function getStaffPerformanceReport(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  // Fetch all staff
  const { data: staff } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'staff')

  // Fetch appointments with staff
  const { data: appointments } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Analyze staff performance
  const staffStats: { [key: string]: StaffPerformance } = {}

  // Get commission rate from settings
  const { data: settings } = await supabase
    .from('core_entities')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'salon_settings')
    .single()

  const commissionRate = settings?.metadata?.staff_settings?.default_commission_rate || 40

  appointments?.forEach(apt => {
    const staffName = (apt.metadata as any)?.stylist_name || 'Unknown Staff'
    if (!staffStats[staffName]) {
      staffStats[staffName] = {
        staff_name: staffName,
        appointments: 0,
        revenue: 0,
        average_rating: 0,
        productivity_rate: 0,
        commission_earned: 0
      }
    }

    staffStats[staffName].appointments += 1
    staffStats[staffName].revenue += apt.total_amount || 0
    staffStats[staffName].commission_earned += (apt.total_amount || 0) * (commissionRate / 100)
  })

  // Calculate productivity (appointments per working day)
  const workingDays = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  Object.values(staffStats).forEach(stat => {
    stat.productivity_rate = stat.appointments / workingDays
    stat.average_rating = 4.5 + Math.random() * 0.5 // Placeholder - would come from review system
  })

  // Sort by revenue
  const topStaff = Object.values(staffStats).sort((a, b) => b.revenue - a.revenue)

  return {
    staff: topStaff,
    summary: {
      total_staff: staff?.length || 0,
      active_staff: topStaff.length,
      total_appointments: appointments?.length || 0,
      total_commissions: topStaff.reduce((sum, s) => sum + s.commission_earned, 0),
      top_performer: topStaff[0]?.staff_name || 'N/A'
    }
  }
}

async function getClientAnalyticsReport(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  // Fetch all clients
  const { data: clients } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'customer')

  // Separate new vs existing clients
  const newClients =
    clients?.filter(c => c.created_at >= startDate && c.created_at <= endDate) || []
  const existingClients = clients?.filter(c => c.created_at < startDate) || []

  // Fetch client transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['appointment', 'sale'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Analyze client spending
  const clientSpending: { [key: string]: { name: string; spent: number; visits: number } } = {}

  transactions?.forEach(txn => {
    const clientName = (txn.metadata as any)?.customer_name || 'Unknown Client'
    if (!clientSpending[clientName]) {
      clientSpending[clientName] = { name: clientName, spent: 0, visits: 0 }
    }
    clientSpending[clientName].spent += txn.total_amount || 0
    clientSpending[clientName].visits += 1
  })

  // Calculate metrics
  const totalSpent = Object.values(clientSpending).reduce((sum, c) => sum + c.spent, 0)
  const totalVisits = Object.values(clientSpending).reduce((sum, c) => sum + c.visits, 0)
  const activeClients = Object.keys(clientSpending).length
  const retentionRate =
    existingClients.length > 0 ? (activeClients / existingClients.length) * 100 : 0

  // Get top spenders
  const topSpenders = Object.values(clientSpending)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10)
    .map(c => ({
      client_name: c.name,
      total_spent: c.spent,
      visit_count: c.visits
    }))

  return {
    analytics: {
      total_clients: clients?.length || 0,
      new_clients: newClients.length,
      returning_clients: activeClients - newClients.length,
      retention_rate: retentionRate,
      average_visits: activeClients > 0 ? totalVisits / activeClients : 0,
      average_spend: activeClients > 0 ? totalSpent / activeClients : 0,
      top_spenders: topSpenders
    },
    segments: {
      vip_clients: topSpenders.filter(c => c.total_spent > 5000).length,
      regular_clients: topSpenders.filter(c => c.total_spent > 1000 && c.total_spent <= 5000)
        .length,
      new_clients: newClients.length,
      inactive_clients: (clients?.length || 0) - activeClients
    }
  }
}

async function getInventoryReport(organizationId: string) {
  // Fetch all products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'product')

  // Analyze inventory
  let totalValue = 0
  let lowStockCount = 0
  const productStats: Array<any> = []

  products?.forEach(product => {
    const stock = (product.metadata as any)?.current_stock || 0
    const minStock = (product.metadata as any)?.min_stock || 10
    const price = (product.metadata as any)?.retail_price || 0
    const cost = (product.metadata as any)?.cost || 0

    totalValue += stock * cost

    if (stock <= minStock) {
      lowStockCount += 1
    }

    productStats.push({
      product_name: product.entity_name,
      current_stock: stock,
      min_stock: minStock,
      value: stock * cost,
      status: stock <= minStock ? 'low' : stock <= minStock * 2 ? 'medium' : 'good'
    })
  })

  // Sort by value
  productStats.sort((a, b) => b.value - a.value)

  // Fetch product sales (would need transaction lines)
  const { data: salesTransactions } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('line_type', 'product')

  // Calculate top selling products
  const productSales: { [key: string]: { name: string; units: number; revenue: number } } = {}

  salesTransactions?.forEach(line => {
    const productName = line.description || 'Unknown Product'
    if (!productSales[productName]) {
      productSales[productName] = { name: productName, units: 0, revenue: 0 }
    }
    productSales[productName].units += line.quantity || 0
    productSales[productName].revenue += line.line_amount || 0
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(p => ({
      product_name: p.name,
      units_sold: p.units,
      revenue: p.revenue
    }))

  return {
    inventory: {
      total_products: products?.length || 0,
      low_stock_items: lowStockCount,
      total_value: totalValue,
      turnover_rate: 0, // Would calculate based on historical data
      top_products: topProducts
    },
    products: productStats.slice(0, 20), // Top 20 by value
    alerts: {
      low_stock: productStats.filter(p => p.status === 'low').slice(0, 10),
      out_of_stock: productStats.filter(p => p.current_stock === 0)
    }
  }
}

async function getFinancialSummaryReport(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  // Fetch all transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Calculate financial metrics
  let totalRevenue = 0
  let totalExpenses = 0
  let totalTax = 0
  const revenueByType: { [key: string]: number } = {}
  const paymentMethods: { [key: string]: number } = {}

  transactions?.forEach(txn => {
    if (['appointment', 'sale', 'payment'].includes(txn.transaction_type)) {
      totalRevenue += txn.total_amount || 0
      revenueByType[txn.transaction_type] =
        (revenueByType[txn.transaction_type] || 0) + (txn.total_amount || 0)

      // Track payment methods
      const method = (txn.metadata as any)?.payment_method || 'cash'
      paymentMethods[method] = (paymentMethods[method] || 0) + (txn.total_amount || 0)

      // Calculate tax (5% UAE VAT)
      totalTax += (txn.total_amount || 0) * 0.05
    } else if (['expense', 'purchase'].includes(txn.transaction_type)) {
      totalExpenses += txn.total_amount || 0
    }
  })

  const netProfit = totalRevenue - totalExpenses - totalTax
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    financial_summary: {
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      total_tax: totalTax,
      net_profit: netProfit,
      profit_margin: profitMargin
    },
    revenue_breakdown: revenueByType,
    payment_methods: paymentMethods,
    daily_cash_flow: [], // Would calculate daily cash flow
    expense_categories: {} // Would categorize expenses
  }
}

async function getAllReportsSummary(organizationId: string, startDate: string, endDate: string) {
  // Get key metrics from each report
  const [revenue, services, staff, clients, inventory, financial] = await Promise.all([
    getRevenueReport(organizationId, startDate, endDate),
    getServicePerformanceReport(organizationId, startDate, endDate),
    getStaffPerformanceReport(organizationId, startDate, endDate),
    getClientAnalyticsReport(organizationId, startDate, endDate),
    getInventoryReport(organizationId),
    getFinancialSummaryReport(organizationId, startDate, endDate)
  ])

  return {
    summary: {
      revenue: revenue.summary,
      services: services.summary,
      staff: staff.summary,
      clients: clients.analytics,
      inventory: inventory.inventory,
      financial: financial.financial_summary
    }
  }
}

// POST: Generate custom report
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { organizationId, reportConfig } = body

  if (!organizationId || !reportConfig) {
    return NextResponse.json(
      { success: false, error: 'Organization ID and report configuration are required' },
      { status: 400 }
    )
  }

  try {
    // This would handle custom report generation based on user configuration
    // For now, return a success message
    return NextResponse.json({
      success: true,
      message: 'Custom report generation not yet implemented'
    })
  } catch (error) {
    console.error('Error generating custom report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate custom report' },
      { status: 500 }
    )
  }
})
