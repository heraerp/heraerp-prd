// ================================================================================
// HERA SALON - CUSTOMERS PAGE V2 (Charcoal Gold UI Kit)
// Smart Code: HERA.PAGES.SALON.CUSTOMERS.V2
// Premium customer management with enhanced UI
// ================================================================================

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  DollarSign,
  TrendingUp,
  Star,
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Phone,
  Mail,
  Clock,
  X,
  Plus,
  Upload,
  Download
} from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { MouseGlow } from '@/components/salon/MouseGlow'

// KPI Card Component
function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  iconBg
}: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: { value: string; isPositive: boolean }
  iconBg: string
}) {
  return (
    <div className="glass-card p-6 group hover:scale-[1.02] transition-all">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-text-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-semibold text-text-100 tabular-nums">{value}</p>
          {trend && (
            <p className="text-sm text-text-300 flex items-center gap-1">
              <TrendingUp
                className={`w-4 h-4 ${trend.isPositive ? 'text-gold-500' : 'text-red-400'}`}
              />
              <span className={trend.isPositive ? 'text-gold-500' : 'text-red-400'}>
                {trend.value}
              </span>
              <span>this month</span>
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-gold-500" />
        </div>
      </div>
    </div>
  )
}

// Filter Chip Component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gold-500/10 text-gold-400 rounded-md">
      {label}
      <button onClick={onRemove} className="hover:text-gold-300 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

// Customer Row Component
function CustomerRow({ customer, onClick }: { customer: any; onClick: () => void }) {
  const loyaltyColors = {
    Platinum: 'bg-gradient-to-r from-slate-300 to-slate-100',
    Gold: 'bg-gradient-to-r from-gold-500 to-gold-400',
    Silver: 'bg-gradient-to-r from-gray-400 to-gray-300',
    Bronze: 'bg-gradient-to-r from-orange-600 to-orange-500'
  }

  const loyaltyTier =
    customer.relationships.find(
      (r: any) => r.relationship_type === 'has_status' && r.metadata?.status_type === 'loyalty_tier'
    )?.metadata?.status_name || 'Bronze'

  const lifetimeValue = customer.transactions.reduce(
    (sum: number, t: any) => sum + (t.total_amount || 0),
    0
  )

  const lastVisit = customer.transactions.sort(
    (a: any, b: any) =>
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  )[0]?.transaction_date

  return (
    <button
      onClick={onClick}
      className="w-full glass-card p-4 text-left hover:-translate-y-0.5 hover:shadow-xl transition-all group focus:outline-none focus:ring-2 focus:ring-gold-500"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full ${loyaltyColors[loyaltyTier] || loyaltyColors.Bronze} flex items-center justify-center text-charcoal-900 font-semibold shadow-lg`}
        >
          {customer.entity.entity_name?.substring(0, 2).toUpperCase() || '??'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-text-100 group-hover:text-gold-400 transition-colors">
                {customer.entity.entity_name}
              </h3>
              <p className="text-sm text-text-500 mt-0.5 flex items-center gap-3">
                {customer.dynamicFields.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {customer.dynamicFields.email}
                  </span>
                )}
                {customer.dynamicFields.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.dynamicFields.phone}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gold-500/10 text-gold-400 rounded">
                  {loyaltyTier}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                    customer.entity.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {customer.entity.status}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="text-right">
              <p className="text-lg font-semibold text-text-100 tabular-nums">
                AED {lifetimeValue.toLocaleString()}
              </p>
              {lastVisit && (
                <p className="text-xs text-text-500 mt-1 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {format(new Date(lastVisit), 'MMM d, yyyy')}
                </p>
              )}
              <p className="text-xs text-text-500">{customer.transactions.length} visits</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-charcoal-600 rounded transition-all">
          <MoreVertical className="w-5 h-5 text-text-500" />
        </button>
      </div>
    </button>
  )
}

export default function SalonCustomersV2Page() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, isLoading: authLoading } = useHERAAuth()
  const organizationId = currentOrganization?.id

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loyaltyFilter, setLoyaltyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  // Fetch customers using existing hook
  const { customers, stats, loading, error, refetch } = useCustomers(organizationId)

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => {
        const name = customer.entity.entity_name?.toLowerCase() || ''
        const email = customer.dynamicFields.email?.toLowerCase() || ''
        const phone = customer.dynamicFields.phone?.toLowerCase() || ''
        const search = searchTerm.toLowerCase()

        return name.includes(search) || email.includes(search) || phone.includes(search)
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.entity.status === statusFilter)
    }

    // Loyalty filter
    if (loyaltyFilter !== 'all') {
      filtered = filtered.filter(customer => {
        const loyaltyRel = customer.relationships.find(
          (r: any) =>
            r.relationship_type === 'has_status' && r.metadata?.status_type === 'loyalty_tier'
        )
        return loyaltyRel?.metadata?.status_name === loyaltyFilter
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.entity.entity_name || '').localeCompare(b.entity.entity_name || '')
        case 'recent':
          return new Date(b.entity.created_at).getTime() - new Date(a.entity.created_at).getTime()
        case 'value':
          const aValue = a.transactions.reduce(
            (sum: number, t: any) => sum + (t.total_amount || 0),
            0
          )
          const bValue = b.transactions.reduce(
            (sum: number, t: any) => sum + (t.total_amount || 0),
            0
          )
          return bValue - aValue
        default:
          return 0
      }
    })

    return filtered
  }, [customers, searchTerm, statusFilter, loyaltyFilter, sortBy])

  const activeFilters = []
  if (statusFilter !== 'all') activeFilters.push({ type: 'status', value: statusFilter })
  if (loyaltyFilter !== 'all') activeFilters.push({ type: 'loyalty', value: loyaltyFilter })

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    )
  }

  // No organization state
  if (!organizationId) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-300">No organization selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh text-text-100 bg-charcoal-900">
      <MouseGlow />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="text-gold-400 uppercase tracking-[0.12em] text-xs font-semibold">
              Salon Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Customers</h1>
          </div>
          <div className="flex gap-2">
            <button className="ghost-btn">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button className="ghost-btn">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="gold-btn" onClick={() => router.push('/salon/customers/new')}>
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            icon={Users}
            label="Total Customers"
            value={stats.totalCustomers}
            trend={{ value: '+12%', isPositive: true }}
            iconBg="bg-gold-500/10"
          />
          <KpiCard
            icon={DollarSign}
            label="Total Revenue"
            value={`AED ${stats.totalRevenue.toLocaleString()}`}
            iconBg="bg-emerald-500/10"
          />
          <KpiCard
            icon={TrendingUp}
            label="Average Spend"
            value={`AED ${stats.avgSpend}`}
            iconBg="bg-blue-500/10"
          />
          <KpiCard
            icon={Star}
            label="VIP Customers"
            value={stats.vipCount}
            iconBg="bg-purple-500/10"
          />
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-500" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glass-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={loyaltyFilter}
              onChange={e => setLoyaltyFilter(e.target.value)}
              className="glass-select"
            >
              <option value="all">All Tiers</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Bronze">Bronze</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="glass-select"
            >
              <option value="name">Sort by Name</option>
              <option value="recent">Most Recent</option>
              <option value="value">Highest Value</option>
            </select>

            {activeFilters.length > 0 && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setLoyaltyFilter('all')
                  setSearchTerm('')
                }}
                className="text-sm text-text-500 hover:text-text-300 transition-colors whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex gap-2 mt-3">
              {activeFilters.map((filter, idx) => (
                <FilterChip
                  key={idx}
                  label={`${filter.type}: ${filter.value}`}
                  onRemove={() => {
                    if (filter.type === 'status') setStatusFilter('all')
                    if (filter.type === 'loyalty') setLoyaltyFilter('all')
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent mx-auto" />
              <p className="mt-4 text-text-500">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 glass-card p-8">
              <p className="text-red-400">Error loading customers: {error}</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 glass-card p-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-text-500" />
              <p className="text-text-300 text-lg">No customers found</p>
              <p className="text-sm mt-2 text-text-500">
                {searchTerm || activeFilters.length > 0
                  ? 'Try adjusting your filters'
                  : 'Add your first customer to get started'}
              </p>
              {!(searchTerm || activeFilters.length > 0) && (
                <button
                  onClick={() => router.push('/salon/customers/new')}
                  className="gold-btn mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Add First Customer
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <CustomerRow
                key={customer.entity.id}
                customer={customer}
                onClick={() => router.push(`/salon/customers/${customer.entity.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
