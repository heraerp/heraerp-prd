'use client'

import React, { useState } from 'react'
import { 
  Building2, 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal,
  Download,
  Edit3,
  Trash2,
  Users,
  Target,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileModal } from '@/components/mobile'
import { CRMAccountCard, CRMAccountListItem, type CRMAccount } from './CRMAccountCard'
import { CRMAccountForm } from './forms/CRMAccountForm'
import { CRMContactForm } from './forms/CRMContactForm'
import { useCRMEntities } from '@/hooks/useCRM'

export interface CRMAccountManagementProps {
  className?: string
}

type AccountViewMode = 'cards' | 'list'
type AccountFilter = 'all' | 'customers' | 'prospects' | 'partners' | 'high-value'
type AccountSort = 'name' | 'created' | 'revenue' | 'employees' | 'industry'

export function CRMAccountManagement({ className = '' }: CRMAccountManagementProps) {
  const [viewMode, setViewMode] = useState<AccountViewMode>('cards')
  const [filter, setFilter] = useState<AccountFilter>('all')
  const [sortBy, setSortBy] = useState<AccountSort>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [showNewContactForm, setShowNewContactForm] = useState<string | null>(null)

  // Hooks
  const { data: accounts = [], isLoading, error } = useCRMEntities('ACCOUNT')
  const { data: contacts = [] } = useCRMEntities('CONTACT')
  const { data: opportunities = [] } = useCRMEntities('OPPORTUNITY')

  // Transform universal entities to account format
  const transformedAccounts: CRMAccount[] = accounts.map(entity => {
    // Count related contacts and opportunities (simplified - in real app would use relationships)
    const relatedContacts = contacts.filter(c => 
      c.dynamic_fields?.account_id?.value === entity.entity_id
    ).length
    
    const relatedOpportunities = opportunities.filter(o => 
      o.relationships?.OPPORTUNITY_OF_ACCOUNT?.some((r: any) => r.target_entity_id === entity.entity_id)
    )
    
    const totalOpportunityValue = relatedOpportunities.reduce((sum, opp) => 
      sum + (opp.dynamic_fields?.amount?.value || 0), 0
    )

    return {
      id: entity.entity_id || '',
      entity_name: entity.entity_name,
      industry: entity.dynamic_fields?.industry?.value,
      account_type: entity.dynamic_fields?.account_type?.value,
      website: entity.dynamic_fields?.website?.value,
      phone: entity.dynamic_fields?.phone?.value,
      email: entity.dynamic_fields?.email?.value,
      annual_revenue: entity.dynamic_fields?.annual_revenue?.value,
      employee_count: entity.dynamic_fields?.employee_count?.value,
      rating: entity.dynamic_fields?.rating?.value,
      billing_address: entity.dynamic_fields?.billing_address?.value,
      shipping_address: entity.dynamic_fields?.shipping_address?.value,
      description: entity.dynamic_fields?.description?.value,
      created_date: entity.created_at,
      last_activity_date: entity.updated_at,
      contact_count: relatedContacts,
      opportunity_count: relatedOpportunities.length,
      total_opportunity_value: totalOpportunityValue
    }
  })

  // Filter and sort accounts
  const filteredAccounts = transformedAccounts
    .filter(account => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          account.entity_name.toLowerCase().includes(query) ||
          account.industry?.toLowerCase().includes(query) ||
          account.website?.toLowerCase().includes(query) ||
          account.email?.toLowerCase().includes(query)
        
        if (!matchesSearch) return false
      }

      // Type filter
      switch (filter) {
        case 'customers':
          return account.account_type === 'Customer'
        case 'prospects':
          return account.account_type === 'Prospect'
        case 'partners':
          return account.account_type === 'Partner'
        case 'high-value':
          return (account.annual_revenue && account.annual_revenue >= 1000000) ||
                 (account.total_opportunity_value && account.total_opportunity_value >= 100000)
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.entity_name.localeCompare(b.entity_name)
        case 'revenue':
          return (b.annual_revenue || 0) - (a.annual_revenue || 0)
        case 'employees':
          return (b.employee_count || 0) - (a.employee_count || 0)
        case 'industry':
          return (a.industry || '').localeCompare(b.industry || '')
        case 'created':
        default:
          return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
      }
    })

  // Get summary stats
  const stats = {
    total: transformedAccounts.length,
    customers: transformedAccounts.filter(a => a.account_type === 'Customer').length,
    prospects: transformedAccounts.filter(a => a.account_type === 'Prospect').length,
    highValue: transformedAccounts.filter(a => 
      (a.annual_revenue && a.annual_revenue >= 1000000) ||
      (a.total_opportunity_value && a.total_opportunity_value >= 100000)
    ).length,
    totalRevenue: transformedAccounts.reduce((sum, a) => sum + (a.annual_revenue || 0), 0),
    totalOpportunityValue: transformedAccounts.reduce((sum, a) => sum + (a.total_opportunity_value || 0), 0)
  }

  // Handle account actions
  const handleSelectAccount = (account: CRMAccount) => {
    setSelectedAccounts(prev => 
      prev.includes(account.id) 
        ? prev.filter(id => id !== account.id)
        : [...prev, account.id]
    )
  }

  const handleSelectAllAccounts = () => {
    setSelectedAccounts(
      selectedAccounts.length === filteredAccounts.length 
        ? [] 
        : filteredAccounts.map(account => account.id)
    )
  }

  const handleAddContact = (account: CRMAccount) => {
    setShowNewContactForm(account.id)
  }

  const handleCreateOpportunity = (account: CRMAccount) => {
    // TODO: Implement opportunity creation
    console.log('Create opportunity for', account.entity_name)
  }

  const handleNewAccountCreated = (accountId: string) => {
    setShowNewAccountForm(false)
  }

  const handleNewContactCreated = (contactId: string) => {
    setShowNewContactForm(null)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Failed to load accounts. Please try again.</div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
              <p className="text-gray-600">Manage your company relationships</p>
            </div>
          </div>

          <MobileButton
            onClick={() => setShowNewAccountForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Account
          </MobileButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Total Accounts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Customers</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.customers}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Prospects</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.prospects}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">High Value</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.highValue}</div>
          </div>
        </div>

        {/* Revenue Stats */}
        {(stats.totalRevenue > 0 || stats.totalOpportunityValue > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.totalRevenue > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Total Annual Revenue</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(stats.totalRevenue)}
                </div>
              </div>
            )}

            {stats.totalOpportunityValue > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Pipeline Value</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(stats.totalOpportunityValue)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <MobileInput
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <MobileSelect
              value={filter}
              onChange={(e) => setFilter(e.target.value as AccountFilter)}
              className="w-full sm:w-36"
            >
              <option value="all">All Accounts</option>
              <option value="customers">Customers</option>
              <option value="prospects">Prospects</option>
              <option value="partners">Partners</option>
              <option value="high-value">High Value</option>
            </MobileSelect>

            <MobileSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AccountSort)}
              className="w-full sm:w-32"
            >
              <option value="created">Latest</option>
              <option value="name">Name</option>
              <option value="revenue">Revenue</option>
              <option value="employees">Size</option>
              <option value="industry">Industry</option>
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
        {selectedAccounts.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''} selected
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

      {/* Accounts List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading accounts...</div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filter !== 'all' 
                ? 'No accounts match your current filters'
                : 'Start by creating your first account'
              }
            </p>
            {(!searchQuery && filter === 'all') && (
              <MobileButton
                onClick={() => setShowNewAccountForm(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Create First Account
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
                    checked={selectedAccounts.length === filteredAccounts.length}
                    onChange={handleSelectAllAccounts}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </label>
                <div className="text-sm text-gray-600">
                  {filteredAccounts.length} account{filteredAccounts.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Accounts */}
            <div className={viewMode === 'cards' ? 'p-4 space-y-4' : 'divide-y divide-gray-200'}>
              {filteredAccounts.map((account) => (
                viewMode === 'cards' ? (
                  <CRMAccountCard
                    key={account.id}
                    account={account}
                    onAddContact={handleAddContact}
                    onCreateOpportunity={handleCreateOpportunity}
                    onCall={(account) => console.log('Call', account)}
                    onEmail={(account) => console.log('Email', account)}
                    onVisitWebsite={(account) => window.open(account.website, '_blank')}
                    onViewDetails={(account) => console.log('View details', account)}
                  />
                ) : (
                  <div key={account.id} className="p-4">
                    <CRMAccountListItem
                      account={account}
                      selected={selectedAccounts.includes(account.id)}
                      onSelect={handleSelectAccount}
                      onAddContact={handleAddContact}
                      onCreateOpportunity={handleCreateOpportunity}
                      onCall={(account) => console.log('Call', account)}
                      onEmail={(account) => console.log('Email', account)}
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Account Modal */}
      <MobileModal
        isOpen={showNewAccountForm}
        onClose={() => setShowNewAccountForm(false)}
        title="Create New Account"
        size="large"
      >
        <CRMAccountForm
          onSubmit={handleNewAccountCreated}
          onCancel={() => setShowNewAccountForm(false)}
        />
      </MobileModal>

      {/* New Contact Modal */}
      <MobileModal
        isOpen={!!showNewContactForm}
        onClose={() => setShowNewContactForm(null)}
        title="Add New Contact"
        size="large"
      >
        {showNewContactForm && (
          <CRMContactForm
            preselectedAccountId={showNewContactForm}
            onSubmit={handleNewContactCreated}
            onCancel={() => setShowNewContactForm(null)}
          />
        )}
      </MobileModal>
    </div>
  )
}