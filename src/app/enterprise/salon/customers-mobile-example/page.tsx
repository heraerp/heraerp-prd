// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";

/**
 * HERA Salon: Mobile-Optimized Customers Page (EXAMPLE)
 * Smart Code: HERA.SALON.CUSTOMERS.MOBILE.EXAMPLE.V1
 *
 * This is a reference implementation showing:
 * - SalonMobileLayout wrapper
 * - MobileDataTable with touch-safe targets
 * - Cached data fetching
 * - Responsive cards on mobile, table on desktop
 *
 * Copy this pattern to other salon pages
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { SalonMobileLayout, MobileDataTable, MobileCard } from '@/components/salon/mobile/SalonMobileLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, UserPlus, Phone, Mail, Star } from 'lucide-react'

const COLORS = {
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  charcoal: '#1A1A1A'
}

export default function CustomersMobileExample() {
  const router = useRouter()
  const { organizationId, organization, isLoading: orgLoading } = useSecuredSalonContext()
  const [searchQuery, setSearchQuery] = useState('')

  // ✅ HERA v2.2: Fetch customers with React Query caching
  const {
    entities: customers,
    isLoading: customersLoading,
    refetch
  } = useUniversalEntity({
    entity_type: 'CUSTOMER',
    organizationId: organizationId || '',
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100
    },
    staleTime: 60000, // 60s cache
    refetchOnWindowFocus: false
  })

  const isLoading = orgLoading || customersLoading

  // Filter customers by search query
  const filteredCustomers = customers?.filter((c) =>
    c.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Loading state
  if (orgLoading) {
    return (
      <SalonMobileLayout title="Customers" showBottomNav={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.gold }} />
        </div>
      </SalonMobileLayout>
    )
  }

  if (!organizationId) {
    return (
      <SalonMobileLayout title="Customers" showBottomNav={true}>
        <div className="text-center py-12">
          <p style={{ color: COLORS.bronze }}>Please log in to view customers</p>
        </div>
      </SalonMobileLayout>
    )
  }

  return (
    <SalonMobileLayout title="Customers" showBottomNav={true}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Customers
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.bronze }}>
              {organization?.entity_name || organization?.name || 'Salon'}
            </p>
          </div>

          {/* Add Customer Button - Touch-safe */}
          <Button
            onClick={() => router.push('/salon/customers/new')}
            className="w-full sm:w-auto"
            style={{
              minHeight: '44px',
              backgroundColor: COLORS.gold,
              color: COLORS.charcoal
            }}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Search Bar - Touch-optimized */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            style={{ color: COLORS.bronze }}
          />
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
            style={{
              minHeight: '44px',
              backgroundColor: COLORS.charcoal,
              borderColor: `${COLORS.gold}30`,
              color: COLORS.champagne
            }}
          />
        </div>

        {/* Stats Cards - Mobile-optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MobileCard>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>
                {customers?.length || 0}
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.bronze }}>
                Total Customers
              </p>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                {customers?.filter(c => c.vip || c.is_vip).length || 0}
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.bronze }}>
                VIP Customers
              </p>
            </div>
          </MobileCard>

          <MobileCard className="hidden lg:block">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                {customers?.filter(c => {
                  const lastVisit = c.last_visit || c.dynamic_fields?.last_visit?.value
                  if (!lastVisit) return false
                  const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
                  return daysSince <= 30
                }).length || 0}
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.bronze }}>
                Active (30d)
              </p>
            </div>
          </MobileCard>

          <MobileCard className="hidden lg:block">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                {Math.round((customers?.filter(c => {
                  const lastVisit = c.last_visit || c.dynamic_fields?.last_visit?.value
                  if (!lastVisit) return false
                  const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
                  return daysSince <= 30
                }).length || 0) / (customers?.length || 1) * 100)}%
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.bronze }}>
                Retention Rate
              </p>
            </div>
          </MobileCard>
        </div>

        {/* Customer List - Mobile cards on mobile, table on desktop */}
        <MobileDataTable
          data={filteredCustomers}
          columns={[
            {
              key: 'entity_name',
              label: 'Customer',
              render: (name, customer) => (
                <div className="flex items-center gap-2">
                  <span style={{ color: COLORS.champagne }}>{name}</span>
                  {(customer.vip || customer.is_vip) && (
                    <Star className="w-4 h-4" style={{ color: COLORS.gold }} fill={COLORS.gold} />
                  )}
                </div>
              )
            },
            {
              key: 'phone',
              label: 'Phone',
              render: (phone) => (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: COLORS.bronze }} />
                  <span style={{ color: COLORS.champagne }}>{phone || '-'}</span>
                </div>
              )
            },
            {
              key: 'email',
              label: 'Email',
              render: (email) => (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: COLORS.bronze }} />
                  <span style={{ color: COLORS.champagne }}>{email || '-'}</span>
                </div>
              )
            },
            {
              key: 'created_at',
              label: 'Since',
              render: (date) => (
                <span style={{ color: COLORS.bronze }}>
                  {new Date(date).toLocaleDateString()}
                </span>
              )
            }
          ]}
          onRowClick={(customer) => router.push(`/salon/customers/${customer.id}`)}
          loading={customersLoading}
        />

        {/* Empty State */}
        {!customersLoading && filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg mb-2" style={{ color: COLORS.champagne }}>
              {searchQuery ? 'No customers found' : 'No customers yet'}
            </p>
            <p className="text-sm mb-6" style={{ color: COLORS.bronze }}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first customer to get started'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => router.push('/salon/customers/new')}
                style={{
                  minHeight: '44px',
                  backgroundColor: COLORS.gold,
                  color: COLORS.charcoal
                }}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add First Customer
              </Button>
            )}
          </div>
        )}
      </div>
    </SalonMobileLayout>
  )
}
