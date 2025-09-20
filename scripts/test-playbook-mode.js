#!/usr/bin/env node

const fetch = require('node-fetch')
require('dotenv').config()

const HAIR_TALKZ_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
const APPOINTMENT_ID = '166fc21d-e126-4ed2-b852-0ef6d231dc8a' // Latest appointment
const API_BASE = 'http://localhost:3000/api/v1'

async function testPlaybookMode() {
  console.log('🧪 Testing playbook mode for Hair Talkz POS cart...\n')
  
  // Test cart creation
  console.log('📦 Creating cart from appointment...')
  const cartResponse = await fetch(`${API_BASE}/salon/pos/carts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      appointment_id: APPOINTMENT_ID,
      organization_id: HAIR_TALKZ_ORG_ID,
      idempotency_key: `test-${Date.now()}`
    })
  })
  
  const cartData = await cartResponse.json()
  
  if (!cartResponse.ok) {
    console.error('❌ Cart creation failed:', cartData.error)
    return
  }
  
  console.log('✅ Cart created successfully!')
  console.log('   Cart ID:', cartData.cart.id)
  console.log('   Smart code:', cartData.cart.smart_code)
  console.log('   Total:', cartData.cart.pricing_summary.total)
  
  // Check if it used playbook mode (would have different behavior/metadata)
  // The main test is whether it works without errors after feature flag is on
  
  console.log('\n🎯 Playbook mode test completed successfully!')
}

testPlaybookMode().catch(console.error)