/**
 * HERA Entity Management Page - Two Tab System
 * Smart Code: HERA.RETAIL.ENTITY.MANAGEMENT.v1
 * 
 * Two-tab entity management system:
 * 1. Entity List - View, edit, delete entities
 * 2. Create New - Entity creation wizard
 * 
 * Route: /retail/domains/[domain]/sections/[section]/entities
 */

'use client'

import React, { useState, useCallback } from 'react'
import { use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Settings, Filter, List, Database } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

// HERA Components
import { UniversalEntityList } from '@/components/micro-apps/UniversalEntityList'
import { UniversalEntityEditModal } from '@/components/micro-apps/UniversalEntityEditModal'
import { UniversalEntityDeleteModal } from '@/components/micro-apps/UniversalEntityDeleteModal'
import { CreateEntityTab } from '@/components/micro-apps/CreateEntityTab'
import { GlassCard } from '@/components/ui-kit/primitives'

// Services and Auth
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import type { WorkspaceEntityContext, EntityListConfig } from '@/lib/micro-apps/UniversalEntityListRegistry'
import type { EntityListService, EntityDeleteResult } from '@/lib/micro-apps/EntityListService'

// Utils
import { cn } from '@/lib/utils'
import { fadeSlide, staggerChildren } from '@/components/ui-kit/design-tokens'

interface PageProps {
  params: Promise<{
    domain: string
    section: string
  }>
}

