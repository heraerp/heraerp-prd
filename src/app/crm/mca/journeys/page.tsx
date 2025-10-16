'use client'

/**
 * MCA Customer Journeys - Journey Orchestrator
 * Mobile-First Enterprise Page for Customer Journey Management
 * 
 * Module: MCA
 * Entity: CUSTOMER_JOURNEY
 * Smart Code: HERA.CRM.MCA.ENTITY.JOURNEY.V1
 * Path: /crm/mca/journeys
 * Description: Visual journey builder with trigger conditions and multi-channel flows
 */

import React, { useState, useCallback, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  Filter,
  GitBranch,
  MoreVertical,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
  Zap
} from 'lucide-react'

/**
 * Customer Journey Entity Interface
 * Extends TableRecord for HERA compliance
 */
interface CustomerJourney extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  
  // Dynamic fields (stored in core_dynamic_data)
  name?: string
  description?: string
  trigger_conditions?: string
  journey_steps?: string
  active_contacts?: string
  completion_rate?: string
  status?: string
  
  // System fields
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Customer Journey Smart Codes
 */
const JOURNEY_SMART_CODES = {
  ENTITY: 'HERA.CRM.MCA.ENTITY.JOURNEY.V1',
  FIELD_NAME: 'HERA.CRM.MCA.DYN.JOURNEY.V1.NAME.V1',
  FIELD_DESCRIPTION: 'HERA.CRM.MCA.DYN.JOURNEY.V1.DESCRIPTION.V1',
  FIELD_TRIGGER_CONDITIONS: 'HERA.CRM.MCA.DYN.JOURNEY.V1.TRIGGER_CONDITIONS.V1',
  FIELD_JOURNEY_STEPS: 'HERA.CRM.MCA.DYN.JOURNEY.V1.JOURNEY_STEPS.V1',
  FIELD_ACTIVE_CONTACTS: 'HERA.CRM.MCA.DYN.JOURNEY.V1.ACTIVE_CONTACTS.V1',
  FIELD_COMPLETION_RATE: 'HERA.CRM.MCA.DYN.JOURNEY.V1.COMPLETION_RATE.V1',
  FIELD_STATUS: 'HERA.CRM.MCA.DYN.JOURNEY.V1.STATUS.V1',
  
  // Event smart codes for audit trail
  EVENT_CREATED: 'HERA.CRM.MCA.EVENT.JOURNEY.V1.CREATED.V1',
  EVENT_UPDATED: 'HERA.CRM.MCA.EVENT.JOURNEY.V1.UPDATED.V1',
  EVENT_DELETED: 'HERA.CRM.MCA.EVENT.JOURNEY.V1.DELETED.V1'
} as const

/**
 * Customer Journeys Main Page Component
 * Enterprise-grade journey orchestration with visual builder
 */
