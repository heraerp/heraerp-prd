/**
 * Integration tests for POS system
 * Validates transaction processing, line items, smart codes, and balancing
 */

import { SalonPosIntegrationService } from '@/lib/playbook/salon-pos-integration'
import { seedPosTestData, cleanupPosTestData, type PosTestData } from '@/scripts/seed-pos-test-data'
import { universalApi } from '@/lib/universal-api-v2'
import { heraCode } from '@/lib/smart-codes'

describe('POS Integration Tests', () => {
  let testData: PosTestData
  let posService: SalonPosIntegrationService
  const testBranchId = 'test-branch-001'
  const testCashierId = 'test-cashier-001'
  const testTillId = 'test-till-001'

  beforeAll(async () => {
    // Use test organization ID from environment or default
    const orgId = process.env.TEST_ORGANIZATION_ID || 'test-org-123'
    
    // Seed test data
    testData = await seedPosTestData(orgId)
    
    // Initialize POS service
    posService = new SalonPosIntegrationService(orgId)
  })

  afterAll(async () => {
    // Cleanup test data
    if (testData) {
      await cleanupPosTestData(testData)
    }
  })

  describe('POS Transaction Processing', () => {
    it('should process a complete POS transaction with service + tax', async () => {
      // Prepare ticket data
      const ticket = {
        customer_id: testData.customerId,
        lineItems: [
          {
            entity_id: testData.serviceId,
            entity_type: 'service',
            entity_name: 'Test Hair Color Service',
            quantity: 1,
            unit_price: 150,
            line_amount: 150,
            stylist_id: testData.stylistId,
            notes: 'Test service line'
          }
        ],
        discounts: [],
        tips: []
      }

      // Prepare payment data - should match total with tax
      const payments = [
        {
          type: 'card',
          amount: 157.50, // 150 + 5% tax
          reference: 'TEST-PAYMENT-001',
          cardType: 'visa'
        }
      ]

      // Process transaction
      const result = await posService.processPosTransaction(
        ticket,
        payments,
        {
          branch_id: testBranchId,
          cashier_id: testCashierId,
          till_id: testTillId
        }
      )

      // Validate transaction was successful
      expect(result.success).toBe(true)
      expect(result.transaction_id).toBeDefined()
      expect(result.transaction_code).toBeDefined()

      // Retrieve transaction details for validation
      const transactionId = result.transaction_id
      const transactionResponse = await universalApi.read({
        table: 'universal_transactions',
        filters: { id: transactionId }
      })

      expect(transactionResponse.success).toBe(true)
      expect(transactionResponse.data).toHaveLength(1)

      const transaction = transactionResponse.data![0]

      // Validate transaction header
      expect(transaction.transaction_type).toBe('sale') // Should be 'sale', not 'POS_SALE'
      expect(transaction.smart_code).toBe(heraCode('HERA.SALON.POS.SALE.HEADER.v1'))
      expect(transaction.smart_code).toMatch(/\.v1$/) // Ensure lowercase .v1
      expect(transaction.total_amount).toBe(157.50)
      expect(transaction.organization_id).toBe(testData.organizationId)
      expect(transaction.business_context?.branch_id).toBe(testBranchId)

      // Retrieve transaction lines
      const linesResponse = await universalApi.read({
        table: 'universal_transaction_lines',
        filters: { transaction_id: transactionId }
      })

      expect(linesResponse.success).toBe(true)
      const lines = linesResponse.data || []

      // Validate we have at least 3 lines (SERVICE, TAX, PAYMENT)
      expect(lines.length).toBeGreaterThanOrEqual(3)

      // Find specific line types
      const serviceLine = lines.find(l => l.smart_code === heraCode('HERA.SALON.POS.LINE.SERVICE.v1'))
      const taxLine = lines.find(l => l.smart_code === heraCode('HERA.SALON.POS.LINE.TAX.v1'))
      const paymentLine = lines.find(l => l.smart_code?.includes('PAYMENT'))

      // Validate service line
      expect(serviceLine).toBeDefined()
      expect(serviceLine!.line_amount).toBe(150)
      expect(serviceLine!.quantity).toBe(1)
      expect(serviceLine!.unit_price).toBe(150)
      expect(serviceLine!.line_entity_id).toBe(testData.serviceId)
      expect(serviceLine!.smart_code).toMatch(/\.v1$/)

      // Validate tax line
      expect(taxLine).toBeDefined()
      expect(taxLine!.line_amount).toBe(7.50) // 5% of 150
      expect(taxLine!.smart_code).toMatch(/\.v1$/)
      expect(taxLine!.line_data?.tax_rate).toBe(0.05)

      // Validate payment line
      expect(paymentLine).toBeDefined()
      expect(paymentLine!.line_amount).toBe(-157.50) // Negative to balance
      expect(paymentLine!.smart_code).toMatch(/\.v1$/)
      expect(paymentLine!.line_data?.payment_method).toBe('card')

      // Validate line balancing
      const totalLineAmount = lines.reduce((sum, line) => sum + (line.line_amount || 0), 0)
      expect(Math.abs(totalLineAmount)).toBeLessThan(0.01) // Should balance to zero

      // Validate all smart codes use lowercase .v1
      lines.forEach(line => {
        expect(line.smart_code).toBeDefined()
        expect(line.smart_code).toMatch(/\.v1$/)
        expect(line.smart_code).not.toMatch(/\.V1$/)
      })

      // Check for commission lines (should be present)
      const commissionLines = lines.filter(l => 
        l.smart_code?.includes('COMMISSION')
      )
      expect(commissionLines.length).toBeGreaterThanOrEqual(1)
    })

    it('should validate ticket before processing', async () => {
      // Test with invalid ticket (no line items)
      const invalidTicket = {
        customer_id: testData.customerId,
        lineItems: []
      }

      const validation = await posService.validatePosTicket(invalidTicket)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Ticket must have at least one item')
    })

    it('should handle service pricing correctly', async () => {
      const pricing = await posService.getServicePricing(
        testData.serviceId,
        {
          customer_id: testData.customerId,
          stylist_id: testData.stylistId
        }
      )

      expect(pricing.unit_price).toBe(150)
      expect(pricing.base_price).toBe(150)
      expect(pricing.currency).toBe('USD')
      expect(pricing.stylist_commission_rate).toBe(35)
    })

    it('should calculate ticket totals with tax correctly', async () => {
      const ticket = {
        customer_id: testData.customerId,
        lineItems: [
          {
            entity_id: testData.serviceId,
            entity_type: 'service',
            entity_name: 'Test Hair Color Service',
            quantity: 1,
            unit_price: 150,
            line_amount: 150
          }
        ],
        discounts: [],
        tips: []
      }

      // Use the private method via reflection (for testing)
      const totals = (posService as any).calculateTicketTotals(ticket)

      expect(totals.subtotal).toBe(150)
      expect(totals.discountAmount).toBe(0)
      expect(totals.tipAmount).toBe(0)
      expect(totals.taxAmount).toBe(7.50) // 5% of 150
      expect(totals.total).toBe(157.50)
    })

    it('should retrieve available stylists for service', async () => {
      const stylists = await posService.getAvailableStylists(
        testData.serviceId,
        new Date().toISOString()
      )

      expect(stylists.length).toBeGreaterThan(0)
      
      const testStylist = stylists.find(s => s.id === testData.stylistId)
      expect(testStylist).toBeDefined()
      expect(testStylist!.name).toBe('Test Stylist Maria')
      expect(testStylist!.commission_rate).toBe(35)
      expect(testStylist!.available).toBe(true)
    })

    it('should use correct smart code helper function', () => {
      // Test that heraCode helper properly formats smart codes
      const testCodes = [
        'HERA.SALON.POS.SALE.HEADER.V1', // uppercase V
        'HERA.SALON.POS.SALE.HEADER.v1', // lowercase v
      ]

      testCodes.forEach(code => {
        const formatted = heraCode(code)
        expect(formatted).toBe('HERA.SALON.POS.SALE.HEADER.v1')
        expect(formatted).toMatch(/\.v1$/)
      })
    })
  })
})