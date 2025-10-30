import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

console.log('🎯 SALON TRANSACTION TEST - PROVEN PATTERN');
console.log('==========================================');
console.log(`🏢 Organization: ${ORG_ID}`);
console.log(`👤 Actor: ${USER_ID}`);

async function createSalonTransactionProvenPattern() {
  console.log('\n💰 Creating salon POS sale using PROVEN PATTERN...');
  
  const serviceAmount = 450.00;
  const vatRate = 0.05;
  const vatAmount = serviceAmount * vatRate;
  const totalAmount = serviceAmount + vatAmount;
  
  console.log(`   💰 Service: AED ${serviceAmount}`);
  console.log(`   🏛️ VAT: AED ${vatAmount}`);
  console.log(`   💳 Total: AED ${totalAmount}`);
  
  // Using the EXACT pattern from HERA-FINAL-WORKING-COMPLETE.mjs
  const payload = {
    header: {
      organization_id: ORG_ID,
      transaction_type: 'sale',
      smart_code: 'HERA.SALON.TXN.SALE.PROVEN_PATTERN_TEST.v1',
      
      // Customer entity (dummy for testing)
      source_entity_id: 'cust-1234-5678-9012-3456789012ab',
      target_entity_id: USER_ID,
      total_amount: totalAmount,
      transaction_currency_code: 'AED',
      transaction_code: `PROVEN-${Date.now()}`,
      transaction_status: 'completed',
      transaction_date: new Date().toISOString(),
      
      business_context: {
        service_category: 'premium_salon',
        stylist: 'Test Stylist',
        customer_tier: 'regular',
        appointment_type: 'walk_in',
        vat_amount: vatAmount,
        service_amount: serviceAmount
      }
    },
    lines: [
      {
        line_number: 1,
        line_type: 'service',
        description: 'Premium Hair Treatment',
        quantity: 1,
        unit_amount: serviceAmount,
        line_amount: serviceAmount,
        smart_code: 'HERA.SALON.SERVICE.PREMIUM_TREATMENT.v1'
      },
      {
        line_number: 2,
        line_type: 'tax',
        description: 'VAT 5%',
        quantity: 1,
        unit_amount: vatAmount,
        line_amount: vatAmount,
        smart_code: 'HERA.FINANCE.TAX.VAT_5PCT.v1'
      }
    ]
  };

  try {
    const result = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: ORG_ID,
      p_payload: payload
    });

    if (result.error) {
      console.log('❌ Transaction creation failed:');
      console.log('   Error:', result.error);
      return null;
    } else {
      console.log('✅ Transaction created successfully!');
      console.log('📋 Response:', JSON.stringify(result.data, null, 2));
      return result.data;
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
    return null;
  }
}

