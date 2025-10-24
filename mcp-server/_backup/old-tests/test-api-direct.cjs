#!/usr/bin/env node
/**
 * Test the API endpoint directly to see the actual error
 */

require('dotenv').config();

async function testAPI() {
  const orgId = process.env.DEFAULT_ORGANIZATION_ID;

  const testBody = {
    organization_id: orgId,
    transaction_type: 'APPOINTMENT',
    smart_code: 'HERA.SALON.APPOINTMENT.TXN.BOOKED.V1',
    transaction_date: new Date().toISOString(),
    source_entity_id: null,
    target_entity_id: null,
    total_amount: 250,
    transaction_status: 'draft',
    lines: [
      {
        line_type: 'service',
        quantity: 1,
        unit_amount: 150,
        line_amount: 150,
        description: 'Test Service'
      }
    ]
  };

  console.log('📤 Sending request to API...\n');
  console.log('Body:', JSON.stringify(testBody, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/v2/universal/txn-emit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBody)
    });

    console.log('\n📥 Response status:', response.status, response.statusText);

    const data = await response.json();
    console.log('\n📊 Response body:');
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('\n❌ Request failed!');
      process.exit(1);
    } else {
      console.log('\n✅ Request successful!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testAPI();
