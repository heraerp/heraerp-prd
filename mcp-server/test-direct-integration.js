#!/usr/bin/env node
/**
 * Test the Integrated Appointment Function Directly
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

// Import universalApi
const { universalApi } = require('../src/lib/universal-api')

async function testDirectIntegration() {
  console.log('🧪 Testing Direct Integration (Without API)\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  
  // Set organization context
  universalApi.setOrganizationId(orgId)
  
  try {
    // 1. Get a service and stylist to use
    const { data: service } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'service')
      .limit(1)
      .single()
    
    const { data: stylist } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'employee')
      .limit(1)
      .single()
    
    if (!service || !stylist) {
      console.error('❌ No service or stylist found. Run setup scripts first.')
      process.exit(1)
    }
    
    console.log(`Service: ${service.entity_name}`)
    console.log(`Stylist: ${stylist.entity_name}`)
    
    // 2. Create appointment using integrated approach
    const clientData = {
      name: 'Isabella Rodriguez',
      phone: '555-0177',
      email: 'isabella@example.com'
    }
    
    console.log(`\nClient: ${clientData.name}`)
    
    // Find or create client
    let clientId
    const { data: existingClient } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'customer')
      .eq('entity_name', clientData.name)
      .single()
    
    if (existingClient) {
      clientId = existingClient.id
      console.log('Found existing client')
    } else {
      // Create client entity
      const newClient = await universalApi.createEntity({
        entity_type: 'customer',
        entity_name: clientData.name,
        entity_code: `CLIENT-${Date.now()}`,
        smart_code: 'HERA.SALON.CLIENT.v1'
      })
      clientId = newClient.id
      console.log('Created new client entity')
      
      // Add contact info
      await universalApi.setDynamicField(clientId, 'phone', clientData.phone)
      await universalApi.setDynamicField(clientId, 'email', clientData.email)
    }
    
    // Create appointment
    const appointment = await universalApi.createTransaction({
      transaction_type: 'appointment',
      transaction_code: `APT-${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      source_entity_id: clientId,
      target_entity_id: stylist.id,
      total_amount: service.metadata?.price || 75,
      smart_code: 'HERA.SALON.APPOINTMENT.v1',
      metadata: {
        service_id: service.id,
        service_name: service.entity_name,
        appointment_time: '16:00',
        duration: 60
      }
    })
    
    console.log('\n✅ Appointment created with ID:', appointment.id)
    
    // 3. Verify the integration
    console.log('\n🔍 Verifying Integration:')
    
    // Check relationships
    const { data: fullAppointment } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        client:source_entity_id(entity_name, entity_type),
        stylist:target_entity_id(entity_name, entity_type)
      `)
      .eq('id', appointment.id)
      .single()
    
    console.log('✅ Client relationship:', fullAppointment.client?.entity_name)
    console.log('✅ Stylist relationship:', fullAppointment.stylist?.entity_name)
    
    // Assign workflow manually for now
    console.log('\n📋 Assigning Workflow Status...')
    
    const { data: scheduledStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-APPOINTMENT-SCHEDULED')
      .single()
    
    if (scheduledStatus) {
      await universalApi.createRelationship({
        from_entity_id: appointment.id,
        to_entity_id: scheduledStatus.id,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.APPOINTMENT.ASSIGN.v1',
        relationship_data: {
          is_active: true,
          assigned_at: new Date().toISOString()
        }
      })
      console.log('✅ Appointment status set to SCHEDULED')
    }
    
    console.log('\n🎉 Integration test successful!')
    console.log('This demonstrates TRUE HERA integration with:')
    console.log('- Client as entity (not metadata)')
    console.log('- Proper entity relationships')
    console.log('- Workflow status via relationships')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
}

// Run the test
testDirectIntegration()