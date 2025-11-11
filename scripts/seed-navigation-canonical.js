#!/usr/bin/env node

/**
 * Seed Navigation Canonical Operations Script
 * Creates canonical page definitions with component metadata
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const HERA_PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001'

console.log('🌱 HERA Navigation Canonical Operations Seeding')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Canonical page definitions
 */
const CANONICAL_OPERATIONS = [
  // Finance Module
  {
    entity_code: 'FIN_GL_CREATE',
    entity_name: 'General Ledger - Create Journal',
    smart_code: 'HERA.FIN.GL.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/enterprise/finance/gl/create',
      component_id: 'TransactionWizard:GL_JOURNAL',
      params: { transaction_type: 'GL_JOURNAL', module: 'FIN', area: 'GL' }
    }
  },
  {
    entity_code: 'FIN_GL_LIST',
    entity_name: 'General Ledger - List Journals',
    smart_code: 'HERA.FIN.GL.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/enterprise/finance/gl/list',
      component_id: 'TransactionList:GL_JOURNAL',
      params: { transaction_type: 'GL_JOURNAL', module: 'FIN', area: 'GL' }
    }
  },
  
  // Procurement Module
  {
    entity_code: 'PROC_PO_CREATE',
    entity_name: 'Purchase Orders - Create PO',
    smart_code: 'HERA.PROC.PO.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/enterprise/procurement/po/create',
      component_id: 'TransactionWizard:PURCHASE_ORDER',
      params: { transaction_type: 'PURCHASE_ORDER', module: 'PROC', area: 'PO' }
    }
  },
  {
    entity_code: 'PROC_PO_LIST',
    entity_name: 'Purchase Orders - List POs',
    smart_code: 'HERA.PROC.PO.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/enterprise/procurement/po/list',
      component_id: 'TransactionList:PURCHASE_ORDER',
      params: { transaction_type: 'PURCHASE_ORDER', module: 'PROC', area: 'PO' }
    }
  },
  {
    entity_code: 'PROC_VENDORS_CREATE',
    entity_name: 'Vendors - Create Vendor',
    smart_code: 'HERA.PROC.VENDORS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/enterprise/procurement/vendors/create',
      component_id: 'EntityWizard:VENDOR',
      params: { entity_type: 'VENDOR', module: 'PROC', area: 'VENDORS' }
    }
  },
  {
    entity_code: 'PROC_VENDORS_LIST',
    entity_name: 'Vendors - List Vendors',
    smart_code: 'HERA.PROC.VENDORS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/enterprise/procurement/vendors/list',
      component_id: 'EntityList:VENDOR',
      params: { entity_type: 'VENDOR', module: 'PROC', area: 'VENDORS' }
    }
  },
  
  // Sales Module
  {
    entity_code: 'SALES_SO_CREATE',
    entity_name: 'Sales Orders - Create SO',
    smart_code: 'HERA.SALES.SO.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/enterprise/sales/orders/create',
      component_id: 'TransactionWizard:SALES_ORDER',
      params: { transaction_type: 'SALES_ORDER', module: 'SALES', area: 'SO' }
    }
  },
  {
    entity_code: 'SALES_SO_LIST',
    entity_name: 'Sales Orders - List SOs',
    smart_code: 'HERA.SALES.SO.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/enterprise/sales/orders/list',
      component_id: 'TransactionList:SALES_ORDER',
      params: { transaction_type: 'SALES_ORDER', module: 'SALES', area: 'SO' }
    }
  },
  
  // Industry: Jewelry
  {
    entity_code: 'JEWELRY_APPRAISALS_CREATE',
    entity_name: 'Jewelry Appraisals - Create',
    smart_code: 'HERA.JEWELRY.APPRAISALS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/jewelry/appraisals/create',
      component_id: 'EntityWizard:JEWELRY_APPRAISAL',
      params: { entity_type: 'JEWELRY_APPRAISAL', industry: 'JEWELRY' }
    }
  },
  {
    entity_code: 'JEWELRY_APPRAISALS_LIST',
    entity_name: 'Jewelry Appraisals - List',
    smart_code: 'HERA.JEWELRY.APPRAISALS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/jewelry/appraisals/list',
      component_id: 'EntityList:JEWELRY_APPRAISAL',
      params: { entity_type: 'JEWELRY_APPRAISAL', industry: 'JEWELRY' }
    }
  },
  {
    entity_code: 'JEWELRY_CUSTOMERS_CREATE',
    entity_name: 'Jewelry Customers - Create',
    smart_code: 'HERA.JEWELRY.CUSTOMERS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/jewelry/customers/create',
      component_id: 'EntityWizard:CUSTOMER',
      params: { entity_type: 'CUSTOMER', industry: 'JEWELRY' }
    }
  },
  {
    entity_code: 'JEWELRY_CUSTOMERS_LIST',
    entity_name: 'Jewelry Customers - List',
    smart_code: 'HERA.JEWELRY.CUSTOMERS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/jewelry/customers/list',
      component_id: 'EntityList:CUSTOMER',
      params: { entity_type: 'CUSTOMER', industry: 'JEWELRY' }
    }
  },
  
  // Industry: Waste Management  
  {
    entity_code: 'WM_CUSTOMERS_CREATE',
    entity_name: 'Waste Management Customers - Create',
    smart_code: 'HERA.WASTE_MGMT.CUSTOMERS.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/waste-management/customers/create',
      component_id: 'EntityWizard:CUSTOMER',
      params: { entity_type: 'CUSTOMER', industry: 'WASTE_MGMT' }
    }
  },
  {
    entity_code: 'WM_CUSTOMERS_LIST',
    entity_name: 'Waste Management Customers - List',
    smart_code: 'HERA.WASTE_MGMT.CUSTOMERS.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/waste-management/customers/list',
      component_id: 'EntityList:CUSTOMER',
      params: { entity_type: 'CUSTOMER', industry: 'WASTE_MGMT' }
    }
  },
  {
    entity_code: 'WM_ROUTES_CREATE',
    entity_name: 'Waste Management Routes - Create',
    smart_code: 'HERA.WASTE_MGMT.ROUTES.PAGE.CREATE.v1',
    metadata: {
      scenario: 'CREATE',
      canonical_path: '/waste-management/routes/create',
      component_id: 'EntityWizard:WM_ROUTE',
      params: { entity_type: 'WM_ROUTE', industry: 'WASTE_MGMT' }
    }
  },
  {
    entity_code: 'WM_ROUTES_LIST',
    entity_name: 'Waste Management Routes - List',
    smart_code: 'HERA.WASTE_MGMT.ROUTES.PAGE.LIST.v1',
    metadata: {
      scenario: 'LIST',
      canonical_path: '/waste-management/routes/list',
      component_id: 'EntityList:WM_ROUTE',
      params: { entity_type: 'WM_ROUTE', industry: 'WASTE_MGMT' }
    }
  }
]

