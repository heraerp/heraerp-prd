#!/usr/bin/env node

/**
 * HERA DNA SECURITY: Salon Demo Users Setup
 * 
 * Creates comprehensive demo users for testing the HERA DNA SECURITY framework
 * with all salon roles and realistic permissions.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Demo users with different roles
const DEMO_USERS = [
  {
    email: 'michele@hairtalkz.com',
    password: 'HairTalkz2024!',
    role: 'owner',
    fullName: 'Michele Hair (Owner)',
    salonRole: 'owner',
    description: 'Salon owner with full access to all features'
  },
  {
    email: 'manager@hairtalkz.com', 
    password: 'Manager2024!',
    role: 'manager',
    fullName: 'Sarah Manager',
    salonRole: 'manager',
    description: 'Salon manager with operational access'
  },
  {
    email: 'receptionist@hairtalkz.com',
    password: 'Reception2024!',
    role: 'user',
    fullName: 'Emma Receptionist',
    salonRole: 'receptionist',
    description: 'Front desk with appointment and customer management'
  },
  {
    email: 'stylist@hairtalkz.com',
    password: 'Stylist2024!',
    role: 'user',
    fullName: 'Jessica Stylist',
    salonRole: 'stylist',
    description: 'Stylist with appointment and customer access'
  },
  {
    email: 'accountant@hairtalkz.com',
    password: 'Accounts2024!',
    role: 'user',
    fullName: 'David Accountant',
    salonRole: 'accountant',
    description: 'Financial access for reports and compliance'
  },
  {
    email: 'admin@hairtalkz.com',
    password: 'Admin2024!',
    role: 'admin',
    fullName: 'Alex Admin',
    salonRole: 'admin',
    description: 'System administrator with user management'
  }
]

// Salon-specific permissions mapping
const SALON_ROLE_PERMISSIONS = {
  owner: [
    'salon:read:all',
    'salon:write:all',
    'salon:delete:all',
    'salon:admin:full',
    'salon:finance:full',
    'salon:staff:manage',
    'salon:settings:manage'
  ],
  manager: [
    'salon:read:operations',
    'salon:write:operations',
    'salon:finance:read',
    'salon:staff:schedule',
    'salon:inventory:manage',
    'salon:appointments:manage',
    'salon:customers:manage'
  ],
  receptionist: [
    'salon:read:appointments',
    'salon:write:appointments',
    'salon:read:customers',
    'salon:write:customers',
    'salon:pos:operate',
    'salon:checkin:manage'
  ],
  stylist: [
    'salon:read:appointments:own',
    'salon:write:appointments:own',
    'salon:read:customers:assigned',
    'salon:pos:process:services',
    'salon:schedule:view'
  ],
  accountant: [
    'salon:read:finance',
    'salon:write:finance',
    'salon:read:reports',
    'salon:export:financial',
    'salon:vat:manage'
  ],
  admin: [
    'salon:read:system',
    'salon:write:system',
    'salon:users:manage',
    'salon:security:manage',
    'salon:backup:manage'
  ]
}

async function createDemoUser(userConfig) {
  console.log(`\n🔐 Creating demo user: ${userConfig.fullName} (${userConfig.salonRole})`)
  
  let user = null
  
  try {
    // 1. Create pure Supabase auth user (NO business metadata)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true
      // ✅ CORRECT: No business logic in auth metadata
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`   ℹ️  User ${userConfig.email} already exists, finding existing user...`)
        
        // Update existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === userConfig.email)
        
        if (existingUser) {
          // ✅ CORRECT: Don't update auth metadata with business logic
          console.log(`   ✅ Found existing user ${userConfig.email}`)
          user = existingUser // Set user variable for HERA entity creation
        } else {
          throw authError
        }
      } else {
        throw authError
      }
    }

    if (!user) {
      user = authData?.user
    }
    
    if (!user) {
      throw new Error('Failed to create or find user')
    }

    console.log(`   ✅ Using Supabase user: ${user.id}`)

    // 2. Check if HERA entity already exists
    const { data: existingEntities, error: checkError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .contains('metadata', { auth_user_id: user.id })

    if (checkError) {
      console.log(`   ⚠️  Error checking existing entities: ${checkError.message}`)
    }

    if (existingEntities && existingEntities.length > 0) {
      console.log(`   ℹ️  HERA entity already exists for ${userConfig.email}, skipping creation`)
      return {
        auth_user: user,
        entity: existingEntities[0],
        skipped: true
      }
    }

    console.log(`   🔧 Creating new HERA entity for ${userConfig.email}`)

    // 3. Create user entity in HERA system (proper metadata categorization)
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: HAIRTALKZ_ORG_ID,
        entity_type: 'user',
        entity_name: userConfig.fullName,
        entity_code: `USER-${userConfig.salonRole.toUpperCase()}`,
        smart_code: 'HERA.SALON.HR.USER.V1',
        status: 'active',
        metadata: {
          metadata_category: 'system_audit',
          auth_user_id: user.id,
          created_by_system: 'hera_demo_script',
          creation_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (entityError) {
      console.error(`   ❌ Failed to create user entity:`, entityError)
      throw entityError
    }

    console.log(`   ✅ Created user entity: ${userEntity.id}`)

    // 4. Create comprehensive dynamic data fields for business properties
    const dynamicFields = [
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_id: userEntity.id,
        field_name: 'email',
        field_value_text: userConfig.email,
        field_type: 'text',
        smart_code: 'HERA.SALON.HR.USER.EMAIL.V1'
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_id: userEntity.id,
        field_name: 'salon_role',
        field_value_text: userConfig.salonRole,
        field_type: 'text',
        smart_code: 'HERA.SALON.HR.USER.ROLE.V1'
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_id: userEntity.id,
        field_name: 'permissions',
        field_value_json: SALON_ROLE_PERMISSIONS[userConfig.salonRole] || [],
        field_type: 'json',
        smart_code: 'HERA.SALON.HR.USER.PERMS.V1'
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_id: userEntity.id,
        field_name: 'description',
        field_value_text: userConfig.description,
        field_type: 'text',
        smart_code: 'HERA.SALON.HR.USER.DESC.V1'
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_id: userEntity.id,
        field_name: 'system_role',
        field_value_text: userConfig.role,
        field_type: 'text',
        smart_code: 'HERA.SALON.HR.USER.SYS.ROLE.V1'
      }
    ]

    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicFields)

    if (dynamicError) {
      console.error(`   ❌ Failed to create dynamic data:`, dynamicError)
      throw dynamicError
    }

    console.log(`   ✅ Created ${dynamicFields.length} dynamic data fields`)

    // 5. Log creation in audit trail
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: HAIRTALKZ_ORG_ID,
        transaction_type: 'user_creation',
        transaction_code: `USER-CREATE-${Date.now()}`,
        smart_code: 'HERA.SALON.SECURITY.USER.CREATED.V1',
        from_entity_id: userEntity.id,
        metadata: {
          created_by: 'demo_script',
          role: userConfig.salonRole,
          permissions_count: permissions.length,
          demo_user: true
        }
      })

    console.log(`   ✅ Logged user creation in audit trail`)

    return {
      auth_user: user,
      entity: userEntity,
      permissions
    }

  } catch (error) {
    console.error(`   ❌ Failed to create user ${userConfig.email}:`, error.message)
    throw error
  }
}

async function createAllDemoUsers() {
  console.log('🧬 HERA DNA SECURITY: Creating Salon Demo Users')
  console.log('=' .repeat(60))
  
  const results = []
  
  for (const userConfig of DEMO_USERS) {
    try {
      const result = await createDemoUser(userConfig)
      results.push({ ...userConfig, ...result })
    } catch (error) {
      console.error(`Failed to create ${userConfig.email}:`, error.message)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Demo Users Created Successfully!')
  console.log('=' .repeat(60))
  
  console.log('\n📋 LOGIN CREDENTIALS:')
  console.log('-'.repeat(40))
  
  DEMO_USERS.forEach(user => {
    console.log(`\n${user.fullName} (${user.salonRole.toUpperCase()})`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${user.password}`)
    console.log(`   Access: ${user.description}`)
  })
  
  console.log('\n🔗 TESTING URLS:')
  console.log('-'.repeat(40))
  console.log('Auth Page: http://localhost:3000/salon/auth')
  console.log('Dashboard: http://localhost:3000/salon/dashboard')
  console.log('Finance: http://localhost:3000/salon/finance')
  console.log('POS: http://localhost:3000/salon/pos')
  
  console.log('\n🧪 TESTING SCENARIOS:')
  console.log('-'.repeat(40))
  console.log('1. Login as Owner - Full access to all features')
  console.log('2. Login as Receptionist - Limited to appointments/customers')
  console.log('3. Login as Accountant - Financial data access only') 
  console.log('4. Login as Stylist - Own appointments only')
  console.log('5. Try accessing restricted areas to test security')
  
  console.log('\n✨ HERA DNA SECURITY features will be automatically enforced!')
}

// Main execution
if (require.main === module) {
  createAllDemoUsers()
    .then(() => {
      console.log('\n🚀 Demo setup complete! Start testing HERA DNA SECURITY.')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Demo setup failed:', error)
      process.exit(1)
    })
}

module.exports = { createDemoUser, createAllDemoUsers, DEMO_USERS }