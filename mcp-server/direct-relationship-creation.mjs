import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use service role key to bypass RLS
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

async function createRelationshipDirectly() {
  console.log('=== DIRECT RELATIONSHIP CREATION ===')
  
  const micheleUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674'
  const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  try {
    // First, check if Hair Talkz organization exists in core_entities
    console.log('1. Checking Hair Talkz organization entity...')
    const { data: orgEntity, error: orgError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', hairTalkzOrgId)
      .maybeSingle()
    
    if (!orgEntity) {
      console.log('Creating Hair Talkz organization entity...')
      const { data: newOrg, error: newOrgError } = await supabase
        .from('core_entities')
        .insert({
          id: hairTalkzOrgId,
          organization_id: hairTalkzOrgId,
          entity_type: 'organization',
          entity_name: 'Hair Talkz Salon',
          entity_code: 'ORG-HAIR-TALKZ',
          status: 'active',
          smart_code: null, // Will be null since constraints are relaxed
          metadata: {
            industry: 'beauty_services',
            type: 'salon',
            created_for: 'emergency_restoration'
          }
        })
        .select()
        .single()
      
      if (newOrgError) {
        console.error('❌ Failed to create organization entity:', newOrgError)
        return
      }
      console.log('✅ Organization entity created')
    } else {
      console.log('✅ Organization entity exists')
    }
    
    // Create the USER_MEMBER_OF_ORG relationship without smart code constraints
    console.log('2. Creating USER_MEMBER_OF_ORG relationship...')
    
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: hairTalkzOrgId,
        from_entity_id: micheleUserId,
        to_entity_id: hairTalkzOrgId,
        relationship_type: 'USER_MEMBER_OF_ORG',
        smart_code: null, // No smart code due to constraints
        relationship_data: {
          role: 'owner',
          permissions: ['salon:all'],
          created_by: 'emergency_direct_creation',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    if (relError) {
      console.error('❌ Failed to create relationship:', relError)
      
      // If it fails due to constraints, try to work around them
      if (relError.message.includes('smart_code')) {
        console.log('Attempting to work around smart code constraints...')
        
        // Try with a compliant smart code
        const { data: relationship2, error: relError2 } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: hairTalkzOrgId,
            from_entity_id: micheleUserId,
            to_entity_id: hairTalkzOrgId,
            relationship_type: 'USER_MEMBER_OF_ORG',
            smart_code: 'HERA.ACCOUNTING.USER.MEMBERSHIP.v2', // Use v2 format
            relationship_data: {
              role: 'owner',
              permissions: ['salon:all'],
              created_by: 'emergency_direct_creation_v2',
              created_at: new Date().toISOString()
            }
          })
          .select()
          .single()
        
        if (relError2) {
          console.error('❌ Failed with v2 smart code too:', relError2)
          return
        }
        
        console.log('✅ Relationship created with v2 smart code:', relationship2.id)
      } else {
        return
      }
    } else {
      console.log('✅ Relationship created successfully:', relationship.id)
    }
    
    // Create dynamic data for Michele
    console.log('3. Creating dynamic data for Michele...')
    
    const dynamicFields = [
      {
        organization_id: hairTalkzOrgId,
        entity_id: micheleUserId,
        field_name: 'salon_role',
        field_type: 'text',
        field_value_text: 'owner',
        field_value_json: null,
        smart_code: null
      },
      {
        organization_id: hairTalkzOrgId,
        entity_id: micheleUserId,
        field_name: 'permissions',
        field_type: 'json',
        field_value_text: null,
        field_value_json: ['salon:all', 'admin:full', 'finance:all'],
        smart_code: null
      }
    ]
    
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicFields)
      .select()
    
    if (dynamicError) {
      console.error('❌ Failed to create dynamic data:', dynamicError)
    } else {
      console.log('✅ Dynamic data created:', dynamicData.length, 'fields')
    }
    
    // Test the authentication query
    console.log('4. Testing authentication query...')
    
    const { data: testQuery, error: testError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', micheleUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle()
    
    if (testError || !testQuery) {
      console.error('❌ Authentication test failed:', testError)
      return
    }
    
    console.log('✅ Authentication test passed!')
    console.log('Michele should now be able to authenticate.')
    console.log('Organization ID:', testQuery.organization_id)
    
  } catch (error) {
    console.error('💥 Direct creation failed:', error)
  }
}

createRelationshipDirectly().catch(console.error)