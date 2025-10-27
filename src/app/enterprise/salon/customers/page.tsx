// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";

'use client'

// Removed force-dynamic for better client-side navigation performance

import React, { useState, useMemo, useCallback } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { useHeraCustomers, type CustomerEntity } from '@/hooks/useHeraCustomers'
import { CustomerList } from '@/components/salon/customers/CustomerList'
import { CustomerModal, type CustomerFormData } from '@/components/salon/customers/CustomerModal'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { PageHeader, PageHeaderSearch, PageHeaderButton } from '@/components/universal/PageHeader'
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
  UserPlus
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

function SalonCustomersPageContent() {
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerEntity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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

  // Get customer statistics - memoized for performance
  const stats = useMemo(() => getCustomerStats(), [getCustomerStats])
  const activeCount = useMemo(
    () => allCustomers.filter(c => c.status === 'active').length,
    [allCustomers]
  )
  const archivedCount = useMemo(
    () => allCustomers.filter(c => c.status === 'archived').length,
    [allCustomers]
  )

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
        removeToast(loadingId)
        showError(
          editingCustomer ? 'Failed to update customer' : 'Failed to create customer',
          error.message || 'Please try again or contact support'
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
      showError
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
        console.log('[handleConfirmDelete] Unexpected error:', {
          errorCode,
          errorMessage,
          fullError: error
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
          console.error('[handleConfirmDelete] Soft delete failed:', {
            customerId: customerToDelete.id,
            error: softDeleteError
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
    showError
  ])

  const handleArchive = useCallback(
    async (customer: CustomerEntity) => {
      const loadingId = showLoading('Archiving customer...', 'Please wait...')

      try {
        await archiveCustomer(customer.id)
        removeToast(loadingId)
        showSuccess('Customer archived', `${customer.entity_name} has been archived`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to archive customer', error.message || 'Please try again')
      }
    },
    [archiveCustomer, showLoading, removeToast, showSuccess, showError]
  )

  const handleRestore = useCallback(
    async (customer: CustomerEntity) => {
      const loadingId = showLoading('Restoring customer...', 'Please wait...')

      try {
        await restoreCustomer(customer.id)
        removeToast(loadingId)
        showSuccess('Customer restored', `${customer.entity_name} has been restored to active`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to restore customer', error.message || 'Please try again')
      }
    },
    [restoreCustomer, showLoading, removeToast, showSuccess, showError]
  )

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: COLORS.black }}>
      <div className="h-full flex flex-col">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(212, 175, 55, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(15, 111, 92, 0.1), transparent 50%)'
          }}
        />

        {/* Page Header */}
        <div
          className="relative z-10 px-6 py-4 border-b"
          style={{ borderColor: COLORS.bronze + '30' }}
        >
          <PageHeader
            title="Customers"
            actions={
              <>
                <PageHeaderSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search customers..."
                />
                <PageHeaderButton icon={Plus} onClick={() => setModalOpen(true)}>
                  Add Customer
                </PageHeaderButton>
              </>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="relative z-10 px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Total Customers */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}15 0%, ${COLORS.charcoal}f5 50%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.emerald}60`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 30px ${COLORS.emerald}15`
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}40 0%, ${COLORS.emerald}20 100%)`,
                      border: `1.5px solid ${COLORS.emerald}60`
                    }}
                  >
                    <Users className="h-4 w-4" style={{ color: COLORS.emerald }} />
                  </div>
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze }}
                >
                  Total Customers
                </p>
                <p className="text-2xl font-bold mb-0.5" style={{ color: COLORS.champagne }}>
                  {stats.totalCustomers}
                </p>
                <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                  All time customers
                </p>
              </div>
            </div>

            {/* VIP Customers */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.plum}15 0%, ${COLORS.charcoal}f5 50%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.plum}60`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 30px ${COLORS.plum}15`
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold}40 0%, ${COLORS.gold}20 100%)`,
                      border: `1.5px solid ${COLORS.gold}60`
                    }}
                  >
                    <Star className="h-4 w-4" style={{ color: COLORS.gold }} />
                  </div>
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze }}
                >
                  VIP Customers
                </p>
                <p className="text-2xl font-bold mb-0.5" style={{ color: COLORS.gold }}>
                  {stats.vipCustomers}
                </p>
                <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                  Premium members
                </p>
              </div>
            </div>

            {/* Active Customers */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}12 0%, ${COLORS.charcoal}f5 40%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.emerald}50`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}30 0%, ${COLORS.emerald}15 100%)`,
                      border: `1px solid ${COLORS.emerald}50`
                    }}
                  >
                    <UserPlus className="h-4 w-4" style={{ color: COLORS.emerald }} />
                  </div>
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze }}
                >
                  Active Customers
                </p>
                <p className="text-2xl font-bold mb-0.5" style={{ color: COLORS.champagne }}>
                  {activeCount}
                </p>
                <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                  Current active base
                </p>
              </div>
            </div>

            {/* Average Lifetime Value */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 25%, ${COLORS.charcoal}f5 60%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.gold}80`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 30px ${COLORS.gold}15`
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold}40 0%, ${COLORS.gold}20 100%)`,
                      border: `1.5px solid ${COLORS.gold}80`
                    }}
                  >
                    <DollarSign className="h-4 w-4" style={{ color: COLORS.gold }} />
                  </div>
                  <TrendingUp className="h-3 w-3 opacity-40" style={{ color: COLORS.gold }} />
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze }}
                >
                  Avg Lifetime Value
                </p>
                <p className="text-2xl font-bold mb-0.5" style={{ color: COLORS.gold }}>
                  AED {Math.round(stats.averageLifetimeValue).toLocaleString()}
                </p>
                <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                  Per customer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="relative z-10 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
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
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Include Archived Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIncludeArchived(!includeArchived)}
              style={{
                backgroundColor: includeArchived ? COLORS.bronze + '20' : 'transparent',
                color: includeArchived ? COLORS.bronze : COLORS.lightText,
                border: `1px solid ${COLORS.bronze}30`
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              {includeArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              style={{ backgroundColor: COLORS.charcoalLight, color: COLORS.lightText }}
            >
              {customers.length} customers
            </Badge>
          </div>
        </div>

        {/* Customer List */}
        <div className="relative z-10 flex-1 overflow-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users
                  className="h-12 w-12 mx-auto mb-3 animate-pulse"
                  style={{ color: COLORS.bronze }}
                />
                <p style={{ color: COLORS.lightText }}>Loading customers...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p style={{ color: COLORS.rose }}>Error loading customers: {error.message}</p>
            </div>
          ) : (
            <CustomerList
              customers={customers}
              viewMode={viewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          )}
        </div>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCustomer(null)
        }}
        onSubmit={handleSave}
        customer={editingCustomer}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.rose}40` }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: COLORS.champagne }}>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription style={{ color: COLORS.lightText }}>
              Are you sure you want to delete {customerToDelete?.entity_name}? This action cannot be
              undone if the customer has no transaction history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              style={{
                backgroundColor: COLORS.charcoalLight,
                color: COLORS.lightText,
                border: `1px solid ${COLORS.bronze}40`
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              style={{
                backgroundColor: COLORS.rose,
                color: COLORS.charcoalDark
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Customer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SalonCustomersPage() {
  return (
    <ProtectedPage requiredSpace="salon" requiredPermissions={["salon.customers"]}>
      <StatusToastProvider>
        <SalonCustomersPageContent />
      </StatusToastProvider>
    </ProtectedPage>
  )
}
