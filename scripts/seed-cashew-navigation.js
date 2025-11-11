#!/usr/bin/env node

/**
 * Seed Cashew Manufacturing Navigation Script
 * Creates canonical page definitions for the complete cashew manufacturing module
 * Smart Code: HERA.CASHEW.SEEDING.NAVIGATION.v1
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const HERA_PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001'

console.log('🥜 HERA Cashew Manufacturing Navigation Seeding')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Cashew Manufacturing Canonical Operations
 * Complete set of pages for end-to-end cashew processing
 */
const CASHEW_CANONICAL_OPERATIONS = [
  // ==============================================
  // MASTER DATA ENTITY OPERATIONS
  // ==============================================
  
  // Materials Management
  {
    entity_code: 'CASHEW_MATERIALS_LIST',
    entity_name: 'Cashew Materials - List',
    smart_code: 'HERA.CASHEW.MATERIALS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/materials/list',
      component_id: 'EntityList:MATERIAL',
      params: { 
        industry: 'CASHEW', 
        module: 'MATERIALS', 
        entity_type: 'MATERIAL',
        area: 'MATERIALS_MGMT'
      }
    }
  },
  {
    entity_code: 'CASHEW_MATERIALS_CREATE',
    entity_name: 'Cashew Materials - Create',
    smart_code: 'HERA.CASHEW.MATERIALS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/materials/create',
      component_id: 'EntityWizard:MATERIAL',
      params: { 
        industry: 'CASHEW', 
        module: 'MATERIALS', 
        entity_type: 'MATERIAL',
        area: 'MATERIALS_MGMT'
      }
    }
  },

  // Products Management (Finished Goods - Grades)
  {
    entity_code: 'CASHEW_PRODUCTS_LIST',
    entity_name: 'Cashew Products - List',
    smart_code: 'HERA.CASHEW.PRODUCTS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/products/list',
      component_id: 'EntityList:PRODUCT',
      params: { 
        industry: 'CASHEW', 
        module: 'PRODUCTS', 
        entity_type: 'PRODUCT',
        area: 'PRODUCTS_MGMT'
      }
    }
  },
  {
    entity_code: 'CASHEW_PRODUCTS_CREATE',
    entity_name: 'Cashew Products - Create',
    smart_code: 'HERA.CASHEW.PRODUCTS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/products/create',
      component_id: 'EntityWizard:PRODUCT',
      params: { 
        industry: 'CASHEW', 
        module: 'PRODUCTS', 
        entity_type: 'PRODUCT',
        area: 'PRODUCTS_MGMT'
      }
    }
  },

  // Production Batches
  {
    entity_code: 'CASHEW_BATCHES_LIST',
    entity_name: 'Cashew Batches - List',
    smart_code: 'HERA.CASHEW.BATCHES.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/batches/list',
      component_id: 'EntityList:BATCH',
      params: { 
        industry: 'CASHEW', 
        module: 'PRODUCTION', 
        entity_type: 'BATCH',
        area: 'BATCH_MGMT'
      }
    }
  },
  {
    entity_code: 'CASHEW_BATCHES_CREATE',
    entity_name: 'Cashew Batches - Create',
    smart_code: 'HERA.CASHEW.BATCHES.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/batches/create',
      component_id: 'EntityWizard:BATCH',
      params: { 
        industry: 'CASHEW', 
        module: 'PRODUCTION', 
        entity_type: 'BATCH',
        area: 'BATCH_MGMT'
      }
    }
  },

  // Work Centers
  {
    entity_code: 'CASHEW_WORK_CENTERS_LIST',
    entity_name: 'Cashew Work Centers - List',
    smart_code: 'HERA.CASHEW.WORK_CENTERS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/work-centers/list',
      component_id: 'EntityList:WORK_CENTER',
      params: { 
        industry: 'CASHEW', 
        module: 'SETUP', 
        entity_type: 'WORK_CENTER',
        area: 'WORK_CENTERS'
      }
    }
  },
  {
    entity_code: 'CASHEW_WORK_CENTERS_CREATE',
    entity_name: 'Cashew Work Centers - Create',
    smart_code: 'HERA.CASHEW.WORK_CENTERS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/work-centers/create',
      component_id: 'EntityWizard:WORK_CENTER',
      params: { 
        industry: 'CASHEW', 
        module: 'SETUP', 
        entity_type: 'WORK_CENTER',
        area: 'WORK_CENTERS'
      }
    }
  },

  // Locations
  {
    entity_code: 'CASHEW_LOCATIONS_LIST',
    entity_name: 'Cashew Locations - List',
    smart_code: 'HERA.CASHEW.LOCATIONS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/locations/list',
      component_id: 'EntityList:LOCATION',
      params: { 
        industry: 'CASHEW', 
        module: 'SETUP', 
        entity_type: 'LOCATION',
        area: 'LOCATIONS'
      }
    }
  },
  {
    entity_code: 'CASHEW_LOCATIONS_CREATE',
    entity_name: 'Cashew Locations - Create',
    smart_code: 'HERA.CASHEW.LOCATIONS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/locations/create',
      component_id: 'EntityWizard:LOCATION',
      params: { 
        industry: 'CASHEW', 
        module: 'SETUP', 
        entity_type: 'LOCATION',
        area: 'LOCATIONS'
      }
    }
  },

  // BOMs (Bill of Materials)
  {
    entity_code: 'CASHEW_BOMS_LIST',
    entity_name: 'Cashew BOMs - List',
    smart_code: 'HERA.CASHEW.BOMS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/boms/list',
      component_id: 'EntityList:BOM',
      params: { 
        industry: 'CASHEW', 
        module: 'ENGINEERING', 
        entity_type: 'BOM',
        area: 'BOM_MGMT'
      }
    }
  },
  {
    entity_code: 'CASHEW_BOMS_CREATE',
    entity_name: 'Cashew BOMs - Create',
    smart_code: 'HERA.CASHEW.BOMS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/boms/create',
      component_id: 'EntityWizard:BOM',
      params: { 
        industry: 'CASHEW', 
        module: 'ENGINEERING', 
        entity_type: 'BOM',
        area: 'BOM_MGMT'
      }
    }
  },

  // Cost Centers
  {
    entity_code: 'CASHEW_COST_CENTERS_LIST',
    entity_name: 'Cashew Cost Centers - List',
    smart_code: 'HERA.CASHEW.COST_CENTERS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/cost-centers/list',
      component_id: 'EntityList:COST_CENTER',
      params: { 
        industry: 'CASHEW', 
        module: 'FINANCE', 
        entity_type: 'COST_CENTER',
        area: 'COST_CENTERS'
      }
    }
  },
  {
    entity_code: 'CASHEW_COST_CENTERS_CREATE',
    entity_name: 'Cashew Cost Centers - Create',
    smart_code: 'HERA.CASHEW.COST_CENTERS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/cost-centers/create',
      component_id: 'EntityWizard:COST_CENTER',
      params: { 
        industry: 'CASHEW', 
        module: 'FINANCE', 
        entity_type: 'COST_CENTER',
        area: 'COST_CENTERS'
      }
    }
  },

  // ==============================================
  // MANUFACTURING TRANSACTION OPERATIONS
  // ==============================================

  // Material Issue to WIP
  {
    entity_code: 'CASHEW_MFG_ISSUE_CREATE',
    entity_name: 'Cashew Manufacturing - Issue to WIP',
    smart_code: 'HERA.CASHEW.MFG.ISSUE.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/manufacturing/issue/create',
      component_id: 'TransactionWizard:MFG_ISSUE',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_ISSUE',
        area: 'MATERIAL_ISSUE'
      }
    }
  },
  {
    entity_code: 'CASHEW_MFG_ISSUE_LIST',
    entity_name: 'Cashew Manufacturing - Issue List',
    smart_code: 'HERA.CASHEW.MFG.ISSUE.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/manufacturing/issue/list',
      component_id: 'TransactionList:MFG_ISSUE',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_ISSUE',
        area: 'MATERIAL_ISSUE'
      }
    }
  },

  // Labor Booking
  {
    entity_code: 'CASHEW_MFG_LABOR_CREATE',
    entity_name: 'Cashew Manufacturing - Labor Booking',
    smart_code: 'HERA.CASHEW.MFG.LABOR.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/manufacturing/labor/create',
      component_id: 'TransactionWizard:MFG_LABOR',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_LABOR',
        area: 'LABOR_BOOKING'
      }
    }
  },
  {
    entity_code: 'CASHEW_MFG_LABOR_LIST',
    entity_name: 'Cashew Manufacturing - Labor List',
    smart_code: 'HERA.CASHEW.MFG.LABOR.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/manufacturing/labor/list',
      component_id: 'TransactionList:MFG_LABOR',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_LABOR',
        area: 'LABOR_BOOKING'
      }
    }
  },

  // Overhead Absorption
  {
    entity_code: 'CASHEW_MFG_OVERHEAD_CREATE',
    entity_name: 'Cashew Manufacturing - Overhead Absorption',
    smart_code: 'HERA.CASHEW.MFG.OVERHEAD.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/manufacturing/overhead/create',
      component_id: 'TransactionWizard:MFG_OVERHEAD',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_OVERHEAD',
        area: 'OVERHEAD'
      }
    }
  },
  {
    entity_code: 'CASHEW_MFG_OVERHEAD_LIST',
    entity_name: 'Cashew Manufacturing - Overhead List',
    smart_code: 'HERA.CASHEW.MFG.OVERHEAD.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/manufacturing/overhead/list',
      component_id: 'TransactionList:MFG_OVERHEAD',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_OVERHEAD',
        area: 'OVERHEAD'
      }
    }
  },

  // Finished Goods Receipt
  {
    entity_code: 'CASHEW_MFG_RECEIPT_CREATE',
    entity_name: 'Cashew Manufacturing - Finished Goods Receipt',
    smart_code: 'HERA.CASHEW.MFG.RECEIPT.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/manufacturing/receipt/create',
      component_id: 'TransactionWizard:MFG_RECEIPT',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_RECEIPT',
        area: 'FG_RECEIPT'
      }
    }
  },
  {
    entity_code: 'CASHEW_MFG_RECEIPT_LIST',
    entity_name: 'Cashew Manufacturing - Receipt List',
    smart_code: 'HERA.CASHEW.MFG.RECEIPT.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/manufacturing/receipt/list',
      component_id: 'TransactionList:MFG_RECEIPT',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_RECEIPT',
        area: 'FG_RECEIPT'
      }
    }
  },

  // Batch Cost Roll-Up
  {
    entity_code: 'CASHEW_MFG_BATCHCOST_CREATE',
    entity_name: 'Cashew Manufacturing - Batch Cost Roll-Up',
    smart_code: 'HERA.CASHEW.MFG.BATCHCOST.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/manufacturing/costing/create',
      component_id: 'TransactionWizard:MFG_BATCHCOST',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_BATCHCOST',
        area: 'BATCH_COSTING'
      }
    }
  },
  {
    entity_code: 'CASHEW_MFG_BATCHCOST_LIST',
    entity_name: 'Cashew Manufacturing - Batch Cost List',
    smart_code: 'HERA.CASHEW.MFG.BATCHCOST.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/manufacturing/costing/list',
      component_id: 'TransactionList:MFG_BATCHCOST',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_BATCHCOST',
        area: 'BATCH_COSTING'
      }
    }
  },

  // Quality Control
  {
    entity_code: 'CASHEW_MFG_QC_CREATE',
    entity_name: 'Cashew Manufacturing - Quality Inspection',
    smart_code: 'HERA.CASHEW.MFG.QC.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/cashew/manufacturing/qc/create',
      component_id: 'TransactionWizard:MFG_QC',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_QC',
        area: 'QUALITY_CONTROL'
      }
    }
  },
  {
    entity_code: 'CASHEW_MFG_QC_LIST',
    entity_name: 'Cashew Manufacturing - QC List',
    smart_code: 'HERA.CASHEW.MFG.QC.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/cashew/manufacturing/qc/list',
      component_id: 'TransactionList:MFG_QC',
      params: { 
        industry: 'CASHEW', 
        module: 'MANUFACTURING', 
        transaction_type: 'MFG_QC',
        area: 'QUALITY_CONTROL'
      }
    }
  }
]

