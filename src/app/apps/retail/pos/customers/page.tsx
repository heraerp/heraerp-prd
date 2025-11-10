/**
 * Retail POS Customer Management
 * Integrated with Universal Dynamic Masterdata System
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { UniversalEntityListShell } from '@/components/universal/UniversalEntityListShell'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Star,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Gift,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  UserPlus
} from 'lucide-react'

// Customer filter panel component
const CustomerFilterPanel = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [filters, setFilters] = useState({
    loyaltyTier: '',
    registrationDate: '',
    lastPurchase: '',
    totalSpent: '',
    status: 'active'
  })

  const loyaltyTiers = [
    'All Tiers',
    'Bronze',
    'Silver', 
    'Gold',
    'Platinum',
    'VIP'
  ]

  const spentRanges = [
    'All Amounts',
    '$0 - $100',
    '$100 - $500',
    '$500 - $1,000', 
    '$1,000 - $5,000',
    '$5,000+'
  ]

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-champagne mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-gold" />
          Customer Filters
        </h3>
      </div>

      {/* Loyalty Tier Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Loyalty Tier</label>
        <select
          value={filters.loyaltyTier}
          onChange={(e) => handleFilterChange('loyaltyTier', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          {loyaltyTiers.map((tier) => (
            <option key={tier} value={tier === 'All Tiers' ? '' : tier.toLowerCase()}>
              {tier}
            </option>
          ))}
        </select>
      </div>

      {/* Total Spent Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Total Spent</label>
        <select
          value={filters.totalSpent}
          onChange={(e) => handleFilterChange('totalSpent', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          {spentRanges.map((range) => (
            <option key={range} value={range === 'All Amounts' ? '' : range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      {/* Registration Date Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Registration</label>
        <select
          value={filters.registrationDate}
          onChange={(e) => handleFilterChange('registrationDate', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Last Purchase Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Last Purchase</label>
        <select
          value={filters.lastPurchase}
          onChange={(e) => handleFilterChange('lastPurchase', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          <option value="">Any Time</option>
          <option value="week">Within 1 Week</option>
          <option value="month">Within 1 Month</option>
          <option value="quarter">Within 3 Months</option>
          <option value="never">Never Purchased</option>
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
          <option value="all">All Status</option>
        </select>
      </div>

      {/* Quick Stats */}
      <div className="pt-4 border-t border-gold/20">
        <h4 className="text-sm font-medium text-champagne mb-3">Customer Stats</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-bronze">Total Customers:</span>
            <span className="text-champagne font-medium">1,247</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bronze">VIP Customers:</span>
            <span className="text-gold font-medium">89</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bronze">New This Month:</span>
            <span className="text-green-400 font-medium">156</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bronze">Avg. Spend:</span>
            <span className="text-champagne font-medium">$127.50</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button className="w-full min-h-[44px] bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center gap-2 px-3 text-blue-300 hover:bg-blue-500/30 active:scale-95 transition-all">
          <Upload className="w-4 h-4" />
          Import Customers
        </button>
        <button className="w-full min-h-[44px] bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2 px-3 text-green-300 hover:bg-green-500/30 active:scale-95 transition-all">
          <Download className="w-4 h-4" />
          Export Customers
        </button>
      </div>
    </div>
  )
}

