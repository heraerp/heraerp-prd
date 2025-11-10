#!/usr/bin/env node

/**
 * Setup Demo Organization Hierarchy
 *
 * Creates a hierarchical demo organization structure:
 * - HERA ERP Demo (Parent)
 *   - HERA Salon Demo (Child with SALON app)
 *   - HERA Cashew Demo (Child with CASHEW app)
 *
 * Uses HERA RPC functions to ensure correct relationship types:
 * - hera_organizations_crud_v1 for organization creation
 * - Automatic ORG_HAS_APP relationships via apps array
 * - Automatic MEMBER_OF relationships via bootstrap flag
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const DEMO_USER_EMAIL = 'demo@heraerp.com'
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

console.log('🚀 HERA Demo Organization Hierarchy Setup')
console.log('=' .repeat(60))
console.log()

/**
 * Find demo user entity ID by looking up USER entity with supabase_user_id metadata
 */
async function findDemoUserEntityId() {
  console.log('📋 Step 1: Finding demo user entity ID...')

  // First, get the Supabase auth user ID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`)
  }

  const demoAuthUser = users.find(u => u.email === DEMO_USER_EMAIL)
  if (!demoAuthUser) {
    throw new Error(`Demo user ${DEMO_USER_EMAIL} not found in auth.users`)
  }

  console.log(`   ✅ Found auth user: ${demoAuthUser.id} (${DEMO_USER_EMAIL})`)

  // Now find the USER entity with this supabase_user_id in metadata
  const { data: userEntities, error: entityError } = await supabase
    .from('core_entities')
    .select('id, entity_name, metadata')
    .eq('entity_type', 'USER')
    .contains('metadata', { supabase_user_id: demoAuthUser.id })
    .limit(1)

  if (entityError) {
    throw new Error(`Failed to find USER entity: ${entityError.message}`)
  }

  if (!userEntities || userEntities.length === 0) {
    throw new Error(`No USER entity found with supabase_user_id: ${demoAuthUser.id}`)
  }

  const userEntityId = userEntities[0].id
  console.log(`   ✅ Found USER entity: ${userEntityId} (${userEntities[0].entity_name})`)
  console.log()

  return { userEntityId, authUserId: demoAuthUser.id }
}

/**
 * Verify APP entities exist in PLATFORM organization
 */
async function verifyAppEntities() {
  console.log('📋 Step 2: Verifying APP entities...')

  const { data: apps, error } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('organization_id', PLATFORM_ORG_ID)
    .eq('entity_type', 'APP')
    .in('entity_code', ['SALON', 'CASHEW'])

  if (error) {
    throw new Error(`Failed to query APP entities: ${error.message}`)
  }

  const salonApp = apps?.find(app => app.entity_code === 'SALON')
  const cashewApp = apps?.find(app => app.entity_code === 'CASHEW')

  if (!salonApp) {
    console.log('   ⚠️  SALON app entity not found in PLATFORM org')
    console.log('   💡 You may need to create it first')
  } else {
    console.log(`   ✅ SALON app exists: ${salonApp.id} (${salonApp.entity_name})`)
  }

  if (!cashewApp) {
    console.log('   ⚠️  CASHEW app entity not found in PLATFORM org')
    console.log('   💡 You may need to create it first')
  } else {
    console.log(`   ✅ CASHEW app exists: ${cashewApp.id} (${cashewApp.entity_name})`)
  }

  console.log()
  return { salonApp, cashewApp }
}

/**
 * Create parent organization (HERA ERP Demo)
 */
async function createParentOrganization(actorUserId) {
  console.log('📋 Step 3: Creating parent organization (HERA ERP Demo)...')

  // Check if it already exists
  const { data: existing } = await supabase
    .from('core_organizations')
    .select('id, organization_name, organization_code')
    .eq('organization_code', 'DEMO-ERP')
    .single()

  if (existing) {
    console.log(`   ℹ️  Organization already exists: ${existing.id} (${existing.organization_name})`)
    console.log()
    return existing.id
  }

  const payload = {
    organization_name: 'HERA ERP Demo',
    organization_code: 'DEMO-ERP',
    organization_type: 'holding_company',
    industry_classification: 'technology',
    parent_organization_id: null,
    bootstrap: true,
    apps: [],
    settings: {
      demo_mode: true,
      description: 'Parent demo organization for all HERA apps',
      subdomain: 'erp-demo'
    },
    status: 'active'
  }

  const { data: result, error } = await supabase.rpc('hera_organizations_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorUserId,
    p_payload: payload
  })

  if (error) {
    throw new Error(`Failed to create parent organization: ${error.message}`)
  }

  const orgId = result.organization.id
  console.log(`   ✅ Created parent organization: ${orgId}`)
  console.log(`      Name: ${result.organization.organization_name}`)
  console.log(`      Code: ${result.organization.organization_code}`)
  console.log()

  return orgId
}

