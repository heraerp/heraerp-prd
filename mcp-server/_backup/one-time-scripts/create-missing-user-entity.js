#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUserEntity(email, organizationId) {
  console.log(`\n🔧 Creating user entity for: ${email}\n`)

  try {
    // First, get the auth user
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers()
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError)
      return
    }
    
    const user = users.find(u => u.email === email)
    if (!user) {
      console.error('❌ Auth user not found')
      return
    }

    // Check if entity already exists
    const { data: existing, error: checkError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('metadata->auth_user_id', user.id)
      .single()

    if (existing) {
      console.log('✅ User entity already exists!')
      console.log(`Entity ID: ${existing.id}`)
      return existing
    }

    // Create the user entity
    const { data: newEntity, error: createError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'user',
        entity_name: user.email.split('@')[0],
        entity_code: `USER-${user.email.split('@')[0].toUpperCase()}`,
        is_active: true,
        smart_code: 'HERA.SYSTEM.USER.ENTITY.v1',
        metadata: {
          email: user.email,
          auth_user_id: user.id,
          created_from: 'manual_fix',
          full_name: user.user_metadata?.full_name || user.email.split('@')[0]
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating entity:', createError)
      return
    }

    console.log('✅ User entity created successfully!')
    console.log(`Entity ID: ${newEntity.id}`)
    console.log(`Organization ID: ${newEntity.organization_id}`)

    // Also create user role membership
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        auth_user_id: user.id,
        organization_id: organizationId,
        entity_id: newEntity.id,
        role: 'admin',
        is_active: true
      })

    if (!roleError) {
      console.log('✅ User role created successfully!')
    }

    return newEntity

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

// Main execution
const email = process.argv[2]
const orgId = process.argv[3] || process.env.DEFAULT_ORGANIZATION_ID

if (!email) {
  console.log('Usage: node create-missing-user-entity.js <email> [organization-id]')
  console.log('Example: node create-missing-user-entity.js minnunandy@gmail.com')
  console.log('         node create-missing-user-entity.js minnunandy@gmail.com 519d9c67-6fa4-4c73-9c56-6d132a6649c1')
  process.exit(1)
}

if (!orgId) {
  console.error('❌ No organization ID provided and DEFAULT_ORGANIZATION_ID not set')
  console.log('Please provide an organization ID or set DEFAULT_ORGANIZATION_ID in .env.local')
  process.exit(1)
}

createUserEntity(email, orgId)