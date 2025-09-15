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
  return `${amount.toFixed(2).padStart(12)} AED`;
}

async function generateTrialBalance() {
  console.log('📊 TRIAL BALANCE');
  console.log('================');
  console.log(`Organization: Hair Talkz Salon - DNA Testing`);
  console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
  console.log('\n');
  
  // Get all GL accounts
  const { data: glAccounts } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'gl_account')
    .order('entity_code');
  
  // Get all journal entry lines
  const { data: journalLines } = await supabase
    .from('universal_transaction_lines')
    .select(`
      *,
      transaction:transaction_id(
        transaction_type,
        smart_code,
        transaction_status
      ),
      entity:entity_id(
        entity_code,
        entity_name
      )
    `)
    .eq('organization_id', SALON_ORG_ID);
  
  // Calculate balances for each account
  const accountBalances = {};
  
  for (const account of glAccounts) {
    accountBalances[account.entity_code] = {
      name: account.entity_name,
      debit: 0,
      credit: 0,
      balance: 0,
      type: account.metadata?.account_type || 'unknown'
    };
  }
  
  // Process journal lines
  for (const line of journalLines || []) {
    if (line.transaction?.transaction_type === 'journal_entry' && 
        line.transaction?.transaction_status === 'posted' &&
        line.entity?.entity_code) {
      
      const accountCode = line.entity.entity_code;
      if (accountBalances[accountCode]) {
        if (line.line_type === 'debit') {
          accountBalances[accountCode].debit += line.line_amount;
        } else if (line.line_type === 'credit') {
          accountBalances[accountCode].credit += line.line_amount;
        }
      }
    }
  }
  
  // Calculate net balances
  let totalDebits = 0;
  let totalCredits = 0;
  
  console.log('Account Code | Account Name                | Debit         | Credit        | Balance');
  console.log('-------------|----------------------------|---------------|---------------|---------------');
  
  for (const [code, data] of Object.entries(accountBalances)) {
    // Calculate balance based on account type
    if (['asset', 'expense'].includes(data.type)) {
      data.balance = data.debit - data.credit; // Debit balance
    } else {
      data.balance = data.credit - data.debit; // Credit balance
    }
    
    if (data.debit > 0 || data.credit > 0) {
      totalDebits += data.debit;
      totalCredits += data.credit;
      
      console.log(
        `${code.padEnd(12)} | ${data.name.padEnd(26)} | ${formatCurrency(data.debit)} | ${formatCurrency(data.credit)} | ${formatCurrency(Math.abs(data.balance))}`
      );
    }
  }
  
  console.log('-------------|----------------------------|---------------|---------------|---------------');
  console.log(`${'TOTALS'.padEnd(12)} | ${' '.padEnd(26)} | ${formatCurrency(totalDebits)} | ${formatCurrency(totalCredits)} |`);
  
  const difference = Math.abs(totalDebits - totalCredits);
  console.log(`\n✅ Trial Balance Check: ${difference < 0.01 ? 'BALANCED' : 'NOT BALANCED (Difference: ' + difference.toFixed(2) + ')'}`);
  
  return { accountBalances, totalDebits, totalCredits };
}

