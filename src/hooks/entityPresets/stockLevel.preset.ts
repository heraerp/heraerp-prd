/**
 * STOCK_LEVEL Entity Preset (PHASE 2)
 *
 * Enterprise multi-branch inventory tracking via entities.
 * Each STOCK_LEVEL represents current stock for a (product, location) pair.
 *
 * 🔄 PHASE 2 IMPLEMENTATION - Not used yet
 * Phase 1 uses simple product.stock_quantity field
 *
 * Usage:
 * - Query: GET /api/v2/entities?entity_type=STOCK_LEVEL&include_relationships=true
 * - Filter by product: &filter_rel[STOCK_OF_PRODUCT]=<product_id>
 * - Filter by location: &filter_rel[STOCK_AT_LOCATION]=<location_id>
 *
 * Smart Codes:
 * - Entity: HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1
 * - Dynamics: HERA.SALON.INV.DYN.QTY.V1, HERA.SALON.INV.DYN.REORDER.V1
 * - Relations: HERA.SALON.INV.REL.STOCK_OF_PRODUCT.V1, HERA.SALON.INV.REL.STOCK_AT_LOCATION.V1
 */

import type { DynamicFieldDef, RelationshipDef } from '../useUniversalEntity'

export const STOCK_LEVEL_PRESET = {
  entity_type: 'STOCK_LEVEL',
  smart_code: 'HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1',

  dynamicFields: [
    {
      name: 'quantity',
      type: 'number' as const,
      smart_code: 'HERA.SALON.INV.DYN.QTY.V1',
      ui: { label: 'Current Quantity', placeholder: '0' },
      validation: { min: 0 }
    },
    {
      name: 'reorder_level',
      type: 'number' as const,
      smart_code: 'HERA.SALON.INV.DYN.REORDER.V1',
      ui: { label: 'Reorder Level', placeholder: '10' },
      validation: { min: 0 }
    },
    {
      name: 'last_counted_at',
      type: 'date' as const,
      smart_code: 'HERA.SALON.INV.DYN.LAST_COUNT.V1',
      ui: { label: 'Last Physical Count', placeholder: '' }
    },
    {
      name: 'last_counted_by',
      type: 'text' as const,
      smart_code: 'HERA.SALON.INV.DYN.COUNTED_BY.V1',
      ui: { label: 'Counted By', placeholder: 'User ID' }
    }
  ] as DynamicFieldDef[],

  relationships: [
    {
      type: 'STOCK_OF_PRODUCT',
      smart_code: 'HERA.SALON.INV.REL.STOCK_OF_PRODUCT.V1',
      cardinality: 'many-to-one' as const,
      description: 'Links stock level to product'
    },
    {
      type: 'STOCK_AT_LOCATION',
      smart_code: 'HERA.SALON.INV.REL.STOCK_AT_LOCATION.V1',
      cardinality: 'many-to-one' as const,
      description: 'Links stock level to branch/location'
    }
  ] as RelationshipDef[]
}

/**
 * Helper to create a STOCK_LEVEL entity
 *
 * @example
 * const stockLevel = await createStockLevel({
 *   organization_id: orgId,
 *   product_id: 'uuid',
 *   location_id: 'uuid',
 *   quantity: 50,
 *   reorder_level: 10
 * })
 */
export async function createStockLevel(params: {
  organization_id: string
  product_id: string
  location_id: string
  quantity: number
  reorder_level: number
}) {
  const { apiV2 } = await import('@/lib/client/fetchV2')

  return apiV2.post('entities', {
    entity_type: 'STOCK_LEVEL',
    entity_name: `Stock: ${params.product_id} @ ${params.location_id}`,
    smart_code: STOCK_LEVEL_PRESET.smart_code,
    organization_id: params.organization_id,
    dynamic_fields: {
      quantity: {
        value: params.quantity,
        type: 'number',
        smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
      },
      reorder_level: {
        value: params.reorder_level,
        type: 'number',
        smart_code: 'HERA.SALON.INV.DYN.REORDER.V1'
      }
    },
    metadata: {
      relationships: {
        STOCK_OF_PRODUCT: [params.product_id],
        STOCK_AT_LOCATION: [params.location_id]
      }
    }
  })
}

/**
 * Query stock levels for a product across all locations
 *
 * @example
 * const stockLevels = await getStockLevelsByProduct(orgId, productId)
 */
export async function getStockLevelsByProduct(
  organizationId: string,
  productId: string
): Promise<any[]> {
  const { apiV2 } = await import('@/lib/client/fetchV2')

  const result = await apiV2.get('entities', {
    p_organization_id: organizationId,
    p_entity_type: 'STOCK_LEVEL',
    p_include_dynamic: true,
    p_include_relationships: true
    // TODO: Add relationship filter when available
    // p_filter_rel_STOCK_OF_PRODUCT: productId
  })

  const stockLevels = result.data?.data || []

  // Filter client-side for now (Phase 2: server-side filter)
  return stockLevels.filter((sl: any) => {
    const productRels = sl.relationships?.STOCK_OF_PRODUCT || []
    return productRels.some((rel: any) => rel.to_entity?.id === productId)
  })
}
