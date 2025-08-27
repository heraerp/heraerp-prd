#!/usr/bin/env node
/**
 * Fix Appointment Integration
 * Updates existing appointments to have proper workflow integration
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

async function analyzeCurrentState(orgId) {
  console.log('\n📊 Analyzing Current Appointment State...\n')
  
  // Count appointments
  const { count: appointmentCount } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('transaction_type', 'appointment')
  
  console.log(`Total appointments: ${appointmentCount}`)
  
  // Check how many have proper client entities
  const { data: appointmentsWithClients } = await supabase
    .from('universal_transactions')
    .select('id')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'appointment')
    .not('source_entity_id', 'is', null)
  
  console.log(`Appointments with client entities: ${appointmentsWithClients?.length || 0}`)
  
  // Check how many have workflow status
  const { data: appointmentIds } = await supabase
    .from('universal_transactions')
    .select('id')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'appointment')
  
  let withWorkflow = 0
  for (const apt of appointmentIds || []) {
    const { data: status } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('from_entity_id', apt.id)
      .eq('relationship_type', 'has_workflow_status')
      .limit(1)
    
    if (status && status.length > 0) withWorkflow++
  }
  
  console.log(`Appointments with workflow status: ${withWorkflow}`)
  
  return {
    total: appointmentCount,
    withClients: appointmentsWithClients?.length || 0,
    withWorkflow: withWorkflow
  }
}

async function fixAppointmentIntegration(orgId, appointment) {
  const fixes = []
  
  // 1. Check if client entity exists
  if (!appointment.source_entity_id) {
    // Extract client info from metadata
    const clientName = appointment.metadata?.customer_name || 'Unknown Client'
    const clientPhone = appointment.metadata?.customer_phone
    const clientEmail = appointment.metadata?.customer_email
    
    if (clientName !== 'Unknown Client') {
      // Create client entity
      const { data: client } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'customer',
          entity_name: clientName,
          entity_code: `CLIENT-FIX-${Date.now()}`,
          smart_code: 'HERA.SALON.CLIENT.FIXED.v1',
          metadata: {
            created_from: 'appointment_fix',
            original_appointment: appointment.id
          }
        })
        .select()
        .single()
      
      if (client) {
        // Add contact info
        if (clientPhone) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgId,
              entity_id: client.id,
              field_name: 'phone',
              field_type: 'text',
              field_value_text: clientPhone,
              smart_code: 'HERA.SALON.CLIENT.PHONE.v1'
            })
        }
        
        // Update appointment to link to client
        await supabase
          .from('universal_transactions')
          .update({ source_entity_id: client.id })
          .eq('id', appointment.id)
        
        fixes.push(`Created client entity: ${clientName}`)
        
        // Assign client workflow
        const { data: leadStatus } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', orgId)
          .eq('entity_code', 'STATUS-CLIENT-LIFECYCLE-ACTIVE')
          .single()
        
        if (leadStatus) {
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: orgId,
              from_entity_id: client.id,
              to_entity_id: leadStatus.id,
              relationship_type: 'has_workflow_status',
              smart_code: 'HERA.WORKFLOW.CLIENT.FIX.v1',
              relationship_data: {
                is_active: true,
                assigned_by: 'fix_script'
              }
            })
          fixes.push(`Assigned client workflow`)
        }
      }
    }
  }
  
  // 2. Check if appointment has workflow status
  const { data: currentStatus } = await supabase
    .from('core_relationships')
    .select('id')
    .eq('from_entity_id', appointment.id)
    .eq('relationship_type', 'has_workflow_status')
    .limit(1)
  
  if (!currentStatus || currentStatus.length === 0) {
    // Determine appropriate status based on appointment data
    let statusCode = 'STATUS-APPOINTMENT-SCHEDULED'
    
    if (appointment.metadata?.status === 'completed' || 
        appointment.transaction_status === 'completed') {
      statusCode = 'STATUS-APPOINTMENT-COMPLETED'
    } else if (appointment.transaction_status === 'cancelled') {
      statusCode = 'STATUS-APPOINTMENT-CANCELLED'
    }
    
    const { data: workflowStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_code', statusCode)
      .single()
    
    if (workflowStatus) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: appointment.id,
          to_entity_id: workflowStatus.id,
          relationship_type: 'has_workflow_status',
          smart_code: 'HERA.WORKFLOW.APPOINTMENT.FIX.v1',
          relationship_data: {
            is_active: true,
            assigned_by: 'fix_script',
            assigned_at: new Date().toISOString()
          }
        })
      fixes.push(`Assigned appointment workflow status: ${statusCode}`)
    }
  }
  
  return fixes
}

async function main() {
  console.log('🔧 Fixing Appointment Integration\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    // Analyze current state
    const before = await analyzeCurrentState(orgId)
    
    console.log('\n🔄 Fixing appointments...\n')
    
    // Get all appointments without proper integration
    const { data: appointments } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('transaction_type', 'appointment')
      .or('source_entity_id.is.null')
      .limit(10) // Fix 10 at a time
    
    let totalFixes = 0
    for (const appointment of appointments || []) {
      console.log(`Fixing appointment: ${appointment.transaction_code}`)
      const fixes = await fixAppointmentIntegration(orgId, appointment)
      
      if (fixes.length > 0) {
        fixes.forEach(fix => console.log(`  ✓ ${fix}`))
        totalFixes += fixes.length
      } else {
        console.log('  ✓ No fixes needed')
      }
    }
    
    // Show results
    console.log('\n📊 Fix Summary:')
    console.log(`  Appointments processed: ${appointments?.length || 0}`)
    console.log(`  Fixes applied: ${totalFixes}`)
    
    // Re-analyze
    console.log('\n📊 After Fix Analysis:')
    const after = await analyzeCurrentState(orgId)
    
    console.log('\n✅ Integration improvements:')
    console.log(`  Client entities: ${before.withClients} → ${after.withClients}`)
    console.log(`  Workflow status: ${before.withWorkflow} → ${after.withWorkflow}`)
    
    if (after.withClients < after.total || after.withWorkflow < after.total) {
      console.log('\n💡 Note: Some appointments may need manual review.')
      console.log('   Run this script again to fix more appointments.')
    }
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error)
    process.exit(1)
  }
}

main()