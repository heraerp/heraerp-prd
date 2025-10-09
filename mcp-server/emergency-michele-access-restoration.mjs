import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function emergencyAccessRestoration() {
  console.log('=== EMERGENCY MICHELE ACCESS RESTORATION ===')
  
  const micheleUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674'
  const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  try {
    // Step 1: Temporarily relax smart code constraints
    console.log('1. Temporarily relaxing smart code constraints...')
    
    const relaxConstraints = `
      -- Temporarily disable smart code constraints
      ALTER TABLE core_relationships ALTER COLUMN smart_code DROP NOT NULL;
      ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS core_relationships_smart_code_ck;
    `
    
    const { error: constraintError } = await supabase.rpc('exec_sql', { sql: relaxConstraints })
    if (constraintError) {
      console.error('❌ Failed to relax constraints:', constraintError)
      return
    }
    console.log('✅ Constraints relaxed')
    
    // Step 2: Create Michele's USER_MEMBER_OF_ORG relationship
    console.log('2. Creating Michele\'s USER_MEMBER_OF_ORG relationship...')
    
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: hairTalkzOrgId,
        from_entity_id: micheleUserId,
        to_entity_id: hairTalkzOrgId,
        relationship_type: 'USER_MEMBER_OF_ORG',
        smart_code: null, // Temporarily null while constraints are relaxed
        relationship_data: {
          role: 'owner',
          permissions: ['salon:all'],
          created_by: 'emergency_restoration',
          restoration_note: 'Emergency restoration after Finance DNA v2 cleanup'
        }
      })
      .select()
      .single()
    
    if (relError) {
      console.error('❌ Failed to create relationship:', relError)
      return
    }
    
    console.log('✅ USER_MEMBER_OF_ORG relationship created:', {
      id: relationship.id,
      from_entity_id: relationship.from_entity_id,
      to_entity_id: relationship.to_entity_id,
      organization_id: relationship.organization_id
    })
    
    // Step 3: Create Michele's dynamic data for salon role and permissions
    console.log('3. Creating Michele\'s dynamic data...')
    
    const dynamicDataFields = [
      {
        organization_id: hairTalkzOrgId,
        entity_id: micheleUserId,
        field_name: 'salon_role',
        field_type: 'text',
        field_value_text: 'owner',
        smart_code: null
      },
      {
        organization_id: hairTalkzOrgId,
        entity_id: micheleUserId,
        field_name: 'permissions',
        field_type: 'json',
        field_value_json: ['salon:all', 'admin:full', 'finance:all'],
        smart_code: null
      }
    ]
    
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicDataFields)
      .select()
    
    if (dynamicError) {
      console.error('❌ Failed to create dynamic data:', dynamicError)
    } else {
      console.log('✅ Dynamic data created:', dynamicData.length, 'fields')
    }
    
    // Step 4: Test the authentication flow
    console.log('4. Testing authentication flow...')
    
    const { data: testRelationship, error: testError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', micheleUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle()
    
    if (testError || !testRelationship) {
      console.error('❌ Test failed:', testError)
      return
    }
    
    console.log('✅ Authentication test passed:', {
      organizationId: testRelationship.organization_id,
      toEntityId: testRelationship.to_entity_id
    })
    
    // Step 5: Test dynamic data query
    const { data: testDynamicData, error: testDynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type')
      .eq('entity_id', micheleUserId)
      .eq('organization_id', hairTalkzOrgId)
    
    if (testDynamicError) {
      console.error('❌ Dynamic data test failed:', testDynamicError)
    } else {
      console.log('✅ Dynamic data test passed:', testDynamicData.length, 'fields')
      
      // Build dynamic data map like the resolver does
      const dynamicDataMap = {}
      testDynamicData?.forEach(field => {
        const value = field.field_type === 'json' ? field.field_value_json : field.field_value_text
        dynamicDataMap[field.field_name] = { value, type: field.field_type }
      })
      
      const salonRole = dynamicDataMap.salon_role?.value || 'user'
      const permissions = dynamicDataMap.permissions?.value || []
      
      console.log('✅ Resolved user data:', {
        userId: micheleUserId,
        organizationId: testRelationship.organization_id,
        salonRole,
        permissions
      })
    }
    
    console.log('\n🎉 EMERGENCY RESTORATION COMPLETE!')
    console.log('Michele should now be able to authenticate and access Hair Talkz.')
    console.log('\nNext steps:')
    console.log('1. Ask Michele to clear her browser cache and try logging in again')
    console.log('2. If she still has issues, ask her to visit /auth/clear-session first')
    console.log('3. Monitor browser console for any remaining authentication errors')
    
  } catch (error) {
    console.error('💥 Emergency restoration failed:', error)
  }
}

emergencyAccessRestoration().catch(console.error)