#!/usr/bin/env node

/**
 * HERA Loading Completion Migration Script
 *
 * Automatically migrates landing pages to use the new useLoadingCompletion hook.
 *
 * Usage:
 *   node scripts/migrate-loading-completion.js --dry-run    # Preview changes
 *   node scripts/migrate-loading-completion.js              # Apply changes
 *   node scripts/migrate-loading-completion.js --verify     # Verify all pages have hook
 *
 * @author HERA Engineering Team
 * @version 1.0.0
 */

const fs = require('fs')
const path = require('path')

// Pages that need the loading completion hook
const LANDING_PAGES = [
  // Salon app
  { path: 'src/app/salon/dashboard/page.tsx', role: 'owner', app: 'salon' },
  { path: 'src/app/salon/receptionist/page.tsx', role: 'receptionist', app: 'salon' }, // Already has it
  { path: 'src/app/salon/accountant/page.tsx', role: 'accountant', app: 'salon' }, // Already migrated
  { path: 'src/app/salon/stylist/page.tsx', role: 'stylist', app: 'salon' },
  { path: 'src/app/salon/page.tsx', role: 'user', app: 'salon' },

  // Retail app
  { path: 'src/app/retail/home/page.tsx', role: 'owner/manager/user', app: 'retail' }, // Already migrated
  { path: 'src/app/retail/pos/page.tsx', role: 'receptionist', app: 'retail' },
  { path: 'src/app/retail/accounting/page.tsx', role: 'accountant', app: 'retail' },
  { path: 'src/app/retail/sales/page.tsx', role: 'stylist', app: 'retail' },
  { path: 'src/app/retail/operations/page.tsx', role: 'staff', app: 'retail' },

  // Cashew app
  { path: 'src/app/cashew/dashboard/page.tsx', role: 'owner', app: 'cashew' },
  { path: 'src/app/cashew/operations/page.tsx', role: 'manager', app: 'cashew' },
  { path: 'src/app/cashew/reception/page.tsx', role: 'receptionist', app: 'cashew' },
  { path: 'src/app/cashew/accounting/page.tsx', role: 'accountant', app: 'cashew' },
  { path: 'src/app/cashew/quality/page.tsx', role: 'stylist', app: 'cashew' },
  { path: 'src/app/cashew/production/page.tsx', role: 'staff', app: 'cashew' },
  { path: 'src/app/cashew/page.tsx', role: 'user', app: 'cashew' },

  // Furniture app
  { path: 'src/app/furniture/admin/page.tsx', role: 'owner', app: 'furniture' },
  { path: 'src/app/furniture/store-manager/page.tsx', role: 'manager', app: 'furniture' },
  { path: 'src/app/furniture/pos/page.tsx', role: 'receptionist', app: 'furniture' },
  { path: 'src/app/furniture/accounting/page.tsx', role: 'accountant', app: 'furniture' },
  { path: 'src/app/furniture/sales/page.tsx', role: 'stylist', app: 'furniture' },
  { path: 'src/app/furniture/warehouse/page.tsx', role: 'staff', app: 'furniture' },
  { path: 'src/app/furniture/page.tsx', role: 'user', app: 'furniture' },

  // ISP app
  { path: 'src/app/isp/dashboard/page.tsx', role: 'owner', app: 'isp' },
  { path: 'src/app/isp/network-ops/page.tsx', role: 'manager', app: 'isp' },
  { path: 'src/app/isp/customer-service/page.tsx', role: 'receptionist', app: 'isp' },
  { path: 'src/app/isp/billing/page.tsx', role: 'accountant', app: 'isp' },
  { path: 'src/app/isp/field-tech/page.tsx', role: 'stylist', app: 'isp' },
  { path: 'src/app/isp/support/page.tsx', role: 'staff', app: 'isp' },
  { path: 'src/app/isp/subscriber/page.tsx', role: 'user', app: 'isp' },

  // Restaurant app
  { path: 'src/app/restaurant/owner-dashboard/page.tsx', role: 'owner', app: 'restaurant' },
  { path: 'src/app/restaurant/floor-manager/page.tsx', role: 'manager', app: 'restaurant' },
  { path: 'src/app/restaurant/host-stand/page.tsx', role: 'receptionist', app: 'restaurant' },
  { path: 'src/app/restaurant/accounting/page.tsx', role: 'accountant', app: 'restaurant' },
  { path: 'src/app/restaurant/kitchen/page.tsx', role: 'stylist', app: 'restaurant' },
  { path: 'src/app/restaurant/server/page.tsx', role: 'staff', app: 'restaurant' },
  { path: 'src/app/restaurant/menu/page.tsx', role: 'user', app: 'restaurant' },
]