// Customer list/grid component
const CustomerListContent = ({ view, searchTerm, filters }: { view: string, searchTerm: string, filters: any }) => {
  // Sample customer data - in real implementation, this would come from Universal Masterdata API
  const [customers, setCustomers] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      loyaltyTier: 'gold',
      loyaltyPoints: 2450,
      totalSpent: 1875.50,
      lastPurchase: '2024-11-08',
      registrationDate: '2023-06-15',
      status: 'active',
      address: '123 Main St, New York, NY 10001'
    },
    {
      id: '2', 
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 234-5678',
      loyaltyTier: 'platinum',
      loyaltyPoints: 5670,
      totalSpent: 4250.75,
      lastPurchase: '2024-11-10',
      registrationDate: '2022-03-22',
      status: 'active',
      address: '456 Oak Ave, Los Angeles, CA 90210'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '+1 (555) 345-6789',
      loyaltyTier: 'silver',
      loyaltyPoints: 890,
      totalSpent: 325.00,
      lastPurchase: '2024-10-28',
      registrationDate: '2024-08-10',
      status: 'active',
      address: '789 Pine St, Chicago, IL 60601'
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david.wilson@email.com',
      phone: '+1 (555) 456-7890',
      loyaltyTier: 'bronze',
      loyaltyPoints: 125,
      totalSpent: 89.99,
      lastPurchase: '2024-11-05',
      registrationDate: '2024-11-01',
      status: 'active',
      address: '321 Elm Dr, Houston, TX 77001'
    }
  ])

  // Filter customers based on search and filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm)
    
    const matchesTier = !filters.loyaltyTier || customer.loyaltyTier === filters.loyaltyTier
    const matchesStatus = filters.status === 'all' || customer.status === filters.status

    return matchesSearch && matchesTier && matchesStatus
  })

  const handleCustomerAction = (action: string, customerId: string) => {
    console.log(`${action} customer:`, customerId)
    // In real implementation, these would call the Universal Masterdata APIs
  }

  const getLoyaltyTierColor = (tier: string) => {
    const colors = {
      'bronze': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'silver': 'bg-gray-500/20 text-gray-300 border-gray-500/30', 
      'gold': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'platinum': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'vip': 'bg-red-500/20 text-red-300 border-red-500/30'
    }
    return colors[tier] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  if (view === 'mobile' || view === 'list') {
    return (
      <div className="space-y-3">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-gradient-to-r from-charcoal/90 to-black/95 backdrop-blur-lg border border-gold/20 rounded-xl p-4 hover:border-gold/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Customer Avatar */}
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-gold" />
                </div>

                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-champagne truncate">{customer.name}</h3>
                    <span className={`px-2 py-1 rounded-lg text-xs border ${getLoyaltyTierColor(customer.loyaltyTier)}`}>
                      {customer.loyaltyTier.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-bronze">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {customer.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {customer.loyaltyPoints} pts
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      ${customer.totalSpent.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => handleCustomerAction('view', customer.id)}
                  className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-300 hover:bg-blue-500/30 active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleCustomerAction('edit', customer.id)}
                  className="w-10 h-10 bg-gold/20 border border-gold/30 rounded-lg flex items-center justify-center text-gold hover:bg-gold/30 active:scale-95 transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleCustomerAction('delete', customer.id)}
                  className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center text-red-300 hover:bg-red-500/30 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredCustomers.map((customer) => (
        <div key={customer.id} className="bg-gradient-to-br from-charcoal/90 to-black/95 backdrop-blur-lg border border-gold/20 rounded-xl p-4 hover:border-gold/40 transition-all group">
          {/* Customer Avatar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-champagne truncate group-hover:text-gold transition-colors">
                {customer.name}
              </h3>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs border mt-1 ${getLoyaltyTierColor(customer.loyaltyTier)}`}>
                {customer.loyaltyTier.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-bronze">
              <Mail className="w-3 h-3" />
              <span className="truncate">{customer.email}</span>
            </div>
            
            <div className="flex items-center gap-2 text-bronze">
              <Phone className="w-3 h-3" />
              <span>{customer.phone}</span>
            </div>

            <div className="flex items-center gap-2 text-bronze">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{customer.address.split(',')[0]}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gold/10">
              <div className="text-center">
                <p className="text-xs text-bronze">Points</p>
                <p className="text-gold font-bold">{customer.loyaltyPoints}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-bronze">Total Spent</p>
                <p className="text-champagne font-bold">${customer.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleCustomerAction('view', customer.id)}
              className="flex-1 min-h-[36px] bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 active:scale-95 transition-all flex items-center justify-center"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleCustomerAction('edit', customer.id)}
              className="flex-1 min-h-[36px] bg-gold/20 border border-gold/30 rounded-lg text-gold hover:bg-gold/30 active:scale-95 transition-all flex items-center justify-center"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function POSCustomersPage() {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'mobile'>('grid')
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)

  // Authentication guards
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Authentication Required</h1>
          <p className="text-bronze">Please log in to access customer management</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Organization Required</h1>
          <p className="text-bronze">Please select an organization to continue</p>
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Retail', href: '/apps/retail' },
    { label: 'POS', href: '/apps/retail/pos/main' },
    { label: 'Customers', href: '/apps/retail/pos/customers' }
  ]

  const handleCreateNew = () => {
    // In real implementation, this would open the Universal Entity wizard
    router.push('/apps/retail/pos/customers/new')
  }

  const handleExport = () => {
    console.log('Exporting customers...')
    // In real implementation, this would use the Universal Masterdata export functionality
  }

  const handleBatchDelete = () => {
    console.log('Batch deleting customers...')
    // In real implementation, this would use the Universal Masterdata batch operations
  }

  return (
    <UniversalEntityListShell
      title="Customer Management"
      description="Manage your retail customers with loyalty programs and purchase history"
      breadcrumbs={breadcrumbs}
      module="Retail"
      entityType="CUSTOMER"
      
      // Panel Content
      filterPanelContent={<CustomerFilterPanel onFilterChange={setFilters} />}
      listContentComponent={
        <CustomerListContent 
          view={selectedView} 
          searchTerm={searchTerm} 
          filters={filters}
        />
      }
      
      // Configuration
      enableSearch={true}
      enableFilters={true}
      enableExport={true}
      enableBatchOperations={true}
      showViewToggle={true}
      showCreateButton={true}
      
      // State & Callbacks
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedView={selectedView}
      onViewChange={setSelectedView}
      totalCount={4} // In real implementation, this would come from API
      selectedCount={0}
      onCreateNew={handleCreateNew}
      onExport={handleExport}
      onBatchDelete={handleBatchDelete}
      loading={loading}
      lastUpdated={new Date()}
    />
  )
}