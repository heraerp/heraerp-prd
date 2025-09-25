#!/usr/bin/env tsx

/**
 * Simple HERA V2 Transaction Test
 */

import { txnClientV2 } from './src/lib/v2/client/txn-client'

const TEST_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

async function simpleTest() {
  console.log('🧪 Simple V2 Transaction Test')

  try {
    // Test 1: Emit a simple transaction
    console.log('📤 Testing txn-emit...')
    const emitResult = await txnClientV2.emit({
      organization_id: TEST_ORG_ID,
      transaction_type: 'sale',
      smart_code: 'HERA.TEST.SALE.ORDER.CORE.V1',
      transaction_date: new Date().toISOString(),
      business_context: { test: true },
      lines: [
        {
          line_number: 1,
          line_type: 'item',
          smart_code: 'HERA.TEST.SALE.LINE.ITEM.V1',
          quantity: 1,
          unit_price: 100,
          line_amount: 100,
          description: 'Test Item'
        }
      ]
    })

    console.log('✅ Emit result:', emitResult)

    if (emitResult.transaction_id) {
      // Test 2: Read the transaction
      console.log('📖 Testing txn-read...')
      const readResult = await txnClientV2.read({
        organization_id: TEST_ORG_ID,
        transaction_id: emitResult.transaction_id,
        include_lines: true
      })

      console.log('✅ Read result:', readResult)

      // Test 3: Query transactions
      console.log('🔍 Testing txn-query...')
      const queryResult = await txnClientV2.query({
        organization_id: TEST_ORG_ID,
        transaction_type: 'sale',
        limit: 5
      })

      console.log('✅ Query result:', queryResult)
    }

    console.log('🎉 All tests passed!')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    if (error.stack) console.error(error.stack)
  }
}

simpleTest()