export default function EntityManagementPage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { domain, section } = use(params)
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()

  // Tab system state
  const [activeTab, setActiveTab] = useState('list')

  // URL parameters
  const entityType = searchParams.get('type')
  const viewMode = (searchParams.get('view') as 'table' | 'card' | 'grid') || 'table'
  const showFilters = searchParams.get('filters') !== 'false'

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)

  // Component states
  const [config, setConfig] = useState<EntityListConfig | null>(null)
  const [service, setService] = useState<EntityListService | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /**
   * Handle entity selection for viewing
   */
  const handleEntitySelect = useCallback((entity: any) => {
    console.log('👁️ Entity selected for viewing:', entity.id)
    // Could navigate to detail page or open modal
    setSelectedEntity(entity)
  }, [])

  /**
   * Handle entity editing
   */
  const handleEntityEdit = useCallback((entity: any) => {
    console.log('✏️ Entity selected for editing:', entity.id)
    setSelectedEntity(entity)
    setEditModalOpen(true)
  }, [])

  /**
   * Handle entity deletion
   */
  const handleEntityDelete = useCallback((entity: any) => {
    console.log('🗑️ Entity selected for deletion:', entity.id)
    setSelectedEntity(entity)
    setDeleteModalOpen(true)
  }, [])

  /**
   * Handle entity creation
   */
  const handleEntityCreate = useCallback(() => {
    console.log('➕ Creating new entity')
    setActiveTab('create')
  }, [])

  /**
   * Handle successful entity creation
   */
  const handleEntityCreated = useCallback((newEntity: any) => {
    console.log('✅ Entity created successfully:', newEntity.id)
    setActiveTab('list')
    setRefreshTrigger(prev => prev + 1)
  }, [])

  /**
   * Handle entity updated
   */
  const handleEntityUpdated = useCallback((updatedEntity: any) => {
    console.log('✅ Entity updated successfully:', updatedEntity.id)
    setEditModalOpen(false)
    setSelectedEntity(null)
    setRefreshTrigger(prev => prev + 1)
  }, [])

  /**
   * Handle entity deleted
   */
  const handleEntityDeleted = useCallback((result: EntityDeleteResult) => {
    console.log('✅ Entity deletion result:', result)
    setDeleteModalOpen(false)
    setSelectedEntity(null)
    setRefreshTrigger(prev => prev + 1)
  }, [])

  /**
   * Handle modal close
   */
  const handleCloseModals = useCallback(() => {
    setEditModalOpen(false)
    setDeleteModalOpen(false)
    setSelectedEntity(null)
  }, [])

  /**
   * Handle component initialization
   */
  const handleListInitialized = useCallback((listConfig: EntityListConfig, listService: EntityListService) => {
    setConfig(listConfig)
    setService(listService)
  }, [])

  // Tab definitions
  const tabs = [
    {
      id: 'list',
      label: 'Entity List',
      icon: List,
      color: 'blue',
      description: 'View, edit, and manage existing entities'
    },
    {
      id: 'create',
      label: 'Create New',
      icon: Plus,
      color: 'green',
      description: 'Create new entities and configure settings'
    }
  ]

  // Workspace context
  const workspaceContext: WorkspaceEntityContext = {
    domain,
    section,
    workspace: 'main',
    organization_id: organization?.id || '',
    ui_customizations: {
      view_mode: viewMode,
      show_filters: showFilters,
      entity_type: entityType
    }
  }

  // Show auth loading state
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-100/20 to-purple-100/30 opacity-50" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`
        }} />
        <div className="container mx-auto p-6 relative z-10">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading entity management...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Require authentication
  if (!isAuthenticated || !organization?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto pt-20">
            <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm">
              <AlertDescription className="text-red-800">
                Please sign in to access entity management.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => router.push('/retail/login')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Validate route parameters
  if (!domain || !section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto pt-20">
            <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm">
              <AlertDescription className="text-red-800">
                Invalid route parameters. Domain and section are required.
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => router.push('/retail/dashboard')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <UniversalEntityList
            entityType={entityType || undefined}
            workspaceContext={workspaceContext}
            onEntitySelect={handleEntitySelect}
            onEntityEdit={handleEntityEdit}
            onEntityDelete={handleEntityDelete}
            onEntityCreate={handleEntityCreate}
            viewMode={viewMode}
            showSearch={true}
            showFilters={showFilters}
            showActions={true}
            showSelection={false}
            showExport={true}
            enableRealTimeUpdates={true}
            refreshTrigger={refreshTrigger}
            className="space-y-6"
          />
        )
      case 'create':
        return (
          <CreateEntityTab
            domain={domain}
            section={section}
            entityType={entityType}
            organizationId={organization?.id || ''}
            actorUserId={user?.id || ''}
            onEntityCreated={handleEntityCreated}
          />
        )
      default:
        return (
          <UniversalEntityList
            entityType={entityType || undefined}
            workspaceContext={workspaceContext}
            onEntitySelect={handleEntitySelect}
            onEntityEdit={handleEntityEdit}
            onEntityDelete={handleEntityDelete}
            onEntityCreate={handleEntityCreate}
            viewMode={viewMode}
            showSearch={true}
            showFilters={showFilters}
            showActions={true}
            showSelection={false}
            showExport={true}
            enableRealTimeUpdates={true}
            refreshTrigger={refreshTrigger}
            className="space-y-6"
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative">
      {/* Glassmorphism Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-100/20 to-purple-100/30 opacity-50" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`
      }} />
      
      {/* Mobile Status Bar */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden relative z-50" />

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/retail/domains/${domain}/sections/${section}`)}
              className="p-2 -m-2 hover:bg-blue-100/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Entity Management</h1>
              <p className="text-xs text-slate-500">
                {domain.charAt(0).toUpperCase() + domain.slice(1)} › {section.charAt(0).toUpperCase() + section.slice(1)}
                {entityType && ` › ${entityType}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 backdrop-blur rounded-xl border border-blue-200/30">
              <Database className="w-5 h-5 text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <button 
              onClick={() => router.push(`/retail/domains/${domain}/sections/${section}`)} 
              className="hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="mx-2">•</span>
            <span className="text-slate-900 font-medium">Entity Management</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {domain.charAt(0).toUpperCase() + domain.slice(1)} {section.charAt(0).toUpperCase() + section.slice(1)} Entities
              </h1>
              <p className="text-slate-600 mt-1">Manage your business entities with full CRUD operations</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50/80 text-green-700 border-green-200/50">
                Live Data
              </Badge>
              <div className="p-2 bg-blue-500/10 backdrop-blur rounded-xl border border-blue-200/30">
                <Database className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-2 mb-8">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-xl font-medium transition-all duration-200 relative overflow-hidden flex-1",
                    isActive
                      ? `bg-${tab.color}-500 text-white shadow-lg`
                      : "text-slate-700 dark:text-slate-200 hover:bg-white/20"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Glass reflection effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 pointer-events-none" />
                  )}
                  
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : `text-${tab.color}-600`)} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold">{tab.label}</span>
                    <span className={cn(
                      "text-xs opacity-80",
                      isActive ? "text-white/80" : "text-slate-500"
                    )}>
                      {tab.description}
                    </span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-full"
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
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6"
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Edit Modal */}
      {config && service && (
        <UniversalEntityEditModal
          open={editModalOpen}
          onClose={handleCloseModals}
          entity={selectedEntity}
          config={config}
          service={service}
          onEntityUpdated={handleEntityUpdated}
          onError={(error) => {
            console.error('❌ Edit modal error:', error)
            // Could show toast notification here
          }}
        />
      )}

      {/* Delete Modal */}
      {config && service && (
        <UniversalEntityDeleteModal
          open={deleteModalOpen}
          onClose={handleCloseModals}
          entity={selectedEntity}
          config={config}
          service={service}
          onEntityDeleted={handleEntityDeleted}
          onError={(error) => {
            console.error('❌ Delete modal error:', error)
            // Could show toast notification here
          }}
        />
      )}

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>
    </div>
  )
}