#!/usr/bin/env node
/**
 * E2E Test Script for Eventbrite Integration
 * 
 * Usage:
 *   npm run test:eventbrite
 * 
 * This script tests the complete Eventbrite integration flow:
 * 1. Configure connector
 * 2. Test connection
 * 3. Create sync job
 * 4. Trigger sync
 * 5. Verify data ingestion
 */

// Set environment to use mock mode for testing
process.env.USE_MOCK_API = 'true'

const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runTest() {
  console.log('🧪 Starting Eventbrite Integration E2E Test\n')
  
  try {
    // Import after setting mock mode
    const { universalApi } = await import('../src/lib/universal-api')
    
    // Set organization context
    universalApi.setOrganizationId(DEMO_ORG_ID)
    console.log('✅ Using demo organization:', DEMO_ORG_ID)

    // Step 1: Create Eventbrite connector
    console.log('\n📌 Step 1: Creating Eventbrite connector...')
    
    const connectorResult = await universalApi.createEntity({
      entity_type: 'integration_connector',
      entity_name: 'Eventbrite - Demo',
      entity_code: 'CONN-EVENTBRITE-DEMO',
      smart_code: 'HERA.INTEGRATIONS.CONNECTOR.EVENTBRITE.v1',
      organization_id: DEMO_ORG_ID,
      metadata: {
        vendor: 'eventbrite',
        status: 'active'
      }
    })

    if (!connectorResult.success) {
      throw new Error('Failed to create connector')
    }

    const connectorId = connectorResult.data.id
    console.log('✅ Connector created:', connectorId)

    // Set connector configuration
    await Promise.all([
      universalApi.setDynamicField(connectorId, 'connector_type', 'eventbrite', 'text'),
      universalApi.setDynamicField(connectorId, 'status', 'active', 'text'),
      universalApi.setDynamicField(connectorId, 'api_endpoint', 'https://www.eventbriteapi.com/v3', 'text'),
      universalApi.setDynamicField(connectorId, 'auth_type', 'oauth2', 'text'),
      universalApi.setDynamicField(connectorId, 'configuration', JSON.stringify({
        apiToken: 'demo-token'
      }), 'text'),
      universalApi.setDynamicField(connectorId, 'vendor', 'eventbrite', 'text')
    ])

    // Step 2: Test connection
    console.log('\n📌 Step 2: Testing connection...')
    
    const testResponse = await fetch('http://localhost:3001/api/integration-hub/vendors/eventbrite/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': DEMO_ORG_ID
      },
      body: JSON.stringify({ connectorId })
    })

    if (!testResponse.ok) {
      const error = await testResponse.text()
      throw new Error(`Connection test failed: ${error}`)
    }

    const testResult = await testResponse.json()
    console.log('✅ Connection test successful:', testResult.message)

    // Step 3: Create sync job
    console.log('\n📌 Step 3: Creating sync job...')
    
    const syncJobResult = await universalApi.createEntity({
      entity_type: 'integration_sync_job',
      entity_name: 'Eventbrite Events Sync - Demo',
      entity_code: 'SYNC-JOB-EVENTBRITE-DEMO',
      smart_code: 'HERA.INTEGRATION.SYNC_JOB.v1',
      organization_id: DEMO_ORG_ID
    })

    if (!syncJobResult.success) {
      throw new Error('Failed to create sync job')
    }

    const syncJobId = syncJobResult.data.id
    console.log('✅ Sync job created:', syncJobId)

    // Configure sync job
    await Promise.all([
      universalApi.setDynamicField(syncJobId, 'connector_id', connectorId, 'text'),
      universalApi.setDynamicField(syncJobId, 'vendor', 'eventbrite', 'text'),
      universalApi.setDynamicField(syncJobId, 'domain', 'events', 'text'),
      universalApi.setDynamicField(syncJobId, 'is_active', 'true', 'text'),
      universalApi.setDynamicField(syncJobId, 'schedule', 'manual', 'text'),
      universalApi.setDynamicField(syncJobId, 'total_runs', 0, 'number'),
      universalApi.setDynamicField(syncJobId, 'successful_runs', 0, 'number'),
      universalApi.setDynamicField(syncJobId, 'failed_runs', 0, 'number')
    ])

    // Step 4: Trigger sync
    console.log('\n📌 Step 4: Triggering sync...')
    
    const syncResponse = await fetch('http://localhost:3001/api/integration-hub/run/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': DEMO_ORG_ID
      },
      body: JSON.stringify({
        vendor: 'eventbrite',
        domain: 'events',
        syncJobId
      })
    })

    if (!syncResponse.ok) {
      const error = await syncResponse.text()
      throw new Error(`Sync trigger failed: ${error}`)
    }

    const syncResult = await syncResponse.json()
    const syncRunId = syncResult.syncRunId
    console.log('✅ Sync triggered, run ID:', syncRunId)

    // Wait for sync to complete
    console.log('\n⏳ Waiting for sync to complete...')
    let syncComplete = false
    let attempts = 0
    const maxAttempts = 30 // 30 seconds timeout

    while (!syncComplete && attempts < maxAttempts) {
      await sleep(1000) // Wait 1 second
      attempts++

      const statusResponse = await fetch(`http://localhost:3001/api/integration-hub/runs/${syncRunId}`, {
        headers: {
          'X-Organization-Id': DEMO_ORG_ID
        }
      })

      if (statusResponse.ok) {
        const runData = await statusResponse.json()
        const status = runData.status
        
        if (status === 'success' || status === 'partial_success' || status === 'failed') {
          syncComplete = true
          console.log(`✅ Sync completed with status: ${status}`)
          console.log(`   Records processed: ${runData.records_processed}`)
          console.log(`   Records synced: ${runData.records_synced}`)
          console.log(`   Records failed: ${runData.records_failed}`)
          
          if (runData.stats) {
            console.log('\n📊 Sync Statistics:')
            console.log(`   Events processed: ${runData.stats.eventsProcessed}`)
            console.log(`   Events created: ${runData.stats.eventsCreated}`)
            console.log(`   Attendees processed: ${runData.stats.attendeesProcessed}`)
            console.log(`   Attendees created: ${runData.stats.attendeesCreated}`)
            console.log(`   Check-ins recorded: ${runData.stats.checkins}`)
          }
        } else {
          process.stdout.write('.')
        }
      }
    }

    if (!syncComplete) {
      throw new Error('Sync timeout - did not complete within 30 seconds')
    }

    // Step 5: Verify data
    console.log('\n📌 Step 5: Verifying ingested data...')
    
    // Check for events
    const eventsResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'event',
        organization_id: DEMO_ORG_ID
      }
    })

    console.log(`✅ Found ${eventsResult.data?.length || 0} events`)

    if (eventsResult.data && eventsResult.data.length > 0) {
      const event = eventsResult.data[0]
      console.log(`\n📅 Sample Event:`)
      console.log(`   Name: ${event.entity_name}`)
      console.log(`   Code: ${event.entity_code}`)
      console.log(`   Smart Code: ${event.smart_code}`)

      // Get event metadata
      const eventFieldsResult = await universalApi.read({
        table: 'core_dynamic_data',
        filters: {
          entity_id: event.id,
          organization_id: DEMO_ORG_ID
        }
      })

      const eventFields = eventFieldsResult.data || []
      const getFieldValue = (name: string) => 
        eventFields.find(f => f.field_name === name)?.field_value_text || ''

      console.log(`   Type: ${getFieldValue('EVENT.META.V1.type')}`)
      console.log(`   Status: ${getFieldValue('EVENT.META.V1.status')}`)
      console.log(`   Online Event: ${getFieldValue('EVENT.META.V1.online_event')}`)
    }

    // Check for invites
    const invitesResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'event_invite',
        organization_id: DEMO_ORG_ID
      }
    })

    console.log(`✅ Found ${invitesResult.data?.length || 0} event invites`)

    if (invitesResult.data && invitesResult.data.length > 0) {
      const invite = invitesResult.data[0]
      console.log(`\n👥 Sample Invite:`)
      console.log(`   Name: ${invite.entity_name}`)
      console.log(`   Code: ${invite.entity_code}`)

      // Check relationships
      const relationshipsResult = await universalApi.read({
        table: 'core_relationships',
        filters: {
          from_entity_id: invite.id,
          organization_id: DEMO_ORG_ID
        }
      })

      console.log(`   Relationships: ${relationshipsResult.data?.length || 0}`)
    }

    console.log('\n✅ E2E Test completed successfully! 🎉')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
runTest().catch(console.error)