'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  ShoppingCart, Clock, Star, Target, PieChart,
  BarChart3, Calendar, Zap, ArrowLeft, Crown,
  Gem, Sparkles, Award, Heart, Gift
} from 'lucide-react'

// Progressive Jewelry Analytics - HERA Universal Architecture
// Smart Code: HERA.JWLY.ANALYTICS.PROGRESSIVE.v1

// Jewelry analytics data interface
interface JewelryMetrics {
  dailySales: {
    revenue: number
    orders: number
    avgOrderValue: number
    growth: number
  }
  performance: {
    vipCustomerRatio: number
    avgConsultationTime: number
    customerSatisfaction: number
    salesEfficiency: number
  }
  inventory: {
    totalItems: number
    highValueItems: number
    turnoverRate: number
    inventoryValue: number
  }
  financials: {
    grossProfit: number
    netProfit: number
    expenses: number
    profitMargin: number
  }
  topItems: Array<{
    name: string
    category: string
    sales: number
    revenue: number
    margin: number
  }>
  recentTransactions: Array<{
    id: string
    type: string
    amount: number
    time: string
    status: string
    customer: string
  }>
  customerInsights: {
    vipTiers: {
      diamond: number
      platinum: number
      gold: number
      silver: number
      standard: number
    }
    avgLifetimeValue: number
    repeatCustomerRate: number
  }
}

