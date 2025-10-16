'use client'

import React, { useState } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Edit,
  Trash2,
  X,
  Save,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'

interface Lead extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  // Dynamic fields (stored in core_dynamic_data)
  email?: string
  phone?: string
  company?: string
  source?: string
  score?: number
  owner?: string
  created_at?: string
  updated_at?: string
}

// HERA Lead Smart Codes
const LEAD_SMART_CODES = {
  ENTITY: 'HERA.CRM.LEAD.ENTITY.PROSPECT.V1',
  FIELD_EMAIL: 'HERA.CRM.LEAD.DYN.EMAIL.V1',
  FIELD_PHONE: 'HERA.CRM.LEAD.DYN.PHONE.V1',
  FIELD_COMPANY: 'HERA.CRM.LEAD.DYN.COMPANY.V1',
  FIELD_SOURCE: 'HERA.CRM.LEAD.DYN.SOURCE.V1',
  FIELD_SCORE: 'HERA.CRM.LEAD.DYN.SCORE.V1',
  FIELD_OWNER: 'HERA.CRM.LEAD.DYN.OWNER.V1'
} as const

export default function LeadsPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [selectedLeads, setSelectedLeads] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentLead, setCurrentLead] = useState<Lead | null>(null)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    // Add filter fields based on dynamic fields
    email: '',
    phone: '',
    company: ''
  })

  // Use Universal Entity hook for Lead management
  const leadData = useUniversalEntity({
    entity_type: 'LEAD',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      status: 'active'
    },
    dynamicFields: [
      { name: 'email', type: 'email', smart_code: 'HERA.CRM.LEAD.DYN.EMAIL.V1', required: true },
      { name: 'phone', type: 'phone', smart_code: 'HERA.CRM.LEAD.DYN.PHONE.V1', required: false },
      { name: 'company', type: 'text', smart_code: 'HERA.CRM.LEAD.DYN.COMPANY.V1', required: true },
      { name: 'source', type: 'text', smart_code: 'HERA.CRM.LEAD.DYN.SOURCE.V1', required: true },
      { name: 'score', type: 'number', smart_code: 'HERA.CRM.LEAD.DYN.SCORE.V1', required: false },
      { name: 'owner', type: 'text', smart_code: 'HERA.CRM.LEAD.DYN.OWNER.V1', required: true }
    ]
  })

  // Transform universal entities to Lead interface
  const leads: Lead[] = leadData.entities?.map((entity: any) => {
    console.log('Transforming entity:', entity) // Debug log
    
    return {
      id: entity.id,
      entity_id: entity.id,
      entity_name: entity.entity_name || '',
      smart_code: entity.smart_code || '',
      status: entity.status || 'active',
      // Map dynamic fields
      email: entity.dynamic_data?.find((d: any) => d.field_name === 'email')?.field_value_text || '',
      phone: entity.dynamic_data?.find((d: any) => d.field_name === 'phone')?.field_value_text || '',
      company: entity.dynamic_data?.find((d: any) => d.field_name === 'company')?.field_value_text || '',
      source: entity.dynamic_data?.find((d: any) => d.field_name === 'source')?.field_value_text || '',
      score: entity.dynamic_data?.find((d: any) => d.field_name === 'score')?.field_value_number || 0,
      owner: entity.dynamic_data?.find((d: any) => d.field_name === 'owner')?.field_value_text || '',
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }
  }) || []

  // KPI calculations
  const kpis = [
    {
      title: 'Total Leads',
      value: leads.length.toString(),
      change: '+5.2%',
      trend: 'up' as const,
      icon: Target
    },
    {
      title: 'Active Leads',
      value: leads.filter(item => item.status === 'active').length.toString(),
      change: '+2.1%',
      trend: 'up' as const,
      icon: TrendingUp
    },
    {
      title: 'This Month',
      value: leads.filter(item => {
        if (!item.created_at) return false
        const created = new Date(item.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length.toString(),
      change: '+8.3%',
      trend: 'up' as const,
      icon: TrendingUp
    }
  ]

  // Table columns configuration
  const columns: TableColumn[] = [
    { key: 'entity_name', label: 'Lead Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'company', label: 'Company', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Filter fields configuration
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Search Leads', type: 'search' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]},
    
  ]

  // CRUD Operations
  const handleAddLead = async (leadData: any) => {
    try {
      await leadData.create({
        entity_type: 'LEAD',
        entity_name: leadData.entity_name,
        smart_code: LEAD_SMART_CODES.ENTITY,
        organization_id: currentOrganization?.id
      }, leadData)
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding lead:', error)
    }
  }

  const handleEditLead = async (leadData: any) => {
    if (!currentLead) return
    
    try {
      await leadData.update(currentLead.entity_id!, {
        entity_name: leadData.entity_name
      }, leadData)
      setShowEditModal(false)
      setCurrentLead(null)
    } catch (error) {
      console.error('Error updating lead:', error)
    }
  }

  const handleDeleteLead = async () => {
    if (!leadToDelete) return
    
    try {
      await leadData.delete(leadToDelete.entity_id!)
      setShowDeleteModal(false)
      setLeadToDelete(null)
    } catch (error) {
      console.error('Error deleting lead:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedLeads) {
        await leadData.delete(id.toString())
      }
      setSelectedLeads([])
    } catch (error) {
      console.error('Error bulk deleting leads:', error)
    }
  }

  // Loading and auth checks
  if (!isAuthenticated) {
    return <div className="p-4 text-center">Please log in to access Leads.</div>
  }

  if (leadData.contextLoading) {
    return <div className="p-4 text-center">Loading Leads...</div>
  }

  if (!currentOrganization) {
    return <div className="p-4 text-center">No organization context found.</div>
  }

  return (
    <MobilePageLayout
      title="Leads"
      subtitle={`${leads.length} total leads`}
      primaryColor="#d83b01"
      accentColor="#a62d01"
      showBackButton={false}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className={`text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.change}
                </p>
              </div>
              <kpi.icon className="h-8 w-8 text-gray-400" />
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Filters */}
      <MobileFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        className="mb-6"
      />

      {/* Data Table */}
      <MobileDataTable
        data={leads}
        columns={columns}
        selectedRows={selectedLeads}
        onRowSelect={setSelectedLeads}
        onRowClick={(lead) => {
          setCurrentLead(lead)
          setShowEditModal(true)
        }}
        showBulkActions={selectedLeads.length > 0}
        bulkActions={[
          {
            label: 'Delete Selected',
            action: handleBulkDelete,
            variant: 'destructive'
          }
        ]}
        mobileCardRender={(lead) => (
          <MobileCard key={lead.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{lead.entity_name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrentLead(lead)
                    setShowEditModal(true)
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setLeadToDelete(lead)
                    setShowDeleteModal(true)
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Email:</span> {lead.email || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Company:</span> {lead.company || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Lead Source:</span> {lead.source || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Lead Score:</span> {lead.score || 'N/A'}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Created: {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </MobileCard>
        )}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Lead Modal */}
      {showAddModal && (
        <LeadModal
          title="Add New Lead"
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddLead}
          dynamicFields={leadData.dynamicFieldsConfig || []}
        />
      )}

      {/* Edit Lead Modal */}
      {showEditModal && currentLead && (
        <LeadModal
          title="Edit Lead"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setCurrentLead(null)
          }}
          onSave={handleEditLead}
          initialData={currentLead}
          dynamicFields={leadData.dynamicFieldsConfig || []}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && leadToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Lead</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{leadToDelete.entity_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setLeadToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MobilePageLayout>
  )
}

// Modal Component for Add/Edit
interface LeadModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: Lead
  dynamicFields: any[]
}

function LeadModal({ title, isOpen, onClose, onSave, initialData, dynamicFields }: LeadModalProps) {
  const [formData, setFormData] = useState(() => {
    const initial: any = { entity_name: initialData?.entity_name || '' }
    dynamicFields.forEach(field => {
      initial[field.name] = initialData?.[field.name as keyof Lead] || (field.type === 'number' ? 0 : '')
    })
    return initial
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Entity Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Name *
              </label>
              <input
                type="text"
                value={formData.entity_name}
                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Dynamic Fields */}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone 
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Source *
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Score 
              </label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner *
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}