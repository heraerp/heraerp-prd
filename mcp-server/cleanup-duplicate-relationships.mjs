#!/usr/bin/env node
/**
 * HERA Data Cleanup - Remove Duplicate MEMBER_OF Relationships
 *
 * This script identifies and removes duplicate MEMBER_OF relationships
 * while keeping the newest relationship for each user-org pair.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🧹 HERA Data Cleanup - Remove Duplicate MEMBER_OF Relationships')
console.log('='.repeat(70))
console.log('')

async function cleanupDuplicates() {
  // Step 1: Identify duplicates
  console.log('Step 1: Identifying duplicates...')
  const { data: relationships, error: fetchError } = await supabase
    .from('core_relationships')
    .select('id, from_entity_id, organization_id, created_at, updated_at')
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('❌ Error fetching relationships:', fetchError.message)
    process.exit(1)
  }

  console.log(`✅ Found ${relationships.length} total MEMBER_OF relationships`)
  console.log('')

  // Group by user-org pair to find duplicates
  const groupedByUserOrg = {}
  relationships.forEach(rel => {
    const key = `${rel.from_entity_id}|${rel.organization_id}`
    if (!groupedByUserOrg[key]) {
      groupedByUserOrg[key] = []
    }
    groupedByUserOrg[key].push(rel)
  })

  // Find duplicates
  const duplicates = Object.entries(groupedByUserOrg).filter(([key, rels]) => rels.length > 1)

  console.log('Step 2: Analyzing duplicates...')
  console.log(`✅ Found ${duplicates.length} user-org pairs with duplicates`)
  console.log('')

  if (duplicates.length === 0) {
    console.log('🎉 No duplicates found! Database is clean.')
    process.exit(0)
  }

  // Display duplicates
  console.log('Duplicate Details:')
  console.log('-'.repeat(70))
  duplicates.forEach(([key, rels], idx) => {
    const [userId, orgId] = key.split('|')
    console.log(`${idx + 1}. User: ${userId}`)
    console.log(`   Org:  ${orgId}`)
    console.log(`   Found: ${rels.length} relationships`)
    rels.forEach((rel, relIdx) => {
      console.log(`     [${relIdx + 1}] ID: ${rel.id}`)
      console.log(`         Created: ${rel.created_at}`)
      console.log(`         Updated: ${rel.updated_at}`)
    })
    console.log('')
  })

  // Step 3: Delete duplicates (keep newest)
  console.log('Step 3: Removing duplicates (keeping newest)...')
  console.log('')

  let deletedCount = 0
  const deletePromises = []

  for (const [key, rels] of duplicates) {
    // Sort by created_at descending (newest first)
    const sorted = rels.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )

    // Keep first (newest), delete rest
    const toKeep = sorted[0]
    const toDelete = sorted.slice(1)

    console.log(`User-Org pair: ${key}`)
    console.log(`  ✅ Keeping:  ${toKeep.id} (created: ${toKeep.created_at})`)

    for (const rel of toDelete) {
      console.log(`  🗑️  Deleting: ${rel.id} (created: ${rel.created_at})`)
      deletePromises.push(
        supabase
          .from('core_relationships')
          .delete()
          .eq('id', rel.id)
      )
      deletedCount++
    }
    console.log('')
  }

  // Execute deletions
  console.log(`Executing ${deletedCount} deletions...`)
  const deleteResults = await Promise.all(deletePromises)

  // Check for errors
  const deleteErrors = deleteResults.filter(r => r.error)
  if (deleteErrors.length > 0) {
    console.error('❌ Some deletions failed:')
    deleteErrors.forEach(err => console.error('  -', err.error.message))
    process.exit(1)
  }

  console.log(`✅ Successfully deleted ${deletedCount} duplicate relationships`)
  console.log('')

  // Step 4: Verify cleanup
  console.log('Step 4: Verifying cleanup...')
  const { data: afterCleanup, error: verifyError } = await supabase
    .from('core_relationships')
    .select('from_entity_id, organization_id')
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true)

  if (verifyError) {
    console.error('❌ Error verifying cleanup:', verifyError.message)
    process.exit(1)
  }

  // Check for remaining duplicates
  const afterGrouped = {}
  afterCleanup.forEach(rel => {
    const key = `${rel.from_entity_id}|${rel.organization_id}`
    afterGrouped[key] = (afterGrouped[key] || 0) + 1
  })

  const remainingDuplicates = Object.values(afterGrouped).filter(count => count > 1).length

  if (remainingDuplicates === 0) {
    console.log('✅ SUCCESS: No duplicates remaining!')
    console.log('')
    console.log('Summary:')
    console.log(`  - Total relationships checked: ${relationships.length}`)
    console.log(`  - Duplicates found: ${duplicates.length} user-org pairs`)
    console.log(`  - Relationships deleted: ${deletedCount}`)
    console.log(`  - Current unique user-org pairs: ${Object.keys(afterGrouped).length}`)
    console.log('')
    console.log('🎉 Database cleanup completed successfully!')
    console.log('')
    console.log('Next step: Test hera_auth_introspect_v1')
    console.log('  node test-app-management-rpcs-v2.mjs')
  } else {
    console.error(`⚠️ WARNING: Still found ${remainingDuplicates} duplicates after cleanup`)
    process.exit(1)
  }
}

// Run cleanup
cleanupDuplicates().catch(err => {
  console.error('❌ Cleanup failed:', err)
  process.exit(1)
})
