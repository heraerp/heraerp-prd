#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = "0fd09e31-d257-4329-97eb-7d7f522ed6f0";

// Helper function to format currency
function formatCurrency(amount) {
  return `${amount.toFixed(2)} AED`;
}

async function runCommissionAccrualBatch() {
  console.log('💰 Running Commission Accrual Batch\n');
  console.log('==================================\n');
  
  // Get all service sale transactions that don't have commission accruals yet
  const { data: serviceSales } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines(*)
    `)
    .eq('organization_id', SALON_ORG_ID)
    .eq('transaction_type', 'service_sale')
    .eq('transaction_status', 'posted');
  
  console.log(`Found ${serviceSales?.length || 0} service sale transactions\n`);
  
  // Check which ones already have commission accruals
  const { data: existingCommissions } = await supabase
    .from('universal_transactions')
    .select('metadata')
    .eq('organization_id', SALON_ORG_ID)
    .eq('smart_code', 'HERA.SALON.COMMISSION.TXN.ACCRUAL.v1');
  
  const processedTxns = new Set();
  existingCommissions?.forEach(comm => {
    if (comm.metadata?.source_transaction) {
      processedTxns.add(comm.metadata.source_transaction);
    }
  });
  
  console.log(`Already processed: ${processedTxns.size} transactions\n`);
  
  // Get GL accounts for commission posting
  const { data: glAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['5100', '2300']);
  
  const commissionExpenseAccount = glAccounts?.find(a => a.entity_code === '5100');
  const commissionPayableAccount = glAccounts?.find(a => a.entity_code === '2300');
  
  if (!commissionExpenseAccount || !commissionPayableAccount) {
    console.error('❌ GL accounts not found for commission posting');
    return;
  }
  
  // Process commission accruals
  let totalAccrued = 0;
  let transactionsProcessed = 0;
  const commissionRate = 0.35; // 35% commission rate
  
  console.log('Processing commission accruals...\n');
  
  for (const sale of serviceSales || []) {
    // Skip if already processed
    if (processedTxns.has(sale.transaction_code)) {
      continue;
    }
    
    // Calculate commission on net amount (excluding VAT)
    const netAmount = sale.total_amount / 1.05; // Remove 5% VAT
    const commissionAmount = netAmount * commissionRate;
    
    // Create commission accrual journal entry
    const commissionJE = {
      organization_id: SALON_ORG_ID,
      transaction_type: 'journal_entry',
      transaction_code: `JE-COMM-${sale.transaction_code}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.SALON.COMMISSION.TXN.ACCRUAL.v1',
      total_amount: commissionAmount,
      source_entity_id: sale.target_entity_id, // Stylist earning commission
      transaction_status: 'posted',
      metadata: {
        commission_type: 'stylist',
        commission_rate: commissionRate,
        source_transaction: sale.transaction_code,
        source_transaction_id: sale.id,
        service_amount: sale.total_amount,
        net_amount: netAmount,
        batch_run: new Date().toISOString()
      }
    };
    
    const { data: je, error: jeError } = await supabase
      .from('universal_transactions')
      .insert(commissionJE)
      .select()
      .single();
    
    if (jeError) {
      console.error(`Error creating commission JE for ${sale.transaction_code}:`, jeError);
      continue;
    }
    
    // Create journal entry lines
    const journalLines = [
      {
        organization_id: SALON_ORG_ID,
        transaction_id: je.id,
        line_number: 1,
        entity_id: commissionExpenseAccount.id,
        line_type: 'debit',
        description: `Commission Expense - ${sale.transaction_code}`,
        quantity: 1,
        unit_amount: commissionAmount,
        line_amount: commissionAmount,
        smart_code: 'HERA.SALON.COMMISSION.LINE.EXPENSE.v1',
        line_data: {
          account_code: '5100',
          account_name: commissionExpenseAccount.entity_name,
          stylist_id: sale.target_entity_id
        }
      },
      {
        organization_id: SALON_ORG_ID,
        transaction_id: je.id,
        line_number: 2,
        entity_id: commissionPayableAccount.id,
        line_type: 'credit',
        description: `Commission Payable - ${sale.transaction_code}`,
        quantity: 1,
        unit_amount: commissionAmount,
        line_amount: commissionAmount,
        smart_code: 'HERA.SALON.COMMISSION.LINE.PAYABLE.v1',
        line_data: {
          account_code: '2300',
          account_name: commissionPayableAccount.entity_name,
          stylist_id: sale.target_entity_id
        }
      }
    ];
    
    const { error: linesError } = await supabase
      .from('universal_transaction_lines')
      .insert(journalLines);
    
    if (!linesError) {
      totalAccrued += commissionAmount;
      transactionsProcessed++;
      
      if (transactionsProcessed % 10 === 0) {
        process.stdout.write(`\rProcessed: ${transactionsProcessed} transactions, Total accrued: ${formatCurrency(totalAccrued)}`);
      }
    }
  }
  
  console.log(`\n\n✅ Commission Accrual Batch Complete`);
  console.log(`   Transactions processed: ${transactionsProcessed}`);
  console.log(`   Total commission accrued: ${formatCurrency(totalAccrued)}`);
  
  return { transactionsProcessed, totalAccrued };
}

