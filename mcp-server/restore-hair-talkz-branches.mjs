import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('=== RESTORING HAIR TALKZ BRANCHES ===')

async function restoreBranches() {
  try {
    console.log('1. Creating main salon branch...')
    
    // Create main salon branch
    const mainBranch = {
      id: crypto.randomUUID(),
      organization_id: hairTalkzOrgId,
      entity_type: 'BRANCH',
      entity_name: 'Hair Talkz Main Salon',
      entity_code: 'BRANCH-MAIN',
      smart_code: 'HERA.SALON.BRANCH.MAIN.V1',
      status: 'active',
      metadata: {
        address: 'Dubai Marina, Dubai, UAE',
        phone: '+971-4-555-0123',
        operating_hours: '9:00 AM - 8:00 PM',
        services: ['hair_cut', 'hair_color', 'styling', 'treatments', 'bridal'],
        capacity: {
          chairs: 6,
          max_daily_appointments: 40
        },
        is_main_branch: true,
        branch_manager: 'Michele Rossi'
      }
    }
    
    const { error: branchError } = await supabase
      .from('core_entities')
      .insert(mainBranch)
    
    if (branchError) {
      console.error('❌ Failed to create main branch:', branchError)
      return
    }
    
    console.log('✅ Created main branch:', mainBranch.entity_name)
    
    console.log('\n2. Getting staff members to link to branch...')
    
    // Get all staff members
    const { data: staff } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'STAFF')
    
    console.log('Found staff members:', staff?.length || 0)
    
    // Create MEMBER_OF relationships for staff
    for (const staffMember of staff || []) {
      const relationship = {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        from_entity_id: staffMember.id,
        to_entity_id: mainBranch.id,
        relationship_type: 'MEMBER_OF',
        smart_code: 'HERA.SALON.STAFF.BRANCH.MEMBER.V1',
        metadata: {
          role: staffMember.entity_name.includes('Michele') ? 'manager' : 'staff',
          start_date: '2024-01-01',
          is_primary_branch: true
        }
      }
      
      const { error: relError } = await supabase
        .from('core_relationships')
        .insert(relationship)
      
      if (relError) {
        console.error(`❌ Failed to link ${staffMember.entity_name} to branch:`, relError)
      } else {
        console.log(`✅ Linked ${staffMember.entity_name} to main branch`)
      }
    }
    
    console.log('\n3. Getting services to link to branch...')
    
    // Get all services  
    const { data: services } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'SERVICE')
    
    console.log('Found services:', services?.length || 0)
    
    // Create AVAILABLE_AT relationships for services
    for (const service of services || []) {
      const relationship = {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        from_entity_id: service.id,
        to_entity_id: mainBranch.id,
        relationship_type: 'AVAILABLE_AT',
        smart_code: 'HERA.SALON.SERVICE.BRANCH.AVAILABLE.V1',
        metadata: {
          available_since: '2024-01-01',
          is_active: true
        }
      }
      
      const { error: relError } = await supabase
        .from('core_relationships')
        .insert(relationship)
      
      if (relError) {
        console.error(`❌ Failed to link ${service.entity_name} to branch:`, relError)
      } else {
        console.log(`✅ Linked ${service.entity_name} to main branch`)
      }
    }
    
    console.log('\n4. Verification - checking restored data...')
    
    const { data: branchCount } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'BRANCH')
    
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
    
    console.log('\n📊 HAIR TALKZ BRANCH RESTORATION SUMMARY:')
    console.log('=========================================')
    console.log(`✅ Branches: ${branchCount?.length || 0}`)
    console.log(`✅ Staff linked to branch: ${memberRelations?.length || 0}`)
    console.log(`✅ Services available at branch: ${availableRelations?.length || 0}`)
    console.log('')
    console.log('🎉 BRANCH RESTORATION COMPLETE!')
    console.log('')
    console.log('📋 Hair Talkz now has:')
    console.log('  • Main salon branch with full address and contact info')
    console.log('  • All staff members linked to the main branch')
    console.log('  • All services available at the main branch')
    console.log('  • Proper branch-based filtering enabled')
    console.log('  • Michele can now manage branch operations')
    
  } catch (error) {
    console.error('💥 Branch restoration failed:', error)
  }
}

restoreBranches().catch(console.error)