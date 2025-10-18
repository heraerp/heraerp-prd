/**
 * Phase 1 → Phase 2 Migration Helper
 *
 * Creates STOCK_LEVEL entities for existing products
 * ✅ NO direct Supabase calls - uses Universal API v2
 * ✅ Idempotent - safe to run multiple times
 */

import { apiV2 } from '@/lib/client/fetchV2'

export interface MigrationResult {
  success: boolean
  stockLevelsCreated: number
  products: number
  locations: number
  errors: string[]
}

/**
 * Migrate existing product stock to STOCK_LEVEL entities
 *
 * Creates a STOCK_LEVEL entity for each (product, location) combination
 */
export async function migrateToPhase2(organizationId: string): Promise<MigrationResult> {
  const errors: string[] = []
  let stockLevelsCreated = 0

  console.log('🚀 [Migration] Starting Phase 1 → Phase 2 migration...')
  console.log('🔑 [Migration] Organization ID:', organizationId)

  try {
    // Step 1: Fetch all products with stock_quantity
    console.log('📦 [Migration] Fetching products...')
    console.log('📦 [Migration] Request params:', {
      entity_type: 'PRODUCT',
      include_dynamic: 'true',
      include_relationships: 'true',
      limit: '1000'
    })

    // Add timeout to detect hanging requests
    const fetchWithTimeout = async (promise: Promise<any>, timeoutMs = 30000) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
      )
      return Promise.race([promise, timeout])
    }

    const productsResult = await fetchWithTimeout(
      apiV2.get('entities', {
        entity_type: 'PRODUCT',
        include_dynamic: 'true',
        include_relationships: 'true',
        limit: '1000'
      })
    ).catch(err => {
      console.error('📦 [Migration] Fetch error:', err)
      return { error: { message: err.message } }
    })

    console.log('📦 [Migration] Products result:', {
      hasError: !!productsResult.error,
      error: productsResult.error,
      hasData: !!productsResult.data,
      success: productsResult.data?.success,
      dataLength: productsResult.data?.data?.length
    })

    if (productsResult.error || !productsResult.data?.success) {
      throw new Error('Failed to fetch products: ' + (productsResult.error?.message || JSON.stringify(productsResult.data)))
    }

    const products = productsResult.data.data || []
    console.log(`✅ [Migration] Found ${products.length} products`)

    // Step 2: Fetch all locations/branches
    console.log('🏢 [Migration] Fetching branches...')
    const locationsResult = await apiV2.get('entities', {
      entity_type: 'BRANCH',
      limit: '100'
    })

    if (locationsResult.error || !locationsResult.data?.success) {
      throw new Error('Failed to fetch branches: ' + (locationsResult.error?.message || 'Unknown error'))
    }

    const locations = locationsResult.data.data || []
    console.log(`✅ [Migration] Found ${locations.length} branches`)

    if (locations.length === 0) {
      errors.push('No branches found - cannot create stock levels without branches. Please create at least one branch first.')
      return {
        success: false,
        stockLevelsCreated: 0,
        products: products.length,
        locations: 0,
        errors
      }
    }

    // Step 3: Check for existing STOCK_LEVEL entities
    console.log('🔍 [Migration] Checking for existing stock levels...')
    const existingStockLevelsResult = await apiV2.get('entities', {
      entity_type: 'STOCK_LEVEL',
      include_relationships: 'true',
      limit: '10000'
    })

    const existingStockLevels = existingStockLevelsResult.data?.data || []
    console.log(`ℹ️ [Migration] Found ${existingStockLevels.length} existing stock levels`)

    // Build lookup of existing (product, location) pairs
    const existingPairs = new Set<string>()
    existingStockLevels.forEach((sl: any) => {
      // Check for STOCK_OF_PRODUCT relationship
      const productRels = sl.relationships?.STOCK_OF_PRODUCT || []
      const locationRels = sl.relationships?.STOCK_AT_LOCATION || []

      const productId = Array.isArray(productRels) ? productRels[0]?.to_entity?.id : productRels.to_entity?.id
      const locationId = Array.isArray(locationRels) ? locationRels[0]?.to_entity?.id : locationRels.to_entity?.id

      if (productId && locationId) {
        existingPairs.add(`${productId}:${locationId}`)
      }
    })

    // Step 4: Create STOCK_LEVEL entities for each (product, location) pair
    console.log('📝 [Migration] Creating stock levels...')

    for (const product of products) {
      const stockQuantity = product.stock_quantity || 0
      const reorderLevel = product.reorder_level || 10

      // Get product's stock_at relationships to determine which branches it's stocked at
      const stockAtRels = product.relationships?.STOCK_AT || product.relationships?.stock_at || []
      const productLocations = Array.isArray(stockAtRels)
        ? stockAtRels.map((rel: any) => rel.to_entity)
        : stockAtRels.to_entity ? [stockAtRels.to_entity] : []

      // If product has no STOCK_AT relationships, create for all locations
      const targetLocations = productLocations.length > 0 ? productLocations : locations

      for (const location of targetLocations) {
        const pairKey = `${product.id}:${location.id}`

        // Skip if already exists
        if (existingPairs.has(pairKey)) {
          console.log(`⏭️ [Migration] Skipping existing: ${product.entity_name} @ ${location.entity_name}`)
          continue
        }

        try {
          console.log(`🔨 [Migration] Creating stock level for: ${product.entity_name} @ ${location.entity_name}`)

          // Generate unique entity_code with timestamp to avoid duplicates
          const timestamp = Date.now().toString(36).substring(-4)
          const uniqueCode = `STOCK-${product.id.substring(0, 8)}-${location.id.substring(0, 8)}-${timestamp}`

          // Step 1: Create STOCK_LEVEL entity
          const result = await apiV2.post('entities', {
            entity_type: 'STOCK_LEVEL',
            entity_name: `Stock: ${product.entity_name} @ ${location.entity_name}`,
            entity_code: uniqueCode,
            smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1',
            organization_id: organizationId,
            dynamic_fields: {
              quantity: {
                value: stockQuantity,
                type: 'number',
                smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
              },
              reorder_level: {
                value: reorderLevel,
                type: 'number',
                smart_code: 'HERA.SALON.INV.DYN.REORDER.V1'
              }
            }
          })

          console.log(`📦 [Migration] API result for ${product.entity_name}:`, result)

          if (result.error) {
            // Check if it's a duplicate entity_code error
            const isDuplicateError =
              result.error.details?.includes('uq_entity_org_code') ||
              result.error.details?.includes('duplicate key')

            if (isDuplicateError) {
              console.log(`⏭️ [Migration] Stock level already exists (duplicate entity_code): ${product.entity_name} @ ${location.entity_name}`)
              continue
            }

            const errorMsg = `Failed to create stock level for ${product.entity_name} @ ${location.entity_name}: ${JSON.stringify(result.error)}`
            console.error('❌ [Migration]', errorMsg)
            console.error('❌ [Migration] Full error object:', result.error)
            console.error('❌ [Migration] Full response:', result)
            errors.push(errorMsg)
            continue
          }

          const stockLevelId = result.data?.data?.id || result.data?.id
          if (!stockLevelId) {
            const errorMsg = `No ID returned for stock level: ${product.entity_name} @ ${location.entity_name}`
            console.error('❌ [Migration]', errorMsg)
            errors.push(errorMsg)
            continue
          }

          // Step 2: Create STOCK_OF_PRODUCT relationship
          const productRelResult = await apiV2.post('relationships', {
            from_entity_id: stockLevelId,
            to_entity_id: product.id,
            relationship_type: 'STOCK_OF_PRODUCT',
            smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1',
            organization_id: organizationId
          })

          if (productRelResult.error) {
            console.warn(`⚠️ [Migration] Failed to create STOCK_OF_PRODUCT relationship: ${productRelResult.error.message}`)
          }

          // Step 3: Create STOCK_AT_LOCATION relationship
          const locationRelResult = await apiV2.post('relationships', {
            from_entity_id: stockLevelId,
            to_entity_id: location.id,
            relationship_type: 'STOCK_AT_LOCATION',
            smart_code: 'HERA.SALON.INV.REL.STOCKATLOCATION.V1',
            organization_id: organizationId
          })

          if (locationRelResult.error) {
            console.warn(`⚠️ [Migration] Failed to create STOCK_AT_LOCATION relationship: ${locationRelResult.error.message}`)
          }

          stockLevelsCreated++
          console.log(`✅ [Migration] Created: ${product.entity_name} @ ${location.entity_name} (qty: ${stockQuantity})`)
        } catch (error: any) {
          const errorMsg = `Exception creating stock level: ${error.message}`
          console.error('❌ [Migration]', errorMsg)
          errors.push(errorMsg)
        }
      }
    }

    console.log(`🎉 [Migration] Complete! Created ${stockLevelsCreated} stock levels`)

    return {
      success: errors.length === 0,
      stockLevelsCreated,
      products: products.length,
      locations: locations.length,
      errors
    }
  } catch (error: any) {
    console.error('💥 [Migration] Fatal error:', error)
    errors.push(`Fatal error: ${error.message}`)

    return {
      success: false,
      stockLevelsCreated,
      products: 0,
      locations: 0,
      errors
    }
  }
}
