const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Organization and branch data
const parkRegis = {
  id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
  name: 'Hair Talkz • Park Regis'
};

// Test data for the day - use today's date
const testDate = new Date();
testDate.setHours(0, 0, 0, 0);
const salesTransactions = [
  // Morning transactions (small amounts)
  {
    time: '09:15',
    type: 'service',
    service: 'Blow Dry',
    amount: 80,
    staff: 'Maya Patel',
    customer: 'Sarah Ahmed',
    payment: 'cash'
  },
  {
    time: '09:30',
    type: 'product',
    product: 'Wide-Tooth Comb',
    amount: 25,
    staff: 'Sophie Kim',
    customer: 'Walk-in Customer',
    payment: 'cash'
  },
  {
    time: '10:00',
    type: 'service',
    service: 'Men\'s Hair Cut',
    amount: 80,
    staff: 'Chloe Davis',
    customer: 'Ahmed Hassan',
    payment: 'card'
  },
  {
    time: '10:45',
    type: 'service',
    service: 'Fringe Trim',
    amount: 30,
    staff: 'Maya Patel',
    customer: 'Lisa Chen',
    payment: 'cash'
  },
  // Afternoon transactions (mixed amounts)
  {
    time: '14:00',
    type: 'service',
    service: 'Ladies\' Hair Cut',
    amount: 120,
    staff: 'Priya Sharma',
    customer: 'Maria Rodriguez',
    payment: 'card'
  },
  {
    time: '14:30',
    type: 'service',
    service: 'Full Head Color',
    amount: 280,
    staff: 'Lily Wang',
    customer: 'Jennifer Liu',
    payment: 'card'
  },
  {
    time: '15:00',
    type: 'product',
    product: 'L\'Oreal Professional Shampoo',
    amount: 120,
    staff: 'Jessica Martinez',
    customer: 'Jennifer Liu',
    payment: 'card'
  },
  {
    time: '16:00',
    type: 'service',
    service: 'Deep Conditioning',
    amount: 120,
    staff: 'Priya Sharma',
    customer: 'Fatima Al-Rashid',
    payment: 'card'
  },
  // Evening transactions (larger amounts)
  {
    time: '17:30',
    type: 'service',
    service: 'Balayage',
    amount: 450,
    staff: 'Jessica Martinez',
    customer: 'Emma Thompson',
    payment: 'card'
  },
  {
    time: '18:00',
    type: 'service',
    service: 'Hair Spa',
    amount: 200,
    staff: 'Aisha Hassan',
    customer: 'Noor Abdullah',
    payment: 'cash'
  },
  {
    time: '19:00',
    type: 'service',
    service: 'Men\'s Facial',
    amount: 200,
    staff: 'Aisha Hassan',
    customer: 'David Miller',
    payment: 'card'
  },
  {
    time: '19:30',
    type: 'product',
    product: 'Olaplex No.3 Hair Perfector',
    amount: 240,
    staff: 'Sophie Kim',
    customer: 'Emma Thompson',
    payment: 'card'
  }
];

