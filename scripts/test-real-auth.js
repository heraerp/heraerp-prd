#!/usr/bin/env node

/**
 * HERA Real Authentication Test
 * Tests with santhoshlal@gmail.com for actual verification
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Real test configuration
const REAL_USER = {
  email: 'santhoshlal@gmail.com',
  password: 'HERATest123!',
  name: 'Santhosh Lal',
  organization: 'HERA Software Inc'
}

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

async function testRealAuth() {
  log.info('🚀 HERA Real Authentication Test')
  log.info(`Testing with: ${REAL_USER.email}`)
  console.log('='.repeat(50))
  
  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Missing Supabase configuration')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

  try {
    // Test 1: Check if user already exists
    log.info('1. Checking if user exists...')
    
    if (supabaseAdmin) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users?.find(u => u.email === REAL_USER.email)
      
      if (userExists) {
        log.info(`User ${REAL_USER.email} already exists (ID: ${userExists.id})`)
        
        // Check if entities exist for this user
        const { data: userEntity } = await supabaseAdmin
          .from('core_entities')
          .select('*')
          .eq('id', userExists.id)
          .eq('entity_type', 'user')
          .single()

        if (userEntity) {
          log.success('User entity exists in HERA system')
          log.info(`Entity name: ${userEntity.entity_name}`)
          log.info(`Organization ID: ${userEntity.organization_id}`)

          // Check organization
          const { data: org } = await supabaseAdmin
            .from('core_organizations')
            .select('*')
            .eq('id', userEntity.organization_id)
            .single()

          if (org) {
            log.success(`Organization: ${org.organization_name}`)
          }

          // Check membership
          const { data: membership } = await supabaseAdmin
            .from('core_memberships')
            .select('*')
            .eq('user_id', userExists.id)
            .single()

          if (membership) {
            log.success(`Membership role: ${membership.role}`)
            log.info(`Permissions: ${JSON.stringify(membership.permissions)}`)
          }

          // Check dynamic data
          const { data: dynamicData } = await supabaseAdmin
            .from('core_dynamic_data')
            .select('field_name, field_value')
            .eq('entity_id', userExists.id)

          if (dynamicData && dynamicData.length > 0) {
            log.success('User properties:')
            dynamicData.forEach(prop => {
              log.info(`  - ${prop.field_name}: ${prop.field_value}`)
            })
          }

        } else {
          log.warn('User exists in auth but not in HERA entities - trigger may not have fired')
        }
      } else {
        log.info('User does not exist yet')
      }
    }

    // Test 2: Sign Up (if needed)
    log.info('\n2. Testing sign up...')
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: REAL_USER.email,
      password: REAL_USER.password,
      options: {
        data: {
          name: REAL_USER.name,
          organization_name: REAL_USER.organization,
          role: 'admin'
        }
      }
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        log.info('User already registered - this is expected')
      } else {
        log.error(`Sign up error: ${signUpError.message}`)
      }
    } else {
      log.success('Sign up successful!')
      if (signUpData.user) {
        log.info(`New user ID: ${signUpData.user.id}`)
        log.info(`Email confirmed: ${signUpData.user.email_confirmed_at ? 'Yes' : 'No - check email'}`)
      }
    }

    // Test 3: Sign In
    log.info('\n3. Testing sign in...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: REAL_USER.email,
      password: REAL_USER.password
    })

    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        log.warn('Email not confirmed yet - check your email inbox')
        log.info('Once confirmed, you can sign in successfully')
      } else {
        log.error(`Sign in error: ${signInError.message}`)
      }
    } else {
      log.success('Sign in successful!')
      const userId = signInData.user.id
      log.info(`User ID: ${userId}`)
      log.info(`Email verified: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`)

      // Wait for trigger to execute
      log.info('\n4. Waiting for entity creation trigger...')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Check if entities were created
      if (supabaseAdmin) {
        log.info('5. Checking entity creation...')
        
        const { data: entity } = await supabaseAdmin
          .from('core_entities')
          .select(`
            *,
            core_organizations!inner(*)
          `)
          .eq('id', userId)
          .eq('entity_type', 'user')
          .single()

        if (entity) {
          log.success(`✨ HERA entity created successfully!`)
          log.info(`Entity name: ${entity.entity_name}`)
          log.info(`Organization: ${entity.core_organizations.organization_name}`)
          
          // Check dynamic data
          const { data: props } = await supabaseAdmin
            .from('core_dynamic_data')
            .select('field_name, field_value')
            .eq('entity_id', userId)

          log.success('User properties created:')
          props?.forEach(prop => {
            log.info(`  - ${prop.field_name}: ${prop.field_value}`)
          })

          // Check membership
          const { data: membership } = await supabaseAdmin
            .from('core_memberships')
            .select('role, permissions')
            .eq('user_id', userId)
            .single()

          if (membership) {
            log.success(`Membership: ${membership.role}`)
            log.info(`Permissions: ${JSON.stringify(membership.permissions)}`)
          }

        } else {
          log.error('Entity creation failed - check trigger setup')
        }
      }

      // Test 4: Sign Out
      log.info('\n6. Testing sign out...')
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        log.error(`Sign out error: ${signOutError.message}`)
      } else {
        log.success('Sign out successful')
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    log.success('🎉 Real Authentication Test Complete!')
    console.log('='.repeat(50))
    
    console.log('\n📋 Next Steps:')
    log.info('1. Check your email (santhoshlal@gmail.com) for confirmation')
    log.info('2. Open supabase-auth-setup.html to test in browser')
    log.info('3. Check Supabase dashboard for created entities')
    log.info('4. Integrate authentication with HERA app')

    console.log('\n🔗 Quick Links:')
    log.info('• Supabase Dashboard: https://supabase.com/dashboard')
    log.info('• HTML Test File: ./supabase-auth-setup.html')
    log.info('• Setup Guide: ./SUPABASE-AUTH-SETUP-GUIDE.md')

  } catch (error) {
    log.error(`Test failed: ${error.message}`)
    console.error(error)
  }
}

testRealAuth()