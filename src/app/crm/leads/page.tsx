'use client'

import React, { useState, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  UserPlus, 
  TrendingUp, 
  Target, 
  Plus, 
  Phone, 
  Mail,
  Building2,
  Star,
  ArrowRight,
  Globe,
  Users,
  Calendar
} from 'lucide-react'

interface Lead extends TableRecord {
  id: string
  name: string
  company: string
  email: string
  phone: string
  source: string
  status: 'New' | 'Qualified' | 'Converted' | 'Lost'
  score: number
  owner: string
  createdDate: string
  lastActivity: string
  industry: string
  estimatedValue: number
  notes?: string
}

export default function LeadsPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<(string | number)[]>([])
  const [filters, setFilters] = useState({
    source: '',
    owner: '',
    status: '',
    scoreRange: '',
    search: ''
  })

  // Sample leads data
  const sampleLeads: Lead[] = [
    {
      id: 'LEAD-001',
      name: 'Jennifer Williams',
      company: 'TechVision Corp',
      email: 'j.williams@techvision.com',
      phone: '+1-555-0111',
      source: 'Website',
      status: 'Qualified',
      score: 85,
      owner: 'Sarah Wilson',
      createdDate: '2024-01-18',
      lastActivity: '2024-01-20',
      industry: 'Technology',
      estimatedValue: 125000
    },
    {
      id: 'LEAD-002',
      name: 'Michael Brown',
      company: 'Future Industries',
      email: 'michael.b@futureindustries.com',
      phone: '+1-555-0222',
      source: 'LinkedIn',
      status: 'New',
      score: 72,
      owner: 'Mike Johnson',
      createdDate: '2024-01-17',
      lastActivity: '2024-01-19',
      industry: 'Manufacturing',
      estimatedValue: 95000
    },
    {
      id: 'LEAD-003',
      name: 'Sarah Davis',
      company: 'MedTech Solutions',
      email: 'sarah.davis@medtech.com',
      phone: '+1-555-0333',
      source: 'Referral',
      status: 'Qualified',
      score: 91,
      owner: 'Alex Chen',
      createdDate: '2024-01-15',
      lastActivity: '2024-01-18',
      industry: 'Healthcare',
      estimatedValue: 180000
    },
    {
      id: 'LEAD-004',
      name: 'Robert Garcia',
      company: 'Retail Dynamics',
      email: 'r.garcia@retaildynamics.com',
      phone: '+1-555-0444',
      source: 'Trade Show',
      status: 'Converted',
      score: 95,
      owner: 'Sarah Wilson',
      createdDate: '2024-01-10',
      lastActivity: '2024-01-16',
      industry: 'Retail',
      estimatedValue: 220000
    },
    {
      id: 'LEAD-005',
      name: 'Emily Taylor',
      company: 'StartupLab Inc',
      email: 'emily@startuplab.io',
      phone: '+1-555-0555',
      source: 'Cold Call',
      status: 'New',
      score: 58,
      owner: 'Mike Johnson',
      createdDate: '2024-01-12',
      lastActivity: '2024-01-15',
      industry: 'Technology',
      estimatedValue: 75000
    }
  ]

  // Filter fields
  const filterFields: FilterField[] = [
    {
      key: 'source',
      label: 'Lead Source',
      type: 'select',
      placeholder: 'All Sources',
      options: [
        { value: 'website', label: 'Website' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'referral', label: 'Referral' },
        { value: 'trade-show', label: 'Trade Show' },
        { value: 'cold-call', label: 'Cold Call' }
      ],
      value: filters.source,
      onChange: (value) => setFilters(prev => ({ ...prev, source: value }))
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
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Status',
      options: [
        { value: 'new', label: 'New' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'converted', label: 'Converted' },
        { value: 'lost', label: 'Lost' }
      ],
      value: filters.status,
      onChange: (value) => setFilters(prev => ({ ...prev, status: value }))
    },
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search leads...',
      value: filters.search,
      onChange: (value) => setFilters(prev => ({ ...prev, search: value }))
    }
  ]

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Lead',
      render: (value, record) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {value}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {record.company}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Contact',
      render: (value, record) => (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <Mail className="w-3 h-3 text-gray-400" />
            <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800 truncate">
              {value}
            </a>
          </div>
          <div className="flex items-center gap-1 text-sm mt-1">
            <Phone className="w-3 h-3 text-gray-400" />
            <a href={`tel:${record.phone}`} className="text-blue-600 hover:text-blue-800">
              {record.phone}
            </a>
          </div>
        </div>
      )
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Website' ? 'bg-blue-100 text-blue-800' :
          value === 'LinkedIn' ? 'bg-blue-100 text-blue-800' :
          value === 'Referral' ? 'bg-green-100 text-green-800' :
          value === 'Trade Show' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value === 'Website' && <Globe className="w-3 h-3 mr-1" />}
          {value === 'LinkedIn' && <Users className="w-3 h-3 mr-1" />}
          {value === 'Referral' && <UserPlus className="w-3 h-3 mr-1" />}
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Converted' ? 'bg-green-100 text-green-800' :
          value === 'Qualified' ? 'bg-blue-100 text-blue-800' :
          value === 'New' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'score',
      label: 'Score',
      align: 'center',
      render: (value) => (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              value >= 80 ? 'bg-green-500' :
              value >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="font-medium">{value}</span>
          </div>
        </div>
      )
    },
    {
      key: 'estimatedValue',
      label: 'Est. Value',
      align: 'right',
      render: (value) => `$${(value / 1000).toFixed(0)}K`
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
  const mobileCardRender = (record: Lead) => (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-blue-600 cursor-pointer hover:text-blue-800">
            {record.name}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {record.company}
          </p>
          <p className="text-xs text-gray-500">{record.industry}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            record.status === 'Converted' ? 'bg-green-100 text-green-800' :
            record.status === 'Qualified' ? 'bg-blue-100 text-blue-800' :
            record.status === 'New' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {record.status}
          </span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              record.score >= 80 ? 'bg-green-500' :
              record.score >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium">{record.score}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
          <a href={`mailto:${record.email}`} className="text-blue-600 hover:text-blue-800 truncate block">
            {record.email}
          </a>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
          <a href={`tel:${record.phone}`} className="text-blue-600 hover:text-blue-800">
            {record.phone}
          </a>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Source</div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            record.source === 'Website' ? 'bg-blue-100 text-blue-800' :
            record.source === 'LinkedIn' ? 'bg-blue-100 text-blue-800' :
            record.source === 'Referral' ? 'bg-green-100 text-green-800' :
            record.source === 'Trade Show' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {record.source}
          </span>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Est. Value</div>
          <div className="font-medium">${(record.estimatedValue / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button className="flex-1 text-sm text-blue-600 hover:text-blue-800 py-2 px-3 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
          <Phone className="w-4 h-4" />
          Call
        </button>
        <button className="flex-1 text-sm text-green-600 hover:text-green-800 py-2 px-3 border border-green-200 rounded hover:bg-green-50 transition-colors flex items-center justify-center gap-1">
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button className="flex-1 text-sm text-purple-600 hover:text-purple-800 py-2 px-3 border border-purple-200 rounded hover:bg-purple-50 transition-colors flex items-center justify-center gap-1">
          <ArrowRight className="w-4 h-4" />
          Convert
        </button>
      </div>
    </div>
  )

  // KPI data
  const kpiData = {
    totalLeads: sampleLeads.length,
    conversionRate: Math.round((sampleLeads.filter(l => l.status === 'Converted').length / sampleLeads.length) * 100),
    averageScore: Math.round(sampleLeads.reduce((sum, lead) => sum + lead.score, 0) / sampleLeads.length),
    topSource: 'Website'
  }

  // Chart data
  const sourceChartData = [
    { name: 'Website', value: 30, color: '#3b82f6' },
    { name: 'LinkedIn', value: 25, color: '#10b981' },
    { name: 'Referral', value: 20, color: '#f59e0b' },
    { name: 'Trade Show', value: 15, color: '#8b5cf6' },
    { name: 'Cold Call', value: 10, color: '#ef4444' }
  ]

  const conversionData = [
    { month: 'Oct', conversions: 15 },
    { month: 'Nov', conversions: 22 },
    { month: 'Dec', conversions: 18 },
    { month: 'Jan', conversions: 28 }
  ]

  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      setLeads(sampleLeads)
    }
  }, [isAuthenticated, currentOrganization])

  const handleApplyFilters = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLeads(sampleLeads)
      setLoading(false)
    }, 1000)
  }

  return (
    <MobilePageLayout title="HERA" breadcrumb="CRM / Lead Management">
      <MobileFilters 
        title="Lead Filters"
        fields={filterFields}
        onApply={handleApplyFilters}
        onAdaptFilters={() => console.log('Adapt filters')}
      />

      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MobileCard 
            title="Total Leads"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.totalLeads}</div>
                <div className="text-sm text-gray-600">All leads</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Conversion Rate"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.conversionRate}%</div>
                <div className="text-sm text-gray-600">Converted leads</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Average Score"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.averageScore}</div>
                <div className="text-sm text-gray-600">Lead quality</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Top Source"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">{kpiData.topSource}</div>
                <div className="text-sm text-gray-600">Best performing</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileChart 
            title="Leads by Source"
            type="pie"
            data={sourceChartData}
            height="300"
          />
          <MobileChart 
            title="Lead Conversions Over Time"
            type="line"
            data={conversionData}
            height="300"
          />
        </div>

        {/* Leads Table */}
        <MobileDataTable
          title={`Leads (${leads.length})`}
          subtitle="Manage your sales leads and conversion pipeline"
          columns={columns}
          data={leads}
          loading={loading}
          selectable={true}
          selectedRows={selectedLeads}
          onRowSelect={setSelectedLeads}
          mobileCardRender={mobileCardRender}
          actions={
            <div className="flex gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                Export
              </button>
              <button className="text-sm text-green-600 hover:text-green-800 px-3 py-2 border border-green-200 rounded hover:bg-green-50 transition-colors">
                Bulk Convert
              </button>
            </div>
          }
        />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center min-w-[56px] min-h-[56px]">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </MobilePageLayout>
  )
}