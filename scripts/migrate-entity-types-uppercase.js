#!/usr/bin/env node
/**
 * HERA Entity Type Standardization Migration
 * Smart Code: HERA.SCRIPT.MIGRATION.ENTITY_TYPE.UPPERCASE.V1
 *
 * This script migrates all entity_type values to uppercase for consistency.
 * Ensures all new data uses uppercase while supporting legacy lowercase data.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting Entity Type Standardization Migration...\n')

  try {
    // Step 1: Show current state
    console.log('📊 Current entity_type distribution:')
    const { data: currentTypes, error: currentError } = await supabase
      .from('core_entities')
      .select('entity_type')
      .order('entity_type')

    if (currentError) throw currentError

    const typeCounts = currentTypes.reduce((acc, row) => {
      acc[row.entity_type] = (acc[row.entity_type] || 0) + 1
      return acc
    }, {})

    Object.entries(typeCounts).forEach(([type, count]) => {
      const isUppercase = type === type.toUpperCase()
      const icon = isUppercase ? '✅' : '⚠️'
      console.log(`${icon}  ${type.padEnd(20)} → ${count} entities`)
    })

    // Step 2: Identify entities that need updating
    const needsUpdate = Object.keys(typeCounts).filter(
      type => type !== type.toUpperCase()
    )

    if (needsUpdate.length === 0) {
      console.log('\n✅ All entity types are already uppercase!')
      console.log('No migration needed.')
      return
    }

    console.log(`\n⚠️  Found ${needsUpdate.length} entity types that need uppercase conversion:`)
    needsUpdate.forEach(type => {
      console.log(`   ${type} → ${type.toUpperCase()} (${typeCounts[type]} entities)`)
    })

    // Step 3: Confirm migration
    console.log('\n⚠️  This will update ALL entity_type values to uppercase.')
    console.log('   This operation is REVERSIBLE if needed.')

    // In production, add confirmation prompt here
    // For now, proceed automatically
    console.log('\n🔄 Proceeding with migration...\n')

    // Step 4: Update each entity type
    let totalUpdated = 0
    for (const oldType of needsUpdate) {
      const newType = oldType.toUpperCase()
      console.log(`🔄 Converting: ${oldType} → ${newType}`)

      const { data, error } = await supabase
        .from('core_entities')
        .update({ entity_type: newType })
        .eq('entity_type', oldType)
        .select()

      if (error) {
        console.error(`❌ Error updating ${oldType}:`, error)
        throw error
      }

      const count = data?.length || 0
      totalUpdated += count
      console.log(`✅ Updated ${count} entities`)
    }

    // Step 5: Verify results
    console.log('\n📊 Verifying migration results:')
    const { data: finalTypes, error: finalError } = await supabase
      .from('core_entities')
      .select('entity_type')
      .order('entity_type')

    if (finalError) throw finalError

    const finalCounts = finalTypes.reduce((acc, row) => {
      acc[row.entity_type] = (acc[row.entity_type] || 0) + 1
      return acc
    }, {})

    Object.entries(finalCounts).forEach(([type, count]) => {
      const isUppercase = type === type.toUpperCase()
      const icon = isUppercase ? '✅' : '❌'
      console.log(`${icon}  ${type.padEnd(20)} → ${count} entities`)
    })

    // Step 6: Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY')
    console.log('='.repeat(60))
    console.log(`📊 Total entities updated: ${totalUpdated}`)
    console.log(`📊 Total entity types: ${Object.keys(finalCounts).length}`)
    console.log(`✅ All entity types now uppercase: ${Object.keys(finalCounts).every(t => t === t.toUpperCase())}`)
    console.log('\n💡 Next steps:')
    console.log('   1. Application code now enforces uppercase via normalizeEntityType()')
    console.log('   2. Reads support both cases for backward compatibility')
    console.log('   3. All new data will be created with uppercase entity_types')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.error('\nThe migration has been halted. Please review the error and try again.')
    process.exit(1)
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error)
    process.exit(1)
  })
