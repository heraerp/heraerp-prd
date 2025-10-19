#!/usr/bin/env node

/**
 * HERA Inventory Phase 2 Migration Script
 *
 * Migrates from Phase 1 (stock in product dynamic data) to Phase 2 (STOCK_LEVEL entities)
 *
 * What it does:
 * 1. Finds all products with stock_quantity in dynamic data
 * 2. Gets all branches for the organization
 * 3. Creates STOCK_LEVEL entities for each (product, branch) combination
 * 4. Migrates stock quantities and reorder levels
 * 5. Creates relationships (STOCK_OF_PRODUCT, STOCK_AT_LOCATION)
 *
 * Usage:
 *   node scripts/migrate-to-stock-level-entities.mjs <organization_id>
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Default user for migration (system user)
const MIGRATION_USER_ID = process.env.MIGRATION_USER_ID || '00000000-0000-0000-0000-000000000001'

async function migrateToStockLevelEntities(organizationId) {
  console.log('\n🚀 Starting Phase 2 Migration: Stock Level Entities')
  console.log('=' .repeat(60))
  console.log(`Organization ID: ${organizationId}`)
  console.log('=' .repeat(60))

  let stats = {
    productsProcessed: 0,
    branchesFound: 0,
    stockLevelsCreated: 0,
    stockLevelsUpdated: 0,
    errors: 0
  }

  try {
    // Step 1: Get all branches
    console.log('\n📍 Step 1: Fetching branches...')
    const { data: branches, error: branchError } = await supabase.rpc('hera_entities_read_v2', {
      p_organization_id: organizationId,
      p_entity_type: 'BRANCH',
      p_include_dynamic: false,
      p_include_relationships: false,
      p_limit: 100
    })

    if (branchError) {
      console.error('❌ Error fetching branches:', branchError)
      throw branchError
    }

    const branchList = branches?.items || []
    stats.branchesFound = branchList.length

    console.log(`✅ Found ${branchList.length} branches`)
    branchList.forEach(branch => {
      console.log(`   - ${branch.entity_name} (${branch.id})`)
    })

    if (branchList.length === 0) {
      console.log('⚠️  No branches found. Creating default branch...')

      const { data: defaultBranch, error: createBranchError } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: MIGRATION_USER_ID,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'BRANCH',
          entity_name: 'Main Branch',
          entity_code: 'MAIN',
          smart_code: 'HERA.SALON.BRANCH.ENTITY.V1'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      })

      if (createBranchError) {
        console.error('❌ Error creating default branch:', createBranchError)
        throw createBranchError
      }

      branchList.push(defaultBranch?.items?.[0] || defaultBranch)
      stats.branchesFound = 1
      console.log('✅ Created default branch')
    }

    // Step 2: Get all products with stock_quantity
    console.log('\n📦 Step 2: Fetching products with inventory...')
    const { data: products, error: productsError } = await supabase.rpc('hera_entities_read_v2', {
      p_organization_id: organizationId,
      p_entity_type: 'product',
      p_include_dynamic: true,
      p_include_relationships: true,
      p_limit: 500
    })

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      throw productsError
    }

    const productList = products?.items || []
    console.log(`✅ Found ${productList.length} products`)

    // Step 3: Migrate each product's stock to STOCK_LEVEL entities
    console.log('\n🔄 Step 3: Creating STOCK_LEVEL entities...')

    for (const product of productList) {
      stats.productsProcessed++

      const productName = product.entity_name || 'Unknown Product'
      const stockQty = product.stock_quantity || 0
      const reorderLevel = product.reorder_level || 10

      console.log(`\n   Processing: ${productName} (Qty: ${stockQty})`)

      // Check if product has branch-specific stock in dynamic data
      const dynamicData = product.dynamic_data || {}
      const hasBranchStock = Object.keys(dynamicData).some(key => key.startsWith('stock_qty_'))

      if (hasBranchStock) {
        // Migrate branch-specific stock
        console.log('      Has branch-specific stock, migrating per branch...')

        for (const branch of branchList) {
          const branchStockKey = `stock_qty_${branch.id}`
          const branchReorderKey = `reorder_level_${branch.id}`
          const branchStockQty = dynamicData[branchStockKey] || 0
          const branchReorderLevel = dynamicData[branchReorderKey] || 10

          if (branchStockQty > 0) {
            await createStockLevel({
              organizationId,
              productId: product.id,
              productName,
              branchId: branch.id,
              branchName: branch.entity_name,
              quantity: branchStockQty,
              reorderLevel: branchReorderLevel,
              stats
            })
          }
        }
      } else if (stockQty > 0) {
        // Product has global stock - create for all branches or first branch
        console.log('      Has global stock, creating for all branches...')

        for (const branch of branchList) {
          await createStockLevel({
            organizationId,
            productId: product.id,
            productName,
            branchId: branch.id,
            branchName: branch.entity_name,
            quantity: stockQty,
            reorderLevel: reorderLevel,
            stats
          })
        }
      } else {
        console.log('      ⏭️  No stock, skipping...')
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration Complete!')
    console.log('='.repeat(60))
    console.log(`Products processed:      ${stats.productsProcessed}`)
    console.log(`Branches found:          ${stats.branchesFound}`)
    console.log(`Stock levels created:    ${stats.stockLevelsCreated}`)
    console.log(`Stock levels updated:    ${stats.stockLevelsUpdated}`)
    console.log(`Errors:                  ${stats.errors}`)
    console.log('='.repeat(60))

    if (stats.errors > 0) {
      console.log('\n⚠️  Migration completed with errors. Please review the logs.')
    } else {
      console.log('\n✅ Migration completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('   1. Test the inventory page at /salon/inventory')
      console.log('   2. Verify stock levels display correctly')
      console.log('   3. Test stock adjustments and movements')
      console.log('   4. Once verified, you can remove Phase 1 dynamic fields')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  }
}

async function createStockLevel({ organizationId, productId, productName, branchId, branchName, quantity, reorderLevel, stats }) {
  try {
    // Check if STOCK_LEVEL already exists
    const { data: existing, error: checkError } = await supabase.rpc('hera_entities_read_v2', {
      p_organization_id: organizationId,
      p_entity_type: 'STOCK_LEVEL',
      p_include_dynamic: true,
      p_include_relationships: true,
      p_limit: 1
    })

    if (checkError) {
      console.error(`         ❌ Error checking existing: ${checkError.message}`)
      stats.errors++
      return
    }

    // Filter by relationships (product and branch)
    const existingStockLevels = existing?.items || []
    const existingStock = existingStockLevels.find(sl => {
      const productRels = sl.relationships?.STOCK_OF_PRODUCT || []
      const locationRels = sl.relationships?.STOCK_AT_LOCATION || []

      const matchesProduct = productRels.some(rel => rel.to_entity_id === productId)
      const matchesLocation = locationRels.some(rel => rel.to_entity_id === branchId)

      return matchesProduct && matchesLocation
    })

    if (existingStock) {
      console.log(`         ⏭️  Stock level already exists for ${branchName}`)
      stats.stockLevelsUpdated++
      return
    }

    // Create STOCK_LEVEL entity
    const entityName = `Stock: ${productName} @ ${branchName}`
    const entityCode = `STK-${productId.substring(0, 8)}-${branchId.substring(0, 8)}`

    console.log(`         Creating stock level for ${branchName}...`)

    const { data: result, error: createError } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: MIGRATION_USER_ID,
      p_organization_id: organizationId,
      p_entity: {
        entity_type: 'STOCK_LEVEL',
        entity_name: entityName,
        entity_code: entityCode,
        smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1'
      },
      p_dynamic: {
        quantity: {
          field_type: 'number',
          field_value_number: quantity,
          smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
        },
        reorder_level: {
          field_type: 'number',
          field_value_number: reorderLevel,
          smart_code: 'HERA.SALON.INV.DYN.REORDER.V1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (createError) {
      console.error(`         ❌ Error creating stock level: ${createError.message}`)
      stats.errors++
      return
    }

    const stockLevelId = result?.items?.[0]?.id || result?.id

    if (!stockLevelId) {
      console.error(`         ❌ No stock level ID returned`)
      stats.errors++
      return
    }

    // Create STOCK_OF_PRODUCT relationship
    const { error: productRelError } = await supabase.rpc('hera_relationships_upsert_v1', {
      p_organization_id: organizationId,
      p_from_entity_id: stockLevelId,
      p_to_entity_id: productId,
      p_relationship_type: 'STOCK_OF_PRODUCT',
      p_smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1',
      p_metadata: {}
    })

    if (productRelError) {
      console.error(`         ⚠️  Error creating product relationship: ${productRelError.message}`)
    }

    // Create STOCK_AT_LOCATION relationship
    const { error: locationRelError } = await supabase.rpc('hera_relationships_upsert_v1', {
      p_organization_id: organizationId,
      p_from_entity_id: stockLevelId,
      p_to_entity_id: branchId,
      p_relationship_type: 'STOCK_AT_LOCATION',
      p_smart_code: 'HERA.SALON.INV.REL.STOCKATLOCATION.V1',
      p_metadata: {}
    })

    if (locationRelError) {
      console.error(`         ⚠️  Error creating location relationship: ${locationRelError.message}`)
    }

    console.log(`         ✅ Created stock level: ${quantity} units`)
    stats.stockLevelsCreated++

  } catch (error) {
    console.error(`         ❌ Error: ${error.message}`)
    stats.errors++
  }
}

// Main execution
const organizationId = process.argv[2]

if (!organizationId) {
  console.error('❌ Usage: node scripts/migrate-to-stock-level-entities.mjs <organization_id>')
  process.exit(1)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

migrateToStockLevelEntities(organizationId)
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
