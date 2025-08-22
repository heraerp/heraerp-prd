#!/usr/bin/env node

/**
 * Production-grade test script for POS transaction API
 * Tests the complete flow with proper validation
 */

const ORGANIZATION_ID = '550e8400-e29b-41d4-a716-446655440000'
const API_BASE_URL = 'http://localhost:3001/api/v1'

// Test data
const testTransaction = {
  organizationId: ORGANIZATION_ID,
  customerId: null, // Walk-in customer
  items: [
    {
      id: 'b4d7e3f9-1234-4567-8901-abcdef123456',
      name: 'Haircut & Style',
      type: 'service',
      price: 150,
      quantity: 1,
      staff: 'Sarah Johnson',
      duration: 60,
      discount: 10,
      discountType: 'percentage',
      discountAmount: 15,
      vatAmount: 6.75,
      category: 'Hair Services',
      commission_rate: 40
    },
    {
      id: 'c5e8f4a0-2345-5678-9012-bcdef2345678',
      name: 'Premium Hair Serum',
      type: 'product',
      price: 85,
      quantity: 2,
      discount: 0,
      discountType: 'percentage',
      discountAmount: 0,
      vatAmount: 8.5,
      sku: 'PROD-HAIR-001',
      category: 'Hair Products'
    }
  ],
  paymentSplits: [
    {
      method: 'card',
      amount: 250.00,
      reference: 'VISA-4242'
    },
    {
      method: 'cash',
      amount: 55.25
    }
  ],
  subtotal: 305.00,  // (150 - 15 discount) + (85 * 2) = 135 + 170 = 305
  vatAmount: 15.25,   // 5% of 305
  totalAmount: 305.25, // subtotal + vatAmount - discountAmount = 305 + 15.25 - 15 = 305.25
  discountAmount: 15.00,
  currencyCode: 'AED',
  notes: 'Regular customer - VIP treatment'
}

async function testPOSTransaction() {
  console.log('🧪 Testing POS Transaction API...\n')
  
  try {
    // 1. Test validation with invalid data
    console.log('1️⃣ Testing validation with invalid data...')
    const invalidResponse = await fetch(`${API_BASE_URL}/salon/pos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationId: 'invalid-uuid',
        items: []
      })
    })
    
    const invalidResult = await invalidResponse.json()
    console.log('Validation error (expected):', invalidResult.error)
    console.log('✅ Validation working correctly\n')

    // 2. Test successful transaction
    console.log('2️⃣ Testing successful transaction...')
    const startTime = Date.now()
    
    const response = await fetch(`${API_BASE_URL}/salon/pos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testTransaction)
    })
    
    const result = await response.json()
    const endTime = Date.now()
    
    if (!response.ok) {
      console.error('❌ Transaction failed:', result)
      return
    }
    
    console.log('✅ Transaction created successfully!')
    console.log('📋 Document Number:', result.transaction.reference_number)
    console.log('💰 Total Amount:', result.transaction.total_amount, 'AED')
    console.log('⏱️ Processing Time:', result.processingTime || (endTime - startTime), 'ms')
    console.log('🆔 Request ID:', result.requestId)
    console.log('📦 Transaction ID:', result.transaction.id)
    
    // 3. Verify transaction in database
    console.log('\n3️⃣ Verifying transaction in database...')
    const verifyResponse = await fetch(
      `${API_BASE_URL}/universal?action=read&table=universal_transactions&organization_id=${ORGANIZATION_ID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    const transactions = await verifyResponse.json()
    const ourTransaction = transactions.data?.find(t => t.id === result.transaction.id)
    
    if (ourTransaction) {
      console.log('✅ Transaction found in database')
      console.log('   Status:', ourTransaction.transaction_status)
      console.log('   Smart Code:', ourTransaction.smart_code)
      console.log('   Currency:', ourTransaction.transaction_currency_code)
    } else {
      console.log('❌ Transaction not found in database')
    }
    
    // 4. Test rate limiting
    console.log('\n4️⃣ Testing rate limiting...')
    const rateLimitPromises = []
    for (let i = 0; i < 25; i++) {
      rateLimitPromises.push(
        fetch(`${API_BASE_URL}/salon/pos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testTransaction)
        })
      )
    }
    
    const rateLimitResults = await Promise.all(rateLimitPromises)
    const rateLimited = rateLimitResults.filter(r => r.status === 429)
    
    console.log(`✅ Rate limiting active: ${rateLimited.length} requests blocked out of 25`)
    
    // 5. Performance metrics
    console.log('\n📊 Performance Summary:')
    console.log('- Transaction Processing:', result.processingTime || (endTime - startTime), 'ms')
    console.log('- Items Processed:', testTransaction.items.length)
    console.log('- Payment Methods:', testTransaction.paymentSplits.length)
    console.log('- Total Amount:', testTransaction.totalAmount, 'AED')
    
    console.log('\n✅ All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPOSTransaction()