// ================================================================================
// HERA SALON DASHBOARD
// Smart Code: HERA.SALON.DASHBOARD.MAIN.v1
// Main dashboard for salon owners and managers
// ================================================================================

'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { salonClasses } from '@/src/lib/theme/salon-theme'
import { Guard } from '@/src/lib/auth/guard'
import { KpiCards } from '@/src/components/dashboard/KpiCards'
import { AlertsStrip } from '@/src/components/dashboard/AlertsStrip'
import { RevenueSparkline } from '@/src/components/dashboard/RevenueSparkline'
import { UpcomingAppointments } from '@/src/components/dashboard/UpcomingAppointments'
import { LowStockList } from '@/src/components/dashboard/LowStockList'
import { StaffUtilization } from '@/src/components/dashboard/StaffUtilization'
import { QuickActions } from '@/src/components/dashboard/QuickActions'


export default function SalonDashboard() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()

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
            <AlertsStrip organizationId={currentOrganization?.id} />

            {/* KPI Cards */}
            <KpiCards organizationId={currentOrganization?.id} />

            {/* Revenue Sparkline */}
            <RevenueSparkline organizationId={currentOrganization?.id} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Appointments */}
              <div className="lg:col-span-2">
                <UpcomingAppointments organizationId={currentOrganization?.id} />
              </div>

              {/* Low Stock List */}
              <div>
                <LowStockList organizationId={currentOrganization?.id} />
              </div>
            </div>

            {/* Staff Utilization */}
            <StaffUtilization organizationId={currentOrganization?.id} />

            {/* Quick Actions */}
            <QuickActions organizationId={currentOrganization?.id} />
          </div>
        )}
      </div>
    </Guard>
  )
}