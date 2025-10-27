import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

console.log('🔍 DEBUGGING LINE CREATION ISSUE');
console.log('================================');

async function debugLineCreation() {
  // Check the failed transaction
  const failedTxnId = 'f4373383-6438-47a0-8663-29cd4a7b13c6';
  
  console.log('\n📋 Checking failed transaction lines...');
  const { data: lines, error: linesError } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('transaction_id', failedTxnId)
    .eq('organization_id', ORG_ID);

  console.log(`Lines found: ${lines?.length || 0}`);
  console.log('Lines error:', linesError);

  // Let's try a simple transaction with minimal payload
  console.log('\n🧪 Testing simple transaction with lines...');
  
  const simplePayload = {
    header: {
      organization_id: ORG_ID,
      transaction_type: 'gl_posting',
      smart_code: 'HERA.FINANCE.GL.POSTING.DEBUG_LINES.v1',
      transaction_code: `DEBUG-${Date.now()}`,
      transaction_status: 'completed'
    },
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        description: 'Test DR Entry',
        quantity: 1,
        unit_amount: 100.00,
        line_amount: 100.00,
        smart_code: 'HERA.FINANCE.GL.DR.TEST.v1',
        line_data: {
          side: 'DR',
          account_code: '1001',
          account_name: 'Test Cash Account',
          amount: 100.00,
          currency: 'AED'
        }
      },
      {
        line_number: 2,
        line_type: 'GL',
        description: 'Test CR Entry',
        quantity: 1,
        unit_amount: 100.00,
        line_amount: 100.00,
        smart_code: 'HERA.FINANCE.GL.CR.TEST.v1',
        line_data: {
          side: 'CR',
          account_code: '4001',
          account_name: 'Test Revenue Account',
          amount: 100.00,
          currency: 'AED'
        }
      }
    ]
  };

  try {
    console.log('📡 Creating test transaction...');
    const result = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: ORG_ID,
      p_payload: simplePayload
    });

    console.log('📋 Result:', JSON.stringify(result.data, null, 2));

    if (result.data?.success && result.data?.transaction_id) {
      console.log('\n✅ Transaction created, checking lines...');
      
      // Wait a moment then check lines
      setTimeout(async () => {
        const { data: newLines, error: newLinesError } = await supabase
          .from('universal_transaction_lines')
          .select('*')
          .eq('transaction_id', result.data.transaction_id)
          .eq('organization_id', ORG_ID);

        console.log(`\n📊 Lines for new transaction ${result.data.transaction_id}:`);
        console.log(`   Found ${newLines?.length || 0} lines`);
        
        if (newLinesError) {
          console.log('   Lines error:', newLinesError);
        }

        if (newLines && newLines.length > 0) {
          newLines.forEach((line, index) => {
            console.log(`   ${index + 1}. ${line.line_type} - ${line.description}`);
            console.log(`      Amount: ${line.line_amount}`);
            console.log(`      Line Data:`, line.line_data);
          });
        } else {
          console.log('   ❌ No lines found - there\'s an issue with line creation');
        }

        // Check what the RPC function response actually contains
        console.log('\n🔍 Checking transaction header total_amount...');
        const { data: headerCheck } = await supabase
          .from('universal_transactions')
          .select('total_amount, business_context')
          .eq('id', result.data.transaction_id)
          .single();

        console.log('   Header total_amount:', headerCheck?.total_amount);
        console.log('   Header business_context:', headerCheck?.business_context);

      }, 1000);
    }

  } catch (error) {
    console.log('💥 Error:', error);
  }
}

// Also let's check a working transaction that has lines
async function checkWorkingTransaction() {
  console.log('\n🔍 Checking working transaction with lines...');
  
  const workingTxnId = 'b6e07b3a-b299-4040-abeb-eb1b420f90cb';
  
  const { data: workingLines } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('transaction_id', workingTxnId)
    .eq('organization_id', ORG_ID);

  console.log(`✅ Working transaction has ${workingLines?.length || 0} lines:`);
  
  if (workingLines) {
    workingLines.forEach((line, index) => {
      console.log(`   ${index + 1}. ${line.line_type} - ${line.description}`);
      console.log(`      Amount: ${line.line_amount}`);
      console.log(`      Smart Code: ${line.smart_code}`);
    });
  }
}

debugLineCreation();
checkWorkingTransaction();