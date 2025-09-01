'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDemoOrg } from '@/components/providers/DemoOrgProvider'
// import { createClient } from '@supabase/supabase-js'
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
  HelpCircle,
  RefreshCw
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
      console.log('Organization ready, fetching data for:', organizationId)
      fetchDashboardData()
    } else {
      console.log('Waiting for organization:', { organizationId, orgLoading })
    }
  }, [organizationId, orgLoading])

  async function fetchDashboardData() {
    if (!organizationId) return
    
    console.log('Fetching dashboard data via API for org:', organizationId)
    
    try {
      const response = await fetch(`/api/icecream/dashboard?org_id=${organizationId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const dashboardData = await response.json()
      
      console.log('Dashboard data from API:', dashboardData)
      
      setData(dashboardData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
                <span className="text-gray-500 dark:text-gray-500">Organization:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{organizationName || 'Loading...'}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Organization ID: {organizationId}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              onClick={() => window.location.href = '/refresh'}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              title="Force refresh to get latest version"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
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
      </div>


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
            {data.recentTransactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent transactions
              </p>
            ) : (
              data.recentTransactions.slice(0, 5).map((txn) => (
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
            )))}
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