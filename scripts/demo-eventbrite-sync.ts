#!/usr/bin/env node
/**
 * Demo script to show Eventbrite integration in action
 * This simulates the integration flow without requiring actual API connections
 */

import { createEventbriteAdapter } from '../src/lib/integration/vendors/eventbrite'
import type { NormalizedEvent, NormalizedInvite } from '../src/types/integrations-eventbrite'

const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

async function runDemo() {
  console.log('🎯 Eventbrite Integration Demo\n')
  
  try {
    // Create adapter with demo config
    const adapter = createEventbriteAdapter({
      apiToken: 'demo-token'
    })

    console.log('📌 Step 1: Testing connection...')
    const connectionResult = await adapter.testConnection()
    console.log(`✅ Connection test: ${connectionResult.message}\n`)

    console.log('📌 Step 2: Fetching normalized data (demo mode)...')
    const { events, invites } = await adapter.getNormalizedData({
      orgId: DEMO_ORG_ID,
      config: { apiToken: 'demo-token' },
      demoMode: true
    })

    console.log(`✅ Found ${events.length} events and ${invites.length} attendees\n`)

    // Display events
    console.log('📅 Events:')
    events.forEach((event: NormalizedEvent, index: number) => {
      const meta = event.dynamic_data['EVENT.META.V1']
      const source = event.dynamic_data['EVENT.SOURCE.V1']
      
      console.log(`\n${index + 1}. ${event.entity_name}`)
      console.log(`   Type: ${meta.type}`)
      console.log(`   Status: ${meta.status}`)
      console.log(`   Start: ${new Date(meta.start).toLocaleString()}`)
      console.log(`   Venue: ${meta.venue || 'Online'}`)
      console.log(`   Capacity: ${meta.capacity}`)
      console.log(`   Provider ID: ${source.provider_id}`)
      console.log(`   Smart Code: ${event.smart_code}`)
    })

    // Display attendees
    console.log('\n\n👥 Attendees:')
    invites.forEach((invite: NormalizedInvite, index: number) => {
      const meta = invite.dynamic_data['INVITE.META.V1']
      const source = invite.dynamic_data['INVITE.SOURCE.V1']
      
      console.log(`\n${index + 1}. ${invite.entity_name}`)
      console.log(`   Email: ${meta.email}`)
      console.log(`   Status: ${meta.status}`)
      console.log(`   Ticket Type: ${meta.ticket_type}`)
      console.log(`   Checked In: ${meta.checked_in ? 'Yes' : 'No'}`)
      if (meta.checked_in && meta.checkin_time) {
        console.log(`   Check-in Time: ${new Date(meta.checkin_time).toLocaleString()}`)
      }
      console.log(`   Provider ID: ${source.provider_id}`)
    })

    console.log('\n\n📊 Summary:')
    console.log(`- Total Events: ${events.length}`)
    console.log(`- Total Attendees: ${invites.length}`)
    console.log(`- Checked In: ${invites.filter(i => i.dynamic_data['INVITE.META.V1'].checked_in).length}`)
    console.log(`- Event Types: ${[...new Set(events.map(e => e.dynamic_data['EVENT.META.V1'].type))].join(', ')}`)
    
    console.log('\n✅ Demo completed successfully! 🎉')
    console.log('\nThis data would be synced to HERA with:')
    console.log('- Events as "event" entities')
    console.log('- Attendees as "event_invite" entities')
    console.log('- Relationships linking invites to events')
    console.log('- Transactions for audit trail')

  } catch (error) {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo
runDemo().catch(console.error)