async function validateCommissionPostings() {
  console.log('\n\n🔍 Validating Commission Postings\n');
  console.log('=================================\n');
  
  // Get commission expense lines (debits to 5100)
  const { data: expenseLines } = await supabase
    .from('universal_transaction_lines')
    .select(`
      *,
      entity:entity_id(entity_code, entity_name)
    `)
    .eq('organization_id', SALON_ORG_ID)
    .eq('smart_code', 'HERA.SALON.COMMISSION.LINE.EXPENSE.v1')
    .eq('line_type', 'debit');
  
  // Get commission payable lines (credits to 2300)
  const { data: payableLines } = await supabase
    .from('universal_transaction_lines')
    .select(`
      *,
      entity:entity_id(entity_code, entity_name)
    `)
    .eq('organization_id', SALON_ORG_ID)
    .eq('smart_code', 'HERA.SALON.COMMISSION.LINE.PAYABLE.v1')
    .eq('line_type', 'credit');
  
  let totalExpense = 0;
  let totalPayable = 0;
  
  for (const line of expenseLines || []) {
    totalExpense += line.line_amount;
  }
  
  for (const line of payableLines || []) {
    totalPayable += line.line_amount;
  }
  
  console.log(`Commission Expense (5100) Debits:  ${formatCurrency(totalExpense)}`);
  console.log(`Commission Payable (2300) Credits: ${formatCurrency(totalPayable)}`);
  console.log(`Balance Check: ${Math.abs(totalExpense - totalPayable) < 0.01 ? '✅ BALANCED' : '❌ NOT BALANCED'}`);
  
  // Show account postings
  console.log('\nAccount Postings Summary:');
  console.log('------------------------');
  console.log(`5100 - Commission Expense:  Dr ${formatCurrency(totalExpense)}`);
  console.log(`2300 - Commission Payable:     Cr ${formatCurrency(totalPayable)}`);
  
  return { totalExpense, totalPayable };
}