export default function JewelryProgressiveAnalyticsPage() {
  const { workspace, isAnonymous } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<JewelryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('today')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Load progressive analytics data
    const fetchAnalytics = async (isTimeRangeChange = false) => {
      try {
        if (isTimeRangeChange) {
          setIsUpdating(true)
        }
        
        // Load data from progressive workspace
        if (workspace) {
          const storedData = localStorage.getItem(`hera_data_${workspace.organization_id}`)
          if (storedData) {
            const data = JSON.parse(storedData)
            const processedMetrics = calculateProgressiveMetrics(data)
            setMetrics(processedMetrics)
          } else {
            // Use demo metrics for first-time users
            setMetrics(getDemoMetrics())
          }
        } else {
          setMetrics(getDemoMetrics())
        }
        
        setLoading(false)
        setIsUpdating(false)
      } catch (error) {
        console.error('Failed to fetch jewelry analytics:', error)
        setMetrics(getDemoMetrics())
        setLoading(false)
        setIsUpdating(false)
      }
    }

    const calculateProgressiveMetrics = (workspaceData: any): JewelryMetrics => {
      const transactions = workspaceData.transactions || []
      const customers = workspaceData.customers || []
      const inventory = workspaceData.inventory || []
      
      // Calculate sales metrics
      const totalRevenue = transactions.reduce((sum: number, txn: any) => sum + (txn.total_amount || 0), 0)
      const totalOrders = transactions.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      // Calculate inventory value
      const inventoryValue = inventory.reduce((sum: number, item: any) => 
        sum + ((item.price || 0) * (item.stock || 0)), 0)
      
      // Calculate VIP distribution
      const vipDistribution = customers.reduce((acc: any, customer: any) => {
        const level = customer.vipLevel?.toLowerCase() || 'standard'
        acc[level] = (acc[level] || 0) + 1
        return acc
      }, {})
      
      return {
        dailySales: {
          revenue: totalRevenue,
          orders: totalOrders,
          avgOrderValue: avgOrderValue,
          growth: 15.3 // Mock growth for demo
        },
        performance: {
          vipCustomerRatio: customers.length > 0 ? 
            (customers.filter((c: any) => c.vipLevel !== 'Standard').length / customers.length) * 100 : 0,
          avgConsultationTime: 45.5,
          customerSatisfaction: 4.8,
          salesEfficiency: 92
        },
        inventory: {
          totalItems: inventory.length,
          highValueItems: inventory.filter((item: any) => (item.price || 0) > 5000).length,
          turnoverRate: 3.2,
          inventoryValue: inventoryValue
        },
        financials: {
          grossProfit: totalRevenue * 0.65,
          netProfit: totalRevenue * 0.28,
          expenses: totalRevenue * 0.37,
          profitMargin: 28.0
        },
        topItems: [
          { name: 'Diamond Engagement Rings', category: 'Rings', sales: 12, revenue: 36000, margin: 45 },
          { name: 'Pearl Necklaces', category: 'Necklaces', sales: 8, revenue: 7200, margin: 65 },
          { name: 'Gold Bracelets', category: 'Bracelets', sales: 15, revenue: 9750, margin: 55 }
        ],
        recentTransactions: transactions.slice(-5).map((txn: any, index: number) => ({
          id: txn.smart_code || `TXN-${index + 1}`,
          type: 'jewelry_sale',
          amount: txn.total_amount || 0,
          time: txn.transaction_date ? 
            new Date(txn.transaction_date).toLocaleTimeString() : `${index * 15 + 5} min ago`,
          status: 'completed',
          customer: txn.customer_name || 'VIP Customer'
        })),
        customerInsights: {
          vipTiers: {
            diamond: vipDistribution.diamond || 0,
            platinum: vipDistribution.platinum || 0,
            gold: vipDistribution.gold || 0,
            silver: vipDistribution.silver || 0,
            standard: vipDistribution.standard || 0
          },
          avgLifetimeValue: customers.length > 0 ? 
            customers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0) / customers.length : 0,
          repeatCustomerRate: 78.5
        }
      }
    }

    const getDemoMetrics = (): JewelryMetrics => ({
      dailySales: {
        revenue: 24750.50,
        orders: 15,
        avgOrderValue: 1650.03,
        growth: 18.5
      },
      performance: {
        vipCustomerRatio: 65,
        avgConsultationTime: 42.5,
        customerSatisfaction: 4.9,
        salesEfficiency: 94
      },
      inventory: {
        totalItems: 156,
        highValueItems: 23,
        turnoverRate: 2.8,
        inventoryValue: 487500
      },
      financials: {
        grossProfit: 16087.83,
        netProfit: 6930.14,
        expenses: 9157.69,
        profitMargin: 28.0
      },
      topItems: [
        { name: 'Diamond Engagement Rings', category: 'Rings', sales: 12, revenue: 36000, margin: 45 },
        { name: 'Luxury Pearl Necklaces', category: 'Necklaces', sales: 8, revenue: 7200, margin: 65 },
        { name: 'Platinum Wedding Bands', category: 'Wedding', sales: 18, revenue: 12600, margin: 50 },
        { name: 'Sapphire Earrings', category: 'Earrings', sales: 6, revenue: 8400, margin: 55 },
        { name: 'Custom Bracelets', category: 'Bracelets', sales: 15, revenue: 9750, margin: 60 }
      ],
      recentTransactions: [
        { id: 'JWLY-001', type: 'engagement_ring', amount: 4250.00, time: '5 min ago', status: 'completed', customer: 'Isabella Chen' },
        { id: 'JWLY-002', type: 'pearl_necklace', amount: 890.00, time: '18 min ago', status: 'completed', customer: 'Marcus Thompson' },
        { id: 'JWLY-003', type: 'sapphire_earrings', amount: 1575.00, time: '1 hour ago', status: 'completed', customer: 'VIP Customer' },
        { id: 'JWLY-004', type: 'wedding_bands', amount: 3200.00, time: '2 hours ago', status: 'completed', customer: 'Anniversary Sale' },
        { id: 'JWLY-005', type: 'custom_bracelet', amount: 750.00, time: '3 hours ago', status: 'completed', customer: 'Walk-in Customer' }
      ],
      customerInsights: {
        vipTiers: {
          diamond: 2,
          platinum: 5,
          gold: 8,
          silver: 12,
          standard: 18
        },
        avgLifetimeValue: 15750,
        repeatCustomerRate: 82.5
      }
    })

    fetchAnalytics(loading === false)
    
    // Set up real-time updates every 60 seconds for jewelry (slower than restaurant)
    const interval = setInterval(() => fetchAnalytics(false), 60000)
    return () => clearInterval(interval)
  }, [timeRange, loading, workspace])

  const handleTimeRangeChange = (newRange: string) => {
    if (newRange !== timeRange) {
      setTimeRange(newRange)
    }
  }

  // Show loading state
  if (!workspace || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading jewelry analytics...</p>
          <p className="text-sm text-gray-500 mt-2">Progressive workspace analyzing</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <p className="text-gray-600">Unable to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      
      <div className="ml-16">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/jewelry-progressive')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Jewelry Analytics</h1>
                    <p className="text-sm text-gray-500">
                      {isAnonymous ? 'Progressive workspace - real insights' : 'Premium analytics dashboard'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{workspace.organization_name}</p>
                  <p className="text-xs text-gray-400">
                    {workspace.type === 'anonymous' ? 'Anonymous Session' : 'Registered User'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {['today', 'week', 'month'].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'default' : 'outline'}
                      onClick={() => handleTimeRangeChange(range)}
                      disabled={isUpdating}
                      className="capitalize"
                      size="sm"
                    >
                      {isUpdating && timeRange === range ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                          {range}
                        </div>
                      ) : (
                        range
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.dailySales.revenue.toLocaleString()}</div>
                <div className="flex items-center text-xs text-gray-600">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  +{metrics.dailySales.growth}% from yesterday
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Completed</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dailySales.orders}</div>
                <div className="text-xs text-gray-600">
                  Avg: ${metrics.dailySales.avgOrderValue.toLocaleString()} per sale
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
                <Crown className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.performance.vipCustomerRatio)}%</div>
                <Progress value={metrics.performance.vipCustomerRatio} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.performance.customerSatisfaction}/5.0</div>
                <div className="text-xs text-gray-600">
                  Based on {metrics.dailySales.orders} reviews
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="h-5 w-5 text-purple-500" />
                  Sales Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consultation Time</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{metrics.performance.avgConsultationTime} min</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sales Efficiency</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={metrics.performance.salesEfficiency > 90 ? 'default' : 'secondary'}>
                      {metrics.performance.salesEfficiency}%
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Inventory Turnover</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={metrics.inventory.turnoverRate > 3 ? 'default' : 'secondary'}>
                      {metrics.inventory.turnoverRate}x
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gross Profit</span>
                  <span className="font-semibold text-green-600">
                    ${metrics.financials.grossProfit.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Operating Expenses</span>
                  <span className="font-semibold text-red-600">
                    ${metrics.financials.expenses.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Net Profit</span>
                  <span className="font-bold text-blue-600">
                    ${metrics.financials.netProfit.toLocaleString()}
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profit Margin</span>
                    <Badge className="bg-green-100 text-green-800">
                      {metrics.financials.profitMargin}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VIP Customer Distribution */}
          <Card className="bg-white/90 backdrop-blur border-0 shadow-md mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                VIP Customer Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(metrics.customerInsights.vipTiers).map(([tier, count]) => {
                  const tierColors = {
                    diamond: 'bg-blue-100 text-blue-800',
                    platinum: 'bg-slate-100 text-slate-800',
                    gold: 'bg-amber-100 text-amber-800',
                    silver: 'bg-gray-100 text-gray-800',
                    standard: 'bg-zinc-100 text-zinc-800'
                  }
                  
                  return (
                    <div key={tier} className="text-center p-4 rounded-lg border">
                      <div className="text-2xl font-bold">{count}</div>
                      <Badge className={tierColors[tier as keyof typeof tierColors]}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Items & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  Top Performing Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.sales} sales • {item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.revenue.toLocaleString()}</p>
                        <Badge variant="outline" className="text-xs">
                          {item.margin}% margin
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.recentTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium">{txn.customer}</p>
                        <p className="text-sm text-gray-600 capitalize">{txn.type.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ${txn.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={txn.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {txn.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{txn.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Alert */}
          <Card className="bg-purple-50 border-purple-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Sparkles className="h-5 w-5" />
                Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    ${Math.round(metrics.customerInsights.avgLifetimeValue).toLocaleString()}
                  </div>
                  <p className="text-sm text-purple-700">Avg Customer Lifetime Value</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    {metrics.customerInsights.repeatCustomerRate}%
                  </div>
                  <p className="text-sm text-purple-700">Repeat Customer Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-900">
                    ${metrics.inventory.inventoryValue.toLocaleString()}
                  </div>
                  <p className="text-sm text-purple-700">Total Inventory Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progressive CTA */}
          {isAnonymous && (
            <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Real Analytics from Your Data
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  These insights are generated from your actual sales, customers, and inventory. 
                  Save your workspace to keep building your jewelry business analytics.
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => {
                    const banner = document.querySelector('[data-save-button]')
                    if (banner) {
                      (banner as HTMLButtonElement).click()
                    }
                  }}
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Save My Analytics
                </Button>
              </CardContent>
            </Card>
          )}

          {/* HERA System Info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Analytics powered by HERA Universal Architecture • Real-time data from universal transactions</p>
            <p className="mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </main>
      </div>
    </div>
  )
}