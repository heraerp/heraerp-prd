#!/usr/bin/env node

/**
 * Create Cashew Manufacturing User
 * Smart Code: HERA.SCRIPT.CREATE_CASHEW_USER.v1
 * 
 * Creates dedicated user for cashew manufacturing module
 * Includes Supabase Auth + HERA USER entity + organization membership
 */

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

// Use development environment (HERA-DEV)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqagokigwuujyeyrgdkq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const cashewOrgId = process.env.CASHEW_ORGANIZATION_ID

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!cashewOrgId) {
  console.error('❌ Missing CASHEW_ORGANIZATION_ID in environment variables.')
  console.error('Please run: node scripts/create-cashew-organization.js first')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Platform organization ID for USER entities
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

// User configuration
const CASHEW_USER = {
  email: 'admin@keralacashew.com',
  password: 'CashewAdmin2024!',
  full_name: 'Cashew Manufacturing Admin',
  role: 'admin',
  permissions: [
    'view_dashboard', 'view_financial_reports', 'manage_manufacturing',
    'manage_materials', 'manage_products', 'manage_batches',
    'manage_work_centers', 'manage_quality', 'manage_costing',
    'export_data', 'view_analytics', 'manage_organization',
    'manage_procurement', 'manage_sales', 'manage_inventory'
  ]
}

async function createCashewUser() {
  console.log('👤 CREATING CASHEW MANUFACTURING USER')
  console.log('====================================')
  
  console.log(`📧 Email: ${CASHEW_USER.email}`)
  console.log(`👤 Name: ${CASHEW_USER.full_name}`)
  console.log(`🎭 Role: ${CASHEW_USER.role}`)
  console.log(`🏢 Organization ID: ${cashewOrgId}`)
  
  try {
    console.log('\n🔐 Creating Supabase Auth user...')
    
    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: CASHEW_USER.email,
      password: CASHEW_USER.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: CASHEW_USER.full_name,
        organization_id: cashewOrgId,
        organization_name: 'Kerala Cashew Processors',
        role: CASHEW_USER.role,
        roles: [CASHEW_USER.role],
        permissions: CASHEW_USER.permissions,
        industry: 'cashew_processing'
      }
    })

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered') || 
          authError.message.includes('already exists')) {
        console.log('⚠️ User already exists, fetching existing user...')
        
        // Get the existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = users.find(u => u.email === CASHEW_USER.email)
        if (!existingUser) {
          throw new Error('User exists but could not be found')
        }
        
        console.log(`✅ Found existing user: ${existingUser.id}`)
        authData.user = existingUser
        
        // Update user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              full_name: CASHEW_USER.full_name,
              organization_id: cashewOrgId,
              organization_name: 'Kerala Cashew Processors',
              role: CASHEW_USER.role,
              roles: [CASHEW_USER.role],
              permissions: CASHEW_USER.permissions,
              industry: 'cashew_processing'
            }
          }
        )
        
        if (updateError) {
          console.warn('⚠️ Could not update user metadata:', updateError.message)
        } else {
          console.log('✅ Updated user metadata')
        }
      } else {
        throw authError
      }
    } else {
      console.log(`✅ Supabase Auth user created: ${authData.user.id}`)
    }

    const userId = authData.user.id
    const userEntityCode = `USER-${userId.substring(0, 8).toUpperCase()}`

    console.log('\n🏗️ Creating HERA USER entity...')
    
    // Step 2: Create USER entity in HERA
    const userEntityResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: userId,
      p_organization_id: PLATFORM_ORG_ID, // USER entities live in platform org
      p_entity: {
        entity_type: 'USER',
        entity_name: CASHEW_USER.full_name,
        entity_code: userEntityCode,
        smart_code: 'HERA.CASHEW.USER.ADMIN.v1'
      },
      p_dynamic: {
        email: {
          field_type: 'text',
          field_value_text: CASHEW_USER.email,
          smart_code: 'HERA.CASHEW.USER.FIELD.EMAIL.v1'
        },
        role: {
          field_type: 'text',
          field_value_text: CASHEW_USER.role,
          smart_code: 'HERA.CASHEW.USER.FIELD.ROLE.v1'
        },
        primary_organization: {
          field_type: 'text',
          field_value_text: cashewOrgId,
          smart_code: 'HERA.CASHEW.USER.FIELD.PRIMARY_ORG.v1'
        },
        industry_expertise: {
          field_type: 'text',
          field_value_text: 'Cashew Processing & Manufacturing',
          smart_code: 'HERA.CASHEW.USER.FIELD.EXPERTISE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (userEntityResult.error) {
      console.warn('⚠️ USER entity creation failed:', userEntityResult.error.message)
      console.log('User auth account created successfully, but entity creation failed.')
    } else {
      console.log('✅ HERA USER entity created successfully')
    }

    console.log('\n🔗 Setting up organization membership...')
    
    // Step 3: Create organization membership relationship
    const membershipResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: userId,
      p_organization_id: cashewOrgId,
      p_entity: {
        entity_type: 'MEMBERSHIP',
        entity_name: `${CASHEW_USER.full_name} - Kerala Cashew Processors`,
        entity_code: `MEMBERSHIP-${userId.substring(0, 8).toUpperCase()}`,
        smart_code: 'HERA.CASHEW.MEMBERSHIP.ADMIN.v1'
      },
      p_dynamic: {
        user_id: {
          field_type: 'text',
          field_value_text: userId,
          smart_code: 'HERA.CASHEW.MEMBERSHIP.FIELD.USER_ID.v1'
        },
        organization_id: {
          field_type: 'text',
          field_value_text: cashewOrgId,
          smart_code: 'HERA.CASHEW.MEMBERSHIP.FIELD.ORG_ID.v1'
        },
        role: {
          field_type: 'text',
          field_value_text: CASHEW_USER.role,
          smart_code: 'HERA.CASHEW.MEMBERSHIP.FIELD.ROLE.v1'
        },
        status: {
          field_type: 'text',
          field_value_text: 'active',
          smart_code: 'HERA.CASHEW.MEMBERSHIP.FIELD.STATUS.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (membershipResult.error) {
      console.warn('⚠️ Organization membership creation failed:', membershipResult.error.message)
    } else {
      console.log('✅ Organization membership created successfully')
    }

    console.log('\n✅ CASHEW USER SETUP COMPLETE!')
    console.log('\n📋 USER DETAILS:')
    console.log('================')
    console.log(`🆔 User ID: ${userId}`)
    console.log(`📧 Email: ${CASHEW_USER.email}`)
    console.log(`🔑 Password: ${CASHEW_USER.password}`)
    console.log(`👤 Name: ${CASHEW_USER.full_name}`)
    console.log(`🎭 Role: ${CASHEW_USER.role}`)
    console.log(`🏢 Organization: Kerala Cashew Processors`)
    console.log(`🆔 Organization ID: ${cashewOrgId}`)
    console.log(`🔧 Entity Code: ${userEntityCode}`)
    
    console.log('\n📝 ENVIRONMENT CONFIGURATION:')
    console.log('==============================')
    console.log('Add this to your .env file:')
    console.log(`CASHEW_ADMIN_USER_ID=${userId}`)
    
    console.log('\n🎯 AUTHENTICATION TEST:')
    console.log('========================')
    console.log('1. Go to: http://localhost:3002/greenworms/login')
    console.log(`2. Login with: ${CASHEW_USER.email} / ${CASHEW_USER.password}`)
    console.log('3. Access cashew module: http://localhost:3002/cashew')
    console.log('4. Verify all 26 cashew URLs work with new organization context')
    
    return {
      userId,
      success: true,
      credentials: {
        email: CASHEW_USER.email,
        password: CASHEW_USER.password
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create cashew user:', error.message)
    
    console.log('\n🔧 TROUBLESHOOTING:')
    console.log('===================')
    console.log('1. Check Supabase authentication is enabled')
    console.log('2. Verify service role key permissions')
    console.log('3. Ensure HERA RPC functions are deployed')
    console.log('4. Check organization ID is valid')
    
    return {
      success: false,
      error: error.message
    }
  }
}

// Run the script
createCashewUser()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 CASHEW USER SETUP COMPLETE!')
      console.log('Ready for authentication testing.')
      process.exit(0)
    } else {
      console.log('\n⚠️ USER SETUP INCOMPLETE')
      console.log('Please check the error messages above and try again.')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n💥 FATAL ERROR:', error)
    process.exit(1)
  })