/**
 * Create child organization with app
 */
async function createChildOrganization(actorUserId, parentOrgId, config) {
  console.log(`📋 Creating ${config.name}...`)

  // Check if it already exists
  const { data: existing } = await supabase
    .from('core_organizations')
    .select('id, organization_name, organization_code')
    .eq('organization_code', config.code)
    .single()

  if (existing) {
    console.log(`   ℹ️  Organization already exists: ${existing.id} (${existing.organization_name})`)
    console.log()
    return existing.id
  }

  // Step 1: Create organization with bootstrap (creates membership first)
  const payload = {
    organization_name: config.name,
    organization_code: config.code,
    organization_type: config.type,
    industry_classification: config.industry,
    parent_organization_id: parentOrgId,
    bootstrap: true,
    apps: [], // Don't install apps yet - do it after membership is created
    settings: {
      demo_mode: true,
      subdomain: config.subdomain,
      business_type: config.type,
      description: config.description
    },
    status: 'active'
  }

  const { data: result, error } = await supabase.rpc('hera_organizations_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorUserId,
    p_payload: payload
  })

  if (error) {
    throw new Error(`Failed to create ${config.name}: ${error.message}`)
  }

  const orgId = result.organization.id
  console.log(`   ✅ Created organization: ${orgId}`)
  console.log(`      Name: ${result.organization.organization_name}`)
  console.log(`      Code: ${result.organization.organization_code}`)
  console.log(`      Parent: ${parentOrgId}`)

  // Step 2: Install apps separately (now that membership exists)
  for (const app of config.apps) {
    console.log(`   📦 Installing ${app.code} app...`)
    const { error: linkError } = await supabase.rpc('hera_org_link_app_v1', {
      p_actor_user_id: actorUserId,
      p_organization_id: orgId,
      p_app_code: app.code,
      p_installed_at: new Date().toISOString(),
      p_subscription: app.subscription || {},
      p_config: app.config || {},
      p_is_active: app.is_active !== false
    })

    if (linkError) {
      console.error(`   ⚠️  Failed to install ${app.code}: ${linkError.message}`)
    } else {
      console.log(`      ✅ Installed ${app.code}`)
    }
  }

  // Step 3: Set default app (now that membership exists and apps are installed)
  if (config.defaultApp) {
    console.log(`   🎯 Setting default app to ${config.defaultApp}...`)
    const { error: defaultError } = await supabase.rpc('hera_org_set_default_app_v1', {
      p_actor_user_id: actorUserId,
      p_organization_id: orgId,
      p_app_code: config.defaultApp
    })

    if (defaultError) {
      console.error(`   ⚠️  Failed to set default app: ${defaultError.message}`)
    } else {
      console.log(`      ✅ Default app set to ${config.defaultApp}`)
    }
  }

  console.log()
  return orgId
}

/**
 * Verify the setup with queries
 */
