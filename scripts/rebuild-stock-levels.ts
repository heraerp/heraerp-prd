#!/usr/bin/env node

/**
 * HERA Stock Level Cleanup Script
 *
 * Deletes all STOCK_LEVEL entities for Hair Talkz Beauty Salon organization
 * Prepares for transaction-driven inventory architecture
 *
 * Usage:
 *   npx tsx scripts/rebuild-stock-levels.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'
import 'dotenv/config'

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
}

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
}

async function main() {
  log.title('🧹 HERA Stock Level Cleanup Script')
  log.title('═════════════════════════════════════')

  // Check for dry-run flag
  const isDryRun = process.argv.includes('--dry-run')

  if (isDryRun) {
    log.warn('DRY RUN MODE - No changes will be made')
  }

  // 1. Load environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const orgId = process.env.HERA_SALON_ORG_ID

  if (!supabaseUrl || !supabaseKey) {
    log.error('Missing Supabase credentials in .env')
    log.info('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!orgId) {
    log.error('Missing HERA_SALON_ORG_ID in .env')
    log.info('Please add HERA_SALON_ORG_ID=<org-uuid> to .env')
    process.exit(1)
  }

  log.info(`Supabase URL: ${supabaseUrl}`)
  log.info(`Organization ID: ${orgId}`)

  // 2. Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  log.success('Connected to Supabase')

  // 3. Query organization details
  log.info('Fetching organization details...')
  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (orgError || !org) {
    log.error(`Organization not found: ${orgError?.message}`)
    process.exit(1)
  }

  log.success(`Organization: ${org.organization_name}`)

  // 4. Query existing STOCK_LEVEL entities
  log.info('Querying existing STOCK_LEVEL entities...')
  const { data: stockLevels, error: stockError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'STOCK_LEVEL')

  if (stockError) {
    log.error(`Failed to query stock levels: ${stockError.message}`)
    process.exit(1)
  }

  log.success(`Found ${stockLevels?.length || 0} STOCK_LEVEL entities`)

  if (!stockLevels || stockLevels.length === 0) {
    log.info('No stock levels to clean up!')
    process.exit(0)
  }

  // 5. Display summary
  console.log('\n' + colors.yellow + '━'.repeat(60) + colors.reset)
  log.warn(`Will DELETE ${stockLevels.length} STOCK_LEVEL entities:`)
  console.log(colors.yellow + '━'.repeat(60) + colors.reset)

  // Show first 5 and summary
  stockLevels.slice(0, 5).forEach((sl: any) => {
    console.log(`  - ${sl.entity_name} (${sl.id.substring(0, 8)}...)`)
  })

  if (stockLevels.length > 5) {
    console.log(`  ... and ${stockLevels.length - 5} more`)
  }

  console.log(colors.yellow + '━'.repeat(60) + colors.reset + '\n')

  if (isDryRun) {
    log.warn('DRY RUN - No deletions performed')
    log.info('Remove --dry-run flag to execute deletion')
    process.exit(0)
  }

  // 6. Confirmation prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const answer = await new Promise<string>((resolve) => {
    rl.question(
      `${colors.red}${colors.bright}⚠ Type "yes" to DELETE ${stockLevels.length} records: ${colors.reset}`,
      resolve
    )
  })
  rl.close()

  if (answer.toLowerCase() !== 'yes') {
    log.warn('Deletion cancelled')
    process.exit(0)
  }

  console.log('')

  // 7. Delete entities (simple approach - direct table delete)
  log.info('Deleting STOCK_LEVEL entities...')

  // Delete in batches of 10
  let deleted = 0
  const batchSize = 10

  for (let i = 0; i < stockLevels.length; i += batchSize) {
    const batch = stockLevels.slice(i, i + batchSize)
    const batchIds = batch.map((sl: any) => sl.id)

    const { error: deleteError } = await supabase
      .from('core_entities')
      .delete()
      .in('id', batchIds)

    if (deleteError) {
      log.error(`Failed to delete batch: ${deleteError.message}`)
      continue
    }

    deleted += batch.length
    process.stdout.write(`\r${colors.green}✓${colors.reset} Deleted: ${deleted}/${stockLevels.length}`)
  }

  console.log('') // New line after progress

  // 8. Verify deletion
  const { data: remaining, error: verifyError } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', orgId)
    .eq('entity_type', 'STOCK_LEVEL')

  if (verifyError) {
    log.warn(`Could not verify deletion: ${verifyError.message}`)
  } else if (remaining && remaining.length > 0) {
    log.warn(`Warning: ${remaining.length} stock levels still exist`)
  } else {
    log.success('All STOCK_LEVEL entities deleted successfully!')
  }

  // 9. Cleanup related data (relationships, dynamic_data)
  log.info('Cleaning up orphaned relationships...')
  const { error: relError } = await supabase
    .from('core_relationships')
    .delete()
    .eq('organization_id', orgId)
    .or(`from_entity_id.not.exists,to_entity_id.not.exists`)

  if (relError) {
    log.warn(`Could not clean relationships: ${relError.message}`)
  } else {
    log.success('Orphaned relationships cleaned')
  }

  log.info('Cleaning up orphaned dynamic data...')
  const { error: dynError } = await supabase
    .from('core_dynamic_data')
    .delete()
    .eq('organization_id', orgId)
    .filter('entity_id', 'not.exists')

  if (dynError) {
    log.warn(`Could not clean dynamic data: ${dynError.message}`)
  } else {
    log.success('Orphaned dynamic data cleaned')
  }

  // 10. Summary
  console.log('\n' + colors.green + '━'.repeat(60) + colors.reset)
  log.success('✨ Cleanup Complete!')
  console.log(colors.green + '━'.repeat(60) + colors.reset)
  log.info('Next steps:')
  log.info('1. Products will now use transaction-driven inventory')
  log.info('2. Use InventoryMovementModal to add opening stock')
  log.info('3. All stock changes will be audited via transactions')
  console.log('')
}

main().catch((error) => {
  log.error(`Script failed: ${error.message}`)
  console.error(error)
  process.exit(1)
})
