'use client'

import React, { useState, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Building2,
  User,
  Calendar,
  Percent,
  BarChart3,
  Eye,
  Edit,
  Clock
} from 'lucide-react'

interface Opportunity extends TableRecord {
  id: string
  name: string
  account: string
  amount: number
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
  probability: number
  owner: string
  closeDate: string
  createdDate: string
  lastActivity: string
  source: string
  industry: string
  contactName: string
}

export default function OpportunitiesPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOpportunities, setSelectedOpportunities] = useState<(string | number)[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [filters, setFilters] = useState({
    stage: '',
    owner: '',
    probability: '',
    closeDate: '',
    search: ''
  })

  // Sample opportunities data
  const sampleOpportunities: Opportunity[] = [
    {
      id: 'OPP-001',
      name: 'Enterprise Software License',
      account: 'Acme Corporation',
      amount: 250000,
      stage: 'Negotiation',
      probability: 80,
      owner: 'Sarah Wilson',
      closeDate: '2024-02-15',
      createdDate: '2024-01-10',
      lastActivity: '2024-01-20',
      source: 'Inbound',
      industry: 'Technology',
      contactName: 'John Smith'
    },
    {
      id: 'OPP-002',
      name: 'Manufacturing Equipment',
      account: 'Global Manufacturing Inc',
      amount: 450000,
      stage: 'Proposal',
      probability: 65,
      owner: 'Mike Johnson',
      closeDate: '2024-03-01',
      createdDate: '2024-01-05',
      lastActivity: '2024-01-19',
      source: 'Referral',
      industry: 'Manufacturing',
      contactName: 'Maria Rodriguez'
    },
    {
      id: 'OPP-003',
      name: 'Healthcare System Upgrade',
      account: 'Healthcare Solutions LLC',
      amount: 180000,
      stage: 'Qualification',
      probability: 45,
      owner: 'Alex Chen',
      closeDate: '2024-02-28',
      createdDate: '2024-01-08',
      lastActivity: '2024-01-18',
      source: 'Trade Show',
      industry: 'Healthcare',
      contactName: 'David Chen'
    },
    {
      id: 'OPP-004',
      name: 'Retail POS System',
      account: 'Retail Chain Co',
      amount: 320000,
      stage: 'Closed Won',
      probability: 100,
      owner: 'Sarah Wilson',
      closeDate: '2024-01-15',
      createdDate: '2023-12-01',
      lastActivity: '2024-01-15',
      source: 'Cold Call',
      industry: 'Retail',
      contactName: 'Lisa Park'
    },
    {
      id: 'OPP-005',
      name: 'Cloud Infrastructure',
      account: 'TechStartup Inc',
      amount: 95000,
      stage: 'Prospecting',
      probability: 25,
      owner: 'Mike Johnson',
      closeDate: '2024-04-01',
      createdDate: '2024-01-15',
      lastActivity: '2024-01-17',
      source: 'Website',
      industry: 'Technology',
      contactName: 'Robert Johnson'
    }
  ]

  // Filter fields
  const filterFields: FilterField[] = [
    {
      key: 'stage',
      label: 'Stage',
      type: 'select',
      placeholder: 'All Stages',
      options: [
        { value: 'prospecting', label: 'Prospecting' },
        { value: 'qualification', label: 'Qualification' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'negotiation', label: 'Negotiation' },
        { value: 'closed-won', label: 'Closed Won' },
        { value: 'closed-lost', label: 'Closed Lost' }
      ],
      value: filters.stage,
      onChange: (value) => setFilters(prev => ({ ...prev, stage: value }))
    },
    {
      key: 'owner',
      label: 'Owner',
      type: 'select',
      placeholder: 'All Owners',
      options: [
        { value: 'sarah', label: 'Sarah Wilson' },
        { value: 'mike', label: 'Mike Johnson' },
        { value: 'alex', label: 'Alex Chen' }
      ],
      value: filters.owner,
      onChange: (value) => setFilters(prev => ({ ...prev, owner: value }))
    },
    {
      key: 'probability',
      label: 'Probability',
      type: 'select',
      placeholder: 'All Probabilities',
      options: [
        { value: 'high', label: 'High (70%+)' },
        { value: 'medium', label: 'Medium (30-70%)' },
        { value: 'low', label: 'Low (<30%)' }
      ],
      value: filters.probability,
      onChange: (value) => setFilters(prev => ({ ...prev, probability: value }))
    },
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search opportunities...',
      value: filters.search,
      onChange: (value) => setFilters(prev => ({ ...prev, search: value }))
    }
  ]

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Opportunity',
      render: (value, record) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {value}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {record.account}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (value) => (
        <div className="text-right">
          <div className="font-medium">${(value / 1000).toFixed(0)}K</div>
        </div>
      )
    },
    {
      key: 'stage',
      label: 'Stage',
      align: 'center',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Closed Won' ? 'bg-green-100 text-green-800' :
          value === 'Closed Lost' ? 'bg-red-100 text-red-800' :
          value === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
          value === 'Proposal' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Qualification' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'probability',
      label: 'Probability',
      align: 'center',
      render: (value) => (
        <div className="flex items-center justify-center">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                value >= 70 ? 'bg-green-500' :
                value >= 30 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 ml-2">{value}%</span>
        </div>
      )
    },
    {
      key: 'closeDate',
      label: 'Close Date',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-3 h-3 text-gray-400" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
            {value.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <span className="text-sm">{value}</span>
        </div>
      )
    }
  ]

  // Mobile card renderer
  const mobileCardRender = (record: Opportunity) => (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-blue-600 cursor-pointer hover:text-blue-800">
            {record.name}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {record.account}
          </p>
          <p className="text-xs text-gray-500">Contact: {record.contactName}</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-gray-900">${(record.amount / 1000).toFixed(0)}K</div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            record.stage === 'Closed Won' ? 'bg-green-100 text-green-800' :
            record.stage === 'Closed Lost' ? 'bg-red-100 text-red-800' :
            record.stage === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
            record.stage === 'Proposal' ? 'bg-yellow-100 text-yellow-800' :
            record.stage === 'Qualification' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {record.stage}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Probability</div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  record.probability >= 70 ? 'bg-green-500' :
                  record.probability >= 30 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${record.probability}%` }}
              />
            </div>
            <span className="text-sm font-medium">{record.probability}%</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Close Date</div>
          <div className="font-medium">{new Date(record.closeDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Owner</div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
              {record.owner.split(' ').map(n => n[0]).join('')}
            </div>
            {record.owner}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Source</div>
          <div className="font-medium">{record.source}</div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button className="flex-1 text-sm text-blue-600 hover:text-blue-800 py-2 px-3 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
          <Eye className="w-4 h-4" />
          View
        </button>
        <button className="flex-1 text-sm text-gray-600 hover:text-gray-800 py-2 px-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button className="flex-1 text-sm text-green-600 hover:text-green-800 py-2 px-3 border border-green-200 rounded hover:bg-green-50 transition-colors flex items-center justify-center gap-1">
          <TrendingUp className="w-4 h-4" />
          Move Stage
        </button>
      </div>
    </div>
  )

  // Kanban columns
  const kanbanStages = [
    { id: 'prospecting', name: 'Prospecting', color: 'border-gray-300' },
    { id: 'qualification', name: 'Qualification', color: 'border-blue-300' },
    { id: 'proposal', name: 'Proposal', color: 'border-yellow-300' },
    { id: 'negotiation', name: 'Negotiation', color: 'border-orange-300' },
    { id: 'closed-won', name: 'Closed Won', color: 'border-green-300' },
    { id: 'closed-lost', name: 'Closed Lost', color: 'border-red-300' }
  ]

  // KPI data
  const kpiData = {
    totalPipelineValue: sampleOpportunities.filter(o => !o.stage.includes('Closed')).reduce((sum, opp) => sum + opp.amount, 0),
    openDeals: sampleOpportunities.filter(o => !o.stage.includes('Closed')).length,
    winRate: Math.round((sampleOpportunities.filter(o => o.stage === 'Closed Won').length / sampleOpportunities.filter(o => o.stage.includes('Closed')).length) * 100) || 0,
    avgDealCycle: 45 // days
  }

  // Chart data
  const pipelineChartData = [
    { name: 'Prospecting', value: 95000, color: '#6b7280' },
    { name: 'Qualification', value: 180000, color: '#3b82f6' },
    { name: 'Proposal', value: 450000, color: '#f59e0b' },
    { name: 'Negotiation', value: 250000, color: '#ea580c' }
  ]

  const forecastData = [
    { month: 'Feb', forecast: 320000, target: 400000 },
    { month: 'Mar', forecast: 450000, target: 500000 },
    { month: 'Apr', forecast: 380000, target: 450000 },
    { month: 'May', forecast: 520000, target: 600000 }
  ]

  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      setOpportunities(sampleOpportunities)
    }
  }, [isAuthenticated, currentOrganization])

  const handleApplyFilters = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setOpportunities(sampleOpportunities)
      setLoading(false)
    }, 1000)
  }

  const renderKanbanView = () => (
    <div className="px-3 sm:px-6">
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ minWidth: '1200px' }}>
          {kanbanStages.map((stage) => {
            const stageOpps = opportunities.filter(opp => 
              opp.stage.toLowerCase().replace(' ', '-') === stage.id
            )
            const stageValue = stageOpps.reduce((sum, opp) => sum + opp.amount, 0)

            return (
              <div key={stage.id} className={`flex-1 min-w-[280px] bg-white rounded-lg border-2 ${stage.color} shadow-sm`}>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">{stage.name}</h3>
                  <p className="text-sm text-gray-500">
                    {stageOpps.length} deals • ${(stageValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="p-2 space-y-3 max-h-96 overflow-y-auto">
                  {stageOpps.map((opp) => (
                    <div key={opp.id} className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-sm text-blue-600 mb-1">{opp.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{opp.account}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-600">${(opp.amount / 1000).toFixed(0)}K</span>
                        <span className="text-xs text-gray-500">{opp.probability}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                          {opp.owner.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs text-gray-600">{opp.owner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <MobilePageLayout title="HERA" breadcrumb="CRM / Opportunities Pipeline">
      <MobileFilters 
        title="Opportunity Filters"
        fields={filterFields}
        onApply={handleApplyFilters}
        onAdaptFilters={() => console.log('Adapt filters')}
      />

      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MobileCard 
            title="Pipeline Value"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">${(kpiData.totalPipelineValue / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600">Total pipeline</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Open Deals"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.openDeals}</div>
                <div className="text-sm text-gray-600">Active opportunities</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Win Rate"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.winRate}%</div>
                <div className="text-sm text-gray-600">Success rate</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Percent className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Avg Deal Cycle"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.avgDealCycle}</div>
                <div className="text-sm text-gray-600">Days to close</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileChart 
            title="Pipeline by Stage"
            type="bar"
            data={pipelineChartData}
            height="300"
          />
          <MobileChart 
            title="Forecast by Month"
            type="line"
            data={forecastData}
            height="300"
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-3 sm:px-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'kanban' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Kanban View
          </button>
        </div>
      </div>

      {/* Table or Kanban View */}
      {viewMode === 'kanban' ? (
        renderKanbanView()
      ) : (
        <div className="px-3 sm:px-6 pb-6">
          <MobileDataTable
            title={`Opportunities (${opportunities.length})`}
            subtitle="Manage your sales opportunities and pipeline"
            columns={columns}
            data={opportunities}
            loading={loading}
            selectable={true}
            selectedRows={selectedOpportunities}
            onRowSelect={setSelectedOpportunities}
            mobileCardRender={mobileCardRender}
            actions={
              <div className="flex gap-2">
                <button className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                  Export
                </button>
                <button className="text-sm text-green-600 hover:text-green-800 px-3 py-2 border border-green-200 rounded hover:bg-green-50 transition-colors">
                  Bulk Update
                </button>
              </div>
            }
          />
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center min-w-[56px] min-h-[56px]">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </MobilePageLayout>
  )
}