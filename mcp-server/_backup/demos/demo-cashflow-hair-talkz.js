const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hair Talkz organization
const parkRegis = {
  id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
  name: 'Hair Talkz • Park Regis'
};

// Cashflow classification functions
function classifyTransaction(smartCode, transactionType, amount) {
  // Operating Activities (primary business operations)
  const operatingPatterns = [
    'SALON.SVC.', 'SALON.TXN.SERVICE', 'SALON.TXN.PRODUCT',
    'SALON.HR.PAY', 'SALON.EXP.RENT', 'SALON.EXP.UTIL', 'SALON.STK.PUR'
  ];
  
  // Investing Activities (asset purchases/sales)
  const investingPatterns = [
    'SALON.EQP.PUR', 'SALON.EQP.SAL', 'SALON.INV.LONG'
  ];
  
  // Financing Activities (funding/capital)
  const financingPatterns = [
    'SALON.FIN.LOAN', 'SALON.FIN.OWNER', 'SALON.FIN.DIVIDEND'
  ];
  
  for (let pattern of operatingPatterns) {
    if (smartCode.includes(pattern)) {
      return {
        category: 'Operating',
        subcategory: getOperatingSubcategory(smartCode, transactionType),
        cashFlow: getCashFlowDirection(smartCode, transactionType, amount)
      };
    }
  }
  
  for (let pattern of investingPatterns) {
    if (smartCode.includes(pattern)) {
      return {
        category: 'Investing', 
        subcategory: getInvestingSubcategory(smartCode),
        cashFlow: getCashFlowDirection(smartCode, transactionType, amount)
      };
    }
  }
  
  for (let pattern of financingPatterns) {
    if (smartCode.includes(pattern)) {
      return {
        category: 'Financing',
        subcategory: getFinancingSubcategory(smartCode), 
        cashFlow: getCashFlowDirection(smartCode, transactionType, amount)
      };
    }
  }
  
  // Default to operating if unclear
  return {
    category: 'Operating',
    subcategory: 'Other Operating',
    cashFlow: getCashFlowDirection(smartCode, transactionType, amount)
  };
}

function getOperatingSubcategory(smartCode, transactionType) {
  if (smartCode.includes('SVC.') || smartCode.includes('TXN.SERVICE')) return 'Service Revenue';
  if (smartCode.includes('TXN.PRODUCT') || smartCode.includes('RETAIL')) return 'Product Sales';
  if (smartCode.includes('HR.PAY')) return 'Staff Payments';
  if (smartCode.includes('EXP.RENT')) return 'Rent Payments';
  if (smartCode.includes('EXP.UTIL')) return 'Utilities';
  if (smartCode.includes('STK.PUR')) return 'Inventory Purchases';
  return 'Other Operating';
}

function getInvestingSubcategory(smartCode) {
  if (smartCode.includes('EQP.PUR')) return 'Equipment Purchase';
  if (smartCode.includes('EQP.SAL')) return 'Equipment Sale';
  if (smartCode.includes('INV.LONG')) return 'Long-term Investment';
  return 'Other Investing';
}

function getFinancingSubcategory(smartCode) {
  if (smartCode.includes('LOAN.')) return 'Loan Activity';
  if (smartCode.includes('OWNER.')) return 'Owner Activity';
  if (smartCode.includes('DIVIDEND')) return 'Dividend Payment';
  return 'Other Financing';
}

function getCashFlowDirection(smartCode, transactionType, amount) {
  // Revenue and receipts are cash inflows (+)
  if (smartCode.includes('SVC.') || smartCode.includes('TXN.SERVICE') || 
      smartCode.includes('TXN.PRODUCT') || smartCode.includes('RECEIPT')) {
    return amount; // Positive = inflow
  }
  
  // Payments and purchases are cash outflows (-)
  if (smartCode.includes('PAY.') || smartCode.includes('PUR.') || 
      smartCode.includes('EXP.') || transactionType.includes('payment')) {
    return -Math.abs(amount); // Negative = outflow
  }
  
  // Default based on transaction type
  if (transactionType.includes('sale') || transactionType.includes('receipt')) {
    return amount;
  } else {
    return -Math.abs(amount);
  }
}

