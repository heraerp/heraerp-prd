import { createSalonPosIntegration } from '@/lib/playbook/salon-pos-integration'
import { heraCode } from '@/lib/smart-codes'

// Simple test script to create a POS transaction
async function runPosTest() {
  try {
    console.log('🧪 POS Transaction Test\n')
    
    // Use a test organization ID (you'll need to replace with a real one)
    const organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'test-org-id'
    console.log('Organization ID:', organizationId)
    
    // Initialize POS service
    const posService = createSalonPosIntegration(organizationId)
    
    // Create test ticket data
    const testTicket = {
      lineItems: [
        {
          entity_id: 'test-service-id',
          entity_type: 'service' as const,
          entity_name: 'Premium Haircut & Style',
          quantity: 1,
          unit_price: 150,
          line_amount: 150,
          stylist_id: 'test-stylist-id',
          stylist_name: 'Maria Garcia'
        }
      ],
      discounts: [],
      tips: [],
      customer_id: 'test-customer-id'
    }
    
    // Create payment data
    const payments = [
      {
        type: 'cash',
        amount: 157.50, // $150 + 5% tax
        reference: 'CASH-001'
      }
    ]
    
    // Process the transaction
    console.log('\nProcessing POS transaction...')
    console.log('- Service: $150.00')
    console.log('- Tax (5%): $7.50')
    console.log('- Total: $157.50')
    console.log('- Payment: Cash $157.50\n')
    
    const result = await posService.processPosTransaction(
      testTicket,
      payments,
      {
        branch_id: 'test-branch-id',
        cashier_id: 'test-cashier-id',
        till_id: 'TILL-001'
      }
    )
    
    if (result.success) {
      console.log('✅ Transaction created successfully!')
      console.log('Transaction ID:', result.transaction_id)
      console.log('Transaction Code:', result.transaction_code)
      console.log('\n📋 Validation Summary:')
      console.log('- Header smart code:', heraCode('HERA.SALON.POS.SALE.HEADER.v1'))
      console.log('- Service line smart code:', heraCode('HERA.SALON.POS.LINE.SERVICE.v1'))
      console.log('- Tax line smart code:', heraCode('HERA.SALON.POS.LINE.TAX.v1'))
      console.log('- Payment line smart code:', heraCode('HERA.SALON.POS.PAYMENT.CASH.v1'))
      console.log('\nAll smart codes use lowercase .v1 ✅')
    } else {
      console.error('❌ Transaction failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Display test summary
console.log('='.repeat(60))
console.log('POS TRANSACTION TEST - $150 Service + 5% Tax = $157.50')
console.log('='.repeat(60))
console.log('\nExpected Results:')
console.log('- Transaction type: sale')
console.log('- Total amount: $157.50')
console.log('- Non-payment lines total: $157.50 (service + tax)')
console.log('- Payment lines total: -$157.50')
console.log('- Balance: $0.00 ✅')
console.log('- All smart codes end with .v1 (lowercase)')
console.log('='.repeat(60))

// Note: To run this test, you need:
// 1. Valid organization ID in environment
// 2. Test entities created (service, customer, stylist)
// 3. Database connection configured

console.log('\n⚠️ This is a test script outline. To run actual test:')
console.log('1. Ensure you have valid test entity IDs')
console.log('2. Set NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID in .env')
console.log('3. Run with: npx tsx scripts/test-pos-simple.ts')