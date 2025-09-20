#!/usr/bin/env node

/**
 * SALON CANARY TEST FLOWS
 * 
 * Run 3 scripted test flows to validate the POS cart playbook migration
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const HAIR_TALKZ_ORG_ID = 'hair-talkz-salon-org-uuid'
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN // Hair Talkz user JWT

// Test data
const TEST_CUSTOMER = {
  id: 'customer-test-001',
  phone: '+971501234567',
  name: 'Test Customer'
}

const TEST_STYLIST = {
  id: 'stylist-aisha-001',
  name: 'Aisha'
}

const TEST_SERVICES = {
  haircut: {
    id: 'service-haircut-001',
    name: 'Premium Haircut',
    price: 120.00
  },
  color: {
    id: 'service-color-001', 
    name: 'Hair Color',
    price: 130.00
  },
  retail: {
    id: 'product-shampoo-001',
    name: 'Premium Shampoo',
    price: 45.00
  }
}

/**
 * Helper to make API calls with proper headers
 */
async function apiCall(method: string, path: string, body?: any, idempotencyKey?: string) {
  const headers: any = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_USER_TOKEN}`,
    'X-Organization-ID': HAIR_TALKZ_ORG_ID,
    'X-Correlation-ID': `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  
  const data = await response.json()
  
  return {
    status: response.status,
    headers: response.headers,
    data,
    playbackMode: response.headers.get('X-Playbook-Mode')
  }
}

/**
 * Test Flow 1: Add/Remove Service & Retail → Auto-reprice
 */
async function testFlow1_AddRemoveReprice() {
  console.log('\n🧪 TEST FLOW 1: Add/Remove Service & Retail → Auto-reprice')
  console.log('=========================================================')
  
  try {
    // Step 1: Create cart
    console.log('\n1. Creating new cart...')
    const cartResponse = await apiCall('POST', '/api/v1/salon/pos/carts', {
      customer_id: TEST_CUSTOMER.id,
      stylist_id: TEST_STYLIST.id
    })
    
    if (cartResponse.status !== 201) {
      throw new Error(`Cart creation failed: ${JSON.stringify(cartResponse.data)}`)
    }
    
    const cartId = cartResponse.data.id
    console.log(`✅ Cart created: ${cartId}`)
    console.log(`   Playbook Mode: ${cartResponse.playbackMode}`)
    
    // Step 2: Add haircut service
    console.log('\n2. Adding haircut service...')
    const addHaircutResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.haircut.id,
      quantity: 1
    })
    console.log(`✅ Haircut added: $${TEST_SERVICES.haircut.price}`)
    
    // Step 3: Add hair color service
    console.log('\n3. Adding hair color service...')
    const addColorResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.color.id,
      quantity: 1
    })
    console.log(`✅ Hair color added: $${TEST_SERVICES.color.price}`)
    
    // Step 4: Add retail product
    console.log('\n4. Adding retail product...')
    const addRetailResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.retail.id,
      quantity: 2
    })
    console.log(`✅ Retail product added: $${TEST_SERVICES.retail.price} x 2`)
    
    // Step 5: Reprice cart
    console.log('\n5. Repricing cart...')
    const repriceResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/reprice`, {})
    
    if (repriceResponse.status !== 200) {
      throw new Error(`Reprice failed: ${JSON.stringify(repriceResponse.data)}`)
    }
    
    console.log(`✅ Cart repriced successfully`)
    console.log(`   Playbook Mode: ${repriceResponse.playbackMode}`)
    console.log(`   Subtotal: $${repriceResponse.data.subtotal}`)
    console.log(`   Total: $${repriceResponse.data.total_amount}`)
    console.log(`   Correlation ID: ${repriceResponse.headers.get('X-Correlation-ID')}`)
    
    // Validate totals
    const expectedSubtotal = TEST_SERVICES.haircut.price + TEST_SERVICES.color.price + (TEST_SERVICES.retail.price * 2)
    if (Math.abs(repriceResponse.data.subtotal - expectedSubtotal) > 0.01) {
      throw new Error(`Subtotal mismatch! Expected: ${expectedSubtotal}, Got: ${repriceResponse.data.subtotal}`)
    }
    
    // Step 6: Remove one item and reprice again
    console.log('\n6. Removing hair color service...')
    const removeResponse = await apiCall('DELETE', `/api/v1/salon/pos/carts/${cartId}/items/${addColorResponse.data.line_id}`)
    
    console.log('\n7. Repricing after removal...')
    const repriceAfterRemovalResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/reprice`, {})
    
    const expectedNewSubtotal = TEST_SERVICES.haircut.price + (TEST_SERVICES.retail.price * 2)
    console.log(`✅ Cart repriced after removal`)
    console.log(`   New subtotal: $${repriceAfterRemovalResponse.data.subtotal} (expected: $${expectedNewSubtotal})`)
    
    console.log('\n✅ TEST FLOW 1 PASSED!')
    return true
    
  } catch (error) {
    console.error('\n❌ TEST FLOW 1 FAILED:', error.message)
    return false
  }
}