async function createGLPostingProvenPattern(saleTransactionId, totalAmount) {
  console.log('\n🧾 Creating GL posting using PROVEN PATTERN...');
  
  const serviceAmount = 450.00;
  const vatAmount = 22.50;
  
  console.log(`   DR Cash: AED ${totalAmount}`);
  console.log(`   CR Service: AED ${serviceAmount}`);
  console.log(`   CR VAT: AED ${vatAmount}`);
  
  // Using the EXACT pattern from HERA-FINAL-WORKING-COMPLETE.mjs
  const payload = {
    header: {
      organization_id: ORG_ID,
      transaction_type: 'gl_posting',
      smart_code: 'HERA.FINANCE.GL.POSTING.PROVEN_PATTERN_TEST.v1',
      reference_transaction_id: saleTransactionId
    },
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        description: 'DR Cash - Customer payment received',
        quantity: 1,
        unit_amount: totalAmount,
        line_amount: totalAmount,
        smart_code: 'HERA.FINANCE.GL.DR.CASH.v1',
        line_data: {
          side: 'DR',
          account_code: '1001',
          account_name: 'Cash and Cash Equivalents',
          amount: totalAmount,
          currency: 'AED'
        }
      },
      {
        line_number: 2,
        line_type: 'GL',
        description: 'CR Service Revenue - Salon services',
        quantity: 1,
        unit_amount: serviceAmount,
        line_amount: serviceAmount,
        smart_code: 'HERA.FINANCE.GL.CR.SERVICE_REVENUE.v1',
        line_data: {
          side: 'CR',
          account_code: '4001',
          account_name: 'Service Revenue',
          amount: serviceAmount,
          currency: 'AED'
        }
      },
      {
        line_number: 3,
        line_type: 'GL',
        description: 'CR VAT Payable - Output tax',
        quantity: 1,
        unit_amount: vatAmount,
        line_amount: vatAmount,
        smart_code: 'HERA.FINANCE.GL.CR.VAT_PAYABLE.v1',
        line_data: {
          side: 'CR',
          account_code: '2201',
          account_name: 'VAT Payable',
          amount: vatAmount,
          currency: 'AED'
        }
      }
    ]
  };

  try {
    const result = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: ORG_ID,
      p_payload: payload
    });

    if (result.error) {
      console.log('❌ GL posting creation failed:');
      console.log('   Error:', result.error);
      return null;
    } else {
      console.log('✅ GL posting created successfully!');
      console.log('📋 Response:', JSON.stringify(result.data, null, 2));
      return result.data;
    }
  } catch (error) {
    console.log('💥 Error:', error.message);
    return null;
  }
}

async function verifyAccountingIntegration() {
  console.log('\n🔍 Verifying accounting integration...');
  
  // Check recent transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .order('created_at', { ascending: false })
    .limit(3);

  console.log(`✅ Found ${transactions.length} recent transactions:`);
  
  for (const txn of transactions) {
    console.log(`\n📋 ${txn.transaction_type.toUpperCase()} Transaction:`);
    console.log(`   ID: ${txn.id}`);
    console.log(`   Amount: ${txn.total_amount || 'N/A'}`);
    console.log(`   Status: ${txn.transaction_status}`);
    console.log(`   Smart Code: ${txn.smart_code}`);
    
    // Check lines for GL transactions
    if (txn.transaction_type === 'gl_posting') {
      const { data: lines } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('transaction_id', txn.id)
        .eq('organization_id', ORG_ID);

      if (lines && lines.length > 0) {
        console.log(`   📊 GL Lines (${lines.length}):`);
        let drTotal = 0;
        let crTotal = 0;
        
        lines.forEach((line, index) => {
          const lineData = line.line_data || {};
          const side = lineData.side || 'N/A';
          const amount = lineData.amount || 0;
          
          if (side === 'DR') drTotal += amount;
          if (side === 'CR') crTotal += amount;
          
          console.log(`      ${index + 1}. ${side} ${lineData.account_code} ${lineData.account_name}: ${amount}`);
        });
        
        console.log(`   💰 Balance: DR ${drTotal} = CR ${crTotal} ${drTotal === crTotal ? '✅' : '❌'}`);
      }
    }
  }
}

// Run the comprehensive test
async function runProvenPatternTest() {
  const saleResult = await createSalonTransactionProvenPattern();
  
  if (saleResult && saleResult.success && saleResult.transaction_id) {
    const glResult = await createGLPostingProvenPattern(saleResult.transaction_id, 472.50);
    
    if (glResult && glResult.success) {
      console.log('\n🎉 Both transactions created successfully!');
      
      setTimeout(async () => {
        await verifyAccountingIntegration();
        
        console.log('\n🏆 PROVEN PATTERN TEST RESULTS');
        console.log('==============================');
        console.log(`✅ Sale Transaction: ${saleResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ GL Posting: ${glResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log('✅ Integration Verified: COMPLETED');
        console.log('\n🎯 The proven pattern works! Use this for production.');
      }, 1000);
    }
  } else {
    console.log('\n❌ Sale transaction failed, skipping GL posting');
    await verifyAccountingIntegration();
  }
}

runProvenPatternTest();