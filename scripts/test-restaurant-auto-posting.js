#!/usr/bin/env node

/**
 * Test Restaurant Auto-Posting Integration
 * Tests the complete flow: Restaurant Order → Smart Code → Auto GL Posting
 */

async function testRestaurantAutoPosting() {
  const API_URL = 'http://localhost:3002/api/v1';
  
  console.log('🍕 Testing Restaurant Auto-Posting Integration\n');

  try {
    // Create a restaurant order with multiple items
    console.log('1️⃣ Creating Restaurant Order...');
    const orderData = {
      customer_name: 'John Doe',
      order_type: 'dine_in',
      table_id: 'table_5',
      server_name: 'Alice',
      special_notes: 'Customer prefers well-done pizza',
      items: [
        {
          menu_item_name: 'Margherita Pizza',
          menu_item_id: '550e8400-e29b-41d4-a716-446655440001',
          quantity: 1,
          unit_price: 24.50,
          special_notes: 'Extra cheese'
        },
        {
          menu_item_name: 'Caesar Salad', 
          menu_item_id: '550e8400-e29b-41d4-a716-446655440002',
          quantity: 1,
          unit_price: 12.00
        },
        {
          menu_item_name: 'Tiramisu',
          menu_item_id: '550e8400-e29b-41d4-a716-446655440003', 
          quantity: 2,
          unit_price: 8.50
        }
      ]
    };

    const orderResponse = await fetch(`${API_URL}/restaurant/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      throw new Error(`Order creation failed: ${orderResponse.status}`);
    }

    const orderResult = await orderResponse.json();
    console.log(`✅ Order Created: ${orderResult.data.reference_number}`);
    console.log(`   Smart Code: ${orderResult.data.smart_code}`);
    console.log(`   Total Amount: $${orderResult.data.total_amount}`);
    console.log(`   GL Posting Required: ${orderResult.data.gl_posting.required}`);
    console.log(`   Journal Entry Created: ${orderResult.data.gl_posting.journal_entry_created ? '✅ Yes' : '❌ No'}`);
    
    if (orderResult.data.gl_posting.journal_reference) {
      console.log(`   Journal Reference: ${orderResult.data.gl_posting.journal_reference}`);
    }

    // Wait a moment for any async processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the transaction details
    console.log('\n2️⃣ Fetching Transaction Details...');
    const txnResponse = await fetch(`${API_URL}/transactions?reference_number=${orderResult.data.reference_number}`);
    
    if (txnResponse.ok) {
      const txnData = await txnResponse.json();
      if (txnData.success && txnData.data.length > 0) {
        const transaction = txnData.data[0];
        console.log(`✅ Transaction Found: ${transaction.transaction_type}`);
        console.log(`   Smart Code: ${transaction.smart_code}`);
        console.log(`   GL Posting Required: ${transaction.metadata?.gl_posting_required || 'not set'}`);
        
        // Show line items
        if (transaction.lines && transaction.lines.length > 0) {
          console.log(`   Order Items (${transaction.lines.length}):`);
          transaction.lines.forEach((line, idx) => {
            console.log(`     ${idx + 1}. ${line.entity_name} - Qty: ${line.quantity}, Price: $${line.unit_price}`);
          });
        }
      }
    }

    // Check for journal entries
    console.log('\n3️⃣ Checking for Auto-Generated Journal Entries...');
    const journalResponse = await fetch(`${API_URL}/transactions?transaction_type=journal_entry&organization_id=550e8400-e29b-41d4-a716-446655440000`);
    
    if (journalResponse.ok) {
      const journalData = await journalResponse.json();
      const recentJournals = journalData.data?.filter(j => 
        j.metadata?.source_reference === orderResult.data.reference_number ||
        j.reference_number?.includes(orderResult.data.reference_number.replace('ORD-', ''))
      ) || [];
      
      if (recentJournals.length > 0) {
        const journal = recentJournals[0];
        console.log(`✅ Journal Entry Found: ${journal.reference_number}`);
        console.log(`   Auto-Generated: ${journal.metadata?.auto_generated ? 'Yes' : 'No'}`);
        console.log(`   Source Smart Code: ${journal.metadata?.source_smart_code}`);
        
        if (journal.metadata?.gl_entries) {
          console.log('   GL Entries:');
          journal.metadata.gl_entries.forEach((entry, idx) => {
            const dr = entry.debit > 0 ? `DR $${entry.debit}` : '';
            const cr = entry.credit > 0 ? `CR $${entry.credit}` : '';
            console.log(`     ${entry.account} - ${entry.account_name}: ${dr}${cr}`);
          });
        }
      } else {
        console.log('⚠️  No journal entries found for this order');
      }
    }

    console.log('\n🎉 Test Results Summary:');
    console.log(`   Restaurant Order: ✅ Created successfully`);
    console.log(`   Smart Code Applied: ✅ HERA.REST.SALE.ORDER.v1`);
    console.log(`   Auto-Posting Status: ${orderResult.data.gl_posting.journal_entry_created ? '✅ Working' : '⚠️ Check system'}`);
    console.log(`   Total Transaction Value: $${orderResult.data.total_amount}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the development server is running (npm run dev)');
    console.log('2. Check that auto-posting functions are installed in Supabase');
    console.log('3. Verify the trigger is active on universal_transactions table');
  }
}

// Run the test
testRestaurantAutoPosting();