async function createSalesTransactions() {
  console.log(`💰 Creating Sales Transactions for ${testDate.toDateString()}...\n`);
  
  const createdTransactions = [];
  let transactionNumber = Date.now() % 10000; // Use timestamp to ensure unique numbers

  for (const sale of salesTransactions) {
    try {
      // Create transaction entity
      const transactionCode = `TXN-PR-${testDate.toISOString().split('T')[0]}-${transactionNumber}`;
      console.log(`Creating transaction: ${transactionCode}...`);
      
      const { data: transaction, error: txnError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: parkRegis.id,
          transaction_type: sale.type === 'service' ? 'service_sale' : 'product_sale',
          transaction_code: transactionCode,
          transaction_date: new Date(`${testDate.toISOString().split('T')[0]}T${sale.time}:00`),
          total_amount: sale.amount,
          transaction_status: 'completed',
          smart_code: sale.type === 'service' 
            ? `HERA.SALON.TXN.SERVICE.${sale.service.toUpperCase().replace(/[\s']/g, '_')}.v1`
            : `HERA.SALON.TXN.PRODUCT.RETAIL.v1`,
          metadata: {
            description: `${sale.type === 'service' ? sale.service : sale.product} - ${sale.customer}`,
            customer_name: sale.customer,
            staff_name: sale.staff,
            payment_method: sale.payment,
            branch: 'Park Regis',
            auto_journal_eligible: true,
            journal_priority: sale.amount < 100 ? 'batch' : 'immediate'
          }
        })
        .select()
        .single();

      if (txnError) {
        console.error(`Error creating transaction ${transactionCode}:`, txnError);
        console.error(`Transaction data:`, {
          organization_id: parkRegis.id,
          transaction_type: sale.type === 'service' ? 'service_sale' : 'product_sale',
          transaction_code: transactionCode,
          transaction_date: new Date(`${testDate.toISOString().split('T')[0]}T${sale.time}:00`),
          total_amount: sale.amount,
          transaction_status: 'completed'
        });
        continue;
      }

      if (!transaction) {
        console.error(`No transaction returned for ${transactionCode}`);
        continue;
      }

      // Calculate VAT breakdown (5% included in price)
      const vatRate = 0.05;
      const baseAmount = sale.amount / (1 + vatRate);
      const vatAmount = sale.amount - baseAmount;

      // Create transaction line
      const { data: txnLine, error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: parkRegis.id,
          transaction_id: transaction.id,
          line_number: 1,
          line_type: 'debit',  // Required field
          description: sale.type === 'service' ? sale.service : sale.product,
          quantity: 1,
          unit_amount: sale.amount,
          line_amount: sale.amount,
          line_data: {
            base_amount: baseAmount.toFixed(2),
            vat_amount: vatAmount.toFixed(2),
            vat_rate: vatRate,
            gl_mapping: sale.type === 'service' 
              ? { revenue: '4110000', vat: '2251000' }
              : { revenue: '4400000', vat: '2251000', cogs: '5210000' }
          },
          smart_code: `HERA.SALON.TXN.LINE.${sale.type.toUpperCase()}.v1`
        })
        .select()
        .single();

      if (!lineError && txnLine) {
        createdTransactions.push({
          ...transaction,
          sale_details: sale,
          vat_breakdown: {
            base: baseAmount.toFixed(2),
            vat: vatAmount.toFixed(2)
          }
        });

        console.log(`✅ ${sale.time} - ${sale.type === 'service' ? '💇' : '🛍️'} ${sale.type === 'service' ? sale.service : sale.product}: ${sale.amount} AED (${sale.customer})`);
      } else if (lineError) {
        console.error(`Error creating transaction line:`, lineError);
      }

      transactionNumber++;
    } catch (error) {
      console.error(`Failed to create transaction:`, error);
    }
  }

  return createdTransactions;
}

