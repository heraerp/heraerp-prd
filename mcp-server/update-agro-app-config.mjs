/**
 * Update AGRO App Configuration
 * Updates the AGRO app entity business_rules with modules and features
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const AGRO_APP_ID = 'd7f48d3b-2736-4fec-8d17-2a1c1352ad61'
const ACTOR_USER_ID = 'bc6ab506-a09c-445a-9374-f31a7de6e399' // demo@heraerp.com

// AGRO app configuration
const AGRO_APP_CONFIG = {
  modules: [
    {
      id: 'production',
      name: 'Production Management',
      description: 'Batch tracking and manufacturing operations',
      icon: 'factory',
      color: 'orange',
      workspaces: ['factory_floor', 'planning'],
      features: [
        'batch_tracking',
        'production_scheduling',
        'equipment_management',
        'shift_management',
        'production_reporting'
      ]
    },
    {
      id: 'quality',
      name: 'Quality Control',
      description: 'Testing, inspection, and compliance management',
      icon: 'check-circle',
      color: 'green',
      workspaces: ['lab', 'compliance'],
      features: [
        'quality_testing',
        'inspection_management',
        'compliance_tracking',
        'certification_management',
        'quality_reporting'
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Raw materials and warehouse operations',
      icon: 'package',
      color: 'blue',
      workspaces: ['warehouse', 'raw_materials'],
      features: [
        'raw_material_tracking',
        'finished_goods_inventory',
        'warehouse_management',
        'stock_movements',
        'inventory_reporting'
      ]
    },
    {
      id: 'farmers',
      name: 'Farmer Management',
      description: 'Supplier procurement and farmer payments',
      icon: 'users',
      color: 'emerald',
      workspaces: ['procurement', 'payments'],
      features: [
        'farmer_registration',
        'procurement_management',
        'payment_processing',
        'farmer_analytics',
        'supplier_performance'
      ]
    }
  ],
  entity_types: [
    'raw_material',
    'processed_product',
    'production_batch',
    'farmer',
    'quality_test',
    'equipment'
  ],
  transaction_types: [
    'raw_material_receipt',
    'production_batch',
    'quality_test',
    'farmer_payment'
  ],
  settings: {
    theme: 'green',
    defaultWorkspace: 'factory_floor',
    enabledFeatures: [
      'batch_tracking',
      'quality_testing',
      'farmer_payments',
      'inventory_management'
    ]
  }
}

async function updateAgroAppConfig() {
  console.log('🌾 Updating AGRO App Configuration...')
  console.log('📦 App ID:', AGRO_APP_ID)

  try {
    // Update AGRO app entity with new business_rules
    const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'UPDATE',
      p_actor_user_id: ACTOR_USER_ID,
      p_organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
      p_entity: {
        entity_id: AGRO_APP_ID,
        business_rules: AGRO_APP_CONFIG
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })

    if (error) {
      console.error('❌ Error updating AGRO app:', error)
      throw error
    }

    console.log('✅ AGRO App Configuration Updated Successfully!')
    console.log('📋 Modules Added:', AGRO_APP_CONFIG.modules.length)
    console.log('   - Production Management')
    console.log('   - Quality Control')
    console.log('   - Inventory Management')
    console.log('   - Farmer Management')
    console.log('🔧 Entity Types:', AGRO_APP_CONFIG.entity_types.join(', '))
    console.log('💼 Transaction Types:', AGRO_APP_CONFIG.transaction_types.join(', '))

    return data
  } catch (error) {
    console.error('❌ Failed to update AGRO app configuration:', error.message)
    throw error
  }
}

// Run the update
updateAgroAppConfig()
  .then(() => {
    console.log('🎉 AGRO App Configuration Update Complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Update Failed:', error)
    process.exit(1)
  })
