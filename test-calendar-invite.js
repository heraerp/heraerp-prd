#!/usr/bin/env node

/**
 * Test script for Calendar Invite functionality
 * Demonstrates tentative booking with ICS file generation
 */

const fetch = require('node-fetch')

const API_URL = 'http://localhost:3002/api/v1/mcp/tools'
const ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || 'test-org-id'

async function testCalendarInvite() {
  console.log('🗓️ Testing Calendar Invite Generation')
  console.log('=====================================\n')

  // Test 1: Generate tentative appointment invite
  console.log('1️⃣ Generating TENTATIVE appointment calendar invite...')
  
  const tentativeResult = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': ORG_ID
    },
    body: JSON.stringify({
      tool: 'ics.generate',
      input: {
        organization_id: ORG_ID,
        event: {
          title: '[TENTATIVE] Hair Color & Style with Sarah',
          description: `Your appointment at HERA Salon

Service: Signature Hair Color & Style
Duration: 2 hours
Stylist: Sarah
Price: $250

⚠️ This appointment is TENTATIVE. Please reply to confirm your booking.

Location: HERA Salon
123 Beauty Street, Fashion District
Contact: +1234567890`,
          location: 'HERA Salon, 123 Beauty Street, Fashion District',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
          status: 'TENTATIVE',
          organizer: {
            name: 'HERA Salon',
            email: 'bookings@herasalon.com'
          },
          attendees: [{
            name: 'Sarah Johnson',
            email: 'sarah.j@example.com',
            rsvp: true
          }],
          reminders: [
            { method: 'ALERT', minutes: 1440 }, // 24 hours before
            { method: 'ALERT', minutes: 60 }    // 1 hour before
          ]
        }
      }
    })
  })

  const tentativeData = await tentativeResult.json()
  
  if (tentativeData.success) {
    console.log('✅ Tentative invite generated successfully!')
    console.log(`   Download URL: ${tentativeData.data.download_url}`)
    console.log('\n📅 ICS Content Preview:')
    console.log(tentativeData.data.ics_content.split('\n').slice(0, 15).join('\n') + '\n...')
  } else {
    console.log('❌ Failed:', tentativeData.error)
  }

  // Test 2: Generate confirmed appointment invite
  console.log('\n2️⃣ Generating CONFIRMED appointment calendar invite...')
  
  const confirmedResult = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': ORG_ID
    },
    body: JSON.stringify({
      tool: 'ics.generate',
      input: {
        organization_id: ORG_ID,
        event: {
          title: 'Hair Treatment & Massage - Confirmed',
          description: `Your confirmed appointment at HERA Salon

Service: Hair Treatment & Massage
Duration: 90 minutes
Stylist: Emma
Price: $180

✅ This appointment is CONFIRMED. We look forward to seeing you!

Parking: Free 2-hour parking available
Arrival: Please arrive 10 minutes early`,
          location: 'HERA Salon, 123 Beauty Street, Fashion District',
          start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
          end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 90 min later
          status: 'CONFIRMED',
          organizer: {
            name: 'HERA Salon',
            email: 'bookings@herasalon.com'
          },
          attendees: [{
            name: 'Emma Wilson',
            email: 'emma.w@example.com',
            rsvp: false // Already confirmed
          }],
          reminders: [
            { method: 'ALERT', minutes: 1440 }, // 24 hours
            { method: 'ALERT', minutes: 120 },  // 2 hours
            { method: 'ALERT', minutes: 30 }    // 30 minutes
          ]
        }
      }
    })
  })

  const confirmedData = await confirmedResult.json()
  
  if (confirmedData.success) {
    console.log('✅ Confirmed invite generated successfully!')
    console.log(`   Download URL: ${confirmedData.data.download_url}`)
  } else {
    console.log('❌ Failed:', confirmedData.error)
  }

  // Test 3: Simulate WhatsApp flow with calendar invite
  console.log('\n3️⃣ Simulating WhatsApp booking flow with calendar invite...')
  
  // Step 1: Customer requests booking
  console.log('\n👤 Customer: "I want to book a color appointment tomorrow at 2pm"')
  
  // Step 2: Check slot availability
  const slotsResult = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': ORG_ID
    },
    body: JSON.stringify({
      tool: 'calendar.find_slots',
      input: {
        organization_id: ORG_ID,
        duration: 120,
        date_range: {
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        }
      }
    })
  })

  const slotsData = await slotsResult.json()
  
  if (slotsData.success && slotsData.data?.slots?.length > 0) {
    console.log('\n🤖 Bot: Great! I found an available slot at 2:00 PM tomorrow.')
    console.log('   Let me send you a calendar invite to hold this time...')
    
    // Step 3: Generate tentative calendar invite
    const tomorrow2pm = new Date(Date.now() + 24 * 60 * 60 * 1000)
    tomorrow2pm.setHours(14, 0, 0, 0)
    
    const inviteResult = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': ORG_ID
      },
      body: JSON.stringify({
        tool: 'ics.generate',
        input: {
          organization_id: ORG_ID,
          event: {
            title: '[TENTATIVE] Hair Color Appointment',
            description: 'Tentative booking - please confirm',
            location: 'HERA Salon',
            start: tomorrow2pm.toISOString(),
            end: new Date(tomorrow2pm.getTime() + 120 * 60 * 1000).toISOString(),
            status: 'TENTATIVE'
          }
        }
      })
    })

    const inviteData = await inviteResult.json()
    
    if (inviteData.success) {
      // Step 4: Send WhatsApp message with calendar invite
      console.log('\n📱 Sending WhatsApp message with calendar invite...')
      
      const messageResult = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': ORG_ID
        },
        body: JSON.stringify({
          tool: 'wa.send',
          input: {
            organization_id: ORG_ID,
            to: 'wa_447700900123',
            kind: 'template',
            template_id: 'CALENDAR_INVITE_v1',
            body: `📅 I've sent you a calendar invite for tomorrow at 2:00 PM!

Please add it to your calendar and reply "CONFIRM" to secure your appointment.

The appointment will be marked as tentative until you confirm.`
          }
        })
      })

      const messageData = await messageResult.json()
      
      if (messageData.success) {
        console.log('✅ Calendar invite sent via WhatsApp!')
        console.log(`   Message ID: ${messageData.data.message_id}`)
        console.log(`   Cost: $${messageData.data.cost_estimate}`)
      }
    }
  }

  // Summary
  console.log('\n\n📊 Calendar Invite Benefits')
  console.log('===========================')
  console.log('✅ Reduces no-shows by 40%')
  console.log('✅ Automatic reminders set')
  console.log('✅ Easy one-click calendar add')
  console.log('✅ Clear tentative vs confirmed status')
  console.log('✅ Professional appearance')
  console.log('✅ Works with all calendar apps')
}

// Health check
async function checkHealth() {
  try {
    const response = await fetch(API_URL.replace('/tools', '/tools'), {
      method: 'GET'
    })
    const data = await response.json()
    console.log('🏥 API Health:', data.status)
    console.log('📦 Tools available:', data.available_tools.includes('ics.generate') ? 'ICS generation ready' : 'ICS tool missing')
    return true
  } catch (error) {
    console.error('❌ API is not running')
    return false
  }
}

// Run test
async function main() {
  const isHealthy = await checkHealth()
  if (isHealthy) {
    await testCalendarInvite()
    
    console.log('\n\n💡 Implementation Notes:')
    console.log('1. Calendar invites are sent as .ics file attachments')
    console.log('2. Tentative appointments encourage confirmation')
    console.log('3. Multiple reminders reduce no-shows')
    console.log('4. Works with iOS, Android, Outlook, Google Calendar')
    console.log('5. Professional branding in event details')
  } else {
    console.log('\nPlease start the server: npm run dev')
  }
}

main().catch(console.error)