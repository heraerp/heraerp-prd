#!/usr/bin/env node

/**
 * Simple User Fix - Create entities for missing users using existing schema
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function fixUsers() {
  log.info('🔧 Simple User Fix - Using Existing Schema')
  console.log('='.repeat(50))

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get all users and entities
    const { data: users } = await supabase.auth.admin.listUsers()
    const { data: entities } = await supabase.from('core_entities').select('*').eq('entity_type', 'user')

    log.info(`Found ${users.users.length} auth users`)
    log.info(`Found ${entities.length} user entities`)

    const entityIds = new Set(entities.map(e => e.id))
    const missingUsers = users.users.filter(user => !entityIds.has(user.id))

    log.info(`${missingUsers.length} users need entities`)

    for (const user of missingUsers) {
      log.info(`\nProcessing: ${user.email}`)

      // Extract user data
      const userName = user.user_metadata?.name || user.email.split('@')[0]
      const orgName = user.user_metadata?.organization_name || 'Default Organization'

      // Generate codes
      const timestamp = Date.now()
      const userCode = `USER-${timestamp}-${user.id.substring(0, 8)}`
      const orgCode = `ORG-${timestamp}-${user.id.substring(0, 8)}`

      try {
        // Create organization (simple version)
        log.info(`  Creating org: ${orgName}`)
        const { data: org, error: orgError } = await supabase
          .from('core_organizations')
          .insert({
            organization_name: orgName,
            organization_code: orgCode,
            organization_type: 'business_unit',
            industry_classification: user.user_metadata?.industry || 'general',
            settings: JSON.stringify({
              created_via: 'fix_script',
              source_user: user.email
            }),
            status: 'active',
            created_by: user.id
          })
          .select()
          .single()

        if (orgError) {
          log.error(`  Org error: ${orgError.message}`)
          continue
        }

        log.success(`  Organization created: ${org.id}`)

        // Create user entity (simple version)
        log.info(`  Creating user entity: ${userName}`)
        const { data: entity, error: entityError } = await supabase
          .from('core_entities')
          .insert({
            id: user.id, // Use Supabase user ID
            organization_id: org.id,
            entity_type: 'user',
            entity_name: userName,
            entity_code: userCode,
            smart_code: 'HERA.USER.PROFILE.v1',
            status: 'active',
            created_by: user.id
          })
          .select()
          .single()

        if (entityError) {
          log.error(`  Entity error: ${entityError.message}`)
          continue
        }

        log.success(`  User entity created: ${entity.id}`)

        // Create dynamic data
        const properties = [
          { field_name: 'email', field_value: user.email },
          { field_name: 'auth_provider', field_value: 'supabase' },
          { field_name: 'full_name', field_value: userName }
        ]

        if (user.phone) {
          properties.push({ field_name: 'phone', field_value: user.phone })
        }

        log.info(`  Creating ${properties.length} properties...`)
        for (const prop of properties) {
          const { error } = await supabase
            .from('core_dynamic_data')
            .insert({
              entity_id: user.id,
              field_name: prop.field_name,
              field_value: prop.field_value,
              smart_code: `HERA.USER.${prop.field_name.toUpperCase()}.v1`,
              created_by: user.id
            })

          if (error) {
            log.warn(`    Property ${prop.field_name} failed: ${error.message}`)
          }
        }

        // Create membership
        log.info('  Creating membership...')
        const { error: memberError } = await supabase
          .from('core_memberships')
          .insert({
            organization_id: org.id,
            user_id: user.id,
            role: user.user_metadata?.role || 'admin',
            permissions: JSON.stringify(
              user.user_metadata?.role === 'admin' 
                ? ["entities:*", "transactions:*", "reports:*", "settings:*"]
                : ["entities:read", "transactions:read", "reports:read"]
            ),
            status: 'active',
            created_by: user.id
          })

        if (memberError) {
          log.warn(`  Membership failed: ${memberError.message}`)
        } else {
          log.success(`  Membership created`)
        }

        log.success(`✨ Successfully processed: ${user.email}`)

      } catch (error) {
        log.error(`  Failed: ${error.message}`)
      }
    }

    // Final check
    log.info('\nFinal verification...')
    const { data: finalEntities } = await supabase.from('core_entities').select('*').eq('entity_type', 'user')
    const { data: finalUsers } = await supabase.auth.admin.listUsers()

    log.success(`Result: ${finalUsers.users.length} users, ${finalEntities.length} user entities`)

    if (finalEntities.length === finalUsers.users.length) {
      log.success('🎉 All users now have entities!')
    }

  } catch (error) {
    log.error(`Process failed: ${error.message}`)
  }
}

fixUsers()