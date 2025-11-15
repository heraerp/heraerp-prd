/**
 * HERA Level 3 Section Workspace Page
 * Smart Code: HERA.RETAIL.SECTION.WORKSPACE.v1
 * 
 * Universal SAP-style workspace interface
 * Route: /retail/domains/[domain]/sections/[section] → e.g., /retail/domains/inventory/sections/overview
 * 
 * Data Flow:
 * 1. Extract domain and section from URL params
 * 2. Load universal workspace via database-driven API
 * 3. Display SAP Fiori-style interface with enterprise features
 */

'use client'

import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { UniversalEntityListIntegration } from '@/components/micro-apps/UniversalEntityListIntegration'
import { TabAwareEntityManagement } from '@/components/micro-apps/TabAwareEntityManagement'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, AlertTriangle, Loader2, Database, List,
  Receipt, Users, GitBranch, Workflow, BarChart3,
  Plus, Eye, Settings, TrendingUp, DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceContextProvider } from '@/lib/workspace/workspace-context'
import { WorkspaceUniversalTransactions } from '@/components/universal/workspace/WorkspaceUniversalTransactions'
import { WorkspaceUniversalAnalytics } from '@/components/universal/workspace/WorkspaceUniversalAnalytics'
import { WorkspaceUniversalRelationships } from '@/components/universal/workspace/WorkspaceUniversalRelationships'
import { WorkspaceUniversalWorkflows } from '@/components/universal/workspace/WorkspaceUniversalWorkflows'

interface PageProps {
  params: Promise<{
    domain: string
    section: string
  }>
}