/**
 * Create canonical operation entity
 */
async function createCanonicalOperation(operationDef) {
  console.log(`📄 Creating canonical operation: ${operationDef.entity_name}`)
  
  const entity = {
    id: uuidv4(),
    organization_id: PLATFORM_ORGANIZATION_ID,
    entity_type: 'navigation_canonical',
    entity_name: operationDef.entity_name,
    entity_code: operationDef.entity_code,
    smart_code: operationDef.smart_code,
    metadata: operationDef.metadata,
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('core_entities')
    .insert(entity)
    .select('id')
    .single()
  
  if (error) {
    console.error(`❌ Error creating canonical operation ${operationDef.entity_code}:`, error)
    return null
  }
  
  console.log(`✅ Created: ${operationDef.entity_code} (ID: ${data.id})`)
  return data.id
}

/**
 * Main seeding function
 */
async function seedCanonicalOperations() {
  try {
    console.log('\n🌱 Seeding canonical operations...')
    
    let successCount = 0
    
    for (const operation of CANONICAL_OPERATIONS) {
      const id = await createCanonicalOperation(operation)
      if (id) {
        successCount++
      }
    }
    
    console.log(`\n🎉 CANONICAL OPERATIONS SEEDED!`)
    console.log(`✅ Successfully created: ${successCount}/${CANONICAL_OPERATIONS.length} operations`)
    
    console.log('\n🔍 Verification query:')
    console.log(`
SELECT entity_code, entity_name, metadata->>'canonical_path' as path, metadata->>'component_id' as component
FROM core_entities 
WHERE entity_type = 'navigation_canonical'
  AND organization_id = '${PLATFORM_ORGANIZATION_ID}'
ORDER BY entity_code;
    `)
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  }
}

seedCanonicalOperations()