/**
 * Create canonical operation entity
 */
async function createCanonicalOperation(operation) {
  console.log(`📄 Creating canonical operation: ${operation.entity_name}`)
  
  const entityData = {
    id: uuidv4(),
    organization_id: PLATFORM_ORGANIZATION_ID,
    entity_type: 'navigation_canonical',
    entity_name: operation.entity_name,
    entity_code: operation.entity_code,
    smart_code: operation.smart_code,
    metadata: operation.metadata,
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('core_entities')
    .insert(entityData)
    .select()

  if (error) {
    console.log(`❌ Error creating canonical operation ${operation.entity_code}:`, error)
    return null
  }

  console.log(`✅ Created: ${operation.entity_code} (ID: ${data[0].id})`)
  return data[0]
}

/**
 * Main seeding function
 */
async function seedCashewNavigation() {
  console.log('\n🌱 Seeding cashew canonical operations...')
  
  let successCount = 0
  const totalCount = CASHEW_CANONICAL_OPERATIONS.length

  for (const operation of CASHEW_CANONICAL_OPERATIONS) {
    const result = await createCanonicalOperation(operation)
    if (result) {
      successCount++
    }
  }

  console.log('\n🎉 CASHEW NAVIGATION OPERATIONS SEEDED!')
  console.log(`✅ Successfully created: ${successCount}/${totalCount} operations`)
  
  if (successCount > 0) {
    console.log('\n🔍 Verification query:')
    console.log(`
SELECT entity_code, entity_name, metadata->>'canonical_path' as path, metadata->>'component_id' as component
FROM core_entities 
WHERE entity_type = 'navigation_canonical'
  AND entity_code LIKE 'CASHEW_%'
  AND organization_id = '${PLATFORM_ORGANIZATION_ID}'
ORDER BY entity_code;`)
  }
}

// Run the seeding
seedCashewNavigation().catch(console.error)