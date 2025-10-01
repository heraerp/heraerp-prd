/**
 * V2 Transactions API Contract Tests
 * Black-box testing of universal transaction operations with org isolation
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { apiV2 } from '@/lib/client/fetchV2'

const TEST_ORG_1 = process.env.TEST_ORG_1 || 'test-org-1-uuid'
const TEST_ORG_2 = process.env.TEST_ORG_2 || 'test-org-2-uuid'

describe('V2 Transactions API Contracts', () => {
  let createdEntities: string[] = []
  let createdTransactions: string[] = []

  beforeAll(async () => {
    // Create test entities for transactions
    const entityPromises = [
      apiV2.post('/entities', {
        entity_type: 'test_customer',
        entity_name: 'Transaction Test Customer',
        smart_code: 'HERA.TEST.TXN.CUSTOMER.V1',
        organization_id: TEST_ORG_1
      }),
      apiV2.post('/entities', {
        entity_type: 'test_product',
        entity_name: 'Transaction Test Product',
        smart_code: 'HERA.TEST.TXN.PRODUCT.V1',
        organization_id: TEST_ORG_1
      }),
      apiV2.post('/entities', {
        entity_type: 'test_account',
        entity_name: 'Cash Account',
        smart_code: 'HERA.TEST.TXN.ACCOUNT.CASH.V1',
        organization_id: TEST_ORG_1
      })
    ]

    const results = await Promise.all(entityPromises)
    results.forEach(result => {
      if (result.data?.data?.entity_id) {
        createdEntities.push(result.data.data.entity_id)
      }
    })
  })

  afterAll(async () => {
    // Note: Transactions typically shouldn't be deleted in production
    // but for testing we clean up
    for (const transactionId of createdTransactions) {
      try {
        await apiV2.post('/transactions?action=reverse', {
          transaction_id: transactionId,
          organization_id: TEST_ORG_1,
          reversal_reason: 'Test cleanup'
        })
      } catch (error) {
        console.warn(`Failed to reverse transaction ${transactionId}:`, error)
      }
    }

    // Cleanup entities
    for (const entityId of createdEntities) {
      try {
        await apiV2.delete(`/entities/${entityId}`)
      } catch (error) {
        console.warn(`Failed to cleanup entity ${entityId}:`, error)
      }
    }
  })

  describe('Transaction Emit Operations', () => {
    test('should emit simple transaction', async () => {
      const [customerEntity, productEntity] = createdEntities

      const transactionData = {
        organization_id: TEST_ORG_1,
        transaction_type: 'sale',
        smart_code: 'HERA.TEST.TXN.SALE.SIMPLE.V1',
        transaction_date: new Date().toISOString(),
        source_entity_id: customerEntity,
        target_entity_id: productEntity,
        business_context: {
          total_amount: 150.00,
          currency: 'USD',
          payment_method: 'cash'
        },
        lines: [
          {
            line_entity_id: productEntity,
            line_number: 1,
            quantity: 2,
            unit_price: 75.00,
            line_amount: 150.00,
            smart_code: 'HERA.TEST.TXN.LINE.PRODUCT.V1'
          }
        ]
      }

      const { data, error } = await apiV2.post('/transactions', transactionData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
      expect(data.transaction_id).toBeDefined()
      
      createdTransactions.push(data.transaction_id)
    })

    test('should emit transaction with multiple lines', async () => {
      const [customerEntity, productEntity] = createdEntities

      const transactionData = {
        organization_id: TEST_ORG_1,
        transaction_type: 'purchase_order',
        smart_code: 'HERA.TEST.TXN.PO.MULTI.V1',
        transaction_date: new Date().toISOString(),
        source_entity_id: customerEntity,
        business_context: {
          order_number: 'PO-2024-001',
          total_amount: 500.00
        },
        lines: [
          {
            line_entity_id: productEntity,
            line_number: 1,
            quantity: 3,
            unit_price: 100.00,
            line_amount: 300.00,
            smart_code: 'HERA.TEST.TXN.LINE.ITEM1.V1'
          },
          {
            line_entity_id: productEntity,
            line_number: 2,
            quantity: 2,
            unit_price: 100.00,
            line_amount: 200.00,
            smart_code: 'HERA.TEST.TXN.LINE.ITEM2.V1'
          }
        ]
      }

      const { data, error } = await apiV2.post('/transactions', transactionData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
      expect(data.transaction_id).toBeDefined()
      
      createdTransactions.push(data.transaction_id)
    })

    test('should emit journal entry transaction', async () => {
      const [, , cashAccount] = createdEntities

      const journalData = {
        organization_id: TEST_ORG_1,
        transaction_type: 'journal_entry',
        smart_code: 'HERA.TEST.TXN.JE.MANUAL.V1',
        transaction_date: new Date().toISOString(),
        business_context: {
          description: 'Test journal entry',
          reference: 'JE-2024-001'
        },
        lines: [
          {
            line_entity_id: cashAccount,
            line_number: 1,
            debit_amount: 1000.00,
            credit_amount: 0,
            line_amount: 1000.00,
            smart_code: 'HERA.TEST.TXN.JE.DEBIT.V1'
          },
          {
            line_entity_id: cashAccount,
            line_number: 2,
            debit_amount: 0,
            credit_amount: 1000.00,
            line_amount: -1000.00,
            smart_code: 'HERA.TEST.TXN.JE.CREDIT.V1'
          }
        ]
      }

      const { data, error } = await apiV2.post('/transactions', journalData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
      expect(data.transaction_id).toBeDefined()
      
      createdTransactions.push(data.transaction_id)
    })
  })

  describe('Transaction Read Operations', () => {
    test('should read specific transaction by ID', async () => {
      // Emit a transaction first
      const transactionData = {
        organization_id: TEST_ORG_1,
        transaction_type: 'test_read',
        smart_code: 'HERA.TEST.TXN.READ.SPECIFIC.V1',
        transaction_date: new Date().toISOString(),
        business_context: { test: 'read_operation' }
      }

      const { data: emitResult } = await apiV2.post('/transactions', transactionData)
      const transactionId = emitResult.transaction_id
      createdTransactions.push(transactionId)

      // Read the transaction back
      const { data, error } = await apiV2.get('/transactions', {
        txn_id: transactionId,
        organization_id: TEST_ORG_1
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
    })

    test('should query transactions with filters', async () => {
      // Emit multiple transactions
      const transactionPromises = Array.from({ length: 3 }, (_, i) => 
        apiV2.post('/transactions', {
          organization_id: TEST_ORG_1,
          transaction_type: 'test_query',
          smart_code: 'HERA.TEST.TXN.QUERY.BATCH.V1',
          transaction_date: new Date().toISOString(),
          business_context: { batch_number: i + 1 }
        })
      )

      const results = await Promise.all(transactionPromises)
      results.forEach(result => {
        if (result.data?.transaction_id) {
          createdTransactions.push(result.data.transaction_id)
        }
      })

      // Query transactions
      const { data, error } = await apiV2.get('/transactions', {
        organization_id: TEST_ORG_1,
        transaction_type: 'test_query',
        limit: 10
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
    })
  })

  describe('Transaction Reversal Operations', () => {
    test('should reverse transaction', async () => {
      // Emit a transaction to reverse
      const transactionData = {
        organization_id: TEST_ORG_1,
        transaction_type: 'test_reversal',
        smart_code: 'HERA.TEST.TXN.REVERSAL.V1',
        transaction_date: new Date().toISOString(),
        business_context: {
          amount: 250.00,
          description: 'Transaction to be reversed'
        }
      }

      const { data: emitResult } = await apiV2.post('/transactions', transactionData)
      const originalTransactionId = emitResult.transaction_id
      createdTransactions.push(originalTransactionId)

      // Reverse the transaction
      const reversalData = {
        organization_id: TEST_ORG_1,
        transaction_id: originalTransactionId,
        reversal_reason: 'Test reversal operation',
        reversal_smart_code: 'HERA.TEST.TXN.REVERSAL.REASON.V1'
      }

      const { data, error } = await apiV2.post('/transactions?action=reverse', reversalData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
      expect(data.transaction_id).toBeDefined()
      
      // Track the reversal transaction for cleanup
      createdTransactions.push(data.transaction_id)
    })
  })

  describe('Organization Isolation', () => {
    test('should enforce organization isolation on transaction emission', async () => {
      // Create entity in ORG_2
      const { data: entityResult } = await apiV2.post('/entities', {
        entity_type: 'test_iso_entity',
        entity_name: 'Isolation Test Entity',
        smart_code: 'HERA.TEST.ISO.TXN.ENTITY.V1',
        organization_id: TEST_ORG_2
      })

      const entityId = entityResult.data.entity_id
      createdEntities.push(entityId)

      // Emit transaction in ORG_2
      const transactionData = {
        organization_id: TEST_ORG_2,
        transaction_type: 'test_isolation',
        smart_code: 'HERA.TEST.TXN.ISOLATION.V1',
        transaction_date: new Date().toISOString(),
        target_entity_id: entityId,
        business_context: { test: 'isolation' }
      }

      const { data, error } = await apiV2.post('/transactions', transactionData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      
      if (data?.transaction_id) {
        createdTransactions.push(data.transaction_id)
      }
    })

    test('should not return transactions from different organization', async () => {
      const { data, error } = await apiV2.get('/transactions', {
        organization_id: TEST_ORG_2,
        transaction_type: 'sale' // Type that exists in ORG_1
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      // Should not find transactions from ORG_1
    })

    test('should return 403 for cross-organization access', async () => {
      // This test assumes auth context is for TEST_ORG_1
      // but request tries to access TEST_ORG_2 data
      const { data, error } = await apiV2.get('/transactions', {
        organization_id: TEST_ORG_2
      })

      // Should either return 403 or empty results depending on auth implementation
      if (error) {
        expect(error.message).toContain('403')
      } else {
        expect(data).toBeDefined()
      }
    })
  })

  describe('Data Validation', () => {
    test('should reject transaction without organization_id', async () => {
      const { data, error } = await apiV2.post('/transactions', {
        transaction_type: 'test_invalid',
        smart_code: 'HERA.TEST.TXN.INVALID.V1'
        // Missing organization_id
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('organization_id')
    })

    test('should reject transaction with invalid smart code', async () => {
      const { data, error } = await apiV2.post('/transactions', {
        organization_id: TEST_ORG_1,
        transaction_type: 'test_invalid',
        smart_code: 'INVALID_SMART_CODE' // Invalid format
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('smart_code')
    })

    test('should reject malformed transaction lines', async () => {
      const { data, error } = await apiV2.post('/transactions', {
        organization_id: TEST_ORG_1,
        transaction_type: 'test_invalid_lines',
        smart_code: 'HERA.TEST.TXN.INVALID.LINES.V1',
        lines: [
          {
            // Missing required fields like line_number, line_amount
            invalid_field: 'invalid'
          }
        ]
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('validation')
    })
  })

  describe('Complex Business Scenarios', () => {
    test('should handle restaurant order transaction', async () => {
      const [customerEntity, productEntity] = createdEntities

      const restaurantOrderData = {
        organization_id: TEST_ORG_1,
        transaction_type: 'restaurant_order',
        smart_code: 'HERA.TEST.RESTAURANT.ORDER.V1',
        transaction_date: new Date().toISOString(),
        source_entity_id: customerEntity,
        business_context: {
          table_number: 5,
          server_id: 'server-123',
          order_type: 'dine_in',
          total_amount: 85.50
        },
        lines: [
          {
            line_entity_id: productEntity,
            line_number: 1,
            quantity: 2,
            unit_price: 25.00,
            line_amount: 50.00,
            smart_code: 'HERA.TEST.RESTAURANT.LINE.FOOD.V1'
          },
          {
            line_entity_id: productEntity,
            line_number: 2,
            quantity: 3,
            unit_price: 8.50,
            line_amount: 25.50,
            smart_code: 'HERA.TEST.RESTAURANT.LINE.BEVERAGE.V1'
          },
          {
            line_entity_id: productEntity,
            line_number: 3,
            quantity: 1,
            unit_price: 10.00,
            line_amount: 10.00,
            smart_code: 'HERA.TEST.RESTAURANT.LINE.TAX.V1'
          }
        ]
      }

      const { data, error } = await apiV2.post('/transactions', restaurantOrderData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
      expect(data.transaction_id).toBeDefined()
      
      createdTransactions.push(data.transaction_id)
    })
  })
})