async function verifySetup(userEntityId) {
  console.log('📋 Verification: Checking organization hierarchy...')
  console.log()

  // Query organization hierarchy
  const { data: orgs, error: orgsError } = await supabase
    .from('core_organizations')
    .select(`
      id,
      organization_name,
      organization_code,
      parent_organization_id,
      settings
    `)
    .in('organization_code', ['DEMO-ERP', 'DEMO-SALON', 'DEMO-CASHEW'])
    .order('organization_code')

  if (orgsError) {
    console.error('   ❌ Failed to query organizations:', orgsError.message)
    return
  }

  console.log('   Organizations:')
  orgs.forEach(org => {
    const parentMark = org.parent_organization_id ? '   └─' : '   ├─'
    console.log(`${parentMark} ${org.organization_name} (${org.organization_code})`)
    console.log(`      ID: ${org.id}`)
    if (org.parent_organization_id) {
      console.log(`      Parent: ${org.parent_organization_id}`)
    }
    if (org.settings?.default_app_code) {
      console.log(`      Default App: ${org.settings.default_app_code}`)
    }
  })
  console.log()

  // Query app relationships
  console.log('   App Relationships:')
  const { data: appRels, error: appRelsError } = await supabase
    .from('core_relationships')
    .select(`
      id,
      relationship_type,
      organization_id,
      to_entity_id,
      is_active,
      relationship_data
    `)
    .eq('relationship_type', 'ORG_HAS_APP')
    .in('organization_id', orgs.map(o => o.id))

  if (!appRelsError && appRels) {
    for (const rel of appRels) {
      // Get app name
      const { data: app } = await supabase
        .from('core_entities')
        .select('entity_code, entity_name')
        .eq('id', rel.to_entity_id)
        .single()

      // Get org name
      const org = orgs.find(o => o.id === rel.organization_id)

      console.log(`   ├─ ${org?.organization_name} → ${app?.entity_code} (${app?.entity_name})`)
      console.log(`      Active: ${rel.is_active}`)
      console.log(`      Installed: ${rel.relationship_data?.installed_at || 'N/A'}`)
    }
  }
  console.log()

  // Query user memberships
  console.log('   User Memberships:')
  const { data: memberships, error: membershipsError } = await supabase
    .from('core_relationships')
    .select(`
      id,
      relationship_type,
      organization_id,
      relationship_data
    `)
    .eq('from_entity_id', userEntityId)
    .eq('relationship_type', 'MEMBER_OF')
    .in('organization_id', orgs.map(o => o.id))

  if (!membershipsError && memberships) {
    memberships.forEach(mem => {
      const org = orgs.find(o => o.id === mem.organization_id)
      const role = mem.relationship_data?.role || 'unknown'
      console.log(`   ├─ ${org?.organization_name}: ${role.toUpperCase()}`)
    })
  }
  console.log()

  // Test introspection
  console.log('   Testing hera_auth_introspect_v1...')
  const { data: introspect, error: introspectError } = await supabase.rpc(
    'hera_auth_introspect_v1',
    { p_actor_user_id: userEntityId }
  )

  if (introspectError) {
    console.error('   ❌ Introspection failed:', introspectError.message)
  } else {
    console.log(`   ✅ Introspection successful:`)
    console.log(`      Organizations: ${introspect.organization_count}`)
    console.log(`      Default Org: ${introspect.default_organization_id}`)
    console.log(`      Default App: ${introspect.default_app || 'none'}`)

    if (introspect.organizations && introspect.organizations.length > 0) {
      introspect.organizations.forEach(org => {
        const appsList = org.apps?.map(a => a.code).join(', ') || 'none'
        console.log(`      └─ ${org.name}: [${appsList}]`)
      })
    }
  }
  console.log()
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Find demo user
    const { userEntityId } = await findDemoUserEntityId()

    // Step 2: Verify APP entities
    await verifyAppEntities()

    // Step 3: Create parent organization
    const parentOrgId = await createParentOrganization(userEntityId)

    // Step 4: Create HERA Salon Demo
    const salonConfig = {
      name: 'HERA Salon Demo',
      code: 'DEMO-SALON',
      type: 'salon',
      industry: 'beauty',
      subdomain: 'salon-demo',
      description: 'Demo organization for HERA Salon Management',
      apps: [
        {
          code: 'SALON',
          is_active: true,
          subscription: {
            plan: 'demo',
            expires_at: '2099-12-31T23:59:59Z'
          },
          config: {
            enable_appointments: true,
            enable_pos: true,
            enable_inventory: true
          }
        }
      ],
      defaultApp: 'SALON'
    }
    await createChildOrganization(userEntityId, parentOrgId, salonConfig)

    // Step 5: Create HERA Cashew Demo
    const cashewConfig = {
      name: 'HERA Cashew Demo',
      code: 'DEMO-CASHEW',
      type: 'finance',
      industry: 'financial_services',
      subdomain: 'cashew-demo',
      description: 'Demo organization for HERA Cashew Finance',
      apps: [
        {
          code: 'CASHEW',
          is_active: true,
          subscription: {
            plan: 'demo',
            expires_at: '2099-12-31T23:59:59Z'
          },
          config: {
            enable_accounting: true,
            enable_payroll: true,
            multi_currency: true
          }
        }
      ],
      defaultApp: 'CASHEW'
    }
    await createChildOrganization(userEntityId, parentOrgId, cashewConfig)

    // Step 6: Verify setup
    await verifySetup(userEntityId)

    console.log('=' .repeat(60))
    console.log('✅ Demo organization hierarchy setup complete!')
    console.log()
    console.log('📊 Summary:')
    console.log('   ✅ HERA ERP Demo (parent)')
    console.log('      └─ HERA Salon Demo (child with SALON app)')
    console.log('      └─ HERA Cashew Demo (child with CASHEW app)')
    console.log()
    console.log('🔑 Demo Credentials:')
    console.log(`   Email: ${DEMO_USER_EMAIL}`)
    console.log('   Password: demo2025!')
    console.log()
    console.log('🚀 The demo user now has OWNER access to all three organizations.')
    console.log('   Login at: /auth/login')
    console.log()

  } catch (error) {
    console.error()
    console.error('=' .repeat(60))
    console.error('❌ Setup failed!')
    console.error('=' .repeat(60))
    console.error(error.message)
    console.error()
    if (error.stack) {
      console.error('Stack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()