async function generateCashflowStatement() {
  console.log('💰 HAIR TALKZ SALON - CASHFLOW STATEMENT ANALYSIS\n');
  console.log('🏢 Organization:', parkRegis.name);
  console.log('📅 Period: September 2025 (Month-to-Date)\n');

  try {
    // Get all transactions for the organization
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', parkRegis.id)
      .order('transaction_date', { ascending: true });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    if (!transactions || transactions.length === 0) {
      console.log('❌ No transactions found for cashflow analysis');
      return;
    }

    console.log(`📊 Found ${transactions.length} transactions to analyze\n`);

    // Classify transactions by cashflow category
    const operatingActivities = [];
    const investingActivities = [];
    const financingActivities = [];

    let totalOperating = 0;
    let totalInvesting = 0;
    let totalFinancing = 0;

    transactions.forEach(txn => {
      const classification = classifyTransaction(
        txn.smart_code || 'UNKNOWN',
        txn.transaction_type,
        txn.total_amount
      );

      const cashFlowItem = {
        date: txn.transaction_date,
        code: txn.transaction_code,
        description: txn.metadata?.description || txn.transaction_type,
        amount: txn.total_amount,
        cashFlow: classification.cashFlow,
        subcategory: classification.subcategory,
        smartCode: txn.smart_code
      };

      switch (classification.category) {
        case 'Operating':
          operatingActivities.push(cashFlowItem);
          totalOperating += classification.cashFlow;
          break;
        case 'Investing':
          investingActivities.push(cashFlowItem);
          totalInvesting += classification.cashFlow;
          break;
        case 'Financing':
          financingActivities.push(cashFlowItem);
          totalFinancing += classification.cashFlow;
          break;
      }
    });

    // Display Cashflow Statement
    console.log('💵 CASHFLOW STATEMENT - DIRECT METHOD');
    console.log('=====================================\n');

    // Operating Activities
    console.log('🔄 OPERATING ACTIVITIES');
    console.log('-'.repeat(50));
    
    const operatingBySubcat = {};
    operatingActivities.forEach(item => {
      if (!operatingBySubcat[item.subcategory]) {
        operatingBySubcat[item.subcategory] = [];
      }
      operatingBySubcat[item.subcategory].push(item);
    });

    Object.entries(operatingBySubcat).forEach(([subcategory, items]) => {
      const subtotal = items.reduce((sum, item) => sum + item.cashFlow, 0);
      console.log(`\n${subcategory}:`);
      items.forEach(item => {
        const flow = item.cashFlow >= 0 ? '+' : '';
        console.log(`  ${item.date.split('T')[0]} | ${flow}${item.cashFlow.toFixed(2)} AED | ${item.description}`);
      });
      console.log(`  Subtotal: ${subtotal.toFixed(2)} AED`);
    });

    console.log(`\nNet Cash from Operating Activities: ${totalOperating.toFixed(2)} AED`);

    // Investing Activities
    if (investingActivities.length > 0) {
      console.log('\n🏗️ INVESTING ACTIVITIES');
      console.log('-'.repeat(50));
      
      investingActivities.forEach(item => {
        const flow = item.cashFlow >= 0 ? '+' : '';
        console.log(`${item.date.split('T')[0]} | ${flow}${item.cashFlow.toFixed(2)} AED | ${item.description}`);
      });
      
      console.log(`\nNet Cash from Investing Activities: ${totalInvesting.toFixed(2)} AED`);
    }

    // Financing Activities  
    if (financingActivities.length > 0) {
      console.log('\n💳 FINANCING ACTIVITIES');
      console.log('-'.repeat(50));
      
      financingActivities.forEach(item => {
        const flow = item.cashFlow >= 0 ? '+' : '';
        console.log(`${item.date.split('T')[0]} | ${flow}${item.cashFlow.toFixed(2)} AED | ${item.description}`);
      });
      
      console.log(`\nNet Cash from Financing Activities: ${totalFinancing.toFixed(2)} AED`);
    }

    // Summary
    console.log('\n📊 CASHFLOW SUMMARY');
    console.log('='.repeat(50));
    console.log(`Operating Activities:    ${totalOperating.toFixed(2)} AED`);
    console.log(`Investing Activities:    ${totalInvesting.toFixed(2)} AED`);
    console.log(`Financing Activities:    ${totalFinancing.toFixed(2)} AED`);
    console.log('-'.repeat(30));
    
    const netCashFlow = totalOperating + totalInvesting + totalFinancing;
    console.log(`NET CASH FLOW:          ${netCashFlow.toFixed(2)} AED`);

    // Cash Position Analysis
    console.log('\n💰 CASH POSITION ANALYSIS');
    console.log('='.repeat(50));
    
    // Calculate cash at beginning (assume 0 for demo)
    const beginningCash = 0;
    const endingCash = beginningCash + netCashFlow;
    
    console.log(`Cash at Beginning:       ${beginningCash.toFixed(2)} AED`);
    console.log(`Net Change in Cash:      ${netCashFlow.toFixed(2)} AED`);
    console.log(`Cash at End:            ${endingCash.toFixed(2)} AED`);

    // Key Insights
    console.log('\n🔍 KEY INSIGHTS');
    console.log('='.repeat(50));
    
    if (totalOperating > 0) {
      console.log('✅ Positive operating cashflow - healthy business operations');
    } else {
      console.log('⚠️  Negative operating cashflow - monitor cash carefully');
    }
    
    if (Math.abs(totalInvesting) > 0) {
      console.log('🏗️ Investment activity detected - business growth or asset changes');
    }
    
    if (Math.abs(totalFinancing) > 0) {
      console.log('💳 Financing activity detected - capital structure changes');
    }

    // Ratios and Analysis
    const totalRevenue = operatingActivities
      .filter(item => item.cashFlow > 0)
      .reduce((sum, item) => sum + item.cashFlow, 0);
    
    if (totalRevenue > 0) {
      const operatingMargin = (totalOperating / totalRevenue) * 100;
      console.log(`\n📈 Operating Cash Margin: ${operatingMargin.toFixed(1)}%`);
    }

  } catch (error) {
    console.error('Error generating cashflow statement:', error);
  }
}

// Run the cashflow analysis
generateCashflowStatement();