async function createPayrollBatch() {
  console.log('\n\n📋 Creating Payroll Batch\n');
  console.log('========================\n');
  
  // Get all stylists with their commission balances
  const { data: stylists } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'employee')
    .eq('status', 'active');
  
  // Calculate commission balances by stylist
  const stylistCommissions = {};
  
  // Get all commission transactions
  const { data: commissionTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('smart_code', 'HERA.SALON.COMMISSION.TXN.ACCRUAL.v1')
    .eq('transaction_status', 'posted');
  
  for (const comm of commissionTxns || []) {
    const stylistId = comm.source_entity_id;
    if (!stylistCommissions[stylistId]) {
      stylistCommissions[stylistId] = {
        total: 0,
        transactions: 0
      };
    }
    stylistCommissions[stylistId].total += comm.total_amount;
    stylistCommissions[stylistId].transactions++;
  }
  
  // Create payroll batch entity
  const payrollBatch = {
    organization_id: SALON_ORG_ID,
    entity_type: 'payroll_batch',
    entity_code: `PAYROLL-${new Date().toISOString().slice(0, 7)}`,
    entity_name: `Payroll Batch - ${new Date().toISOString().slice(0, 7)}`,
    smart_code: 'HERA.SALON.PAYROLL.BATCH.MONTHLY.v1',
    status: 'draft',
    metadata: {
      pay_period: {
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
      },
      batch_type: 'commission',
      created_date: new Date().toISOString(),
      total_amount: 0,
      employee_count: 0,
      line_items: []
    }
  };
  
  let totalPayroll = 0;
  let employeeCount = 0;
  
  console.log('Stylist Commission Summary:');
  console.log('--------------------------\n');
  
  for (const stylist of stylists || []) {
    const commission = stylistCommissions[stylist.id] || { total: 0, transactions: 0 };
    
    if (commission.total > 0) {
      console.log(`${stylist.entity_name.padEnd(20)} | ${formatCurrency(commission.total).padStart(12)} | ${commission.transactions} transactions`);
      
      payrollBatch.metadata.line_items.push({
        employee_id: stylist.id,
        employee_name: stylist.entity_name,
        employee_code: stylist.entity_code,
        commission_amount: commission.total,
        transaction_count: commission.transactions,
        payment_method: 'bank_transfer'
      });
      
      totalPayroll += commission.total;
      employeeCount++;
    }
  }
  
  payrollBatch.metadata.total_amount = totalPayroll;
  payrollBatch.metadata.employee_count = employeeCount;
  
  // Save payroll batch
  const { data: batch, error } = await supabase
    .from('core_entities')
    .insert(payrollBatch)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating payroll batch:', error);
    return;
  }
  
  console.log(`\n✅ Payroll Batch Created: ${batch.entity_code}`);
  console.log(`   Total Payroll: ${formatCurrency(totalPayroll)}`);
  console.log(`   Employees: ${employeeCount}`);
  
  return batch;
}

