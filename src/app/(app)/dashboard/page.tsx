// ================================================================================
// HERA SALON DASHBOARD
// Smart Code: HERA.SALON.DASHBOARD.MAIN.v1
// Main dashboard for salon owners and managers
// ================================================================================

'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { salonClasses } from '@/lib/theme/salon-theme'
import { Guard } from '@/lib/auth/guard'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { AlertsStrip } from '@/components/dashboard/AlertsStrip'
import { RevenueSparkline } from '@/components/dashboard/RevenueSparkline'
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments'
import { LowStockList } from '@/components/dashboard/LowStockList'
import { StaffUtilization } from '@/components/dashboard/StaffUtilization'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { DemoOrgDebug } from '@/components/debug/DemoOrgDebug'
import { DataDebugger } from '@/components/debug/DataDebugger'

export default function SalonDashboard() {
  const { currentOrganization, isLoading, isLoadingOrgs } = useHERAAuth()
  const contextLoading = isLoading || isLoadingOrgs

  // Use the current organization or fallback to the demo salon org
  const organizationId = currentOrganization?.id || '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

  return (
    <Guard allowedRoles={['owner', 'manager']}>
      <div className={`min-h-screen ${salonClasses.pageGradient}`}>
        {/* Loading State */}
        {contextLoading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold ${salonClasses.gradientHeading}`}>
                {currentOrganization?.name || 'Salon'} Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor your salon's performance and manage daily operations
              </p>
            </div>

            {/* Alerts Strip */}
            <AlertsStrip organizationId={organizationId} />

            {/* KPI Cards */}
            <KpiCards organizationId={organizationId} />

            {/* Revenue Sparkline */}
            <RevenueSparkline organizationId={organizationId} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Appointments */}
              <div className="lg:col-span-2">
                <UpcomingAppointments organizationId={organizationId} />
              </div>

              {/* Low Stock List */}
              <div>
                <LowStockList organizationId={organizationId} />
              </div>
            </div>

            {/* Staff Utilization */}
            <StaffUtilization organizationId={organizationId} />

            {/* Quick Actions */}
            <QuickActions organizationId={organizationId} />
          </div>
        )}

        {/* Debug components - only show in development */}
        <DemoOrgDebug />
        <DataDebugger organizationId={organizationId} />
      </div>
    </Guard>
  )
}
