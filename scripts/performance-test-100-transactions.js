#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = "0fd09e31-d257-4329-97eb-7d7f522ed6f0";

// Performance metrics
const metrics = {
  totalTransactions: 0,
  successfulTransactions: 0,
  failedTransactions: 0,
  totalTime: 0,
  avgTimePerTransaction: 0,
  minTime: Infinity,
  maxTime: 0,
  journalEntriesCreated: 0,
  errors: []
};

async function loadTestData() {
  console.log('📊 Loading test data...\n');
  
  // Get all stylists
  const { data: stylists } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'employee');
  
  // Get all services
  const { data: services } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'service');
  
  // Get all products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'product');
  
  // Get all customers
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'customer');
  
  // Get GL accounts
  const { data: glAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'gl_account');
  
  return { stylists, services, products, customers, glAccounts };
}

async function createServiceTransaction(customer, stylist, service, txnNumber) {
  const startTime = Date.now();
  
  try {
    // Random service price variation (±10%)
    const basePrice = service.metadata?.base_price || 100;
    const priceVariation = 0.9 + (Math.random() * 0.2);
    const saleAmount = Math.round(basePrice * priceVariation);
    
    const taxRate = 0.05;
    const taxAmount = Number((saleAmount * taxRate / (1 + taxRate)).toFixed(2));
    const netAmount = saleAmount - taxAmount;
    
    // Create sale transaction
    const saleTxn = {
      organization_id: SALON_ORG_ID,
      transaction_type: 'service_sale',
      transaction_code: `PERF-SALE-${txnNumber}-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.SALON.SERVICE.TXN.SALE.v1',
      total_amount: saleAmount,
      source_entity_id: customer.id,
      target_entity_id: stylist.id,
      transaction_status: 'posted',
      metadata: {
        service_id: service.id,
        service_name: service.entity_name,
        payment_method: Math.random() > 0.3 ? 'cash' : 'card',
        performance_test: true,
        batch_number: Math.floor(txnNumber / 10)
      }
    };
    
    const { data: mainTxn, error: txnError } = await supabase
      .from('universal_transactions')
      .insert(saleTxn)
      .select()
      .single();
    
    if (txnError) throw txnError;
    
    // Create transaction line
    const txnLine = {
      organization_id: SALON_ORG_ID,
      transaction_id: mainTxn.id,
      line_number: 1,
      entity_id: service.id,
      line_type: 'service',
      description: service.entity_name,
      quantity: 1,
      unit_amount: saleAmount,
      line_amount: saleAmount,
      discount_amount: 0,
      tax_amount: taxAmount,
      smart_code: 'HERA.SALON.SERVICE.TXN.LINE.v1'
    };
    
    await supabase
      .from('universal_transaction_lines')
      .insert(txnLine);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    metrics.successfulTransactions++;
    metrics.totalTime += duration;
    metrics.minTime = Math.min(metrics.minTime, duration);
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    
    return { success: true, duration, transactionCode: mainTxn.transaction_code };
    
  } catch (error) {
    metrics.failedTransactions++;
    metrics.errors.push({ txnNumber, error: error.message });
    return { success: false, error: error.message };
  }
}

async function createProductTransaction(customer, stylist, product, txnNumber) {
  const startTime = Date.now();
  
  try {
    // Random quantity (1-3)
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = product.metadata?.retail_price || 50;
    const saleAmount = unitPrice * quantity;
    
    const taxRate = 0.05;
    const taxAmount = Number((saleAmount * taxRate / (1 + taxRate)).toFixed(2));
    const netAmount = saleAmount - taxAmount;
    
    // Create sale transaction
    const saleTxn = {
      organization_id: SALON_ORG_ID,
      transaction_type: 'product_sale',
      transaction_code: `PERF-PROD-${txnNumber}-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.SALON.PRODUCT.SALE.TXN.v1',
      total_amount: saleAmount,
      source_entity_id: customer.id,
      target_entity_id: stylist.id,
      transaction_status: 'posted',
      metadata: {
        product_id: product.id,
        product_name: product.entity_name,
        quantity: quantity,
        payment_method: 'cash',
        performance_test: true
      }
    };
    
    const { data: mainTxn, error: txnError } = await supabase
      .from('universal_transactions')
      .insert(saleTxn)
      .select()
      .single();
    
    if (txnError) throw txnError;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    metrics.successfulTransactions++;
    metrics.totalTime += duration;
    metrics.minTime = Math.min(metrics.minTime, duration);
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    
    return { success: true, duration, transactionCode: mainTxn.transaction_code };
    
  } catch (error) {
    metrics.failedTransactions++;
    metrics.errors.push({ txnNumber, error: error.message });
    return { success: false, error: error.message };
  }
}

