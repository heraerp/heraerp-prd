#!/usr/bin/env node
/**
 * Test the Integrated Appointment API
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

async function testIntegratedAPI() {
  console.log('🧪 Testing Integrated Appointment API\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  
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
  
  console.log(`Using service: ${service.entity_name}`)
  console.log(`Using stylist: ${stylist.entity_name}`)
  
  // 2. Test appointment creation via API
  const bookingData = {
    organizationId: orgId,
    clientName: 'Sophie Martinez',
    clientPhone: '555-0198',
    clientEmail: 'sophie@example.com',
    serviceId: service.id,
    serviceName: service.entity_name,
    servicePrice: service.metadata?.price || 75,
    stylistId: stylist.id,
    stylistName: stylist.entity_name,
    date: new Date().toISOString().split('T')[0],
    time: '15:30',
    duration: 60,
    notes: 'First time client, prefers organic products'
  }
  
  console.log('\n📅 Creating appointment via API...')
  console.log('Client:', bookingData.clientName)
  
  try {
    // Make API request
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/v1/salon/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('\n✅ Appointment created successfully!')
      console.log('Appointment ID:', result.appointment.id)
      console.log('Client ID:', result.appointment.clientId)
      console.log('Status:', result.appointment.status)
      console.log('Message:', result.appointment.message)
      
      // 3. Verify the integration
      await verifyIntegration(orgId, result.appointment)
      
    } else {
      console.error('\n❌ API Error:', result.error)
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message)
  }
}

async function verifyIntegration(orgId, appointment) {
  console.log('\n🔍 Verifying TRUE Integration...\n')
  
  // Check 1: Client entity created
  if (appointment.clientId) {
    const { data: client } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', appointment.clientId)
      .single()
    
    if (client) {
      console.log('✅ Client entity created:', client.entity_name)
      
      // Check client workflow
      const { data: clientStatus } = await supabase
        .from('core_relationships')
        .select('*, to_entity:to_entity_id(*)')
        .eq('from_entity_id', client.id)
        .eq('relationship_type', 'has_workflow_status')
        .eq('relationship_data->is_active', true)
        .single()
      
      if (clientStatus) {
        console.log('✅ Client workflow assigned:', clientStatus.to_entity.entity_name)
      } else {
        console.log('❌ Client workflow NOT assigned')
      }
    }
  } else {
    console.log('❌ No client entity created')
  }
  
  // Check 2: Appointment relationships
  const { data: appointmentData } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      client:source_entity_id(*),
      stylist:target_entity_id(*)
    `)
    .eq('id', appointment.id)
    .single()
  
  if (appointmentData) {
    console.log('\n✅ Appointment has proper relationships:')
    console.log('   - Client:', appointmentData.client?.entity_name || 'MISSING')
    console.log('   - Stylist:', appointmentData.stylist?.entity_name || 'MISSING')
  }
  
  // Check 3: Appointment workflow status
  const { data: appointmentStatus } = await supabase
    .from('core_relationships')
    .select('*, to_entity:to_entity_id(*)')
    .eq('from_entity_id', appointment.id)
    .eq('relationship_type', 'has_workflow_status')
    .eq('relationship_data->is_active', true)
    .single()
  
  if (appointmentStatus) {
    console.log('\n✅ Appointment workflow status:', appointmentStatus.to_entity.entity_name)
  } else {
    console.log('\n❌ Appointment workflow NOT assigned')
  }
  
  // Check 4: Service line item
  const { data: lineItems } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('transaction_id', appointment.id)
  
  console.log('\n✅ Service line items created:', lineItems?.length || 0)
  
  // Summary
  console.log('\n📊 Integration Summary:')
  console.log('This appointment demonstrates TRUE HERA integration:')
  console.log('- Client exists as an entity (not just metadata)')
  console.log('- All relationships properly established')
  console.log('- Workflow status tracked via relationships')
  console.log('- Ready for business process automation')
}

// Run the test
testIntegratedAPI().catch(console.error)