/**
 * POS Integration with Universal Workspace System
 * Smart Code: HERA.RETAIL.SALES.POS.WORKSPACE.v1
 * 
 * Unified POS interface that integrates with the Universal Transaction system
 * Route: /retail/domains/sales/sections/pos
 * 
 * Features:
 * - POS-specific transaction management
 * - Real-time inventory integration
 * - Universal Transaction compatibility  
 * - Workspace-aware theming and context
 * - Mobile-optimized touch interface
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { WorkspaceContextProvider } from '@/lib/workspace/workspace-context'
import { WorkspaceUniversalPOS } from '@/components/universal/workspace/WorkspaceUniversalPOS'
import { WorkspaceUniversalTransactions } from '@/components/universal/workspace/WorkspaceUniversalTransactions'
import { WorkspaceUniversalAnalytics } from '@/components/universal/workspace/WorkspaceUniversalAnalytics'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, AlertTriangle, Loader2, Receipt, BarChart3,
  ShoppingCart, CreditCard, Package, Users, Settings, 
  TrendingUp, Clock, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function POSWorkspacePage() {
  const router = useRouter()
  const { organization, user, isAuthenticated, contextLoading } = useHERAAuth()
  
  // Fixed context for POS workspace
  const domain = 'sales'
  const section = 'pos'
  
  // Tab state for POS workspace  
  const [activeTab, setActiveTab] = useState('pos')
  
  // Show auth loading state
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading POS System...</p>
            </div>
          </div>
          
          {/* Preview POS interface */}
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-gray-600 mt-2">Sales › POS Terminal</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 opacity-75">
                <h3 className="font-semibold text-gray-900">Quick Sale</h3>
                <p className="text-sm text-gray-500 mt-1">Loading products...</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 opacity-75">
                <h3 className="font-semibold text-gray-900">Current Order</h3>
                <p className="text-sm text-gray-500 mt-1">Loading cart...</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 opacity-75">
                <h3 className="font-semibold text-gray-900">Recent Sales</h3>
                <p className="text-sm text-gray-500 mt-1">Loading transactions...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/retail/login')
    return null
  }

  // Show organization context error
  if (!organization?.id) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              No organization context available. Please select an organization.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button onClick={() => router.push('/retail/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  console.log('🚀 Rendering POS Workspace:', { domain, section })

  // Render POS workspace with sales theme
  return (
    <div className="min-h-screen bg-white relative">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-white md:hidden relative z-50" />

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/retail/domains/sales')} className="p-2 -m-2 rounded-lg hover:bg-green-50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-green-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Point of Sale</h1>
              <p className="text-xs text-green-600 font-medium">Sales › POS Terminal</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <button onClick={() => router.push('/retail/dashboard')} className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors font-medium">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
                <span className="mx-2">•</span>
                <span className="text-slate-700 font-medium">
                  Point of Sale System
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Sales POS</h1>
                  <p className="text-sm text-slate-600">Point of sale terminal with Universal Transaction integration</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider">System Status</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-slate-700">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POS Workspace Tabs */}
      <POSWorkspaceTabs
        domain={domain}
        section={section}
        organizationId={organization?.id || ''}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}

// ================================================================================
// POS WORKSPACE TABS COMPONENT
// ================================================================================

interface POSWorkspaceTabsProps {
  domain: string
  section: string
  organizationId: string
  activeTab: string
  onTabChange: (tabId: string) => void
}

function POSWorkspaceTabs({ domain, section, organizationId, activeTab, onTabChange }: POSWorkspaceTabsProps) {
  const tabs = [
    {
      id: 'pos',
      label: 'POS Terminal',
      icon: Receipt,
      color: 'green',
      description: 'Point of sale interface'
    },
    {
      id: 'transactions',
      label: 'Sales History',
      icon: ShoppingCart,
      color: 'blue',
      description: 'Transaction history and management'
    },
    {
      id: 'analytics',
      label: 'Sales Analytics',
      icon: BarChart3,
      color: 'indigo',
      description: 'Performance metrics and insights'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      color: 'purple',
      description: 'Customer management and loyalty'
    },
    {
      id: 'settings',
      label: 'POS Settings',
      icon: Settings,
      color: 'slate',
      description: 'Terminal configuration and preferences'
    }
  ]

  const getTabColors = (color: string, isActive: boolean) => {
    const colors = {
      green: {
        bg: isActive ? 'bg-green-500' : '',
        text: isActive ? 'text-white' : 'text-green-600',
        iconText: isActive ? 'text-white' : 'text-green-600'
      },
      blue: {
        bg: isActive ? 'bg-blue-500' : '',
        text: isActive ? 'text-white' : 'text-blue-600',
        iconText: isActive ? 'text-white' : 'text-blue-600'
      },
      indigo: {
        bg: isActive ? 'bg-indigo-500' : '',
        text: isActive ? 'text-white' : 'text-indigo-600',
        iconText: isActive ? 'text-white' : 'text-indigo-600'
      },
      purple: {
        bg: isActive ? 'bg-purple-500' : '',
        text: isActive ? 'text-white' : 'text-purple-600',
        iconText: isActive ? 'text-white' : 'text-purple-600'
      },
      slate: {
        bg: isActive ? 'bg-slate-500' : '',
        text: isActive ? 'text-white' : 'text-slate-600',
        iconText: isActive ? 'text-white' : 'text-slate-600'
      }
    }
    return colors[color as keyof typeof colors] || colors.green
  }

  const renderTabContent = () => {
    return (
      <WorkspaceContextProvider domain={domain} section={section} organizationId={organizationId}>
        {(() => {
          switch (activeTab) {
            case 'pos':
              return <POSTerminalTab />
            case 'transactions':
              return <TransactionsTab />
            case 'analytics':
              return <AnalyticsTab />
            case 'customers':
              return <CustomersTab />
            case 'settings':
              return <SettingsTab />
            default:
              return <POSTerminalTab />
          }
        })()}
      </WorkspaceContextProvider>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* POS Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const tabColors = getTabColors(tab.color, isActive)
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-lg font-medium transition-all duration-200 relative flex-1",
                  isActive
                    ? `${tabColors.bg} text-white shadow-sm`
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
                whileHover={{ y: isActive ? 0 : -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={cn("w-5 h-5", tabColors.iconText)} />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-semibold">{tab.label}</span>
                  <span className={cn(
                    "text-xs",
                    isActive ? "text-white/90" : "text-slate-500"
                  )}>
                    {tab.description}
                  </span>
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 rounded-full"
                    layoutId="activePOSTabIndicator"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  )
}

// ================================================================================
// TAB CONTENT COMPONENTS
// ================================================================================

function POSTerminalTab() {
  return (
    <WorkspaceUniversalPOS
      registerMode="full"
      defaultView="sale"
      enableQuickSale={true}
      enableCustomerLookup={true}
      enableStaffCommissions={true}
      enableInventoryTracking={true}
      enableLoyaltyProgram={true}
      className="min-h-[calc(100vh-400px)]"
    />
  )
}

function TransactionsTab() {
  return (
    <WorkspaceUniversalTransactions
      showQuickActions={true}
      showAnalytics={true}
      defaultView="list"
      className=""
    />
  )
}

function AnalyticsTab() {
  return (
    <WorkspaceUniversalAnalytics
      timeRange="30d"
      showRealTime={true}
      allowExport={true}
      className=""
    />
  )
}

function CustomersTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <motion.div 
        className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Customer Database</h3>
            <p className="text-sm text-slate-600">Manage customer information</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-700">Total Customers</span>
            <span className="text-purple-600 font-medium">1,247</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-700">Active This Month</span>
            <span className="text-green-600 font-medium">389</span>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Manage Customers
          </button>
        </div>
      </motion.div>

      <motion.div 
        className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Loyalty Program</h3>
            <p className="text-sm text-slate-600">Customer rewards and points</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-700">Loyalty Members</span>
            <span className="text-amber-600 font-medium">892</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-700">Points Redeemed</span>
            <span className="text-green-600 font-medium">24,567</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div 
        className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Settings className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Terminal Settings</h3>
            <p className="text-sm text-slate-600">Configure POS preferences</p>
          </div>
        </div>
        <div className="space-y-2">
          <button className="w-full p-3 text-left bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition-colors text-sm text-slate-700 font-medium">
            Receipt Printer Setup
          </button>
          <button className="w-full p-3 text-left bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition-colors text-sm text-slate-700 font-medium">
            Payment Gateway Config
          </button>
          <button className="w-full p-3 text-left bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition-colors text-sm text-slate-700 font-medium">
            Tax Settings
          </button>
        </div>
      </motion.div>

      <motion.div 
        className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">System Status</h3>
            <p className="text-sm text-slate-600">Monitor terminal health</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-100">
            <span className="text-sm text-slate-700">Connection</span>
            <span className="text-green-600 font-medium">Online</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-100">
            <span className="text-sm text-slate-700">Printer</span>
            <span className="text-green-600 font-medium">Ready</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-100">
            <span className="text-sm text-slate-700">Payment Terminal</span>
            <span className="text-green-600 font-medium">Connected</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}