export default function SectionWorkspacePage({ params }: PageProps) {
  const router = useRouter()
  const { domain, section } = use(params)
  const { organization, user, isAuthenticated, contextLoading } = useHERAAuth()
  
  // Tab state for the entire workspace
  const [activeTab, setActiveTab] = useState('transactions')
  
  // Generate workspace ID from domain and section
  const workspaceId = `${domain}-${section}-main`

  // Show auth loading state with immediate workspace preview
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Show workspace preview immediately while auth loads */}
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Initializing...</p>
            </div>
          </div>
          
          {/* Preview workspace content */}
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 capitalize">
                {section} Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {domain.charAt(0).toUpperCase() + domain.slice(1)} › {section.charAt(0).toUpperCase() + section.slice(1)}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 opacity-75">
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-500 mt-1">Loading actions...</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 opacity-75">
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Loading activity...</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 opacity-75">
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500 mt-1">Loading data...</p>
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

  console.log('🚀 Rendering Retail Section Workspace:', { domain, section })

  // Render SAP Fiori compliant workspace with retail theme continuity
  return (
    <div className="min-h-screen bg-white relative">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-white md:hidden relative z-50" />

      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/retail/domains/${domain}`)} className="p-2 -m-2 rounded-lg hover:bg-indigo-50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-indigo-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                {section.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Dashboard
              </h1>
              <p className="text-xs text-indigo-600 font-medium">Retail • {domain.charAt(0).toUpperCase() + domain.slice(1)}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <button onClick={() => router.push('/retail/dashboard')} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors font-medium">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
                <span className="mx-2">•</span>
                <span className="text-slate-700 font-medium">
                  {section.charAt(0).toUpperCase() + section.slice(1)} Analytics
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    {domain.charAt(0).toUpperCase() + domain.slice(1)} {section.charAt(0).toUpperCase() + section.slice(1)}
                  </h1>
                  <p className="text-sm text-slate-600">Comprehensive analytics and financial insights</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Live Data</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-slate-700">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Tab Workspace System */}
      <FinWorkspaceTabs
        domain={domain}
        section={section}
        organizationId={organization?.id || ''}
        actorUserId={user?.id || ''}
        router={router}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab-Aware Entity Management Section */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-all duration-300 overflow-visible">
          <TabAwareEntityManagement
            activeTab={activeTab}
            workspaceContext={{
              domain,
              section,
              workspace: 'main',
              organization_id: organization?.id || ''
            }}
            className="w-full"
          />
        </div>
      </div>

    </div>
  )
}

// ================================================================================
// FIN WORKSPACE TABS COMPONENT
// ================================================================================

interface FinWorkspaceTabsProps {
  domain: string
  section: string
  organizationId: string
  actorUserId: string
  router: any
  activeTab: string
  onTabChange: (tabId: string) => void
}

function FinWorkspaceTabs({ domain, section, organizationId, actorUserId, router, activeTab, onTabChange }: FinWorkspaceTabsProps) {

  // Color mapping for Tailwind CSS
  const getTabColors = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        bg: isActive ? 'bg-blue-500' : '',
        text: isActive ? 'text-white' : 'text-blue-600',
        iconText: isActive ? 'text-white' : 'text-blue-600'
      },
      green: {
        bg: isActive ? 'bg-green-500' : '',
        text: isActive ? 'text-white' : 'text-green-600',
        iconText: isActive ? 'text-white' : 'text-green-600'
      },
      purple: {
        bg: isActive ? 'bg-purple-500' : '',
        text: isActive ? 'text-white' : 'text-purple-600',
        iconText: isActive ? 'text-white' : 'text-purple-600'
      },
      orange: {
        bg: isActive ? 'bg-orange-500' : '',
        text: isActive ? 'text-white' : 'text-orange-600',
        iconText: isActive ? 'text-white' : 'text-orange-600'
      },
      indigo: {
        bg: isActive ? 'bg-indigo-500' : '',
        text: isActive ? 'text-white' : 'text-indigo-600',
        iconText: isActive ? 'text-white' : 'text-indigo-600'
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const tabs = [
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Receipt,
      color: 'blue',
      description: 'Financial transactions and payments'
    },
    {
      id: 'entities',
      label: 'Entities',
      icon: Database,
      color: 'green',
      description: 'Manage financial entities and accounts'
    },
    {
      id: 'relations',
      label: 'Relations',
      icon: GitBranch,
      color: 'purple',
      description: 'Entity relationships and hierarchies'
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: Workflow,
      color: 'orange',
      description: 'Process flows and automation'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'indigo',
      description: 'Financial insights and reporting'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transactions':
        return <TransactionsTab domain={domain} section={section} router={router} organizationId={organizationId} />
      case 'entities':
        return <EntitiesTab domain={domain} section={section} router={router} organizationId={organizationId} />
      case 'relations':
        return <RelationsTab domain={domain} section={section} router={router} organizationId={organizationId} />
      case 'workflow':
        return <WorkflowTab domain={domain} section={section} router={router} organizationId={organizationId} />
      case 'analytics':
        return <AnalyticsTab domain={domain} section={section} router={router} organizationId={organizationId} />
      default:
        return <TransactionsTab domain={domain} section={section} router={router} organizationId={organizationId} />
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* SAP Fiori Tab Navigation */}
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
                
                {/* SAP Fiori Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40 rounded-full"
                    layoutId="activeTabIndicator"
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

function TransactionsTab({ domain, section, router, organizationId }: { domain: string, section: string, router: any, organizationId: string }) {
  return (
    <WorkspaceContextProvider domain={domain} section={section} organizationId={organizationId}>
      <WorkspaceUniversalTransactions
        showQuickActions={true}
        showAnalytics={true}
        defaultView="list"
        className=""
      />
    </WorkspaceContextProvider>
  )
}

function EntitiesTab({ domain, section, router, organizationId }: { domain: string, section: string, router: any, organizationId: string }) {
  return (
    <WorkspaceContextProvider domain={domain} section={section} organizationId={organizationId}>
      <div className="space-y-6">
        {/* Domain-specific entity management */}
        <UniversalEntityListIntegration
          workspaceId={`${domain}-${section}-entities`}
          entityTypes={[`${domain.toUpperCase()}_ENTITY`, 'CUSTOMER', 'VENDOR', 'PRODUCT']}
          className=""
        />
      </div>
    </WorkspaceContextProvider>
  )
}

function RelationsTab({ domain, section, router, organizationId }: { domain: string, section: string, router: any, organizationId: string }) {
  return (
    <WorkspaceContextProvider domain={domain} section={section} organizationId={organizationId}>
      <WorkspaceUniversalRelationships
        showQuickActions={true}
        showVisualMap={true}
        defaultView="list"
        className=""
      />
    </WorkspaceContextProvider>
  )
}

function WorkflowTab({ domain, section, router, organizationId }: { domain: string, section: string, router: any, organizationId: string }) {
  return (
    <WorkspaceContextProvider domain={domain} section={section} organizationId={organizationId}>
      <WorkspaceUniversalWorkflows
        showQuickActions={true}
        showTemplates={true}
        showAnalytics={true}
        defaultView="active"
        className=""
      />
    </WorkspaceContextProvider>
  )
}

function AnalyticsTab({ domain, section, router, organizationId }: { domain: string, section: string, router: any, organizationId: string }) {
  return (
    <WorkspaceContextProvider domain={domain} section={section} organizationId={organizationId}>
      <WorkspaceUniversalAnalytics
        timeRange="30d"
        showRealTime={true}
        allowExport={true}
        className=""
      />
    </WorkspaceContextProvider>
  )
}