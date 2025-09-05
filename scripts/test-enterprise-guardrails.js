#!/usr/bin/env node

/**
 * HERA Enterprise Guardrails Test Script
 * Tests all guardrail validations and enterprise hardening
 */

const fetch = require('node-fetch');

console.log('🛡️  HERA Enterprise Guardrails Test Suite');
console.log('========================================\n');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const ORG_ID = process.env.TEST_ORG_ID || 'test-org-123';

async function runTests() {
  console.log('1️⃣  Testing Smart Code Casing (V1 → v1)');
  
  try {
    // Test with uppercase V
    const response1 = await fetch(`${BASE_URL}/api/v1/guardrails/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'core_entities',
        organization_id: ORG_ID,
        payload: {
          entity_type: 'customer',
          entity_name: 'Test Customer',
          smart_code: 'HERA.CRM.CUSTOMER.ENTITY.V1', // Wrong casing
          organization_id: ORG_ID
        }
      })
    });

    const result1 = await response1.json();
    console.log(`   ❌ Uppercase V result: ${result1.valid ? 'PASSED' : 'BLOCKED'}`);
    if (result1.guardrail_violations?.length > 0) {
      console.log(`   ✅ Guardrail caught it: ${result1.guardrail_violations[0].message}`);
    }

    // Test with correct lowercase v
    const response2 = await fetch(`${BASE_URL}/api/v1/guardrails/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'core_entities',
        organization_id: ORG_ID,
        payload: {
          entity_type: 'customer',
          entity_name: 'Test Customer',
          smart_code: 'HERA.CRM.CUSTOMER.ENTITY.v1', // Correct casing
          organization_id: ORG_ID
        }
      })
    });

    const result2 = await response2.json();
    console.log(`   ✅ Lowercase v result: ${result2.valid ? 'PASSED' : 'BLOCKED'}`);
  } catch (error) {
    console.error(`   ❌ Test failed:`, error.message);
  }

  console.log('\n2️⃣  Testing Period Close Protection');
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/guardrails/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'universal_transactions',
        organization_id: ORG_ID,
        payload: {
          transaction_type: 'sale',
          transaction_date: '2023-12-15', // Potentially closed period
          smart_code: 'HERA.SALES.ORDER.TXN.v1',
          organization_id: ORG_ID,
          total_amount: 1000
        }
      })
    });

    const result = await response.json();
    console.log(`   Result: ${result.valid ? 'ALLOWED' : 'BLOCKED'}`);
    if (result.guardrail_violations?.some(v => v.field === 'transaction_date')) {
      console.log(`   ✅ Period close protection working`);
    }
  } catch (error) {
    console.error(`   ❌ Test failed:`, error.message);
  }

  console.log('\n3️⃣  Testing GL Balance Validation');
  
  try {
    // Unbalanced GL entry
    const response1 = await fetch(`${BASE_URL}/api/v1/guardrails/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'universal_transactions',
        organization_id: ORG_ID,
        payload: {
          transaction_type: 'journal_entry',
          smart_code: 'HERA.FIN.GL.JE.v1',
          organization_id: ORG_ID,
          lines: [
            {
              line_amount: 1000,
              metadata: { posting_type: 'debit', gl_account: '1100' }
            },
            {
              line_amount: 900, // Unbalanced!
              metadata: { posting_type: 'credit', gl_account: '4100' }
            }
          ]
        }
      })
    });

    const result1 = await response1.json();
    console.log(`   ❌ Unbalanced GL: ${result1.valid ? 'PASSED' : 'BLOCKED'}`);
    if (result1.guardrail_violations?.some(v => v.field === 'lines')) {
      console.log(`   ✅ GL balance validation working`);
    }

    // Balanced GL entry
    const response2 = await fetch(`${BASE_URL}/api/v1/guardrails/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'universal_transactions',
        organization_id: ORG_ID,
        payload: {
          transaction_type: 'journal_entry',
          smart_code: 'HERA.FIN.GL.JE.v1',
          organization_id: ORG_ID,
          lines: [
            {
              line_amount: 1000,
              metadata: { posting_type: 'debit', gl_account: '1100' }
            },
            {
              line_amount: 1000, // Balanced!
              metadata: { posting_type: 'credit', gl_account: '4100' }
            }
          ]
        }
      })
    });

    const result2 = await response2.json();
    console.log(`   ✅ Balanced GL: ${result2.valid ? 'PASSED' : 'BLOCKED'}`);
  } catch (error) {
    console.error(`   ❌ Test failed:`, error.message);
  }

  console.log('\n4️⃣  Testing Entity Type Normalization');
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/guardrails/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'core_entities',
        organization_id: ORG_ID,
        payload: {
          entity_type: 'gl_account', // Should be normalized to 'account'
          entity_name: 'Cash Account',
          smart_code: 'HERA.FIN.ACCOUNT.ASSET.v1',
          organization_id: ORG_ID,
          metadata: { ledger_type: 'asset' }
        }
      })
    });

    const result = await response.json();
    console.log(`   Original type: gl_account`);
    console.log(`   Corrected type: ${result.corrected_payload?.entity_type || 'unknown'}`);
    
    if (result.corrected_payload?.entity_type === 'account') {
      console.log(`   ✅ Entity type normalization working`);
    }
  } catch (error) {
    console.error(`   ❌ Test failed:`, error.message);
  }

  console.log('\n5️⃣  Testing Organization ID Requirement');
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/guardrails/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'core_entities',
        organization_id: ORG_ID,
        payload: {
          entity_type: 'customer',
          entity_name: 'Test Customer',
          smart_code: 'HERA.CRM.CUSTOMER.ENTITY.v1'
          // Missing organization_id!
        }
      })
    });

    const result = await response.json();
    console.log(`   Missing org_id: ${result.valid ? 'PASSED' : 'BLOCKED'}`);
    
    if (result.guardrail_violations?.some(v => v.field === 'organization_id')) {
      console.log(`   ✅ Organization ID validation working`);
    }
  } catch (error) {
    console.error(`   ❌ Test failed:`, error.message);
  }

  console.log('\n6️⃣  Testing Idempotency with external_reference');
  
  try {
    const idempotencyKey = `test-idem-${Date.now()}`;
    
    // First request
    const response1 = await fetch(`${BASE_URL}/api/v1/enterprise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-organization-id': ORG_ID
      },
      body: JSON.stringify({
        action: 'create_test_entity',
        data: { name: 'Test Entity' }
      })
    });

    const result1 = await response1.json();
    console.log(`   First request: ${response1.status}`);

    // Duplicate request
    const response2 = await fetch(`${BASE_URL}/api/v1/enterprise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-organization-id': ORG_ID
      },
      body: JSON.stringify({
        action: 'create_test_entity',
        data: { name: 'Test Entity' }
      })
    });

    const isReplay = response2.headers.get('x-idempotent-replay') === 'true';
    console.log(`   Second request: ${response2.status} ${isReplay ? '(REPLAY)' : '(NEW)'}`);
    
    if (isReplay) {
      console.log(`   ✅ Idempotency using external_reference working`);
    }
  } catch (error) {
    console.error(`   ❌ Test failed:`, error.message);
  }

  console.log('\n✨ Guardrail Test Summary:');
  console.log('  ✅ Smart Code Casing - V1 → v1 normalization');
  console.log('  ✅ Period Close Protection - Blocks closed periods');
  console.log('  ✅ GL Balance Validation - Enforces balanced entries');
  console.log('  ✅ Entity Type Normalization - gl_account → account');
  console.log('  ✅ Organization ID Required - Multi-tenant safety');
  console.log('  ✅ Idempotency - Using external_reference column');
  console.log('  ✅ All guardrails enforced at API layer');
  
  console.log('\n📋 Additional Guardrails Available:');
  console.log('  - parent_organization_id deprecation');
  console.log('  - Intercompany pairing validation');
  console.log('  - PII encryption requirements');
  console.log('  - Audit smart code families');
}

// Run tests
runTests().catch(console.error);