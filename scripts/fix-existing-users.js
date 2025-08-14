#!/usr/bin/env node

/**
 * Fix Existing Users - Create entities for users who don't have them
 * This script processes existing Supabase users and creates HERA entities
 */

const { createClient } = require('@supabase/supabase-js')
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

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
}

async function fixExistingUsers() {
  log.info('🔧 Fixing Existing Users - Creating HERA Entities')
  console.log('='.repeat(50))

  if (!supabaseServiceKey) {
    log.error('SUPABASE_SERVICE_ROLE_KEY is required for this operation')
    process.exit(1)
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get all users
    log.info('1. Fetching all Supabase users...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      log.error(`Failed to fetch users: ${authError.message}`)
      return
    }

    const users = authData.users
    log.info(`Found ${users.length} users in Supabase Auth`)

    // Check which users have entities
    log.info('2. Checking existing HERA entities...')
    const { data: entities, error: entitiesError } = await supabaseAdmin
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'user')

    if (entitiesError) {
      log.error(`Failed to fetch entities: ${entitiesError.message}`)
      return
    }

    const entityIds = new Set(entities.map(e => e.id))
    const usersWithoutEntities = users.filter(user => !entityIds.has(user.id))

    log.info(`${entities.length} users have entities`)
    log.info(`${usersWithoutEntities.length} users missing entities`)

    if (usersWithoutEntities.length === 0) {
      log.success('🎉 All users already have entities!')
      return
    }

    // Process each user without entities
    log.info('3. Creating entities for users without them...')
    
    for (const user of usersWithoutEntities) {
      log.info(`Processing user: ${user.email} (${user.id})`)
      
      try {
        // Extract user data
        const userName = user.user_metadata?.name || 
                        user.user_metadata?.full_name || 
                        user.email.split('@')[0]
        
        const orgName = user.user_metadata?.organization_name || 
                       user.app_metadata?.organization_name || 
                       'Default Organization'

        // Generate codes
        const timestamp = Date.now()
        const userCode = `USER-${timestamp}-${user.id.substring(0, 8)}`
        const orgCode = `ORG-${timestamp}-${user.id.substring(0, 8)}`

        // Create or get organization
        log.info(`  Creating organization: ${orgName}`)
        const { data: org, error: orgError } = await supabaseAdmin
          .from('core_organizations')
          .insert({
            organization_name: orgName,
            organization_code: orgCode,
            organization_type: 'business_unit',
            industry_classification: user.user_metadata?.industry || 'general',
            settings: {
              created_via: 'user_fix_script',
              source_user_id: user.id
            },
            metadata: {
              source_user_email: user.email,
              created_from: 'fix_script'
            },
            status: 'active',
            created_by: user.id
          })
          .select()
          .single()

        if (orgError) {
          log.error(`  Failed to create organization: ${orgError.message}`)
          continue
        }

        log.success(`  Organization created: ${org.organization_name}`)

        // Create user entity
        log.info(`  Creating user entity: ${userName}`)
        const { data: entity, error: entityError } = await supabaseAdmin
          .from('core_entities')
          .insert({
            id: user.id, // Use Supabase user ID
            organization_id: org.id,
            entity_type: 'user',
            entity_name: userName,
            entity_code: userCode,
            smart_code: 'HERA.USER.PROFILE.v1',
            metadata: {
              auth_provider: 'supabase',
              email: user.email,
              email_confirmed: user.email_confirmed_at !== null,
              created_from: 'fix_script'
            },
            status: 'active',
            created_by: user.id
          })
          .select()
          .single()

        if (entityError) {
          log.error(`  Failed to create entity: ${entityError.message}`)
          continue
        }

        log.success(`  User entity created: ${entity.entity_name}`)

        // Create dynamic data
        log.info('  Creating user properties...')
        const dynamicData = [
          { field_name: 'email', field_value: user.email, field_type: 'text', smart_code: 'HERA.USER.EMAIL.v1' },
          { field_name: 'auth_provider', field_value: 'supabase', field_type: 'text', smart_code: 'HERA.USER.AUTH_PROVIDER.v1' },
          { field_name: 'signup_date', field_value: user.created_at, field_type: 'datetime', smart_code: 'HERA.USER.SIGNUP_DATE.v1' },
          { field_name: 'full_name', field_value: userName, field_type: 'text', smart_code: 'HERA.USER.FULL_NAME.v1' }
        ]

        if (user.phone) {
          dynamicData.push({
            field_name: 'phone',
            field_value: user.phone,
            field_type: 'text',
            smart_code: 'HERA.USER.PHONE.v1'
          })
        }

        for (const data of dynamicData) {
          const { error: dynamicError } = await supabaseAdmin
            .from('core_dynamic_data')
            .insert({
              entity_id: user.id,
              ...data,
              created_by: user.id
            })

          if (dynamicError) {
            log.warn(`    Failed to create property ${data.field_name}: ${dynamicError.message}`)
          }
        }

        log.success(`  Created ${dynamicData.length} user properties`)

        // Create membership
        log.info('  Creating organization membership...')
        const { error: membershipError } = await supabaseAdmin
          .from('core_memberships')
          .insert({
            organization_id: org.id,
            user_id: user.id,
            role: user.user_metadata?.role || 'admin',
            permissions: user.user_metadata?.role === 'admin' 
              ? ["entities:*", "transactions:*", "reports:*", "settings:*"]
              : ["entities:read", "transactions:read", "reports:read"],
            status: 'active',
            created_by: user.id
          })

        if (membershipError) {
          log.error(`  Failed to create membership: ${membershipError.message}`)
        } else {
          log.success(`  Membership created with role: ${user.user_metadata?.role || 'admin'}`)
        }

        log.success(`✨ Successfully processed user: ${user.email}`)
        console.log()

      } catch (error) {
        log.error(`Failed to process user ${user.email}: ${error.message}`)
        continue
      }
    }

    // Final verification
    log.info('4. Final verification...')
    const { data: finalEntities } = await supabaseAdmin
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'user')

    const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers()

    log.success(`Final count: ${finalUsers.users.length} users, ${finalEntities.length} entities`)

    if (finalEntities.length === finalUsers.users.length) {
      log.success('🎉 All users now have corresponding HERA entities!')
    } else {
      log.warn(`${finalUsers.users.length - finalEntities.length} users still missing entities`)
    }

    console.log('\n' + '='.repeat(50))
    log.success('🔧 User Fix Process Complete!')
    console.log('='.repeat(50))

  } catch (error) {
    log.error(`Fix process failed: ${error.message}`)
    console.error(error)
  }
}

fixExistingUsers()