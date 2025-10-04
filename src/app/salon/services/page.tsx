'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraServices } from '@/hooks/useHeraServicesV2'
import { useHeraServiceCategories } from '@/hooks/useHeraServiceCategories'
import { ServiceList } from '@/components/salon/services/ServiceList'
import { BranchSelector } from '@/components/salon/BranchSelector'
import { ServiceModal } from '@/components/salon/services/ServiceModal'
import { ServiceCategoryModal } from '@/components/salon/services/ServiceCategoryModal'
import { useToast } from '@/components/ui/use-toast'
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
  const { toast } = useToast()
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

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)

  // Fetch services using Universal API v2
  const {
    services,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    archiveService
  } = useHeraServices({
    organizationId,
    filters: {
      branch_id: selectedBranchId || undefined,  // Filter by selected branch
      category_id: categoryFilter || undefined,
      status: includeArchived ? undefined : 'active'
    }
  })

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

  const categories = serviceCategories
    .filter(cat => cat && cat.entity_name)
    .map(cat => cat.entity_name)

  // Filter services
  const filteredServices = services.filter(service => {
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

    // Branch filter - TODO: Update this to use relationships once services are linked to branches
    // For now, services are shown regardless of selected branch

    // Category filter
    if (categoryFilter && service.category !== categoryFilter) {
      return false
    }

    return true
  })

  // CRUD handlers
  const handleSave = async (data: ServiceFormValues) => {
    try {
      // Map form data to hook's expected format
      const serviceData = {
        name: data.name,
        price_market: data.price || 0,
        duration_min: data.duration_minutes || 0,
        commission_rate: 0.5, // Default commission rate
        description: data.description || '',
        active: data.status === 'active',
        category_id: data.category || undefined,
        branch_ids: data.branch_ids && data.branch_ids.length > 0 ? data.branch_ids : undefined
      }

      if (editingService) {
        await updateService(editingService.id, serviceData)
        toast({
          title: 'Service updated successfully',
          description: `${data.name} has been updated`
        })
      } else {
        await createService(serviceData)
        toast({
          title: 'Service created successfully',
          description: `${data.name} has been added`
        })
      }
      setModalOpen(false)
      setEditingService(null)
    } catch (error: any) {
      console.error('Service save error:', error)
      toast({
        title: editingService ? 'Failed to update service' : 'Failed to create service',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setModalOpen(true)
  }

  const handleDelete = (service: Service) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return

    setIsDeleting(true)

    try {
      await deleteService(serviceToDelete.id)
      toast({
        title: 'Service deleted',
        description: `${serviceToDelete.entity_name} has been permanently removed`
      })
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Failed to delete service',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchive = async (service: Service) => {
    try {
      await archiveService(service.id, service.status !== 'archived')
      toast({
        title: service.status === 'archived' ? 'Service restored' : 'Service archived',
        description: `${service.entity_name} has been ${service.status === 'archived' ? 'restored' : 'archived'}`
      })
    } catch (error: any) {
      toast({
        title: `Failed to ${service.status === 'archived' ? 'restore' : 'archive'} service`,
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    }
  }

  const handleRestore = handleArchive

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Your services will be exported shortly'
    })
  }

  // Category CRUD handlers
  const handleSaveCategory = async (data: ServiceCategoryFormValues) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data)
        toast({
          title: 'Category updated successfully',
          description: `${data.name} has been updated`
        })
      } else {
        await createCategory(data)
        toast({
          title: 'Category created successfully',
          description: `${data.name} has been added`
        })
      }
      setCategoryModalOpen(false)
      setEditingCategory(null)
    } catch (error: any) {
      toast({
        title: editingCategory ? 'Failed to update category' : 'Failed to create category',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive'
      })
    }
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setIsDeletingCategory(true)

    try {
      await deleteCategory(categoryToDelete.id)
      toast({
        title: 'Category deleted',
        description: `${categoryToDelete.entity_name} has been removed`
      })
      setCategoryDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Failed to delete category',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsDeletingCategory(false)
    }
  }

  // Calculate stats
  const activeCount = services.filter(s => s.status === 'active').length
  const totalRevenue = services
    .filter(s => s.status === 'active')
    .reduce((sum, service) => sum + (service.price || 0), 0)
  const avgDuration =
    services.length > 0
      ? services.reduce((sum, service) => sum + (service.duration_minutes || 0), 0) /
        services.length
      : 0

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
    if (hours > 0) return `${hours}h`
    return `${mins}m`
  }

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
              className="mx-6 mt-4 text-sm px-3 py-2 rounded-lg border flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: 'rgba(255, 0, 0, 0.3)',
                color: COLORS.lightText
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: '#FF6B6B' }} />
              {error}
            </div>
          )}

          {/* Categories Section */}
          {serviceCategories.length > 0 && (
            <div className="mx-6 mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: COLORS.gold }} />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    Categories ({serviceCategories.length})
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map(category => (
                  <div
                    key={category.id}
                    className="group relative px-3 py-1.5 rounded-lg border transition-all"
                    style={{
                      backgroundColor: category.color + '15',
                      borderColor: category.color + '40',
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

          {/* Stats Cards */}
          <div className="mx-6 mt-6 grid grid-cols-4 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Total Services
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.champagne }}>
                {services.length}
              </p>
            </div>
            <div
              className="p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animationDelay: '100ms'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Active Services
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.emerald }}>
                {activeCount}
              </p>
            </div>
            <div
              className="p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animationDelay: '200ms'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Revenue Potential
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.gold }}>
                {currency} {totalRevenue.toLocaleString()}
              </p>
            </div>
            <div
              className="p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animationDelay: '300ms'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Avg Duration
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-5 h-5" style={{ color: COLORS.plum }} />
                <p className="text-2xl font-bold" style={{ color: COLORS.plum }}>
                  {formatDuration(avgDuration)}
                </p>
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
                {selectedBranchId && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2"
                    style={{
                      backgroundColor: COLORS.gold + '20',
                      borderColor: COLORS.gold + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <Building2 className="h-3 w-3" style={{ color: COLORS.gold }} />
                    <span>{availableBranches.find(b => b.id === selectedBranchId)?.entity_name || 'Branch'}</span>
                    <button
                      onClick={() => setSelectedBranchId(null)}
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
                  <SelectItem value="name_asc" className="hera-select-item">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc" className="hera-select-item">Name (Z-A)</SelectItem>
                  <SelectItem value="duration_asc" className="hera-select-item">Duration (Shortest)</SelectItem>
                  <SelectItem value="duration_desc" className="hera-select-item">Duration (Longest)</SelectItem>
                  <SelectItem value="price_asc" className="hera-select-item">Price (Low to High)</SelectItem>
                  <SelectItem value="price_desc" className="hera-select-item">Price (High to Low)</SelectItem>
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
            <div className="mx-6 mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderColor: COLORS.bronze + '30' }}>
              <div className="flex items-center gap-6">
                {/* Branch Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: COLORS.champagne }}>
                    Location:
                  </span>
                  <BranchSelector variant="default" />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: COLORS.champagne }}>
                    Category:
                  </span>
                  <Select
                    value={categoryFilter || '__ALL__'}
                    onValueChange={value => setCategoryFilter(value === '__ALL__' ? '' : value)}
                  >
                    <SelectTrigger
                      className="w-48 transition-all duration-200 hover:border-gold/50"
                      style={{
                        backgroundColor: COLORS.charcoalLight + '80',
                        borderColor: COLORS.bronze + '40',
                        color: COLORS.champagne
                      }}
                    >
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      <SelectItem value="__ALL__" className="hera-select-item">All categories</SelectItem>
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
                    {searchQuery || categoryFilter || selectedBranchId ? 'No services found' : 'No services yet'}
                  </p>
                  <p className="text-sm opacity-60 mb-4" style={{ color: COLORS.lightText }}>
                    {searchQuery || categoryFilter || selectedBranchId
                      ? 'Try adjusting your search or filters'
                      : 'Create your first service to start building your catalog'}
                  </p>
                  {!searchQuery && !categoryFilter && !selectedBranchId && (
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
                key={`${selectedBranchId}-${categoryFilter}-${searchQuery}`}
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
  return <SalonServicesPageContent />
}