const projectRoot = path.resolve(__dirname, '..')

/**
 * Check if file exists
 */
function fileExists(filePath) {
  const fullPath = path.join(projectRoot, filePath)
  return fs.existsSync(fullPath)
}

/**
 * Read file content
 */
function readFile(filePath) {
  const fullPath = path.join(projectRoot, filePath)
  if (!fs.existsSync(fullPath)) {
    return null
  }
  return fs.readFileSync(fullPath, 'utf8')
}

/**
 * Write file content
 */
function writeFile(filePath, content) {
  const fullPath = path.join(projectRoot, filePath)
  fs.writeFileSync(fullPath, content, 'utf8')
}

/**
 * Check if file already has the useLoadingCompletion hook
 */
function hasLoadingCompletionHook(content) {
  return content.includes('useLoadingCompletion')
}

/**
 * Check if file has manual loading completion code
 */
function hasManualLoadingCode(content) {
  return (
    content.includes('initializing') &&
    (content.includes('updateProgress') || content.includes('completeLoading'))
  )
}

/**
 * Add import statement for useLoadingCompletion
 */
function addImport(content) {
  // Check if there's already an import statement
  if (content.includes("from '@/lib/hooks/useLoadingCompletion'")) {
    return content
  }

  // Find the last import statement
  const lines = content.split('\n')
  let lastImportIndex = -1

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^import .* from/)) {
      lastImportIndex = i
    }
  }

  if (lastImportIndex === -1) {
    // No imports found, add after 'use client' directive
    const useClientIndex = lines.findIndex(line => line.includes("'use client'") || line.includes('"use client"'))
    if (useClientIndex !== -1) {
      lines.splice(useClientIndex + 1, 0, '')
      lines.splice(useClientIndex + 2, 0, "import { useLoadingCompletion } from '@/lib/hooks/useLoadingCompletion'")
      return lines.join('\n')
    }
  }

  // Add after last import
  lines.splice(lastImportIndex + 1, 0, "import { useLoadingCompletion } from '@/lib/hooks/useLoadingCompletion'")
  return lines.join('\n')
}

/**
 * Add useLoadingCompletion() call in component
 */
function addHookCall(content) {
  const lines = content.split('\n')

  // Find the component function (export default function)
  let componentStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/export default function|function \w+\(\)/)) {
      componentStartIndex = i
      break
    }
  }

  if (componentStartIndex === -1) {
    console.warn('  ⚠️  Could not find component function')
    return content
  }

  // Find the opening brace of the function
  let braceIndex = -1
  for (let i = componentStartIndex; i < lines.length; i++) {
    if (lines[i].includes('{')) {
      braceIndex = i
      break
    }
  }

  if (braceIndex === -1) {
    console.warn('  ⚠️  Could not find function opening brace')
    return content
  }

  // Add the hook call after the opening brace
  // Find the first non-empty line after the brace
  let insertIndex = braceIndex + 1
  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex++
  }

  // Insert the hook call with proper indentation
  const indent = '  ' // Two spaces
  lines.splice(insertIndex, 0, '')
  lines.splice(insertIndex + 1, 0, `${indent}// ⚡ ENTERPRISE: Automatic loading completion using HERA hook`)
  lines.splice(insertIndex + 2, 0, `${indent}useLoadingCompletion()`)

  return lines.join('\n')
}

/**
 * Remove manual loading completion code
 */
function removeManualLoadingCode(content) {
  // This is complex - for now, just add a comment suggesting manual review
  // A proper implementation would parse the AST and remove the specific useEffect
  return content
}

/**
 * Migrate a single file
 */
