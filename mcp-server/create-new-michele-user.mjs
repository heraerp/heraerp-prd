import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const platformOrgId = '00000000-0000-0000-0000-000000000000'
const newEmail = 'michele@hairtalkz.ae'
const password = 'HairTalkz2024!' // Strong temporary password

console.log('=== CREATING NEW MICHELE USER ===')

try {
  // 1. Create new user in auth.users
  console.log('1. Creating new auth user...')
  
  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email: newEmail,
    password: password,
    email_confirm: true,
    user_metadata: {
      organization_id: hairTalkzOrgId,
      organization_name: 'Hair Talkz Salon',
      role: 'owner',
      permissions: ['admin:full', 'salon:all', 'finance:all'],
      full_name: 'Michele Rossi',
      created_for: 'hair_talkz_salon_owner',
      created_at: new Date().toISOString()
    }
  })
  
  if (authError) {
    console.error('❌ Failed to create auth user:', authError)
    process.exit(1)
  }
  
  const newUserId = newUser.user.id
  console.log('✅ Created auth user:', { id: newUserId, email: newEmail })
  
  // 2. Create USER entity in platform organization
  console.log('\n2. Creating USER entity in platform org...')
  
  const { data: userEntity, error: userEntityError } = await supabase
    .from('core_entities')
    .insert({
      id: newUserId,
      organization_id: platformOrgId,
      entity_type: 'USER',
      entity_name: 'Michele Rossi',
      entity_code: `USER-${newUserId.substring(0, 8)}`,
      smart_code: 'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
      status: 'active',
      metadata: { 
        email: newEmail,
        created_for: 'hair_talkz_owner',
        primary_organization: hairTalkzOrgId
      }
    })
    .select()
    .single()
    
  if (userEntityError) {
    console.error('❌ Failed to create USER entity:', userEntityError)
  } else {
    console.log('✅ Created USER entity:', userEntity.id)
  }
  
  // 3. Ensure Hair Talkz organization entity exists
  console.log('\n3. Ensuring Hair Talkz organization entity...')
  
  const { data: orgEntity, error: orgError } = await supabase
    .from('core_entities')
    .upsert({
      id: hairTalkzOrgId,
      organization_id: hairTalkzOrgId,
      entity_type: 'organization',
      entity_name: 'Hair Talkz Salon',
      entity_code: 'ORG-HAIRTALKZ',
      smart_code: 'HERA.UNIVERSAL.ORGANIZATION.ENTITY.V1',
      status: 'active',
      metadata: {
        business_type: 'salon',
        industry: 'beauty_wellness',
        owner_email: newEmail
      }
    }, { onConflict: 'id' })
    .select()
    .single()
    
  if (orgError) {
    console.error('❌ Failed to create/update org entity:', orgError)
  } else {
    console.log('✅ Organization entity ready:', orgEntity.entity_name)
  }
  
  // 4. Create USER_MEMBER_OF_ORG relationship
  console.log('\n4. Creating organization membership...')
  
  const { data: relationship, error: relError } = await supabase
    .from('core_relationships')
    .insert({
      organization_id: hairTalkzOrgId,
      from_entity_id: newUserId,
      to_entity_id: hairTalkzOrgId,
      relationship_type: 'USER_MEMBER_OF_ORG',
      smart_code: 'HERA.ACCOUNTING.USER.MEMBERSHIP.v2',
      is_active: true,
      relationship_data: {
        role: 'owner',
        permissions: ['admin:full', 'salon:all', 'finance:all'],
        primary_organization: true,
        access_level: 'full',
        created_for: 'new_michele_account'
      }
    })
    .select()
    .single()
    
  if (relError) {
    console.error('❌ Failed to create relationship:', relError)
  } else {
    console.log('✅ Created organization membership:', relationship.id)
  }
  
  // 5. Add comprehensive dynamic data in Hair Talkz organization
  console.log('\n5. Adding dynamic data fields...')
  
  const dynamicFields = [
    {
      organization_id: hairTalkzOrgId,
      entity_id: newUserId,
      field_name: 'role',
      field_type: 'text',
      field_value_text: 'owner',
      smart_code: 'HERA.ACCOUNTING.USER.ROLE.v2'
    },
    {
      organization_id: hairTalkzOrgId,
      entity_id: newUserId,
      field_name: 'salon_role',
      field_type: 'text',
      field_value_text: 'owner',
      smart_code: 'HERA.ACCOUNTING.USER.SALON_ROLE.v2'
    },
    {
      organization_id: hairTalkzOrgId,
      entity_id: newUserId,
      field_name: 'permissions',
      field_type: 'json',
      field_value_json: ['admin:full', 'salon:all', 'finance:all', 'users:manage', 'reports:all'],
      smart_code: 'HERA.ACCOUNTING.USER.PERMISSIONS.v2'
    },
    {
      organization_id: hairTalkzOrgId,
      entity_id: newUserId,
      field_name: 'full_name',
      field_type: 'text',
      field_value_text: 'Michele Rossi',
      smart_code: 'HERA.ACCOUNTING.USER.PROFILE.v2'
    },
    {
      organization_id: hairTalkzOrgId,
      entity_id: newUserId,
      field_name: 'business_title',
      field_type: 'text',
      field_value_text: 'Owner & Lead Stylist',
      smart_code: 'HERA.ACCOUNTING.USER.TITLE.v2'
    },
    {
      organization_id: hairTalkzOrgId,
      entity_id: newUserId,
      field_name: 'phone',
      field_type: 'text',
      field_value_text: '+971-50-123-4567',
      smart_code: 'HERA.ACCOUNTING.USER.CONTACT.v2'
    },
    {
      organization_id: hairTalkzOrgId,
      entity_id: newUserId,
      field_name: 'access_level',
      field_type: 'text',
      field_value_text: 'full',
      smart_code: 'HERA.ACCOUNTING.USER.ACCESS.v2'
    }
  ]
  
  for (const field of dynamicFields) {
    const { error: fieldError } = await supabase
      .from('core_dynamic_data')
      .upsert(field, { onConflict: 'organization_id,entity_id,field_name' })
      
    if (fieldError) {
      console.error(`❌ Failed to create field ${field.field_name}:`, fieldError)
    } else {
      console.log(`✅ Created field: ${field.field_name}`)
    }
  }
  
  // 6. Final verification
  console.log('\n6. Verification...')
  
  const { data: finalUser } = await supabase.auth.admin.getUserById(newUserId)
  const { data: finalRelationship } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', newUserId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .eq('is_active', true)
    .single()
    
  const { data: dynamicCount } = await supabase
    .from('core_dynamic_data')
    .select('field_name')
    .eq('entity_id', newUserId)
    .eq('organization_id', hairTalkzOrgId)
  
  console.log('\n🎉 NEW USER CREATION SUCCESSFUL!')
  console.log('========================')
  console.log(`👤 User ID: ${newUserId}`)
  console.log(`📧 Email: ${newEmail}`)
  console.log(`🔑 Password: ${password}`)
  console.log(`🏢 Organization: Hair Talkz Salon (${hairTalkzOrgId})`)
  console.log(`👑 Role: Owner (Full Access)`)
  console.log(`🔗 Relationship ID: ${finalRelationship?.id}`)
  console.log(`📊 Dynamic Fields: ${dynamicCount?.length || 0}`)
  console.log('========================')
  console.log('')
  console.log('📋 LOGIN INSTRUCTIONS:')
  console.log('1. Navigate to the login page')
  console.log(`2. Email: ${newEmail}`)
  console.log(`3. Password: ${password}`)
  console.log('4. Full access to Hair Talkz salon data')
  console.log('5. All services, appointments, and reports available')
  console.log('')
  console.log('⚠️  IMPORTANT: Michele should change the password after first login!')
  
} catch (error) {
  console.error('💥 Creation failed:', error)
}