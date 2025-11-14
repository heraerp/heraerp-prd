#!/usr/bin/env node

/**
 * HERA ADMIN USER CREATION SCRIPT
 * 
 * Creates a new user with administrative privileges in HERA.
 * This script creates a user and assigns them to the admin role with full permissions.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Environment configuration
const isDev = process.env.NODE_ENV === 'development'
const supabaseUrl = isDev 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_PRODUCTION_URL
const supabaseServiceKey = isDev
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.SUPABASE_PRODUCTION_SERVICE_ROLE_KEY

console.log('🛡️  HERA ADMIN USER CREATION')
console.log('===========================')
console.log(`Environment: ${isDev ? 'Development' : 'Production'}`)
console.log(`Supabase URL: ${supabaseUrl}`)

// Validate environment
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL (or PRODUCTION version)')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (or PRODUCTION version)')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Admin user configuration
const ADMIN_USER = {
  email: process.argv[2] || 'admin@heraerp.com',
  password: process.argv[3] || 'Admin123!@#',
  name: process.argv[4] || 'HERA Administrator',
  organizationName: 'HERA Admin Organization'
}

// Constants
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

console.log('\n📋 Admin User Details:')
console.log(`   Email: ${ADMIN_USER.email}`)
console.log(`   Name: ${ADMIN_USER.name}`)
console.log(`   Organization: ${ADMIN_USER.organizationName}`)

async function createAdminUser() {
  try {
    console.log('\n🔍 Step 1: Checking if user already exists...')
    
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }
    
    const userExists = existingUsers?.users?.some(u => u.email === ADMIN_USER.email)
    
    if (userExists) {
      console.log('⚠️  User already exists with this email address.')
      
      // Get the existing user
      const existingUser = existingUsers.users.find(u => u.email === ADMIN_USER.email)
      console.log(`   User ID: ${existingUser.id}`)
      console.log('   Proceeding to update role and permissions...')
      
      return existingUser
    }

    console.log('✅ Email is available. Creating new user...')

    // Create the user with admin API
    console.log('\n🔧 Step 2: Creating Supabase user...')
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      email_confirm: true, // Auto-confirm for admin
      user_metadata: {
        name: ADMIN_USER.name,
        organization_name: ADMIN_USER.organizationName,
        role: 'admin'
      }
    })

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`)
    }

    console.log('✅ User created successfully!')
    console.log(`   User ID: ${userData.user.id}`)
    console.log(`   Email: ${userData.user.email}`)
    console.log(`   Confirmed: ${userData.user.email_confirmed_at ? 'Yes' : 'No'}`)

    return userData.user

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    throw error
  }
}

async function createUserEntity(supabaseUser) {
  try {
    console.log('\n🏢 Step 3: Creating user entity in HERA system...')

    // Create user entity using HERA entities RPC
    const { data: entityResult, error: entityError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: supabaseUser.id,
      p_organization_id: PLATFORM_ORG_ID,
      p_entity: {
        entity_type: 'USER',
        entity_name: ADMIN_USER.name,
        smart_code: 'HERA.PLATFORM.USER.ADMIN.v1',
        entity_description: 'HERA System Administrator'
      },
      p_dynamic: {
        email: {
          field_type: 'email',
          field_value_text: ADMIN_USER.email,
          smart_code: 'HERA.PLATFORM.USER.FIELD.EMAIL.v1'
        },
        full_name: {
          field_type: 'text',
          field_value_text: ADMIN_USER.name,
          smart_code: 'HERA.PLATFORM.USER.FIELD.FULL_NAME.v1'
        },
        role: {
          field_type: 'text',
          field_value_text: 'admin',
          smart_code: 'HERA.PLATFORM.USER.FIELD.ROLE.v1'
        },
        supabase_user_id: {
          field_type: 'text',
          field_value_text: supabaseUser.id,
          smart_code: 'HERA.PLATFORM.USER.FIELD.SUPABASE_ID.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (entityError) {
      console.error('Entity creation error details:', entityError)
      throw new Error(`Failed to create user entity: ${entityError.message}`)
    }

    console.log('✅ User entity created successfully!')
    
    console.log('   Raw entity result:', JSON.stringify(entityResult, null, 2))
    
    if (entityResult?.success && entityResult?.entity_id) {
      console.log(`   Entity ID: ${entityResult.entity_id}`)
      console.log(`   Smart Code: ${entityResult.smart_code || 'HERA.PLATFORM.USER.ADMIN.v1'}`)
      return {
        id: entityResult.entity_id,
        smart_code: entityResult.smart_code || 'HERA.PLATFORM.USER.ADMIN.v1',
        created_by: supabaseUser.id
      }
    } else if (entityResult?.data?.items?.length > 0) {
      const userEntity = entityResult.data.items[0]
      console.log(`   Entity ID: ${userEntity.id}`)
      console.log(`   Smart Code: ${userEntity.smart_code}`)
      return userEntity
    } else if (entityResult?.items?.length > 0) {
      const userEntity = entityResult.items[0]
      console.log(`   Entity ID: ${userEntity.id}`)
      console.log(`   Smart Code: ${userEntity.smart_code}`)
      return userEntity
    } else {
      console.log('   Entity created but no details returned, trying to query...')
      
      // Try to find the user entity we just created
      const { data: queryResult, error: queryError } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: supabaseUser.id,
        p_organization_id: PLATFORM_ORG_ID,
        p_entity: {
          entity_type: 'USER'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: { limit: 1 }
      })

      if (queryResult?.data?.items?.length > 0) {
        const userEntity = queryResult.data.items[0]
        console.log(`   Found entity ID: ${userEntity.id}`)
        return userEntity
      } else {
        throw new Error('Could not retrieve created user entity')
      }
    }

  } catch (error) {
    console.error('❌ Error creating user entity:', error.message)
    throw error
  }
}

async function createAdminOrganization(adminEntity) {
  try {
    console.log('\n🏢 Step 4: Creating admin organization...')

    // Create organization entity
    const { data: orgResult, error: orgError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: adminEntity.created_by || adminEntity.id,
      p_organization_id: PLATFORM_ORG_ID,
      p_entity: {
        entity_type: 'ORGANIZATION',
        entity_name: ADMIN_USER.organizationName,
        smart_code: 'HERA.PLATFORM.ORG.ADMIN.v1',
        entity_description: 'Administrative organization for HERA system management'
      },
      p_dynamic: {
        org_name: {
          field_type: 'text',
          field_value_text: ADMIN_USER.organizationName,
          smart_code: 'HERA.PLATFORM.ORG.FIELD.NAME.v1'
        },
        org_type: {
          field_type: 'text',
          field_value_text: 'admin',
          smart_code: 'HERA.PLATFORM.ORG.FIELD.TYPE.v1'
        },
        admin_email: {
          field_type: 'email',
          field_value_text: ADMIN_USER.email,
          smart_code: 'HERA.PLATFORM.ORG.FIELD.ADMIN_EMAIL.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (orgError) {
      console.error('Organization creation error details:', orgError)
      throw new Error(`Failed to create organization: ${orgError.message}`)
    }

    console.log('✅ Admin organization created successfully!')
    
    const organization = orgResult?.data?.items?.[0]
    if (organization) {
      console.log(`   Organization ID: ${organization.id}`)
      console.log(`   Organization Name: ${organization.entity_name}`)
      return organization
    } else {
      console.log('   Organization created but no details returned')
      return { id: 'unknown' }
    }

  } catch (error) {
    console.error('❌ Error creating admin organization:', error.message)
    throw error
  }
}

async function createAdminMembership(adminEntity, adminOrganization) {
  try {
    console.log('\n🔗 Step 5: Creating admin membership relationship...')

    // Create membership relationship
    const { data: relationshipResult, error: relationshipError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: adminEntity.created_by || adminEntity.id,
      p_organization_id: adminOrganization.id,
      p_entity: {},
      p_dynamic: {},
      p_relationships: [
        {
          source_entity_id: adminEntity.id,
          target_entity_id: adminOrganization.id,
          relationship_type: 'USER_ADMIN_OF_ORG',
          smart_code: 'HERA.PLATFORM.RELATIONSHIP.USER_ADMIN_OF_ORG.v1',
          relationship_data: {
            permissions: ['admin', 'full_access', 'user_management', 'system_configuration'],
            role: 'admin'
          }
        }
      ],
      p_options: {}
    })

    if (relationshipError) {
      console.error('Relationship creation error details:', relationshipError)
      throw new Error(`Failed to create admin relationship: ${relationshipError.message}`)
    }

    console.log('✅ Admin membership relationship created successfully!')

  } catch (error) {
    console.error('❌ Error creating admin membership:', error.message)
    throw error
  }
}

async function updateUserProfile(supabaseUser, adminEntity, adminOrganization) {
  try {
    console.log('\n👤 Step 6: Updating user profile with admin access...')

    // Update user metadata with entity and organization references
    const { data: updateResult, error: updateError } = await supabase.auth.admin.updateUserById(
      supabaseUser.id,
      {
        user_metadata: {
          ...supabaseUser.user_metadata,
          entity_id: adminEntity.id,
          organization_id: adminOrganization.id,
          role: 'admin',
          permissions: ['admin', 'full_access', 'performance_dashboard'],
          is_admin: true
        }
      }
    )

    if (updateError) {
      throw new Error(`Failed to update user profile: ${updateError.message}`)
    }

    console.log('✅ User profile updated with admin access!')
    console.log(`   Entity ID: ${adminEntity.id}`)
    console.log(`   Organization ID: ${adminOrganization.id}`)
    console.log('   Permissions: admin, full_access, performance_dashboard')

  } catch (error) {
    console.error('❌ Error updating user profile:', error.message)
    throw error
  }
}

async function verifyAdminAccess(adminEntity, adminOrganization) {
  try {
    console.log('\n✅ Step 7: Verifying admin access...')

    // Test admin access by querying organizations
    const { data: orgs, error: orgsError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: adminEntity.created_by || adminEntity.id,
      p_organization_id: PLATFORM_ORG_ID,
      p_entity: {
        entity_type: 'ORGANIZATION'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: { limit: 5 }
    })

    if (orgsError) {
      console.warn('⚠️  Could not verify organization access:', orgsError.message)
    } else {
      console.log('✅ Organization access verified!')
      console.log(`   Can access ${orgs?.data?.items?.length || 0} organizations`)
    }

    // Test user entity access
    const { data: users, error: usersError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: adminEntity.created_by || adminEntity.id,
      p_organization_id: PLATFORM_ORG_ID,
      p_entity: {
        entity_type: 'USER'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: { limit: 5 }
    })

    if (usersError) {
      console.warn('⚠️  Could not verify user access:', usersError.message)
    } else {
      console.log('✅ User access verified!')
      console.log(`   Can access ${users?.data?.items?.length || 0} user entities`)
    }

  } catch (error) {
    console.error('❌ Error verifying admin access:', error.message)
    // Don't throw - verification is nice to have but not critical
  }
}

// Main execution
async function main() {
  try {
    console.log('\n🚀 Starting admin user creation process...\n')

    // Step 1: Create Supabase user
    const supabaseUser = await createAdminUser()

    // Step 2: Create user entity in HERA
    const adminEntity = await createUserEntity(supabaseUser)

    // Step 3: Create admin organization
    const adminOrganization = await createAdminOrganization(adminEntity)

    // Step 4: Create admin membership
    await createAdminMembership(adminEntity, adminOrganization)

    // Step 5: Update user profile
    await updateUserProfile(supabaseUser, adminEntity, adminOrganization)

    // Step 6: Verify access
    await verifyAdminAccess(adminEntity, adminOrganization)

    console.log('\n🎉 SUCCESS: Admin user created successfully!')
    console.log('========================================')
    console.log('\n📧 LOGIN CREDENTIALS:')
    console.log(`   Email: ${ADMIN_USER.email}`)
    console.log(`   Password: ${ADMIN_USER.password}`)
    console.log(`   User ID: ${supabaseUser.id}`)
    console.log(`   Entity ID: ${adminEntity.id}`)
    console.log(`   Organization ID: ${adminOrganization.id}`)

    console.log('\n🎯 ADMIN ACCESS INCLUDES:')
    console.log('   • Performance Dashboard (/admin/performance)')
    console.log('   • User Management (/admin/users)')
    console.log('   • System Administration')
    console.log('   • Organization Management')
    console.log('   • Full HERA System Access')

    console.log('\n🔗 ACCESS URLs:')
    console.log('   • Login: http://localhost:3000/auth/login')
    console.log('   • Performance Dashboard: http://localhost:3000/admin/performance')
    console.log('   • Admin Panel: http://localhost:3000/admin')

    console.log('\n✅ Admin user is ready to use!')

  } catch (error) {
    console.error('\n❌ FAILED: Admin user creation failed')
    console.error('=====================================')
    console.error(`Error: ${error.message}`)
    console.error('\n🔧 TROUBLESHOOTING:')
    console.error('   1. Check your environment variables')
    console.error('   2. Ensure Supabase is accessible')
    console.error('   3. Verify database schema is up to date')
    console.error('   4. Check HERA RPC functions are deployed')
    process.exit(1)
  }
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('HERA Admin User Creation Script')
  console.log('==============================')
  console.log('')
  console.log('Usage: node scripts/create-admin-user.mjs [email] [password] [name]')
  console.log('')
  console.log('Arguments:')
  console.log('  email    Admin email address (default: admin@heraerp.com)')
  console.log('  password Admin password (default: Admin123!@#)')
  console.log('  name     Admin full name (default: HERA Administrator)')
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/create-admin-user.mjs')
  console.log('  node scripts/create-admin-user.mjs admin@company.com SecurePass123 "John Smith"')
  console.log('')
  process.exit(0)
}

// Run the script
main().catch(console.error)