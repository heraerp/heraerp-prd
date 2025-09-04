#!/usr/bin/env node
/**
 * HERA POS Daily Cash Close Demo
 * Smart Code: HERA.POS.DAILY.CASH.CLOSE.DEMO.v1
 * 
 * Demonstrates complete POS daily cash close workflow
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Constants
const ORGANIZATION_ID = process.env.DEFAULT_ORGANIZATION_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'; // Hair Talkz
const VAT_RATE = 5;

// ----------------------------- Helper Functions ------------------------------------

function generateSmartCode(module, function_, type) {
  return `HERA.${module}.${function_}.${type}.v1`;
}

function formatCurrency(amount) {
  return `AED ${amount.toFixed(2)}`;
}

// ----------------------------- Core Functions ------------------------------------

/**
 * Open a new shift
 */
async function openShift(registerId, operatorId, openingFloat = 500) {
  console.log('\n📋 Opening New Shift...');
  
  const now = new Date();
  const shiftCode = `SHIFT-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}`;
  
  // Create shift entity
  const { data: shiftEntity, error: shiftError } = await supabase
    .from('core_entities')
    .insert({
      entity_type: 'shift',
      entity_name: `Shift ${now.toISOString().split('T')[0]} Morning`,
      entity_code: shiftCode,
      smart_code: generateSmartCode('POS', 'SHIFT', 'DAILY'),
      organization_id: ORGANIZATION_ID
    })
    .select()
    .single();
  
  if (shiftError) {
    console.error('❌ Error creating shift entity:', shiftError);
    return null;
  }
  
  // Create shift open transaction
  const { data: transaction, error: txError } = await supabase
    .from('universal_transactions')
    .insert({
      transaction_type: 'SHIFT_OPEN',
      transaction_code: shiftCode,
      smart_code: generateSmartCode('POS', 'SHIFT', 'OPEN'),
      organization_id: ORGANIZATION_ID,
      from_entity_id: registerId,
      to_entity_id: operatorId,
      transaction_date: now.toISOString(),
      total_amount: openingFloat,
      fiscal_year: now.getFullYear(),
      fiscal_period: now.getMonth() + 1,
      posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      business_context: {
        register_id: registerId,
        shift_id: shiftCode,
        operator_id: operatorId,
        terminal_id: 'TERM-001',
        opening_float: openingFloat
      },
      metadata: {
        shift_type: 'morning',
        expected_duration: '8h',
        opened_at: now.toISOString()
      }
    })
    .select()
    .single();
  
  if (txError) {
    console.error('❌ Error creating shift open transaction:', txError);
    return null;
  }
  
  console.log(`✅ Shift opened: ${shiftCode}`);
  console.log(`   Opening float: ${formatCurrency(openingFloat)}`);
  console.log(`   Operator: ${operatorId}`);
  
  return { shiftId: shiftCode, shiftEntityId: shiftEntity.id, transactionId: transaction.id };
}

/**
 * Process a sale with card payment
 */
