#!/usr/bin/env node

/**
 * HERA Supabase Authentication Test Script
 * Tests the complete auth flow and verifies entity creation
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Test user configuration
const TEST_USER = {
  email: `test-${Date.now()}@heratest.com`,
  password: 'TestPassword123!',
  name: 'Test User',
  organization: 'Test Organization'
}

// ANSI color codes for output
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

async function testSupabaseAuth() {
  log.info('Starting HERA Supabase Authentication Test')
  
  // Check environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Missing Supabase configuration. Please check your .env.local file')
    log.info('Required variables:')
    log.info('- NEXT_PUBLIC_SUPABASE_URL')
    log.info('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  // Create Supabase clients
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

  try {
    // Test 1: Sign Up
    log.info(`Testing sign up with email: ${TEST_USER.email}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          name: TEST_USER.name,
          organization_name: TEST_USER.organization,
          role: 'admin'
        }
      }
    })

    if (signUpError) {
      log.error(`Sign up failed: ${signUpError.message}`)
      return
    }

    log.success('User signed up successfully')
    log.info(`User ID: ${signUpData.user?.id}`)

    // Test 2: Sign In
    log.info('Testing sign in...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    })

    if (signInError) {
      log.error(`Sign in failed: ${signInError.message}`)
      return
    }

    log.success('User signed in successfully')
    const userId = signInData.user.id

    // Test 3: Check Entity Creation (requires service role key)
    if (supabaseAdmin) {
      log.info('Checking automatic entity creation...')
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check organization
      const { data: orgs, error: orgError } = await supabaseAdmin
        .from('core_organizations')
        .select('*')
        .eq('created_by', userId)

      if (orgError) {
        log.error(`Failed to fetch organizations: ${orgError.message}`)
      } else if (orgs && orgs.length > 0) {
        log.success(`Organization created: ${orgs[0].organization_name}`)
        log.info(`Organization ID: ${orgs[0].id}`)
      } else {
        log.warn('No organization found - trigger may not have executed')
      }

      // Check user entity
      const { data: entities, error: entityError } = await supabaseAdmin
        .from('core_entities')
        .select('*')
        .eq('id', userId)
        .eq('entity_type', 'user')

      if (entityError) {
        log.error(`Failed to fetch user entity: ${entityError.message}`)
      } else if (entities && entities.length > 0) {
        log.success(`User entity created: ${entities[0].entity_name}`)
        log.info(`Entity Code: ${entities[0].entity_code}`)
      } else {
        log.warn('No user entity found - trigger may not have executed')
      }

      // Check dynamic data
      const { data: dynamicData, error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .select('field_name, field_value')
        .eq('entity_id', userId)

      if (dynamicError) {
        log.error(`Failed to fetch dynamic data: ${dynamicError.message}`)
      } else if (dynamicData && dynamicData.length > 0) {
        log.success('User properties created:')
        dynamicData.forEach(prop => {
          log.info(`  - ${prop.field_name}: ${prop.field_value}`)
        })
      }

      // Check membership
      const { data: memberships, error: membershipError } = await supabaseAdmin
        .from('core_relationships')
        .select('metadata')
        .eq('from_entity_id', userId)
        .eq('relationship_type', 'member_of')

      if (membershipError) {
        log.error(`Failed to fetch membership: ${membershipError.message}`)
      } else if (memberships && memberships.length > 0) {
        log.success(`Membership created with role: ${memberships[0].metadata?.role}`)
        log.info(`Permissions: ${JSON.stringify(memberships[0].metadata?.permissions)}`)
      }
    } else {
      log.warn('Service role key not configured - skipping entity verification')
      log.info('To enable full testing, add SUPABASE_SERVICE_ROLE_KEY to .env.local')
    }

    // Test 4: Get Session
    log.info('Testing session retrieval...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      log.error(`Failed to get session: ${sessionError.message}`)
    } else if (session) {
      log.success('Session retrieved successfully')
      log.info(`Access token available: ${session.access_token ? 'Yes' : 'No'}`)
      log.info(`Expires at: ${new Date(session.expires_at * 1000).toLocaleString()}`)
    }

    // Test 5: Sign Out
    log.info('Testing sign out...')
    
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      log.error(`Sign out failed: ${signOutError.message}`)
    } else {
      log.success('User signed out successfully')
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    log.success('HERA Supabase Authentication Test Complete!')
    console.log('='.repeat(50))
    
    log.info('Next steps:')
    log.info('1. Check your Supabase dashboard for the new user')
    log.info('2. Verify email confirmation if enabled')
    log.info('3. Run SQL queries to inspect created entities')
    log.info('4. Test the HTML interface with real credentials')

  } catch (error) {
    log.error(`Unexpected error: ${error.message}`)
    console.error(error)
  }
}

// Run the test
testSupabaseAuth()