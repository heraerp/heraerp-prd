#!/usr/bin/env node

const { universalApi } = require('./lib/universal-api');
const { createNormalizedEntity } = require('./lib/entity-normalization');

// Load environment
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

async function testPosTransaction() {
  try {
    console.log('🧪 Starting POS Transaction Test...\n');
    
    // Get organization ID from environment
    const orgId = process.env.DEFAULT_ORGANIZATION_ID;
    if (!orgId) {
      throw new Error('DEFAULT_ORGANIZATION_ID not set in .env');
    }
    
    console.log('📍 Organization ID:', orgId);

    // 1. Create test service entity with price $150
    console.log('\n1️⃣ Creating test service...');
    const service = await createNormalizedEntity(
      orgId,
      'service',
      'Premium Haircut & Style',
      { 
        industry: 'SALON',
        metadata: {
          price: 150,
          duration_minutes: 60,
          category: 'hair_services'
        }
      }
    );
    console.log('✅ Service created:', service.data?.id, service.data?.smart_code);

    // 2. Create test customer
    console.log('\n2️⃣ Creating test customer...');
    const customer = await createNormalizedEntity(
      orgId,
      'customer',
      'Test Customer - Jane Doe',
      { industry: 'SALON' }
    );
    console.log('✅ Customer created:', customer.data?.id, customer.data?.smart_code);

    // 3. Create test stylist
    console.log('\n3️⃣ Creating test stylist...');
    const stylist = await createNormalizedEntity(
      orgId,
      'employee',
      'Test Stylist - Maria Garcia',
      { 
        industry: 'SALON',
        metadata: {
          role: 'stylist',
          commission_rate: 40
        }
      }
    );
    console.log('✅ Stylist created:', stylist.data?.id, stylist.data?.smart_code);

    // 4. Create POS transaction
    console.log('\n4️⃣ Creating POS transaction...');
    
    const transactionData = {
      organization_id: orgId,
      transaction_type: 'POS_SALE', // Must be uppercase
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.SALON.POS.SALE.HEADER.v1', // lowercase v
      total_amount: 157.50, // $150 + 5% tax
      transaction_code: `POS-${Date.now()}`,
      source_entity_id: stylist.data?.id,
      target_entity_id: customer.data?.id,
      metadata: {
        test: true,
        purpose: 'pos_smoke_test'
      }
    };

    const txResult = await universalApi.createTransaction(transactionData);
    
    if (!txResult.success || !txResult.data) {
      throw new Error(`Transaction creation failed: ${txResult.error}`);
    }
    
    console.log('✅ Transaction header created:', txResult.data.id);
    console.log('   - Type:', txResult.data.transaction_type);
    console.log('   - Amount:', txResult.data.total_amount);
    console.log('   - Smart Code:', txResult.data.smart_code);

    // 5. Create transaction lines
    console.log('\n5️⃣ Creating transaction lines...');
    
    const lines = [
      {
        organization_id: orgId,
        transaction_id: txResult.data.id,
        line_number: 1,
        line_type: 'SERVICE',
        entity_id: service.data?.id,
        description: 'Premium Haircut & Style',
        quantity: 1,
        unit_amount: 150,
        line_amount: 150,
        smart_code: 'HERA.SALON.POS.LINE.SERVICE.v1',
        line_data: {
          stylist_id: stylist.data?.id,
          stylist_name: 'Maria Garcia'
        }
      },
      {
        organization_id: orgId,
        transaction_id: txResult.data.id,
        line_number: 2,
        line_type: 'TAX',
        description: 'Sales Tax (5%)',
        quantity: 1,
        unit_amount: 7.50,
        line_amount: 7.50,
        smart_code: 'HERA.SALON.POS.LINE.TAX.v1',
        line_data: {
          tax_rate: 0.05,
          taxable_amount: 150
        }
      },
      {
        organization_id: orgId,
        transaction_id: txResult.data.id,
        line_number: 3,
        line_type: 'PAYMENT',
        description: 'Cash Payment',
        quantity: 1,
        unit_amount: 157.50,
        line_amount: -157.50, // Negative to balance
        smart_code: 'HERA.SALON.POS.PAYMENT.CASH.v1',
        line_data: {
          payment_method: 'cash',
          amount_tendered: 160,
          change_given: 2.50
        }
      }
    ];

    for (const line of lines) {
      const lineResult = await universalApi.createTransactionLine(line);
      if (!lineResult.success) {
        console.error('❌ Failed to create line:', lineResult.error);
      } else {
        console.log(`✅ Line ${line.line_number} created: ${line.description} ($${line.line_amount})`);
      }
    }

    // 6. Run validation queries
    console.log('\n6️⃣ Running validation queries...\n');
    
    // Check header
    const headerCheck = await universalApi.query(`
      SELECT id, transaction_type, total_amount, smart_code, transaction_date
      FROM universal_transactions
      WHERE id = $1
    `, [txResult.data.id]);
    
    if (headerCheck.data && headerCheck.data.length > 0) {
      const header = headerCheck.data[0];
      console.log('📋 Header Validation:');
      console.log(`   ✅ transaction_type = '${header.transaction_type}' (expected: 'POS_SALE')`);
      console.log(`   ✅ smart_code = '${header.smart_code}' (ends with .v1: ${header.smart_code.endsWith('.v1')})`);
      console.log(`   ✅ total_amount = ${header.total_amount} (expected: 157.50)`);
    }

    // Check lines balance
    const balanceCheck = await universalApi.query(`
      WITH tx_lines AS (
        SELECT 
          line_type,
          line_amount,
          smart_code
        FROM universal_transaction_lines
        WHERE transaction_id = $1
      )
      SELECT
        SUM(CASE WHEN line_type <> 'PAYMENT' THEN line_amount ELSE 0 END) AS non_payment_total,
        SUM(CASE WHEN line_type = 'PAYMENT' THEN line_amount ELSE 0 END) AS payment_total,
        COUNT(*) AS line_count,
        COUNT(CASE WHEN smart_code LIKE '%.v1' THEN 1 END) as correct_smart_codes
      FROM tx_lines
    `, [txResult.data.id]);

    if (balanceCheck.data && balanceCheck.data.length > 0) {
      const balance = balanceCheck.data[0];
      console.log('\n💰 Balance Validation:');
      console.log(`   ✅ non_payment_total = ${balance.non_payment_total} (expected: 157.50)`);
      console.log(`   ✅ payment_total = ${balance.payment_total} (expected: -157.50)`);
      console.log(`   ✅ line_count = ${balance.line_count} (expected: ≥ 3)`);
      console.log(`   ✅ correct_smart_codes = ${balance.correct_smart_codes} (all use .v1)`);
      console.log(`   ✅ Balance check: ${Math.abs(parseFloat(balance.non_payment_total) + parseFloat(balance.payment_total)) < 0.01 ? 'PASSED' : 'FAILED'}`);
    }

    console.log('\n🎉 POS Transaction Test Complete!');
    console.log(`\n🔍 Transaction ID for manual checks: ${txResult.data.id}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testPosTransaction();