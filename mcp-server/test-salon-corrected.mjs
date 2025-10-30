import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

console.log('🎯 CORRECTED SALON TRANSACTION TEST');
console.log('===================================');
console.log(`🏢 Organization: ${ORG_ID}`);
console.log(`👤 Actor: ${USER_ID}`);
console.log('');

async function createCorrectedSalonTransaction() {
  console.log('💰 Creating corrected salon transaction...');
  
  const serviceAmount = 450.00;
  const tipAmount = 50.00;
  const vatAmount = 25.00;
  const totalAmount = serviceAmount + tipAmount + vatAmount;
  
  console.log(`   💇 Service: AED ${serviceAmount}`);
  console.log(`   💡 Tip: AED ${tipAmount}`);  
  console.log(`   🏛️ VAT: AED ${vatAmount}`);
  console.log(`   💳 Total: AED ${totalAmount}`);
  console.log('');
  
  // Step 1: Create the business transaction
  const businessPayload = {
    header: {
      organization_id: ORG_ID,
      transaction_type: 'sale',
      smart_code: 'HERA.SALON.TXN.SALE.CORRECTED_TEST.v1',
      
      source_entity_id: null, // Walk-in customer
      target_entity_id: USER_ID, // Staff member
      total_amount: totalAmount, // Explicitly set the total
      transaction_currency_code: 'AED',
      transaction_code: `CORRECTED-${Date.now()}`,
      transaction_status: 'completed',
      transaction_date: new Date().toISOString(),
      
      business_context: {
        service_type: 'premium_salon',
        customer_type: 'walk_in',
        payment_method: 'card',
        vat_rate: 0.05,
        location: 'main_branch'
      }
    },
    lines: [
      {
        line_number: 1,
        line_type: 'service',
        description: 'Premium Hair Styling & Treatment',
        quantity: 1,
        unit_amount: serviceAmount,
        line_amount: serviceAmount,
        smart_code: 'HERA.SALON.SERVICE.PREMIUM_STYLING.v1'
      },
      {
        line_number: 2,
        line_type: 'tip',
        description: 'Service Gratuity',
        quantity: 1,
        unit_amount: tipAmount,
        line_amount: tipAmount,
        smart_code: 'HERA.SALON.TIP.SERVICE.v1'
      },
      {
        line_number: 3,
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
    console.log('📡 Creating business transaction...');
    const businessResult = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: ORG_ID,
      p_payload: businessPayload
    });

    if (businessResult.error || !businessResult.data?.success) {
      console.log('❌ Business transaction failed:');
      console.log('   Error:', businessResult.error || businessResult.data?.error);
      return null;
    }

    console.log('✅ Business transaction created!');
    console.log(`   ID: ${businessResult.data.transaction_id}`);
    console.log('');

    const saleTransactionId = businessResult.data.transaction_id;

    // Step 2: Create the GL posting transaction
    console.log('🧾 Creating GL posting transaction...');
    
    const glPayload = {
      header: {
        organization_id: ORG_ID,
        transaction_type: 'gl_posting',
        smart_code: 'HERA.FINANCE.GL.POSTING.CORRECTED_TEST.v1',
        reference_transaction_id: saleTransactionId,
        total_amount: totalAmount, // Explicitly set total amount
        transaction_code: `GL-CORRECTED-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        transaction_status: 'completed'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'GL',
          description: 'DR Cash/Card - Customer payment',
          quantity: 1,
          unit_amount: totalAmount,
          line_amount: totalAmount,
          smart_code: 'HERA.FINANCE.GL.DR.CASH.v1',
          line_data: {
            side: 'DR',
            account_code: '1001',
            account_name: 'Cash and Card Payments',
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
          description: 'CR Tip Revenue - Staff gratuities', 
          quantity: 1,
          unit_amount: tipAmount,
          line_amount: tipAmount,
          smart_code: 'HERA.FINANCE.GL.CR.TIP_REVENUE.v1',
          line_data: {
            side: 'CR',
            account_code: '4002',
            account_name: 'Tip Revenue',
            amount: tipAmount,
            currency: 'AED'
          }
        },
        {
          line_number: 4,
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

    const glResult = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: ORG_ID,
      p_payload: glPayload
    });

    if (glResult.error || !glResult.data?.success) {
      console.log('❌ GL posting failed:');
      console.log('   Error:', glResult.error || glResult.data?.error);
      return { business: businessResult.data, gl: null };
    }

    console.log('✅ GL posting created!');
    console.log(`   ID: ${glResult.data.transaction_id}`);
    console.log('');

    // Step 3: Verify the accounting balance using actual query
    console.log('📊 Verifying GL balance...');
    
    // Wait a moment for the data to be committed
    setTimeout(async () => {
      const { data: glLines } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('transaction_id', glResult.data.transaction_id)
        .eq('organization_id', ORG_ID);

      if (glLines && glLines.length > 0) {
        let drTotal = 0;
        let crTotal = 0;
        
        console.log('   📊 GL Lines Created:');
        glLines.forEach((line, index) => {
          const lineData = line.line_data || {};
          const side = lineData.side || 'N/A';
          const amount = lineData.amount || 0;
          
          if (side === 'DR') drTotal += amount;
          if (side === 'CR') crTotal += amount;
          
          console.log(`      ${index + 1}. ${side} ${lineData.account_code} ${lineData.account_name}: AED ${amount}`);
        });
        
        console.log('');
        console.log(`   💰 Balance Verification:`);
        console.log(`      Total DR: AED ${drTotal}`);
        console.log(`      Total CR: AED ${crTotal}`);
        console.log(`      Balanced: ${drTotal === crTotal ? '✅ YES' : '❌ NO'}`);
        console.log('');
        
        // Check the transaction header
        const { data: headerData } = await supabase
          .from('universal_transactions')
          .select('total_amount, transaction_status')
          .eq('id', glResult.data.transaction_id)
          .single();
          
        console.log(`   📋 Transaction Header:`);
        console.log(`      Header Total: AED ${headerData?.total_amount || 0}`);
        console.log(`      Status: ${headerData?.transaction_status}`);
        console.log('');

        console.log('🏆 CORRECTED TEST RESULTS');
        console.log('=========================');
        console.log(`✅ Business Transaction: SUCCESS`);
        console.log(`✅ GL Posting: SUCCESS`);
        console.log(`✅ Line Items Created: ${glLines.length} lines`);
        console.log(`✅ Accounting Balance: ${drTotal === crTotal ? 'VERIFIED' : 'FAILED'}`);
        console.log('');
        
        if (drTotal === crTotal && glLines.length === 4) {
          console.log('🎯 SALON TRANSACTIONS → ACCOUNTING INTEGRATION: FULLY WORKING!');
          console.log('🚀 Ready for production use in salon app!');
        } else {
          console.log('⚠️ Some issues detected - review the balance or line count');
        }
        
      } else {
        console.log('❌ No GL lines found - line creation failed');
      }
    }, 1500);

    return {
      business: businessResult.data,
      gl: glResult.data
    };

  } catch (error) {
    console.log('💥 Error:', error.message);
    return null;
  }
}

// Run the corrected test
createCorrectedSalonTransaction();