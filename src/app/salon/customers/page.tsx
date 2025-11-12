'use client'

// Removed force-dynamic for better client-side navigation performance

import React, { useState, useMemo, useCallback, Suspense, lazy, useEffect } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraCustomers, type CustomerEntity } from '@/hooks/useHeraCustomers'
import { CustomerList } from '@/components/salon/customers/CustomerList'
import type { CustomerFormData } from '@/components/salon/customers/CustomerModal'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { SalonPagination } from '@/components/salon/ui/Pagination'

// 🚀 LAZY LOADING: Split code for faster initial load
const CustomerModal = lazy(() =>
  import('@/components/salon/customers/CustomerModal').then(module => ({ default: module.CustomerModal }))
)

import {
  Plus,
  Grid3X3,
  List,
  Users,
  Star,
  TrendingUp,
  DollarSign,
  Filter,
  X,
  Archive,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Search
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

// Skeleton loaders for initial page load
function CustomerListSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-pulse'
          : 'space-y-3 animate-pulse'
      }
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={viewMode === 'grid' ? 'h-64 rounded-lg' : 'h-24 rounded-lg'}
          style={{
            backgroundColor: COLORS.charcoalLight + '95',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-full" style={{ backgroundColor: COLORS.gold + '20' }} />
            <div className="h-4 rounded" style={{ backgroundColor: COLORS.bronze + '30', width: '80%' }} />
            <div className="h-3 rounded" style={{ backgroundColor: COLORS.bronze + '20', width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SalonCustomersPageContent() {
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [sortBy, setSortBy] = useState('name_asc')
  // 📄 PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50) // 50 customers per page
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerEntity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 🔄 RESET PAGE: Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy, includeArchived])

  // 🚨 ENTERPRISE ERROR LOGGING: Detailed console logs with timestamps
  const logError = useCallback(
    (context: string, error: any, additionalInfo?: any) => {
      const timestamp = new Date().toISOString()
      const errorLog = {
        timestamp,
        context,
        error: {
          message: error?.message || String(error),
          stack: error?.stack,
          code: error?.code,
          name: error?.name
        },
        additionalInfo,
        organizationId
      }

      console.error('🚨 [HERA Customers Error]', errorLog)

      if (process.env.NODE_ENV === 'development') {
        console.group('🔍 Error Details')
        console.log('Context:', context)
        console.log('Message:', error?.message)
        console.log('Stack:', error?.stack)
        console.log('Additional Info:', additionalInfo)
        console.groupEnd()
      }

      return errorLog
    },
    [organizationId]
  )

  // 🔍 DEBUG: Log filter states
  if (process.env.NODE_ENV === 'development') {
    console.log('[CustomersPage] 🔍 Filter states:', {
      includeArchived,
      searchQuery,
      organizationId
    })
  }

  // Fetch customers using Universal API v2
  const {
    customers,
    allCustomers,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    archiveCustomer,
    restoreCustomer,
    getCustomerStats,
    refetch: refetchCustomers
  } = useHeraCustomers({
    includeArchived,
    searchQuery,
    organizationId
  })

  // 🔍 DEBUG: Log customer data
  if (process.env.NODE_ENV === 'development') {
    console.log('[CustomersPage] 📊 Customer data:', {
      totalCustomers: allCustomers.length,
      filteredCustomers: customers.length,
      activeCount: allCustomers.filter(c => c.status === 'active').length,
      archivedCount: allCustomers.filter(c => c.status === 'archived').length,
      includeArchived
    })
  }

  // 🔍 DEBUG: The issue - allCustomers from hook is ALREADY filtered by status
  // When includeArchived=false, the hook filters to status='active' only
  // So allCustomers.filter(c => c.status === 'archived') returns ZERO always!
  // We need to use the customers array for display, but keep separate KPI counts

  // Get customer statistics from the FILTERED list (this is what we're displaying)
  const stats = useMemo(() => getCustomerStats(), [getCustomerStats])

  // Count active and archived from what we're currently DISPLAYING
  const activeCount = useMemo(
    () => customers.filter(c => c.status === 'active').length,
    [customers]
  )
  const archivedCount = useMemo(
    () => customers.filter(c => c.status === 'archived').length,
    [customers]
  )

  // Total count from the displayed customers (includes archived if includeArchived is true)
  const totalDisplayed = useMemo(() => customers.length, [customers])

  // Filter and sort customers - memoized for performance
  const filteredAndSortedCustomers = useMemo(() => {
    // Step 1: Sort customers - Active customers first, then archived
    const sorted = [...customers].sort((a, b) => {
      // Primary sort: Active customers before archived customers
      const aIsArchived = a.status === 'archived'
      const bIsArchived = b.status === 'archived'

      if (aIsArchived !== bIsArchived) {
        return aIsArchived ? 1 : -1 // Active customers (false) come first
      }

      // Secondary sort: Apply user-selected sorting within each group
      switch (sortBy) {
        case 'name_asc':
          return (a.entity_name || '').localeCompare(b.entity_name || '')
        case 'name_desc':
          return (b.entity_name || '').localeCompare(a.entity_name || '')
        case 'lifetime_value_asc':
          return (a.lifetime_value || 0) - (b.lifetime_value || 0)
        case 'lifetime_value_desc':
          return (b.lifetime_value || 0) - (a.lifetime_value || 0)
        case 'visits_asc':
          return (a.total_visits || 0) - (b.total_visits || 0)
        case 'visits_desc':
          return (b.total_visits || 0) - (a.total_visits || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [customers, sortBy])

  // 📄 PAGINATION CALCULATIONS: Slice data for current page
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / pageSize)
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedCustomers.slice(startIndex, endIndex)
  }, [filteredAndSortedCustomers, currentPage, pageSize])

  // CRUD Handlers - memoized for performance
  const handleSave = useCallback(
    async (data: CustomerFormData) => {
      const loadingId = showLoading(
        editingCustomer ? 'Updating customer...' : 'Creating customer...',
        'Please wait while we save your changes'
      )

      try {
        if (editingCustomer) {
          await updateCustomer(editingCustomer.id, data)
          removeToast(loadingId)
          showSuccess('Customer updated successfully', `${data.name} has been updated`)
        } else {
          await createCustomer(data)
          removeToast(loadingId)
          showSuccess('Customer created successfully', `${data.name} has been added`)
        }
        setModalOpen(false)
        setEditingCustomer(null)
      } catch (error: any) {
        logError(editingCustomer ? 'Update Customer Failed' : 'Create Customer Failed', error, {
          customerName: data.name,
          customerData: data
        })
        removeToast(loadingId)
        showError(
          editingCustomer ? 'Failed to update customer' : 'Failed to create customer',
          error.message || 'Please check the console for detailed error information and try again'
        )
      }
    },
    [
      editingCustomer,
      updateCustomer,
      createCustomer,
      showLoading,
      removeToast,
      showSuccess,
      showError,
      logError
    ]
  )

  const handleEdit = useCallback((customer: CustomerEntity) => {
    setEditingCustomer(customer)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((customer: CustomerEntity) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!customerToDelete) return

    const loadingId = showLoading('Processing deletion...', 'Checking customer usage...')
    setIsDeleting(true)

    try {
      await deleteCustomer(customerToDelete.id, true)
      removeToast(loadingId)
      showSuccess(
        'Customer deleted permanently',
        `${customerToDelete.entity_name} has been permanently removed from the system.`
      )
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)

      // ENTERPRISE-GRADE ERROR HANDLING
      const errorCode = error.code || error.error?.code
      const errorMessage = error.message || error.error?.message || ''

      const isExpectedFallback =
        errorCode === 'FOREIGN_KEY_CONSTRAINT' || errorCode === 'TRANSACTION_INTEGRITY_VIOLATION'

      if (!isExpectedFallback) {
        logError('Delete Customer Failed', error, {
          customerId: customerToDelete.id,
          customerName: customerToDelete.entity_name,
          errorCode,
          errorMessage
        })
      }

      // Transaction Integrity Violation - MUST soft delete
      if (errorCode === 'TRANSACTION_INTEGRITY_VIOLATION') {
        try {
          console.info(
            '✅ [handleConfirmDelete] Automatic fallback to soft delete (transaction history exists)',
            {
              customerId: customerToDelete.id,
              customerName: customerToDelete.entity_name
            }
          )

          const softDeleteLoadingId = showLoading(
            'Customer has transaction history',
            'Marking as deleted to preserve audit trail...'
          )

          await updateCustomer(customerToDelete.id, { status: 'deleted' } as any)

          console.info('✅ [handleConfirmDelete] Soft delete completed successfully:', {
            customerId: customerToDelete.id,
            newStatus: 'deleted'
          })

          await refetchCustomers()

          removeToast(softDeleteLoadingId)
          showSuccess(
            'Customer marked as deleted',
            `${customerToDelete.entity_name} has transaction history and cannot be permanently removed. It has been marked as deleted.`
          )
          setDeleteDialogOpen(false)
          setCustomerToDelete(null)
        } catch (softDeleteError: any) {
          logError('Soft Delete Customer Failed', softDeleteError, {
            customerId: customerToDelete.id
          })
          showError(
            'Failed to mark customer as deleted',
            softDeleteError.message || 'Please contact support'
          )
        }
      }
      // Foreign Key Constraint
      else if (errorCode === 'FOREIGN_KEY_CONSTRAINT') {
        try {
          console.info(
            '✅ [handleConfirmDelete] Automatic fallback to soft delete (referenced by other records)',
            {
              customerId: customerToDelete.id,
              customerName: customerToDelete.entity_name
            }
          )

          const softDeleteLoadingId = showLoading(
            'Customer is referenced',
            'Marking as deleted to preserve data integrity...'
          )

          await updateCustomer(customerToDelete.id, { status: 'deleted' } as any)

          await refetchCustomers()

          removeToast(softDeleteLoadingId)
          showSuccess(
            'Customer marked as deleted',
            `${customerToDelete.entity_name} is referenced by other records. It has been marked as deleted.`
          )
          setDeleteDialogOpen(false)
          setCustomerToDelete(null)
        } catch (softDeleteError: any) {
          logError('Soft Delete Customer Failed', softDeleteError, {
            customerId: customerToDelete.id
          })
          showError(
            'Failed to mark customer as deleted',
            softDeleteError.message || 'Please contact support'
          )
        }
      }
      // Permission or other errors
      else if (errorCode === 'FORBIDDEN') {
        showError('Permission denied', 'You do not have permission to delete this customer')
      } else {
        showError(
          'Failed to delete customer',
          errorMessage || 'An unexpected error occurred. Please try again.'
        )
      }
    } finally {
      setIsDeleting(false)
    }
  }, [
    customerToDelete,
    deleteCustomer,
    updateCustomer,
    refetchCustomers,
    showLoading,
    removeToast,
    showSuccess,
    showError,
    logError
  ])

  const handleArchive = useCallback(
    async (customer: CustomerEntity) => {
      const loadingId = showLoading('Archiving customer...', 'Please wait...')

      try {
        await archiveCustomer(customer.id)
        removeToast(loadingId)
        showSuccess('Customer archived', `${customer.entity_name} has been archived`)
      } catch (error: any) {
        logError('Archive Customer Failed', error, {
          customerId: customer.id,
          customerName: customer.entity_name
        })
        removeToast(loadingId)
        showError('Failed to archive customer', error.message || 'Please try again')
      }
    },
    [archiveCustomer, showLoading, removeToast, showSuccess, showError, logError]
  )

  const handleRestore = useCallback(
    async (customer: CustomerEntity) => {
      const loadingId = showLoading('Restoring customer...', 'Please wait...')

      try {
        await restoreCustomer(customer.id)
        removeToast(loadingId)
        showSuccess('Customer restored', `${customer.entity_name} has been restored to active`)
      } catch (error: any) {
        logError('Restore Customer Failed', error, {
          customerId: customer.id,
          customerName: customer.entity_name
        })
        removeToast(loadingId)
        showError('Failed to restore customer', error.message || 'Please try again')
      }
    },
    [restoreCustomer, showLoading, removeToast, showSuccess, showError, logError]
  )

  return (
    <SalonLuxePage
      title="Customers"
      description="Manage your customer database and loyalty program"
      maxWidth="full"
      padding="lg"
      actions={
        <>
          {/* New Customer - Gold */}
          <button
            onClick={() => {
              setEditingCustomer(null)
              setModalOpen(true)
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black,
              border: `1px solid ${COLORS.gold}`
            }}
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
          {/* Refresh Data - Bronze */}
          <button
            onClick={() => window.location.reload()}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </>
      }
    >
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader
        title="Customers"
        subtitle={`${totalDisplayed} ${includeArchived ? 'total' : 'active'} customers`}
        showNotifications={false}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => {
              setEditingCustomer(null)
              setModalOpen(true)
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="Add new customer"
            style={{ boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)' }}
          >
            <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* 🚨 ENTERPRISE ERROR BANNER */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              backgroundColor: '#FF6B6B15',
              borderColor: '#FF6B6B40',
              color: COLORS.lightText
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" style={{ color: '#FF6B6B' }} />
              <div className="flex-1 space-y-2">
                <p className="font-semibold" style={{ color: COLORS.champagne }}>
                  Failed to load customers
                </p>
                <p className="text-sm opacity-90">{error.message}</p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: COLORS.gold + '30',
                      color: COLORS.champagne,
                      border: `1px solid ${COLORS.gold}50`
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📊 KPI CARDS - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          <SalonLuxeKPICard
            title={includeArchived ? "Total Customers" : "Active Customers"}
            value={totalDisplayed}
            icon={Users}
            color={COLORS.emerald}
            description={includeArchived ? "Active + Archived" : "Current active base"}
            animationDelay={0}
          />
          <SalonLuxeKPICard
            title="VIP Customers"
            value={stats.vipCustomers}
            icon={Star}
            color={COLORS.gold}
            description="Premium members"
            animationDelay={100}
            percentageBadge={
              stats.totalCustomers > 0
                ? `${((stats.vipCustomers / stats.totalCustomers) * 100).toFixed(0)}%`
                : undefined
            }
          />
          <SalonLuxeKPICard
            title={includeArchived ? "Active" : "Search Results"}
            value={activeCount}
            icon={UserPlus}
            color={COLORS.emerald}
            description={includeArchived ? "Active customers" : `Showing ${totalDisplayed} results`}
            animationDelay={200}
          />
          <SalonLuxeKPICard
            title="Avg Lifetime Value"
            value={Math.round(stats.averageLifetimeValue).toLocaleString()}
            icon={TrendingUp}
            color={COLORS.gold}
            description="Per customer (currency)"
            animationDelay={300}
          />
        </div>

        {/* 📱 MOBILE QUICK ACTIONS */}
        <div className="md:hidden mb-6 space-y-2">
          <button
            onClick={() => {
              setEditingCustomer(null)
              setModalOpen(true)
            }}
            className="w-full min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black
            }}
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}40`,
                color: COLORS.bronze
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar - MOBILE RESPONSIVE */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search Bar - Full Width */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: COLORS.charcoalLight,
                color: COLORS.champagne,
                border: `1px solid ${COLORS.bronze}30`,
                focusRing: COLORS.gold
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-bronze/20 transition-colors"
                style={{ color: COLORS.bronze }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Row - EXACT Pattern as Products Page */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left Side: Active/All Toggle Only */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Active / All Customers Toggle */}
              <div
                className="flex items-center gap-1 p-1 rounded-lg"
                style={{ backgroundColor: COLORS.charcoalLight }}
              >
                <button
                  onClick={() => setIncludeArchived(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                  style={{
                    backgroundColor: !includeArchived ? COLORS.gold + '20' : 'transparent',
                    color: !includeArchived ? COLORS.gold : COLORS.lightText
                  }}
                >
                  Active
                </button>
                <button
                  onClick={() => setIncludeArchived(true)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                  style={{
                    backgroundColor: includeArchived ? COLORS.gold + '20' : 'transparent',
                    color: includeArchived ? COLORS.gold : COLORS.lightText
                  }}
                >
                  All
                </button>
              </div>
            </div>

            {/* Right Side: Sort Dropdown + View Mode Toggle */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className="w-full md:w-56 transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: COLORS.charcoalLight + '80',
                    borderColor: COLORS.bronze + '40',
                    color: COLORS.champagne
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="name_asc" className="hera-select-item">
                    Name (A-Z)
                  </SelectItem>
                  <SelectItem value="name_desc" className="hera-select-item">
                    Name (Z-A)
                  </SelectItem>
                  <SelectItem value="lifetime_value_desc" className="hera-select-item">
                    Lifetime Value (High to Low)
                  </SelectItem>
                  <SelectItem value="lifetime_value_asc" className="hera-select-item">
                    Lifetime Value (Low to High)
                  </SelectItem>
                  <SelectItem value="visits_desc" className="hera-select-item">
                    Visits (Most First)
                  </SelectItem>
                  <SelectItem value="visits_asc" className="hera-select-item">
                    Visits (Least First)
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Grid / List View Toggle */}
              <div
                className="flex items-center gap-1 p-1 rounded-lg"
                style={{ backgroundColor: COLORS.charcoalLight }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  style={{
                    backgroundColor: viewMode === 'grid' ? COLORS.gold + '20' : 'transparent',
                    color: viewMode === 'grid' ? COLORS.gold : COLORS.lightText
                  }}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  style={{
                    backgroundColor: viewMode === 'list' ? COLORS.gold + '20' : 'transparent',
                    color: viewMode === 'list' ? COLORS.gold : COLORS.lightText
                  }}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 🔄 MAIN CONTENT - Customer List */}
        {isLoading ? (
          <div className="space-y-4">
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: COLORS.charcoalLight + '50' }}
            >
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gold/30 border-t-gold" />
                <div>
                  <p className="font-medium" style={{ color: COLORS.champagne }}>
                    Loading customers...
                  </p>
                  <p className="text-xs" style={{ color: COLORS.bronze }}>
                    Fetching customer database
                  </p>
                </div>
              </div>
            </div>
            <CustomerListSkeleton viewMode={viewMode} />
          </div>
        ) : (
          <CustomerList
            customers={paginatedCustomers}
            viewMode={viewMode}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onRestore={handleRestore}
          />
        )}

        {/* 📄 PAGINATION CONTROLS: Enterprise-grade pagination */}
        {!isLoading && filteredAndSortedCustomers.length > 0 && (
          <div className="mt-6">
            <SalonPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedCustomers.length}
              pageSize={pageSize}
              pageSizeOptions={[25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1) // Reset to first page when changing page size
              }}
              itemsName="customers"
            />
          </div>
        )}

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-20 md:h-0" />
      </div>

      {/* MODALS - Lazy Loaded */}
      {modalOpen && (
        <Suspense fallback={null}>
          <CustomerModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingCustomer(null)
            }}
            onSubmit={handleSave}
            customer={editingCustomer}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.rose}40`,
            boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
          }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#FF6B6B20',
                  border: '1px solid #FF6B6B40'
                }}
              >
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                Delete Customer
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3" style={{ color: COLORS.lightText }}>
            <p className="text-sm">
              Are you sure you want to delete{' '}
              <span className="font-semibold" style={{ color: COLORS.champagne }}>
                "{customerToDelete?.entity_name}"
              </span>
              ?
            </p>
            <p className="text-sm opacity-70">
              This action cannot be undone if the customer has no transaction history. If the customer
              has appointments or transactions, they will be archived instead.
            </p>
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setCustomerToDelete(null)
              }}
              disabled={isDeleting}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Customer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SalonLuxePage>
  )
}

export default function SalonCustomersPage() {
  return (
    <StatusToastProvider>
      <SalonCustomersPageContent />
    </StatusToastProvider>
  )
}
