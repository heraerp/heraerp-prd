import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

console.log('🚀 COMPREHENSIVE SALON TRANSACTION TEST');
console.log('=====================================');
console.log(`🏢 Organization: ${ORG_ID}`);
console.log(`👤 Actor: ${USER_ID}`);

async function createSalonTransaction() {
  console.log('\n💰 Creating salon POS sale transaction...');
  
  const timestamp = Date.now();
  const saleTransaction = {
    transaction_type: 'SALE',
    smart_code: 'HERA.SALON.TXN.SALE.COMPREHENSIVE_TEST.v1',
    transaction_code: `SALON-${timestamp}`,
    source_entity_id: 'cust-1234-5678-9012-3456789012ab', // dummy customer
    total_amount: 472.50,
    transaction_status: 'completed',
    transaction_date: new Date().toISOString(),
    organization_id: ORG_ID
  };

  const saleLines = [
    {
      line_number: 1,
      line_type: 'SERVICE',
      description: 'Hair Treatment Premium',
      quantity: 1,
      unit_amount: 450.00,
      line_amount: 450.00,
      smart_code: 'HERA.SALON.SERVICE.PREMIUM_TREATMENT.v1'
    },
    {
      line_number: 2,
      line_type: 'TAX',
      description: 'VAT 5%',
      quantity: 1,
      unit_amount: 22.50,
      line_amount: 22.50,
      smart_code: 'HERA.FINANCE.TAX.VAT_5PCT.v1'
    }
  ];

  const payload = {
    transaction: saleTransaction,
    lines: saleLines,
    options: {}
  };

  try {
    const result = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: ORG_ID,
      p_payload: payload
    });

    if (result.error) {
      console.log('❌ Transaction creation failed:', result.error);
      return null;
    } else {
      console.log('✅ Transaction created successfully!');
      console.log('📋 Full response:', JSON.stringify(result.data, null, 2));
      return result.data;
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
    return null;
  }
}

async function checkLatestTransactions() {
  console.log('\n📊 Checking latest transactions...');
  
  try {
    const { data, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Error querying transactions:', error);
      return;
    }

    console.log(`✅ Found ${data.length} recent transactions:`);
    data.forEach((txn, index) => {
      console.log(`${index + 1}. ${txn.transaction_type} - ${txn.smart_code}`);
      console.log(`   ID: ${txn.id}`);
      console.log(`   Amount: ${txn.total_amount || 'N/A'}`);
      console.log(`   Status: ${txn.transaction_status}`);
      console.log(`   Created: ${txn.created_at}`);
      console.log('');
    });
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

async function checkLatestGLPostings() {
  console.log('\n🧾 Checking latest GL postings...');
  
  try {
    const { data, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('transaction_type', 'GL_POSTING')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.log('❌ Error querying GL postings:', error);
      return;
    }

    console.log(`✅ Found ${data.length} recent GL postings:`);
    data.forEach((gl, index) => {
      console.log(`${index + 1}. GL Posting - ${gl.smart_code}`);
      console.log(`   ID: ${gl.id}`);
      console.log(`   Amount: ${gl.total_amount || 'N/A'}`);
      console.log(`   Status: ${gl.transaction_status}`);
      console.log(`   Created: ${gl.created_at}`);
      console.log('');
    });

    // Check GL lines for the most recent posting
    if (data.length > 0) {
      console.log('🧾 Checking GL lines for most recent posting...');
      const latestGL = data[0];
      
      const { data: lines, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('transaction_id', latestGL.id)
        .eq('organization_id', ORG_ID);

      if (!linesError && lines) {
        console.log(`✅ Found ${lines.length} GL lines:`);
        let drTotal = 0;
        let crTotal = 0;
        
        lines.forEach((line, index) => {
          const lineData = line.line_data || {};
          const side = lineData.side || 'N/A';
          const amount = lineData.amount || 0;
          
          if (side === 'DR') drTotal += amount;
          if (side === 'CR') crTotal += amount;
          
          console.log(`${index + 1}. ${side} ${lineData.account || 'N/A'}: ${amount}`);
          console.log(`   Description: ${line.description || 'N/A'}`);
        });
        
        console.log(`\n📊 GL Balance Check:`);
        console.log(`   Total DR: ${drTotal}`);
        console.log(`   Total CR: ${crTotal}`);
        console.log(`   Balanced: ${drTotal === crTotal ? '✅ YES' : '❌ NO'}`);
      }
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

// Run the comprehensive test
async function runTest() {
  const txnResult = await createSalonTransaction();
  await checkLatestTransactions();
  await checkLatestGLPostings();
  
  console.log('\n🎯 TEST SUMMARY');
  console.log('==============');
  console.log(`✅ Transaction Creation: ${txnResult ? 'SUCCESS' : 'FAILED'}`);
  console.log('✅ GL Posting Check: COMPLETED');
  console.log('✅ Balance Verification: COMPLETED');
}

runTest();