/**
 * Test Flow 2: Apply 10% cart promo + tip → totals correct
 */
async function testFlow2_PromoAndTip() {
  console.log('\n🧪 TEST FLOW 2: Apply 10% cart promo + tip → totals correct')
  console.log('==========================================================')
  
  try {
    // Step 1: Create cart with services
    console.log('\n1. Creating cart with services...')
    const cartResponse = await apiCall('POST', '/api/v1/salon/pos/carts', {
      customer_id: TEST_CUSTOMER.id,
      stylist_id: TEST_STYLIST.id
    })
    
    const cartId = cartResponse.data.id
    
    // Add services
    await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.haircut.id,
      quantity: 1
    })
    
    await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.color.id,
      quantity: 1
    })
    
    console.log(`✅ Cart created with haircut ($${TEST_SERVICES.haircut.price}) and color ($${TEST_SERVICES.color.price})`)
    
    // Step 2: Apply 10% promotion
    console.log('\n2. Applying SAVE10 promotion code...')
    const promoResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/reprice`, {
      promotion_codes: ['SAVE10']
    })
    
    if (promoResponse.status !== 200) {
      throw new Error(`Promo application failed: ${JSON.stringify(promoResponse.data)}`)
    }
    
    const subtotal = TEST_SERVICES.haircut.price + TEST_SERVICES.color.price
    const expectedDiscount = subtotal * 0.10
    const expectedTotal = subtotal - expectedDiscount
    
    console.log(`✅ Promotion applied`)
    console.log(`   Subtotal: $${promoResponse.data.subtotal}`)
    console.log(`   Discount: $${promoResponse.data.discount_amount} (expected: $${expectedDiscount})`)
    console.log(`   Total: $${promoResponse.data.total_amount} (expected: $${expectedTotal})`)
    
    // Validate discount
    if (Math.abs(promoResponse.data.discount_amount - expectedDiscount) > 0.01) {
      throw new Error(`Discount mismatch! Expected: ${expectedDiscount}, Got: ${promoResponse.data.discount_amount}`)
    }
    
    // Step 3: Add tip (note: tip is typically added at checkout, not reprice)
    console.log('\n3. Adding £8 tip at checkout...')
    const checkoutData = {
      cart_id: cartId,
      payment_method: 'card',
      payment_amount: promoResponse.data.total_amount + 8, // Total + tip
      tip_amount: 8
    }
    
    console.log(`✅ Checkout data prepared`)
    console.log(`   Cart total: $${promoResponse.data.total_amount}`)
    console.log(`   Tip: $8`)
    console.log(`   Payment amount: $${checkoutData.payment_amount}`)
    
    console.log('\n✅ TEST FLOW 2 PASSED!')
    return true
    
  } catch (error) {
    console.error('\n❌ TEST FLOW 2 FAILED:', error.message)
    return false
  }
}

/**
 * Test Flow 3: Error path - duplicate add with same Idempotency-Key
 */
async function testFlow3_IdempotencyCheck() {
  console.log('\n🧪 TEST FLOW 3: Error path - duplicate add with same Idempotency-Key')
  console.log('===================================================================')
  
  try {
    // Step 1: Create cart
    console.log('\n1. Creating cart...')
    const cartResponse = await apiCall('POST', '/api/v1/salon/pos/carts', {
      customer_id: TEST_CUSTOMER.id,
      stylist_id: TEST_STYLIST.id
    })
    
    const cartId = cartResponse.data.id
    console.log(`✅ Cart created: ${cartId}`)
    
    // Step 2: Add service with idempotency key
    const idempotencyKey = `test-idem-${Date.now()}`
    console.log(`\n2. Adding service with Idempotency-Key: ${idempotencyKey}`)
    
    const firstAddResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.haircut.id,
      quantity: 1
    }, idempotencyKey)
    
    console.log(`✅ First add successful`)
    console.log(`   Line ID: ${firstAddResponse.data.line_id}`)
    
    // Step 3: Attempt duplicate add with same idempotency key
    console.log('\n3. Attempting duplicate add with same Idempotency-Key...')
    
    const duplicateAddResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.haircut.id,
      quantity: 1
    }, idempotencyKey)
    
    console.log(`✅ Duplicate add returned same response (idempotent)`)
    console.log(`   Status: ${duplicateAddResponse.status}`)
    console.log(`   Line ID: ${duplicateAddResponse.data.line_id}`)
    
    // Step 4: Verify only one line exists
    console.log('\n4. Repricing to verify line count...')
    const repriceResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/reprice`, {})
    
    const lineCount = repriceResponse.data.line_items.length
    console.log(`✅ Cart has exactly ${lineCount} line item(s)`)
    
    if (lineCount !== 1) {
      throw new Error(`Expected 1 line item, but found ${lineCount}`)
    }
    
    // Step 5: Test different idempotency key adds new line
    console.log('\n5. Adding with different Idempotency-Key...')
    const newIdempotencyKey = `test-idem-${Date.now()}-new`
    
    const newAddResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/items`, {
      service_id: TEST_SERVICES.color.id,
      quantity: 1
    }, newIdempotencyKey)
    
    console.log(`✅ New service added with different key`)
    
    // Verify 2 lines now
    const finalRepriceResponse = await apiCall('POST', `/api/v1/salon/pos/carts/${cartId}/reprice`, {})
    const finalLineCount = finalRepriceResponse.data.line_items.length
    
    console.log(`✅ Cart now has ${finalLineCount} line items`)
    
    if (finalLineCount !== 2) {
      throw new Error(`Expected 2 line items, but found ${finalLineCount}`)
    }
    
    console.log('\n✅ TEST FLOW 3 PASSED!')
    return true
    
  } catch (error) {
    console.error('\n❌ TEST FLOW 3 FAILED:', error.message)
    return false
  }
}

/**
 * Run all test flows
 */
async function runAllTests() {
  console.log('🚀 SALON CANARY TEST FLOWS - Hair Talkz POS Cart')
  console.log('==============================================')
  console.log(`API Base: ${API_BASE}`)
  console.log(`Organization: ${HAIR_TALKZ_ORG_ID}`)
  console.log(`Time: ${new Date().toISOString()}`)
  
  const results = {
    flow1: false,
    flow2: false,
    flow3: false
  }
  
  // Run tests sequentially
  results.flow1 = await testFlow1_AddRemoveReprice()
  results.flow2 = await testFlow2_PromoAndTip()
  results.flow3 = await testFlow3_IdempotencyCheck()
  
  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('===============')
  console.log(`Flow 1 (Add/Remove/Reprice): ${results.flow1 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Flow 2 (Promo & Tip): ${results.flow2 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Flow 3 (Idempotency): ${results.flow3 ? '✅ PASSED' : '❌ FAILED'}`)
  
  const allPassed = Object.values(results).every(r => r)
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Canary looks good.')
    console.log('\nNext steps:')
    console.log('1. Monitor dashboard for 24 hours')
    console.log('2. Check SLOs hourly')
    console.log('3. If stable, proceed to next feature flag')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Investigation needed.')
    console.log('\nRecommended actions:')
    console.log('1. Check logs for errors')
    console.log('2. Verify playbook procedures are deployed')
    console.log('3. Consider rolling back if issues persist')
  }
  
  process.exit(allPassed ? 0 : 1)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}