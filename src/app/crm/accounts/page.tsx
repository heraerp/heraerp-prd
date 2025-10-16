'use client'

import React, { useState, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus, 
  Eye, 
  Edit, 
  Target, 
  Phone, 
  Mail,
  MapPin,
  DollarSign,
  Calendar
} from 'lucide-react'

interface Account extends TableRecord {
  id: string
  name: string
  industry: string
  revenue: number
  employees: number
  owner: string
  city: string
  state: string
  phone: string
  email: string
  createdDate: string
  lastActivity: string
  status: 'Active' | 'Inactive' | 'Prospect'
  opportunities: number
  totalValue: number
}

export default function AccountsPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([])
  const [filters, setFilters] = useState({
    industry: '',
    owner: '',
    dateRange: '',
    status: '',
    search: ''
  })

  // Sample account data
  const sampleAccounts: Account[] = [
    {
      id: 'ACC-001',
      name: 'Acme Corporation',
      industry: 'Technology',
      revenue: 5000000,
      employees: 250,
      owner: 'Sarah Wilson',
      city: 'San Francisco',
      state: 'CA',
      phone: '+1-555-0123',
      email: 'contact@acme.com',
      createdDate: '2024-01-15',
      lastActivity: '2024-01-20',
      status: 'Active',
      opportunities: 3,
      totalValue: 850000
    },
    {
      id: 'ACC-002',
      name: 'Global Manufacturing Inc',
      industry: 'Manufacturing',
      revenue: 12000000,
      employees: 500,
      owner: 'Mike Johnson',
      city: 'Detroit',
      state: 'MI',
      phone: '+1-555-0456',
      email: 'info@globalmanuf.com',
      createdDate: '2024-01-10',
      lastActivity: '2024-01-19',
      status: 'Active',
      opportunities: 5,
      totalValue: 1200000
    },
    {
      id: 'ACC-003',
      name: 'Healthcare Solutions LLC',
      industry: 'Healthcare',
      revenue: 8000000,
      employees: 150,
      owner: 'Sarah Wilson',
      city: 'Boston',
      state: 'MA',
      phone: '+1-555-0789',
      email: 'hello@healthcaresol.com',
      createdDate: '2024-01-05',
      lastActivity: '2024-01-18',
      status: 'Prospect',
      opportunities: 2,
      totalValue: 450000
    },
    {
      id: 'ACC-004',
      name: 'Retail Chain Co',
      industry: 'Retail',
      revenue: 25000000,
      employees: 1200,
      owner: 'Alex Chen',
      city: 'New York',
      state: 'NY',
      phone: '+1-555-0321',
      email: 'business@retailchain.com',
      createdDate: '2023-12-20',
      lastActivity: '2024-01-17',
      status: 'Active',
      opportunities: 8,
      totalValue: 2100000
    }
  ]

  // Filter fields
  const filterFields: FilterField[] = [
    {
      key: 'industry',
      label: 'Industry',
      type: 'select',
      placeholder: 'All Industries',
      options: [
        { value: 'technology', label: 'Technology' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'retail', label: 'Retail' },
        { value: 'finance', label: 'Finance' }
      ],
      value: filters.industry,
      onChange: (value) => setFilters(prev => ({ ...prev, industry: value }))
    },
    {
      key: 'owner',
      label: 'Account Owner',
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
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'prospect', label: 'Prospect' }
      ],
      value: filters.status,
      onChange: (value) => setFilters(prev => ({ ...prev, status: value }))
    },
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search accounts...',
      value: filters.search,
      onChange: (value) => setFilters(prev => ({ ...prev, search: value }))
    }
  ]

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Account Name',
      render: (value, record) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {value}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {record.city}, {record.state}
          </div>
        </div>
      )
    },
    {
      key: 'industry',
      label: 'Industry',
      align: 'center'
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
            {value.split(' ').map((n: string) => n[0]).join('')}
          </div>
          {value}
        </div>
      )
    },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right',
      render: (value) => `$${(value / 1000000).toFixed(1)}M`
    },
    {
      key: 'employees',
      label: 'Employees',
      align: 'center'
    },
    {
      key: 'opportunities',
      label: 'Opportunities',
      align: 'center',
      render: (value, record) => (
        <div className="text-center">
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">
            ${(record.totalValue / 1000).toFixed(0)}K
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' ? 'bg-green-100 text-green-800' :
          value === 'Prospect' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    }
  ]

  // Mobile card renderer
  const mobileCardRender = (record: Account) => (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-blue-600 cursor-pointer hover:text-blue-800">
            {record.name}
          </h3>
          <p className="text-sm text-gray-600">{record.industry}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {record.city}, {record.state}
          </p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          record.status === 'Active' ? 'bg-green-100 text-green-800' :
          record.status === 'Prospect' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {record.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Revenue</div>
          <div className="font-medium">${(record.revenue / 1000000).toFixed(1)}M</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Employees</div>
          <div className="font-medium">{record.employees}</div>
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
          <div className="text-xs text-gray-500 uppercase tracking-wide">Pipeline</div>
          <div className="font-medium">{record.opportunities} opps • ${(record.totalValue / 1000).toFixed(0)}K</div>
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
          <Target className="w-4 h-4" />
          Opportunity
        </button>
      </div>
    </div>
  )

  // KPI data
  const kpiData = {
    totalAccounts: sampleAccounts.length,
    activeAccounts: sampleAccounts.filter(a => a.status === 'Active').length,
    topIndustries: 'Technology',
    newThisMonth: 2
  }

  // Chart data
  const industryChartData = [
    { name: 'Technology', value: 25, color: '#3b82f6' },
    { name: 'Manufacturing', value: 20, color: '#10b981' },
    { name: 'Healthcare', value: 18, color: '#f59e0b' },
    { name: 'Retail', value: 15, color: '#ef4444' },
    { name: 'Finance', value: 12, color: '#8b5cf6' },
    { name: 'Other', value: 10, color: '#6b7280' }
  ]

  const newAccountsData = [
    { month: 'Oct', accounts: 8 },
    { month: 'Nov', accounts: 12 },
    { month: 'Dec', accounts: 15 },
    { month: 'Jan', accounts: 18 }
  ]

  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      setAccounts(sampleAccounts)
    }
  }, [isAuthenticated, currentOrganization])

  const handleApplyFilters = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setAccounts(sampleAccounts)
      setLoading(false)
    }, 1000)
  }

  return (
    <MobilePageLayout title="HERA" breadcrumb="CRM / Accounts Management">
      <MobileFilters 
        title="Account Filters"
        fields={filterFields}
        onApply={handleApplyFilters}
        onAdaptFilters={() => console.log('Adapt filters')}
      />

      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MobileCard 
            title="Total Accounts"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.totalAccounts}</div>
                <div className="text-sm text-gray-600">All accounts</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Active Accounts"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.activeAccounts}</div>
                <div className="text-sm text-gray-600">Currently active</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Top Industry"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.topIndustries}</div>
                <div className="text-sm text-gray-600">Leading sector</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="New This Month"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.newThisMonth}</div>
                <div className="text-sm text-gray-600">Recently added</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileChart 
            title="Accounts by Industry"
            type="bar"
            data={industryChartData}
            height="300"
          />
          <MobileChart 
            title="New Accounts Over Time"
            type="line"
            data={newAccountsData}
            height="300"
          />
        </div>

        {/* Accounts Table */}
        <MobileDataTable
          title={`Accounts (${accounts.length})`}
          subtitle="Manage your customer accounts and relationships"
          columns={columns}
          data={accounts}
          loading={loading}
          selectable={true}
          selectedRows={selectedAccounts}
          onRowSelect={setSelectedAccounts}
          mobileCardRender={mobileCardRender}
          actions={
            <div className="flex gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                Export
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