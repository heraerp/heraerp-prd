/**
 * HERA Service Categories Hook V2
 *
 * ✅ UPGRADED: Now uses useUniversalEntityV1 with RPC hera_entities_crud_v1
 * - Automatic dynamic field flattening
 * - RPC orchestrator for atomic operations
 * - Consistent with staffs/services hook pattern
 * - Better caching and optimization
 */

import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { SERVICE_CATEGORY_PRESET } from './entityPresets'
import type { DynamicFieldDef } from './useUniversalEntityV1'

export interface ServiceCategory {
  id: string
  organization_id: string
  entity_type: 'service_category'
  entity_name: string
  entity_code: string
  smart_code: string
  entity_description?: string | null
  status: 'active' | 'archived' | 'deleted'
  created_at: string | null
  updated_at: string | null

  // Dynamic fields (auto-flattened by useUniversalEntity)
  color?: string
  description?: string
  icon?: string
  display_order?: number
  active?: boolean
  service_count?: number
  metadata?: any
}

export interface UseHeraServiceCategoriesOptions {
  organizationId?: string
  includeArchived?: boolean
}

export function useHeraServiceCategories(options?: UseHeraServiceCategoriesOptions) {
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
    entity_type: 'SERVICE_CATEGORY', // ✅ UPGRADED: Uppercase for RPC pattern (already correct)
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100,
      ...(options?.includeArchived ? {} : { status: 'active' })
    },
    dynamicFields: SERVICE_CATEGORY_PRESET.dynamicFields as DynamicFieldDef[]
  })

  // Helper to create category
  const createCategory = async (data: {
    name: string
    description?: string
    color?: string
    icon?: string
    display_order?: number
  }) => {
    const entity_name = data.name

    // Build dynamic_fields payload
    const dynamic_fields: Record<string, any> = {}

    if (data.color) {
      dynamic_fields.color = {
        value: data.color,
        type: 'text',
        smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.COLOR.v1'
      }
    }

    if (data.description) {
      dynamic_fields.description = {
        value: data.description,
        type: 'text',
        smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.DESCRIPTION.v1'
      }
    }

    if (data.icon) {
      dynamic_fields.icon = {
        value: data.icon,
        type: 'text',
        smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.ICON.v1'
      }
    }

    if (data.display_order !== undefined) {
      dynamic_fields.display_order = {
        value: data.display_order,
        type: 'number',
        smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.ORDER.v1'
      }
    }

    // Service count starts at 0
    dynamic_fields.service_count = {
      value: 0,
      type: 'number',
      smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.SERVICE_COUNT.v1'
    }

    const result = await baseCreate({
      entity_type: 'SERVICE_CATEGORY', // ✅ UPGRADED: Uppercase for RPC pattern
      entity_name,
      smart_code: 'HERA.SALON.SERVICE.CATEGORY.STANDARD.v1',
      entity_description: data.description || null,
      status: 'active',
      dynamic_fields
    } as any)

    return result
  }

  // Helper to update category
  const updateCategory = async (
    id: string,
    data: Partial<Parameters<typeof createCategory>[0]>
  ) => {
    const category = (categories as ServiceCategory[])?.find(c => c.id === id)
    if (!category) throw new Error('Category not found')

    const entity_name = data.name || category.entity_name

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}

    if (data.color !== undefined) {
      dynamic_patch.color = data.color
    }

    if (data.description !== undefined) {
      dynamic_patch.description = data.description
    }

    if (data.icon !== undefined) {
      dynamic_patch.icon = data.icon
    }

    if (data.display_order !== undefined) {
      dynamic_patch.display_order = data.display_order
    }

    const payload: any = {
      entity_id: id,
      ...(entity_name && { entity_name }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {})
    }

    return baseUpdate(payload)
  }

  // Helper to archive category (soft delete)
  const archiveCategory = async (id: string) => {
    const category = (categories as ServiceCategory[])?.find(c => c.id === id)
    if (!category) throw new Error('Category not found')

    const result = await baseUpdate({
      entity_id: id,
      entity_name: category.entity_name,
      status: 'archived'
    })

    // ✅ NO REFETCH NEEDED: updateMutation.onSuccess handles cache update automatically
    // The RPC returns updated data, onSuccess removes archived items from cache

    return result
  }

  // Helper to delete category (HARD DELETE by default)
  const deleteCategory = async (id: string, options?: { hard_delete?: boolean; reason?: string }) => {
    const category = (categories as ServiceCategory[])?.find(c => c.id === id)
    if (!category) throw new Error('Category not found')

    // Check if category has services
    if (category.service_count && category.service_count > 0) {
      throw new Error(
        `Cannot delete category "${category.entity_name}" because it has ${category.service_count} service(s). Please reassign or delete those services first.`
      )
    }

    // 🎯 CHANGED: Default to HARD DELETE (permanent removal)
    // Use { hard_delete: false } to archive instead
    if (options?.hard_delete === false) {
      return archiveCategory(id)
    }

    const result = await baseDelete({
      entity_id: id,
      hard_delete: true,
      reason: options?.reason || 'Category deleted by user'
    })

    // ✅ NO REFETCH NEEDED: deleteMutation.onSuccess handles cache removal automatically

    return result
  }

  return {
    categories: (categories as ServiceCategory[]) || [],
    isLoading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    isCreating,
    isUpdating,
    isDeleting
  }
}
