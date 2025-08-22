#!/usr/bin/env node

/**
 * Automated Supabase Migration Runner
 * Executes SQL migrations directly in your Supabase database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

// Helper functions
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
}

async function runMigration() {
  // Check configuration
  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Missing Supabase configuration')
    log.info('Required environment variables:')
    log.info('- NEXT_PUBLIC_SUPABASE_URL')
    log.info('- SUPABASE_SERVICE_ROLE_KEY (required for migrations)')
    process.exit(1)
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    log.info('Starting HERA Supabase migration...')

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_supabase_auth_setup.sql')
    const migrationSQL = await fs.readFile(migrationPath, 'utf8')

    // Split the SQL into individual statements
    // This is a simple split - for production, use a proper SQL parser
    const statements = migrationSQL
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';')

    log.info(`Found ${statements.length} SQL statements to execute`)

    // Track results
    let successCount = 0
    let errorCount = 0
    const errors = []

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue
      }

      // Show progress for longer operations
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE FUNCTION')) {
        const match = statement.match(/CREATE\s+(TABLE|FUNCTION|TRIGGER|POLICY)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i)
        if (match) {
          log.info(`Creating ${match[1].toLowerCase()}: ${match[2]}`)
        }
      }

      try {
        // Execute the statement using RPC call
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        }).single()

        if (error) {
          // Check if it's a harmless error
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist')) {
            log.warn(`Skipped: ${error.message}`)
          } else {
            throw error
          }
        }
        
        successCount++
      } catch (error) {
        errorCount++
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: error.message
        })
        
        // Continue on error unless it's critical
        if (statement.includes('CREATE TRIGGER') || statement.includes('CREATE FUNCTION')) {
          log.error(`Critical error: ${error.message}`)
          log.error('Statement: ' + statement.substring(0, 200) + '...')
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    log.success(`Migration completed: ${successCount} successful, ${errorCount} errors`)
    console.log('='.repeat(60))

    if (errors.length > 0) {
      log.warn('Errors encountered:')
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.statement}`)
        console.log(`   Error: ${err.error}`)
      })
    }

    // Verify the setup
    log.info('\nVerifying migration...')
    
    // Check if tables exist
    const tables = ['core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines']
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (!error) {
        log.success(`Table ${table} exists and is accessible`)
      } else {
        log.error(`Table ${table} check failed: ${error.message}`)
      }
    }

    // Check if trigger exists (this requires a custom RPC function)
    try {
      const { data: triggers } = await supabase.rpc('check_trigger_exists', {
        trigger_name: 'on_auth_user_created'
      }).single()
      
      if (triggers) {
        log.success('Auth trigger is installed')
      }
    } catch (error) {
      log.warn('Could not verify trigger (this is normal if check_trigger_exists RPC doesn\'t exist)')
    }

    log.info('\n✨ Next steps:')
    log.info('1. Test user signup using supabase-auth-setup.html')
    log.info('2. Check Supabase dashboard for created entities')
    log.info('3. Run verification queries in SQL Editor')

  } catch (error) {
    log.error(`Migration failed: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// Alternative: Direct PostgreSQL execution (requires pg package)
async function runMigrationDirectly() {
  log.info('For direct SQL execution, you can also use:')
  log.info('1. Supabase CLI: supabase db push')
  log.info('2. psql command: psql $DATABASE_URL -f database/migrations/001_supabase_auth_setup.sql')
  log.info('3. Supabase Dashboard SQL Editor (recommended for initial setup)')
}

// Check if we should use direct execution
if (process.argv.includes('--direct')) {
  runMigrationDirectly()
} else if (!supabaseServiceKey) {
  log.error('Service role key not found')
  log.info('\nTo run this migration, you have several options:')
  log.info('\n1. Copy and paste the SQL into Supabase SQL Editor (easiest)')
  log.info('2. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and run this script')
  log.info('3. Use Supabase CLI: supabase db push')
  log.info('\nThe SQL file is located at:')
  log.info('database/migrations/001_supabase_auth_setup.sql')
} else {
  // Note: The exec_sql RPC function needs to be created first
  log.warn('Note: This script requires an exec_sql RPC function in Supabase')
  log.info('For now, please copy the SQL from database/migrations/001_supabase_auth_setup.sql')
  log.info('and run it directly in your Supabase SQL Editor')
  
  // Show the file location
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_supabase_auth_setup.sql')
  log.info(`\nSQL file location: ${migrationPath}`)
}