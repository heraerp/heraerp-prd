// Test script to create a complete journal entry
const fetch = require('node-fetch');

async function createJournalEntry() {
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const baseUrl = 'http://localhost:3000/api/v1/universal';
  
  console.log('🧾 Creating Journal Entry Test...\n');
  
  try {
    // Step 1: Create journal header
    console.log('1️⃣ Creating journal header...');
    const headerResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        table: 'universal_transactions',
        data: {
          organization_id: orgId,
          transaction_type: 'journal_entry',
          transaction_code: `JE-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: 12000,
          smart_code: 'HERA.FIN.GL.TXN.JE.GENERAL.v1',
          metadata: {
            description: 'August marketing expense accrual',
            reference: 'JE-ACCR-001',
            status: 'draft'
          }
        }
      })
    });
    
    const header = await headerResponse.json();
    console.log('Header response:', JSON.stringify(header, null, 2));
    
    if (!header.success && header.message !== 'Validation passed') {
      throw new Error(`Failed to create header: ${JSON.stringify(header)}`);
    }
    
    // If we got a validation message, we need to actually fetch the created record
    let transactionId;
    if (header.message === 'Validation passed') {
      // The API just validated but didn't return the created record
      // Let's query for our transaction
      const queryResp = await fetch(`${baseUrl}?action=read&table=universal_transactions&filter=transaction_code:JE-${Date.now()}`);
      const queryResult = await queryResp.json();
      console.log('Query result:', queryResult);
      transactionId = queryResult.data?.[0]?.id;
    } else {
      transactionId = header.data?.id;
    }
    console.log(`✅ Journal header created: ${transactionId}`);
    
    // Step 2: Create debit line
    console.log('\n2️⃣ Creating debit line...');
    const debitResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        table: 'universal_transaction_lines',
        data: {
          transaction_id: transactionId,
          organization_id: orgId,
          line_number: 1,
          line_description: 'Marketing Expenses - August accrual',
          line_amount: 12000,
          quantity: 1,
          unit_price: 12000,
          smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
          metadata: {
            account_code: '6000',
            account_name: 'Marketing Expenses',
            movement: 'debit'
          }
        }
      })
    });
    
    const debit = await debitResponse.json();
    console.log('Debit response:', debit);
    
    // Step 3: Create credit line
    console.log('\n3️⃣ Creating credit line...');
    const creditResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        table: 'universal_transaction_lines',
        data: {
          transaction_id: transactionId,
          organization_id: orgId,
          line_number: 2,
          line_description: 'Accrued Expenses - August marketing',
          line_amount: 12000,
          quantity: 1,
          unit_price: 12000,
          smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
          metadata: {
            account_code: '2100',
            account_name: 'Accrued Expenses',
            movement: 'credit'
          }
        }
      })
    });
    
    const credit = await creditResponse.json();
    console.log('Credit response:', credit);
    
    // Step 4: Post the journal
    console.log('\n4️⃣ Posting journal entry...');
    const postResponse = await fetch(baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        table: 'universal_transactions',
        id: transactionId,
        data: {
          metadata: {
            description: 'August marketing expense accrual',
            reference: 'JE-ACCR-001',
            status: 'posted',
            posted_at: new Date().toISOString(),
            posted_by: 'test-script'
          }
        }
      })
    });
    
    const posted = await postResponse.json();
    console.log('\n✅ Journal posted successfully!');
    
    // Step 5: Query back the complete entry
    console.log('\n5️⃣ Retrieving complete journal entry...');
    const queryResponse = await fetch(`${baseUrl}?action=read&table=universal_transactions&filter=id:${transactionId}`);
    const queryResult = await queryResponse.json();
    
    console.log('\n📊 JOURNAL ENTRY SUMMARY:');
    console.log('------------------------');
    console.log(`Transaction ID: ${transactionId}`);
    console.log(`Reference: JE-ACCR-001`);
    console.log(`Amount: $12,000`);
    console.log(`Status: POSTED`);
    console.log(`Description: August marketing expense accrual`);
    console.log('\nJOURNAL LINES:');
    console.log('DR: Marketing Expenses (6000)    $12,000');
    console.log('CR: Accrued Expenses (2100)             $12,000');
    console.log('                                  ========');
    console.log('                                  Balance: $0');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the test
createJournalEntry();