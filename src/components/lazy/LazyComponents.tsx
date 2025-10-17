/**
 * Lazy Loading Components for Performance Optimization
 * Based on successful furniture page patterns
 */

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
)

// Fast loading skeleton for immediate display
const FastSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-100 h-32 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-gray-100 h-64 rounded-lg" />
      ))}
    </div>
  </div>
)

// Lazy-loaded dashboard components
export const LazyHeroMetrics = dynamic(() => 
  import('@/components/salon/dashboard/HeroMetrics').then(mod => ({ default: mod.HeroMetrics })), {
  loading: () => <LoadingFallback message="Loading metrics..." />,
  ssr: false
})

export const LazyAppointmentAnalytics = dynamic(() => 
  import('@/components/salon/dashboard/AppointmentAnalytics').then(mod => ({ default: mod.AppointmentAnalytics })), {
  loading: () => <LoadingFallback message="Loading appointments..." />,
  ssr: false
})

export const LazyRevenueTrends = dynamic(() => 
  import('@/components/salon/dashboard/RevenueTrends').then(mod => ({ default: mod.RevenueTrends })), {
  loading: () => <LoadingFallback message="Loading revenue data..." />,
  ssr: false
})

export const LazyStaffPerformance = dynamic(() => 
  import('@/components/salon/dashboard/StaffPerformance').then(mod => ({ default: mod.StaffPerformance })), {
  loading: () => <LoadingFallback message="Loading staff data..." />,
  ssr: false
})

export const LazyCustomerAndServiceInsights = dynamic(() => 
  import('@/components/salon/dashboard/CustomerAndServiceInsights').then(mod => ({ default: mod.CustomerAndServiceInsights })), {
  loading: () => <LoadingFallback message="Loading customer insights..." />,
  ssr: false
})

export const LazyFinancialOverview = dynamic(() => 
  import('@/components/salon/dashboard/FinancialOverview').then(mod => ({ default: mod.FinancialOverview })), {
  loading: () => <LoadingFallback message="Loading financial data..." />,
  ssr: false
})

// Lazy dashboard hooks (deferred loading)
export const useLazySalonSecurity = () => {
  // Return cached data immediately if available
  const cached = typeof window !== 'undefined' ? sessionStorage.getItem('salonSecurity') : null
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      // ignore
    }
  }
  
  // Fallback to actual hook with lazy import
  return import('@/hooks/useSalonSecurity').then(mod => mod.useSalonSecurity())
}

export const useLazySalonDashboard = (options: any) => {
  // Return minimal data structure immediately for fast rendering
  const immediate = {
    kpis: {
      totalRevenue: { current: 0, previous: 0, change: 0 },
      totalAppointments: { current: 0, previous: 0, change: 0 },
      averageTicket: { current: 0, previous: 0, change: 0 },
      customerSatisfaction: { current: 0, previous: 0, change: 0 }
    },
    isLoading: true,
    refreshAll: () => Promise.resolve(),
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
  }
  
  // Lazy load actual dashboard data
  import('@/hooks/useSalonDashboard').then(mod => {
    return mod.useSalonDashboard(options)
  })
  
  return immediate
}

export { FastSkeleton }