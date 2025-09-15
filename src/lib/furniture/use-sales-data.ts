'use client'

import { useState, useEffect, useCallback } from 'react'

interface SalesStats {
  activeOrders: number
  pendingQuotes: number
  readyToDispatch: number
  monthlyRevenue: number
  todayOrders: number
  todayRevenue: number
  weeklyGrowth: number
  topCustomer: string
}

interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  orderDate: string
  amount: number
  status: string
  items: number
  deliveryDate: string
}

interface TopProduct {
  id: string
  name: string
  category: string
  soldUnits: number
  revenue: number
  growth: number
}

interface SalesData {
  stats: SalesStats
  recentOrders: RecentOrder[]
  topProducts: TopProduct[]
  salesTrend: any[]
  loading: boolean
  error: string | null
}

// Cache to store data between component remounts
const dataCache = new Map<string, { data: SalesData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useSalesData(organizationId: string) {
  const [data, setData] = useState<SalesData>({
    stats: {
      activeOrders: 0,
      pendingQuotes: 0,
      readyToDispatch: 0,
      monthlyRevenue: 0,
      todayOrders: 0,
      todayRevenue: 0,
      weeklyGrowth: 0,
      topCustomer: '-'
    },
    recentOrders: [],
    topProducts: [],
    salesTrend: [],
    loading: true,
    error: null
  })

  const loadSalesData = useCallback(async () => {
    // Check cache first
    const cacheKey = `sales-${organizationId}`
    const cached = dataCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data)
      return
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Use the sales API endpoint that bypasses RLS
      const response = await fetch(`/api/furniture/sales?organizationId=${organizationId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch sales data')
      }

      const { transactions, entities, lines: allLines } = await response.json()

      console.log('Sales data loaded:', {
        transactions: transactions.length,
        entities: entities.length,
        lines: allLines.length
      })

      // Process data
      const salesOrders = transactions.filter((t: any) => {
        // Include sales_order and sales_invoice transaction types
        if (!['sales_order', 'sales_invoice', 'sale'].includes(t.transaction_type)) return false

        // If there's a smart code, check if it's related to sales
        if (t.smart_code) {
          return (
            t.smart_code.includes('SALES') ||
            t.smart_code.includes('FURNITURE') ||
            t.smart_code.includes('UNIV')
          )
        }

        // If no smart code, include it anyway if it's a sales transaction
        return true
      })

      console.log('Filtered sales orders:', salesOrders.length)

      const proformaInvoices = transactions.filter(
        (t: any) =>
          t.transaction_type === 'proforma_invoice' ||
          t.transaction_type === 'quote' ||
          (t.transaction_type === 'sales_order' && t.metadata?.status === 'draft')
      )

      // Calculate statistics
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const stats = calculateStats(
        salesOrders,
        proformaInvoices,
        entities,
        startOfMonth,
        startOfDay,
        startOfWeek
      )

      // Get recent orders with customer names
      const customerEntities = entities.filter((e: any) => e.entity_type === 'customer')
      const recentOrdersData = await processRecentOrders(
        salesOrders.slice(0, 10),
        customerEntities,
        allLines
      )

      // Calculate top products
      const productEntities = entities.filter((e: any) => e.entity_type === 'product')
      const topProductsData = calculateTopProducts(salesOrders, allLines, productEntities)

      // Generate sales trend
      const salesTrend = generateSalesTrend(salesOrders)

      const newData: SalesData = {
        stats,
        recentOrders: recentOrdersData,
        topProducts: topProductsData,
        salesTrend,
        loading: false,
        error: null
      }

      // Update cache
      dataCache.set(cacheKey, { data: newData, timestamp: Date.now() })
      setData(newData)
    } catch (error) {
      console.error('Failed to load sales data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }, [organizationId])

  useEffect(() => {
    if (organizationId) {
      loadSalesData()
    }
  }, [organizationId, loadSalesData])

  const refresh = useCallback(() => {
    // Clear cache and reload
    const cacheKey = `sales-${organizationId}`
    dataCache.delete(cacheKey)
    loadSalesData()
  }, [organizationId, loadSalesData])

  return { ...data, refresh }
}

// Helper functions
function calculateStats(
  salesOrders: any[],
  proformaInvoices: any[],
  entities: any[],
  startOfMonth: Date,
  startOfDay: Date,
  startOfWeek: Date
): SalesStats {
  const activeOrders = salesOrders.filter((o: any) => {
    const status = (o.metadata as any)?.status || 'pending_approval'
    if (o.transaction_type === 'sales_invoice') {
      return ['unpaid', 'pending', 'overdue'].includes(status)
    }
    return ['pending_approval', 'confirmed', 'in_production'].includes(status)
  }).length

  const pendingQuotes = proformaInvoices.filter((p: any) => {
    const status = (p.metadata as any)?.status || 'pending'
    return status === 'pending'
  }).length

  const readyToDispatch = salesOrders.filter((o: any) => {
    const status = (o.metadata as any)?.status || ''
    if (o.transaction_type === 'sales_invoice') {
      return status === 'paid'
    }
    return status === 'ready_for_delivery'
  }).length

  const monthlyOrders = salesOrders.filter((o: any) => new Date(o.transaction_date) >= startOfMonth)
  const monthlyRevenue = monthlyOrders.reduce(
    (sum: number, o: any) => sum + (o.total_amount || 0),
    0
  )

  const todayOrders = salesOrders.filter((o: any) => new Date(o.transaction_date) >= startOfDay)
  const todayOrdersCount = todayOrders.length
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)

  // Calculate weekly growth
  const thisWeekOrders = salesOrders.filter((o: any) => new Date(o.transaction_date) >= startOfWeek)
  const thisWeekRevenue = thisWeekOrders.reduce(
    (sum: number, o: any) => sum + (o.total_amount || 0),
    0
  )

  const lastWeekStart = new Date(startOfWeek)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekOrders = salesOrders.filter(
    (o: any) =>
      new Date(o.transaction_date) >= lastWeekStart && new Date(o.transaction_date) < startOfWeek
  )
  const lastWeekRevenue = lastWeekOrders.reduce(
    (sum: number, o: any) => sum + (o.total_amount || 0),
    0
  )

  const weeklyGrowth =
    lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0

  // Get top customer
  const customerOrders: { [key: string]: { name: string; revenue: number } } = {}
  const customerEntities = entities.filter((e: any) => e.entity_type === 'customer')

  for (const order of salesOrders) {
    if (order.source_entity_id || order.target_entity_id) {
      const customerId = order.source_entity_id || order.target_entity_id
      const customer = customerEntities.find((c: any) => c.id === customerId)

      if (customer) {
        if (!customerOrders[customer.id]) {
          customerOrders[customer.id] = { name: customer.entity_name, revenue: 0 }
        }
        customerOrders[customer.id].revenue += order.total_amount || 0
      }
    }
  }

  const topCustomerId = Object.entries(customerOrders).sort(
    ([, a], [, b]) => b.revenue - a.revenue
  )[0]
  const topCustomer = topCustomerId ? topCustomerId[1].name : '-'

  return {
    activeOrders,
    pendingQuotes,
    readyToDispatch,
    monthlyRevenue,
    todayOrders: todayOrdersCount,
    todayRevenue,
    weeklyGrowth,
    topCustomer
  }
}

async function processRecentOrders(
  orders: any[],
  customerEntities: any[],
  allLines: any[]
): Promise<RecentOrder[]> {
  return orders.map((order: any) => {
    let customerName = 'Walk-in Customer'
    const customerId = order.source_entity_id || order.target_entity_id
    if (customerId) {
      const customer = customerEntities.find((c: any) => c.id === customerId)
      if (customer) {
        customerName = customer.entity_name
      }
    }

    const orderLines = allLines.filter((line: any) => line.transaction_id === order.id)
    const deliveryDateStr =
      (order.metadata as any)?.delivery_date ||
      new Date(new Date(order.transaction_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    return {
      id: order.id,
      orderNumber: order.transaction_code || `ORD-${order.id.slice(0, 8)}`,
      customerName,
      orderDate: new Date(order.transaction_date).toLocaleDateString('en-IN'),
      amount: order.total_amount || 0,
      status: (order.metadata as any)?.status || 'pending_approval',
      items: orderLines.length,
      deliveryDate: new Date(deliveryDateStr).toLocaleDateString('en-IN')
    }
  })
}

function calculateTopProducts(
  salesOrders: any[],
  allLines: any[],
  productEntities: any[]
): TopProduct[] {
  const productSales: {
    [key: string]: { name: string; category: string; units: number; revenue: number }
  } = {}

  for (const order of salesOrders) {
    const orderLines = allLines.filter((line: any) => line.transaction_id === order.id)

    for (const line of orderLines) {
      if (line.entity_id) {
        const product = productEntities.find((p: any) => p.id === line.entity_id)

        if (product) {
          if (!productSales[product.id]) {
            productSales[product.id] = {
              name: product.entity_name,
              category: (product.metadata as any)?.category || 'General',
              units: 0,
              revenue: 0
            }
          }
          productSales[product.id].units += parseFloat(line.quantity || '1')
          productSales[product.id].revenue += line.line_amount || 0
        }
      }
    }
  }

  return Object.entries(productSales)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(([id, data]) => ({
      id,
      name: data.name,
      category: data.category,
      soldUnits: data.units,
      revenue: data.revenue,
      growth: Math.random() * 40 - 10 // Simulated growth
    }))
}

function generateSalesTrend(salesOrders: any[]) {
  const trendData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayOrders = salesOrders.filter((o: any) => {
      const orderDate = new Date(o.transaction_date)
      return orderDate.toDateString() === date.toDateString()
    })
    const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
    trendData.push({
      date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue: dayRevenue,
      orders: dayOrders.length
    })
  }
  return trendData
}
