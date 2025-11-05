/**
 * Test: Register Retail App and Link to Org
 * Uses: hera_apps_register_v1 and hera_org_link_app_v1
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const RETAIL_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c'
const ACTOR_USER_ID = 'b9789231-866a-4bca-921f-9148deb36eac' // retail@heraerp.com

async function registerAndLinkRetailApp() {
  console.log('🏪 Registering and Linking Retail App...\n')
  console.log('App Code:     RETAIL')
  console.log('Org:          HERA Retail Demo')
  console.log('Actor:        retail@heraerp.com')
  console.log('='.repeat(80) + '\n')

  // Step 1: Register Retail App
  console.log('📝 Step 1: Registering RETAIL app with hera_apps_register_v1...')
  
  const appPayload = {
    code: 'RETAIL',
    name: 'HERA Retail',
    smart_code: 'HERA.PLATFORM.APP.ENTITY.RETAIL.v1',
    status: 'active',
    business_rules: {
      features: {
        pos: true,
        inventory: true,
        customers: true,
        reporting: true,
        multi_location: true
      },
      modules: [
        'pos',
        'inventory',
        'customers',
        'products',
        'reports',
        'settings'
      ],
      default_permissions: ['pos.read', 'pos.write', 'inventory.read', 'inventory.write']
    },
    metadata: {
      description: 'Point of Sale and inventory management for retail businesses',
      version: '1.0.0',
      category: 'business',
      icon: 'shopping-cart',
      theme: {
        primary_color: '#2563eb',
        secondary_color: '#1e40af',
        accent_color: '#3b82f6'
      }
    }
  }

  console.log('App Payload:')
  console.log(JSON.stringify(appPayload, null, 2))
  console.log('')

  const { data: appResult, error: appError } = await supabase.rpc('hera_apps_register_v1', {
    p_actor_user_id: ACTOR_USER_ID,
    p_payload: appPayload
  })

  if (appError) {
    console.error('❌ App Registration Error:', appError)
    console.error('   Message:', appError.message)
    console.error('   Hint:', appError.hint)
    console.error('   Details:', appError.details)
    return
  }

  console.log('✅ App registered successfully!')
  console.log('📊 Result:')
  console.log(JSON.stringify(appResult, null, 2))
  console.log('')

  const appId = appResult.app_id || appResult.id

  // Step 2: Link App to Organization
  console.log('📝 Step 2: Linking RETAIL app to HERA Retail Demo org with hera_org_link_app_v1...')

  const linkConfig = {
    default_view: 'dashboard',
    pos_settings: {
      tax_rate: 0.05,
      currency: 'USD',
      receipt_template: 'standard'
    },
    inventory_settings: {
      low_stock_threshold: 10,
      auto_reorder: false
    }
  }

  const linkSubscription = {
    plan: 'demo',
    expires_at: '2026-12-31T23:59:59Z'
  }

  console.log('Link Parameters:')
  console.log('  Organization ID:', RETAIL_ORG_ID)
  console.log('  App Code: RETAIL')
  console.log('  Config:', JSON.stringify(linkConfig, null, 2))
  console.log('')

  const { data: linkResult, error: linkError } = await supabase.rpc('hera_org_link_app_v1', {
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: RETAIL_ORG_ID,
    p_app_code: 'RETAIL',
    p_installed_at: new Date().toISOString(),
    p_subscription: linkSubscription,
    p_config: linkConfig,
    p_is_active: true
  })

  if (linkError) {
    console.error('❌ App Link Error:', linkError)
    console.error('   Message:', linkError.message)
    console.error('   Hint:', linkError.hint)
    console.error('   Details:', linkError.details)
    return
  }

  console.log('✅ App linked to organization successfully!')
  console.log('📊 Result:')
  console.log(JSON.stringify(linkResult, null, 2))
  console.log('')

  // Step 3: Verify app registration and link
  console.log('📝 Step 3: Verifying app registration and link...')
  console.log('='.repeat(80))

  // Check core_entities table for APP entity
  const { data: appRecord } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .eq('entity_type', 'APP')
    .eq('entity_code', 'RETAIL')
    .single()

  if (appRecord) {
    console.log('\n✅ App Entity in core_entities (PLATFORM org):')
    console.log('   ID:          ', appRecord.id)
    console.log('   Code:        ', appRecord.entity_code)
    console.log('   Name:        ', appRecord.entity_name)
    console.log('   Smart Code:  ', appRecord.smart_code)
    console.log('   Status:      ', appRecord.status)
  } else {
    console.log('\n❌ App not found in core_entities table')
  }

  // Check core_relationships table for ORG_HAS_APP
  const { data: orgAppRecord } = await supabase
    .from('core_relationships')
    .select('*, from_entity:core_entities!from_entity_id(id, entity_name), to_entity:core_entities!to_entity_id(id, entity_code)')
    .eq('organization_id', RETAIL_ORG_ID)
    .eq('relationship_type', 'ORG_HAS_APP')
    .limit(1)

  if (orgAppRecord && orgAppRecord.length > 0) {
    const rel = orgAppRecord[0]
    console.log('\n✅ Org-App Relationship (ORG_HAS_APP):')
    console.log('   ID:              ', rel.id)
    console.log('   Organization ID: ', rel.organization_id)
    console.log('   App Code:        ', rel.to_entity?.entity_code)
    console.log('   Is Active:       ', rel.is_active ? 'YES' : 'NO')
    console.log('   Installed At:    ', rel.effective_date)
    console.log('   Config:          ', JSON.stringify(rel.relationship_data, null, 2))
  } else {
    console.log('\n❌ Org-App link not found in core_relationships table')
  }

  // Final Summary
  console.log('\n' + '='.repeat(80))
  console.log('🎯 FINAL SUMMARY:')
  console.log('='.repeat(80))
  console.log('App Registered:            ' + (appRecord ? '✅ YES' : '❌ NO'))
  console.log('App Linked to Org:         ' + (orgAppRecord && orgAppRecord.length > 0 ? '✅ YES' : '❌ NO'))
  console.log('App Enabled:               ' + (orgAppRecord && orgAppRecord.length > 0 && orgAppRecord[0].is_active ? '✅ YES' : '❌ NO'))
  console.log('='.repeat(80))
  console.log('\n💡 The RETAIL app is now available for HERA Retail Demo organization!')
  console.log('   Users can access it at: /retail/*\n')
}

registerAndLinkRetailApp()
