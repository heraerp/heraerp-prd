'use client'

import React, { useState, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import Link from 'next/link'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  UserPlus,
  Building2,
  Plus,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowRight
} from 'lucide-react'

interface DashboardRecord extends TableRecord {
  id: string
  name: string
  type: 'opportunity' | 'account' | 'lead'
  value: number
  stage: string
  owner: string
  lastActivity: string
}

export default function CRMDashboardPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardRecord[]>([])
  const [selectedRecords, setSelectedRecords] = useState<(string | number)[]>([])
  const [filters, setFilters] = useState({
    dateRange: '',
    owner: '',
    region: '',
    search: ''
  })

  // Sample dashboard data
  const sampleDashboardData: DashboardRecord[] = [
    {
      id: 'OPP-001',
      name: 'Enterprise Software License - Acme Corp',
      type: 'opportunity',
      value: 250000,
      stage: 'Negotiation',
      owner: 'Sarah Wilson',
      lastActivity: '2024-01-20'
    },
    {
      id: 'ACC-001',
      name: 'Global Manufacturing Inc',
      type: 'account',
      value: 1200000,
      stage: 'Active',
      owner: 'Mike Johnson',
      lastActivity: '2024-01-19'
    },
    {
      id: 'LEAD-001',
      name: 'Jennifer Williams - TechVision Corp',
      type: 'lead',
      value: 125000,
      stage: 'Qualified',
      owner: 'Sarah Wilson',
      lastActivity: '2024-01-18'
    }
  ]

  // Filter fields
  const filterFields: FilterField[] = [
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'select',
      placeholder: 'This Month',
      options: [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' }
      ],
      value: filters.dateRange,
      onChange: (value) => setFilters(prev => ({ ...prev, dateRange: value }))
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
      key: 'region',
      label: 'Region',
      type: 'select',
      placeholder: 'All Regions',
      options: [
        { value: 'north', label: 'North America' },
        { value: 'europe', label: 'Europe' },
        { value: 'apac', label: 'APAC' }
      ],
      value: filters.region,
      onChange: (value) => setFilters(prev => ({ ...prev, region: value }))
    },
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search all CRM data...',
      value: filters.search,
      onChange: (value) => setFilters(prev => ({ ...prev, search: value }))
    }
  ]

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Item',
      render: (value, record) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {value}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            {record.type === 'opportunity' && <Target className="w-3 h-3" />}
            {record.type === 'account' && <Building2 className="w-3 h-3" />}
            {record.type === 'lead' && <UserPlus className="w-3 h-3" />}
            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
          </div>
        </div>
      )
    },
    {
      key: 'value',
      label: 'Value',
      align: 'right',
      render: (value) => `$${(value / 1000).toFixed(0)}K`
    },
    {
      key: 'stage',
      label: 'Stage/Status',
      align: 'center',
      render: (value, record) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' ? 'bg-green-100 text-green-800' :
          value === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
          value === 'Qualified' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
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
    },
    {
      key: 'lastActivity',
      label: 'Last Activity',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-3 h-3" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ]

  // Mobile card renderer
  const mobileCardRender = (record: DashboardRecord) => (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-blue-600 cursor-pointer hover:text-blue-800">
            {record.name}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            {record.type === 'opportunity' && <Target className="w-3 h-3" />}
            {record.type === 'account' && <Building2 className="w-3 h-3" />}
            {record.type === 'lead' && <UserPlus className="w-3 h-3" />}
            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-gray-900">${(record.value / 1000).toFixed(0)}K</div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            record.stage === 'Active' ? 'bg-green-100 text-green-800' :
            record.stage === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
            record.stage === 'Qualified' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {record.stage}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
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
          <div className="text-xs text-gray-500 uppercase tracking-wide">Last Activity</div>
          <div className="font-medium">{new Date(record.lastActivity).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button className="flex-1 text-sm text-blue-600 hover:text-blue-800 py-2 px-3 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
          <Activity className="w-4 h-4" />
          View
        </button>
      </div>
    </div>
  )

  // KPI data
  const kpiData = {
    totalRevenue: 8400000, // Won deals
    activePipeline: 2150000,
    newLeadsMonth: 24,
    avgDealSize: 125000
  }

  // Chart data
  const pipelineByStageData = [
    { name: 'Prospecting', value: 450000, color: '#6b7280' },
    { name: 'Qualification', value: 650000, color: '#3b82f6' },
    { name: 'Proposal', value: 750000, color: '#f59e0b' },
    { name: 'Negotiation', value: 500000, color: '#ea580c' }
  ]

  const conversionFunnelData = [
    { stage: 'Leads', count: 150 },
    { stage: 'Qualified', count: 75 },
    { stage: 'Proposal', count: 45 },
    { stage: 'Negotiation', count: 25 },
    { stage: 'Closed Won', count: 18 }
  ]

  const revenueTrendData = [
    { month: 'Oct', revenue: 1200000 },
    { month: 'Nov', revenue: 1850000 },
    { month: 'Dec', revenue: 2100000 },
    { month: 'Jan', revenue: 2400000 }
  ]

  const topAccountsData = [
    { name: 'Retail Chain Co', revenue: 2100000, color: '#3b82f6' },
    { name: 'Global Manufacturing', revenue: 1200000, color: '#10b981' },
    { name: 'Healthcare Solutions', revenue: 850000, color: '#f59e0b' },
    { name: 'Acme Corporation', revenue: 650000, color: '#ef4444' }
  ]

  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      setDashboardData(sampleDashboardData)
    }
  }, [isAuthenticated, currentOrganization])

  const handleApplyFilters = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setDashboardData(sampleDashboardData)
      setLoading(false)
    }, 1000)
  }

  return (
    <MobilePageLayout title="HERA" breadcrumb="CRM / Overview Dashboard">
      <MobileFilters 
        title="Dashboard Filters"
        fields={filterFields}
        onApply={handleApplyFilters}
        onAdaptFilters={() => console.log('Adapt filters')}
      />

      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MobileCard 
            title="Total Revenue"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">${(kpiData.totalRevenue / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600">Won deals YTD</div>
                <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +12.5% vs last quarter
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Active Pipeline"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">${(kpiData.activePipeline / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600">Open opportunities</div>
                <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Target className="w-3 h-3" />
                  28 active deals
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="New Leads"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.newLeadsMonth}</div>
                <div className="text-sm text-gray-600">This month</div>
                <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                  <UserPlus className="w-3 h-3" />
                  +8.2% vs last month
                </div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Avg Deal Size"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">${(kpiData.avgDealSize / 1000).toFixed(0)}K</div>
                <div className="text-sm text-gray-600">Per opportunity</div>
                <div className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <BarChart3 className="w-3 h-3" />
                  Industry benchmark: 95K
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/crm/leads" className="block">
            <MobileCard className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-full">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Create Lead</h3>
                  <p className="text-sm text-blue-700">Add new sales lead</p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600 ml-auto" />
              </div>
            </MobileCard>
          </Link>

          <Link href="/crm/accounts" className="block">
            <MobileCard className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600 rounded-full">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900">Add Account</h3>
                  <p className="text-sm text-green-700">Create new account</p>
                </div>
                <ArrowRight className="w-5 h-5 text-green-600 ml-auto" />
              </div>
            </MobileCard>
          </Link>

          <Link href="/crm/activities" className="block">
            <MobileCard className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 rounded-full">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">Log Activity</h3>
                  <p className="text-sm text-purple-700">Record interaction</p>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-600 ml-auto" />
              </div>
            </MobileCard>
          </Link>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileChart 
            title="Pipeline Value by Stage"
            type="bar"
            data={pipelineByStageData}
            height="300"
          />
          <MobileChart 
            title="Leads Conversion Funnel"
            type="bar"
            data={conversionFunnelData}
            height="300"
          />
          <MobileChart 
            title="Revenue Trend"
            type="line"
            data={revenueTrendData}
            height="300"
          />
          <MobileChart 
            title="Top Accounts by Revenue"
            type="bar"
            data={topAccountsData}
            height="300"
          />
        </div>

        {/* Recent Activity Table */}
        <MobileDataTable
          title="Recent High-Value Items"
          subtitle="Top opportunities and accounts with recent activity"
          columns={columns}
          data={dashboardData}
          loading={loading}
          selectable={false}
          mobileCardRender={mobileCardRender}
          actions={
            <div className="flex gap-2">
              <Link href="/crm/opportunities" className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                View All
              </Link>
            </div>
          }
        />
      </div>
    </MobilePageLayout>
  )
}