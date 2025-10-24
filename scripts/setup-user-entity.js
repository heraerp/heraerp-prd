#!/usr/bin/env node
/**
 * Setup USER Entity for Actor Stamping
 *
 * HERA v2.2 requires all users to have a USER entity in core_entities
 * This script creates the USER entity if it doesn't exist
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupUserEntity() {
  try {
    console.log('🔍 Checking for USER entities...\n')

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    console.log(`Found ${authUsers.users.length} auth users\n`)

    for (const authUser of authUsers.users) {
      console.log(`\n📋 Processing user: ${authUser.email}`)
      console.log(`   Auth ID: ${authUser.id}`)

      // Check if USER entity exists
      const { data: existingUser, error: queryError } = await supabase
        .from('core_entities')
        .select('id, entity_name, metadata')
        .eq('entity_type', 'USER')
        .eq('metadata->>supabase_user_id', authUser.id)
        .maybeSingle()

      if (queryError) {
        console.error('   ❌ Query error:', queryError.message)
        continue
      }

      if (existingUser) {
        console.log(`   ✅ USER entity exists: ${existingUser.id}`)
        console.log(`      Name: ${existingUser.entity_name}`)
        continue
      }

      // Create USER entity
      console.log('   🔨 Creating USER entity...')

      const { data: newUser, error: insertError } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'USER',
          entity_name: authUser.email || `User ${authUser.id.substring(0, 8)}`,
          entity_code: `USER-${authUser.id.substring(0, 8).toUpperCase()}`,
          smart_code: 'HERA.GENERIC.IDENTITY.ENTITY.PERSON.V1',
          organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
          status: 'active',
          metadata: {
            supabase_user_id: authUser.id,
            email: authUser.email,
            email_confirmed_at: authUser.email_confirmed_at,
            created_at: authUser.created_at
          },
          created_by: authUser.id, // Self-created
          updated_by: authUser.id
        })
        .select()
        .single()

      if (insertError) {
        console.error('   ❌ Insert error:', insertError.message)
        continue
      }

      console.log(`   ✅ USER entity created: ${newUser.id}`)
      console.log(`      Name: ${newUser.entity_name}`)
    }

    console.log('\n✅ User entity setup complete!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

setupUserEntity()
