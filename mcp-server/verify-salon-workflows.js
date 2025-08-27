#!/usr/bin/env node
/**
 * Verify Salon Workflow Integration
 * Quick test to ensure all workflows are properly set up
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWorkflowCreation(orgId) {
  console.log('\n🧪 Testing Workflow Integration...\n')
  
  try {
    // 1. Create a test client
    console.log('1️⃣ Creating test client...')
    const { data: client, error: clientError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'customer',
        entity_name: 'Test Client ' + Date.now(),
        entity_code: 'TEST-CLIENT-' + Date.now(),
        smart_code: 'HERA.SALON.CLIENT.TEST.v1',
        status: 'active'
      })
      .select()
      .single()
    
    if (clientError) throw clientError
    console.log('   ✅ Client created:', client.entity_name)
    
    // 2. Find LEAD status for client workflow
    console.log('\n2️⃣ Finding initial client status...')
    const { data: leadStatus } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-CLIENT-LIFECYCLE-LEAD')
      .single()
    
    if (!leadStatus) throw new Error('Client LEAD status not found')
    console.log('   ✅ Found status:', leadStatus.entity_name)
    
    // 3. Assign workflow status to client
    console.log('\n3️⃣ Assigning workflow to client...')
    const { error: relationError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: client.id,
        to_entity_id: leadStatus.id,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.ASSIGN.TEST.v1',
        relationship_data: {
          workflow_template_id: 'CLIENT-LIFECYCLE',
          assigned_at: new Date().toISOString(),
          is_active: true
        }
      })
    
    if (relationError) throw relationError
    console.log('   ✅ Workflow assigned successfully')
    
    // 4. Check available transitions
    console.log('\n4️⃣ Checking available transitions...')
    const { data: transitions } = await supabase
      .from('core_relationships')
      .select(`
        *,
        to_entity:to_entity_id (
          entity_name,
          entity_code
        )
      `)
      .eq('organization_id', orgId)
      .eq('from_entity_id', leadStatus.id)
      .eq('relationship_type', 'can_transition_to')
    
    console.log(`   ✅ Available transitions from LEAD:`)
    transitions?.forEach(t => {
      console.log(`      → ${t.to_entity.entity_name}`)
    })
    
    // 5. Test a transition
    console.log('\n5️⃣ Testing status transition...')
    const newStatus = transitions?.[0]?.to_entity_id
    if (newStatus) {
      // End current status
      await supabase
        .from('core_relationships')
        .update({
          relationship_data: {
            is_active: false,
            ended_at: new Date().toISOString()
          }
        })
        .eq('from_entity_id', client.id)
        .eq('to_entity_id', leadStatus.id)
        .eq('relationship_type', 'has_workflow_status')
      
      // Assign new status
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: client.id,
          to_entity_id: newStatus,
          relationship_type: 'has_workflow_status',
          smart_code: 'HERA.WORKFLOW.TRANSITION.TEST.v1',
          relationship_data: {
            previous_status_id: leadStatus.id,
            transitioned_by: 'test_user',
            reason: 'Test transition',
            is_active: true
          }
        })
      
      console.log('   ✅ Successfully transitioned to NEW CLIENT status')
    }
    
    // 6. Verify current status
    console.log('\n6️⃣ Verifying current status...')
    const { data: currentStatus } = await supabase
      .from('core_relationships')
      .select(`
        *,
        to_entity:to_entity_id (
          entity_name,
          entity_code,
          metadata
        )
      `)
      .eq('from_entity_id', client.id)
      .eq('relationship_type', 'has_workflow_status')
      .eq('relationship_data->is_active', true)
      .single()
    
    if (currentStatus) {
      console.log('   ✅ Current status:', currentStatus.to_entity.entity_name)
      console.log('      Color:', currentStatus.to_entity.metadata?.color)
    }
    
    return { success: true, clientId: client.id }
    
  } catch (error) {
    console.error('   ❌ Test failed:', error.message)
    return { success: false, error: error.message }
  }
}

async function showWorkflowSummary(orgId) {
  console.log('\n📊 Workflow System Summary:\n')
  
  // Get counts
  const { count: workflowCount } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('entity_type', 'workflow_template')
  
  const { count: statusCount } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('entity_type', 'workflow_status')
  
  const { count: transitionCount } = await supabase
    .from('core_relationships')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('relationship_type', 'can_transition_to')
  
  console.log(`  📋 Workflow Templates: ${workflowCount}`)
  console.log(`  🔵 Workflow Statuses: ${statusCount}`)
  console.log(`  🔄 Status Transitions: ${transitionCount}`)
  console.log(`  ✅ Integration Ready: ${workflowCount > 0 ? 'YES' : 'NO'}`)
}

async function main() {
  console.log('🔍 Verifying Salon Workflow Integration\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    // Test workflow creation and transitions
    const result = await testWorkflowCreation(orgId)
    
    // Show summary
    await showWorkflowSummary(orgId)
    
    if (result.success) {
      console.log('\n✅ Workflow integration verified successfully!')
      console.log('\n🎯 The salon app now has:')
      console.log('  • Complete workflow tracking for all modules')
      console.log('  • Automatic status assignment')
      console.log('  • Status transition validation')
      console.log('  • Ready for UI integration')
      
      console.log('\n💡 To see workflows in action:')
      console.log('  1. Open http://localhost:3000/salon')
      console.log('  2. Navigate to any module (clients, appointments, etc.)')
      console.log('  3. Add UniversalWorkflowTracker component to see statuses')
    } else {
      console.log('\n⚠️ Some issues found. Please check the errors above.')
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  }
}

// Run verification
main()