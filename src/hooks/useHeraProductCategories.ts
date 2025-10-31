/**
 * HERA Product Categories Hook
 *
 * Thin wrapper over useUniversalEntity for category management
 * Provides category-specific helpers and RPC integration
 *
 * ✅ FOLLOWS HERA CRUD ARCHITECTURE:
 * - Uses useUniversalEntity (NO direct Supabase)
 * - Uses CATEGORY_PRESET for dynamic fields
 * - Follows staff/role pattern exactly
 */

import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { CATEGORY_PRESET } from './entityPresets'
import type { DynamicFieldDef } from './useUniversalEntityV1'

export interface ProductCategory {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  entity_description?: string
  metadata?: any
  // Flattened dynamic fields
  name?: string
  display_order?: number
  icon?: string
  color?: string
  active?: boolean
  created_at: string
  updated_at: string
}

export interface UseHeraProductCategoriesOptions {
  organizationId?: string
  includeArchived?: boolean
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
  }
}

export function useHeraProductCategories(options?: UseHeraProductCategoriesOptions) {
  const {
    entities: categories,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntityV1({
    entity_type: 'product_category',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100,
      // Only filter by 'active' status when not including archived
      ...(options?.includeArchived ? {} : { status: 'active' }),
      ...options?.filters
    },
    dynamicFields: CATEGORY_PRESET.dynamicFields as DynamicFieldDef[]
  })

  // Helper to create category with proper smart codes
  const createCategory = async (data: {
    name: string
    description?: string
    display_order?: number
    icon?: string
    color?: string
    active?: boolean
    status?: string
  }) => {
    const entity_name = data.name

    // Build dynamic_fields payload following useHeraStaff pattern
    const dynamic_fields: Record<string, any> = {}

    if (data.display_order !== undefined) {
      dynamic_fields.display_order = {
        value: data.display_order,
        type: 'number',
        smart_code: 'HERA.SALON.CATEGORY.DYN.ORDER.v1'
      }
    }

    if (data.icon) {
      dynamic_fields.icon = {
        value: data.icon,
        type: 'text',
        smart_code: 'HERA.SALON.CATEGORY.DYN.ICON.v1'
      }
    }

    if (data.color) {
      dynamic_fields.color = {
        value: data.color,
        type: 'text',
        smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR.v1'
      }
    }

    if (data.active !== undefined) {
      dynamic_fields.active = {
        value: data.active,
        type: 'boolean',
        smart_code: 'HERA.SALON.CATEGORY.DYN.ACTIVE.v1'
      }
    }

    return baseCreate({
      entity_type: 'product_category',
      entity_name,
      smart_code: 'HERA.SALON.CATEGORY.ENT.PRODUCT.V1',
      entity_description: data.description || null,
      status: data.status === 'inactive' ? 'archived' : 'active',
      dynamic_fields
    } as any)
  }

  // Helper to update category
  const updateCategory = async (
    id: string,
    data: Partial<Parameters<typeof createCategory>[0]>
  ) => {
    // Get existing category to build complete update
    const category = (categories as ProductCategory[])?.find(c => c.id === id)

    const entity_name = data.name || category?.entity_name

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}

    if (data.display_order !== undefined) {
      dynamic_patch.display_order = data.display_order
    }

    if (data.icon !== undefined) {
      dynamic_patch.icon = data.icon
    }

    if (data.color !== undefined) {
      dynamic_patch.color = data.color
    }

    if (data.active !== undefined) {
      dynamic_patch.active = data.active
    }

    const payload: any = {
      entity_id: id,
      ...(entity_name && { entity_name }),
      ...(data.description !== undefined && { entity_description: data.description }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(data.status !== undefined && {
        status: data.status === 'inactive' ? 'archived' : 'active'
      })
    }

    return baseUpdate(payload)
  }

  // Helper to archive category (soft delete)
  const archiveCategory = async (id: string) => {
    const category = (categories as ProductCategory[])?.find(c => c.id === id)
    if (!category) throw new Error('Category not found')

    // console.log('[useHeraProductCategories] Archiving category:', { id })

    return baseUpdate({
      entity_id: id,
      entity_name: category.entity_name,
      status: 'archived'
    })
  }

  // Helper to delete category (hard delete)
  const deleteCategory = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return archiveCategory(id)
    }
    return baseDelete({ entity_id: id, hard_delete: true })
  }

  // console.log('[useHeraProductCategories] Categories loaded:', {
  //   count: (categories as ProductCategory[])?.length || 0,
  //   sample: (categories as ProductCategory[])?.[0],
  //   organizationId: options?.organizationId
  // })

  return {
    categories: (categories as ProductCategory[]) || [],
    isLoading,
    error,
    refetch, // ✅ Expose refetch for manual cache refresh
    createCategory,
    updateCategory,
    archiveCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting
  }
}
