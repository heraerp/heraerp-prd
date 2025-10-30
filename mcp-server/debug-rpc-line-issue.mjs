import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

console.log('🔍 DEBUGGING RPC LINE CREATION ISSUE');
console.log('====================================');

async function debugRPCIssue() {
  // Check what's actually in the database for our test transactions
  const debugTxnId = '820cc15d-3cd1-4cab-b0c9-b38eb3dfb070';
  const recentTxnId = 'aa5a871a-b43d-4b1f-a164-9fb4cc361fd5';
  
  console.log('\n📋 Checking debug transaction in database...');
  const { data: debugTxn } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', debugTxnId)
    .single();
    
  console.log(`   Transaction found: ${debugTxn ? 'YES' : 'NO'}`);
  console.log(`   Total amount: ${debugTxn?.total_amount || 'N/A'}`);
  console.log(`   Status: ${debugTxn?.transaction_status || 'N/A'}`);

  // Check for lines in database
  const { data: debugLines } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('transaction_id', debugTxnId)
    .eq('organization_id', ORG_ID);

  console.log(`   Lines in database: ${debugLines?.length || 0}`);
  
  if (debugLines && debugLines.length > 0) {
    debugLines.forEach((line, index) => {
      console.log(`   ${index + 1}. ${line.line_type} - ${line.description} = ${line.line_amount}`);
    });
  } else {
    console.log('   ❌ No lines found in database despite RPC showing them in response');
  }

  console.log('\n📋 Checking recent transaction in database...');
  const { data: recentTxn } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', recentTxnId)
    .single();
    
  console.log(`   Transaction found: ${recentTxn ? 'YES' : 'NO'}`);
  console.log(`   Total amount: ${recentTxn?.total_amount || 'N/A'}`);

  const { data: recentLines } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .eq('transaction_id', recentTxnId)
    .eq('organization_id', ORG_ID);

  console.log(`   Lines in database: ${recentLines?.length || 0}`);

  // Let's test with a different approach - check if it's a transaction rollback issue
  console.log('\n🧪 Testing minimal transaction to isolate issue...');
  
  const minimalPayload = {
    header: {
      organization_id: ORG_ID,
      transaction_type: 'gl_posting',
      smart_code: 'HERA.DEBUG.MINIMAL.TEST.v1',
      transaction_code: `MINIMAL-${Date.now()}`,
      transaction_status: 'completed',
      total_amount: 200.00 // Explicitly set total
    },
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        description: 'Simple DR Test',
        quantity: 1,
        unit_amount: 200.00,
        line_amount: 200.00,
        smart_code: 'HERA.TEST.DR.v1',
        line_data: {
          side: 'DR',
          account_code: '1001',
          amount: 200.00
        }
      }
    ]
  };

  try {
    console.log('📡 Creating minimal test transaction...');
    const result = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: USER_ID,
      p_organization_id: ORG_ID,
      p_payload: minimalPayload
    });

    console.log('📋 RPC Response success:', result.data?.success);
    console.log('📋 RPC Response transaction_id:', result.data?.transaction_id);
    console.log('📋 RPC Response error:', result.data?.error);

    if (result.data?.success && result.data?.transaction_id) {
      const testTxnId = result.data.transaction_id;
      
      // Immediately check database
      console.log('\n🔍 Immediately checking database...');
      const { data: immediateCheck } = await supabase
        .from('universal_transactions')
        .select('total_amount, transaction_status')
        .eq('id', testTxnId)
        .single();

      console.log(`   Immediate header total: ${immediateCheck?.total_amount || 'NOT FOUND'}`);
      
      const { data: immediateLines } = await supabase
        .from('universal_transaction_lines')
        .select('count')
        .eq('transaction_id', testTxnId);

      console.log(`   Immediate lines count: ${immediateLines?.length || 0}`);

      // Wait and check again
      setTimeout(async () => {
        console.log('\n⏰ Checking database after 2 seconds...');
        const { data: delayedCheck } = await supabase
          .from('universal_transactions')
          .select('total_amount, transaction_status')
          .eq('id', testTxnId)
          .single();

        console.log(`   Delayed header total: ${delayedCheck?.total_amount || 'NOT FOUND'}`);
        
        const { data: delayedLines } = await supabase
          .from('universal_transaction_lines')
          .select('*')
          .eq('transaction_id', testTxnId);

        console.log(`   Delayed lines count: ${delayedLines?.length || 0}`);
        
        if (delayedLines && delayedLines.length > 0) {
          console.log('   ✅ Lines found:');
          delayedLines.forEach(line => {
            console.log(`      ${line.description}: ${line.line_amount}`);
          });
        } else {
          console.log('   ❌ Still no lines - this indicates a problem with the RPC function');
          console.log('   The RPC is returning lines in response but not saving them to database');
        }
      }, 2000);
    }

  } catch (error) {
    console.log('💥 Error:', error);
  }
}

debugRPCIssue();