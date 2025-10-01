// ================================================================================
// HERA SALON - CUSTOMERS PAGE
// Smart Code: HERA.PAGES.SALON.CUSTOMERS.V1
// Enterprise-grade customer management with HERA DNA UI
// ================================================================================

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FormFieldDNA,
  CardDNA,
  InfoCardDNA,
  SuccessCardDNA,
  PrimaryButtonDNA,
  SecondaryButtonDNA,
  GhostButtonDNA,
  BadgeDNA,
  SuccessBadgeDNA,
  WarningBadgeDNA,
  ScrollAreaDNA
} from '@/lib/dna/components/ui'
import { Badge } from '@/components/ui/badge'
import { PageHeader, PageHeaderButton, PageHeaderSearch } from '@/components/universal/PageHeader'
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  UserPlus,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Clock,
  MapPin,
  Gift,
  Heart
} from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

// Customer interface for type safety
interface Customer {
  entity: any
  dynamicFields: {
    email?: string
    phone?: string
    address?: string
    date_of_birth?: string
    preferences?: string
    notes?: string
    lifetime_value?: number
    visit_count?: number
    last_visit?: string
    favorite_service?: string
  }
  transactions: any[]
  relationships: any[]
}

export default function SalonCustomersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, isLoading: authLoading } = useHERAAuth()

  // Check for Hair Talkz subdomain
  const getEffectiveOrgId = () => {
    if (currentOrganization?.id) return currentOrganization.id

    // Check if we're on hairtalkz or heratalkz subdomain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (
        hostname.startsWith('hairtalkz.') ||
        hostname === 'hairtalkz.localhost' ||
        hostname.startsWith('heratalkz.') ||
        hostname === 'heratalkz.localhost'
      ) {
        return '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz org ID
      }
    }

    return currentOrganization?.id
  }

  const organizationId = getEffectiveOrgId()

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loyaltyFilter, setLoyaltyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)

  // Fetch customers using existing hook
  const { customers, stats, loading, error, refetch, createCustomer, deleteCustomer } =
    useCustomers(organizationId)

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
          r => r.relationship_type === 'has_status' && r.metadata?.status_type === 'loyalty_tier'
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
          const aValue = a.transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
          const bValue = b.transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
          return bValue - aValue
        default:
          return 0
      }
    })

    return filtered
  }, [customers, searchTerm, statusFilter, loyaltyFilter, sortBy])

  // Get loyalty tier for customer
  const getCustomerLoyalty = (customer: Customer) => {
    const loyaltyRel = customer.relationships.find(
      r => r.relationship_type === 'has_status' && r.metadata?.status_type === 'loyalty_tier'
    )
    return loyaltyRel?.metadata?.status_name || 'Bronze'
  }

  // Get customer lifetime value
  const getCustomerValue = (customer: Customer) => {
    return customer.transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  }

  // Get last visit date
  const getLastVisit = (customer: Customer) => {
    const lastTransaction = customer.transactions.sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )[0]
    return lastTransaction?.transaction_date
  }

  // Handle customer click
  const handleCustomerClick = (customer: Customer) => {
    router.push(`/salon/customers/${customer.entity.id}`)
  }

  // Handle delete customer
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId)
      toast({
        title: 'Customer deleted',
        description: 'The customer has been removed successfully'
      })
      setShowActions(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive'
      })
    }
  }

  // Show loading state while auth is loading (but not if we have Hair Talkz subdomain)
  const isHairTalkzSubdomain =
    typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('hairtalkz.') ||
      window.location.hostname === 'hairtalkz.localhost' ||
      window.location.hostname.startsWith('heratalkz.') ||
      window.location.hostname === 'heratalkz.localhost')

  if (authLoading && !isHairTalkzSubdomain) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--hera-black)' }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: 'var(--hera-gold)' }}
        />
      </div>
    )
  }

  // Check if organization is loaded
  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--hera-black)' }}
      >
        <div className="text-center">
          <p style={{ color: 'var(--hera-bronze)' }}>No organization selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Subtle gradient overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 80%, var(--hera-gold)08 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, var(--hera-bronze)05 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, var(--hera-plum)03 0%, transparent 50%)`
          }}
        />

        {/* Content container */}
        <div
          className="container mx-auto px-6 py-8 relative"
          style={{
            backgroundColor: 'var(--hera-charcoal)',
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <PageHeader
            title="Customers"
            breadcrumbs={[
              { label: 'HERA' },
              { label: 'SALON OS' },
              { label: 'Customers', isActive: true }
            ]}
            actions={
              <>
                <PageHeaderButton variant="secondary" icon={Upload}>
                  Import
                </PageHeaderButton>
                <PageHeaderButton variant="secondary" icon={Download}>
                  Export
                </PageHeaderButton>
                <PageHeaderButton
                  variant="primary"
                  icon={UserPlus}
                  onClick={() => router.push('/salon/customers/new')}
                >
                  Add Customer
                </PageHeaderButton>
              </>
            }
          />

          <div className="space-y-6 salon-luxury-focus">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InfoCardDNA>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--hera-bronze)' }}>
                      Total Customers
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--hera-champagne)' }}>
                      {stats.totalCustomers}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--hera-bronze)' }}>
                      <TrendingUp
                        className="inline w-4 h-4"
                        style={{ color: 'var(--hera-gold)' }}
                      />{' '}
                      +12% this month
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                  >
                    <Users className="w-8 h-8" style={{ color: 'var(--hera-gold)' }} />
                  </div>
                </div>
              </InfoCardDNA>

              <SuccessCardDNA>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--hera-bronze)' }}>
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--hera-champagne)' }}>
                      AED {stats.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--hera-bronze)' }}>
                      From all customers
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                  >
                    <DollarSign className="w-8 h-8" style={{ color: 'var(--hera-gold)' }} />
                  </div>
                </div>
              </SuccessCardDNA>

              <CardDNA>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--hera-bronze)' }}>
                      Average Spend
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--hera-champagne)' }}>
                      AED {stats.avgSpend}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--hera-bronze)' }}>
                      Per customer
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(140, 120, 83, 0.1)' }}
                  >
                    <TrendingUp className="w-8 h-8" style={{ color: 'var(--hera-bronze)' }} />
                  </div>
                </div>
              </CardDNA>

              <CardDNA>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--hera-bronze)' }}>
                      VIP Customers
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--hera-champagne)' }}>
                      {stats.vipCount}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--hera-bronze)' }}>
                      Platinum tier
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(90, 42, 64, 0.1)' }}
                  >
                    <Star className="w-8 h-8" style={{ color: 'var(--hera-plum)' }} />
                  </div>
                </div>
              </CardDNA>
            </div>

            {/* Filters */}
            <CardDNA>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormFieldDNA
                  type="text"
                  label="Search Customers"
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Name, email or phone..."
                  icon={Search}
                />

                <FormFieldDNA
                  type="select"
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  icon={Filter}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                />

                <FormFieldDNA
                  type="select"
                  label="Loyalty Tier"
                  value={loyaltyFilter}
                  onChange={setLoyaltyFilter}
                  icon={Star}
                  options={[
                    { value: 'all', label: 'All Tiers' },
                    { value: 'Platinum', label: 'Platinum' },
                    { value: 'Gold', label: 'Gold' },
                    { value: 'Silver', label: 'Silver' },
                    { value: 'Bronze', label: 'Bronze' }
                  ]}
                />

                <FormFieldDNA
                  type="select"
                  label="Sort By"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'name', label: 'Name (A-Z)' },
                    { value: 'recent', label: 'Most Recent' },
                    { value: 'value', label: 'Highest Value' }
                  ]}
                />
              </div>
            </CardDNA>

            {/* Customer List */}
            <CardDNA>
              {loading ? (
                <div className="text-center py-12">
                  <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto"
                    style={{ borderColor: 'var(--hera-gold)', borderTopColor: 'transparent' }}
                  />
                  <p className="mt-4" style={{ color: 'var(--hera-bronze)' }}>
                    Loading customers...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p style={{ color: 'var(--hera-rose)' }}>Error loading customers: {error}</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: 'var(--hera-bronze)' }}
                  />
                  <p style={{ color: 'var(--hera-champagne)' }}>No customers found</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--hera-bronze)' }}>
                    Try adjusting your filters or add a new customer
                  </p>
                </div>
              ) : (
                <ScrollAreaDNA height="h-[600px]">
                  <div className="space-y-2 pr-4">
                    {filteredCustomers.map(customer => {
                      const loyaltyTier = getCustomerLoyalty(customer)
                      const lifetimeValue = getCustomerValue(customer)
                      const lastVisit = getLastVisit(customer)

                      return (
                        <div
                          key={customer.entity.id}
                          className="group relative p-4 rounded-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'var(--hera-charcoal)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--hera-gold)'
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(212, 175, 55, 0.1)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)'
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                          onClick={() => handleCustomerClick(customer)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg"
                                style={{
                                  background: `linear-gradient(135deg, var(--hera-gold) 0%, var(--hera-gold-dark) 100%)`,
                                  color: 'var(--hera-black)'
                                }}
                              >
                                {customer.entity.entity_name?.charAt(0).toUpperCase() || '?'}
                              </div>

                              <div>
                                <h3
                                  className="font-medium"
                                  style={{ color: 'var(--hera-champagne)' }}
                                >
                                  {customer.entity.entity_name}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                  {customer.dynamicFields.email && (
                                    <span
                                      className="text-sm flex items-center gap-1"
                                      style={{ color: 'var(--hera-bronze)' }}
                                    >
                                      <Mail className="w-3 h-3" />
                                      {customer.dynamicFields.email}
                                    </span>
                                  )}
                                  {customer.dynamicFields.phone && (
                                    <span
                                      className="text-sm flex items-center gap-1"
                                      style={{ color: 'var(--hera-bronze)' }}
                                    >
                                      <Phone className="w-3 h-3" />
                                      {customer.dynamicFields.phone}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm" style={{ color: 'var(--hera-bronze)' }}>
                                    Lifetime Value:{' '}
                                    <span
                                      className="font-medium"
                                      style={{ color: 'var(--hera-gold)' }}
                                    >
                                      AED {lifetimeValue}
                                    </span>
                                  </span>
                                  {lastVisit && (
                                    <span
                                      className="text-sm flex items-center gap-1"
                                      style={{ color: 'var(--hera-bronze)' }}
                                    >
                                      <Clock className="w-3 h-3" />
                                      Last visit: {format(new Date(lastVisit), 'MMM dd, yyyy')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge
                                className="gap-1 font-medium border"
                                style={{
                                  backgroundColor:
                                    loyaltyTier === 'Platinum'
                                      ? 'rgba(245, 230, 200, 0.15)'
                                      : loyaltyTier === 'Gold'
                                        ? 'rgba(212, 175, 55, 0.15)'
                                        : loyaltyTier === 'Silver'
                                          ? 'rgba(140, 120, 83, 0.15)'
                                          : 'rgba(140, 120, 83, 0.1)',
                                  color:
                                    loyaltyTier === 'Platinum'
                                      ? 'var(--hera-champagne)'
                                      : loyaltyTier === 'Gold'
                                        ? 'var(--hera-gold)'
                                        : loyaltyTier === 'Silver'
                                          ? 'var(--hera-bronze)'
                                          : 'var(--hera-bronze)',
                                  borderColor:
                                    loyaltyTier === 'Platinum'
                                      ? 'rgba(245, 230, 200, 0.3)'
                                      : loyaltyTier === 'Gold'
                                        ? 'rgba(212, 175, 55, 0.3)'
                                        : loyaltyTier === 'Silver'
                                          ? 'rgba(140, 120, 83, 0.3)'
                                          : 'rgba(140, 120, 83, 0.2)'
                                }}
                              >
                                <Star className="w-3 h-3" />
                                {loyaltyTier}
                              </Badge>

                              <Badge
                                className="gap-1 font-medium border"
                                style={{
                                  backgroundColor:
                                    customer.entity.status === 'active'
                                      ? 'rgba(212, 175, 55, 0.15)'
                                      : 'rgba(140, 120, 83, 0.1)',
                                  color:
                                    customer.entity.status === 'active'
                                      ? 'var(--hera-gold)'
                                      : 'var(--hera-bronze)',
                                  borderColor:
                                    customer.entity.status === 'active'
                                      ? 'rgba(212, 175, 55, 0.3)'
                                      : 'rgba(140, 120, 83, 0.2)'
                                }}
                              >
                                {customer.entity.status}
                              </Badge>

                              <div className="relative">
                                <GhostButtonDNA
                                  icon={MoreVertical}
                                  onClick={e => {
                                    e.stopPropagation()
                                    setShowActions(
                                      showActions === customer.entity.id ? null : customer.entity.id
                                    )
                                  }}
                                />

                                {showActions === customer.entity.id && (
                                  <div
                                    className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-2 z-10"
                                    style={{
                                      backgroundColor: 'var(--hera-charcoal)',
                                      border: '1px solid rgba(212, 175, 55, 0.2)'
                                    }}
                                  >
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                                      style={{ color: 'var(--hera-light-text)' }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor =
                                          'rgba(212, 175, 55, 0.1)'
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }}
                                      onClick={e => {
                                        e.stopPropagation()
                                        router.push(`/salon/customers/${customer.entity.id}`)
                                      }}
                                    >
                                      <Eye className="w-4 h-4" /> View Details
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                                      style={{ color: 'var(--hera-light-text)' }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor =
                                          'rgba(212, 175, 55, 0.1)'
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }}
                                      onClick={e => {
                                        e.stopPropagation()
                                        router.push(`/salon/customers/${customer.entity.id}/edit`)
                                      }}
                                    >
                                      <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                                      style={{ color: 'var(--hera-light-text)' }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor =
                                          'rgba(212, 175, 55, 0.1)'
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }}
                                      onClick={e => {
                                        e.stopPropagation()
                                        router.push(
                                          `/salon/appointments/new?customerId=${customer.entity.id}`
                                        )
                                      }}
                                    >
                                      <Calendar className="w-4 h-4" /> Book Appointment
                                    </button>
                                    <hr
                                      className="my-2"
                                      style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
                                    />
                                    <button
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                                      style={{ color: 'var(--hera-rose)' }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor =
                                          'rgba(232, 180, 184, 0.1)'
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }}
                                      onClick={e => {
                                        e.stopPropagation()
                                        if (
                                          confirm('Are you sure you want to delete this customer?')
                                        ) {
                                          handleDeleteCustomer(customer.entity.id)
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollAreaDNA>
              )}
            </CardDNA>
          </div>
        </div>
      </div>
    </div>
  )
}
