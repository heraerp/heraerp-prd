#!/usr/bin/env node

import { config } from 'dotenv'

config()

// Michele's test profile for API testing
const MICHELE_TEST_TOKEN = 'demo-token-salon-receptionist' // Using demo token for testing
const BASE_URL = 'http://localhost:3000'

async function testMicheleAPIFlow() {
  console.log('🧪 Testing HERA v2.2 API Flow with Michele\'s Profile')
  console.log('='.repeat(60))

  // 1. Test auth introspect
  console.log('\n1️⃣ Testing /api/v2/auth/introspect')
  try {
    const introspectResponse = await fetch(`${BASE_URL}/api/v2/auth/introspect`, {
      headers: {
        'Authorization': `Bearer ${MICHELE_TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (introspectResponse.ok) {
      const introspectData = await introspectResponse.json()
      console.log('✅ Auth introspect successful:')
      console.log(JSON.stringify(introspectData, null, 2))
    } else {
      console.error('❌ Auth introspect failed:', introspectResponse.status)
    }
  } catch (error) {
    console.error('❌ Auth introspect error:', error.message)
  }

  // 2. Test auth attach
  console.log('\n2️⃣ Testing /api/v2/auth/attach')
  try {
    const attachResponse = await fetch(`${BASE_URL}/api/v2/auth/attach`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MICHELE_TEST_TOKEN}`,
        'x-hera-org-id': '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        'Content-Type': 'application/json'
      }
    })

    if (attachResponse.ok) {
      const attachData = await attachResponse.json()
      console.log('✅ Auth attach successful:')
      console.log(JSON.stringify(attachData, null, 2))
    } else {
      const errorText = await attachResponse.text()
      console.error('❌ Auth attach failed:', attachResponse.status, errorText)
    }
  } catch (error) {
    console.error('❌ Auth attach error:', error.message)
  }

  // 3. Test resolve membership endpoint
  console.log('\n3️⃣ Testing /api/v2/auth/resolve-membership')
  try {
    const membershipResponse = await fetch(`${BASE_URL}/api/v2/auth/resolve-membership`, {
      headers: {
        'Authorization': `Bearer ${MICHELE_TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (membershipResponse.ok) {
      const membershipData = await membershipResponse.json()
      console.log('✅ Membership resolution successful:')
      console.log(JSON.stringify(membershipData, null, 2))
    } else {
      console.error('❌ Membership resolution failed:', membershipResponse.status)
    }
  } catch (error) {
    console.error('❌ Membership resolution error:', error.message)
  }

  // 4. Test entities API with actor stamping
  console.log('\n4️⃣ Testing /api/v2/entities (with actor stamping)')
  try {
    const testEntity = {
      entity_type: 'customer',
      entity_name: 'Test Customer Michele',
      entity_code: 'CUST-TEST-001',
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PERSON.V1'
    }

    const entitiesResponse = await fetch(`${BASE_URL}/api/v2/entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MICHELE_TEST_TOKEN}`,
        'x-hera-org-id': '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEntity)
    })

    if (entitiesResponse.ok) {
      const entitiesData = await entitiesResponse.json()
      console.log('✅ Entity creation with actor stamping successful:')
      console.log(JSON.stringify(entitiesData, null, 2))
      
      if (entitiesData.actor_stamped) {
        console.log('🎉 Actor stamping confirmed!')
        console.log(`   - Actor User ID: ${entitiesData.actor_user_id}`)
      }
    } else {
      const errorText = await entitiesResponse.text()
      console.error('❌ Entity creation failed:', entitiesResponse.status, errorText)
    }
  } catch (error) {
    console.error('❌ Entity creation error:', error.message)
  }

  console.log('\n🎯 HERA v2.2 API Flow Test Complete!')
  console.log('Expected behavior:')
  console.log('- All endpoints should return 200 OK')
  console.log('- Actor stamping should be visible in entity creation')
  console.log('- Organization ID should be consistent across all calls')
}

testMicheleAPIFlow().catch(console.error)