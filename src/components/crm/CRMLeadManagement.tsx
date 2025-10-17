'use client'

import React, { useState } from 'react'
import { 
  Target, 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal,
  ArrowUpDown,
  Download,
  Trash2,
  Edit3,
  Users,
  TrendingUp,
  CheckCircle,
  Star
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileModal } from '@/components/mobile'
import { CRMLeadCard, CRMLeadListItem, type CRMLead } from './CRMLeadCard'
import { CRMLeadForm, CRMLeadFormCompact } from './forms/CRMLeadForm'
import { useCRMLeads, useConvertLead } from '@/hooks/useCRM'
import { CRM_STATUS_VALUES } from '@/lib/crm/smart-codes'

export interface CRMLeadManagementProps {
  className?: string
}

type LeadViewMode = 'cards' | 'list'
type LeadFilter = 'all' | 'new' | 'qualified' | 'hot'
type LeadSort = 'name' | 'created' | 'score' | 'budget'

export function CRMLeadManagement({ className = '' }: CRMLeadManagementProps) {
  const [viewMode, setViewMode] = useState<LeadViewMode>('cards')
  const [filter, setFilter] = useState<LeadFilter>('all')
  const [sortBy, setSortBy] = useState<LeadSort>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showNewLeadForm, setShowNewLeadForm] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState<CRMLead | null>(null)

  // Hooks
  const { data: leads = [], isLoading, error } = useCRMLeads()
  const convertLead = useConvertLead()

  // Transform universal entities to lead format
  const transformedLeads: CRMLead[] = leads.map(entity => ({
    id: entity.entity_id || '',
    entity_name: entity.entity_name,
    source: entity.dynamic_fields?.source?.value || 'Unknown',
    company: entity.dynamic_fields?.company?.value,
    email: entity.dynamic_fields?.email?.value,
    phone: entity.dynamic_fields?.phone?.value,
    status: entity.dynamic_fields?.status?.value,
    score: entity.dynamic_fields?.score?.value,
    budget: entity.dynamic_fields?.budget?.value,
    timeline: entity.dynamic_fields?.timeline?.value,
    created_date: entity.created_at,
    last_activity_date: entity.updated_at,
    notes: entity.dynamic_fields?.notes?.value
  }))

  // Filter and sort leads
  const filteredLeads = transformedLeads
    .filter(lead => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          lead.entity_name.toLowerCase().includes(query) ||
          lead.company?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.source.toLowerCase().includes(query)
        
        if (!matchesSearch) return false
      }

      // Status filter
      switch (filter) {
        case 'new':
          return lead.status === 'New'
        case 'qualified':
          return lead.status === 'Qualified'
        case 'hot':
          return (lead.score && lead.score >= 80) || lead.status === 'Qualified'
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.entity_name.localeCompare(b.entity_name)
        case 'score':
          return (b.score || 0) - (a.score || 0)
        case 'budget':
          return (b.budget || 0) - (a.budget || 0)
        case 'created':
        default:
          return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
      }
    })

  // Get summary stats
  const stats = {
    total: transformedLeads.length,
    new: transformedLeads.filter(l => l.status === 'New').length,
    qualified: transformedLeads.filter(l => l.status === 'Qualified').length,
    hot: transformedLeads.filter(l => (l.score && l.score >= 80) || l.status === 'Qualified').length
  }

  // Handle lead actions
  const handleSelectLead = (lead: CRMLead) => {
    setSelectedLeads(prev => 
      prev.includes(lead.id) 
        ? prev.filter(id => id !== lead.id)
        : [...prev, lead.id]
    )
  }

  const handleSelectAllLeads = () => {
    setSelectedLeads(
      selectedLeads.length === filteredLeads.length 
        ? [] 
        : filteredLeads.map(lead => lead.id)
    )
  }

  const handleConvertLead = (lead: CRMLead) => {
    setShowConversionModal(lead)
  }

  const handleConfirmConversion = async (lead: CRMLead) => {
    try {
      await convertLead.mutateAsync({
        leadId: lead.id,
        conversionData: {
          createAccount: true,
          accountName: lead.company || `${lead.entity_name} Company`,
          createContact: true,
          contactName: lead.entity_name,
          createOpportunity: true,
          opportunityName: `${lead.entity_name} - ${lead.company || 'Opportunity'}`,
          opportunityAmount: lead.budget
        }
      })
      
      setShowConversionModal(null)
    } catch (error) {
      console.error('Failed to convert lead:', error)
    }
  }

  const handleNewLeadCreated = (leadId: string) => {
    setShowNewLeadForm(false)
    // The query will automatically refetch due to the mutation
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Failed to load leads. Please try again.</div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600">Manage your sales prospects</p>
            </div>
          </div>

          <MobileButton
            onClick={() => setShowNewLeadForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Lead
          </MobileButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Total Leads</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">New Leads</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Qualified</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.qualified}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Hot Leads</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.hot}</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <MobileInput
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <MobileSelect
              value={filter}
              onChange={(e) => setFilter(e.target.value as LeadFilter)}
              className="w-full sm:w-32"
            >
              <option value="all">All Leads</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="hot">Hot Leads</option>
            </MobileSelect>

            <MobileSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LeadSort)}
              className="w-full sm:w-32"
            >
              <option value="created">Latest</option>
              <option value="name">Name</option>
              <option value="score">Score</option>
              <option value="budget">Budget</option>
            </MobileSelect>

            <div className="flex gap-2">
              <MobileButton
                variant="outline"
                size="small"
                icon={<Filter className="w-4 h-4" />}
              >
                Filter
              </MobileButton>
              
              <MobileButton
                variant="outline"
                size="small"
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </MobileButton>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <MobileButton
                size="small"
                variant="outline"
                icon={<Edit3 className="w-4 h-4" />}
              >
                Bulk Edit
              </MobileButton>
              <MobileButton
                size="small"
                variant="outline"
                icon={<Trash2 className="w-4 h-4" />}
                className="text-red-600 hover:bg-red-50"
              >
                Delete
              </MobileButton>
            </div>
          </div>
        )}
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading leads...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filter !== 'all' 
                ? 'No leads match your current filters'
                : 'Start by creating your first lead'
              }
            </p>
            {(!searchQuery && filter === 'all') && (
              <MobileButton
                onClick={() => setShowNewLeadForm(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Create First Lead
              </MobileButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Header for list view */}
            {viewMode === 'list' && (
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length}
                    onChange={handleSelectAllLeads}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </label>
                <div className="text-sm text-gray-600">
                  {filteredLeads.length} lead{filteredLeads.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Leads */}
            <div className={viewMode === 'cards' ? 'p-4 space-y-4' : 'divide-y divide-gray-200'}>
              {filteredLeads.map((lead) => (
                viewMode === 'cards' ? (
                  <CRMLeadCard
                    key={lead.id}
                    lead={lead}
                    onConvert={handleConvertLead}
                    onCall={(lead) => console.log('Call', lead)}
                    onEmail={(lead) => console.log('Email', lead)}
                    onViewDetails={(lead) => console.log('View details', lead)}
                  />
                ) : (
                  <div key={lead.id} className="p-4">
                    <CRMLeadListItem
                      lead={lead}
                      selected={selectedLeads.includes(lead.id)}
                      onSelect={handleSelectLead}
                      onConvert={handleConvertLead}
                      onCall={(lead) => console.log('Call', lead)}
                      onEmail={(lead) => console.log('Email', lead)}
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      <MobileModal
        isOpen={showNewLeadForm}
        onClose={() => setShowNewLeadForm(false)}
        title="Create New Lead"
        size="large"
      >
        <CRMLeadForm
          onSubmit={handleNewLeadCreated}
          onCancel={() => setShowNewLeadForm(false)}
        />
      </MobileModal>

      {/* Conversion Modal */}
      <MobileModal
        isOpen={!!showConversionModal}
        onClose={() => setShowConversionModal(null)}
        title="Convert Lead"
        size="medium"
      >
        {showConversionModal && (
          <div className="space-y-4">
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Convert {showConversionModal.entity_name}
              </h3>
              <p className="text-gray-600">
                This will create an account, contact, and opportunity from this qualified lead.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium text-gray-700 mb-2">Will create:</div>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Account: {showConversionModal.company || `${showConversionModal.entity_name} Company`}
                  </li>
                  <li className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Contact: {showConversionModal.entity_name}
                  </li>
                  <li className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Opportunity: {showConversionModal.budget ? `$${showConversionModal.budget.toLocaleString()}` : 'TBD'}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <MobileButton
                onClick={() => handleConfirmConversion(showConversionModal)}
                loading={convertLead.isPending}
                className="flex-1"
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Convert Lead
              </MobileButton>
              <MobileButton
                variant="outline"
                onClick={() => setShowConversionModal(null)}
                disabled={convertLead.isPending}
              >
                Cancel
              </MobileButton>
            </div>
          </div>
        )}
      </MobileModal>
    </div>
  )
}