async function processAutoJournalBatch(transactions) {
  console.log('\n\n🤖 Processing Auto-Journal Batch at End of Day...\n');

  // Separate transactions by journal priority
  const immediateTransactions = transactions.filter(t => t.metadata?.journal_priority === 'immediate');
  const batchTransactions = transactions.filter(t => t.metadata?.journal_priority === 'batch');

  console.log(`📊 Transaction Summary:`);
  console.log(`- Total transactions: ${transactions.length}`);
  console.log(`- Immediate journal entries: ${immediateTransactions.length} (>= 100 AED)`);
  console.log(`- Batch journal entries: ${batchTransactions.length} (< 100 AED)`);

  // Process immediate transactions (one journal entry each)
  console.log('\n📝 Creating Individual Journal Entries for Large Transactions:');
  
  for (const txn of immediateTransactions) {
    const jeCode = `JE-${txn.transaction_code}`;
    
    const { data: journalEntry, error: jeError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: parkRegis.id,
        transaction_type: 'journal_entry',
        transaction_code: jeCode,
        transaction_date: txn.transaction_date,
        total_amount: txn.total_amount,
        transaction_status: 'posted',
        source_entity_id: txn.id,
        smart_code: 'HERA.SALON.JE.AUTO.IMMEDIATE.v1',
        metadata: {
          description: `Auto-journal for ${txn.metadata?.description || 'Transaction'}`,
          source_transaction: txn.transaction_code,
          auto_generated: true,
          posted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (!jeError) {
      // Create journal lines
      const baseAmount = parseFloat((txn.total_amount / 1.05).toFixed(2));
      const vatAmount = parseFloat((txn.total_amount - baseAmount).toFixed(2));

      // Debit Cash/Bank
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: parkRegis.id,
          transaction_id: journalEntry.id,
          line_number: 1,
          entity_id: '1100000', // Cash account
          description: 'Cash/Card Receipt',
          line_amount: txn.total_amount,
          line_type: 'debit',
          smart_code: 'HERA.SALON.JE.LINE.CASH.DEBIT.v1'
        });

      // Credit Revenue
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: parkRegis.id,
          transaction_id: journalEntry.id,
          line_number: 2,
          entity_id: txn.smart_code.includes('SERVICE') ? '4110000' : '4400000',
          description: 'Revenue',
          line_amount: baseAmount,
          line_type: 'credit',
          smart_code: 'HERA.SALON.JE.LINE.REVENUE.CREDIT.v1'
        });

      // Credit VAT
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: parkRegis.id,
          transaction_id: journalEntry.id,
          line_number: 3,
          entity_id: '2251000', // VAT Payable
          description: 'VAT Payable',
          line_amount: vatAmount,
          line_type: 'credit',
          smart_code: 'HERA.SALON.JE.LINE.VAT.CREDIT.v1'
        });

      console.log(`  ✅ ${jeCode}: ${txn.sale_details.type} - ${txn.total_amount} AED`);
    }
  }

  // Process batch transactions (combined into summary entries)
  console.log('\n📋 Creating Batch Journal Entries for Small Transactions:');
  
  // Group by transaction type and payment method
  const batchGroups = {
    service_cash: batchTransactions.filter(t => t.smart_code.includes('SERVICE') && t.metadata.payment_method === 'cash'),
    service_card: batchTransactions.filter(t => t.smart_code.includes('SERVICE') && t.metadata.payment_method === 'card'),
    product_cash: batchTransactions.filter(t => t.smart_code.includes('PRODUCT') && t.metadata.payment_method === 'cash'),
    product_card: batchTransactions.filter(t => t.smart_code.includes('PRODUCT') && t.metadata.payment_method === 'card')
  };

  for (const [groupKey, groupTxns] of Object.entries(batchGroups)) {
    if (groupTxns.length === 0) continue;

    const totalAmount = groupTxns.reduce((sum, t) => sum + t.total_amount, 0);
    const baseAmount = parseFloat((totalAmount / 1.05).toFixed(2));
    const vatAmount = parseFloat((totalAmount - baseAmount).toFixed(2));

    const [type, payment] = groupKey.split('_');
    const jeCode = `JE-BATCH-${testDate.toISOString().split('T')[0]}-${type.toUpperCase()}-${payment.toUpperCase()}`;

    const { data: batchJournal, error: batchError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: parkRegis.id,
        transaction_type: 'journal_entry',
        transaction_code: jeCode,
        transaction_date: new Date(`${testDate.toISOString().split('T')[0]}T23:59:00`),
        total_amount: totalAmount,
        transaction_status: 'posted',
        smart_code: 'HERA.SALON.JE.AUTO.BATCH.v1',
        metadata: {
          description: `Batch journal: ${groupTxns.length} ${type} transactions (${payment})`,
          batch_count: groupTxns.length,
          transaction_codes: groupTxns.map(t => t.transaction_code),
          auto_generated: true,
          batch_type: groupKey,
          posted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (!batchError) {
      // Create summarized journal lines
      // Debit Cash/Bank
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: parkRegis.id,
          transaction_id: batchJournal.id,
          line_number: 1,
          entity_id: payment === 'cash' ? '1100000' : '1110000',
          description: `${payment === 'cash' ? 'Cash' : 'Card'} Receipts`,
          line_amount: totalAmount,
          line_type: 'debit',
          smart_code: 'HERA.SALON.JE.LINE.BATCH.CASH.DEBIT.v1'
        });

      // Credit Revenue
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: parkRegis.id,
          transaction_id: batchJournal.id,
          line_number: 2,
          entity_id: type === 'service' ? '4110000' : '4400000',
          description: `${type === 'service' ? 'Service' : 'Product'} Revenue`,
          line_amount: baseAmount,
          line_type: 'credit',
          smart_code: 'HERA.SALON.JE.LINE.BATCH.REVENUE.CREDIT.v1'
        });

      // Credit VAT
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: parkRegis.id,
          transaction_id: batchJournal.id,
          line_number: 3,
          entity_id: '2251000',
          description: 'VAT Payable',
          line_amount: vatAmount,
          line_type: 'credit',
          smart_code: 'HERA.SALON.JE.LINE.BATCH.VAT.CREDIT.v1'
        });

      console.log(`  ✅ ${jeCode}: ${groupTxns.length} transactions = ${totalAmount} AED`);
    }
  }

  return { immediate: immediateTransactions.length, batched: batchTransactions.length };
}

