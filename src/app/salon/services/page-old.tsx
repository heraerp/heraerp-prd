'use client'

import React, { useState, useCallback } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useServicesPlaybook } from '@/hooks/useServicesPlaybook'
import { useCategoriesPlaybook } from '@/hooks/useCategoriesPlaybook'
import { ServiceList } from '@/components/salon/services/ServiceList'
import { ServiceModal } from '@/components/salon/services/ServiceModal'
import { BulkActionsBar } from '@/components/salon/services/BulkActionsBar'
import { DeleteConfirmationDialog } from '@/components/salon/services/DeleteConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ServiceForm, ServiceWithDynamicData } from '@/schemas/service'
import { Plus, Search, Scissors, Download, Building2, Filter, X } from 'lucide-react'
import { PageHeader, PageHeaderSearch, PageHeaderButton } from '@/components/universal/PageHeader'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'

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
  const { organization, isLoading: authLoading } = useHERAAuth()
  const organizationId = organization?.id || ''
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  
  // Fetch categories for filtering
  const { categories: categoryList } = useCategoriesPlaybook({
    organizationId,
    includeArchived: false
  })

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState('updated_at:desc')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithDynamicData | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [servicesToDelete, setServicesToDelete] = useState<ServiceWithDynamicData[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Branch filter
  const { branchId, branches, setBranchId, hasMultipleBranches } = useBranchFilter(
    undefined,
    'services'
  )

  // Fetch services data
  const {
    items: services,
    total,
    isLoading,
    error,
    createOne,
    updateOne,
    deleteMany,
    archiveMany,
    restoreMany,
    exportCSV
  } = useServicesPlaybook({
    organizationId,
    branchId,
    query: searchQuery,
    status: statusFilter,
    categoryId: categoryFilter,
    page,
    pageSize: 25,
    sort: sortBy
  })

  // Use dynamic categories from database
  const categories = categoryList.map(cat => cat.entity_name)

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(services.map(s => s.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  // CRUD handlers
  const handleSave = async (data: ServiceForm) => {
    const loadingId = showLoading(
      editingService ? 'Updating service...' : 'Creating service...',
      'Please wait while we save your changes'
    )
    
    try {
      if (editingService) {
        await updateOne(editingService.id, data)
        removeToast(loadingId)
        showSuccess('Service updated successfully', `${data.name} has been updated`)
      } else {
        await createOne(data)
        removeToast(loadingId)
        showSuccess('Service created successfully', `${data.name} has been added to your services`)
      }
      setModalOpen(false)
      setEditingService(null)
    } catch (error) {
      removeToast(loadingId)
      showError(
        editingService ? 'Failed to update service' : 'Failed to create service',
        'Please try again or contact support'
      )
    }
  }

  const handleEdit = (service: ServiceWithDynamicData) => {
    setEditingService(service)
    setModalOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    const servicesToDelete = services.filter(s => ids.includes(s.id))
    setServicesToDelete(servicesToDelete)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    const loadingId = showLoading(
      servicesToDelete.length > 1 
        ? `Deleting ${servicesToDelete.length} services...` 
        : 'Deleting service...',
      'This action cannot be undone'
    )
    
    try {
      await deleteMany(servicesToDelete.map(s => s.id))
      removeToast(loadingId)
      showSuccess(
        servicesToDelete.length > 1 
          ? `${servicesToDelete.length} services deleted` 
          : 'Service deleted',
        servicesToDelete.length > 1
          ? 'The selected services have been permanently removed'
          : `${servicesToDelete[0]?.name} has been permanently removed`
      )
      setDeleteDialogOpen(false)
      setServicesToDelete([])
      setSelectedIds(new Set())
    } catch (error) {
      removeToast(loadingId)
      showError(
        'Failed to delete services',
        'Some services could not be deleted. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds)
    const loadingId = showLoading(
      `Archiving ${ids.length} service${ids.length > 1 ? 's' : ''}...`,
      'Moving to archived status'
    )
    
    try {
      await archiveMany(ids)
      removeToast(loadingId)
      showSuccess(
        `${ids.length} service${ids.length > 1 ? 's' : ''} archived`,
        'Services have been moved to the archive'
      )
      setSelectedIds(new Set())
    } catch (error) {
      removeToast(loadingId)
      showError('Failed to archive services', 'Please try again')
    }
  }

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds)
    const loadingId = showLoading(
      `Restoring ${ids.length} service${ids.length > 1 ? 's' : ''}...`,
      'Moving to active status'
    )
    
    try {
      await restoreMany(ids)
      removeToast(loadingId)
      showSuccess(
        `${ids.length} service${ids.length > 1 ? 's' : ''} restored`,
        'Services have been restored to active status'
      )
      setSelectedIds(new Set())
    } catch (error) {
      removeToast(loadingId)
      showError('Failed to restore services', 'Please try again')
    }
  }

  const handleExport = () => {
    try {
      exportCSV()
      showSuccess('Services exported', 'Your CSV file has been downloaded')
    } catch (error) {
      showError('Export failed', 'Unable to export services to CSV')
    }
  }

  // Header gradient style
  const headerGradient = { backgroundColor: COLORS.charcoal } as React.CSSProperties

  // Guard until organization is ready
  if (authLoading) {
    return (
      <div className="p-6 text-sm opacity-70" style={{ color: COLORS.lightText }}>
        Loading session…
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="p-6 text-sm" style={{ color: '#FF6B6B' }}>
        No organization selected. Please refresh or contact support.
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: COLORS.black }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Subtle gradient overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 80%, ${COLORS.gold}08 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, ${COLORS.bronze}05 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, ${COLORS.plum}03 0%, transparent 50%)`
          }}
        />

        {/* Content container */}
        <div
          className="container mx-auto px-6 py-8 relative"
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
              className="mt-4 text-sm px-3 py-2 rounded-lg border flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: 'rgba(255, 0, 0, 0.3)',
                color: COLORS.lightText
              }}
            >
              <X className="h-4 w-4" style={{ color: '#FF6B6B' }} />
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="py-4 border-b" style={{ borderColor: `${COLORS.bronze}33` }}>
            <div className="flex items-center gap-4">
              {/* Status Tabs */}
              <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                <TabsList className="bg-background/30">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filter Chips */}
              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'text-foreground' : 'text-muted-foreground'}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>

                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1 bg-muted/50">
                    {categoryFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter('')} />
                  </Badge>
                )}
              </div>

              {/* Branch Selector */}
              {hasMultipleBranches && (
                <Select
                  value={branchId || 'ALL'}
                  onValueChange={value => setBranchId(value === 'ALL' ? undefined : value)}
                >
                  <SelectTrigger className="w-48 bg-background/30 border-border">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-background/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name:asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name:desc">Name (Z-A)</SelectItem>
                  <SelectItem value="updated_at:desc">Updated (Newest)</SelectItem>
                  <SelectItem value="updated_at:asc">Updated (Oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 bg-background/30 border-border">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="py-6">
            <ServiceList
              services={services}
              loading={isLoading}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={archiveMany}
              onRestore={restoreMany}
            />
          </div>

          {/* Bulk Actions */}
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onArchive={handleBulkArchive}
            onRestore={handleBulkRestore}
            onExport={handleExport}
            onClear={() => setSelectedIds(new Set())}
            showRestore={statusFilter === 'archived'}
          />

          {/* Service Modal */}
          <ServiceModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingService(null)
            }}
            service={editingService}
            onSave={handleSave}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false)
              setServicesToDelete([])
            }}
            onConfirm={handleConfirmDelete}
            services={servicesToDelete}
            loading={isDeleting}
          />
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
