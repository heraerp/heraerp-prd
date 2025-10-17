'use client'

import React, { useState, useEffect } from 'react'
import { Scissors, Sparkles, RefreshCw, Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { FastSkeleton } from '@/components/lazy/LazyComponents'
import dynamic from 'next/dynamic'

// Lazy load components with progressive loading
const LazyHeroMetrics = dynamic(() => import('@/components/salon/dashboard/HeroMetrics').then(mod => ({ default: mod.HeroMetrics })), {
  loading: () => <FastSkeleton />,
  ssr: false
})

const LazyAppointmentAnalytics = dynamic(() => import('@/components/salon/dashboard/AppointmentAnalytics').then(mod => ({ default: mod.AppointmentAnalytics })), {
  loading: () => <div className="bg-gray-100 h-64 rounded-lg animate-pulse" />,
  ssr: false
})

const LazyRevenueTrends = dynamic(() => import('@/components/salon/dashboard/RevenueTrends').then(mod => ({ default: mod.RevenueTrends })), {
  loading: () => <div className="bg-gray-100 h-64 rounded-lg animate-pulse" />,
  ssr: false
})

const LazyStaffPerformance = dynamic(() => import('@/components/salon/dashboard/StaffPerformance').then(mod => ({ default: mod.StaffPerformance })), {
  loading: () => <div className="bg-gray-100 h-64 rounded-lg animate-pulse" />,
  ssr: false
})

const LazyFinancialOverview = dynamic(() => import('@/components/salon/dashboard/FinancialOverview').then(mod => ({ default: mod.FinancialOverview })), {
  loading: () => <div className="bg-gray-100 h-64 rounded-lg animate-pulse" />,
  ssr: false
})

export default function LazySalonDashboard() {
  const [loadingStage, setLoadingStage] = useState(0)
  const [authState, setAuthState] = useState({ 
    isAuthenticated: false, 
    user: null, 
    organization: null,
    isLoading: true 
  })

  // Fast authentication check using cached state
  useEffect(() => {
    const checkAuth = () => {
      try {
        const cached = sessionStorage.getItem('heraAuthState')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.isAuthenticated && parsed.user?.email?.includes('hairtalkz')) {
            console.log('🚀 LAZY DASHBOARD - Using cached auth for instant load')
            setAuthState({
              isAuthenticated: true,
              user: parsed.user,
              organization: parsed.organization,
              isLoading: false
            })
          }
        }
      } catch (error) {
        console.warn('Auth cache error:', error)
      }
    }

    checkAuth()
  }, [])

  // Progressive component loading
  useEffect(() => {
    if (authState.isAuthenticated) {
      const stages = [1, 2, 3, 4]
      stages.forEach((stage, index) => {
        setTimeout(() => {
          setLoadingStage(stage)
        }, index * 500) // Load each stage 500ms apart
      })
    }
  }, [authState.isAuthenticated])

  // Show loading if still authenticating
  if (authState.isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <p className="text-lg font-medium" style={{ color: LUXE_COLORS.bronze }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Auth error
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please use the fast track URL for instant access:</p>
          <Button onClick={() => window.location.href = '/salon/dashboard?forcehair=true'}>
            Fast Track Access
          </Button>
        </div>
      </div>
    )
  }

  const mockKpis = {
    totalRevenue: { current: 28500, previous: 24200, change: 17.8 },
    totalAppointments: { current: 156, previous: 142, change: 9.9 },
    averageTicket: { current: 182.7, previous: 170.4, change: 7.2 },
    customerSatisfaction: { current: 4.9, previous: 4.7, change: 4.3 }
  }

  const formatCurrency = (amount: number) => `AED ${amount.toFixed(0)}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Fast loading header */}
      <div
        className="sticky top-0 z-30 mb-8"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px ${LUXE_COLORS.gold}10`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="p-4 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}15 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}40`,
                  boxShadow: `0 0 20px ${LUXE_COLORS.gold}20`
                }}
              >
                <Scissors className="w-8 h-8" style={{ color: LUXE_COLORS.gold }} />
              </div>
              <div>
                <h1
                  className="text-4xl font-bold tracking-tight mb-1 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {authState.organization?.name || 'Hair Talkz Salon'}
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ color: LUXE_COLORS.gold }} />
                </h1>
                <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                  Lazy Loading Dashboard • Ultra Fast Performance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                style={{
                  background: `${LUXE_COLORS.emerald}20`,
                  border: `1px solid ${LUXE_COLORS.emerald}30`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                style={{
                  background: `${LUXE_COLORS.ruby}20`,
                  border: `1px solid ${LUXE_COLORS.ruby}40`,
                  color: LUXE_COLORS.ruby
                }}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stage 1: Hero Metrics (Load immediately) */}
        {loadingStage >= 1 && (
          <div className="animate-fadeIn">
            <LazyHeroMetrics 
              kpis={mockKpis} 
              formatCurrency={formatCurrency} 
              selectedPeriod="today" 
            />
          </div>
        )}

        {/* Stage 2: Appointment Analytics (Load after 500ms) */}
        {loadingStage >= 2 && (
          <div className="animate-fadeIn">
            <LazyAppointmentAnalytics 
              kpis={mockKpis} 
              selectedPeriod="today" 
            />
          </div>
        )}

        {/* Stage 3: Revenue Trends (Load after 1000ms) */}
        {loadingStage >= 3 && (
          <div className="animate-fadeIn">
            <LazyRevenueTrends 
              kpis={mockKpis} 
              formatCurrency={formatCurrency} 
              selectedPeriod="today" 
            />
          </div>
        )}

        {/* Stage 4: Additional Components (Load after 1500ms) */}
        {loadingStage >= 4 && (
          <div className="space-y-8 animate-fadeIn">
            <LazyStaffPerformance 
              kpis={mockKpis} 
              formatCurrency={formatCurrency} 
              selectedPeriod="today" 
            />
            <LazyFinancialOverview 
              kpis={mockKpis} 
              formatCurrency={formatCurrency} 
              selectedPeriod="today" 
            />
          </div>
        )}

        {/* Loading Progress Indicator */}
        {loadingStage < 4 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                 style={{ 
                   background: `${LUXE_COLORS.gold}10`, 
                   border: `1px solid ${LUXE_COLORS.gold}20` 
                 }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: LUXE_COLORS.gold }} />
              <span className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                Loading components... ({loadingStage}/4)
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}