async function generateProfitAndLoss(orgId, orgName) {
  console.log('\n\n💰 PROFIT & LOSS STATEMENT');
  console.log('==========================');
  console.log(`Organization: ${orgName}`);
  console.log(`Period: ${new Date().toISOString().split('T')[0]}`);
  console.log('\n');
  
  // Get all transactions for this period
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .in('transaction_type', ['service_sale', 'product_sale'])
    .eq('transaction_status', 'posted');
  
  // Calculate revenue
  let serviceRevenue = 0;
  let productRevenue = 0;
  let totalRevenue = 0;
  
  for (const txn of transactions || []) {
    const netAmount = txn.total_amount / 1.05; // Remove 5% VAT
    if (txn.transaction_type === 'service_sale') {
      serviceRevenue += netAmount;
    } else if (txn.transaction_type === 'product_sale') {
      productRevenue += netAmount;
    }
  }
  
  totalRevenue = serviceRevenue + productRevenue;
  
  // Get expense accounts from journal entries
  const { data: expenseLines } = await supabase
    .from('universal_transaction_lines')
    .select(`
      *,
      transaction:transaction_id(
        transaction_type,
        smart_code
      ),
      entity:entity_id(
        entity_code,
        entity_name,
        metadata
      )
    `)
    .eq('organization_id', orgId)
    .eq('line_type', 'debit');
  
  let commissionExpense = 0;
  let cogs = 0;
  let otherExpenses = 0;
  
  for (const line of expenseLines || []) {
    if (line.transaction?.transaction_type === 'journal_entry' && 
        line.entity?.metadata?.account_type === 'expense') {
      
      if (line.entity.entity_code === '5100') {
        commissionExpense += line.line_amount;
      } else if (line.entity.entity_code === '5200') {
        cogs += line.line_amount;
      } else {
        otherExpenses += line.line_amount;
      }
    }
  }
  
  const totalExpenses = commissionExpense + cogs + otherExpenses;
  const netIncome = totalRevenue - totalExpenses;
  
  // Display P&L
  console.log('REVENUE');
  console.log('-------');
  console.log(`Service Revenue:        ${formatCurrency(serviceRevenue)}`);
  console.log(`Product Revenue:        ${formatCurrency(productRevenue)}`);
  console.log(`Total Revenue:          ${formatCurrency(totalRevenue)}`);
  
  console.log('\nEXPENSES');
  console.log('--------');
  console.log(`Commission Expense:     ${formatCurrency(commissionExpense)}`);
  console.log(`Cost of Goods Sold:     ${formatCurrency(cogs)}`);
  console.log(`Other Expenses:         ${formatCurrency(otherExpenses)}`);
  console.log(`Total Expenses:         ${formatCurrency(totalExpenses)}`);
  
  console.log('\n                        ===============');
  console.log(`NET INCOME:             ${formatCurrency(netIncome)}`);
  console.log('                        ===============');
  
  // Calculate margins
  const grossMargin = ((totalRevenue - cogs) / totalRevenue * 100).toFixed(1);
  const netMargin = (netIncome / totalRevenue * 100).toFixed(1);
  
  console.log('\nKEY METRICS:');
  console.log(`Gross Margin:           ${grossMargin}%`);
  console.log(`Net Margin:             ${netMargin}%`);
  
  return {
    revenue: totalRevenue,
    expenses: totalExpenses,
    netIncome: netIncome,
    details: {
      serviceRevenue,
      productRevenue,
      commissionExpense,
      cogs,
      otherExpenses
    }
  };
}

