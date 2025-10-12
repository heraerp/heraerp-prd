/**
 * HERA DNA Pattern: Salon Luxe CRUD
 *
 * Enterprise-grade CRUD pattern for salon pages with:
 * - Luxe color theme
 * - Universal entity integration
 * - Modal-based create/edit
 * - Archive/soft delete
 * - Search and filtering
 * - Permission-based actions
 *
 * Usage:
 * import { SalonLuxeCRUDPage } from '@/lib/dna/patterns/salon-luxe-crud-pattern'
 *
 * <SalonLuxeCRUDPage
 *   title="Products"
 *   entityType="PRODUCT"
 *   preset={PRODUCT_PRESET}
 *   icon={Package}
 * />
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Loader2, LucideIcon } from 'lucide-react'
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
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { EntityForm } from '@/lib/entity-framework/EntityForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { LUXE_COLORS } from '@/lib/constants/salon'
import '@/styles/salon-luxe.css'

interface SalonLuxeCRUDPageProps {
  // Page configuration
  title: string
  description?: string
  entityType: string
  preset: any // Entity preset configuration
  icon: LucideIcon

  // Optional customization
  searchPlaceholder?: string
  statusOptions?: Array<{ value: string; label: string; color?: string }>
  additionalFilters?: React.ReactNode

  // Permissions
  createPermissions?: string[]
  editPermissions?: string[]
  deletePermissions?: string[]

  // Custom handlers
  onBeforeCreate?: (data: any) => any
  onBeforeUpdate?: (data: any) => any
  onAfterCreate?: (result: any) => void
  onAfterUpdate?: (result: any) => void
  onAfterDelete?: (id: string) => void

  // Custom rendering
  renderCard?: (item: any, handlers: any) => React.ReactNode
  renderEmptyState?: () => React.ReactNode

  // Custom form component
  customFormComponent?: React.ComponentType<{
    [key: string]: any
    onSubmit: (data: any) => void
    onCancel: () => void
    isLoading: boolean
  }>
}

export function SalonLuxeCRUDPage({
  title,
  description,
  entityType,
  preset,
  icon: Icon,
  searchPlaceholder = 'Search by name, code, or description...',
  statusOptions = [
    { value: 'all', label: 'All Status', color: LUXE_COLORS.lightText },
    { value: 'active', label: 'Active', color: LUXE_COLORS.emerald },
    { value: 'inactive', label: 'Inactive', color: LUXE_COLORS.gold },
    { value: 'archived', label: 'Archived', color: LUXE_COLORS.bronze }
  ],
  additionalFilters,
  createPermissions = ['salon:admin:full', 'owner', 'manager'],
  editPermissions = ['salon:admin:full', 'owner', 'manager'],
  deletePermissions = ['salon:admin:full', 'owner'],
  onBeforeCreate,
  onBeforeUpdate,
  onAfterCreate,
  onAfterUpdate,
  onAfterDelete,
  renderCard,
  renderEmptyState,
  customFormComponent: CustomFormComponent
}: SalonLuxeCRUDPageProps) {
  const { salonRole, hasPermission, isAuthenticated } = useSecuredSalonContext()
  const { toast } = useToast()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    action: () => void
    actionLabel?: string
    actionStyle?: 'destructive' | 'default'
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    actionLabel: 'Confirm',
    actionStyle: 'default'
  })

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Universal entity hook
  const {
    entities,
    isLoading,
    error,
    refetch,
    create,
    update,
    archive,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: entityType,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 200
    },
    dynamicFields: preset.dynamicFields
  })

  // Filter logic
  const shouldShowItem = (item: any) => {
    const status = item.dynamic_fields?.status?.value || 'active'
    if (statusFilter === 'all' && status === 'archived') {
      return false
    }
    return true
  }

  const filteredItems = useMemo(() => {
    return (entities || []).filter((item: any) => {
      // Status filter
      if (statusFilter !== 'all') {
        const status = item.dynamic_fields?.status?.value || 'active'
        if (status !== statusFilter) return false
      }

      // Search filter
      if (searchQuery) {
        const name = item.dynamic_fields?.name?.value || item.entity_name || ''
        const code = item.dynamic_fields?.code?.value || ''
        const description = item.dynamic_fields?.description?.value || ''
        const query = searchQuery.toLowerCase()

        if (
          !name.toLowerCase().includes(query) &&
          !code.toLowerCase().includes(query) &&
          !description.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      if (!shouldShowItem(item)) {
        return false
      }

      return true
    })
  }, [entities, searchQuery, statusFilter])

  // Sort by display_order or created_at
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const orderA = a.dynamic_fields?.display_order?.value || 0
      const orderB = b.dynamic_fields?.display_order?.value || 0
      if (orderA !== orderB) return orderA - orderB

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredItems])

  // Permission checks
  const canCreate = createPermissions.some(p =>
    p.includes(':') ? hasPermission(p) : salonRole === p
  )
  const canEdit = editPermissions.some(p => (p.includes(':') ? hasPermission(p) : salonRole === p))
  const canDelete = deletePermissions.some(p =>
    p.includes(':') ? hasPermission(p) : salonRole === p
  )

  // Handlers
  const handleCreate = async (formData: any) => {
    try {
      const data = onBeforeCreate ? await onBeforeCreate(formData) : formData

      const result = await create({
        entity_type: entityType,
        entity_name: data.name || data.entity_name || `Untitled ${entityType}`,
        smart_code: preset.smart_code || `HERA.SALON.${entityType}.ENTITY.ITEM.V1`,
        dynamic_fields: preset.dynamicFields.reduce((acc: any, field: any) => {
          const fieldName = field.name || field.field_name // Support both formats
          const fieldType = field.type || field.field_type // Support both formats
          if (data[fieldName] !== undefined) {
            acc[fieldName] = {
              value: data[fieldName],
              type: fieldType,
              smart_code: field.smart_code
            }
          }
          return acc
        }, {})
      })

      toast({
        title: `${title.slice(0, -1)} created`,
        description: `Successfully created ${data.name || 'item'}`
      })

      setIsModalOpen(false)
      refetch()

      if (onAfterCreate) onAfterCreate(result)
    } catch (error: any) {
      toast({
        title: 'Creation failed',
        description: error?.message || `Failed to create ${title.toLowerCase().slice(0, -1)}`,
        variant: 'destructive'
      })
    }
  }

  const handleUpdate = async (formData: any) => {
    if (!editingItem) return

    try {
      const data = onBeforeUpdate ? await onBeforeUpdate(formData) : formData

      const result = await update(editingItem.id, {
        entity_name: data.name || data.entity_name || editingItem.entity_name,
        dynamic_fields: preset.dynamicFields.reduce((acc: any, field: any) => {
          const fieldName = field.name || field.field_name // Support both formats
          const fieldType = field.type || field.field_type // Support both formats
          if (data[fieldName] !== undefined) {
            acc[fieldName] = {
              value: data[fieldName],
              type: fieldType,
              smart_code: field.smart_code
            }
          }
          return acc
        }, {})
      })

      toast({
        title: `${title.slice(0, -1)} updated`,
        description: `Successfully updated ${data.name || 'item'}`
      })

      setIsModalOpen(false)
      setEditingItem(null)
      refetch()

      if (onAfterUpdate) onAfterUpdate(result)
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.message || `Failed to update ${title.toLowerCase().slice(0, -1)}`,
        variant: 'destructive'
      })
    }
  }

  const handleArchive = async (item: any) => {
    if (!canDelete) {
      toast({
        title: 'Archive failed',
        description: `You do not have permission to archive ${title.toLowerCase()}`,
        variant: 'destructive'
      })
      return
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: `Archive ${title.slice(0, -1)}?`,
      description: `Are you sure you want to archive "${item.dynamic_fields?.name?.value || item.entity_name}"? This action can be reversed later.`,
      actionLabel: 'Archive',
      actionStyle: 'destructive',
      action: async () => {
        try {
          console.log('[SalonLuxeCRUDPage] Starting archive process for:', item.id)

          await archive(item.id)

          console.log('[SalonLuxeCRUDPage] Archive completed successfully')

          toast({
            title: `${title.slice(0, -1)} archived`,
            description: `Successfully archived ${item.dynamic_fields?.name?.value || item.entity_name}`
          })

          // Force a small delay to ensure the archive completes
          setTimeout(async () => {
            await refetch()
            console.log('[SalonLuxeCRUDPage] Data refetched after archive')
          }, 500)

          if (onAfterDelete) onAfterDelete(item.id)

          // Close confirmation dialog
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        } catch (error: any) {
          toast({
            title: 'Archive failed',
            description: error?.message || `Failed to archive ${title.toLowerCase().slice(0, -1)}`,
            variant: 'destructive'
          })
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: any) => {
    console.log('[SalonLuxeCRUDPage] Opening edit modal for item:', {
      id: item.id,
      entity_name: item.entity_name,
      dynamic_fields_keys: Object.keys(item.dynamic_fields || {}),
      sample_field: item.dynamic_fields?.name,
      all_dynamic_fields: item.dynamic_fields
    })
    setEditingItem(item)
    setIsModalOpen(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Please log in to access {title.toLowerCase()}</p>
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
                  <Icon className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
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
                    {title}
                  </h1>
                  <p className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                    {sortedItems.length} {title.toLowerCase()} •{' '}
                    {description || `Manage your ${title.toLowerCase()}`}
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
                New {title.slice(0, -1)}
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
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-11 focus:ring-2 focus:ring-gold/50 transition-all luxe-input"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
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
                  className="luxe-select-content border-0"
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  {statusOptions.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="luxe-select-item"
                      style={{ color: option.color || LUXE_COLORS.lightText }}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {additionalFilters}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
          </div>
        ) : sortedItems.length === 0 ? (
          renderEmptyState ? (
            renderEmptyState()
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Icon className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.bronze }} />
                <p className="text-lg font-medium mb-2" style={{ color: LUXE_COLORS.lightText }}>
                  No {title.toLowerCase()} found
                </p>
                <p className="text-sm mb-6" style={{ color: LUXE_COLORS.bronze }}>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : `Get started by creating your first ${title.toLowerCase().slice(0, -1)}`}
                </p>
                {canCreate && !searchQuery && statusFilter === 'all' && (
                  <Button
                    onClick={openCreateModal}
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                      color: LUXE_COLORS.black
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create {title.slice(0, -1)}
                  </Button>
                )}
              </div>
            </div>
          )
        ) : renderCard ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedItems.map(item => (
              <div key={item.id}>
                {renderCard(item, {
                  onEdit: () => openEditModal(item),
                  onArchive: () => handleArchive(item),
                  canEdit,
                  canDelete
                })}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p style={{ color: LUXE_COLORS.lightText }}>
              Please provide a renderCard prop to display items
            </p>
          </div>
        )}

        {/* Modal */}
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
                  <Icon className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
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
                    {editingItem ? `Edit ${title.slice(0, -1)}` : `Create ${title.slice(0, -1)}`}
                  </DialogTitle>
                  <DialogDescription className="mt-1" style={{ color: LUXE_COLORS.bronze }}>
                    {editingItem
                      ? `Update the details for this ${title.toLowerCase().slice(0, -1)}`
                      : `Create a new ${title.toLowerCase().slice(0, -1)} for your salon`}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1">
              {CustomFormComponent ? (
                <CustomFormComponent
                  initialData={editingItem}
                  customer={editingItem}
                  onSubmit={editingItem ? handleUpdate : handleCreate}
                  onCancel={() => setIsModalOpen(false)}
                  isLoading={isCreating || isUpdating}
                />
              ) : (
                <EntityForm
                  preset={{
                    ...preset,
                    ui: {
                      displayName: preset.labels?.singular || title.slice(0, -1),
                      pluralDisplayName: preset.labels?.plural || title,
                      icon: Icon.name,
                      description: description || ''
                    }
                  }}
                  mode={editingItem ? 'edit' : 'create'}
                  initialData={
                    editingItem
                      ? {
                          entity_name: editingItem.entity_name,
                          entity_code: editingItem.entity_code,
                          smart_code:
                            editingItem.smart_code ||
                            preset.smart_code ||
                            `HERA.SALON.${entityType}.ENTITY.V1`,
                          dynamic_fields: (() => {
                            const fields: Record<string, any> = {}
                            preset.dynamicFields.forEach((field: any) => {
                              const fieldName = field.name || field.field_name
                              const value = editingItem.dynamic_fields?.[fieldName]?.value
                              if (value !== undefined && value !== null) {
                                fields[fieldName] = value
                              }
                            })
                            console.log('[SalonLuxeCRUDPage] Dynamic fields for form:', fields)
                            return fields
                          })(),
                          relationships: editingItem.relationships || {}
                        }
                      : undefined
                  }
                  userRole={salonRole}
                  onSubmit={async data => {
                    // Transform data back to the format expected by handleCreate/handleUpdate
                    const formData: any = {
                      entity_name: data.entity_name,
                      name: data.entity_name, // Some components expect 'name' field
                      ...data.dynamic_fields
                    }

                    if (editingItem) {
                      await handleUpdate(formData)
                    } else {
                      await handleCreate(formData)
                    }
                  }}
                  onCancel={() => setIsModalOpen(false)}
                  isSubmitting={isCreating || isUpdating}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={confirmDialog.isOpen}
          onOpenChange={open => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
        >
          <AlertDialogContent
            className="luxe-modal"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.gold}30`,
              boxShadow: `0 20px 50px ${LUXE_COLORS.black}90`
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle
                style={{
                  color: LUXE_COLORS.gold,
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}
              >
                {confirmDialog.title}
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: LUXE_COLORS.lightText }}>
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
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
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDialog.action}
                className="h-11 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background:
                    confirmDialog.actionStyle === 'destructive'
                      ? `linear-gradient(135deg, ${LUXE_COLORS.ruby} 0%, ${LUXE_COLORS.rubyDark || LUXE_COLORS.ruby} 100%)`
                      : `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  color: LUXE_COLORS.black,
                  border: 'none'
                }}
              >
                {confirmDialog.actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