async function mapCommissionsToPayroll(payrollBatchId) {
  console.log('\n\n🔄 Mapping Commissions to Payroll Payable\n');
  console.log('========================================\n');
  
  // Get payroll batch details
  const { data: payrollBatch } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', payrollBatchId)
    .single();
  
  if (!payrollBatch) {
    console.error('Payroll batch not found');
    return;
  }
  
  // Get GL accounts
  const { data: glAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['2300', '2100']); // Commission Payable, Accounts Payable
  
  const commissionPayableAccount = glAccounts?.find(a => a.entity_code === '2300');
  const accountsPayableAccount = glAccounts?.find(a => a.entity_code === '2100');
  
  // Create payroll journal entry to transfer from Commission Payable to Payroll Payable
  const payrollJE = {
    organization_id: SALON_ORG_ID,
    transaction_type: 'journal_entry',
    transaction_code: `JE-PAYROLL-${payrollBatch.entity_code}`,
    transaction_date: new Date().toISOString(),
    smart_code: 'HERA.SALON.PAYROLL.TXN.TRANSFER.v1',
    total_amount: payrollBatch.metadata.total_amount,
    source_entity_id: payrollBatchId,
    transaction_status: 'posted',
    metadata: {
      payroll_batch: payrollBatch.entity_code,
      transfer_type: 'commission_to_payroll',
      employee_count: payrollBatch.metadata.employee_count
    }
  };
  
  const { data: je, error: jeError } = await supabase
    .from('universal_transactions')
    .insert(payrollJE)
    .select()
    .single();
  
  if (jeError) {
    console.error('Error creating payroll JE:', jeError);
    return;
  }
  
  // Create journal lines
  const journalLines = [
    {
      organization_id: SALON_ORG_ID,
      transaction_id: je.id,
      line_number: 1,
      entity_id: commissionPayableAccount.id,
      line_type: 'debit',
      description: 'Clear Commission Payable',
      quantity: 1,
      unit_amount: payrollBatch.metadata.total_amount,
      line_amount: payrollBatch.metadata.total_amount,
      smart_code: 'HERA.SALON.PAYROLL.LINE.CLEAR_COMMISSION.v1'
    },
    {
      organization_id: SALON_ORG_ID,
      transaction_id: je.id,
      line_number: 2,
      entity_id: accountsPayableAccount.id,
      line_type: 'credit',
      description: 'Payroll Payable',
      quantity: 1,
      unit_amount: payrollBatch.metadata.total_amount,
      line_amount: payrollBatch.metadata.total_amount,
      smart_code: 'HERA.SALON.PAYROLL.LINE.PAYABLE.v1'
    }
  ];
  
  await supabase
    .from('universal_transaction_lines')
    .insert(journalLines);
  
  console.log('Journal Entry Created:');
  console.log('--------------------');
  console.log(`Dr: Commission Payable (2300)    ${formatCurrency(payrollBatch.metadata.total_amount)}`);
  console.log(`Cr: Payroll Payable (2100)       ${formatCurrency(payrollBatch.metadata.total_amount)}`);
  
  // Update payroll batch status
  await supabase
    .from('core_entities')
    .update({ 
      status: 'approved',
      metadata: {
        ...payrollBatch.metadata,
        approved_date: new Date().toISOString(),
        journal_entry: je.transaction_code
      }
    })
    .eq('id', payrollBatchId);
  
  console.log(`\n✅ Payroll batch approved and mapped to payable`);
  
  return je;
}

async function exportPayrollFile(payrollBatchId) {
  console.log('\n\n📄 Exporting Payroll File\n');
  console.log('========================\n');
  
  // Get payroll batch with details
  const { data: batch } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', payrollBatchId)
    .single();
  
  if (!batch) {
    console.error('Payroll batch not found');
    return;
  }
  
  // Generate CSV format for bank upload
  console.log('PAYROLL EXPORT FILE');
  console.log('==================\n');
  console.log('Employee Code,Employee Name,Amount,Payment Method,Reference');
  console.log('-----------------------------------------------------------');
  
  for (const item of batch.metadata.line_items || []) {
    console.log(`${item.employee_code},${item.employee_name},${item.commission_amount.toFixed(2)},${item.payment_method},COMM-${batch.entity_code}`);
  }
  
  console.log('-----------------------------------------------------------');
  console.log(`TOTAL,,${batch.metadata.total_amount.toFixed(2)},,`);
  
  console.log(`\n✅ Payroll file ready for export`);
  console.log(`   Format: CSV for bank upload`);
  console.log(`   Total: ${formatCurrency(batch.metadata.total_amount)}`);
  console.log(`   Employees: ${batch.metadata.employee_count}`);
}

async function runCommissionAndPayroll() {
  console.log('🏃 Stage F - Commissions & Payroll\n');
  console.log('==================================\n');
  
  try {
    // 1. Run commission accrual batch
    const accrualResult = await runCommissionAccrualBatch();
    
    // 2. Validate commission postings
    const validation = await validateCommissionPostings();
    
    // 3. Create payroll batch
    const payrollBatch = await createPayrollBatch();
    
    if (payrollBatch) {
      // 4. Map commissions to payroll
      await mapCommissionsToPayroll(payrollBatch.id);
      
      // 5. Export payroll file
      await exportPayrollFile(payrollBatch.id);
    }
    
    console.log('\n\n🎉 Stage F Complete - Commission & Payroll Processing Done!');
    
  } catch (error) {
    console.error('Error during commission/payroll processing:', error);
  }
}

runCommissionAndPayroll().catch(console.error);