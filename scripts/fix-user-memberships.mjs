#!/usr/bin/env node
/**
 * Fix User Organization Memberships
 * Creates missing MEMBER_OF relationships for salon users
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz

const USERS = [
  {
    email: 'hairtalkz2022@gmail.com',
    role: 'Owner'
  },
  {
    email: 'hairtalkz01@gmail.com',
    role: 'Receptionist'
  },
  {
    email: 'hairtalkz02@gmail.com',
    role: 'Receptionist'
  }
]

async function fixMemberships() {
  console.log('🔧 Fixing User Organization Memberships...\n')

  // Step 1: Verify organization exists
  console.log('📋 Step 1: Verifying organization...')
  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .eq('id', ORGANIZATION_ID)
    .single()

  if (orgError || !org) {
    console.error('❌ Organization not found:', ORGANIZATION_ID)
    console.error('Error:', orgError)
    return
  }

  console.log('✅ Organization found:', org.organization_name, '\n')

  // Step 2: Process each user
  for (const userInfo of USERS) {
    console.log(`👤 Processing: ${userInfo.email}`)

    // Get user from auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError)
      continue
    }

    const user = users.find(u => u.email?.toLowerCase() === userInfo.email.toLowerCase())

    if (!user) {
      console.log(`⚠️  User not found in auth: ${userInfo.email}`)
      continue
    }

    console.log(`   Found user ID: ${user.id}`)

    // Check existing membership
    const { data: existingRel } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', user.id)
      .eq('to_entity_id', ORGANIZATION_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    if (existingRel) {
      console.log(`   ℹ️  Membership already exists (updating role to ${userInfo.role})`)

      // Update existing relationship with role
      const { error: updateError } = await supabase
        .from('core_relationships')
        .update({
          relationship_data: { role: userInfo.role },
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRel.id)

      if (updateError) {
        console.error(`   ❌ Error updating membership:`, updateError)
      } else {
        console.log(`   ✅ Updated role to ${userInfo.role}`)
      }
    } else {
      console.log(`   ➕ Creating new membership with role: ${userInfo.role}`)

      // Create new relationship
      const { error: insertError } = await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: user.id,
          to_entity_id: ORGANIZATION_ID,
          relationship_type: 'MEMBER_OF',
          relationship_data: { role: userInfo.role },
          is_active: true,
          organization_id: ORGANIZATION_ID,
          created_by: user.id,
          updated_by: user.id
        })

      if (insertError) {
        console.error(`   ❌ Error creating membership:`, insertError)
      } else {
        console.log(`   ✅ Membership created successfully`)
      }
    }

    console.log('')
  }

  // Step 3: Verify all memberships
  console.log('\n📊 Verification: Checking all memberships...')

  for (const userInfo of USERS) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email?.toLowerCase() === userInfo.email.toLowerCase())

    if (!user) continue

    const { data: rel } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', user.id)
      .eq('to_entity_id', ORGANIZATION_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    if (rel) {
      console.log(`✅ ${userInfo.email}: ${rel.relationship_data?.role || 'No role'} (Active: ${rel.is_active})`)
    } else {
      console.log(`❌ ${userInfo.email}: No membership found`)
    }
  }

  console.log('\n🎉 Done!')
}

fixMemberships().catch(console.error)
