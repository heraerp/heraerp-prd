'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDemoOrg } from '@/components/providers/DemoOrgProvider'
import { supabaseClient } from '@/lib/supabase-client'
// TODO: Re-enable once React 18 onboarding is ready
// import { useOnboarding } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { 
  Factory, 
  Package, 
  TrendingUp, 
  Users,
  Activity,
  Snowflake,
  AlertCircle,
  CheckCircle,
  Clock,
  TruckIcon,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardData {
  totalProducts: number
  activeProduction: number
  pendingQC: number
  totalOutlets: number
  recentTransactions: any[]
  inventoryLevels: any[]
  productionEfficiency: number
}

export default function IceCreamDashboard() {
  const { organizationId, organizationName, loading: orgLoading } = useDemoOrg()
  // TODO: Re-enable once React 18 onboarding is ready
  // const { startTour, isActive } = useOnboarding()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0,
    activeProduction: 0,
    pendingQC: 0,
    totalOutlets: 0,
    recentTransactions: [],
    inventoryLevels: [],
    productionEfficiency: 0
  })

  // TODO: Re-enable once React 18 onboarding is ready
  // // Auto-start tour for first-time users
  // useEffect(() => {
  //   const hasSeenTour = localStorage.getItem('hera_onboarding_HERA.UI.ONBOARD.ICECREAM.DASHBOARD.v1_completed')
    
  //   if (!hasSeenTour && !isActive && !loading && !orgLoading) {
  //     // Start tour after a short delay
  //     setTimeout(() => {
  //       startTour('HERA.UI.ONBOARD.ICECREAM.DASHBOARD.v1', { auto: true })
  //     }, 1500)
  //   }
  // }, [loading, orgLoading, isActive, startTour])

  useEffect(() => {
    if (organizationId && !orgLoading) {
      fetchDashboardData()
    }
  }, [organizationId, orgLoading])

  async function fetchDashboardData() {
    if (!organizationId) return
    
    console.log('Fetching dashboard data for org:', organizationId)
    
    try {
      // Test query to check if we can access any data
      const { data: testOrgs, error: testError } = await supabaseClient
        .from('core_organizations')
        .select('id, organization_name')
        .limit(1)
      
      console.log('Test query - Organizations accessible:', !!testOrgs, testError || 'No error')
      
      // Check if this specific organization exists
      const { data: thisOrg, error: thisOrgError } = await supabaseClient
        .from('core_organizations')
        .select('*')
        .eq('id', organizationId)
        .single()
      
      console.log('This organization exists:', !!thisOrg, thisOrgError || 'No error')
      
      // Fetch products
      const { data: products, error: productsError } = await supabaseClient
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'product')
      
      if (productsError) {
        console.error('Error fetching products:', productsError)
      }
      console.log('Products fetched:', products?.length || 0, products)

      // Fetch outlets
      const { data: outlets, error: outletsError } = await supabaseClient
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'location')
        .like('entity_code', 'OUTLET%')
      
      if (outletsError) {
        console.error('Error fetching outlets:', outletsError)
      }
      console.log('Outlets fetched:', outlets?.length || 0, outlets)

      // Fetch recent transactions
      const { data: transactions, error: transactionsError } = await supabaseClient
        .from('universal_transactions')
        .select(`
          *,
          universal_transaction_lines (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
      }
      console.log('Transactions fetched:', transactions?.length || 0, transactions)

      // Calculate production metrics
      const productionTxns = transactions?.filter(t => t.transaction_type === 'production_batch') || []
      const qcTxns = transactions?.filter(t => t.transaction_type === 'quality_check') || []
      
      // Calculate efficiency from production transactions
      let totalEfficiency = 0
      productionTxns.forEach(txn => {
        if (txn.metadata?.yield_variance_percent) {
          totalEfficiency += (100 + parseFloat(txn.metadata.yield_variance_percent))
        }
      })
      const avgEfficiency = productionTxns.length > 0 ? totalEfficiency / productionTxns.length : 97.93

      // Debug logging
      console.log('Dashboard data:', {
        products: products?.length,
        outlets: outlets?.length,
        transactions: transactions?.length,
        productionTxns: productionTxns.length
      })

      setData({
        totalProducts: products?.length || 0,
        activeProduction: productionTxns.filter(t => t.transaction_status === 'in_progress').length,
        pendingQC: productionTxns.filter(t => !qcTxns.find(q => q.reference_number === t.transaction_code)).length,
        totalOutlets: outlets?.length || 0,
        recentTransactions: transactions || [],
        inventoryLevels: [],
        productionEfficiency: avgEfficiency
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: 'Total Products',
      value: data.totalProducts,
      icon: Package,
      change: data.totalProducts > 0 ? '+2 this week' : 'No products yet',
      gradient: 'from-pink-500 to-purple-500'
    },
    {
      title: 'Active Production',
      value: data.activeProduction,
      icon: Factory,
      change: data.activeProduction > 0 ? 'Running' : 'No active batches',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Pending QC',
      value: data.pendingQC,
      icon: AlertCircle,
      change: data.pendingQC > 0 ? 'Awaiting' : 'All tested',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Retail Outlets',
      value: data.totalOutlets,
      icon: Users,
      change: data.totalOutlets > 0 ? 'Active' : 'No outlets',
      gradient: 'from-green-500 to-emerald-500'
    }
  ]

  // Show loading state while org is being resolved
  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-gray-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading demo organization...</p>
        </div>
      </div>
    )
  }

  // Show error if no org found
  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">No organization found for this demo route</p>
          <p className="text-gray-400 text-sm">Please check the demo configuration</p>
        </div>
      </div>
    )
  }

  // Function to set up demo data
  const setupDemoData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/setup-demo/icecream', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        alert('Demo data created successfully! Refreshing page...')
        window.location.reload()
      } else {
        alert('Error creating demo data: ' + result.error)
      }
    } catch (error) {
      alert('Failed to create demo data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Check if there's no data
  const hasNoData = !loading && data.totalProducts === 0 && data.totalOutlets === 0 && data.recentTransactions.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div data-testid="ice-cream-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Ice Cream Manufacturing Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time overview of your ice cream production and operations
            </p>
            {/* Organization Info */}
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 inline-block">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-500">Demo Organization:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{organizationName || 'Loading...'}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Organization ID: {organizationId}
              </p>
            </div>
          </div>
          
          {/* Help Button - TODO: Re-enable once React 18 onboarding is ready */}
          {/* <Button
            onClick={() => startTour('HERA.UI.ONBOARD.ICECREAM.DASHBOARD.v1')}
            variant="outline"
            size="sm"
            disabled={isActive}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {isActive ? 'Tour Running...' : 'Start Tour'}
          </Button> */}
        </div>
      </div>

      {/* Show setup button if no data */}
      {hasNoData && (
        <Card className="backdrop-blur-xl bg-yellow-50/95 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">No Demo Data Found</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Click the button to create sample ice cream products, outlets, and transactions.
                </p>
              </div>
              <Button
                onClick={setupDemoData}
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                {loading ? 'Creating...' : 'Setup Demo Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-stats">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={cn(
                  "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm",
                  stat.gradient
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : (
                <div>
                  <div className="text-4xl font-black tracking-tight">
                    <span className={stat.value === 0 ? "text-gray-400 dark:text-gray-500" : "!text-gray-900 dark:!text-gray-100"}>
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                    {stat.change}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production Efficiency */}
      <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50 shadow-lg" data-testid="production-status">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-white">Production Efficiency</CardTitle>
            <Activity className="w-5 h-5 text-gray-400 dark:text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Efficiency</span>
              <span className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">
                {data.productionEfficiency.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${data.productionEfficiency}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50 shadow-lg" data-testid="inventory-levels">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentTransactions.slice(0, 5).map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(txn.transaction_type)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{txn.transaction_code}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {txn.transaction_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {txn.total_amount ? `₹${txn.total_amount.toFixed(2)}` : '-'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(txn.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Start Production</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create new batch</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <TruckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Schedule Delivery</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transfer to outlets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Quality Check</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Test products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'production_batch':
      return <Factory className="w-5 h-5 text-blue-500" />
    case 'quality_check':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'inventory_transfer':
      return <TruckIcon className="w-5 h-5 text-purple-500" />
    case 'pos_sale':
      return <Package className="w-5 h-5 text-pink-500" />
    default:
      return <Activity className="w-5 h-5 text-gray-500" />
  }
}