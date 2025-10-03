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
import { DynamicFieldConfig } from '@/hooks/entityPresets'
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
import { SmartCodeKeys } from '@/lib/constants/smart-codes'
import '@/styles/salon-luxe.css'

interface CRUDPageProps {
  title: string
  description: string
  entityType: string
  smartCode: SmartCodeKeys
  dynamicFields: DynamicFieldConfig[]
  tableColumns: {
    key: string
    label: string
    render?: (item: any) => React.ReactNode
  }[]
  icon: LucideIcon
  accentColor: string
  searchPlaceholder?: string
  sortOptions?: { value: string; label: string }[]
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[]
  actions?: {
    render: (item: any) => React.ReactNode
  }
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
  smartCode,
  dynamicFields,
  tableColumns,
  icon: Icon,
  accentColor,
  searchPlaceholder = 'Search...',
  sortOptions = [],
  filterOptions = [],
  actions,
  customFormComponent: CustomForm
}: CRUDPageProps) {
  const {
    salonRole,
    hasPermission,
    isAuthenticated,
    organization: currentOrganization
  } = useSecuredSalonContext()
  const { toast } = useToast()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState(sortOptions[0]?.value || '')
  const [filters, setFilters] = useState<Record<string, string>>({})

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
    dynamicFields
  })

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    let result = entities || []

    // Search filter
    if (searchQuery) {
      result = result.filter(entity => {
        const searchFields = ['entity_name', 'entity_code']
        const dynamicSearchFields = ['name', 'first_name', 'last_name', 'email', 'phone']

        return (
          searchFields.some(field =>
            entity[field]?.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          dynamicSearchFields.some(field =>
            entity.dynamic_fields?.[field]?.value?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      })
    }

    // Apply custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(entity => entity.dynamic_fields?.[key]?.value === value)
      }
    })

    // Sort
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const getValue = (entity: any) => {
          if (sortBy.includes('.')) {
            const [field, subfield] = sortBy.split('.')
            return entity.dynamic_fields?.[field]?.[subfield] || entity[sortBy]
          }
          return entity.dynamic_fields?.[sortBy]?.value || entity[sortBy]
        }

        const aValue = getValue(a)
        const bValue = getValue(b)

        if (typeof aValue === 'string') {
          return aValue.localeCompare(bValue)
        }
        return aValue - bValue
      })
    }

    return result
  }, [entities, searchQuery, sortBy, filters])

  // Permission checks
  const canCreate = hasPermission('salon:admin:full') || ['owner', 'manager'].includes(salonRole)
  const canEdit = hasPermission('salon:admin:full') || ['owner', 'manager'].includes(salonRole)
  const canDelete = hasPermission('salon:admin:full') || ['owner', 'manager'].includes(salonRole)

  const handleCreate = async (formData: any) => {
    try {
      console.log('[SalonLuxeCRUDPage] Creating entity:', formData)

      // Prepare dynamic fields
      const dynamicFieldsData: Record<string, any> = {}
      dynamicFields.forEach(field => {
        if (formData[field.name] !== undefined && formData[field.name] !== '') {
          dynamicFieldsData[field.name] = {
            value: formData[field.name],
            type: field.type,
            smart_code: field.smartCode || smartCode
          }
        }
      })

      await create({
        entity_type: entityType,
        entity_name: formData.entity_name || formData.name || 'Untitled',
        smart_code: smartCode,
        dynamic_fields: dynamicFieldsData
      })

      toast({
        title: `${title.slice(0, -1)} created`,
        description: `Successfully created ${formData.entity_name || formData.name}`,
        variant: 'default'
      })

      setIsModalOpen(false)
      await refetch()
    } catch (error: any) {
      console.error('[SalonLuxeCRUDPage] Create error:', error)
      toast({
        title: 'Create failed',
        description: error?.message || 'Failed to create item',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = async (formData: any) => {
    if (!editingItem) return

    try {
      console.log('[SalonLuxeCRUDPage] Updating entity:', editingItem.id, formData)

      // Prepare dynamic patch
      const dynamicPatch: Record<string, any> = {}
      dynamicFields.forEach(field => {
        if (formData[field.name] !== undefined) {
          dynamicPatch[field.name] = formData[field.name]
        }
      })

      await update({
        entity_id: editingItem.id,
        entity_name: formData.entity_name || formData.name || editingItem.entity_name,
        smart_code: smartCode,
        dynamic_patch: dynamicPatch
      })

      toast({
        title: `${title.slice(0, -1)} updated`,
        description: `Successfully updated ${formData.entity_name || formData.name}`,
        variant: 'default'
      })

      setIsModalOpen(false)
      setEditingItem(null)
      await refetch()
    } catch (error: any) {
      console.error('[SalonLuxeCRUDPage] Update error:', error)
      toast({
        title: 'Update failed',
        description: error?.message || 'Failed to update item',
        variant: 'destructive'
      })
    }
  }

  const handleArchive = async (item: any) => {
    try {
      await archive(item.id)
      toast({
        title: `${title.slice(0, -1)} archived`,
        description: `Successfully archived ${item.entity_name}`,
        variant: 'default'
      })
      await refetch()
    } catch (error: any) {
      toast({
        title: 'Archive failed',
        description: error?.message || 'Failed to archive item',
        variant: 'destructive'
      })
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: any) => {
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
        {/* Header Section */}
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
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}DD 100%)`,
                    boxShadow: `0 4px 6px ${accentColor}30`
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${accentColor} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {title}
                  </h1>
                  <p className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                    {filteredEntities.length} items • {description}
                  </p>
                </div>
              </div>
            </div>

            {canCreate && (
              <Button
                onClick={openCreateModal}
                className="font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}DD 100%)`,
                  color: LUXE_COLORS.black,
                  border: 'none'
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New {title.slice(0, -1)}
              </Button>
            )}
          </div>
        </div>

        {/* Filters Section */}
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
                className="pl-10 h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>

            {sortOptions.length > 0 && (
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className="w-48 h-11 transition-all"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  {sortOptions.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filterOptions.map(filter => (
              <Select
                key={filter.key}
                value={filters[filter.key] || 'all'}
                onValueChange={value => setFilters({ ...filters, [filter.key]: value })}
              >
                <SelectTrigger
                  className="w-48 h-11 transition-all"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder={`Filter by ${filter.label}`} />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="all" style={{ color: LUXE_COLORS.lightText }}>
                    All {filter.label}
                  </SelectItem>
                  {filter.options.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div
          className="rounded-xl shadow-lg backdrop-blur-xl overflow-hidden"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
            border: `1px solid ${LUXE_COLORS.gold}20`
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: accentColor }} />
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="text-center p-12">
              <Icon className="h-12 w-12 mx-auto mb-4" style={{ color: accentColor }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                No {title.toLowerCase()} found
              </h3>
              <p className="mb-6" style={{ color: LUXE_COLORS.bronze }}>
                {searchQuery || Object.keys(filters).some(k => filters[k] !== 'all')
                  ? 'No items match your current filters.'
                  : `Get started by creating your first ${title.slice(0, -1).toLowerCase()}.`}
              </p>
              {canCreate && !searchQuery && (
                <Button
                  onClick={openCreateModal}
                  className="font-semibold shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}DD 100%)`,
                    color: LUXE_COLORS.black
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First {title.slice(0, -1)}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}20` }}>
                    {tableColumns.map(column => (
                      <th
                        key={column.key}
                        className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: LUXE_COLORS.gold }}
                      >
                        {column.label}
                      </th>
                    ))}
                    {(canEdit || canDelete || actions) && (
                      <th
                        className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider"
                        style={{ color: LUXE_COLORS.gold }}
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: `${LUXE_COLORS.gold}10` }}>
                  {filteredEntities.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-900/30 transition-colors">
                      {tableColumns.map(column => (
                        <td
                          key={column.key}
                          className="px-6 py-4 text-sm"
                          style={{ color: LUXE_COLORS.lightText }}
                        >
                          {column.render
                            ? column.render(item)
                            : item.dynamic_fields?.[column.key]?.value || item[column.key] || '-'}
                        </td>
                      ))}
                      {(canEdit || canDelete || actions) && (
                        <td className="px-6 py-4 text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            {actions?.render && actions.render(item)}
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-xs font-medium transition-colors hover:scale-105"
                                style={{ color: accentColor }}
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleArchive(item)}
                                className="text-xs font-medium transition-colors hover:scale-105"
                                style={{ color: LUXE_COLORS.ruby }}
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}DD 100%)`,
                  boxShadow: `0 4px 6px ${accentColor}30`
                }}
              >
                <Icon className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
              </div>
              <div>
                <DialogTitle
                  className="text-xl font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${accentColor} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {editingItem ? `Edit ${title.slice(0, -1)}` : `Create ${title.slice(0, -1)}`}
                </DialogTitle>
                <DialogDescription className="mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  {editingItem
                    ? `Update the ${title.slice(0, -1).toLowerCase()} details below.`
                    : `Create a new ${title.slice(0, -1).toLowerCase()}.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1">
            {CustomForm ? (
              <CustomForm
                {...(editingItem || {})}
                onSubmit={editingItem ? handleEdit : handleCreate}
                onCancel={() => setIsModalOpen(false)}
                isLoading={isCreating || isUpdating}
              />
            ) : (
              <EntityForm
                entity={editingItem}
                entityType={entityType}
                dynamicFields={dynamicFields}
                onSubmit={editingItem ? handleEdit : handleCreate}
                onCancel={() => setIsModalOpen(false)}
                isLoading={isCreating || isUpdating}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