async function processSaleWithCard(registerId, shiftId, amount, cardDetails) {
  console.log(`\n💳 Processing Card Sale: ${formatCurrency(amount)}`);
  
  const now = new Date();
  const receiptNumber = `RCP-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-6)}`;
  
  // Calculate tax
  const subtotal = amount / (1 + VAT_RATE / 100);
  const taxAmount = amount - subtotal;
  
  // Create sale transaction
  const { data: saleTx, error: saleError } = await supabase
    .from('universal_transactions')
    .insert({
      transaction_type: 'POS_SALE',
      transaction_code: receiptNumber,
      smart_code: generateSmartCode('POS', 'SALE', 'RECEIPT'),
      organization_id: ORGANIZATION_ID,
      from_entity_id: 'WALK-IN-CUSTOMER',
      to_entity_id: registerId,
      transaction_date: now.toISOString(),
      total_amount: amount,
      fiscal_year: now.getFullYear(),
      fiscal_period: now.getMonth() + 1,
      posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      business_context: {
        register_id: registerId,
        shift_id: shiftId,
        receipt_no: receiptNumber,
        staff_id: 'STAFF-001',
        terminal_id: 'TERM-001'
      },
      metadata: {
        channel: 'in_store',
        payment_methods: ['card'],
        items_count: 1
      }
    })
    .select()
    .single();
  
  if (saleError) {
    console.error('❌ Error creating sale transaction:', saleError);
    return null;
  }
  
  // Create transaction lines
  const lines = [
    {
      transaction_id: saleTx.id,
      organization_id: ORGANIZATION_ID,
      line_number: 1,
      line_type: 'ITEM',
      description: 'Premium Service',
      quantity: 1,
      unit_amount: subtotal,
      line_amount: subtotal,
      smart_code: generateSmartCode('POS', 'SALE.LINE', 'ITEM'),
      line_data: {
        product_id: 'PROD-001',
        product_code: 'SRV-001',
        category: 'services'
      }
    },
    {
      transaction_id: saleTx.id,
      organization_id: ORGANIZATION_ID,
      line_number: 2,
      line_type: 'TAX',
      description: `UAE VAT ${VAT_RATE}%`,
      quantity: 1,
      unit_amount: taxAmount,
      line_amount: taxAmount,
      smart_code: generateSmartCode('POS', 'SALE.LINE.TAX', 'VAT'),
      line_data: {
        tax_rate: VAT_RATE / 100,
        tax_code: 'UAE-VAT-5',
        taxable_amount: subtotal
      }
    },
    {
      transaction_id: saleTx.id,
      organization_id: ORGANIZATION_ID,
      line_number: 3,
      line_type: 'PAYMENT',
      description: 'Visa Card Payment',
      quantity: 1,
      unit_amount: amount,
      line_amount: amount,
      smart_code: generateSmartCode('POS', 'SALE.LINE.PAYMENT', 'CARD'),
      line_data: {
        payment_method: 'visa_card',
        ...cardDetails
      }
    }
  ];
  
  const { error: linesError } = await supabase
    .from('universal_transaction_lines')
    .insert(lines);
  
  if (linesError) {
    console.error('❌ Error creating transaction lines:', linesError);
    return null;
  }
  
  // Create payment intent for card authorization
  const paymentIntentCode = `PI-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-6)}`;
  
  const { data: paymentIntent, error: piError } = await supabase
    .from('core_entities')
    .insert({
      entity_type: 'payment_intent',
      entity_name: `Card Auth ${paymentIntentCode}`,
      entity_code: paymentIntentCode,
      smart_code: generateSmartCode('POS', 'PAYMENT.INTENT', 'CARD'),
      organization_id: ORGANIZATION_ID
    })
    .select()
    .single();
  
  if (!piError) {
    // Store authorization details
    await supabase
      .from('core_dynamic_data')
      .insert([
        {
          entity_id: paymentIntent.id,
          field_name: 'status',
          field_value_text: 'authorized',
          smart_code: generateSmartCode('POS', 'DYN.PAYMENT', 'STATUS')
        },
        {
          entity_id: paymentIntent.id,
          field_name: 'auth_id',
          field_value_text: cardDetails.authorization_id,
          smart_code: generateSmartCode('POS', 'DYN.AUTH', 'ID')
        }
      ]);
    
    // Link sale to payment intent
    await supabase
      .from('core_relationships')
      .insert({
        from_entity_id: saleTx.id,
        to_entity_id: paymentIntent.id,
        relationship_type: 'has_payment',
        smart_code: generateSmartCode('POS', 'REL.SALE', 'PAYMENT'),
        organization_id: ORGANIZATION_ID
      });
  }
  
  console.log(`✅ Sale completed: ${receiptNumber}`);
  console.log(`   Amount: ${formatCurrency(amount)}`);
  console.log(`   Auth ID: ${cardDetails.authorization_id}`);
  
  return { 
    receiptNumber, 
    transactionId: saleTx.id, 
    paymentIntentId: paymentIntent?.id,
    amount 
  };
}

/**
 * Process cash drop
 */
