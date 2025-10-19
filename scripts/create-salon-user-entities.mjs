#!/usr/bin/env node
/**
 * Create USER Entities and Organization Memberships
 * Complete setup for salon users in HERA system
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hairtalkz
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000' // Platform org for USER entities

const USERS = [
  {
    email: 'hairtalkz2022@gmail.com',
    name: 'Hair Talkz Owner',
    role: 'Owner'
  },
  {
    email: 'hairtalkz01@gmail.com',
    name: 'Receptionist One',
    role: 'Receptionist'
  },
  {
    email: 'hairtalkz02@gmail.com',
    name: 'Receptionist Two',
    role: 'Receptionist'
  }
]

async function setupUsers() {
  console.log('🚀 Setting up Salon Users in HERA System\n')

  // Step 1: Get all auth users
  console.log('📋 Step 1: Fetching auth users...')
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error listing users:', authError)
    return
  }

  console.log(`✅ Found ${authUsers.length} auth users\n`)

  // Step 2: Process each user
  for (const userInfo of USERS) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`👤 Processing: ${userInfo.email}`)
    console.log(`${'='.repeat(60)}`)

    // Find auth user
    const authUser = authUsers.find(u => u.email?.toLowerCase() === userInfo.email.toLowerCase())

    if (!authUser) {
      console.log(`⚠️  Auth user not found: ${userInfo.email}`)
      continue
    }

    console.log(`✅ Auth user found: ${authUser.id}`)

    // Check if USER entity exists
    const { data: existingEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (existingEntity) {
      console.log(`✅ USER entity already exists`)
    } else {
      console.log(`➕ Creating USER entity...`)

      // Create USER entity in platform organization
      const { error: entityError } = await supabase
        .from('core_entities')
        .insert({
          id: authUser.id,
          entity_type: 'USER',
          entity_name: userInfo.name,
          smart_code: `HERA.PLATFORM.USER.ENTITY.${userInfo.role.toUpperCase()}.V1`,
          organization_id: PLATFORM_ORG_ID,
          status: 'active',
          created_by: authUser.id,
          updated_by: authUser.id
        })

      if (entityError) {
        console.error(`   ❌ Error creating USER entity:`, entityError)
        continue
      }

      console.log(`   ✅ USER entity created in platform organization`)
    }

    // Check if membership exists
    const { data: existingMembership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', authUser.id)
      .eq('to_entity_id', ORGANIZATION_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    if (existingMembership) {
      console.log(`✅ Membership already exists (updating role)`)

      const { error: updateError } = await supabase
        .from('core_relationships')
        .update({
          relationship_data: { role: userInfo.role },
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMembership.id)

      if (updateError) {
        console.error(`   ❌ Error updating membership:`, updateError)
      } else {
        console.log(`   ✅ Updated role to ${userInfo.role}`)
      }
    } else {
      console.log(`➕ Creating organization membership...`)

      const { error: membershipError } = await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: authUser.id,
          to_entity_id: ORGANIZATION_ID,
          relationship_type: 'MEMBER_OF',
          relationship_data: { role: userInfo.role },
          is_active: true,
          organization_id: ORGANIZATION_ID,
          created_by: authUser.id,
          updated_by: authUser.id
        })

      if (membershipError) {
        console.error(`   ❌ Error creating membership:`, membershipError)
      } else {
        console.log(`   ✅ Membership created with role: ${userInfo.role}`)
      }
    }
  }

  // Step 3: Final verification
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('📊 FINAL VERIFICATION')
  console.log(`${'='.repeat(60)}\n`)

  for (const userInfo of USERS) {
    const authUser = authUsers.find(u => u.email?.toLowerCase() === userInfo.email.toLowerCase())
    if (!authUser) continue

    // Check entity
    const { data: entity } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code')
      .eq('id', authUser.id)
      .maybeSingle()

    // Check membership
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', authUser.id)
      .eq('to_entity_id', ORGANIZATION_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    console.log(`📧 ${userInfo.email}`)
    console.log(`   Entity: ${entity ? '✅ EXISTS' : '❌ MISSING'}`)
    console.log(`   Membership: ${membership ? `✅ ${membership.relationship_data?.role || 'No role'}` : '❌ MISSING'}`)
    console.log('')
  }

  console.log('🎉 Setup complete!')
}

setupUsers().catch(console.error)
