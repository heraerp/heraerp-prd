import { test, expect } from '../../fixtures/api-fixtures'
import { TRANSACTION_TYPES, SMART_CODES, ENTITY_TYPES } from '../../helpers/test-constants'

test.describe('Ice Cream Module - Transaction CRUD Operations', () => {
  let customerId: string
  let vendorId: string
  let productId: string
  
  test.beforeAll(async ({ supabaseClient, organizationId, testIds }) => {
    // Create test entities needed for transactions
    const customer = await supabaseClient.insert('core_entities', {
      organization_id: organizationId,
      entity_type: ENTITY_TYPES.CUSTOMER,
      entity_name: `Transaction Test Customer ${testIds.uniqueId}`,
      entity_code: `TXN-CUST-${testIds.uniqueId}`,
      smart_code: SMART_CODES.CUSTOMER_RETAIL,
    })
    customerId = customer.data[0].id
    
    const vendor = await supabaseClient.insert('core_entities', {
      organization_id: organizationId,
      entity_type: ENTITY_TYPES.VENDOR,
      entity_name: `Transaction Test Vendor ${testIds.uniqueId}`,
      entity_code: `TXN-VEND-${testIds.uniqueId}`,
      smart_code: SMART_CODES.VENDOR_DAIRY,
    })
    vendorId = vendor.data[0].id
    
    const product = await supabaseClient.insert('core_entities', {
      organization_id: organizationId,
      entity_type: ENTITY_TYPES.PRODUCT,
      entity_name: `Transaction Test Product ${testIds.uniqueId}`,
      entity_code: `TXN-PROD-${testIds.uniqueId}`,
      smart_code: SMART_CODES.PRODUCT_ICECREAM,
      metadata: { unit_price: 100 },
    })
    productId = product.data[0].id
  })
  
  test.describe('Production Batch Management', () => {
    let batchId: string
    
    test('should create production batch with efficiency tracking', async ({ supabaseClient, organizationId, testIds }) => {
      const batchData = {
        organization_id: organizationId,
        transaction_type: TRANSACTION_TYPES.PRODUCTION_BATCH,
        transaction_code: `BATCH-${testIds.uniqueId}`,
        transaction_date: new Date().toISOString(),
        total_amount: 15000, // Production cost
        transaction_status: 'in_progress',
        smart_code: SMART_CODES.PRODUCTION_BATCH,
        metadata: {
          batch_number: `BATCH-${testIds.uniqueId}`,
          recipe: 'Premium Vanilla',
          planned_quantity: 200,
          actual_output_liters: 195,
          yield_variance_percent: -2.5,
          material_cost: 10000,
          labor_cost: 3000,
          overhead_cost: 2000,
          total_cost: 15000,
          unit_cost: 76.92,
          selling_price: 100,
          profit_margin: 23.08,
          production_progress: 50,
        },
      }
      
      const { data, error, status } = await supabaseClient.insert('universal_transactions', batchData)
      
      expect(error).toBeNull()
      expect(status).toBe(201)
      expect(data[0].metadata.yield_variance_percent).toBe(-2.5)
      
      batchId = data[0].id
    })
    
    test('should add production line items', async ({ supabaseClient, organizationId, testIds }) => {
      const lineItems = [
        {
          organization_id: organizationId,
          transaction_id: batchId,
          line_entity_id: productId,
          line_number: 1,
          quantity: 195,
          unit_price: 76.92,
          line_amount: 14999.40,
          smart_code: 'HERA.MFG.LINE.OUTPUT.v1',
          metadata: {
            batch_number: `BATCH-${testIds.uniqueId}`,
            production_date: new Date().toISOString(),
          },
        },
      ]
      
      const { error, status } = await supabaseClient.insert('universal_transaction_lines', lineItems)
      
      expect(error).toBeNull()
      expect(status).toBe(201)
    })
    
    test('should update batch status to completed', async ({ supabaseClient }) => {
      const updateData = {
        transaction_status: 'completed',
        metadata: {
          production_progress: 100,
          completion_time: new Date().toISOString(),
          qc_status: 'passed',
        },
      }
      
      const { error, status } = await supabaseClient.update('universal_transactions', batchId, updateData)
      
      expect(error).toBeNull()
      expect(status).toBe(200)
    })
    
    test.cleanup(async ({ supabaseClient }) => {
      if (batchId) {
        await supabaseClient.delete('universal_transactions', batchId)
      }
    })
  })
  
  test.describe('Cold Chain Expense Tracking', () => {
    let expenseId: string
    
    test('should create cold chain electricity expense', async ({ supabaseClient, organizationId, testIds }) => {
      const expenseData = {
        organization_id: organizationId,
        transaction_type: TRANSACTION_TYPES.EXPENSE,
        transaction_code: `COLD-EXP-${testIds.uniqueId}`,
        transaction_date: new Date().toISOString(),
        total_amount: 12000,
        transaction_status: 'completed',
        smart_code: SMART_CODES.COLD_CHAIN_EXPENSE,
        metadata: {
          expense_type: 'cold_chain_energy',
          description: 'Freezer electricity - Test',
          cost_center: 'PRODUCTION',
          kilowatt_hours: 3200,
          rate_per_kwh: 3.75,
          temperature_maintained: -18,
        },
      }
      
      const { data, error } = await supabaseClient.insert('universal_transactions', expenseData)
      
      expect(error).toBeNull()
      expect(data[0].metadata.kilowatt_hours).toBe(3200)
      
      expenseId = data[0].id
    })
    
    test('should create temperature variance wastage', async ({ supabaseClient, organizationId, testIds }) => {
      const wastageData = {
        organization_id: organizationId,
        transaction_type: TRANSACTION_TYPES.INVENTORY_ADJUSTMENT,
        transaction_code: `TEMP-WASTE-${testIds.uniqueId}`,
        transaction_date: new Date().toISOString(),
        total_amount: 3500,
        transaction_status: 'completed',
        smart_code: SMART_CODES.TEMPERATURE_VARIANCE,
        metadata: {
          adjustment_type: 'wastage',
          wastage_reason: 'temperature_excursion',
          batch_number: `BATCH-${testIds.uniqueId}`,
          temperature_reading: -12.5,
          required_temperature: -18,
          duration_hours: 2,
          product_lost: '50L vanilla ice cream',
          incident_description: 'Power outage test scenario',
        },
      }
      
      const { data, error } = await supabaseClient.insert('universal_transactions', wastageData)
      
      expect(error).toBeNull()
      expect(data[0].metadata.temperature_reading).toBe(-12.5)
    })
    
    test.cleanup(async ({ supabaseClient }) => {
      if (expenseId) {
        await supabaseClient.delete('universal_transactions', expenseId)
      }
    })
  })
  
  test.describe('Sales and AR Management', () => {
    let invoiceId: string
    let posId: string
    
    test('should create B2B sales invoice', async ({ supabaseClient, organizationId, testIds }) => {
      const invoiceData = {
        organization_id: organizationId,
        transaction_type: TRANSACTION_TYPES.INVOICE,
        transaction_code: `INV-${testIds.uniqueId}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: customerId,
        total_amount: 35000,
        transaction_status: 'pending',
        smart_code: 'HERA.FIN.AR.TXN.INVOICE.v1',
        metadata: {
          invoice_number: `SI-${testIds.uniqueId}`,
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // NET15
          description: 'Ice cream bulk order - 350 units',
          payment_terms: 'NET15',
        },
      }
      
      const { data, error } = await supabaseClient.insert('universal_transactions', invoiceData)
      
      expect(error).toBeNull()
      expect(data[0].transaction_status).toBe('pending')
      
      invoiceId = data[0].id
    })
    
    test('should create POS sale transaction', async ({ supabaseClient, organizationId, testIds }) => {
      const posData = {
        organization_id: organizationId,
        transaction_type: TRANSACTION_TYPES.POS_SALE,
        transaction_code: `POS-${testIds.uniqueId}`,
        transaction_date: new Date().toISOString(),
        total_amount: 5000,
        transaction_status: 'completed',
        smart_code: SMART_CODES.SALE_POS,
        metadata: {
          payment_method: 'cash',
          items_sold: 50,
          average_price: 100,
          outlet: 'Main Store',
          cash_amount: 3000,
          card_amount: 2000,
          receipt_number: `RCP-${testIds.uniqueId}`,
        },
      }
      
      const { data, error } = await supabaseClient.insert('universal_transactions', posData)
      
      expect(error).toBeNull()
      expect(data[0].metadata.items_sold).toBe(50)
      
      posId = data[0].id
    })
    
    test('should process payment for invoice', async ({ supabaseClient, organizationId, testIds }) => {
      const paymentData = {
        organization_id: organizationId,
        transaction_type: TRANSACTION_TYPES.PAYMENT,
        transaction_code: `PAY-${testIds.uniqueId}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: customerId,
        reference_entity_id: invoiceId,
        total_amount: 35000,
        transaction_status: 'completed',
        smart_code: 'HERA.FIN.AR.TXN.PAYMENT.v1',
        metadata: {
          payment_method: 'bank_transfer',
          reference_number: `REF-${testIds.uniqueId}`,
          applied_to_invoice: invoiceId,
        },
      }
      
      const { data, error } = await supabaseClient.insert('universal_transactions', paymentData)
      
      expect(error).toBeNull()
      
      // Update invoice status
      await supabaseClient.update('universal_transactions', invoiceId, {
        transaction_status: 'paid',
      })
    })
    
    test.cleanup(async ({ supabaseClient }) => {
      if (invoiceId) await supabaseClient.delete('universal_transactions', invoiceId)
      if (posId) await supabaseClient.delete('universal_transactions', posId)
    })
  })
  
  test.afterAll(async ({ supabaseClient }) => {
    // Clean up test entities
    if (customerId) await supabaseClient.delete('core_entities', customerId)
    if (vendorId) await supabaseClient.delete('core_entities', vendorId)
    if (productId) await supabaseClient.delete('core_entities', productId)
  })
})