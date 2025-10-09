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

async function verifyExistingRelationship() {
  console.log('=== VERIFYING EXISTING RELATIONSHIP ===')
  
  const micheleUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674'
  const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  try {
    // Check if the relationship exists using service role (bypasses RLS)
    console.log('1. Checking relationship with service role (bypasses RLS)...')
    const { data: serviceRoleQuery, error: serviceError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', micheleUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    console.log('Service role query result:', { 
      count: serviceRoleQuery?.length || 0,
      data: serviceRoleQuery,
      error: serviceError 
    })
    
    if (serviceRoleQuery && serviceRoleQuery.length > 0) {
      const relationship = serviceRoleQuery[0]
      console.log('✅ Relationship exists:', {
        id: relationship.id,
        from_entity_id: relationship.from_entity_id,
        to_entity_id: relationship.to_entity_id,
        organization_id: relationship.organization_id,
        smart_code: relationship.smart_code,
        status: relationship.status,
        is_active: relationship.is_active
      })
      
      // Check if the relationship is active
      if (!relationship.is_active) {
        console.log('⚠️  Relationship exists but is INACTIVE. Activating...')
        const { data: updateResult, error: updateError } = await supabase
          .from('core_relationships')
          .update({ is_active: true })
          .eq('id', relationship.id)
          .select()
        
        if (updateError) {
          console.error('❌ Failed to activate relationship:', updateError)
        } else {
          console.log('✅ Relationship activated successfully')
        }
      }
      
      // Check if the relationship has a valid smart_code
      if (!relationship.smart_code) {
        console.log('⚠️  Relationship has no smart_code. Adding one...')
        const { data: updateResult, error: updateError } = await supabase
          .from('core_relationships')
          .update({ smart_code: 'HERA.ACCOUNTING.USER.MEMBERSHIP.v2' })
          .eq('id', relationship.id)
          .select()
        
        if (updateError) {
          console.error('❌ Failed to add smart_code:', updateError)
        } else {
          console.log('✅ Smart code added successfully')
        }
      }
    }
    
    // Now test with anon key (like the client uses)
    console.log('\n2. Testing with anon key (like the client)...')
    
    const anonSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    const { data: anonQuery, error: anonError } = await anonSupabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', micheleUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle()
    
    console.log('Anon key query result:', { data: anonQuery, error: anonError })
    
    if (!anonQuery && !anonError) {
      console.log('🔍 RLS is blocking the relationship query. Checking RLS policies...')
      
      // Check RLS policies
      const { data: policies, error: policyError } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'core_relationships')
      
      console.log('RLS policies:', { count: policies?.length || 0, error: policyError })
      
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`- Policy: ${policy.policy_name} (${policy.command}) - ${policy.definition}`)
        })
      }
    }
    
    // Check dynamic data
    console.log('\n3. Checking dynamic data...')
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type')
      .eq('entity_id', micheleUserId)
      .eq('organization_id', hairTalkzOrgId)
    
    console.log('Dynamic data:', { 
      count: dynamicData?.length || 0,
      data: dynamicData,
      error: dynamicError 
    })
    
    if (!dynamicData || dynamicData.length === 0) {
      console.log('Creating missing dynamic data...')
      const { data: newDynamicData, error: newDynamicError } = await supabase
        .from('core_dynamic_data')
        .insert([
          {
            organization_id: hairTalkzOrgId,
            entity_id: micheleUserId,
            field_name: 'salon_role',
            field_type: 'text',
            field_value_text: 'owner'
          },
          {
            organization_id: hairTalkzOrgId,
            entity_id: micheleUserId,
            field_name: 'permissions',
            field_type: 'json',
            field_value_json: ['salon:all', 'admin:full', 'finance:all']
          }
        ])
        .select()
      
      if (newDynamicError) {
        console.error('❌ Failed to create dynamic data:', newDynamicError)
      } else {
        console.log('✅ Dynamic data created:', newDynamicData.length, 'fields')
      }
    }
    
    console.log('\n=== SUMMARY ===')
    console.log('Relationship exists:', serviceRoleQuery && serviceRoleQuery.length > 0)
    console.log('Accessible via anon key:', !!anonQuery)
    console.log('Dynamic data exists:', dynamicData && dynamicData.length > 0)
    
    if (serviceRoleQuery && serviceRoleQuery.length > 0 && !anonQuery) {
      console.log('\n🔧 ISSUE: Relationship exists but RLS is blocking client access')
      console.log('SOLUTION: Check RLS policies or use auth context in queries')
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error)
  }
}

verifyExistingRelationship().catch(console.error)