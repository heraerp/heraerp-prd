import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('=== FIXING HAIR TALKZ BRANCH RELATIONSHIPS ===')

async function fixBranchRelationships() {
  try {
    // Get the main branch
    const { data: branches } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'BRANCH')
      .limit(1)
    
    if (!branches?.length) {
      console.log('❌ No branch found. Please run restore-hair-talkz-branches.mjs first')
      return
    }
    
    const mainBranch = branches[0]
    console.log('✅ Found branch:', mainBranch.entity_name)
    
    console.log('\n1. Linking staff to branch...')
    
    // Get all staff members
    const { data: staff } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'STAFF')
    
    console.log('Found staff members:', staff?.length || 0)
    
    // Create MEMBER_OF relationships for staff (without metadata)
    for (const staffMember of staff || []) {
      const relationship = {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        from_entity_id: staffMember.id,
        to_entity_id: mainBranch.id,
        relationship_type: 'MEMBER_OF',
        smart_code: 'HERA.SALON.STAFF.BRANCH.MEMBER.V1'
      }
      
      const { error: relError } = await supabase
        .from('core_relationships')
        .insert(relationship)
      
      if (relError) {
        console.error(`❌ Failed to link ${staffMember.entity_name}:`, relError)
      } else {
        console.log(`✅ Linked ${staffMember.entity_name} to branch`)
      }
    }
    
    console.log('\n2. Linking services to branch...')
    
    // Get all services  
    const { data: services } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'SERVICE')
    
    console.log('Found services:', services?.length || 0)
    
    // Create AVAILABLE_AT relationships for services (without metadata)
    for (const service of services || []) {
      const relationship = {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        from_entity_id: service.id,
        to_entity_id: mainBranch.id,
        relationship_type: 'AVAILABLE_AT',
        smart_code: 'HERA.SALON.SERVICE.BRANCH.AVAILABLE.V1'
      }
      
      const { error: relError } = await supabase
        .from('core_relationships')
        .insert(relationship)
      
      if (relError) {
        console.error(`❌ Failed to link ${service.entity_name}:`, relError)
      } else {
        console.log(`✅ Linked ${service.entity_name} to branch`)
      }
    }
    
    console.log('\n3. Final verification...')
    
    const { data: memberRelations } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('organization_id', hairTalkzOrgId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('to_entity_id', mainBranch.id)
      
    const { data: availableRelations } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('organization_id', hairTalkzOrgId)
      .eq('relationship_type', 'AVAILABLE_AT')
      .eq('to_entity_id', mainBranch.id)
    
    console.log('\n📊 FINAL BRANCH RELATIONSHIPS SUMMARY:')
    console.log('======================================')
    console.log(`✅ Staff linked to branch: ${memberRelations?.length || 0}`)
    console.log(`✅ Services available at branch: ${availableRelations?.length || 0}`)
    console.log('')
    console.log('🎉 BRANCH RELATIONSHIPS RESTORED!')
    console.log('')
    console.log('📋 Michele can now:')
    console.log('  • Filter staff by branch location')
    console.log('  • View services available at the salon')
    console.log('  • Manage branch-specific operations')
    console.log('  • Track branch performance metrics')
    
  } catch (error) {
    console.error('💥 Branch relationship fix failed:', error)
  }
}

fixBranchRelationships().catch(console.error)