#!/usr/bin/env npx tsx

/**
 * Check and Apply V2 RPC Functions to Database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// List of expected V2 functions based on documentation
const expectedFunctions = [
  // Entity CRUD
  'hera_entity_upsert_v1',
  'hera_entity_read_v1',
  'hera_entity_delete_v1',
  'hera_entity_query_v1',
  // Dynamic Data CRUD
  'hera_dynamic_data_upsert_v1',
  'hera_dynamic_data_read_v1',
  'hera_dynamic_data_delete_v1',
  // Relationship CRUD
  'hera_relationship_upsert_v1',
  'hera_relationship_read_v1',
  'hera_relationship_delete_v1',
  'hera_relationship_query_v1',
  'hera_relationship_upsert_batch_v1',
  // Transaction CRUD
  'hera_txn_emit_v1',
  'hera_txn_read_v1',
  'hera_txn_query_v1',
  'hera_txn_reverse_v1'
]

async function checkExistingFunctions() {
  log('\n🔍 Checking existing RPC functions...', 'bright')

  const existing: string[] = []
  const missing: string[] = []

  for (const funcName of expectedFunctions) {
    try {
      // Try to call with minimal/invalid params to check if function exists
      const { error } = await supabase.rpc(funcName, {})

      if (error) {
        // Function exists but params are wrong (expected)
        if (error.message.includes('parameter') || error.message.includes('required')) {
          existing.push(funcName)
          log(`✅ ${funcName} exists`, 'green')
        } else if (error.message.includes('Could not find the function')) {
          missing.push(funcName)
          log(`❌ ${funcName} missing`, 'red')
        } else {
          // Some other error - function likely exists
          existing.push(funcName)
          log(`⚠️ ${funcName} exists (with error: ${error.message})`, 'yellow')
        }
      } else {
        // No error means function exists
        existing.push(funcName)
        log(`✅ ${funcName} exists`, 'green')
      }
    } catch (err) {
      missing.push(funcName)
      log(`❌ ${funcName} missing or error`, 'red')
    }
  }

  log('\n📊 Summary:', 'bright')
  log(`Existing functions: ${existing.length}/${expectedFunctions.length}`, 'cyan')
  log(`Missing functions: ${missing.length}/${expectedFunctions.length}`, missing.length > 0 ? 'yellow' : 'green')

  if (missing.length > 0) {
    log('\nMissing functions:', 'yellow')
    missing.forEach(f => log(`  - ${f}`, 'yellow'))
  }

  return { existing, missing }
}

async function readSQLFiles() {
  log('\n📂 Reading SQL files from database/functions/v2...', 'bright')

  const functionsDir = join(process.cwd(), 'database', 'functions', 'v2')
  const files = readdirSync(functionsDir).filter(f => f.endsWith('.sql'))

  const sqlContents: { file: string; content: string; functions: string[] }[] = []

  for (const file of files) {
    const content = readFileSync(join(functionsDir, file), 'utf-8')

    // Extract function names from CREATE OR REPLACE FUNCTION statements
    const functionMatches = content.match(/CREATE OR REPLACE FUNCTION\s+(\w+)/gi) || []
    const functions = functionMatches.map(match => {
      const funcName = match.replace(/CREATE OR REPLACE FUNCTION\s+/i, '').trim()
      return funcName.split('(')[0] // Remove parameters
    }).filter((f): f is string => f !== undefined)

    sqlContents.push({ file, content, functions })
    log(`📄 ${file}: Found ${functions.length} functions`, 'cyan')
    functions.forEach(f => log(`    - ${f}`, 'blue'))
  }

  return sqlContents
}

async function applyMissingFunctions(missing: string[], sqlFiles: { file: string; content: string; functions: string[] }[]) {
  if (missing.length === 0) {
    log('\n✅ All functions are already present!', 'green')
    return
  }

  log('\n🔧 Preparing to apply missing functions...', 'bright')

  for (const funcName of missing) {
    // Find the SQL file containing this function
    const sqlFile = sqlFiles.find(f => f.functions.includes(funcName))

    if (!sqlFile) {
      log(`⚠️ No SQL file found for ${funcName}`, 'yellow')
      continue
    }

    log(`\n📝 Applying ${funcName} from ${sqlFile.file}...`, 'cyan')

    // Extract just the function definition
    const funcPattern = new RegExp(
      `CREATE OR REPLACE FUNCTION ${funcName}[\\s\\S]*?\\$\\$[\\s\\S]*?\\$\\$[\\s\\S]*?;`,
      'gi'
    )
    const funcDefinition = sqlFile.content.match(funcPattern)?.[0]

    if (!funcDefinition) {
      log(`⚠️ Could not extract definition for ${funcName}`, 'yellow')
      continue
    }

    // Apply the function
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: funcDefinition
      })

      if (error) {
        // Try direct execution via different method
        log(`⚠️ Could not apply via exec_sql, function might need manual application`, 'yellow')
        log(`Error: ${error.message}`, 'red')
      } else {
        log(`✅ Successfully applied ${funcName}`, 'green')
      }
    } catch (err) {
      log(`❌ Error applying ${funcName}: ${err}`, 'red')
    }
  }
}

async function main() {
  console.clear()
  log('🚀 HERA V2 RPC Function Checker & Applier', 'bright')
  log(`Supabase URL: ${supabaseUrl}`, 'cyan')

  try {
    // Step 1: Check existing functions
    const { existing, missing } = await checkExistingFunctions()

    // Step 2: Read SQL files
    const sqlFiles = await readSQLFiles()

    // Step 3: Show what would be applied
    if (missing.length > 0) {
      log('\n⚠️ Missing functions need to be applied manually via Supabase SQL Editor', 'yellow')
      log('Copy the SQL files from database/functions/v2/ and run them in Supabase', 'yellow')

      log('\nSQL files to apply:', 'cyan')
      const filesToApply = new Set<string>()

      missing.forEach(funcName => {
        const file = sqlFiles.find(f => f.functions.includes(funcName))
        if (file) {
          filesToApply.add(file.file)
        }
      })

      filesToApply.forEach(file => {
        log(`  - database/functions/v2/${file}`, 'blue')
      })

      log('\n📋 Instructions:', 'bright')
      log('1. Go to Supabase SQL Editor', 'cyan')
      log('2. Copy and paste the content of each file listed above', 'cyan')
      log('3. Execute the SQL to create the functions', 'cyan')
      log('4. Run this script again to verify', 'cyan')
    }

    log('\n✅ Check complete!', 'green')

  } catch (error) {
    log(`\n❌ Fatal error: ${error}`, 'red')
    process.exit(1)
  }
}

// Run the checker
main().catch(console.error)