export default function CustomerJourneysPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [selectedJourneys, setSelectedJourneys] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentJourney, setCurrentJourney] = useState<CustomerJourney | null>(null)
  const [journeyToDelete, setJourneyToDelete] = useState<CustomerJourney | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    // Dynamic filter fields
    name: '',
    trigger_conditions: '',
    status: ''
  })

  // Mock data for customer journeys (in production, this would use useUniversalEntity)
  const journeys: CustomerJourney[] = [
    {
      id: '1',
      entity_id: '1',
      entity_name: 'Welcome Onboarding Flow',
      smart_code: 'HERA.CRM.MCA.ENTITY.JOURNEY.V1',
      status: 'active',
      name: 'Welcome Onboarding Flow',
      description: 'New customer welcome sequence with multi-touch points',
      trigger_conditions: 'customer_created',
      journey_steps: '5 steps',
      active_contacts: '1,247',
      completion_rate: '87.3%',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      entity_id: '2',
      entity_name: 'Abandoned Cart Recovery',
      smart_code: 'HERA.CRM.MCA.ENTITY.JOURNEY.V1',
      status: 'active',
      name: 'Abandoned Cart Recovery',
      description: 'Re-engage customers who left items in cart',
      trigger_conditions: 'cart_abandoned_24h',
      journey_steps: '3 steps',
      active_contacts: '542',
      completion_rate: '64.1%',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  // Enhanced KPI calculations
  const kpis = [
    {
      title: 'Active Journeys',
      value: journeys.filter(item => item.status === 'active').length.toString(),
      change: '+3.2%',
      trend: 'up' as const,
      icon: GitBranch
    },
    {
      title: 'Contacts in Journeys',
      value: journeys.reduce((sum, j) => sum + parseInt(j.active_contacts?.replace(',', '') || '0'), 0).toLocaleString(),
      change: '+12.5%',
      trend: 'up' as const,
      icon: CheckCircle
    },
    {
      title: 'Avg Completion Rate',
      value: `${(journeys.reduce((sum, j) => sum + parseFloat(j.completion_rate?.replace('%', '') || '0'), 0) / journeys.length).toFixed(1)}%`,
      change: '+5.7%',
      trend: 'up' as const,
      icon: TrendingUp
    }
  ]

  // Enhanced table columns
  const columns: TableColumn[] = [
    { key: 'entity_name', label: 'Journey Name', sortable: true },
    { key: 'trigger_conditions', label: 'Trigger', sortable: true },
    { key: 'journey_steps', label: 'Steps', sortable: true },
    { key: 'active_contacts', label: 'Active Contacts', sortable: true },
    { key: 'completion_rate', label: 'Completion Rate', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Enhanced filter fields
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Search Journeys', type: 'search' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'draft', label: 'Draft' }
    ]},
    { key: 'trigger_conditions', label: 'Trigger Type', type: 'select', options: [
        { value: '', label: 'All Triggers' },
        ...Array.from(new Set(journeys.map(item => item.trigger_conditions).filter(Boolean))).map(val => ({ value: val!, label: val! }))
      ]}
  ]

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Customer Journeys.</p>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p>No organization context found. Please select an organization.</p>
      </div>
    )
  }

  return (
    <MobilePageLayout
      title="Customer Journeys"
      subtitle={`${journeys.length} journey flows orchestrated`}
      primaryColor="#9b59b6"
      accentColor="#8e44ad"
      showBackButton={false}
    >
      {/* Enterprise KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold" style={{ color: '#9b59b6' }}>{kpi.value}</p>
                <p className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.change}
                </p>
              </div>
              <kpi.icon className="h-8 w-8 text-gray-400" />
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Enhanced Filters */}
      <MobileFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        className="mb-6"
      />

      {/* Enterprise Data Table */}
      <MobileDataTable
        data={journeys}
        columns={columns}
        selectedRows={selectedJourneys}
        onRowSelect={setSelectedJourneys}
        onRowClick={(journey) => {
          setCurrentJourney(journey)
          setShowEditModal(true)
        }}
        showBulkActions={selectedJourneys.length > 0}
        bulkActions={[
          {
            label: 'Pause Selected',
            action: async () => {
              console.log('Pausing journeys:', selectedJourneys)
              setSelectedJourneys([])
            },
            variant: 'default'
          },
          {
            label: 'Delete Selected',
            action: async () => {
              console.log('Deleting journeys:', selectedJourneys)
              setSelectedJourneys([])
            },
            variant: 'destructive'
          }
        ]}
        mobileCardRender={(journey) => (
          <MobileCard key={journey.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{journey.entity_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{journey.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Toggle journey active/paused
                    console.log('Toggle journey:', journey.id)
                  }}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Play className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentJourney(journey)
                    setShowEditModal(true)
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setJourneyToDelete(journey)
                    setShowDeleteModal(true)
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Journey status and metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Trigger:</span>
                <div className="font-medium">{journey.trigger_conditions}</div>
              </div>
              <div>
                <span className="text-gray-500">Steps:</span>
                <div className="font-medium">{journey.journey_steps}</div>
              </div>
              <div>
                <span className="text-gray-500">Active:</span>
                <div className="font-medium text-blue-600">{journey.active_contacts}</div>
              </div>
              <div>
                <span className="text-gray-500">Completion:</span>
                <div className="font-medium text-green-600">{journey.completion_rate}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 mt-3 pt-3 border-t flex justify-between">
              <span>Created: {journey.created_at ? new Date(journey.created_at).toLocaleDateString() : 'N/A'}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                journey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {journey.status}
              </span>
            </div>
          </MobileCard>
        )}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 text-white rounded-full p-4 shadow-lg transition-colors z-50 hover:shadow-xl"
        style={{ backgroundColor: '#9b59b6' }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Placeholder modals - would be implemented with full journey builder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Create New Journey</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Visual Journey Builder</p>
              <p className="text-sm text-gray-500">Drag & drop interface for creating multi-channel customer journeys with conditional logic and automation rules.</p>
              <button
                onClick={() => setShowAddModal(false)}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Launch Journey Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </MobilePageLayout>
  )
}