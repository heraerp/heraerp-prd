'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo, useCallback } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraServices } from '@/hooks/useHeraServices'
import { useHeraServiceCategories } from '@/hooks/useHeraServiceCategories'
import { ServiceList } from '@/components/salon/services/ServiceList'
import { ServiceModal } from '@/components/salon/services/ServiceModal'
import { ServiceCategoryModal } from '@/components/salon/services/ServiceCategoryModal'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { Service, ServiceFormValues } from '@/types/salon-service'
import { ServiceCategory, ServiceCategoryFormValues } from '@/types/salon-service'
import { PageHeader, PageHeaderSearch, PageHeaderButton } from '@/components/universal/PageHeader'
import {
  Plus,
  Grid3X3,
  List,
  Sparkles,
  Search,
  Download,
  Filter,
  X,
  Tag,
  FolderPlus,
  AlertTriangle,
  Clock,
  Building2,
  MapPin
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

function SalonServicesPageContent() {
  const {
    organization,
    currency,
    selectedBranchId,
    availableBranches,
    setSelectedBranchId,
    isLoadingBranches
  } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const organizationId = organization?.id

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('name_asc')
  // Local branch filter state (separate from global context)
  const [localBranchFilter, setLocalBranchFilter] = useState<string | null>(null)

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)

  // ✅ PERFORMANCE FIX: Fetch services ONCE (not twice!) with NO filters
  // Then derive both KPIs and filtered list from this single dataset
  // This cuts API calls in HALF and makes initial load much faster
  const {
    services: allServices,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    archiveService,
    restoreService
  } = useHeraServices({
    organizationId,
    filters: {
      // Fetch ALL services (no filters) - we'll filter in memory
      branch_id: undefined,
      category_id: undefined,
      status: undefined // Get everything - filtering happens client-side
    }
  })

  // Derive filtered services for display (client-side filtering is fast)
  const services = useMemo(() => {
    if (!allServices) return []

    return allServices.filter(service => {
      // Apply tab filter (active vs all)
      if (!includeArchived && service.status === 'archived') return false

      // Apply branch filter (if selected)
      if (localBranchFilter) {
        const availableAt = service.relationships?.available_at || service.relationships?.AVAILABLE_AT
        if (!availableAt) return false

        if (Array.isArray(availableAt)) {
          const hasMatch = availableAt.some(
            rel => rel.to_entity?.id === localBranchFilter || rel.to_entity_id === localBranchFilter
          )
          if (!hasMatch) return false
        } else {
          if (availableAt.to_entity?.id !== localBranchFilter && availableAt.to_entity_id !== localBranchFilter) {
            return false
          }
        }
      }

      // Apply category filter (if selected)
      if (categoryFilter && service.category !== categoryFilter) return false

      return true
    })
  }, [allServices, includeArchived, localBranchFilter, categoryFilter])

  // KPIs always use ALL services (unfiltered) for accurate totals
  const allServicesForKPIs = allServices

  // Fetch categories using Universal API v2
  const {
    categories: serviceCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    isCreating: isCreatingCategory,
    isUpdating: isUpdatingCategory
  } = useHeraServiceCategories({
    organizationId,
    includeArchived: false
  })

  // Memoized computed values for performance
  const categories = useMemo(
    () => serviceCategories.filter(cat => cat && cat.entity_name).map(cat => cat.entity_name),
    [serviceCategories]
  )

  // Filter services - memoized for performance
  const filteredServices = useMemo(
    () =>
      services.filter(service => {
        if (!service || !service.entity_name) return false

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (
            !service.entity_name.toLowerCase().includes(query) &&
            !service.entity_code?.toLowerCase().includes(query)
          ) {
            return false
          }
        }

        // Branch filter is handled in useHeraServices hook via AVAILABLE_AT relationships
        // No additional filtering needed here

        // Category filter
        if (categoryFilter && service.category !== categoryFilter) {
          return false
        }

        return true
      }),
    [services, searchQuery, categoryFilter]
  )

  // CRUD handlers - memoized for performance
  const handleSave = useCallback(
    async (data: ServiceFormValues) => {
      const loadingId = showLoading(
        editingService ? 'Updating service...' : 'Creating service...',
        'Please wait while we save your changes'
      )

      try {
        // CRITICAL: If no branches are selected, default to ALL branches
        // This ensures the service is visible regardless of branch filter
        const branchesToLink =
          data.branch_ids && data.branch_ids.length > 0
            ? data.branch_ids
            : availableBranches.map(b => b.id) // Default to ALL branches

        console.log('[handleSave] Creating/updating service:', {
          name: data.name,
          price: data.price,
          duration: data.duration_minutes,
          status: data.status,
          category: data.category,
          selectedBranches: data.branch_ids?.length || 0,
          defaultingToAllBranches: !data.branch_ids || data.branch_ids.length === 0,
          totalBranches: availableBranches.length,
          branchesToLink: branchesToLink.length
        })

        // Map form data to hook's expected format
        const serviceData = {
          name: data.name,
          price_market: data.price || 0,
          duration_min: data.duration_minutes || 0,
          commission_rate: 0.5, // Default commission rate
          description: data.description || '',
          active: data.status === 'active',
          requires_booking: data.requires_booking || false,
          category_id: data.category || undefined,
          branch_ids: branchesToLink, // Always link to at least one branch
          // 🎯 CRITICAL FIX: Pass status for BOTH create and edit (not conditional)
          // This allows status dropdown to work properly in the modal
          status: data.status
        }

        if (editingService) {
          await updateService(editingService.id, serviceData)
          removeToast(loadingId)
          showSuccess('Service updated successfully', `${data.name} has been updated`)
        } else {
          await createService(serviceData)
          removeToast(loadingId)
          showSuccess('Service created successfully', `${data.name} has been added`)
        }
        setModalOpen(false)
        setEditingService(null)
      } catch (error: any) {
        console.error('Service save error:', error)
        removeToast(loadingId)
        showError(
          editingService ? 'Failed to update service' : 'Failed to create service',
          error.message || 'Please try again or contact support'
        )
      }
    },
    [
      editingService,
      availableBranches,
      updateService,
      createService,
      showLoading,
      removeToast,
      showSuccess,
      showError
    ]
  )

  const handleEdit = useCallback((service: Service) => {
    setEditingService(service)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((service: Service) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!serviceToDelete) return

    const loadingId = showLoading('Deleting service...', 'This action cannot be undone')
    setIsDeleting(true)

    try {
      // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
      // Try hard delete first, but if service is referenced, archive instead
      const result = await deleteService(serviceToDelete.id)

      removeToast(loadingId)

      if (result.archived) {
        // Service was archived instead of deleted (referenced in appointments/transactions)
        showSuccess(
          'Service archived',
          result.message || `${serviceToDelete.entity_name} has been archived`
        )
      } else {
        // Service was successfully deleted
        showSuccess(
          'Service deleted',
          `${serviceToDelete.entity_name} has been permanently removed`
        )
      }

      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete service', error.message || 'Please try again')
    } finally {
      setIsDeleting(false)
    }
  }, [serviceToDelete, deleteService, showLoading, removeToast, showSuccess, showError])

  const handleArchive = useCallback(
    async (service: Service) => {
      const loadingId = showLoading(
        'Archiving service...',
        'Please wait while we update the service status'
      )

      try {
        await archiveService(service.id)
        removeToast(loadingId)
        showSuccess('Service archived', `${service.entity_name} has been archived`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to archive service', error.message || 'Please try again')
      }
    },
    [archiveService, showLoading, removeToast, showSuccess, showError]
  )

  const handleRestore = useCallback(
    async (service: Service) => {
      const loadingId = showLoading(
        'Restoring service...',
        'Please wait while we restore the service'
      )

      try {
        await restoreService(service.id)
        removeToast(loadingId)
        showSuccess('Service restored', `${service.entity_name} has been restored`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to restore service', error.message || 'Please try again')
      }
    },
    [restoreService, showLoading, removeToast, showSuccess, showError]
  )

  const handleExport = useCallback(() => {
    showSuccess('Export started', 'Your services will be exported shortly')
  }, [showSuccess])

  // Category CRUD handlers - memoized for performance
  const handleSaveCategory = useCallback(
    async (data: ServiceCategoryFormValues) => {
      const loadingId = showLoading(
        editingCategory ? 'Updating category...' : 'Creating category...',
        'Please wait while we save your changes'
      )

      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, data)
          removeToast(loadingId)
          showSuccess('Category updated successfully', `${data.name} has been updated`)
        } else {
          await createCategory(data)
          removeToast(loadingId)
          showSuccess('Category created successfully', `${data.name} has been added`)
        }
        setCategoryModalOpen(false)
        setEditingCategory(null)
      } catch (error: any) {
        removeToast(loadingId)
        showError(
          editingCategory ? 'Failed to update category' : 'Failed to create category',
          error.message || 'Please try again or contact support'
        )
      }
    },
    [
      editingCategory,
      updateCategory,
      createCategory,
      showLoading,
      removeToast,
      showSuccess,
      showError
    ]
  )

  const handleEditCategory = useCallback((category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }, [])

  const handleDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return

    const loadingId = showLoading('Deleting category...', 'This action cannot be undone')
    setIsDeletingCategory(true)

    try {
      await deleteCategory(categoryToDelete.id)
      removeToast(loadingId)
      showSuccess('Category deleted', `${categoryToDelete.entity_name} has been removed`)
      setCategoryDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete category', error.message || 'Please try again')
    } finally {
      setIsDeletingCategory(false)
    }
  }, [categoryToDelete, deleteCategory, showLoading, removeToast, showSuccess, showError])

  // Calculate global KPIs - memoized for performance
  // 🎯 ENTERPRISE DASHBOARD PATTERN: KPIs show GLOBAL metrics, independent of tab/filter
  // Tab selection controls the LIST below, not the dashboard metrics
  // This is standard enterprise UX where KPIs = "big picture", Filters = "drill-down"

  const totalServicesCount = useMemo(() => allServicesForKPIs?.length || 0, [allServicesForKPIs])

  const activeCount = useMemo(
    () => allServicesForKPIs?.filter(s => s && s.status === 'active').length || 0,
    [allServicesForKPIs]
  )

  const totalRevenue = useMemo(
    () =>
      allServicesForKPIs
        ?.filter(s => s && s.status === 'active')
        .reduce((sum, service) => sum + (service.price_market || service.price || 0), 0) || 0,
    [allServicesForKPIs]
  )

  const avgDuration = useMemo(() => {
    const validServices =
      allServicesForKPIs?.filter(s => s && (s.duration_min !== undefined || s.duration_minutes !== undefined)) || []
    return validServices.length > 0
      ? validServices.reduce((sum, service) => sum + (service.duration_min || service.duration_minutes || 0), 0) /
          validServices.length
      : 0
  }, [allServicesForKPIs])

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
    if (hours > 0) return `${hours}h`
    return `${mins}m`
  }, [])

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-full flex flex-col">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(212, 175, 55, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(15, 111, 92, 0.1), transparent 50%)'
          }}
        />

        {/* Main Content */}
        <div
          className="relative flex-1 overflow-auto"
          style={{
            backgroundColor: COLORS.charcoal,
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <PageHeader
            title="Services"
            breadcrumbs={[
              { label: 'HERA' },
              { label: 'SALON OS' },
              { label: 'Services', isActive: true }
            ]}
            actions={
              <>
                <PageHeaderSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search services..."
                />
                <PageHeaderButton
                  variant="secondary"
                  icon={FolderPlus}
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryModalOpen(true)
                  }}
                >
                  New Category
                </PageHeaderButton>
                <PageHeaderButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingService(null)
                    setModalOpen(true)
                  }}
                >
                  New Service
                </PageHeaderButton>
                <PageHeaderButton variant="secondary" icon={Download} onClick={handleExport} />
              </>
            }
          />

          {/* Error Banner */}
          {error && (
            <div
              className="mx-6 mt-4 text-sm px-3 py-2 rounded-lg border flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: 'rgba(255, 0, 0, 0.3)',
                color: COLORS.lightText
              }}
            >
              <Sparkles className="h-4 w-4 animate-pulse" style={{ color: '#FF6B6B' }} />
              {error}
            </div>
          )}

          {/* Categories Section */}
          {serviceCategories.length > 0 && (
            <div className="mx-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag
                    className="w-4 h-4 transition-transform duration-200 hover:scale-110"
                    style={{ color: COLORS.gold }}
                  />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    Categories ({serviceCategories.length})
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="group relative px-3 py-1.5 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-left-2"
                    style={{
                      backgroundColor: category.color + '15',
                      borderColor: category.color + '40',
                      animationDelay: `${index * 50}ms`,
                      color: COLORS.champagne
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        <Tag className="w-3 h-3" style={{ color: category.color }} />
                        <span className="text-xs font-medium">{category.entity_name}</span>
                        {category.service_count > 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: category.color + '30',
                              color: COLORS.champagne
                            }}
                          >
                            {category.service_count}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setCategoryToDelete(category)
                          setCategoryDeleteDialogOpen(true)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-400"
                        title="Delete category"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards - Enterprise Grade Aesthetic with Enhanced Visibility */}
          <div className="mx-6 mt-6 grid grid-cols-4 gap-4">
            {/* Total Services */}
            <div
              className="group relative p-5 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.bronze}25 0%, ${COLORS.bronze}15 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`,
                border: `2px solid ${COLORS.bronze}70`,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(140, 120, 83, 0.3)'
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.bronze}25 0%, transparent 50%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.bronze}30 0%, ${COLORS.bronze}15 100%)`,
                      border: `1px solid ${COLORS.bronze}60`,
                      boxShadow: `0 4px 16px ${COLORS.bronze}20`
                    }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: COLORS.bronze }} />
                  </div>
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: COLORS.champagne, letterSpacing: '0.12em', opacity: 0.95 }}
                >
                  Total Services
                </p>
                <p
                  className="text-3xl font-bold mb-1 tracking-tight"
                  style={{ color: COLORS.champagne }}
                >
                  {totalServicesCount}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.bronze }}
                  />
                  <p className="text-xs font-medium" style={{ color: COLORS.champagne, opacity: 0.8 }}>
                    Across all categories
                  </p>
                </div>
              </div>
            </div>

            {/* Active Services */}
            <div
              className="group relative p-5 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, ${COLORS.emerald}12 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`,
                border: `2px solid ${COLORS.emerald}65`,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(15, 111, 92, 0.25)'
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, transparent 50%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}25 0%, ${COLORS.emerald}12 100%)`,
                      border: `1px solid ${COLORS.emerald}60`,
                      boxShadow: `0 4px 16px ${COLORS.emerald}20`
                    }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: COLORS.emerald }} />
                  </div>
                  <div
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}30 0%, ${COLORS.emerald}18 100%)`,
                      color: COLORS.emerald,
                      border: `1px solid ${COLORS.emerald}50`
                    }}
                  >
                    {totalServicesCount > 0 ? ((activeCount / totalServicesCount) * 100).toFixed(0) : 0}%
                  </div>
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: COLORS.champagne, letterSpacing: '0.12em', opacity: 0.95 }}
                >
                  Active Services
                </p>
                <p
                  className="text-3xl font-bold mb-1 tracking-tight"
                  style={{ color: COLORS.champagne }}
                >
                  {activeCount}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.emerald }}
                  />
                  <p className="text-xs font-medium" style={{ color: COLORS.champagne, opacity: 0.8 }}>
                    Ready to book
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Potential - Premium Gold Gradient */}
            <div
              className="group relative p-5 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}20 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`,
                border: `2px solid ${COLORS.gold}90`,
                boxShadow: `0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212, 175, 55, 0.35), 0 0 40px ${COLORS.gold}20`
              }}
            >
              {/* Animated shimmer effect on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}15 50%, transparent 70%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold}40 0%, ${COLORS.gold}20 100%)`,
                      border: `1.5px solid ${COLORS.gold}80`,
                      boxShadow: `0 6px 20px ${COLORS.gold}30, inset 0 1px 0 ${COLORS.gold}50`
                    }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: COLORS.gold }} />
                  </div>
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: COLORS.champagne, letterSpacing: '0.12em', opacity: 0.95 }}
                >
                  Revenue Potential
                </p>
                <p
                  className="text-3xl font-bold mb-1 tracking-tight"
                  style={{ color: COLORS.gold }}
                >
                  {currency} {totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                  <p className="text-xs font-medium" style={{ color: COLORS.champagne, opacity: 0.8 }}>
                    Total catalog value
                  </p>
                </div>
              </div>
            </div>

            {/* Average Duration */}
            <div
              className="group relative p-5 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.plum}20 0%, ${COLORS.plum}12 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`,
                border: `2px solid ${COLORS.plum}70`,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(183, 148, 244, 0.22)'
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.plum}18 0%, transparent 50%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.plum}25 0%, ${COLORS.plum}12 100%)`,
                      border: `1px solid ${COLORS.plum}50`,
                      boxShadow: `0 4px 16px ${COLORS.plum}18`
                    }}
                  >
                    <Clock className="h-4 w-4" style={{ color: COLORS.plum }} />
                  </div>
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: COLORS.champagne, letterSpacing: '0.12em', opacity: 0.95 }}
                >
                  Avg Duration
                </p>
                <p
                  className="text-3xl font-bold mb-1 tracking-tight"
                  style={{ color: COLORS.plum }}
                >
                  {formatDuration(avgDuration)}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.plum }}
                  />
                  <p className="text-xs font-medium" style={{ color: COLORS.champagne, opacity: 0.8 }}>
                    Per service
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and View Options */}
          <div className="mx-6 mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs
                value={includeArchived ? 'all' : 'active'}
                onValueChange={v => setIncludeArchived(v === 'all')}
              >
                <TabsList style={{ backgroundColor: COLORS.charcoalLight }}>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="all">All Services</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="transition-all duration-200 hover:scale-105"
                style={{
                  color: showFilters ? COLORS.gold : COLORS.lightText,
                  backgroundColor: showFilters ? `${COLORS.gold}20` : 'transparent'
                }}
              >
                <Filter className="h-4 w-4 mr-1" />
                <span className="font-medium">Filters</span>
              </Button>

              <div className="flex items-center gap-2">
                {localBranchFilter && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2"
                    style={{
                      backgroundColor: COLORS.gold + '20',
                      borderColor: COLORS.gold + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <Building2 className="h-3 w-3" style={{ color: COLORS.gold }} />
                    <span>
                      {availableBranches.find(b => b.id === localBranchFilter)?.entity_name ||
                        'Branch'}
                    </span>
                    <button
                      onClick={() => setLocalBranchFilter(null)}
                      className="ml-1 hover:scale-110 active:scale-95 transition-all duration-200 rounded-full p-0.5 hover:bg-gold/20"
                      aria-label="Clear branch filter"
                    >
                      <X className="h-3 w-3" style={{ color: COLORS.gold }} />
                    </button>
                  </div>
                )}
                {categoryFilter && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2"
                    style={{
                      backgroundColor: COLORS.gold + '20',
                      borderColor: COLORS.gold + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <Tag className="h-3 w-3" style={{ color: COLORS.gold }} />
                    <span>{categoryFilter}</span>
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="ml-1 hover:scale-110 active:scale-95 transition-all duration-200 rounded-full p-0.5 hover:bg-gold/20"
                      aria-label="Clear category filter"
                    >
                      <X className="h-3 w-3" style={{ color: COLORS.gold }} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className="w-48 transition-all duration-200 hover:scale-105 hover:border-gold/50"
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
                  <SelectItem value="duration_asc" className="hera-select-item">
                    Duration (Shortest)
                  </SelectItem>
                  <SelectItem value="duration_desc" className="hera-select-item">
                    Duration (Longest)
                  </SelectItem>
                  <SelectItem value="price_asc" className="hera-select-item">
                    Price (Low to High)
                  </SelectItem>
                  <SelectItem value="price_desc" className="hera-select-item">
                    Price (High to Low)
                  </SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => setViewMode('grid')}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: viewMode === 'grid' ? `${COLORS.gold}20` : 'transparent',
                  border: `1px solid ${viewMode === 'grid' ? COLORS.gold + '50' : COLORS.bronze + '30'}`,
                  color: viewMode === 'grid' ? COLORS.gold : COLORS.lightText
                }}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: viewMode === 'list' ? `${COLORS.gold}20` : 'transparent',
                  border: `1px solid ${viewMode === 'list' ? COLORS.gold + '50' : COLORS.bronze + '30'}`,
                  color: viewMode === 'list' ? COLORS.gold : COLORS.lightText
                }}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expandable Filters with Soft Animation */}
          {showFilters && (
            <div
              className="mx-6 mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300"
              style={{ borderColor: COLORS.bronze + '30' }}
            >
              <div className="flex items-center gap-4">
                {/* Branch Filter - Compact & Enterprise-Grade */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium uppercase tracking-wider opacity-70 shrink-0"
                    style={{ color: COLORS.bronze }}
                  >
                    Location
                  </span>
                  <Select
                    value={localBranchFilter || '__ALL__'}
                    onValueChange={value => setLocalBranchFilter(value === '__ALL__' ? null : value)}
                  >
                    <SelectTrigger
                      className="w-[180px] h-9 text-sm transition-all duration-200 hover:border-gold/50"
                      style={{
                        backgroundColor: COLORS.charcoalLight + '80',
                        borderColor: COLORS.bronze + '40',
                        color: COLORS.champagne
                      }}
                    >
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      <SelectItem value="__ALL__" className="hera-select-item">
                        All branches
                      </SelectItem>
                      {availableBranches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
                          {branch.entity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter - Compact & Enterprise-Grade */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium uppercase tracking-wider opacity-70 shrink-0"
                    style={{ color: COLORS.bronze }}
                  >
                    Category
                  </span>
                  <Select
                    value={categoryFilter || '__ALL__'}
                    onValueChange={value => setCategoryFilter(value === '__ALL__' ? '' : value)}
                  >
                    <SelectTrigger
                      className="w-[180px] h-9 text-sm transition-all duration-200 hover:border-gold/50"
                      style={{
                        backgroundColor: COLORS.charcoalLight + '80',
                        borderColor: COLORS.bronze + '40',
                        color: COLORS.champagne
                      }}
                    >
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      <SelectItem value="__ALL__" className="hera-select-item">
                        All categories
                      </SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="hera-select-item">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Content Area with Fade-in Animation */}
          <div className="mx-6 mt-6 mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
                <div className="text-center">
                  <Sparkles
                    className="w-12 h-12 mx-auto mb-3 animate-pulse"
                    style={{ color: COLORS.gold }}
                  />
                  <p style={{ color: COLORS.lightText }}>Loading services...</p>
                </div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
                <div className="text-center">
                  <Sparkles
                    className="w-12 h-12 mx-auto mb-3 opacity-30"
                    style={{ color: COLORS.gold }}
                  />
                  <p className="text-lg mb-1" style={{ color: COLORS.champagne }}>
                    {searchQuery || categoryFilter || localBranchFilter
                      ? 'No services found'
                      : 'No services yet'}
                  </p>
                  <p className="text-sm opacity-60 mb-4" style={{ color: COLORS.lightText }}>
                    {searchQuery || categoryFilter || localBranchFilter
                      ? 'Try adjusting your search or filters'
                      : 'Create your first service to start building your catalog'}
                  </p>
                  {!searchQuery && !categoryFilter && !localBranchFilter && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                        color: COLORS.black
                      }}
                    >
                      Create Service
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={`${localBranchFilter}-${categoryFilter}-${searchQuery}`}
                className="animate-in fade-in duration-300"
              >
                <ServiceList
                  services={filteredServices}
                  loading={isLoading}
                  viewMode={viewMode}
                  currency={currency}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                />
              </div>
            )}
          </div>

          {/* Modals */}
          <ServiceModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingService(null)
            }}
            service={editingService}
            onSave={handleSave}
          />

          <ServiceCategoryModal
            open={categoryModalOpen}
            onClose={() => {
              setCategoryModalOpen(false)
              setEditingCategory(null)
            }}
            category={editingCategory}
            onSave={handleSaveCategory}
          />

          {/* Delete Service Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent
              className="max-w-md"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}40`,
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
                  <AlertDialogTitle
                    className="text-lg font-semibold"
                    style={{ color: COLORS.champagne }}
                  >
                    Delete Service
                  </AlertDialogTitle>
                </div>
              </AlertDialogHeader>

              <div className="space-y-3" style={{ color: COLORS.lightText }}>
                <p className="text-sm">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold" style={{ color: COLORS.champagne }}>
                    "{serviceToDelete?.entity_name}"
                  </span>
                  ?
                </p>
                <p className="text-sm opacity-70">
                  This action cannot be undone. The service will be permanently removed from your
                  catalog.
                </p>
              </div>

              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setServiceToDelete(null)
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
                  {isDeleting ? 'Deleting...' : 'Delete Service'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Category Dialog */}
          <AlertDialog open={categoryDeleteDialogOpen} onOpenChange={setCategoryDeleteDialogOpen}>
            <AlertDialogContent
              className="max-w-md"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}40`,
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
                  <AlertDialogTitle
                    className="text-lg font-semibold"
                    style={{ color: COLORS.champagne }}
                  >
                    Delete Category
                  </AlertDialogTitle>
                </div>
              </AlertDialogHeader>

              <div className="space-y-3" style={{ color: COLORS.lightText }}>
                <p className="text-sm">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold" style={{ color: COLORS.champagne }}>
                    "{categoryToDelete?.entity_name}"
                  </span>
                  ?
                </p>
                {categoryToDelete && categoryToDelete.service_count > 0 ? (
                  <div
                    className="p-3 rounded-lg border flex items-start gap-2"
                    style={{
                      backgroundColor: '#FFA50020',
                      borderColor: '#FFA50040'
                    }}
                  >
                    <AlertTriangle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: '#FFA500' }}
                    />
                    <p className="text-sm">
                      This category has{' '}
                      <span className="font-semibold">
                        {categoryToDelete.service_count} service(s)
                      </span>
                      . Please reassign or delete those services first.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">This action cannot be undone.</p>
                )}
              </div>

              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel
                  onClick={() => {
                    setCategoryDeleteDialogOpen(false)
                    setCategoryToDelete(null)
                  }}
                  disabled={isDeletingCategory}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCategory}
                  disabled={
                    isDeletingCategory || (categoryToDelete && categoryToDelete.service_count > 0)
                  }
                  className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                >
                  {isDeletingCategory ? 'Deleting...' : 'Delete Category'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

export default function SalonServicesPage() {
  return (
    <StatusToastProvider>
      <SalonServicesPageContent />
    </StatusToastProvider>
  )
}