async function processCashDrop(registerId, shiftId, amount, reason = 'excess_cash') {
  console.log(`\n💰 Processing Cash Drop: ${formatCurrency(amount)}`);
  
  const now = new Date();
  const movementCode = `CASH-${now.toISOString().split('T')[0]}-DROP-${Date.now().toString().slice(-4)}`;
  
  const { data: movement, error } = await supabase
    .from('universal_transactions')
    .insert({
      transaction_type: 'CASH_MOVEMENT',
      transaction_code: movementCode,
      smart_code: generateSmartCode('POS', 'CASH.MOVEMENT', 'DROP'),
      organization_id: ORGANIZATION_ID,
      from_entity_id: registerId,
      to_entity_id: 'SAFE-001',
      transaction_date: now.toISOString(),
      total_amount: -Math.abs(amount), // Negative for drops
      fiscal_year: now.getFullYear(),
      fiscal_period: now.getMonth() + 1,
      posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      business_context: {
        register_id: registerId,
        shift_id: shiftId,
        movement_type: 'drop',
        reason: reason,
        performed_by: 'STAFF-001'
      },
      metadata: {
        denomination_breakdown: {
          '100': 10,
          '50': 4,
          '20': 1
        },
        witness: 'STAFF-002'
      }
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating cash drop:', error);
    return null;
  }
  
  console.log(`✅ Cash drop completed: ${movementCode}`);
  console.log(`   Amount: ${formatCurrency(amount)}`);
  console.log(`   Reason: ${reason}`);
  
  return { movementCode, transactionId: movement.id };
}

/**
 * Close shift with cash reconciliation
 */
async function closeShift(registerId, shiftId, operatorId, cashCounted) {
  console.log('\n🔒 Closing Shift...');
  
  // Calculate expected cash (simplified for demo)
  const expectedCash = 2480.00; // Would be calculated from actual transactions
  const variance = cashCounted - expectedCash;
  
  const now = new Date();
  const closeCode = `SHF-CLOSE-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}`;
  
  const { data: closeTx, error: closeError } = await supabase
    .from('universal_transactions')
    .insert({
      transaction_type: 'SHIFT_CLOSE',
      transaction_code: closeCode,
      smart_code: generateSmartCode('POS', 'SHIFT', 'CLOSE'),
      organization_id: ORGANIZATION_ID,
      from_entity_id: registerId,
      to_entity_id: operatorId,
      transaction_date: now.toISOString(),
      total_amount: cashCounted,
      fiscal_year: now.getFullYear(),
      fiscal_period: now.getMonth() + 1,
      posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      business_context: {
        register_id: registerId,
        shift_id: shiftId,
        operator_id: operatorId,
        cash_expected: expectedCash,
        cash_counted: cashCounted,
        variance: variance,
        sales_count: 42,
        void_count: 2
      },
      metadata: {
        close_reason: 'end_of_shift',
        duration_hours: 8,
        closed_at: now.toISOString()
      }
    })
    .select()
    .single();
  
  if (closeError) {
    console.error('❌ Error closing shift:', closeError);
    return null;
  }
  
  // Create transaction lines for cash reconciliation
  const lines = [
    {
      transaction_id: closeTx.id,
      organization_id: ORGANIZATION_ID,
      line_number: 1,
      line_type: 'CASH_EXPECTED',
      description: 'Expected Cash Balance',
      quantity: 1,
      unit_amount: expectedCash,
      line_amount: expectedCash,
      smart_code: generateSmartCode('POS', 'SHIFT.LINE.CASH', 'EXPECTED'),
      line_data: {
        calculation: 'opening_float + cash_sales - drops',
        opening_float: 500,
        cash_sales: 3200,
        drops: 1220
      }
    },
    {
      transaction_id: closeTx.id,
      organization_id: ORGANIZATION_ID,
      line_number: 2,
      line_type: 'CASH_COUNTED',
      description: 'Actual Cash Counted',
      quantity: 1,
      unit_amount: cashCounted,
      line_amount: cashCounted,
      smart_code: generateSmartCode('POS', 'SHIFT.LINE.CASH', 'COUNTED'),
      line_data: {
        denomination_breakdown: {
          '200': 10,
          '100': 4,
          '50': 2
        },
        counted_by: operatorId
      }
    }
  ];
  
  // Add variance line if not balanced
  if (variance !== 0) {
    lines.push({
      transaction_id: closeTx.id,
      organization_id: ORGANIZATION_ID,
      line_number: 3,
      line_type: 'OVER_SHORT',
      description: variance > 0 ? 'Cash Over' : 'Cash Short',
      quantity: 1,
      unit_amount: variance,
      line_amount: variance,
      smart_code: generateSmartCode('POS', 'SHIFT.LINE', variance > 0 ? 'OVER' : 'SHORT'),
      line_data: {
        variance_type: variance > 0 ? 'over' : 'short',
        variance_percentage: (Math.abs(variance) / expectedCash * 100).toFixed(2),
        within_tolerance: Math.abs(variance) <= 50,
        tolerance_limit: 50
      }
    });
  }
  
  await supabase
    .from('universal_transaction_lines')
    .insert(lines);
  
  console.log(`✅ Shift closed: ${closeCode}`);
  console.log(`   Expected: ${formatCurrency(expectedCash)}`);
  console.log(`   Counted: ${formatCurrency(cashCounted)}`);
  console.log(`   Variance: ${formatCurrency(variance)} (${variance > 0 ? 'OVER' : variance < 0 ? 'SHORT' : 'BALANCED'})`);
  
  return { closeCode, transactionId: closeTx.id, variance };
}

/**
 * Create card batch for settlement
 */
async function createCardBatch(registerId, acquirer = 'Network International') {
  console.log(`\n🏦 Creating Card Batch for ${acquirer}...`);
  
  const now = new Date();
  const batchId = `BATCH-${now.toISOString().split('T')[0]}-NETWORK-${Date.now().toString().slice(-4)}`;
  
  // For demo, we'll use hardcoded totals
  const authCount = 28;
  const totalAmount = 5250.00;
  
  const { data: batchTx, error } = await supabase
    .from('universal_transactions')
    .insert({
      transaction_type: 'CARD_BATCH',
      transaction_code: batchId,
      smart_code: generateSmartCode('POS', 'CARD', 'BATCH'),
      organization_id: ORGANIZATION_ID,
      from_entity_id: 'ACQ-NETWORK',
      to_entity_id: registerId,
      transaction_date: now.toISOString(),
      total_amount: totalAmount,
      fiscal_year: now.getFullYear(),
      fiscal_period: now.getMonth() + 1,
      posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      business_context: {
        batch_id: batchId,
        acquirer_id: 'ACQ-NETWORK',
        merchant_id: 'MID-1234567',
        terminal_id: 'TERM-001',
        gateway: 'network_international',
        auth_count: authCount,
        total_sales: totalAmount,
        total_refunds: 0,
        net_amount: totalAmount
      },
      metadata: {
        batch_status: 'submitted',
        settlement_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'AED'
      }
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating card batch:', error);
    return null;
  }
  
  console.log(`✅ Card batch created: ${batchId}`);
  console.log(`   Authorizations: ${authCount}`);
  console.log(`   Total: ${formatCurrency(totalAmount)}`);
  console.log(`   Settlement: Tomorrow`);
  
  return { batchId, transactionId: batchTx.id };
}

/**
 * Run End of Day process
 */
async function runEndOfDay(registerId, businessDate) {
  console.log('\n🌙 Running End of Day Process...');
  console.log(`   Business Date: ${businessDate.toISOString().split('T')[0]}`);
  
  const now = new Date();
  const eodTotals = {
    totalSales: 12500.00,
    totalVAT: 595.24,
    cashFinal: 2500.00,
    shiftCount: 2,
    transactionCount: 142
  };
  
  const { data: eodTx, error } = await supabase
    .from('universal_transactions')
    .insert({
      transaction_type: 'EOD_SETTLEMENT',
      smart_code: generateSmartCode('POS', 'EOD', 'SETTLEMENT'),
      organization_id: ORGANIZATION_ID,
      from_entity_id: registerId,
      to_entity_id: registerId,
      transaction_date: now.toISOString(),
      total_amount: eodTotals.totalSales,
      fiscal_year: businessDate.getFullYear(),
      fiscal_period: businessDate.getMonth() + 1,
      posting_period_code: `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      business_context: {
        register_id: registerId,
        business_date: businessDate.toISOString().split('T')[0],
        shift_count: eodTotals.shiftCount,
        total_transactions: eodTotals.transactionCount,
        cash_final: eodTotals.cashFinal,
        card_batches: 1
      },
      metadata: {
        generated_at: now.toISOString(),
        generated_by: 'system',
        reports: ['z_report', 'vat_summary', 'payment_summary']
      }
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating EOD settlement:', error);
    return null;
  }
  
  // Generate Z Report
  const zReport = {
    report_type: 'Z_REPORT',
    register_id: registerId,
    business_date: businessDate.toISOString().split('T')[0],
    generated_at: now.toISOString(),
    
    sales: {
      gross_sales: eodTotals.totalSales,
      net_sales: eodTotals.totalSales - eodTotals.totalVAT,
      transaction_count: eodTotals.transactionCount,
      average_ticket: eodTotals.totalSales / eodTotals.transactionCount,
      void_count: 3,
      refund_count: 2
    },
    
    payments: {
      cash: 3200.00,
      card: 8700.00,
      digital_wallet: 600.00,
      total: 12500.00
    },
    
    tax: {
      vat_collected: eodTotals.totalVAT,
      taxable_sales: eodTotals.totalSales - eodTotals.totalVAT,
      exempt_sales: 0.00
    },
    
    cash: {
      opening_balance: 500.00,
      cash_sales: 3200.00,
      drops: 1220.00,
      expected_closing: 2480.00,
      actual_closing: 2500.00,
      variance: 20.00
    },
    
    card_batches: [{
      acquirer: 'Network International',
      batch_id: 'BATCH-NETWORK-20250115-001',
      auth_count: 62,
      total_amount: 8700.00,
      status: 'submitted'
    }]
  };
  
  // Store Z Report
  await supabase
    .from('core_entities')
    .insert({
      entity_type: 'report',
      entity_name: `Z Report ${businessDate.toISOString().split('T')[0]}`,
      entity_code: `Z-${registerId}-${businessDate.toISOString().split('T')[0]}`,
      smart_code: generateSmartCode('POS', 'REPORT', 'Z'),
      organization_id: ORGANIZATION_ID,
      metadata: zReport
    });
  
  console.log(`\n✅ End of Day Complete!`);
  console.log('\n📊 Z REPORT SUMMARY:');
  console.log(`   Gross Sales: ${formatCurrency(zReport.sales.gross_sales)}`);
  console.log(`   Net Sales: ${formatCurrency(zReport.sales.net_sales)}`);
  console.log(`   Transactions: ${zReport.sales.transaction_count}`);
  console.log(`   Average Ticket: ${formatCurrency(zReport.sales.average_ticket)}`);
  console.log('\n💳 PAYMENT BREAKDOWN:');
  console.log(`   Cash: ${formatCurrency(zReport.payments.cash)}`);
  console.log(`   Card: ${formatCurrency(zReport.payments.card)}`);
  console.log(`   Digital: ${formatCurrency(zReport.payments.digital_wallet)}`);
  console.log('\n💰 CASH RECONCILIATION:');
  console.log(`   Expected: ${formatCurrency(zReport.cash.expected_closing)}`);
  console.log(`   Actual: ${formatCurrency(zReport.cash.actual_closing)}`);
  console.log(`   Variance: ${formatCurrency(zReport.cash.variance)} (OVER)`);
  
  return { eodTransactionId: eodTx.id, zReport };
}

// ----------------------------- Main Demo Flow ------------------------------------

async function runDemo() {
  console.log('🚀 HERA POS Daily Cash Close Demo');
  console.log('==================================');
  console.log(`Organization: ${ORGANIZATION_ID}`);
  console.log(`Date: ${new Date().toLocaleDateString()}`);
  
  try {
    // Get or create register
    let { data: register } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'register')
      .eq('entity_code', 'REG-001')
      .single();
    
    if (!register) {
      const { data: newRegister } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'register',
          entity_name: 'Register 1 - Main',
          entity_code: 'REG-001',
          smart_code: generateSmartCode('POS', 'REGISTER', 'MAIN'),
          organization_id: ORGANIZATION_ID
        })
        .select()
        .single();
      register = newRegister;
    }
    
    // Get or create operator
    let { data: operator } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'staff')
      .eq('entity_code', 'STAFF-001')
      .single();
    
    if (!operator) {
      const { data: newOperator } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'staff',
          entity_name: 'Sarah Ahmed',
          entity_code: 'STAFF-001',
          smart_code: generateSmartCode('POS', 'STAFF', 'OPERATOR'),
          organization_id: ORGANIZATION_ID
        })
        .select()
        .single();
      operator = newOperator;
    }
    
    // 1. Open shift
    const shift = await openShift(register.id, operator.id, 500);
    if (!shift) return;
    
    // 2. Process some sales with card payments
    console.log('\n📱 Processing Sales Throughout the Day...');
    
    for (let i = 0; i < 3; i++) {
      await processSaleWithCard(register.id, shift.shiftId, 150 + (i * 50), {
        authorization_id: `AUTH-${Date.now()}${i}`,
        gateway: 'network_international',
        acquirer: 'ACQ-NETWORK',
        terminal_id: 'TERM-001',
        merchant_id: 'MID-1234567',
        card_last_four: '1234',
        card_brand: 'visa',
        entry_mode: 'chip',
        approval_code: `APP-${Date.now().toString().slice(-6)}`
      });
      
      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 3. Process cash drop
    await processCashDrop(register.id, shift.shiftId, 1220, 'excess_cash');
    
    // 4. Close shift
    await closeShift(register.id, shift.shiftId, operator.id, 2500);
    
    // 5. Create card batch
    await createCardBatch(register.id, 'Network International');
    
    // 6. Run End of Day
    await runEndOfDay(register.id, new Date());
    
    console.log('\n🎉 Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo error:', error);
  }
}

// Run the demo
runDemo();