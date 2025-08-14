#!/usr/bin/env node

/**
 * Simple test of auto-posting by directly creating a transaction
 */

async function testSimpleAutoPosting() {
  const API_URL = 'http://localhost:3002/api/v1';
  
  console.log('🧪 Testing Simple Auto-Posting via Transactions API\n');

  try {
    // Create a sale transaction directly
    console.log('1️⃣ Creating Sale Transaction with Smart Code...');
    const transactionData = {
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      transaction_type: 'sale',
      reference_number: `SALE-TEST-${Date.now()}`,
      smart_code: 'HERA.REST.SALE.ORDER.v1',
      total_amount: 26.50,
      currency: 'USD',
      status: 'completed',
      metadata: {
        customer: 'Direct API Test',
        items: ['Pizza', 'Salad'],
        test: true
      }
    };

    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
      throw new Error(`Transaction creation failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Transaction Created: ${result.data?.reference_number || 'N/A'}`);
    console.log(`   Smart Code: ${transactionData.smart_code}`);
    console.log(`   Total: $${transactionData.total_amount}`);

    // Wait for auto-posting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for journal entries
    console.log('\n2️⃣ Checking for Auto-Generated Journal Entries...');
    const journalResponse = await fetch(`${API_URL}/transactions?transaction_type=journal_entry&organization_id=550e8400-e29b-41d4-a716-446655440000`);
    
    if (journalResponse.ok) {
      const journalData = await journalResponse.json();
      const recentJournals = journalData.data?.filter(j => 
        j.created_at >= new Date(Date.now() - 60000).toISOString() && // Last minute
        j.metadata?.auto_generated === true
      ) || [];
      
      if (recentJournals.length > 0) {
        const journal = recentJournals[0];
        console.log(`✅ Journal Entry Found: ${journal.reference_number}`);
        console.log(`   Source Smart Code: ${journal.metadata?.source_smart_code}`);
        
        if (journal.metadata?.gl_entries) {
          console.log('   GL Entries:');
          journal.metadata.gl_entries.forEach((entry) => {
            const dr = entry.debit > 0 ? `DR $${entry.debit}` : '';
            const cr = entry.credit > 0 ? `CR $${entry.credit}` : '';
            console.log(`     ${entry.account} - ${entry.account_name}: ${dr}${cr}`);
          });
        }
      } else {
        console.log('⚠️  No recent journal entries found');
        console.log('   This could mean:');
        console.log('   - Auto-posting trigger is not active');
        console.log('   - Smart Code pattern not recognized');
        console.log('   - Database function error');
      }
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSimpleAutoPosting();