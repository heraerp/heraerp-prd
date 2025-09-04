const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hair Talkz organizations
const organizations = [
  {
    id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
    code: "SALON-BR1", 
    name: "Hair Talkz • Park Regis Kris Kin (Karama)"
  },
  {
    id: "0b1b37cd-4096-4718-8cd4-e370f234005b",
    code: "SALON-BR2",
    name: "Hair Talkz • Mercure Gold (Al Mina Rd)"
  },
  {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP",
    name: "Salon Group"
  }
];

// Trial balance periods
const trialBalancePeriod = {
  startDate: '2025-01-01',
  endDate: '2025-09-02',
  periodName: 'Year to Date 2025'
};

// GL Account classifications for trial balance
const accountClassifications = {
  // Assets (Normal Debit Balance)
  '1100000': { name: 'Cash and Cash Equivalents', type: 'Asset', category: 'Current Assets', normalBalance: 'Debit' },
  '1110000': { name: 'Bank - Card Processing', type: 'Asset', category: 'Current Assets', normalBalance: 'Debit' },
  '1200000': { name: 'Accounts Receivable', type: 'Asset', category: 'Current Assets', normalBalance: 'Debit' },
  '1300000': { name: 'Inventory - Products', type: 'Asset', category: 'Current Assets', normalBalance: 'Debit' },
  '1310000': { name: 'Inventory - Supplies', type: 'Asset', category: 'Current Assets', normalBalance: 'Debit' },
  '1500000': { name: 'Equipment', type: 'Asset', category: 'Fixed Assets', normalBalance: 'Debit' },
  '1510000': { name: 'Accumulated Depreciation - Equipment', type: 'Asset', category: 'Fixed Assets', normalBalance: 'Credit' },
  '1600000': { name: 'Furniture & Fixtures', type: 'Asset', category: 'Fixed Assets', normalBalance: 'Debit' },
  '1610000': { name: 'Accumulated Depreciation - F&F', type: 'Asset', category: 'Fixed Assets', normalBalance: 'Credit' },

  // Liabilities (Normal Credit Balance)
  '2100000': { name: 'Accounts Payable', type: 'Liability', category: 'Current Liabilities', normalBalance: 'Credit' },
  '2200000': { name: 'Accrued Expenses', type: 'Liability', category: 'Current Liabilities', normalBalance: 'Credit' },
  '2250000': { name: 'Sales Tax Payable', type: 'Liability', category: 'Current Liabilities', normalBalance: 'Credit' },
  '2251000': { name: 'VAT Payable', type: 'Liability', category: 'Current Liabilities', normalBalance: 'Credit' },
  '2300000': { name: 'Staff Payroll Payable', type: 'Liability', category: 'Current Liabilities', normalBalance: 'Credit' },
  '2400000': { name: 'Long-term Debt', type: 'Liability', category: 'Long-term Liabilities', normalBalance: 'Credit' },

  // Equity (Normal Credit Balance)
  '3100000': { name: 'Owner Capital', type: 'Equity', category: 'Equity', normalBalance: 'Credit' },
  '3200000': { name: 'Retained Earnings', type: 'Equity', category: 'Equity', normalBalance: 'Credit' },
  '3900000': { name: 'Current Year Earnings', type: 'Equity', category: 'Equity', normalBalance: 'Credit' },

  // Revenue (Normal Credit Balance)
  '4100000': { name: 'Service Revenue - Hair Cutting', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit' },
  '4110000': { name: 'Service Revenue - Hair Coloring', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit' },
  '4120000': { name: 'Service Revenue - Hair Treatments', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit' },
  '4130000': { name: 'Service Revenue - Hair Styling', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit' },
  '4200000': { name: 'Service Revenue - Beauty Services', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit' },
  '4400000': { name: 'Product Sales Revenue', type: 'Revenue', category: 'Operating Revenue', normalBalance: 'Credit' },

  // Expenses (Normal Debit Balance)
  '5100000': { name: 'Cost of Goods Sold - Products', type: 'Expense', category: 'Cost of Sales', normalBalance: 'Debit' },
  '5110000': { name: 'Cost of Services - Supplies', type: 'Expense', category: 'Cost of Sales', normalBalance: 'Debit' },
  '6100000': { name: 'Staff Salaries & Wages', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6110000': { name: 'Commission Expenses', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6200000': { name: 'Rent Expense', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6300000': { name: 'Utilities Expense', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6400000': { name: 'Marketing & Advertising', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6500000': { name: 'Insurance Expense', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6600000': { name: 'Depreciation Expense', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6700000': { name: 'Professional Services', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6800000': { name: 'Office Supplies', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' },
  '6900000': { name: 'Other Operating Expenses', type: 'Expense', category: 'Operating Expenses', normalBalance: 'Debit' }
};

async function getTrialBalanceData(organizationId) {
  try {
    console.log(`Fetching trial balance data for organization: ${organizationId}`);
    
    // Get all GL accounts (stored as entities with entity_type = 'gl_account')
    const { data: glAccounts, error: accountsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .order('entity_code');

    if (accountsError) {
      console.error('Error fetching GL accounts:', accountsError);
      return null;
    }

    // Get all transactions for the period
    const { data: transactions, error: transactionsError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*)
      `)
      .eq('organization_id', organizationId)
      .gte('transaction_date', trialBalancePeriod.startDate)
      .lte('transaction_date', trialBalancePeriod.endDate)
      .order('transaction_date');

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return null;
    }

    return {
      glAccounts: glAccounts || [],
      transactions: transactions || []
    };

  } catch (error) {
    console.error('Error in getTrialBalanceData:', error);
    return null;
  }
}

function calculateAccountBalances(transactions) {
  const accountBalances = {};
  
  transactions.forEach(transaction => {
    if (transaction.universal_transaction_lines) {
      transaction.universal_transaction_lines.forEach(line => {
        const accountCode = line.entity_id || 'UNASSIGNED';
        const amount = line.line_amount || 0;
        const lineType = line.line_type || 'unknown';
        
        if (!accountBalances[accountCode]) {
          accountBalances[accountCode] = {
            debitTotal: 0,
            creditTotal: 0,
            netBalance: 0,
            transactionCount: 0
          };
        }
        
        accountBalances[accountCode].transactionCount += 1;
        
        if (lineType === 'debit' || lineType === 'dr') {
          accountBalances[accountCode].debitTotal += Math.abs(amount);
        } else if (lineType === 'credit' || lineType === 'cr') {
          accountBalances[accountCode].creditTotal += Math.abs(amount);
        } else {
          // If line type is unclear, classify by amount sign
          if (amount >= 0) {
            accountBalances[accountCode].debitTotal += amount;
          } else {
            accountBalances[accountCode].creditTotal += Math.abs(amount);
          }
        }
        
        // Calculate net balance (Debit - Credit)
        accountBalances[accountCode].netBalance = 
          accountBalances[accountCode].debitTotal - accountBalances[accountCode].creditTotal;
      });
    }
  });
  
  return accountBalances;
}

function classifyTransactionsBySmartCode(transactions) {
  const categories = {
    serviceRevenue: 0,
    productRevenue: 0,
    operatingExpenses: 0,
    costOfSales: 0,
    assets: 0,
    liabilities: 0,
    equity: 0
  };
  
  transactions.forEach(transaction => {
    const smartCode = transaction.smart_code || '';
    const amount = Math.abs(transaction.total_amount || 0);
    
    if (smartCode.includes('SVC.') || smartCode.includes('SERVICE')) {
      categories.serviceRevenue += amount;
    } else if (smartCode.includes('PRODUCT') || smartCode.includes('RETAIL')) {
      categories.productRevenue += amount;
    } else if (smartCode.includes('EXP.') || smartCode.includes('PAY.')) {
      categories.operatingExpenses += amount;
    } else if (smartCode.includes('COGS') || smartCode.includes('COST')) {
      categories.costOfSales += amount;
    } else if (smartCode.includes('ASSET') || smartCode.includes('EQP.')) {
      categories.assets += amount;
    }
  });
  
  return categories;
}

async function generateTrialBalance(organizationId, organizationName) {
  console.log(`\n💼 GENERATING TRIAL BALANCE`);
  console.log('='.repeat(80));
  console.log(`Organization: ${organizationName}`);
  console.log(`Period: ${trialBalancePeriod.periodName}`);
  console.log(`Date Range: ${trialBalancePeriod.startDate} to ${trialBalancePeriod.endDate}`);
  console.log('='.repeat(80));

  const data = await getTrialBalanceData(organizationId);
  if (!data) {
    console.log('❌ Could not retrieve trial balance data');
    return;
  }

  console.log(`\n📊 Data Summary:`);
  console.log(`- GL Accounts Found: ${data.glAccounts.length}`);
  console.log(`- Transactions Found: ${data.transactions.length}`);
  
  if (data.transactions.length === 0) {
    console.log(`\n⚠️  No transactions found for the period`);
    console.log(`   This may indicate:`);
    console.log(`   - No business activity recorded`);
    console.log(`   - Transactions are in different date range`);
    console.log(`   - Organization is used for consolidation only`);
    return;
  }

  // Calculate account balances from transactions
  const accountBalances = calculateAccountBalances(data.transactions);
  
  // Classify transactions by smart codes
  const transactionCategories = classifyTransactionsBySmartCode(data.transactions);

  console.log(`\n📈 Transaction Analysis:`);
  console.log(`- Service Revenue: ${transactionCategories.serviceRevenue.toFixed(2)} AED`);
  console.log(`- Product Revenue: ${transactionCategories.productRevenue.toFixed(2)} AED`);
  console.log(`- Operating Expenses: ${transactionCategories.operatingExpenses.toFixed(2)} AED`);

  // Generate Trial Balance Report
  console.log(`\n📋 TRIAL BALANCE - ${organizationName.toUpperCase()}`);
  console.log(`As of ${trialBalancePeriod.endDate}`);
  console.log('─'.repeat(100));
  console.log('Account Code │ Account Name                      │    Debit │   Credit │ Net Balance');
  console.log('─'.repeat(100));

  let totalDebits = 0;
  let totalCredits = 0;
  let totalNetBalance = 0;
  let balancedAccounts = 0;

  // Group accounts by type for better presentation
  const accountsByType = {
    'Assets': [],
    'Liabilities': [], 
    'Equity': [],
    'Revenue': [],
    'Expenses': []
  };

  // Process each account with balance
  Object.entries(accountBalances).forEach(([accountCode, balance]) => {
    const accountInfo = accountClassifications[accountCode] || {
      name: `Account ${accountCode}`,
      type: 'Unknown',
      category: 'Other',
      normalBalance: 'Debit'
    };

    const debitAmount = balance.debitTotal;
    const creditAmount = balance.creditTotal; 
    const netBalance = balance.netBalance;

    totalDebits += debitAmount;
    totalCredits += creditAmount;
    totalNetBalance += netBalance;

    if (debitAmount > 0 || creditAmount > 0) {
      balancedAccounts++;
      
      const accountType = accountInfo.type;
      if (!accountsByType[accountType]) {
        accountsByType[accountType] = [];
      }
      
      accountsByType[accountType].push({
        code: accountCode,
        name: accountInfo.name,
        debit: debitAmount,
        credit: creditAmount,
        netBalance: netBalance,
        normalBalance: accountInfo.normalBalance
      });
    }
  });

  // Display accounts grouped by type
  Object.entries(accountsByType).forEach(([type, accounts]) => {
    if (accounts.length > 0) {
      console.log(`\n${type.toUpperCase()}:`);
      
      accounts.forEach(account => {
        const code = account.code.padEnd(12);
        const name = account.name.padEnd(33);
        const debit = account.debit > 0 ? account.debit.toFixed(2).padStart(9) : '-'.padStart(9);
        const credit = account.credit > 0 ? account.credit.toFixed(2).padStart(9) : '-'.padStart(9);
        const net = account.netBalance.toFixed(2).padStart(11);
        
        console.log(`${code} │ ${name} │ ${debit} │ ${credit} │ ${net}`);
      });
    }
  });

  // Trial Balance Totals
  console.log('─'.repeat(100));
  const totalDebitStr = totalDebits.toFixed(2).padStart(9);
  const totalCreditStr = totalCredits.toFixed(2).padStart(9);
  const netBalanceStr = totalNetBalance.toFixed(2).padStart(11);
  
  console.log(`${'TOTALS'.padEnd(12)} │ ${''.padEnd(33)} │ ${totalDebitStr} │ ${totalCreditStr} │ ${netBalanceStr}`);
  console.log('─'.repeat(100));

  // Trial Balance Analysis
  console.log(`\n📊 TRIAL BALANCE ANALYSIS:`);
  console.log(`- Total Accounts with Activity: ${balancedAccounts}`);
  console.log(`- Total Debits: ${totalDebits.toFixed(2)} AED`);
  console.log(`- Total Credits: ${totalCredits.toFixed(2)} AED`);
  console.log(`- Net Position: ${totalNetBalance.toFixed(2)} AED`);
  
  const balanceDifference = totalDebits - totalCredits;
  console.log(`- Balance Difference: ${balanceDifference.toFixed(2)} AED`);
  
  if (Math.abs(balanceDifference) < 0.01) {
    console.log(`✅ Trial Balance is BALANCED`);
  } else {
    console.log(`⚠️  Trial Balance has ${Math.abs(balanceDifference).toFixed(2)} AED difference`);
    console.log(`   This may indicate:`);
    console.log(`   - Incomplete journal entries`);
    console.log(`   - Data entry errors`);
    console.log(`   - Timing differences`);
  }

  // Key Financial Ratios
  const totalAssets = accountsByType['Assets']?.reduce((sum, acc) => sum + (acc.normalBalance === 'Debit' ? acc.netBalance : -acc.netBalance), 0) || 0;
  const totalLiabilities = accountsByType['Liabilities']?.reduce((sum, acc) => sum + (acc.normalBalance === 'Credit' ? -acc.netBalance : acc.netBalance), 0) || 0;
  const totalEquity = accountsByType['Equity']?.reduce((sum, acc) => sum + (acc.normalBalance === 'Credit' ? -acc.netBalance : acc.netBalance), 0) || 0;
  const totalRevenue = accountsByType['Revenue']?.reduce((sum, acc) => sum + (acc.normalBalance === 'Credit' ? -acc.netBalance : acc.netBalance), 0) || 0;
  const totalExpenses = accountsByType['Expenses']?.reduce((sum, acc) => sum + (acc.normalBalance === 'Debit' ? acc.netBalance : -acc.netBalance), 0) || 0;

  console.log(`\n💰 FINANCIAL POSITION SUMMARY:`);
  console.log(`- Total Assets: ${totalAssets.toFixed(2)} AED`);
  console.log(`- Total Liabilities: ${totalLiabilities.toFixed(2)} AED`);
  console.log(`- Total Equity: ${totalEquity.toFixed(2)} AED`);
  console.log(`- Total Revenue: ${totalRevenue.toFixed(2)} AED`);
  console.log(`- Total Expenses: ${totalExpenses.toFixed(2)} AED`);
  console.log(`- Net Income: ${(totalRevenue - totalExpenses).toFixed(2)} AED`);

  return {
    organizationId,
    organizationName,
    period: trialBalancePeriod,
    totalDebits,
    totalCredits,
    netBalance: totalNetBalance,
    isBalanced: Math.abs(balanceDifference) < 0.01,
    accountsByType,
    financialSummary: {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses
    }
  };
}

async function generateConsolidatedTrialBalance() {
  console.log(`\n\n🏢 CONSOLIDATED TRIAL BALANCE - HAIR TALKZ GROUP`);
  console.log('='.repeat(80));
  console.log(`Period: ${trialBalancePeriod.periodName}`);
  console.log(`Consolidating: ${organizations.length} entities`);
  console.log('='.repeat(80));

  const consolidatedData = {
    totalDebits: 0,
    totalCredits: 0,
    consolidatedAccounts: {},
    organizationSummaries: []
  };

  for (const org of organizations) {
    const trialBalance = await generateTrialBalance(org.id, org.name);
    if (trialBalance) {
      consolidatedData.organizationSummaries.push(trialBalance);
      consolidatedData.totalDebits += trialBalance.totalDebits;
      consolidatedData.totalCredits += trialBalance.totalCredits;
    }
  }

  console.log(`\n📊 CONSOLIDATION SUMMARY:`);
  console.log('─'.repeat(60));
  console.log('Organization                           │    Debits │   Credits');
  console.log('─'.repeat(60));

  consolidatedData.organizationSummaries.forEach(summary => {
    const name = summary.organizationName.padEnd(38);
    const debits = summary.totalDebits.toFixed(2).padStart(10);
    const credits = summary.totalCredits.toFixed(2).padStart(10);
    console.log(`${name} │ ${debits} │ ${credits}`);
  });

  console.log('─'.repeat(60));
  const totalDebits = consolidatedData.totalDebits.toFixed(2).padStart(10);
  const totalCredits = consolidatedData.totalCredits.toFixed(2).padStart(10);
  console.log(`${'CONSOLIDATED TOTALS'.padEnd(38)} │ ${totalDebits} │ ${totalCredits}`);
  console.log('─'.repeat(60));

  const groupNetIncome = consolidatedData.organizationSummaries.reduce((sum, org) => 
    sum + org.financialSummary.netIncome, 0);
  
  console.log(`\n🎯 GROUP PERFORMANCE:`);
  console.log(`- Total Group Debits: ${consolidatedData.totalDebits.toFixed(2)} AED`);
  console.log(`- Total Group Credits: ${consolidatedData.totalCredits.toFixed(2)} AED`);
  console.log(`- Group Net Income: ${groupNetIncome.toFixed(2)} AED`);
  console.log(`- Active Organizations: ${consolidatedData.organizationSummaries.length}`);

  return consolidatedData;
}

// Main execution
async function main() {
  console.log('💼 HAIR TALKZ GROUP - TRIAL BALANCE GENERATION');
  console.log('🧬 Using HERA Universal Architecture');
  console.log(`📅 Period: ${trialBalancePeriod.periodName}`);
  console.log('='.repeat(80));

  try {
    // Generate individual trial balances
    for (const org of organizations) {
      await generateTrialBalance(org.id, org.name);
    }

    // Generate consolidated trial balance
    await generateConsolidatedTrialBalance();

    console.log('\n\n✅ TRIAL BALANCE GENERATION COMPLETE');
    console.log('====================================');
    console.log('🎯 Key Benefits Demonstrated:');
    console.log('   ✅ Universal 6-table architecture used');
    console.log('   ✅ Multi-tenant trial balance generation');
    console.log('   ✅ Smart code transaction classification');
    console.log('   ✅ Automated account balance calculation');
    console.log('   ✅ Professional financial reporting');
    console.log('   ✅ Group consolidation capabilities');

  } catch (error) {
    console.error('❌ Error generating trial balance:', error);
  }
}

// Run the trial balance generation
main();