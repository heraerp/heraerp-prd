'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Activity,
  PieChart,
  LineChart,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

// Kochi Ice Cream Org ID (fallback)
const DEFAULT_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

interface AnalyticsData {
  totalRevenue: number
  totalCost: number
  grossMargin: number
  salesCount: number
  productionVolume: number
  topProducts: any[]
  monthlySales: any[]
  categoryBreakdown: any[]
}

export default function AnalyticsPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalCost: 0,
    grossMargin: 0,
    salesCount: 0,
    productionVolume: 0,
    topProducts: [],
    monthlySales: [],
    categoryBreakdown: []
  })
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  async function fetchAnalyticsData() {
    try {
      // Set organization context
      universalApi.setOrganizationId(organizationId)
      
      // Fetch all transactions
      const allTransactions = await universalApi.getTransactions()
      
      // Filter sales transactions
      const sales = allTransactions.filter(t => 
        t.transaction_type === 'pos_sale' && t.organization_id === organizationId
      )
      
      // Filter production data
      const production = allTransactions.filter(t => 
        t.transaction_type === 'production_batch' && t.organization_id === organizationId
      )

      // Calculate analytics
      let totalRevenue = 0
      let totalCost = 0
      let salesCount = sales?.length || 0
      let productionVolume = 0

      // Revenue and product analysis
      const productSales = new Map<string, { name: string, quantity: number, revenue: number }>()
      
      sales?.forEach(sale => {
        totalRevenue += sale.total_amount || 0
        
        // Note: Transaction lines would need to be fetched separately if needed
        // For now, we'll use metadata from the transaction
        if (sale.metadata?.items) {
          sale.metadata.items.forEach((line: any) => {
            const productName = line.metadata?.product_name || 'Unknown'
            const existing = productSales.get(productName) || { name: productName, quantity: 0, revenue: 0 }
            existing.quantity += Math.abs(line.quantity)
            existing.revenue += line.line_amount || 0
            productSales.set(productName, existing)
          })
        }
      })

      // Production costs and volume
      production?.forEach(batch => {
        totalCost += batch.metadata?.material_cost || batch.total_amount || 0
        productionVolume += batch.metadata?.actual_output || 0
      })

      // Top products
      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate gross margin
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0

      // Monthly sales (mock data for demo)
      const monthlySales = [
        { month: 'Jan', sales: 45000 },
        { month: 'Feb', sales: 52000 },
        { month: 'Mar', sales: 61000 },
        { month: 'Apr', sales: 58000 },
        { month: 'May', sales: 67000 },
        { month: 'Jun', sales: 72000 }
      ]

      // Category breakdown
      const categoryBreakdown = [
        { category: 'Tubs', value: 45, color: 'from-pink-400 to-rose-400' },
        { category: 'Cups', value: 30, color: 'from-cyan-400 to-blue-400' },
        { category: 'Cones', value: 15, color: 'from-yellow-400 to-orange-400' },
        { category: 'Family Packs', value: 10, color: 'from-green-400 to-emerald-400' }
      ]

      setData({
        totalRevenue,
        totalCost,
        grossMargin,
        salesCount,
        productionVolume,
        topProducts,
        monthlySales,
        categoryBreakdown
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Business Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all",
                timeRange === range
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">₹{data.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% from last period
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gross Margin</p>
                <p className="text-2xl font-bold mt-1">{data.grossMargin.toFixed(1)}%</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.3% improvement
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Orders Processed</p>
                <p className="text-2xl font-bold mt-1">{data.salesCount}</p>
                <p className="text-xs text-gray-600 mt-1">This {timeRange}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Production Volume</p>
                <p className="text-2xl font-bold mt-1">{data.productionVolume} units</p>
                <p className="text-xs text-gray-600 mt-1">
                  Across all batches
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sales Trend</CardTitle>
              <LineChart className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {data.monthlySales.map((month, idx) => {
                const height = (month.sales / 80000) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${height}%` }}
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{month.month}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sales by Category</CardTitle>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryBreakdown.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{category.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={cn("h-3 rounded-full bg-gradient-to-r transition-all duration-500", category.color)}
                      style={{ width: `${category.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Selling Products</CardTitle>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading analytics...</div>
              </div>
            ) : data.topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sales data available yet
              </div>
            ) : (
              data.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{product.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {((product.revenue / data.totalRevenue) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}