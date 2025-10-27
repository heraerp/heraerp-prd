import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔍 ANALYZING WORKING TRANSACTION FROM YESTERDAY');
console.log('==============================================');

async function analyzeTransaction() {
  // Get the working transaction from yesterday
  const workingTxnId = 'b6e07b3a-b299-4040-abeb-eb1b420f90cb';
  
  console.log('\n📋 Checking main transaction...');
  const { data: txn, error: txnError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', workingTxnId)
    .single();

  if (txnError) {
    console.log('❌ Error:', txnError);
    return;
  }

  console.log('✅ Working Transaction Details:');
  console.log(`   ID: ${txn.id}`);
  console.log(`   Type: ${txn.transaction_type}`);
  console.log(`   Smart Code: ${txn.smart_code}`);
  console.log(`   Amount: ${txn.total_amount}`);
  console.log(`   Status: ${txn.transaction_status}`);
  console.log(`   Organization: ${txn.organization_id}`);
  console.log(`   Created by: ${txn.created_by}`);
  console.log(`   Created at: ${txn.created_at}`);

  // Get transaction lines
  console.log('\n📊 Checking transaction lines...');
  const { data: lines, error: linesError } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('transaction_id', workingTxnId)
    .eq('organization_id', ORG_ID);

  if (!linesError && lines) {
    console.log(`✅ Found ${lines.length} transaction lines:`);
    lines.forEach((line, index) => {
      console.log(`${index + 1}. ${line.line_type} - ${line.description}`);
      console.log(`   Amount: ${line.line_amount}`);
      console.log(`   Quantity: ${line.quantity}`);
      console.log(`   Smart Code: ${line.smart_code}`);
      console.log('');
    });
  }

  // Now let's try to create a similar transaction
  console.log('\n🚀 Attempting to create similar transaction...');
  
  const newTransaction = {
    transaction_type: 'SALE',
    smart_code: 'HERA.SALON.TXN.SALE.TEST_REPLICATE.v1',
    transaction_code: `TEST-${Date.now()}`,
    source_entity_id: txn.source_entity_id, // Use same customer
    total_amount: 500.00,
    transaction_status: 'completed',
    transaction_date: new Date().toISOString()
    // Note: NO organization_id in the transaction object itself
  };

  const newLines = [
    {
      line_number: 1,
      line_type: 'SERVICE',
      description: 'Hair Styling Service',
      quantity: 1,
      unit_amount: 400.00,
      line_amount: 400.00,
      smart_code: 'HERA.SALON.SERVICE.STYLING.v1'
    },
    {
      line_number: 2,
      line_type: 'TAX',
      description: 'VAT 5%',
      quantity: 1,
      unit_amount: 20.00,
      line_amount: 20.00,
      smart_code: 'HERA.FINANCE.TAX.VAT_5PCT.v1'
    },
    {
      line_number: 3,
      line_type: 'TIP',
      description: 'Service Tip',
      quantity: 1,
      unit_amount: 80.00,
      line_amount: 80.00,
      smart_code: 'HERA.SALON.TIP.SERVICE.v1'
    }
  ];

  const payload = {
    transaction: newTransaction,
    lines: newLines,
    options: {}
  };

  try {
    const result = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: txn.created_by, // Use same actor
      p_organization_id: ORG_ID,
      p_payload: payload
    });

    console.log('📋 Creation result:', JSON.stringify(result.data, null, 2));

    if (result.data && result.data.success) {
      console.log('✅ New transaction created successfully!');
      
      // Check if GL posting was triggered
      setTimeout(async () => {
        console.log('\n🧾 Checking for new GL posting...');
        const { data: glPostings } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', ORG_ID)
          .eq('transaction_type', 'GL_POSTING')
          .order('created_at', { ascending: false })
          .limit(1);

        if (glPostings && glPostings.length > 0) {
          const latestGL = glPostings[0];
          console.log(`✅ GL posting found: ${latestGL.id}`);
          console.log(`   Amount: ${latestGL.total_amount}`);
          console.log(`   Status: ${latestGL.transaction_status}`);
          console.log(`   Created: ${latestGL.created_at}`);
        }
      }, 2000);
    }
  } catch (error) {
    console.log('💥 Error creating transaction:', error);
  }
}

analyzeTransaction();