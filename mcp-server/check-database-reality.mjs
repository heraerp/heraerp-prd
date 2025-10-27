import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔍 CHECKING DATABASE REALITY');
console.log('============================');

async function checkDatabaseReality() {
  // Query the exact transactions mentioned
  const txnIds = [
    '820cc15d-3cd1-4cab-b0c9-b38eb3dfb070', // Debug transaction
    'aa5a871a-b43d-4b1f-a164-9fb4cc361fd5'  // Recent transaction
  ];

  for (const txnId of txnIds) {
    console.log(`\n📋 Transaction: ${txnId}`);
    
    // Get header
    const { data: header, error: headerError } = await supabase
      .from('universal_transactions')
      .select('total_amount, transaction_status, smart_code, created_at')
      .eq('id', txnId)
      .single();

    if (headerError) {
      console.log(`   ❌ Header error: ${headerError.message}`);
      continue;
    }

    console.log(`   📊 Header:`);
    console.log(`      Total Amount: ${header.total_amount}`);
    console.log(`      Status: ${header.transaction_status}`);
    console.log(`      Smart Code: ${header.smart_code}`);
    console.log(`      Created: ${header.created_at}`);

    // Get lines
    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('line_number, line_type, description, line_amount, line_data')
      .eq('transaction_id', txnId)
      .eq('organization_id', ORG_ID)
      .order('line_number');

    if (linesError) {
      console.log(`   ❌ Lines error: ${linesError.message}`);
      continue;
    }

    console.log(`   📊 Lines (${lines.length}):`);
    let totalDR = 0;
    let totalCR = 0;
    let totalLineAmounts = 0;

    if (lines.length > 0) {
      lines.forEach((line, index) => {
        const lineData = line.line_data || {};
        const side = lineData.side || 'N/A';
        const amount = lineData.amount || line.line_amount || 0;
        
        if (side === 'DR') totalDR += amount;
        if (side === 'CR') totalCR += amount;
        totalLineAmounts += (line.line_amount || 0);
        
        console.log(`      ${line.line_number}. ${side} ${line.description}: ${amount}`);
        console.log(`         Line Amount: ${line.line_amount}`);
        console.log(`         Line Data Amount: ${lineData.amount || 'N/A'}`);
      });
      
      console.log(`   💰 Calculations:`);
      console.log(`      Sum of line_amount: ${totalLineAmounts}`);
      console.log(`      DR Total: ${totalDR}`);
      console.log(`      CR Total: ${totalCR}`);
      console.log(`      Balanced: ${totalDR === totalCR ? '✅ YES' : '❌ NO'}`);
      console.log(`      Header vs Lines: ${header.total_amount} vs ${totalLineAmounts} ${header.total_amount == totalLineAmounts ? '✅' : '❌'}`);
    } else {
      console.log(`      ❌ No lines found`);
    }
  }

  // Now let's check ALL recent GL postings
  console.log('\n📋 Recent GL Postings (last 5):');
  const { data: recentGLs } = await supabase
    .from('universal_transactions')
    .select('id, total_amount, transaction_status, smart_code, created_at')
    .eq('organization_id', ORG_ID)
    .eq('transaction_type', 'GL_POSTING')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentGLs) {
    recentGLs.forEach((gl, index) => {
      console.log(`   ${index + 1}. ${gl.id}`);
      console.log(`      Total: ${gl.total_amount}`);
      console.log(`      Status: ${gl.transaction_status}`);
      console.log(`      Created: ${gl.created_at}`);
      console.log('');
    });
  }

  // Check for any transactions with null transaction_id issue
  console.log('\n🔍 Checking for recent transactions with issues...');
  const { data: recentTxns } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, total_amount, created_at')
    .eq('organization_id', ORG_ID)
    .gte('created_at', '2025-10-27T06:00:00Z')
    .order('created_at', { ascending: false });

  console.log(`   Found ${recentTxns?.length || 0} transactions since 6am today:`);
  if (recentTxns) {
    recentTxns.forEach((txn, index) => {
      console.log(`   ${index + 1}. ${txn.transaction_type} - ${txn.total_amount} (${txn.created_at})`);
    });
  }
}

checkDatabaseReality();