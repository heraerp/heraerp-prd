import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixMicheleOrganizationMismatch() {
  console.log('=== FIXING MICHELE ORGANIZATION MISMATCH ===')
  
  const micheleUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674'
  const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const wrongOrgId = 'c0771739-ddb6-47fb-ae82-d34febedf098'
  
  try {
    // 1. Investigate the organization mismatch
    console.log('1. Investigating organization relationships...')
    
    const { data: allRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', micheleUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    console.log('Michele\'s organization memberships:', {
      count: allRelationships?.length || 0,
      relationships: allRelationships?.map(rel => ({
        id: rel.id,
        organization_id: rel.organization_id,
        to_entity_id: rel.to_entity_id,
        is_active: rel.is_active,
        created_at: rel.created_at
      }))
    })
    
    // 2. Check if wrong organization exists
    console.log('\n2. Checking wrong organization...')
    const { data: wrongOrg, error: wrongOrgError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', wrongOrgId)
      .eq('entity_type', 'organization')
      .maybeSingle()
    
    console.log('Wrong organization details:', { data: wrongOrg, error: wrongOrgError })
    
    // 3. Check Hair Talkz organization
    console.log('\n3. Checking Hair Talkz organization...')
    const { data: hairTalkzOrg, error: hairOrgError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', hairTalkzOrgId)
      .eq('entity_type', 'organization')
      .maybeSingle()
    
    console.log('Hair Talkz organization details:', { data: hairTalkzOrg, error: hairOrgError })
    
    // 4. Check Michele's dynamic data in different organizations
    console.log('\n4. Checking Michele\'s dynamic data across organizations...')
    
    const { data: micheleDataWrong, error: wrongDataError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', micheleUserId)
      .eq('organization_id', wrongOrgId)
    
    const { data: micheleDataCorrect, error: correctDataError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', micheleUserId)
      .eq('organization_id', hairTalkzOrgId)
    
    console.log('Michele\'s data in wrong org:', { count: micheleDataWrong?.length || 0 })
    console.log('Michele\'s data in Hair Talkz:', { count: micheleDataCorrect?.length || 0 })
    
    // 5. Fix the organization membership
    console.log('\n5. Fixing organization membership...')
    
    // Option 1: Update the wrong relationship to point to Hair Talkz
    const wrongRelationship = allRelationships?.find(rel => rel.organization_id === wrongOrgId)
    
    if (wrongRelationship) {
      console.log('Found wrong relationship, updating it to Hair Talkz...')
      
      const { data: updatedRel, error: updateError } = await supabase
        .from('core_relationships')
        .update({
          organization_id: hairTalkzOrgId,
          to_entity_id: hairTalkzOrgId,
          relationship_data: {
            ...wrongRelationship.relationship_data,
            corrected_organization: true,
            original_org: wrongOrgId,
            corrected_at: new Date().toISOString()
          }
        })
        .eq('id', wrongRelationship.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Failed to update relationship:', updateError)
      } else {
        console.log('✅ Updated relationship to Hair Talkz:', updatedRel.id)
      }
    }
    
    // Option 2: Create a new relationship if none exists for Hair Talkz
    const hairTalkzRelationship = allRelationships?.find(rel => rel.organization_id === hairTalkzOrgId)
    
    if (!hairTalkzRelationship) {
      console.log('Creating new Hair Talkz relationship...')
      
      const { data: newRel, error: newRelError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: hairTalkzOrgId,
          from_entity_id: micheleUserId,
          to_entity_id: hairTalkzOrgId,
          relationship_type: 'USER_MEMBER_OF_ORG',
          smart_code: 'HERA.ACCOUNTING.USER.MEMBERSHIP.v2',
          is_active: true,
          relationship_data: {
            role: 'owner',
            permissions: ['admin:full', 'salon:all'],
            primary_organization: true,
            created_for_fix: true
          }
        })
        .select()
        .single()
      
      if (newRelError) {
        console.error('❌ Failed to create Hair Talkz relationship:', newRelError)
      } else {
        console.log('✅ Created Hair Talkz relationship:', newRel.id)
      }
    } else {
      console.log('✅ Hair Talkz relationship already exists:', hairTalkzRelationship.id)
      
      // Make sure it's active and primary
      const { error: activateError } = await supabase
        .from('core_relationships')
        .update({
          is_active: true,
          relationship_data: {
            ...hairTalkzRelationship.relationship_data,
            primary_organization: true,
            role: 'owner',
            permissions: ['admin:full', 'salon:all']
          }
        })
        .eq('id', hairTalkzRelationship.id)
      
      if (activateError) {
        console.error('❌ Failed to activate Hair Talkz relationship:', activateError)
      } else {
        console.log('✅ Activated Hair Talkz relationship')
      }
    }
    
    // 6. Update Michele's user metadata to point to Hair Talkz
    console.log('\n6. Updating Michele\'s user metadata...')
    
    try {
      const { data: userUpdate, error: userUpdateError } = await supabase.auth.admin.updateUserById(
        micheleUserId,
        {
          user_metadata: {
            organization_id: hairTalkzOrgId,
            organization_name: 'Hair Talkz Salon',
            role: 'owner',
            corrected_from: wrongOrgId,
            corrected_at: new Date().toISOString()
          }
        }
      )
      
      if (userUpdateError) {
        console.error('❌ Failed to update user metadata:', userUpdateError)
      } else {
        console.log('✅ Updated user metadata to Hair Talkz')
      }
    } catch (error) {
      console.error('❌ Error updating user metadata:', error.message)
    }
    
    // 7. Ensure Michele has dynamic data in Hair Talkz org
    console.log('\n7. Ensuring Michele has dynamic data in Hair Talkz...')
    
    const dynamicDataEntries = [
      {
        organization_id: hairTalkzOrgId,
        entity_id: micheleUserId,
        field_name: 'role',
        field_type: 'text',
        field_value_text: 'owner',
        smart_code: 'HERA.ACCOUNTING.USER.ROLE.v2'
      },
      {
        organization_id: hairTalkzOrgId,
        entity_id: micheleUserId,
        field_name: 'salon_role',
        field_type: 'text',
        field_value_text: 'owner',
        smart_code: 'HERA.ACCOUNTING.USER.SALON_ROLE.v2'
      },
      {
        organization_id: hairTalkzOrgId,
        entity_id: micheleUserId,
        field_name: 'permissions',
        field_type: 'json',
        field_value_json: ['admin:full', 'salon:all', 'finance:all'],
        smart_code: 'HERA.ACCOUNTING.USER.PERMISSIONS.v2'
      }
    ]
    
    for (const entry of dynamicDataEntries) {
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .upsert(entry, {
          onConflict: 'organization_id,entity_id,field_name'
        })
      
      if (dynamicError) {
        console.error(`❌ Failed to create dynamic data ${entry.field_name}:`, dynamicError)
      } else {
        console.log(`✅ Created/updated dynamic data: ${entry.field_name}`)
      }
    }
    
    // 8. Verify the fix
    console.log('\n8. Verifying the fix...')
    
    const { data: finalRelationships, error: finalError } = await supabase
      .from('core_relationships')
      .select('id, organization_id, is_active, relationship_data')
      .eq('from_entity_id', micheleUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    console.log('Final organization memberships:')
    finalRelationships?.forEach(rel => {
      const isHairTalkz = rel.organization_id === hairTalkzOrgId
      console.log(`- ${rel.organization_id} ${isHairTalkz ? '(Hair Talkz ✅)' : '(Other)'}: ${rel.is_active ? 'Active' : 'Inactive'}`)
    })
    
    const hairTalkzMembership = finalRelationships?.find(rel => 
      rel.organization_id === hairTalkzOrgId && rel.is_active
    )
    
    if (hairTalkzMembership) {
      console.log('\n🎉 FIX SUCCESSFUL!')
      console.log('Michele now has active membership in Hair Talkz organization')
      console.log('Instructions for Michele:')
      console.log('1. Completely sign out and sign back in')
      console.log('2. Clear browser cache (Ctrl+Shift+F5)')
      console.log('3. Navigate to appointments, services, etc.')
      console.log('4. All Hair Talkz business data should now be visible')
    } else {
      console.log('❌ Fix incomplete - Hair Talkz membership not found or inactive')
    }
    
  } catch (error) {
    console.error('💥 Fix failed:', error)
  }
}

fixMicheleOrganizationMismatch().catch(console.error)