#!/usr/bin/env node

/**
 * Fix Demo Organization Memberships
 *
 * Manually onboard demo user to the new child organizations
 * since bootstrap didn't create the memberships properly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const DEMO_USER_EMAIL = 'demo@heraerp.com'

console.log('🔧 Fixing Demo Organization Memberships')
console.log('=' .repeat(60))
console.log()

async function fixMemberships() {
  try {
    // Get demo user's auth UID
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const demoAuthUser = users.find(u => u.email === DEMO_USER_EMAIL)

    if (!demoAuthUser) {
      throw new Error(`Demo user not found: ${DEMO_USER_EMAIL}`)
    }

    const DEMO_AUTH_UID = demoAuthUser.id
    console.log(`✅ Found demo user: ${demoAuthUser.email}`)
    console.log(`   Auth UID: ${DEMO_AUTH_UID}`)
    console.log()

    // Get the new child organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .in('organization_code', ['DEMO-ERP', 'DEMO-SALON', 'DEMO-CASHEW'])

    if (orgsError) {
      throw new Error(`Failed to get organizations: ${orgsError.message}`)
    }

    if (!orgs || orgs.length === 0) {
      console.log('ℹ️  No organizations found to fix')
      return
    }

    console.log(`📋 Found ${orgs.length} organizations to fix:\n`)

    for (const org of orgs) {
      console.log(`Processing: ${org.organization_name} (${org.organization_code})`)
      console.log(`   Org ID: ${org.id}`)

      // Check if membership already exists
      const { data: existing } = await supabase
        .from('core_relationships')
        .select('id, relationship_data')
        .eq('from_entity_id', DEMO_AUTH_UID)
        .eq('organization_id', org.id)
        .eq('relationship_type', 'MEMBER_OF')
        .single()

      if (existing) {
        console.log(`   ✅ Membership already exists: ${existing.id}`)
        console.log(`      Role: ${existing.relationship_data?.role || 'unknown'}`)
        console.log()
        continue
      }

      // Onboard user to organization
      console.log(`   📝 Creating membership...`)
      const { data: result, error } = await supabase.rpc('hera_onboard_user_v1', {
        p_supabase_user_id: DEMO_AUTH_UID,
        p_organization_id: org.id,
        p_actor_user_id: DEMO_AUTH_UID,
        p_role: 'owner'
      })

      if (error) {
        console.error(`   ❌ Failed: ${error.message}`)
        console.error(`      Details: ${JSON.stringify(error, null, 2)}`)
      } else {
        console.log(`   ✅ Membership created successfully`)
        console.log(`      Result: ${JSON.stringify(result, null, 2)}`)
      }
      console.log()
    }

    // Verify memberships
    console.log('📋 Verifying all memberships...\n')
    const { data: allMemberships, error: membershipsError } = await supabase
      .from('core_relationships')
      .select(`
        id,
        organization_id,
        relationship_type,
        relationship_data,
        is_active
      `)
      .eq('from_entity_id', DEMO_AUTH_UID)
      .eq('relationship_type', 'MEMBER_OF')
      .in('organization_id', orgs.map(o => o.id))

    if (membershipsError) {
      console.error(`❌ Failed to verify: ${membershipsError.message}`)
    } else {
      console.log(`✅ Found ${allMemberships?.length || 0} memberships:`)
      allMemberships?.forEach(mem => {
        const org = orgs.find(o => o.id === mem.organization_id)
        console.log(`   ├─ ${org?.organization_name}`)
        console.log(`      Role: ${mem.relationship_data?.role || 'unknown'}`)
        console.log(`      Active: ${mem.is_active}`)
      })
    }
    console.log()

    // Test introspection
    console.log('🔍 Testing hera_auth_introspect_v1...\n')
    const { data: introspect, error: introspectError } = await supabase.rpc(
      'hera_auth_introspect_v1',
      { p_actor_user_id: DEMO_AUTH_UID }
    )

    if (introspectError) {
      console.error(`❌ Introspection failed: ${introspectError.message}`)
    } else {
      console.log(`✅ Introspection successful:`)
      console.log(`   Organizations: ${introspect.organization_count}`)
      console.log(`   Default Org ID: ${introspect.default_organization_id}`)
      console.log(`   Default App: ${introspect.default_app || 'none'}`)
      console.log()
      console.log(`   Organizations list:`)
      introspect.organizations?.forEach((org, index) => {
        const appsList = org.apps?.map(a => a.code).join(', ') || 'none'
        console.log(`   ${index + 1}. ${org.name} (${org.code})`)
        console.log(`      Apps: [${appsList}]`)
        console.log(`      Role: ${org.primary_role}`)
      })
    }
    console.log()

    console.log('=' .repeat(60))
    console.log('✅ Membership fix complete!')
    console.log()

  } catch (error) {
    console.error()
    console.error('=' .repeat(60))
    console.error('❌ Fix failed!')
    console.error('=' .repeat(60))
    console.error(error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

fixMemberships()