function migrateFile(filePath, dryRun = false) {
  const content = readFile(filePath)

  if (!content) {
    return { status: 'not_found', message: 'File not found' }
  }

  // Check if already migrated
  if (hasLoadingCompletionHook(content)) {
    return { status: 'already_migrated', message: 'Already has useLoadingCompletion hook' }
  }

  // Check if has manual loading code
  const hasManual = hasManualLoadingCode(content)

  // Add import
  let newContent = addImport(content)

  // Add hook call
  newContent = addHookCall(newContent)

  if (hasManual) {
    console.log('  ⚠️  Manual loading code detected - please review and remove manually')
  }

  if (dryRun) {
    return {
      status: 'would_migrate',
      message: 'Would add useLoadingCompletion hook',
      hasManual
    }
  }

  // Write the file
  writeFile(filePath, newContent)

  return {
    status: 'migrated',
    message: 'Successfully added useLoadingCompletion hook',
    hasManual
  }
}

/**
 * Verify all pages have the hook
 */
function verifyAll() {
  console.log('\n🔍 Verifying all landing pages...\n')

  let total = 0
  let migrated = 0
  let notFound = 0
  let missing = 0

  for (const page of LANDING_PAGES) {
    total++
    const content = readFile(page.path)

    if (!content) {
      console.log(`❌ ${page.path} - FILE NOT FOUND`)
      notFound++
      continue
    }

    if (hasLoadingCompletionHook(content)) {
      console.log(`✅ ${page.path} - HAS HOOK`)
      migrated++
    } else {
      console.log(`⚠️  ${page.path} - MISSING HOOK`)
      missing++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Pages: ${total}`)
  console.log(`✅ Migrated: ${migrated} (${Math.round((migrated/total)*100)}%)`)
  console.log(`⚠️  Missing: ${missing} (${Math.round((missing/total)*100)}%)`)
  console.log(`❌ Not Found: ${notFound} (${Math.round((notFound/total)*100)}%)`)
  console.log('='.repeat(80))
}

/**
 * Main migration function
 */
function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verify = args.includes('--verify')

  if (verify) {
    verifyAll()
    return
  }

  console.log('\n' + '='.repeat(80))
  console.log('🚀 HERA LOADING COMPLETION MIGRATION')
  console.log('='.repeat(80))
  console.log(dryRun ? '🔍 DRY RUN MODE (no changes will be made)\n' : '✍️  APPLYING CHANGES\n')

  let stats = {
    total: 0,
    migrated: 0,
    alreadyMigrated: 0,
    notFound: 0,
    error: 0,
    needsManualReview: 0
  }

  for (const page of LANDING_PAGES) {
    stats.total++
    console.log(`📄 ${page.path}`)
    console.log(`   App: ${page.app} | Role: ${page.role}`)

    try {
      const result = migrateFile(page.path, dryRun)

      switch (result.status) {
        case 'migrated':
          console.log(`   ✅ ${result.message}`)
          stats.migrated++
          if (result.hasManual) {
            stats.needsManualReview++
          }
          break
        case 'would_migrate':
          console.log(`   🔍 ${result.message}`)
          stats.migrated++
          if (result.hasManual) {
            stats.needsManualReview++
          }
          break
        case 'already_migrated':
          console.log(`   ⏭️  ${result.message}`)
          stats.alreadyMigrated++
          break
        case 'not_found':
          console.log(`   ❌ ${result.message}`)
          stats.notFound++
          break
        default:
          console.log(`   ⚠️  Unknown status: ${result.status}`)
          stats.error++
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
      stats.error++
    }

    console.log()
  }

  console.log('='.repeat(80))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Pages: ${stats.total}`)
  console.log(`✅ ${dryRun ? 'Would Migrate' : 'Migrated'}: ${stats.migrated}`)
  console.log(`⏭️  Already Migrated: ${stats.alreadyMigrated}`)
  console.log(`⚠️  Needs Manual Review: ${stats.needsManualReview}`)
  console.log(`❌ Not Found: ${stats.notFound}`)
  console.log(`❌ Errors: ${stats.error}`)
  console.log('='.repeat(80))

  if (stats.needsManualReview > 0) {
    console.log('\n⚠️  ACTION REQUIRED:')
    console.log(`   ${stats.needsManualReview} files have manual loading code that should be removed.`)
    console.log('   Please review these files and remove the old loading completion logic.')
  }

  if (!dryRun && stats.migrated > 0) {
    console.log('\n✅ Migration complete!')
    console.log('   Run `npm run typecheck` to verify no TypeScript errors.')
    console.log('   Run `node scripts/migrate-loading-completion.js --verify` to verify all pages.')
  }

  if (dryRun) {
    console.log('\n💡 To apply changes, run:')
    console.log('   node scripts/migrate-loading-completion.js')
  }
}

// Run the script
main()
