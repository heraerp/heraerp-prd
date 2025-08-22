#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function associateUserToSalon() {
  const userEmail = process.argv[2]
  const salonOrgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

  if (!userEmail) {
    console.error('❌ Please provide user email as argument')
    console.log('Usage: node associate-user-to-salon.js user@example.com')
    process.exit(1)
  }

  console.log(`\n🔄 Associating user ${userEmail} to salon organization ${salonOrgId}...`)

  try {
    // 1. Get user from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError)
      return
    }

    const authUser = authUsers.users.find(u => u.email === userEmail)
    
    if (!authUser) {
      console.error(`❌ User ${userEmail} not found in auth.users`)
      return
    }

    console.log(`✅ Found auth user: ${authUser.id}`)

    // 2. Check if user entity exists
    const { data: userEntity, error: userEntityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('metadata->auth_user_id', authUser.id)
      .single()

    let userEntityId

    if (userEntityError || !userEntity) {
      // Create user entity
      console.log('📝 Creating user entity...')
      const { data: newUserEntity, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: salonOrgId,
          entity_type: 'user',
          entity_name: authUser.email.split('@')[0],
          entity_code: `USER-${authUser.email.split('@')[0].toUpperCase()}`,
          metadata: {
            auth_user_id: authUser.id,
            email: authUser.email,
            role: 'admin'
          }
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating user entity:', createError)
        return
      }

      userEntityId = newUserEntity.id
      console.log(`✅ Created user entity: ${userEntityId}`)
    } else {
      userEntityId = userEntity.id
      console.log(`✅ Found existing user entity: ${userEntityId}`)
    }

    // 3. Check if relationship exists
    const { data: existingRel, error: relCheckError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('to_entity_id', salonOrgId)
      .eq('relationship_type', 'member_of')
      .single()

    if (!existingRel) {
      // Create relationship
      console.log('🔗 Creating organization membership...')
      const { data: newRel, error: relError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: salonOrgId,
          from_entity_id: userEntityId,
          to_entity_id: salonOrgId,
          relationship_type: 'member_of',
          metadata: {
            role: 'admin',
            permissions: ['*'],
            joined_at: new Date().toISOString()
          }
        })
        .select()

      if (relError) {
        console.error('❌ Error creating relationship:', relError)
        return
      }

      console.log('✅ Created organization membership')
    } else {
      console.log('✅ User already member of organization')
    }

    // 4. Verify organization details
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', salonOrgId)
      .single()

    if (org) {
      console.log('\n📊 Organization Details:')
      console.log(`   Name: ${org.organization_name}`)
      console.log(`   Type: ${org.organization_type}`)
      console.log(`   Code: ${org.organization_code}`)
      console.log(`   ID: ${org.id}`)
    }

    console.log('\n✅ Success! User is now associated with the salon organization.')
    console.log('\n📝 Next steps:')
    console.log('1. Restart your Next.js development server')
    console.log('2. Login with the user email:', userEmail)
    console.log('3. Access the salon at: http://localhost:3001/salon-direct')
    console.log('   or: http://localhost:3001/~salon/salon')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

associateUserToSalon()