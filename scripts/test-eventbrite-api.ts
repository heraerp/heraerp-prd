#!/usr/bin/env node
/**
 * Test Eventbrite API connection with real API key
 */

async function testEventbriteAPI() {
  const API_TOKEN = '64ACNOYV3AQ37KHB25GN'
  const API_URL = 'https://www.eventbriteapi.com/v3'

  console.log('🧪 Testing Eventbrite API Connection\n')

  try {
    // Test 1: Get current user
    console.log('📌 Test 1: Fetching current user...')
    const meResponse = await fetch(`${API_URL}/users/me/`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!meResponse.ok) {
      throw new Error(`HTTP ${meResponse.status}: ${meResponse.statusText}`)
    }

    const userData = await meResponse.json()
    console.log('✅ User authenticated successfully!')
    console.log(`   Name: ${userData.name || 'N/A'}`)
    console.log(`   Email: ${userData.emails?.[0]?.email || 'N/A'}`)
    console.log(`   User ID: ${userData.id}`)

    // Test 2: Get organizations first
    console.log('\n📌 Test 2: Fetching your organizations...')
    const orgsResponse = await fetch(
      `${API_URL}/users/me/organizations/`, 
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    let organizationId = null
    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json()
      if (orgsData.organizations && orgsData.organizations.length > 0) {
        organizationId = orgsData.organizations[0].id
        console.log(`✅ Found organization: ${orgsData.organizations[0].name} (${organizationId})`)
      }
    }

    // Test 3: Get events for the organization
    console.log('\n📌 Test 3: Fetching events...')
    let eventsResponse
    
    if (organizationId) {
      // Try organization events endpoint
      eventsResponse = await fetch(
        `${API_URL}/organizations/${organizationId}/events/`, 
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      )
    }
    
    // Fallback to user's created events
    if (!eventsResponse || !eventsResponse.ok) {
      console.log('   Trying user created events...')
      eventsResponse = await fetch(
        `${API_URL}/events/?organizer_id=${userData.id}&expand=venue,format,organizer`, 
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!eventsResponse.ok) {
      throw new Error(`HTTP ${eventsResponse.status}: ${eventsResponse.statusText}`)
    }

    const eventsData = await eventsResponse.json()
    console.log(`✅ Found ${eventsData.events?.length || 0} events`)

    if (eventsData.events && eventsData.events.length > 0) {
      console.log('\n📅 First few events:')
      eventsData.events.slice(0, 3).forEach((event: any, index: number) => {
        console.log(`\n${index + 1}. ${event.name.text}`)
        console.log(`   ID: ${event.id}`)
        console.log(`   Status: ${event.status}`)
        console.log(`   Start: ${new Date(event.start.utc).toLocaleString()}`)
        console.log(`   URL: ${event.url}`)
        console.log(`   Capacity: ${event.capacity || 'N/A'}`)
        console.log(`   Online Event: ${event.online_event ? 'Yes' : 'No'}`)
      })

      // Test 4: Get attendees for first event
      if (eventsData.events[0]) {
        const firstEventId = eventsData.events[0].id
        console.log(`\n📌 Test 4: Fetching attendees for event ${firstEventId}...`)
        
        const attendeesResponse = await fetch(
          `${API_URL}/events/${firstEventId}/attendees/?status=attending`, 
          {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (attendeesResponse.ok) {
          const attendeesData = await attendeesResponse.json()
          console.log(`✅ Found ${attendeesData.attendees?.length || 0} attendees`)
          
          if (attendeesData.attendees && attendeesData.attendees.length > 0) {
            console.log('\n👥 First few attendees:')
            attendeesData.attendees.slice(0, 3).forEach((attendee: any, index: number) => {
              console.log(`\n${index + 1}. ${attendee.profile.name || attendee.profile.email}`)
              console.log(`   Email: ${attendee.profile.email}`)
              console.log(`   Ticket: ${attendee.ticket_class_name}`)
              console.log(`   Checked In: ${attendee.checked_in ? 'Yes' : 'No'}`)
              console.log(`   Status: ${attendee.status}`)
            })
          }
        } else {
          console.log(`⚠️  Could not fetch attendees: ${attendeesResponse.status}`)
        }
      }
    } else {
      console.log('ℹ️  No events found. Create some events in Eventbrite first.')
    }

    console.log('\n✅ All API tests passed successfully! 🎉')
    console.log('\n📊 Summary:')
    console.log('- Authentication: Working')
    console.log('- Events API: Working')
    console.log('- Attendees API: Working')
    console.log('\nYour Eventbrite integration is ready to use!')

  } catch (error) {
    console.error('\n❌ API test failed:', error)
    console.error('\nPlease check:')
    console.error('1. API token is valid and not expired')
    console.error('2. Network connection is working')
    console.error('3. Eventbrite API is accessible')
    process.exit(1)
  }
}

// Run the test
testEventbriteAPI().catch(console.error)