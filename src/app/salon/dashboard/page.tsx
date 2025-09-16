'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { KpiCards } from '@/src/components/dashboard/KpiCards'
import { UpcomingAppointments } from '@/src/components/dashboard/UpcomingAppointments'
import { LowStockList } from '@/src/components/dashboard/LowStockList'
import { RevenueSparkline } from '@/src/components/dashboard/RevenueSparkline'
import { StaffUtilization } from '@/src/components/dashboard/StaffUtilization'
import { QuickActions } from '@/src/components/dashboard/QuickActions'
import { AlertsStrip } from '@/src/components/dashboard/AlertsStrip'

// Default organization ID for salon demo - Hair Talkz Park Regis
const DEFAULT_SALON_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

export default function SalonDashboard() {
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [demoOrganizationId, setDemoOrganizationId] = useState<string | null>(null)
  
  // Check if this is a demo session
  useEffect(() => {
    const isDemoLogin = sessionStorage.getItem('isDemoLogin') === 'true'
    const demoModule = sessionStorage.getItem('demoModule')
    
    if (isDemoLogin && demoModule === 'salon') {
      // Use the default salon demo org ID
      setDemoOrganizationId(DEFAULT_SALON_ORG_ID)
    }
  }, [])
  
  // Use demo org ID if available, otherwise use authenticated org
  const organizationId = demoOrganizationId || currentOrganization?.id

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 animate-pulse shadow-2xl" />
          </div>
          <p className="text-muted-foreground mt-4 font-medium">Loading salon dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (!organizationId && !demoOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No Organization Selected
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please access this page through the demo portal
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Salon Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {new Date().toLocaleDateString('en-AE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Alerts Strip */}
        <AlertsStrip organizationId={organizationId} />

        {/* Main Grid Layout */}
        <div className="grid gap-6">
          {/* KPI Cards - Full Width */}
          <section aria-label="Key Performance Indicators">
            <KpiCards organizationId={organizationId} />
          </section>

          {/* Revenue and Appointments Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-label="Revenue Trends">
              <RevenueSparkline organizationId={organizationId} />
            </section>
            
            <section aria-label="Upcoming Appointments">
              <UpcomingAppointments organizationId={organizationId} />
            </section>
          </div>

          {/* Operations Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <section aria-label="Low Stock Items">
              <LowStockList organizationId={organizationId} />
            </section>
            
            <section aria-label="Staff Utilization">
              <StaffUtilization organizationId={organizationId} />
            </section>
            
            <section aria-label="Quick Actions">
              <QuickActions organizationId={organizationId} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