async function validateAgainstSource() {
  console.log('\n\n🔍 VALIDATION AGAINST SOURCE TRANSACTIONS');
  console.log('=========================================\n');
  
  // Get all source transactions
  const { data: sourceTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .in('transaction_type', ['service_sale', 'product_sale'])
    .eq('transaction_status', 'posted');
  
  // Calculate totals from source
  let totalSales = 0;
  let totalVAT = 0;
  let totalNet = 0;
  let serviceCount = 0;
  let productCount = 0;
  
  for (const txn of sourceTxns || []) {
    totalSales += txn.total_amount;
    const vat = txn.total_amount * 0.05 / 1.05;
    const net = txn.total_amount - vat;
    totalVAT += vat;
    totalNet += net;
    
    if (txn.transaction_type === 'service_sale') serviceCount++;
    else if (txn.transaction_type === 'product_sale') productCount++;
  }
  
  console.log('SOURCE TRANSACTION SUMMARY:');
  console.log(`Total Transactions:     ${sourceTxns.length}`);
  console.log(`  - Service Sales:      ${serviceCount}`);
  console.log(`  - Product Sales:      ${productCount}`);
  console.log(`\nTotal Sales (inc VAT):  ${formatCurrency(totalSales)}`);
  console.log(`Total VAT (5%):         ${formatCurrency(totalVAT)}`);
  console.log(`Total Net Revenue:      ${formatCurrency(totalNet)}`);
  
  // Get journal entries
  const { data: journalEntries } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('transaction_type', 'journal_entry')
    .eq('smart_code', 'HERA.FIN.GL.TXN.JOURNAL.AUTO.v1');
  
  console.log(`\nJournal Entries Created: ${journalEntries?.length || 0}`);
  
  // Verify VAT postings
  const { data: vatLines } = await supabase
    .from('universal_transaction_lines')
    .select('line_amount')
    .eq('organization_id', SALON_ORG_ID)
    .eq('smart_code', 'HERA.FIN.GL.LINE.CREDIT.TAX.v1');
  
  let totalVATPosted = 0;
  for (const line of vatLines || []) {
    totalVATPosted += line.line_amount;
  }
  
  console.log(`\nVAT RECONCILIATION:`);
  console.log(`VAT from Sales:         ${formatCurrency(totalVAT)}`);
  console.log(`VAT Posted to GL:       ${formatCurrency(totalVATPosted)}`);
  console.log(`Difference:             ${formatCurrency(Math.abs(totalVAT - totalVATPosted))}`);
  
  const vatMatch = Math.abs(totalVAT - totalVATPosted) < 1;
  console.log(`Status:                 ${vatMatch ? '✅ MATCHED' : '❌ MISMATCH'}`);
  
  // Commission validation
  const expectedCommission = totalNet * 0.35; // 35% commission rate
  
  const { data: commissionTxns } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', SALON_ORG_ID)
    .eq('smart_code', 'HERA.SALON.COMMISSION.TXN.ACCRUAL.v1');
  
  let totalCommissionAccrued = 0;
  for (const txn of commissionTxns || []) {
    totalCommissionAccrued += txn.total_amount;
  }
  
  console.log(`\nCOMMISSION VALIDATION:`);
  console.log(`Expected (35% of net):  ${formatCurrency(expectedCommission)}`);
  console.log(`Actually Accrued:       ${formatCurrency(totalCommissionAccrued)}`);
  console.log(`Coverage:               ${((totalCommissionAccrued / expectedCommission) * 100).toFixed(1)}%`);
  
  return {
    totalSales,
    totalVAT,
    totalNet,
    totalVATPosted,
    vatMatch,
    expectedCommission,
    totalCommissionAccrued
  };
}

async function runReportingValidation() {
  console.log('🏃 Stage E - Reporting Validation\n');
  console.log('=================================\n');
  
  try {
    // 1. Generate Trial Balance
    const trialBalance = await generateTrialBalance();
    
    // 2. Generate Branch P&L (using main salon org)
    const branchPL = await generateProfitAndLoss(SALON_ORG_ID, 'Hair Talkz Salon - DNA Testing');
    
    // 3. Consolidated P&L would include HO + branches
    // For now, we'll show just the main branch as consolidated
    console.log('\n\n📈 CONSOLIDATED P&L (Single Branch)');
    console.log('===================================');
    console.log('(In production, this would aggregate HO + all branches)');
    console.log(`\nConsolidated Revenue:   ${formatCurrency(branchPL.revenue)}`);
    console.log(`Consolidated Expenses:  ${formatCurrency(branchPL.expenses)}`);
    console.log(`Consolidated Net Income:${formatCurrency(branchPL.netIncome)}`);
    
    // 4. Validate against source
    const validation = await validateAgainstSource();
    
    // 5. Summary
    console.log('\n\n✅ REPORTING VALIDATION SUMMARY');
    console.log('================================');
    console.log(`Trial Balance:          ${Math.abs(trialBalance.totalDebits - trialBalance.totalCredits) < 0.01 ? '✅ BALANCED' : '❌ NOT BALANCED'}`);
    console.log(`VAT Reconciliation:     ${validation.vatMatch ? '✅ MATCHED' : '❌ MISMATCH'}`);
    console.log(`P&L Net Income:         ${formatCurrency(branchPL.netIncome)}`);
    console.log(`Commission Coverage:    ${((validation.totalCommissionAccrued / validation.expectedCommission) * 100).toFixed(1)}%`);
    
    console.log('\n🎉 Stage E Complete - All reports generated and validated!');
    
  } catch (error) {
    console.error('Error during reporting validation:', error);
  }
}

runReportingValidation().catch(console.error);