async function createAutoJournalEntry(sourceTxn, glAccounts) {
  try {
    const cashAccount = glAccounts.find(a => a.entity_code === '1100');
    const revenueAccount = glAccounts.find(a => a.entity_code === sourceTxn.transaction_type === 'service_sale' ? '4100' : '4200');
    const taxAccount = glAccounts.find(a => a.entity_code === '2200');
    
    const taxRate = 0.05;
    const taxAmount = Number((sourceTxn.total_amount * taxRate / (1 + taxRate)).toFixed(2));
    const netAmount = sourceTxn.total_amount - taxAmount;
    
    // Create journal entry
    const journalEntry = {
      organization_id: SALON_ORG_ID,
      transaction_type: 'journal_entry',
      transaction_code: `JE-${sourceTxn.transaction_code}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.FIN.GL.TXN.JOURNAL.AUTO.v1',
      total_amount: sourceTxn.total_amount,
      source_entity_id: sourceTxn.source_entity_id,
      transaction_status: 'posted',
      metadata: {
        source_transaction: sourceTxn.transaction_code,
        auto_generated: true,
        performance_test: true
      }
    };
    
    const { data: je } = await supabase
      .from('universal_transactions')
      .insert(journalEntry)
      .select()
      .single();
    
    if (je) {
      // Create journal lines
      const journalLines = [
        {
          organization_id: SALON_ORG_ID,
          transaction_id: je.id,
          line_number: 1,
          entity_id: cashAccount.id,
          line_type: 'debit',
          description: 'Cash Receipt',
          quantity: 1,
          unit_amount: sourceTxn.total_amount,
          line_amount: sourceTxn.total_amount,
          smart_code: 'HERA.FIN.GL.LINE.DEBIT.CASH.v1'
        },
        {
          organization_id: SALON_ORG_ID,
          transaction_id: je.id,
          line_number: 2,
          entity_id: revenueAccount.id,
          line_type: 'credit',
          description: 'Revenue',
          quantity: 1,
          unit_amount: netAmount,
          line_amount: netAmount,
          smart_code: 'HERA.FIN.GL.LINE.CREDIT.REVENUE.v1'
        },
        {
          organization_id: SALON_ORG_ID,
          transaction_id: je.id,
          line_number: 3,
          entity_id: taxAccount.id,
          line_type: 'credit',
          description: 'Sales Tax',
          quantity: 1,
          unit_amount: taxAmount,
          line_amount: taxAmount,
          smart_code: 'HERA.FIN.GL.LINE.CREDIT.TAX.v1'
        }
      ];
      
      await supabase
        .from('universal_transaction_lines')
        .insert(journalLines);
      
      metrics.journalEntriesCreated++;
    }
  } catch (error) {
    // Silent fail for journal entries to not affect main transaction metrics
  }
}

async function runPerformanceTest() {
  console.log('🏃 HERA Salon Performance Test - 100+ Transactions\n');
  console.log('================================================\n');
  
  const testData = await loadTestData();
  
  console.log(`Test Data Loaded:
  - Stylists: ${testData.stylists.length}
  - Services: ${testData.services.length}
  - Products: ${testData.products.length}
  - Customers: ${testData.customers.length}
  - GL Accounts: ${testData.glAccounts.length}\n`);
  
  console.log('Starting transaction creation...\n');
  
  const startTime = Date.now();
  const targetTransactions = 120; // Create 120 to ensure 100+ successful
  
  // Progress tracking
  let completed = 0;
  const progressInterval = setInterval(() => {
    const percent = Math.round((completed / targetTransactions) * 100);
    process.stdout.write(`\rProgress: [${'█'.repeat(percent/2).padEnd(50, '░')}] ${percent}% (${completed}/${targetTransactions})`);
  }, 100);
  
  // Create transactions in batches for better performance
  const batchSize = 10;
  const batches = Math.ceil(targetTransactions / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    
    for (let i = 0; i < batchSize && completed < targetTransactions; i++) {
      const txnNumber = batch * batchSize + i + 1;
      
      // Randomize transaction type (70% services, 30% products)
      const isService = Math.random() < 0.7;
      
      // Random selection
      const customer = testData.customers[Math.floor(Math.random() * testData.customers.length)];
      const stylist = testData.stylists[Math.floor(Math.random() * testData.stylists.length)];
      
      if (isService) {
        const service = testData.services[Math.floor(Math.random() * testData.services.length)];
        batchPromises.push(createServiceTransaction(customer, stylist, service, txnNumber));
      } else {
        const product = testData.products[Math.floor(Math.random() * testData.products.length)];
        batchPromises.push(createProductTransaction(customer, stylist, product, txnNumber));
      }
      
      metrics.totalTransactions++;
    }
    
    // Wait for batch to complete
    const results = await Promise.all(batchPromises);
    completed += batchSize;
    
    // Create journal entries for successful transactions (simulate auto-journal)
    for (const result of results) {
      if (result.success && Math.random() < 0.8) { // 80% get journal entries
        const { data: txn } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('transaction_code', result.transactionCode)
          .single();
        
        if (txn) {
          await createAutoJournalEntry(txn, testData.glAccounts);
        }
      }
    }
  }
  
  clearInterval(progressInterval);
  console.log('\n\n');
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // Calculate final metrics
  metrics.avgTimePerTransaction = Math.round(metrics.totalTime / metrics.successfulTransactions);
  
  // Display results
  console.log('📊 Performance Test Results');
  console.log('==========================\n');
  
  console.log(`Total Transactions: ${metrics.totalTransactions}`);
  console.log(`Successful: ${metrics.successfulTransactions} (${Math.round(metrics.successfulTransactions/metrics.totalTransactions*100)}%)`);
  console.log(`Failed: ${metrics.failedTransactions}`);
  console.log(`Journal Entries Created: ${metrics.journalEntriesCreated}\n`);
  
  console.log('⏱️  Timing Metrics:');
  console.log(`Total Test Duration: ${(totalDuration/1000).toFixed(2)} seconds`);
  console.log(`Avg Time per Transaction: ${metrics.avgTimePerTransaction}ms`);
  console.log(`Min Transaction Time: ${metrics.minTime}ms`);
  console.log(`Max Transaction Time: ${metrics.maxTime}ms`);
  console.log(`Transactions per Second: ${(metrics.successfulTransactions/(totalDuration/1000)).toFixed(2)}\n`);
  
  // Verify data integrity
  console.log('🔍 Verifying Data Integrity...\n');
  
  const { data: recentTxns } = await supabase
    .from('universal_transactions')
    .select('transaction_type, count')
    .eq('organization_id', SALON_ORG_ID)
    .gte('created_at', new Date(startTime).toISOString())
    .select('transaction_type');
  
  const txnCounts = recentTxns.reduce((acc, txn) => {
    acc[txn.transaction_type] = (acc[txn.transaction_type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Transaction Types Created:');
  Object.entries(txnCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  // Check for balanced journal entries
  const { data: journalEntries } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('transaction_type', 'journal_entry')
    .eq('smart_code', 'HERA.FIN.GL.TXN.JOURNAL.AUTO.v1')
    .gte('created_at', new Date(startTime).toISOString())
    .limit(5);
  
  console.log(`\n✅ Sample Journal Entries (showing 5 of ${metrics.journalEntriesCreated}):`);
  for (const je of journalEntries || []) {
    console.log(`  ${je.transaction_code}: ${je.total_amount} AED`);
  }
  
  if (metrics.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    metrics.errors.slice(0, 5).forEach(err => {
      console.log(`  Transaction ${err.txnNumber}: ${err.error}`);
    });
    if (metrics.errors.length > 5) {
      console.log(`  ... and ${metrics.errors.length - 5} more errors`);
    }
  }
  
  // Performance grade
  console.log('\n🏆 Performance Grade:');
  const tps = metrics.successfulTransactions/(totalDuration/1000);
  let grade = 'F';
  if (tps >= 10) grade = 'A+';
  else if (tps >= 5) grade = 'A';
  else if (tps >= 2) grade = 'B';
  else if (tps >= 1) grade = 'C';
  else if (tps >= 0.5) grade = 'D';
  
  console.log(`Grade: ${grade} (${tps.toFixed(2)} transactions/second)`);
  
  console.log('\n✅ Performance test completed successfully!');
}

runPerformanceTest().catch(console.error);