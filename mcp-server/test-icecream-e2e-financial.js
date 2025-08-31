#!/usr/bin/env node

/**
 * End-to-End Financial Test for Ice Cream Business
 * This test creates a complete business cycle and verifies financial reporting
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ice cream organization ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';

// Test data
const testData = {
  timestamp: new Date().toISOString(),
  uniqueId: Date.now()
};

async function createTestEntities() {
  console.log('\n📦 Creating test entities...');
  
  // Create a test supplier
  const { data: supplier, error: supplierError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: ORG_ID,
      entity_type: 'vendor',
      entity_name: `Test Dairy Supplier ${testData.uniqueId}`,
      entity_code: `VENDOR-TEST-${testData.uniqueId}`,
      smart_code: 'HERA.SCM.VENDOR.ENT.DAIRY.v1',
      metadata: {
        supplier_type: 'dairy',
        payment_terms: 'NET30',
        contact_email: 'test@dairysupplier.com'
      }
    })
    .select()
    .single();

  if (supplierError) throw supplierError;
  console.log('✅ Created supplier:', supplier.entity_name);

  // Create a test customer
  const { data: customer, error: customerError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: ORG_ID,
      entity_type: 'customer',
      entity_name: `Test Ice Cream Shop ${testData.uniqueId}`,
      entity_code: `CUST-TEST-${testData.uniqueId}`,
      smart_code: 'HERA.CRM.CUSTOMER.ENT.RETAIL.v1',
      metadata: {
        customer_type: 'wholesale',
        credit_limit: 50000,
        payment_terms: 'NET15'
      }
    })
    .select()
    .single();

  if (customerError) throw customerError;
  console.log('✅ Created customer:', customer.entity_name);

  return { supplier, customer };
}

async function createPurchaseInvoice(supplierId) {
  console.log('\n📄 Creating purchase invoice (AP)...');
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // NET30
  
  const { data: invoice, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: ORG_ID,
      transaction_type: 'purchase_invoice',
      transaction_code: `PI-TEST-${testData.uniqueId}`,
      transaction_date: testData.timestamp,
      source_entity_id: supplierId,
      total_amount: 25000, // ₹25,000 for dairy supplies
      transaction_status: 'pending',
      smart_code: 'HERA.FIN.AP.TXN.INVOICE.v1',
      metadata: {
        invoice_number: `INV-${testData.uniqueId}`,
        due_date: dueDate.toISOString(),
        description: 'Monthly dairy supply - 1000L milk, 200kg cream',
        payment_terms: 'NET30'
      }
    })
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Created purchase invoice:', invoice.transaction_code, '- Amount: ₹25,000');
  
  return invoice;
}

async function createColdChainExpense() {
  console.log('\n❄️ Creating cold chain expense...');
  
  const { data: expense, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: ORG_ID,
      transaction_type: 'expense',
      transaction_code: `EXP-COLD-${testData.uniqueId}`,
      transaction_date: testData.timestamp,
      total_amount: 5000, // ₹5,000 for electricity/maintenance
      transaction_status: 'completed',
      smart_code: 'HERA.FIN.EXP.TXN.COLDCHAIN.v1',
      metadata: {
        expense_type: 'cold_chain_energy',
        description: 'Freezer electricity and maintenance',
        cost_center: 'PRODUCTION'
      }
    })
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Created cold chain expense: ₹5,000');
  
  return expense;
}

async function createTemperatureWastage() {
  console.log('\n🌡️ Creating temperature variance wastage...');
  
  const { data: wastage, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: ORG_ID,
      transaction_type: 'inventory_adjustment',
      transaction_code: `WASTE-TEMP-${testData.uniqueId}`,
      transaction_date: testData.timestamp,
      total_amount: 3500, // ₹3,500 loss
      transaction_status: 'completed',
      smart_code: 'HERA.INV.ADJ.TXN.TEMPERATURE.v1',
      metadata: {
        adjustment_type: 'wastage',
        wastage_reason: 'temperature_excursion',
        batch_number: `BATCH-${testData.uniqueId}`,
        temperature_reading: -12.5, // Too warm
        required_temperature: -18,
        description: 'Temperature excursion - 50L ice cream melted'
      }
    })
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Created temperature wastage: ₹3,500');
  
  return wastage;
}

async function createProductionBatch() {
  console.log('\n🏭 Creating production batch...');
  
  const { data: batch, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: ORG_ID,
      transaction_type: 'production_batch',
      transaction_code: `PROD-${testData.uniqueId}`,
      transaction_date: testData.timestamp,
      total_amount: 15000, // Production cost
      transaction_status: 'completed',
      smart_code: 'HERA.MFG.PROD.TXN.BATCH.v1',
      metadata: {
        batch_number: `BATCH-${testData.uniqueId}`,
        recipe: 'Premium Vanilla',
        planned_quantity: 200,
        actual_output_liters: 195,
        yield_variance_percent: -2.5, // 97.5% efficiency
        material_cost: 10000,
        labor_cost: 3000,
        overhead_cost: 2000,
        total_cost: 15000,
        unit_cost: 76.92, // per liter
        selling_price: 100, // per liter
        profit_margin: 23.08 // 23.08% margin
      }
    })
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Created production batch: 195L with 23.08% margin');
  
  return batch;
}

async function createSalesInvoice(customerId) {
  console.log('\n💰 Creating sales invoice (AR)...');
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15); // NET15
  
  const { data: invoice, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: ORG_ID,
      transaction_type: 'invoice',
      transaction_code: `SI-TEST-${testData.uniqueId}`,
      transaction_date: testData.timestamp,
      source_entity_id: customerId,
      total_amount: 35000, // ₹35,000 sale
      transaction_status: 'pending',
      smart_code: 'HERA.FIN.AR.TXN.INVOICE.v1',
      metadata: {
        invoice_number: `SI-${testData.uniqueId}`,
        due_date: dueDate.toISOString(),
        description: 'Premium ice cream - 350 units',
        payment_terms: 'NET15'
      }
    })
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Created sales invoice:', invoice.transaction_code, '- Amount: ₹35,000');
  
  return invoice;
}

async function createPOSSale() {
  console.log('\n🛒 Creating POS sale (immediate revenue)...');
  
  const { data: sale, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: ORG_ID,
      transaction_type: 'pos_sale',
      transaction_code: `POS-${testData.uniqueId}`,
      transaction_date: testData.timestamp,
      total_amount: 12000, // ₹12,000 retail sale
      transaction_status: 'completed',
      smart_code: 'HERA.RETAIL.POS.TXN.SALE.v1',
      metadata: {
        payment_method: 'cash',
        items_sold: 120,
        average_price: 100,
        outlet: 'Main Store'
      }
    })
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Created POS sale: ₹12,000');
  
  return sale;
}

async function verifyFinancialReports() {
  console.log('\n📊 Verifying financial reports...');
  
  // Get current month dates
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Fetch revenue transactions
  const { data: revenueTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .in('transaction_type', ['pos_sale', 'invoice'])
    .gte('transaction_date', startOfMonth.toISOString())
    .like('transaction_code', '%TEST%');
  
  const totalRevenue = revenueTxns?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
  console.log(`\n💰 Revenue MTD (Test): ₹${totalRevenue.toLocaleString('en-IN')}`);
  
  // Fetch cold chain costs
  const { data: coldChainTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .or('smart_code.ilike.%COLD%,metadata->>expense_type.eq.cold_chain_energy')
    .gte('transaction_date', startOfMonth.toISOString())
    .like('transaction_code', '%TEST%');
  
  const coldChainCost = coldChainTxns?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
  const coldChainPercent = totalRevenue > 0 ? (coldChainCost / totalRevenue) * 100 : 0;
  console.log(`❄️ Cold Chain Cost: ₹${coldChainCost.toLocaleString('en-IN')} (${coldChainPercent.toFixed(1)}% of revenue)`);
  
  // Fetch AP outstanding
  const { data: apTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('transaction_type', 'purchase_invoice')
    .eq('transaction_status', 'pending')
    .like('transaction_code', '%TEST%');
  
  const apOutstanding = apTxns?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
  console.log(`📄 AP Outstanding: ₹${apOutstanding.toLocaleString('en-IN')}`);
  
  // Fetch AR outstanding
  const { data: arTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('transaction_type', 'invoice')
    .eq('transaction_status', 'pending')
    .like('transaction_code', '%TEST%');
  
  const arOutstanding = arTxns?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
  console.log(`💸 AR Outstanding: ₹${arOutstanding.toLocaleString('en-IN')}`);
  
  // Fetch temperature variance
  const { data: tempTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .or('smart_code.ilike.%TEMPERATURE%,metadata->>wastage_reason.eq.temperature_excursion')
    .gte('transaction_date', startOfMonth.toISOString())
    .like('transaction_code', '%TEST%');
  
  const tempVarianceCost = tempTxns?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
  console.log(`🌡️ Temperature Variance Cost: ₹${tempVarianceCost.toLocaleString('en-IN')} (${tempTxns?.length || 0} incidents)`);
  
  // Fetch production batches for profitability
  const { data: prodBatches } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('transaction_type', 'production_batch')
    .gte('transaction_date', startOfMonth.toISOString())
    .like('transaction_code', '%TEST%');
  
  let totalMargin = 0;
  let batchCount = 0;
  prodBatches?.forEach(batch => {
    if (batch.metadata?.profit_margin) {
      totalMargin += parseFloat(batch.metadata.profit_margin);
      batchCount++;
    }
  });
  const avgMargin = batchCount > 0 ? totalMargin / batchCount : 0;
  console.log(`📈 Average Batch Profitability: ${avgMargin.toFixed(1)}%`);
  
  // Summary
  console.log('\n📊 FINANCIAL SUMMARY:');
  console.log('═══════════════════════════════════════');
  console.log(`Total Test Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`);
  console.log(`Total Test Costs: ₹${(coldChainCost + tempVarianceCost).toLocaleString('en-IN')}`);
  console.log(`Net Margin: ₹${(totalRevenue - coldChainCost - tempVarianceCost).toLocaleString('en-IN')}`);
  console.log(`Outstanding Receivables: ₹${arOutstanding.toLocaleString('en-IN')}`);
  console.log(`Outstanding Payables: ₹${apOutstanding.toLocaleString('en-IN')}`);
  console.log('═══════════════════════════════════════');
  
  return {
    revenue: totalRevenue,
    coldChainCost,
    apOutstanding,
    arOutstanding,
    tempVarianceCost,
    avgMargin
  };
}

async function runE2ETest() {
  console.log('🧪 Starting Ice Cream E2E Financial Test');
  console.log('═══════════════════════════════════════');
  console.log(`Organization: Kochi Ice Cream Manufacturing`);
  console.log(`Test ID: ${testData.uniqueId}`);
  console.log(`Timestamp: ${testData.timestamp}`);
  
  try {
    // Create test entities
    const { supplier, customer } = await createTestEntities();
    
    // Create transactions
    await createPurchaseInvoice(supplier.id);
    await createColdChainExpense();
    await createTemperatureWastage();
    await createProductionBatch();
    await createSalesInvoice(customer.id);
    await createPOSSale();
    
    // Wait a moment for data to be available
    console.log('\n⏳ Waiting for data propagation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify in reports
    const results = await verifyFinancialReports();
    
    console.log('\n✅ E2E Test Complete!');
    console.log('\n🌐 View results in the financial dashboard:');
    console.log('   http://localhost:3000/icecream-financial');
    console.log('\n📝 Test transactions can be identified by:');
    console.log(`   - Transaction codes containing: TEST-${testData.uniqueId}`);
    console.log(`   - Created on: ${new Date(testData.timestamp).toLocaleDateString()}`);
    
    // Return test results
    return {
      success: true,
      testId: testData.uniqueId,
      results
    };
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runE2ETest().then(result => {
  console.log('\n📋 Test Result:', result.success ? 'PASSED' : 'FAILED');
  process.exit(result.success ? 0 : 1);
});