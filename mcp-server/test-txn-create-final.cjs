#!/usr/bin/env node
/**
 * Final test for hera_txn_create_v1 with correct signature
 * Tests the function with the new jsonb-based parameter structure
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function testTxnCreateV1WithCorrectSignature() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 Testing hera_txn_create_v1 with CORRECT signature');
  console.log('═══════════════════════════════════════════════════════\n');

  // Build p_header as jsonb object
  const p_header = {
    organization_id: organizationId,
    transaction_type: 'APPOINTMENT',
    smart_code: 'HERA.SALON.APPOINTMENT.TXN.BOOKED.V1',
    transaction_code: 'TEST-APT-' + Date.now(),
    transaction_date: new Date().toISOString(),
    source_entity_id: null,
    target_entity_id: null,
    total_amount: 250.00,
    transaction_status: 'draft',
    reference_number: 'REF-TEST-001',
    external_reference: null,
    business_context: {
      test: true,
      source: 'mcp_test_script'
    },
    metadata: {
      test_run: new Date().toISOString()
    },
    approval_required: false,
    approved_by: null,
    approved_at: null,
    transaction_currency_code: 'AED',
    base_currency_code: 'AED',
    exchange_rate: 1.0,
    fiscal_year: new Date().getFullYear(),
    fiscal_period: new Date().getMonth() + 1
  };

  // Build p_lines as jsonb array
  const p_lines = [
    {
      line_number: 1,
      entity_id: null,
      line_type: 'service',
      description: 'Haircut Service',
      quantity: 1,
      unit_amount: 150.00,
      line_amount: 150.00,
      discount_amount: 0,
      tax_amount: 0,
      smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.V1'
    },
    {
      line_number: 2,
      entity_id: null,
      line_type: 'service',
      description: 'Hair Coloring',
      quantity: 1,
      unit_amount: 100.00,
      line_amount: 100.00,
      discount_amount: 0,
      tax_amount: 0,
      smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.V1'
    }
  ];

  const p_actor_user_id = null;

  console.log('📋 Test Parameters:');
  console.log('   Organization:', organizationId);
  console.log('   Transaction Type:', p_header.transaction_type);
  console.log('   Smart Code:', p_header.smart_code);
  console.log('   Total Amount:', p_header.total_amount);
  console.log('   Lines Count:', p_lines.length);
  console.log('');

  try {
    console.log('🔄 Calling hera_txn_create_v1...\n');

    const { data, error } = await supabase.rpc('hera_txn_create_v1', {
      p_header,
      p_lines,
      p_actor_user_id
    });

    if (error) {
      console.log('❌ FUNCTION CALL FAILED:');
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      console.log('');

      if (error.code === 'PGRST202') {
        console.log('💡 This error means the function does not exist in Supabase.');
        console.log('   Please deploy the function using:');
        console.log('   1. Run the SQL script in Supabase SQL Editor');
        console.log('   2. Or use: psql -d your_db -f /path/to/hera_txn_create_v1.sql\n');
      }

      return false;
    }

    console.log('✅ SUCCESS! Function executed correctly!\n');
    console.log('📊 Result:', JSON.stringify(data, null, 2));
    console.log('');

    // Verify the transaction was created
    if (data?.transaction_id) {
      console.log('🔍 Verifying transaction in database...\n');

      const { data: txn, error: txnError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('id', data.transaction_id)
        .single();

      if (txnError) {
        console.log('⚠️  Could not verify transaction:', txnError.message);
      } else {
        console.log('✅ Transaction verified in database:');
        console.log('   ID:', txn.id);
        console.log('   Type:', txn.transaction_type);
        console.log('   Code:', txn.transaction_code);
        console.log('   Amount:', txn.total_amount);
        console.log('   Status:', txn.transaction_status);
        console.log('   Smart Code:', txn.smart_code);
        console.log('');

        // Check transaction lines
        const { data: lines, error: linesError } = await supabase
          .from('universal_transaction_lines')
          .select('*')
          .eq('transaction_id', data.transaction_id)
          .order('line_number');

        if (linesError) {
          console.log('⚠️  Could not verify lines:', linesError.message);
        } else {
          console.log(`✅ Transaction lines verified (${lines.length} lines):`);
          lines.forEach(line => {
            console.log(`   Line ${line.line_number}: ${line.description} - ${line.line_amount} AED`);
          });
          console.log('');
        }
      }

      return true;
    } else {
      console.log('⚠️  Unexpected result format:', data);
      return false;
    }
  } catch (err) {
    console.log('❌ UNEXPECTED ERROR:', err.message);
    console.log('   Stack:', err.stack);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 HERA Transaction Create Function Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Organization ID: ${organizationId}\n`);

  const success = await testTxnCreateV1WithCorrectSignature();

  console.log('═══════════════════════════════════════════════════════');
  if (success) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('   hera_txn_create_v1 is working correctly.');
  } else {
    console.log('❌ TESTS FAILED!');
    console.log('   Please check the error messages above.');
  }
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(success ? 0 : 1);
}

main();
