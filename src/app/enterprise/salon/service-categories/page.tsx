'use client'
// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";



import React, { useState, useMemo } from 'react'
import { Plus, FolderOpen, Search, Filter, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { SERVICE_CATEGORY_PRESET } from '@/hooks/entityPresets'
import { EntityForm } from '@/components/entity/EntityForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { LUXE_COLORS } from '@/lib/constants/salon'
import '@/styles/salon-luxe.css'

interface ServiceCategory {
  id: string
  entity_name: string
  entity_code?: string
  dynamic_fields?: {
    kind?: { value: string }
    name?: { value: string }
    code?: { value: string }
    description?: { value: string }
    display_order?: { value: number }
    status?: { value: string }
    color_tag?: { value: string }
  }
  created_at: string
  updated_at: string
}

export default function ServiceCategoriesPage() {
  const {
    salonRole,
    hasPermission,
    isAuthenticated,
    organization: currentOrganization
  } = useSecuredSalonContext()
  const { toast } = useToast()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [kindFilter, setKindFilter] = useState<string>('SERVICE')

  // Universal entity hook with dynamic fields configuration
  const {
    entities: categories,
    isLoading,
    error,
    refetch,
    create,
    update,
    delete: deleteCategory,
    archive,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'CATEGORY',
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 200
    },
    dynamicFields: SERVICE_CATEGORY_PRESET.dynamicFields
  })

  // Debug logging
  React.useEffect(() => {
    console.log('[ServiceCategoriesPage] Debug info:', {
      categories: categories?.length || 0,
      isLoading,
      error,
      rawCategories: categories,
      salonRole,
      organizationContext: {
        id: (currentOrganization as any)?.id || 'unknown',
        name: (currentOrganization as any)?.name || 'unknown'
      },
      isAuthenticated
    })
  }, [categories, isLoading, error, salonRole, isAuthenticated])

  // Debug organization context
  React.useEffect(() => {
    console.log('[ServiceCategoriesPage] Organization context:', {
      hasPermission: hasPermission('salon:read:all'),
      salonRole,
      isAuthenticated,
      organization: (currentOrganization as any) || 'no-org'
    })
  }, [hasPermission, salonRole, isAuthenticated])

  // Filter out archived items by default unless specifically viewing archived
  const shouldShowCategory = (category: ServiceCategory) => {
    const status = category.dynamic_fields?.status?.value || 'active'
    // If viewing "all", don't show archived items
    if (statusFilter === 'all' && status === 'archived') {
      return false
    }
    return true
  }

  // Filter categories by SERVICE kind and apply search/status filters
  const filteredCategories = React.useMemo(() => {
    console.log('[ServiceCategoriesPage] Filtering categories:', {
      totalCategories: categories?.length || 0,
      kindFilter,
      searchQuery,
      statusFilter,
      sampleCategory: categories?.[0]
    })

    return (categories || []).filter((category: ServiceCategory) => {
      // Filter by kind (locked to SERVICE)
      const categoryKind = category.dynamic_fields?.kind?.value || 'SERVICE'
      console.log('[ServiceCategoriesPage] Category filter check:', {
        categoryName: category.entity_name,
        categoryKind,
        kindFilter,
        passesKindFilter: categoryKind === kindFilter
      })

      if (categoryKind !== kindFilter) return false

      // Search filter
      if (searchQuery) {
        const name = category.dynamic_fields?.name?.value || category.entity_name || ''
        const code = category.dynamic_fields?.code?.value || ''
        const description = category.dynamic_fields?.description?.value || ''
        const query = searchQuery.toLowerCase()

        if (
          !name.toLowerCase().includes(query) &&
          !code.toLowerCase().includes(query) &&
          !description.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = category.dynamic_fields?.status?.value || 'active'
        if (status !== statusFilter) return false
      }

      // Apply shouldShowCategory filter
      if (!shouldShowCategory(category)) {
        return false
      }

      return true
    })
  }, [categories, searchQuery, statusFilter, kindFilter])

  // Sort by display_order
  const sortedCategories = React.useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const orderA = a.dynamic_fields?.display_order?.value || 0
      const orderB = b.dynamic_fields?.display_order?.value || 0
      return orderA - orderB
    })
  }, [filteredCategories])

  // Permission checks
  const canCreate = hasPermission('salon:admin:full') || ['owner', 'manager'].includes(salonRole)
  const canEdit = hasPermission('salon:admin:full') || ['owner', 'manager'].includes(salonRole)
  const canDelete = hasPermission('salon:admin:full') || ['owner', 'manager'].includes(salonRole)

  const handleCreate = async (formData: any) => {
    try {
      console.log('[ServiceCategoriesPage] Creating category:', formData)

      await create({
        entity_type: 'CATEGORY',
        entity_name: formData.name || formData.entity_name || 'Untitled Category',
        smart_code: 'HERA.SALON.CATEGORY.ENTITY.ITEM.V1',
        dynamic_fields: {
          kind: { value: 'SERVICE', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.KIND.V1' },
          name: {
            value: formData.name,
            type: 'text',
            smart_code: 'HERA.SALON.CATEGORY.DYN.NAME.V1'
          },
          code: {
            value: formData.code || '',
            type: 'text',
            smart_code: 'HERA.SALON.CATEGORY.DYN.CODE.V1'
          },
          description: {
            value: formData.description || '',
            type: 'text',
            smart_code: 'HERA.SALON.CATEGORY.DYN.DESCRIPTION.V1'
          },
          display_order: {
            value: formData.display_order || 0,
            type: 'number',
            smart_code: 'HERA.SALON.CATEGORY.DYN.DISPLAY_ORDER.V1'
          },
          status: {
            value: formData.status || 'active',
            type: 'text',
            smart_code: 'HERA.SALON.CATEGORY.DYN.STATUS.V1'
          },
          color_tag: {
            value: formData.color_tag || '',
            type: 'text',
            smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR_TAG.V1'
          }
        }
      })

      console.log('[ServiceCategoriesPage] Showing success toast for:', formData.name)
      toast({
        title: 'Category created',
        description: `Successfully created ${formData.name}`,
        variant: 'default'
      })

      setIsModalOpen(false)

      // Refresh the list
      await refetch()
    } catch (error: any) {
      console.error('[ServiceCategoriesPage] Create error:', error)
      toast({
        title: 'Create failed',
        description: error?.message || 'Failed to create category',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = async (formData: any) => {
    if (!editingCategory) {
      console.error('[ServiceCategoriesPage] No category selected for editing')
      toast({
        title: 'Edit failed',
        description: 'No category selected for editing',
        variant: 'destructive'
      })
      return
    }

    try {
      console.log('[ServiceCategoriesPage] Updating category:', editingCategory.id, formData)

      // Use dynamic_patch approach (consistent with archive function)
      await update({
        entity_id: editingCategory.id,
        entity_name: formData.name || editingCategory.entity_name,
        smart_code: 'HERA.SALON.CATEGORY.ENTITY.ITEM.V1',
        dynamic_patch: {
          name: formData.name,
          code: formData.code || '',
          description: formData.description || '',
          display_order: formData.display_order || 0,
          status: formData.status || 'active',
          color_tag: formData.color_tag || '',
          kind: 'SERVICE' // Always ensure SERVICE kind
        }
      })

      console.log('[ServiceCategoriesPage] Edit completed successfully')

      toast({
        title: 'Category updated',
        description: `Successfully updated ${formData.name}`,
        variant: 'default'
      })

      setIsModalOpen(false)
      setEditingCategory(null)

      // Refresh the list
      await refetch()
    } catch (error: any) {
      console.error('[ServiceCategoriesPage] Update error:', error)
      toast({
        title: 'Update failed',
        description: error?.message || 'Failed to update category',
        variant: 'destructive'
      })
    }
  }

  const handleArchive = async (category: ServiceCategory) => {
    const categoryName = category.dynamic_fields?.name?.value || category.entity_name

    try {
      console.log(
        '[ServiceCategoriesPage] Starting archive process for:',
        category.id,
        categoryName
      )

      // Use the archive method from the hook which does a soft delete
      await archive(category.id)

      console.log('[ServiceCategoriesPage] Archive completed successfully')

      // Show success toast immediately
      toast({
        title: 'Category archived',
        description: `Successfully archived ${categoryName}`,
        variant: 'default'
      })

      // Force a small delay to ensure the archive completes
      setTimeout(async () => {
        // Refresh the list
        await refetch()
        console.log('[ServiceCategoriesPage] Data refetched after archive')
      }, 500)
    } catch (error: any) {
      console.error('[ServiceCategoriesPage] Archive error:', error)
      toast({
        title: 'Archive failed',
        description: error?.message || 'Failed to archive category',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (category: ServiceCategory) => {
    if (!canDelete) {
      console.warn('[ServiceCategoriesPage] Delete not allowed for current role:', salonRole)
      toast({
        title: 'Delete failed',
        description: 'You do not have permission to delete categories',
        variant: 'destructive'
      })
      return
    }

    const categoryName = category.dynamic_fields?.name?.value || category.entity_name

    try {
      console.log('[ServiceCategoriesPage] Starting delete process for:', category.id, categoryName)

      // For production safety, use soft delete (archive)
      await archive(category.id)

      console.log('[ServiceCategoriesPage] Soft delete (archive) completed successfully')

      toast({
        title: 'Category archived',
        description: `Successfully archived ${categoryName}`,
        variant: 'default'
      })

      // Refresh the list
      await refetch()
    } catch (error: any) {
      console.error('[ServiceCategoriesPage] Delete error:', error)
      toast({
        title: 'Delete failed',
        description: error?.message || 'Failed to delete category',
        variant: 'destructive'
      })
    }
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const openEditModal = (category: ServiceCategory) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return `bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`
      case 'inactive':
        return `bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`
      case 'archived':
        return `bg-gray-500/20 text-gray-400 border border-gray-500/30`
      default:
        return `bg-gray-500/20 text-gray-400 border border-gray-500/30`
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Please log in to access service categories</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enterprise Header Section */}
        <div
          className="rounded-xl shadow-lg backdrop-blur-xl p-6"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: `0 10px 30px ${LUXE_COLORS.black}80`
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                    boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <FolderOpen className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Service Categories
                  </h1>
                  <p className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                    {sortedCategories.length} categories • Organize services for better discovery
                    and reporting
                  </p>
                </div>
              </div>
            </div>

            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  color: LUXE_COLORS.black,
                  border: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.goldDark} 0%, ${LUXE_COLORS.gold} 100%)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            )}
          </div>
        </div>

        {/* Enterprise Filters Section */}
        <div
          className="rounded-xl shadow-lg backdrop-blur-xl p-6"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
            border: `1px solid ${LUXE_COLORS.gold}20`
          }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: LUXE_COLORS.bronze }}
              />
              <Input
                placeholder="Search categories by name, code, or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText,
                  '::placeholder': { color: LUXE_COLORS.bronze }
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-48 h-11 transition-all"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent
                  className="border-0"
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="all" style={{ color: LUXE_COLORS.lightText }}>
                    All Status
                  </SelectItem>
                  <SelectItem value="active" style={{ color: LUXE_COLORS.emerald }}>
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" style={{ color: LUXE_COLORS.gold }}>
                    Inactive
                  </SelectItem>
                  <SelectItem value="archived" style={{ color: LUXE_COLORS.bronze }}>
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Enterprise Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl shadow-lg p-6 animate-pulse"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
                  border: `1px solid ${LUXE_COLORS.gold}10`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg"
                    style={{ backgroundColor: `${LUXE_COLORS.gold}30` }}
                  ></div>
                  <div
                    className="h-5 rounded flex-1"
                    style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }}
                  ></div>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-4 rounded w-3/4"
                    style={{ backgroundColor: `${LUXE_COLORS.bronze}20` }}
                  ></div>
                  <div
                    className="h-3 rounded w-1/2"
                    style={{ backgroundColor: `${LUXE_COLORS.bronze}10` }}
                  ></div>
                </div>
              </div>
            ))
          ) : sortedCategories.length === 0 ? (
            <div
              className="col-span-full rounded-xl shadow-lg backdrop-blur-xl p-12 text-center"
              style={{
                backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
                border: `1px solid ${LUXE_COLORS.gold}20`
              }}
            >
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.bronze}40 0%, ${LUXE_COLORS.gold}20 100%)`
                }}
              >
                <FolderOpen className="h-8 w-8" style={{ color: LUXE_COLORS.gold }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                No service categories found
              </h3>
              <p className="mb-6 max-w-md mx-auto" style={{ color: LUXE_COLORS.bronze }}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No categories match your current filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first service category to organize your salon services.'}
              </p>
              {canCreate && !searchQuery && statusFilter === 'all' && (
                <Button
                  onClick={openCreateModal}
                  className="font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                    color: LUXE_COLORS.black,
                    border: 'none'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              )}
            </div>
          ) : (
            sortedCategories.map(category => {
              const name = category.dynamic_fields?.name?.value || category.entity_name
              const code = category.dynamic_fields?.code?.value
              const description = category.dynamic_fields?.description?.value
              const status = category.dynamic_fields?.status?.value || 'active'
              const displayOrder = category.dynamic_fields?.display_order?.value || 0
              const colorTag = category.dynamic_fields?.color_tag?.value

              return (
                <div
                  key={category.id}
                  className="rounded-xl shadow-lg backdrop-blur-xl hover:shadow-xl transition-all duration-200 cursor-pointer group overflow-hidden hover:scale-[1.02]"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
                    border: `1px solid ${LUXE_COLORS.gold}15`
                  }}
                  onClick={() => canEdit && openEditModal(category)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}50`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}15`
                  }}
                >
                  {/* Color accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: colorTag || LUXE_COLORS.gold }}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
                          style={{
                            backgroundColor: colorTag || LUXE_COLORS.gold,
                            boxShadow: `0 4px 6px ${colorTag || LUXE_COLORS.gold}30`
                          }}
                        >
                          <span className="font-bold text-sm" style={{ color: LUXE_COLORS.black }}>
                            {name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-semibold text-lg truncate transition-colors"
                            style={{ color: LUXE_COLORS.champagne }}
                          >
                            {name}
                          </h3>
                          {code && (
                            <p className="text-sm font-mono" style={{ color: LUXE_COLORS.bronze }}>
                              {code}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`${getStatusBadgeColor(status)} px-3 py-1 text-xs font-medium rounded-full flex-shrink-0`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>

                    {description && (
                      <p
                        className="text-sm mb-4 line-clamp-2 leading-relaxed"
                        style={{ color: LUXE_COLORS.lightText }}
                      >
                        {description}
                      </p>
                    )}

                    <div
                      className="flex items-center justify-between pt-4 border-t"
                      style={{ borderColor: `${LUXE_COLORS.gold}15` }}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-medium" style={{ color: LUXE_COLORS.bronze }}>
                          Display Order:
                        </span>
                        <span
                          className="px-2 py-1 rounded font-mono"
                          style={{
                            backgroundColor: `${LUXE_COLORS.gold}10`,
                            color: LUXE_COLORS.gold
                          }}
                        >
                          {displayOrder}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {canEdit && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              openEditModal(category)
                            }}
                            className="text-xs font-medium transition-colors hover:scale-105"
                            style={{ color: LUXE_COLORS.gold }}
                            onMouseEnter={e =>
                              (e.currentTarget.style.color = LUXE_COLORS.champagne)
                            }
                            onMouseLeave={e => (e.currentTarget.style.color = LUXE_COLORS.gold)}
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && status !== 'archived' && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleArchive(category)
                            }}
                            className="text-xs font-medium transition-colors hover:scale-105"
                            style={{ color: LUXE_COLORS.ruby }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = LUXE_COLORS.ruby)}
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Enterprise Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col backdrop-blur-xl"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
            border: `1px solid ${LUXE_COLORS.gold}30`,
            color: LUXE_COLORS.lightText
          }}
        >
          <DialogHeader
            className="pb-6 border-b flex-shrink-0"
            style={{ borderColor: `${LUXE_COLORS.gold}20` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
                }}
              >
                <FolderOpen className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
              </div>
              <div>
                <DialogTitle
                  className="text-xl font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {editingCategory ? 'Edit Service Category' : 'Create Service Category'}
                </DialogTitle>
                <DialogDescription className="mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  {editingCategory
                    ? 'Update the service category details below to modify how services are organized.'
                    : 'Create a new service category to better organize and discover your salon services.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1">
            <ServiceCategoryForm
              category={editingCategory}
              onSubmit={editingCategory ? handleEdit : handleCreate}
              onCancel={() => setIsModalOpen(false)}
              isLoading={isCreating || isUpdating}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Form component for creating/editing categories
function ServiceCategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading
}: {
  category: ServiceCategory | null
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    display_order: 0,
    status: 'active',
    color_tag: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when category changes
  React.useEffect(() => {
    if (category) {
      console.log('[ServiceCategoryForm] Populating form with category data:', category)
      setFormData({
        name: category.dynamic_fields?.name?.value || category.entity_name || '',
        code: category.dynamic_fields?.code?.value || '',
        description: category.dynamic_fields?.description?.value || '',
        display_order: category.dynamic_fields?.display_order?.value || 0,
        status: category.dynamic_fields?.status?.value || 'active',
        color_tag: category.dynamic_fields?.color_tag?.value || ''
      })
    } else {
      // Reset form for new category
      setFormData({
        name: '',
        code: '',
        description: '',
        display_order: 0,
        status: 'active',
        color_tag: ''
      })
    }
  }, [category])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (formData.name.length < 2 || formData.name.length > 60) {
      newErrors.name = 'Category name must be 2-60 characters'
    }

    if (formData.display_order < 0) {
      newErrors.display_order = 'Display order must be >= 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-6 pt-6 pb-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: LUXE_COLORS.champagne }}
            >
              Category Name *
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Hair, Nails, Spa, Massage..."
              className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
              style={{
                backgroundColor: `${LUXE_COLORS.charcoal}80`,
                border: `1px solid ${LUXE_COLORS.bronze}30`,
                color: LUXE_COLORS.lightText
              }}
            />
            {errors.name && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-xs">
                  !
                </span>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Category Code
            </label>
            <Input
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              placeholder="SRV-HAIR"
              className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Optional unique identifier for the category
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Display Order
            </label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={e =>
                setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
              }
              className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lower numbers appear first in lists
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={value => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectItem value="active" className="text-green-700 dark:text-green-400">
                  Active
                </SelectItem>
                <SelectItem value="inactive" className="text-yellow-700 dark:text-yellow-400">
                  Inactive
                </SelectItem>
                <SelectItem value="archived" className="text-gray-700 dark:text-gray-400">
                  Archived
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Controls category visibility and availability
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Color Theme
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={formData.color_tag || '#f59e0b'}
                onChange={e => setFormData({ ...formData, color_tag: e.target.value })}
                className="h-11 w-16 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <Input
                  value={formData.color_tag || '#f59e0b'}
                  onChange={e => setFormData({ ...formData, color_tag: e.target.value })}
                  className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="#f59e0b"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Visual identifier for the category
            </p>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Describe what types of services belong in this category..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Help staff and customers understand what this category includes
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex justify-end space-x-4 pt-6 pb-6 px-6 border-t flex-shrink-0 -mx-6 -mb-6 mt-6"
        style={{
          backgroundColor: `${LUXE_COLORS.charcoal}50`,
          borderColor: `${LUXE_COLORS.gold}20`
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-11 px-6 transition-all hover:scale-[1.02]"
          style={{
            borderColor: `${LUXE_COLORS.bronze}50`,
            color: LUXE_COLORS.bronze,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = `${LUXE_COLORS.bronze}10`
            e.currentTarget.style.borderColor = LUXE_COLORS.bronze
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = `${LUXE_COLORS.bronze}50`
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
            color: LUXE_COLORS.black,
            border: 'none'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{category ? 'Update Category' : 'Create Category'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
