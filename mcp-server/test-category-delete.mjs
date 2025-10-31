#!/usr/bin/env node
/**
 * Test product category deletion behavior
 * Verify that categories are properly filtered after deletion
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCategoryDeletion() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST: Product Category Deletion & Filtering')
  console.log('='.repeat(80))

  // Step 1: Fetch all categories with status='active' filter
  console.log('\n📋 Step 1: Fetching active categories...')
  const readActiveResult = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'product_category',
      status: 'active'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      limit: 100
    }
  })

  if (readActiveResult.error) {
    console.log('❌ Read Error:', readActiveResult.error.message)
    return
  }

  console.log('📦 Raw response:', JSON.stringify(readActiveResult.data, null, 2).substring(0, 500))

  let activeCategories = []
  if (Array.isArray(readActiveResult.data?.data)) {
    activeCategories = readActiveResult.data.data
  } else if (Array.isArray(readActiveResult.data?.items)) {
    activeCategories = readActiveResult.data.items
  } else if (Array.isArray(readActiveResult.data)) {
    activeCategories = readActiveResult.data
  }

  console.log(`✅ Found ${activeCategories.length} active categories`)

  if (activeCategories.length > 0) {
    console.log('📦 Active Categories:')
    activeCategories.forEach((cat, i) => {
      const entity = cat.entity || cat
      console.log(`  ${i + 1}. ${entity.entity_name} (${entity.id}) - status: ${entity.status}`)
    })
  }

  // Step 2: Check for ANY categories (no status filter)
  console.log('\n📋 Step 2: Fetching ALL categories (no status filter)...')
  const readAllResult = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'product_category'
      // NO status filter
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      limit: 100
    }
  })

  if (readAllResult.error) {
    console.log('❌ Read All Error:', readAllResult.error.message)
    return
  }

  const allCategories = readAllResult.data?.data || readAllResult.data?.items || []
  console.log(`✅ Found ${allCategories.length} total categories`)

  if (allCategories.length > 0) {
    console.log('📦 All Categories:')
    allCategories.forEach((cat, i) => {
      const entity = cat.entity || cat
      console.log(`  ${i + 1}. ${entity.entity_name} (${entity.id}) - status: ${entity.status}`)
    })
  }

  // Step 3: Analysis
  console.log('\n' + '='.repeat(80))
  console.log('📊 ANALYSIS')
  console.log('='.repeat(80))

  const archivedCount = allCategories.length - activeCategories.length

  console.log(`Active categories: ${activeCategories.length}`)
  console.log(`Total categories: ${allCategories.length}`)
  console.log(`Archived/Deleted categories: ${archivedCount}`)

  if (archivedCount > 0) {
    console.log('\n⚠️ ISSUE DETECTED: Archived categories exist!')
    console.log('These categories should NOT appear when includeArchived=false:')

    allCategories.forEach(cat => {
      const entity = cat.entity || cat
      if (entity.status !== 'active') {
        console.log(`  - ${entity.entity_name} (${entity.id}) - status: "${entity.status}"`)
      }
    })

    console.log('\n💡 RECOMMENDATION:')
    console.log('1. Check if React Query cache is stale')
    console.log('2. Verify updateMutation.onSuccess is properly removing archived categories')
    console.log('3. Ensure the query includes status filter when includeArchived=false')
  } else {
    console.log('\n✅ NO ISSUE: All categories are active')
  }
}

testCategoryDeletion().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
