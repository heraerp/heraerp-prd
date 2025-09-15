'use client'

/**
 * Example Dashboard Page with HERA Onboarding Integration
 *
 * Demonstrates how to integrate the onboarding system in a real page
 */

import React, { useEffect } from 'react'
import { HeraOnboardingProvider, useOnboarding } from '../HeraOnboardingProvider'
import { defaultMessages } from '../i18n'
import { registerTour } from '../stepRegistry'

// Example dashboard component with onboarding
function DashboardContent() {
  const { startTour, isActive } = useOnboarding()

  // Auto-start tour for first-time users
  useEffect(() => {
    // Check if user has seen tour before (you'd check localStorage/DB in real app)
    const hasSeenTour = localStorage.getItem('hera_onboarding_dashboard_completed')

    if (!hasSeenTour && !isActive) {
      // Start tour after a short delay to ensure page is loaded
      setTimeout(() => {
        startTour('HERA.UI.ONBOARD.CONSOLE.DASHBOARD.v1', { auto: true })
      }, 1000)
    }
  }, [startTour, isActive])

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Header */}
      <header className="bg-background dark:bg-muted shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1
              data-testid="page-title"
              className="text-3xl font-bold text-gray-900 dark:text-foreground"
            >
              HERA Dashboard
            </h1>

            {/* Help button to restart tour */}
            <button
              onClick={() => startTour('HERA.UI.ONBOARD.CONSOLE.DASHBOARD.v1')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-foreground bg-blue-600 hover:bg-blue-700"
              disabled={isActive}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isActive ? 'Tour Running...' : 'Start Tour'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div data-testid="filters-panel" className="lg:col-span-1">
            <div className="bg-background dark:bg-muted rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <select className="w-full border rounded-md px-3 py-2">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Organization</label>
                  <select className="w-full border rounded-md px-3 py-2">
                    <option>All Organizations</option>
                    <option>Acme Corp</option>
                    <option>TechCo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Smart Code</label>
                  <input
                    type="text"
                    placeholder="HERA.*"
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* KPI Cards */}
            <div data-testid="kpi-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background dark:bg-muted rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Total Entities</h3>
                <p className="text-2xl font-bold mt-2">12,345</p>
                <p className="text-sm text-green-600 mt-2">+12% from last month</p>
              </div>

              <div className="bg-background dark:bg-muted rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Transactions</h3>
                <p className="text-2xl font-bold mt-2">98,765</p>
                <p className="text-sm text-green-600 mt-2">+23% from last month</p>
              </div>

              <div className="bg-background dark:bg-muted rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
                <p className="text-2xl font-bold mt-2">$456,789</p>
                <p className="text-sm text-red-600 mt-2">-5% from last month</p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Activity</h2>

              <button
                data-testid="create-entity-button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-foreground bg-green-600 hover:bg-green-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Entity
              </button>
            </div>

            {/* Activity Table */}
            <div className="bg-background dark:bg-muted rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Smart Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Acme Corp</td>
                    <td className="px-6 py-4 whitespace-nowrap">Customer</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                      HERA.CRM.CUST.ENT.PROF.v1
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">2 hours ago</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Invoice #1234</td>
                    <td className="px-6 py-4 whitespace-nowrap">Transaction</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                      HERA.FIN.INV.TXN.SALE.v1
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">4 hours ago</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Widget Pro</td>
                    <td className="px-6 py-4 whitespace-nowrap">Product</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                      HERA.INV.PROD.ENT.ITEM.v1
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">Yesterday</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Example mini-tour for a specific widget
const widgetTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.WIDGET.KPI.v1' as const,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.WIDGET.KPI.INTRO.v1' as const,
      selector: '[data-testid="kpi-cards"]',
      titleKey: 'ui.onboard.widget.kpi.intro.title',
      bodyKey: 'ui.onboard.widget.kpi.intro.body',
      placement: 'bottom' as const
    }
  ],
  autoStart: false,
  allowSkip: true
}

// Example usage with provider
export default function DashboardPage() {
  // In a real app, you'd get these from your auth/app context
  const organizationId = 'org_demo_001'
  const router = null // Use your actual router

  // Register widget tour
  React.useEffect(() => {
    registerTour(widgetTour)
  }, [])

  // Custom messages for the widget tour
  const customMessages = {
    ...defaultMessages,
    'ui.onboard.widget.kpi.intro.title': 'KPI Cards',
    'ui.onboard.widget.kpi.intro.body':
      'These cards show your key performance indicators at a glance. Click any card to drill down into details.'
  }

  return (
    <HeraOnboardingProvider
      organizationId={organizationId}
      enabledTours={['HERA.UI.ONBOARD.CONSOLE.DASHBOARD.v1', 'HERA.UI.ONBOARD.WIDGET.KPI.v1']}
      messages={customMessages}
      theme="light"
      onEmit={(txn, lines) => {
        // In production, send these to your analytics API
        console.log('HERA Onboarding Event:', { txn, lines })

        // Mark tour as completed when finished
        if (txn.metadata.event === 'tour_completed') {
          localStorage.setItem('hera_onboarding_dashboard_completed', 'true')
        }
      }}
      router={router}
      debug={true}
    >
      <DashboardContent />
    </HeraOnboardingProvider>
  )
}