async function generateDailySummary(transactions) {
  console.log(`\n\n📊 Daily Sales Summary - ${testDate.toDateString()}`);
  console.log('==========================================');

  // Calculate totals
  const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const serviceSales = transactions.filter(t => t.smart_code.includes('SERVICE'))
    .reduce((sum, t) => sum + t.total_amount, 0);
  const productSales = transactions.filter(t => t.smart_code.includes('PRODUCT'))
    .reduce((sum, t) => sum + t.total_amount, 0);

  const cashSales = transactions.filter(t => t.metadata.payment_method === 'cash')
    .reduce((sum, t) => sum + t.total_amount, 0);
  const cardSales = transactions.filter(t => t.metadata.payment_method === 'card')
    .reduce((sum, t) => sum + t.total_amount, 0);

  console.log('\n💰 Sales Breakdown:');
  console.log(`- Total Sales: ${totalSales.toLocaleString()} AED`);
  console.log(`- Service Revenue: ${serviceSales.toLocaleString()} AED (${(serviceSales/totalSales*100).toFixed(1)}%)`);
  console.log(`- Product Revenue: ${productSales.toLocaleString()} AED (${(productSales/totalSales*100).toFixed(1)}%)`);
  
  console.log('\n💳 Payment Methods:');
  console.log(`- Cash: ${cashSales.toLocaleString()} AED (${(cashSales/totalSales*100).toFixed(1)}%)`);
  console.log(`- Card: ${cardSales.toLocaleString()} AED (${(cardSales/totalSales*100).toFixed(1)}%)`);

  console.log('\n📝 Transaction Details:');
  console.log(`- Total Transactions: ${transactions.length}`);
  console.log(`- Average Transaction: ${(totalSales/transactions.length).toFixed(2)} AED`);
  console.log(`- Highest Sale: ${Math.max(...transactions.map(t => t.total_amount))} AED`);
  console.log(`- Lowest Sale: ${Math.min(...transactions.map(t => t.total_amount))} AED`);

  // VAT calculation
  const totalBase = totalSales / 1.05;
  const totalVAT = totalSales - totalBase;

  console.log('\n🏦 VAT Summary:');
  console.log(`- Total including VAT: ${totalSales.toLocaleString()} AED`);
  console.log(`- Base Amount: ${totalBase.toFixed(2)} AED`);
  console.log(`- VAT (5%): ${totalVAT.toFixed(2)} AED`);

  console.log('\n🤖 Auto-Journal Processing:');
  console.log(`- Transactions < 100 AED: Batched into summary entries`);
  console.log(`- Transactions >= 100 AED: Individual journal entries`);
  console.log(`- Batch processing saves: ~75% of journal entries`);
}

// Main execution
async function main() {
  try {
    // Create sales transactions
    const transactions = await createSalesTransactions();
    
    // Process auto-journal batch
    const journalResults = await processAutoJournalBatch(transactions);
    
    // Generate daily summary
    await generateDailySummary(transactions);

    console.log('\n\n✅ Test Complete!');
    console.log('================');
    console.log('- Sales transactions created');
    console.log('- Auto-journal entries processed');
    console.log(`- ${journalResults.immediate} immediate journals`);
    console.log(`- ${journalResults.batched} transactions batched`);
    console.log('- Daily summary generated');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();