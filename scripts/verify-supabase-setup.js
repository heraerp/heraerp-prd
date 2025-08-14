#!/usr/bin/env node

/**
 * HERA Supabase Setup Verification Script
 * Checks if all components are properly configured
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
}

async function verifySetup() {
  log.info('HERA Supabase Setup Verification')
  console.log('='.repeat(40))

  let score = 0
  const maxScore = 10

  // 1. Check environment variables
  log.info('1. Checking environment variables...')
  if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL') {
    log.success('NEXT_PUBLIC_SUPABASE_URL is configured')
    score++
  } else {
    log.error('NEXT_PUBLIC_SUPABASE_URL is missing or not configured')
  }

  if (supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    log.success('NEXT_PUBLIC_SUPABASE_ANON_KEY is configured')
    score++
  } else {
    log.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or not configured')
  }

  if (supabaseServiceKey) {
    log.success('SUPABASE_SERVICE_ROLE_KEY is configured')
    score++
  } else {
    log.warn('SUPABASE_SERVICE_ROLE_KEY is missing (optional for basic setup)')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Cannot continue without basic Supabase configuration')
    return
  }

  // Create clients
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

  // 2. Test Supabase connection
  log.info('2. Testing Supabase connection...')
  try {
    const { data, error } = await supabase.from('_realtime_schema_versions').select('*').limit(1)
    if (!error) {
      log.success('Supabase connection successful')
      score++
    } else if (error.message.includes('permission denied')) {
      log.success('Supabase connected (permission error is expected)')
      score++
    } else {
      log.error(`Supabase connection failed: ${error.message}`)
    }
  } catch (error) {
    log.error(`Supabase connection error: ${error.message}`)
  }

  // 3. Check tables (requires admin access)
  if (supabaseAdmin) {
    log.info('3. Checking HERA core tables...')
    const tables = [
      'core_organizations',
      'core_entities', 
      'core_dynamic_data',
      'core_memberships'
    ]

    let tablesExist = 0
    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin.from(table).select('id').limit(1)
        if (!error) {
          log.success(`Table ${table} exists and accessible`)
          tablesExist++
        } else {
          log.error(`Table ${table} error: ${error.message}`)
        }
      } catch (error) {
        log.error(`Table ${table} check failed: ${error.message}`)
      }
    }

    if (tablesExist === tables.length) {
      score += 2
    } else if (tablesExist > 0) {
      score++
    }
  } else {
    log.warn('3. Skipping table checks (no service role key)')
  }

  // 4. Check authentication setup
  log.info('4. Checking authentication configuration...')
  try {
    // Try to sign up a test user to see if auth is enabled
    const testEmail = `test${Date.now()}@gmail.com` // Use valid domain
    const { error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    })

    if (!error) {
      log.success('Authentication is enabled')
      // Clean up - sign out
      await supabase.auth.signOut()
      score++
    } else if (error.message.includes('Signups not allowed')) {
      log.warn('Authentication is configured but signups are disabled')
      score++
    } else {
      log.error(`Authentication error: ${error.message}`)
    }
  } catch (error) {
    log.error(`Authentication check failed: ${error.message}`)
  }

  // 5. Check for existing users (if any)
  if (supabaseAdmin) {
    log.info('5. Checking existing users and entities...')
    try {
      // Check auth users
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (!userError && users) {
        log.info(`Found ${users.users.length} existing users`)
        
        if (users.users.length > 0) {
          // Check if entities were created for existing users
          const { data: entities, error: entityError } = await supabaseAdmin
            .from('core_entities')
            .select('id, entity_name, entity_type')
            .eq('entity_type', 'user')

          if (!entityError && entities) {
            log.info(`Found ${entities.length} user entities`)
            if (entities.length === users.users.length) {
              log.success('All users have corresponding entities')
              score++
            } else if (entities.length > 0) {
              log.warn(`${users.users.length - entities.length} users missing entities`)
            }
          }
        } else {
          log.info('No existing users found (fresh installation)')
          score++
        }
      }
    } catch (error) {
      log.warn('Could not check existing users (may require different permissions)')
    }
  } else {
    log.warn('5. Skipping user checks (no service role key)')
  }

  // 6. Check HTML test file
  log.info('6. Checking test files...')
  const fs = require('fs').promises
  try {
    const htmlContent = await fs.readFile('supabase-auth-setup.html', 'utf8')
    if (htmlContent.includes(supabaseUrl) && htmlContent.includes(supabaseAnonKey)) {
      log.success('HTML test file is configured with your credentials')
      score++
    } else if (htmlContent.includes('YOUR_SUPABASE_URL')) {
      log.warn('HTML test file needs credential update')
    } else {
      log.success('HTML test file exists')
      score++
    }
  } catch (error) {
    log.warn('HTML test file not found or not readable')
  }

  // Summary
  console.log('\n' + '='.repeat(40))
  log.info(`Setup Score: ${score}/${maxScore}`)
  
  if (score >= 8) {
    log.success('🎉 Excellent! Your setup is ready for production')
  } else if (score >= 6) {
    log.success('✨ Good! Your setup is mostly complete')
  } else if (score >= 4) {
    log.warn('⚠️  Partial setup - some issues need attention')
  } else {
    log.error('❌ Setup incomplete - please review the errors above')
  }

  // Recommendations
  console.log('\n📋 Recommendations:')
  
  if (!supabaseServiceKey) {
    log.info('• Add SUPABASE_SERVICE_ROLE_KEY for full verification')
  }
  
  if (score < maxScore) {
    log.info('• Run the migration SQL in your Supabase dashboard')
    log.info('• Check your Supabase project settings')
    log.info('• Verify your environment variables')
  }

  log.info('• Test user signup with supabase-auth-setup.html')
  log.info('• Check the setup guide: SUPABASE-AUTH-SETUP-GUIDE.md')

  console.log('\n🚀 Next steps:')
  log.info('1. Create a test user using the HTML interface')
  log.info('2. Verify entities are created in Supabase dashboard')
  log.info('3. Integrate with your HERA application')
}

verifySetup().catch(console.error)