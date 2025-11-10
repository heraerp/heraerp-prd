#!/usr/bin/env node

/**
 * Cleanup Old Demo Organization
 *
 * Removes the old HERA ERP DEMO (HERA-DEMO) organization
 * to avoid confusion with the new hierarchical structure
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
const OLD_ORG_CODE = 'HERA-DEMO'

console.log('🧹 Cleaning Up Old Demo Organization')
console.log('=' .repeat(60))
console.log()

async function cleanupOldOrg() {
  try {
    // Get demo user's auth UID and entity ID
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const demoAuthUser = users.find(u => u.email === DEMO_USER_EMAIL)

    if (!demoAuthUser) {
      throw new Error(`Demo user not found: ${DEMO_USER_EMAIL}`)
    }

    const DEMO_AUTH_UID = demoAuthUser.id
    console.log(`✅ Found demo user: ${demoAuthUser.email}`)
    console.log(`   Auth UID: ${DEMO_AUTH_UID}`)
    console.log()

    // Get the old organization
    const { data: oldOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .eq('organization_code', OLD_ORG_CODE)
      .single()

    if (orgError || !oldOrg) {
      console.log('ℹ️  Old organization not found or already removed')
      return
    }

    console.log(`📋 Found old organization:`)
    console.log(`   Name: ${oldOrg.organization_name}`)
    console.log(`   Code: ${oldOrg.organization_code}`)
    console.log(`   ID: ${oldOrg.id}`)
    console.log()

    // Check relationships to this org
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, from_entity_id, to_entity_id')
      .eq('organization_id', oldOrg.id)

    if (relError) {
      throw new Error(`Failed to get relationships: ${relError.message}`)
    }

    console.log(`📊 Found ${relationships?.length || 0} relationships in this organization`)
    console.log()

    // Count by type
    const relByType = {}
    relationships?.forEach(rel => {
      relByType[rel.relationship_type] = (relByType[rel.relationship_type] || 0) + 1
    })

    Object.entries(relByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })
    console.log()

    // Confirm deletion
    console.log('⚠️  WARNING: This will:')
    console.log('   1. Remove all relationships in this organization')
    console.log('   2. Remove the organization record')
    console.log('   3. Remove the organization shadow entity')
    console.log()

    // Delete all relationships in this organization
    console.log('🗑️  Deleting relationships...')
    const { error: deleteRelError } = await supabase
      .from('core_relationships')
      .delete()
      .eq('organization_id', oldOrg.id)

    if (deleteRelError) {
      throw new Error(`Failed to delete relationships: ${deleteRelError.message}`)
    }

    console.log(`✅ Deleted ${relationships?.length || 0} relationships`)
    console.log()

    // Delete organization shadow entity
    console.log('🗑️  Deleting organization shadow entity...')
    const { error: deleteEntityError } = await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', oldOrg.id)
      .eq('entity_type', 'ORGANIZATION')

    if (deleteEntityError) {
      console.log(`⚠️  Warning: Could not delete shadow entity: ${deleteEntityError.message}`)
    } else {
      console.log('✅ Deleted organization shadow entity')
    }
    console.log()

    // Delete the organization
    console.log('🗑️  Deleting organization...')
    const { error: deleteOrgError } = await supabase
      .from('core_organizations')
      .delete()
      .eq('id', oldOrg.id)

    if (deleteOrgError) {
      throw new Error(`Failed to delete organization: ${deleteOrgError.message}`)
    }

    console.log('✅ Deleted organization record')
    console.log()

    // Verify cleanup
    console.log('🔍 Verifying cleanup...\n')

    // Check organization is gone
    const { data: verifyOrg } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_code', OLD_ORG_CODE)
      .single()

    if (verifyOrg) {
      console.log('❌ Organization still exists!')
    } else {
      console.log('✅ Organization removed successfully')
    }

    // Check relationships are gone
    const { data: verifyRels } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('organization_id', oldOrg.id)

    console.log(`✅ Relationships remaining: ${verifyRels?.length || 0}`)
    console.log()

    // Test introspection
    console.log('🔍 Testing hera_auth_introspect_v1...\n')

    // Find PLATFORM USER entity ID
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'USER')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .contains('metadata', { supabase_user_id: DEMO_AUTH_UID })
      .single()

    if (!userEntity) {
      throw new Error('Could not find PLATFORM USER entity')
    }

    const { data: introspect, error: introspectError } = await supabase.rpc(
      'hera_auth_introspect_v1',
      { p_actor_user_id: userEntity.id }
    )

    if (introspectError) {
      console.error(`❌ Introspection failed: ${introspectError.message}`)
    } else {
      console.log(`✅ Introspection successful:`)
      console.log(`   Organizations: ${introspect.organization_count}`)
      console.log(`   Default Org ID: ${introspect.default_organization_id}`)
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
    console.log('✅ Cleanup complete!')
    console.log()

  } catch (error) {
    console.error()
    console.error('=' .repeat(60))
    console.error('❌ Cleanup failed!')
    console.error('=' .repeat(60))
    console.error(error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

cleanupOldOrg()
