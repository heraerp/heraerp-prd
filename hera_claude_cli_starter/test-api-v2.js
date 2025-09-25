#!/usr/bin/env node

/**
 * Test script for HERA API v2 endpoints
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.HERA_BASE_URL || 'http://localhost:3000';
const ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944';

// Test payloads
const testPayloads = {
  txnEmit: {
    organization_id: ORG_ID,
    smart_code: "HERA.FIN.JOURNAL.ENTRY.MANUAL.v1",
    transaction_type: "journal_entry",
    transaction_date: new Date().toISOString(),
    source_entity_id: null,
    target_entity_id: null,
    business_context: {
      description: "Test journal entry",
      created_by: "api_test"
    },
    lines: [
      {
        line_type: "debit",
        entity_id: "cash_account_id",
        line_amount: 1000,
        description: "Cash debit"
      },
      {
        line_type: "credit",
        entity_id: "revenue_account_id",
        line_amount: 1000,
        description: "Revenue credit"
      }
    ]
  },

  entityUpsert: {
    organization_id: ORG_ID,
    entity_type: "gl_account",
    entity_name: "Test Cash Account",
    smart_code: "HERA.FIN.GL.ACCOUNT.CASH.v1",
    entity_code: "1100-TEST",
    attributes: {
      account_type: "asset",
      account_subtype: "cash",
      currency: "USD"
    }
  },

  relationshipUpsert: {
    organization_id: ORG_ID,
    from_entity_id: "parent_account_id",
    to_entity_id: "child_account_id",
    relationship_type: "parent_of",
    smart_code: "HERA.FIN.GL.HIERARCHY.PARENT.v1"
  }
};

async function testEndpoint(name, url, payload) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`URL: ${BASE_URL}${url}`);
  
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        // 'Authorization': `Bearer ${process.env.HERA_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Failed! Status: ${response.status}`);
      console.log('Error:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Testing HERA API v2 endpoints...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Organization ID: ${ORG_ID}`);

  // Test each endpoint
  await testEndpoint(
    'Transaction Emit',
    '/api/v2/universal/txn-emit',
    testPayloads.txnEmit
  );

  await testEndpoint(
    'Entity Upsert',
    '/api/v2/universal/entity-upsert',
    testPayloads.entityUpsert
  );

  await testEndpoint(
    'Relationship Upsert',
    '/api/v2/universal/relationship-upsert',
    testPayloads.relationshipUpsert
  );

  console.log('\n✨ Tests complete!');
}

// Run tests
runTests().catch(console.error);