import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function debugAuthFlow() {
  console.log('=== DEBUGGING MICHELE AUTH FLOW ===')
  
  const micheleUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674'
  const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  // 1. Check the actual relationship that exists
  console.log('1. Checking existing relationship...')
  const { data: relationship, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', micheleUserId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
  console.log('Relationship query result:', { 
    count: relationship?.length || 0,
    data: relationship, 
    error: relError 
  })
  
  // 2. Test the EXACT query used by user-entity-resolver.ts
  console.log('\n2. Testing exact resolver query...')
  const { data: resolverQuery, error: resolverError } = await supabase
    .from('core_relationships')
    .select('to_entity_id, organization_id')
    .eq('from_entity_id', micheleUserId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .maybeSingle()
    
  console.log('Resolver query result:', { data: resolverQuery, error: resolverError })
  
  // 3. Check dynamic data for Michele
  console.log('\n3. Checking dynamic data...')
  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text, field_value_json, field_type, smart_code')
    .eq('entity_id', micheleUserId)
    .eq('organization_id', hairTalkzOrgId)
    
  console.log('Dynamic data result:', { 
    count: dynamicData?.length || 0, 
    data: dynamicData,
    error: dynamicError 
  })
  
  // 4. Test if we can access the relationship without RLS context
  console.log('\n4. Testing relationship access without filters...')
  const { data: allRelationships, error: allRelError } = await supabase
    .from('core_relationships')
    .select('from_entity_id, to_entity_id, relationship_type, organization_id')
    .eq('from_entity_id', micheleUserId)
    
  console.log('All relationships for Michele:', { 
    count: allRelationships?.length || 0,
    data: allRelationships,
    error: allRelError 
  })
  
  // 5. Check if Hair Talkz organization exists
  console.log('\n5. Checking Hair Talkz organization...')
  const { data: organization, error: orgError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', hairTalkzOrgId)
    .eq('entity_type', 'organization')
    .maybeSingle()
    
  console.log('Hair Talkz organization:', { data: organization, error: orgError })
  
  // 6. Simulate the exact resolver function logic
  console.log('\n6. Simulating full resolver logic...')
  
  if (resolverQuery && resolverQuery.organization_id) {
    console.log('✅ Relationship found:', {
      organizationId: resolverQuery.organization_id,
      toEntityId: resolverQuery.to_entity_id
    })
    
    // Build dynamic data map
    const dynamicDataMap = {}
    dynamicData?.forEach(field => {
      const value = field.field_type === 'json' ? field.field_value_json : field.field_value_text
      dynamicDataMap[field.field_name] = {
        value,
        type: field.field_type,
        smart_code: field.smart_code
      }
    })
    
    const salonRole = dynamicDataMap.salon_role?.value || 'user'
    const permissions = dynamicDataMap.permissions?.value || []
    
    console.log('✅ Resolver would return:', {
      success: true,
      data: {
        userId: micheleUserId,
        organizationId: resolverQuery.organization_id,
        entityId: micheleUserId,
        salonRole,
        permissions: Array.isArray(permissions) ? permissions : [],
        dynamicDataMap
      }
    })
  } else {
    console.log('❌ Resolver would fail: No relationship found')
  }
}

debugAuthFlow().catch(console.error)