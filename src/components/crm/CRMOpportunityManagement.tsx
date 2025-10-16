'use client'

import React, { useState } from 'react'
import { 
  Target, 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal,
  Download,
  Edit3,
  Trash2,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  ArrowRight,
  Eye
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileModal } from '@/components/mobile'
import { CRMPipelineKanban, CRMPipelineMobile, type CRMOpportunity, type CRMPipelineStage } from './CRMPipelineKanban'
import { CRMOpportunityForm } from './forms/CRMOpportunityForm'
import { useCRMOpportunities, useMoveOpportunityStage } from '@/hooks/useCRM'
import { CRM_STATUS_VALUES } from '@/lib/crm/smart-codes'

export interface CRMOpportunityManagementProps {
  className?: string
}

type ViewMode = 'pipeline' | 'list' | 'table'
type OpportunityFilter = 'all' | 'open' | 'won' | 'lost' | 'hot' | 'overdue'
type OpportunitySort = 'name' | 'created' | 'amount' | 'close_date' | 'probability' | 'stage'

export function CRMOpportunityManagement({ className = '' }: CRMOpportunityManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline')
  const [filter, setFilter] = useState<OpportunityFilter>('all')
  const [sortBy, setSortBy] = useState<OpportunitySort>('close_date')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])
  const [showNewOpportunityForm, setShowNewOpportunityForm] = useState(false)

  // Hooks
  const { data: opportunities = [], isLoading, error } = useCRMOpportunities()
  const moveStage = useMoveOpportunityStage()

  // Transform opportunities for pipeline view
  const transformedOpportunities: CRMOpportunity[] = opportunities.map(entity => ({
    id: entity.entity_id || '',
    entity_name: entity.entity_name,
    amount: entity.dynamic_fields?.amount?.value || 0,
    currency: 'USD',
    probability: entity.dynamic_fields?.probability?.value || 0,
    close_date: entity.dynamic_fields?.close_date?.value || '',
    stage: entity.dynamic_fields?.stage?.value || 'Prospecting',
    source: entity.dynamic_fields?.source?.value,
    next_step: entity.dynamic_fields?.next_step?.value,
    // These would come from relationships in a real implementation
    account_name: 'Sample Account', // TODO: Get from relationships
    contact_name: 'Sample Contact', // TODO: Get from relationships
    owner_name: 'Current User', // TODO: Get from user context
    last_activity_date: entity.updated_at
  }))

  // Filter opportunities
  const filteredOpportunities = transformedOpportunities.filter(opp => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        opp.entity_name.toLowerCase().includes(query) ||
        opp.account_name?.toLowerCase().includes(query) ||
        opp.contact_name?.toLowerCase().includes(query) ||
        opp.stage.toLowerCase().includes(query)
      
      if (!matchesSearch) return false
    }

    // Status filter
    switch (filter) {
      case 'open':
        return !['Closed Won', 'Closed Lost'].includes(opp.stage)
      case 'won':
        return opp.stage === 'Closed Won'
      case 'lost':
        return opp.stage === 'Closed Lost'
      case 'hot':
        return opp.probability >= 80 && !['Closed Won', 'Closed Lost'].includes(opp.stage)
      case 'overdue':
        return new Date(opp.close_date) < new Date() && !['Closed Won', 'Closed Lost'].includes(opp.stage)
      default:
        return true
    }
  })

  // Group opportunities by stage for pipeline view
  const pipelineStages: CRMPipelineStage[] = Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES).map((stageName, index) => {
    const stageOpportunities = filteredOpportunities.filter(opp => opp.stage === stageName)
    
    // Stage colors
    const colors = [
      '#3b82f6', // blue
      '#f59e0b', // yellow
      '#f97316', // orange
      '#8b5cf6', // purple
      '#6366f1', // indigo
      '#10b981', // emerald
      '#059669', // green
      '#dc2626'  // red
    ]
    
    return {
      id: stageName.toLowerCase().replace(/\s+/g, '-'),
      name: stageName,
      probability: getStageProbability(stageName),
      color: colors[index % colors.length],
      order: index,
      opportunities: stageOpportunities
    }
  })

  // Calculate summary stats
  const stats = {
    total: transformedOpportunities.length,
    open: transformedOpportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).length,
    won: transformedOpportunities.filter(o => o.stage === 'Closed Won').length,
    lost: transformedOpportunities.filter(o => o.stage === 'Closed Lost').length,
    totalValue: transformedOpportunities.reduce((sum, o) => sum + o.amount, 0),
    weightedValue: transformedOpportunities.reduce((sum, o) => sum + (o.amount * o.probability / 100), 0),
    avgDealSize: transformedOpportunities.length > 0 ? transformedOpportunities.reduce((sum, o) => sum + o.amount, 0) / transformedOpportunities.length : 0,
    conversionRate: transformedOpportunities.length > 0 ? (stats?.won || 0) / transformedOpportunities.length * 100 : 0
  }

  // Handle opportunity actions
  const handleOpportunityMove = async (opportunityId: string, fromStage: string, toStage: string) => {
    try {
      await moveStage.mutateAsync({
        opportunityId,
        newStage: toStage
      })
    } catch (error) {
      console.error('Failed to move opportunity:', error)
    }
  }

  const handleOpportunityClick = (opportunity: CRMOpportunity) => {
    console.log('View opportunity details:', opportunity)
  }

  const handleAddOpportunity = (stageId: string) => {
    setShowNewOpportunityForm(true)
  }

  const handleNewOpportunityCreated = (opportunityId: string) => {
    setShowNewOpportunityForm(false)
  }

  function getStageProbability(stage: string): number {
    const probabilities: Record<string, number> = {
      'Prospecting': 10,
      'Qualification': 25,
      'Needs Analysis': 40,
      'Value Proposition': 60,
      'Proposal': 75,
      'Negotiation': 90,
      'Closed Won': 100,
      'Closed Lost': 0
    }
    return probabilities[stage] || 50
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Failed to load opportunities. Please try again.</div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
              <p className="text-gray-600">Track and manage your opportunities</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  viewMode === 'pipeline'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  viewMode === 'list'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
              </button>
            </div>

            <MobileButton
              onClick={() => setShowNewOpportunityForm(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              New Opportunity
            </MobileButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Total Pipeline</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(stats.totalValue)}
            </div>
            <div className="text-sm text-gray-600">{stats.total} opportunities</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Weighted Pipeline</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(stats.weightedValue)}
            </div>
            <div className="text-sm text-gray-600">Probability adjusted</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Avg Deal Size</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(stats.avgDealSize)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">{stats.won} won / {stats.total} total</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <MobileInput
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <MobileSelect
              value={filter}
              onChange={(e) => setFilter(e.target.value as OpportunityFilter)}
              className="w-full sm:w-36"
            >
              <option value="all">All Opportunities</option>
              <option value="open">Open</option>
              <option value="won">Closed Won</option>
              <option value="lost">Closed Lost</option>
              <option value="hot">Hot (80%+)</option>
              <option value="overdue">Overdue</option>
            </MobileSelect>

            <MobileSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as OpportunitySort)}
              className="w-full sm:w-32"
            >
              <option value="close_date">Close Date</option>
              <option value="amount">Amount</option>
              <option value="probability">Probability</option>
              <option value="stage">Stage</option>
              <option value="name">Name</option>
              <option value="created">Created</option>
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
      </div>

      {/* Pipeline/List View */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading opportunities...</div>
        </div>
      ) : viewMode === 'pipeline' ? (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Desktop Kanban */}
          <div className="hidden lg:block">
            <CRMPipelineKanban
              stages={pipelineStages}
              onOpportunityMove={handleOpportunityMove}
              onOpportunityClick={handleOpportunityClick}
              onAddOpportunity={handleAddOpportunity}
              loading={moveStage.isPending}
            />
          </div>

          {/* Mobile Pipeline View */}
          <div className="lg:hidden">
            <CRMPipelineMobile
              stages={pipelineStages}
              onOpportunityClick={handleOpportunityClick}
              onAddOpportunity={handleAddOpportunity}
            />
          </div>
        </div>
      ) : (
        // List/Table View
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredOpportunities.length === 0 ? (
            <div className="p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filter !== 'all' 
                  ? 'No opportunities match your current filters'
                  : 'Start by creating your first opportunity'
                }
              </p>
              {(!searchQuery && filter === 'all') && (
                <MobileButton
                  onClick={() => setShowNewOpportunityForm(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create First Opportunity
                </MobileButton>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Table Header */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-4">Opportunity</div>
                  <div className="col-span-2">Stage</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Close Date</div>
                  <div className="col-span-1">Probability</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {filteredOpportunities
                  .sort((a, b) => {
                    switch (sortBy) {
                      case 'name':
                        return a.entity_name.localeCompare(b.entity_name)
                      case 'amount':
                        return b.amount - a.amount
                      case 'probability':
                        return b.probability - a.probability
                      case 'stage':
                        return a.stage.localeCompare(b.stage)
                      case 'close_date':
                      default:
                        return new Date(a.close_date).getTime() - new Date(b.close_date).getTime()
                    }
                  })
                  .map((opportunity) => (
                    <div key={opportunity.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Opportunity */}
                        <div className="col-span-4">
                          <div className="font-medium text-gray-900">{opportunity.entity_name}</div>
                          {opportunity.account_name && (
                            <div className="text-sm text-gray-600">{opportunity.account_name}</div>
                          )}
                        </div>

                        {/* Stage */}
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium`}>
                            {opportunity.stage}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="col-span-2">
                          <div className="font-medium text-gray-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0
                            }).format(opportunity.amount)}
                          </div>
                        </div>

                        {/* Close Date */}
                        <div className="col-span-2">
                          <div className={`text-sm ${
                            new Date(opportunity.close_date) < new Date() 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-600'
                          }`}>
                            {new Date(opportunity.close_date).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Probability */}
                        <div className="col-span-1">
                          <div className="text-sm font-medium text-gray-900">
                            {opportunity.probability}%
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <MobileButton
                            size="small"
                            variant="ghost"
                            onClick={() => handleOpportunityClick(opportunity)}
                            icon={<Eye className="w-4 h-4" />}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Opportunity Modal */}
      <MobileModal
        isOpen={showNewOpportunityForm}
        onClose={() => setShowNewOpportunityForm(false)}
        title="Create New Opportunity"
        size="large"
      >
        <CRMOpportunityForm
          onSubmit={handleNewOpportunityCreated}
          onCancel={() => setShowNewOpportunityForm(false)}
        />
      </MobileModal>
    </div>
  )
}