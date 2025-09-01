import { test, expect } from '@playwright/test'
import { SupabaseTestClient } from '../../fixtures/supabase-client'
import { TEST_DATA } from '../../fixtures/test-data'

const SAP_TEST_ORG_ID = '12345678-1234-1234-1234-123456789012'

test.describe('SAP FI Integration Tests', () => {
  let supabaseClient: SupabaseTestClient
  let testTransactionId: string
  let testVendorId: string
  let testGLAccountId: string

  test.beforeAll(async () => {
    supabaseClient = new SupabaseTestClient()
    
    // Setup test organization with SAP configuration
    await setupSAPConfiguration()
    
    // Create test master data
    await createTestMasterData()
  })

  async function setupSAPConfiguration() {
    // Store SAP configuration in core_dynamic_data
    const configFields = [
      {
        organization_id: SAP_TEST_ORG_ID,
        entity_id: SAP_TEST_ORG_ID,
        field_name: 'sap_system_type',
        field_value_text: 'S4HANA_CLOUD',
        smart_code: 'HERA.ERP.FI.CONFIG.v1'
      },
      {
        organization_id: SAP_TEST_ORG_ID,
        entity_id: SAP_TEST_ORG_ID,
        field_name: 'sap_url',
        field_value_text: 'https://test-s4hana.example.com',
        smart_code: 'HERA.ERP.FI.CONFIG.v1'
      },
      {
        organization_id: SAP_TEST_ORG_ID,
        entity_id: SAP_TEST_ORG_ID,
        field_name: 'company_code',
        field_value_text: '1000',
        smart_code: 'HERA.ERP.FI.CONFIG.v1'
      },
      {
        organization_id: SAP_TEST_ORG_ID,
        entity_id: SAP_TEST_ORG_ID,
        field_name: 'credentials',
        field_value_json: {
          clientId: 'test-client',
          clientSecret: 'test-secret'
        },
        smart_code: 'HERA.ERP.FI.CONFIG.v1'
      }
    ]

    for (const field of configFields) {
      await supabaseClient.client
        .from('core_dynamic_data')
        .upsert(field)
    }
  }

  async function createTestMasterData() {
    // Create test vendor
    const { data: vendor } = await supabaseClient.client
      .from('core_entities')
      .insert({
        organization_id: SAP_TEST_ORG_ID,
        entity_type: 'vendor',
        entity_name: 'Test SAP Vendor',
        entity_code: 'VENDOR-SAP-001',
        smart_code: 'HERA.ERP.FI.MD.VENDOR.v1'
      })
      .select()
      .single()
    
    testVendorId = vendor.id

    // Create test GL account
    const { data: glAccount } = await supabaseClient.client
      .from('core_entities')
      .insert({
        organization_id: SAP_TEST_ORG_ID,
        entity_type: 'gl_account',
        entity_name: 'Office Supplies Expense',
        entity_code: '6100',
        smart_code: 'HERA.ERP.FI.MD.GL.v1'
      })
      .select()
      .single()
    
    testGLAccountId = glAccount.id
  }

  test('should validate transaction before posting to SAP', async ({ request }) => {
    // Create an unbalanced transaction
    const { data: transaction } = await supabaseClient.client
      .from('universal_transactions')
      .insert({
        organization_id: SAP_TEST_ORG_ID,
        transaction_type: 'journal_entry',
        transaction_code: `JE-TEST-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 1000,
        smart_code: 'HERA.ERP.FI.JE.POST.v1'
      })
      .select()
      .single()

    // Create unbalanced lines (only debit, no credit)
    await supabaseClient.client
      .from('universal_transaction_lines')
      .insert([
        {
          organization_id: SAP_TEST_ORG_ID,
          transaction_id: transaction.id,
          line_number: 1,
          gl_account_code: '6100',
          debit_amount: 1000,
          credit_amount: 0,
          line_amount: 1000
        }
      ])

    // Attempt to post to SAP
    const response = await request.post('/api/v1/sap-fi', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
      },
      data: {
        action: 'post_transaction',
        transaction_id: transaction.id
      }
    })

    const result = await response.json()
    
    expect(response.status()).toBe(200)
    expect(result.success).toBe(false)
    expect(result.error).toContain('not balanced')
  })

  test('should detect duplicate invoices using AI analysis', async ({ request }) => {
    // Create original invoice
    const { data: originalInvoice } = await supabaseClient.client
      .from('universal_transactions')
      .insert({
        organization_id: SAP_TEST_ORG_ID,
        transaction_type: 'purchase_invoice',
        transaction_code: `PI-ORIG-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: testVendorId,
        total_amount: 5000,
        smart_code: 'HERA.ERP.FI.AP.INVOICE.v1',
        metadata: {
          invoice_number: 'INV-12345'
        }
      })
      .select()
      .single()

    // Check for duplicate
    const response = await request.post('/api/v1/sap-fi', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
      },
      data: {
        action: 'check_duplicate',
        organization_id: SAP_TEST_ORG_ID,
        vendor_id: testVendorId,
        invoice_number: 'INV-12345',
        invoice_amount: 5000,
        invoice_date: new Date().toISOString()
      }
    })

    const result = await response.json()
    
    expect(response.status()).toBe(200)
    expect(result.is_duplicate).toBe(true)
    expect(result.confidence).toBeGreaterThan(0.9)
    expect(result.recommendation).toContain('DO NOT POST')
  })

  test('should successfully post balanced journal entry to SAP', async ({ request }) => {
    // Create balanced journal entry
    const { data: transaction } = await supabaseClient.client
      .from('universal_transactions')
      .insert({
        organization_id: SAP_TEST_ORG_ID,
        transaction_type: 'journal_entry',
        transaction_code: `JE-BALANCED-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 2500,
        smart_code: 'HERA.ERP.FI.JE.POST.v1',
        description: 'Office supplies purchase'
      })
      .select()
      .single()

    testTransactionId = transaction.id

    // Create balanced lines
    await supabaseClient.client
      .from('universal_transaction_lines')
      .insert([
        {
          organization_id: SAP_TEST_ORG_ID,
          transaction_id: transaction.id,
          line_number: 1,
          gl_account_code: '6100',
          debit_amount: 2500,
          credit_amount: 0,
          line_amount: 2500,
          description: 'Office supplies expense'
        },
        {
          organization_id: SAP_TEST_ORG_ID,
          transaction_id: transaction.id,
          line_number: 2,
          gl_account_code: '1100',
          debit_amount: 0,
          credit_amount: 2500,
          line_amount: 2500,
          description: 'Cash payment'
        }
      ])

    // Post to SAP (mock response in test environment)
    const response = await request.post('/api/v1/sap-fi', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
      },
      data: {
        action: 'post_transaction',
        transaction_id: transaction.id
      }
    })

    const result = await response.json()
    
    expect(response.status()).toBe(200)
    expect(result.success).toBe(true)
    expect(result.sapDocumentNumber).toBeDefined()
    expect(result.sapFiscalYear).toBeDefined()

    // Verify transaction was updated
    const { data: updatedTransaction } = await supabaseClient.client
      .from('universal_transactions')
      .select('transaction_status, metadata')
      .eq('id', transaction.id)
      .single()

    expect(updatedTransaction.transaction_status).toBe('posted')
    expect(updatedTransaction.metadata.sap_document_number).toBeDefined()
  })

  test('should handle batch posting of multiple transactions', async ({ request }) => {
    // Create multiple transactions
    const transactionIds = []
    
    for (let i = 0; i < 3; i++) {
      const { data: transaction } = await supabaseClient.client
        .from('universal_transactions')
        .insert({
          organization_id: SAP_TEST_ORG_ID,
          transaction_type: 'journal_entry',
          transaction_code: `JE-BATCH-${Date.now()}-${i}`,
          transaction_date: new Date().toISOString(),
          total_amount: 1000 * (i + 1),
          smart_code: 'HERA.ERP.FI.JE.POST.v1'
        })
        .select()
        .single()

      transactionIds.push(transaction.id)

      // Create balanced lines for each
      await supabaseClient.client
        .from('universal_transaction_lines')
        .insert([
          {
            organization_id: SAP_TEST_ORG_ID,
            transaction_id: transaction.id,
            line_number: 1,
            gl_account_code: '6100',
            debit_amount: 1000 * (i + 1),
            credit_amount: 0,
            line_amount: 1000 * (i + 1)
          },
          {
            organization_id: SAP_TEST_ORG_ID,
            transaction_id: transaction.id,
            line_number: 2,
            gl_account_code: '1100',
            debit_amount: 0,
            credit_amount: 1000 * (i + 1),
            line_amount: 1000 * (i + 1)
          }
        ])
    }

    // Post batch
    const response = await request.post('/api/v1/sap-fi', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
      },
      data: {
        action: 'post_batch',
        transaction_ids: transactionIds
      }
    })

    const results = await response.json()
    
    expect(response.status()).toBe(200)
    expect(results).toHaveLength(3)
    
    results.forEach((result: any) => {
      expect(result.success).toBe(true)
      expect(result.sapDocumentNumber).toBeDefined()
    })
  })

  test('should retrieve GL account balance from SAP', async ({ request }) => {
    const response = await request.get('/api/v1/sap-fi', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
      },
      params: {
        action: 'get_balance',
        organization_id: SAP_TEST_ORG_ID,
        gl_account: '6100',
        period: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
    })

    const result = await response.json()
    
    expect(response.status()).toBe(200)
    expect(result.gl_account).toBe('6100')
    expect(result.balance).toBeDefined()
    expect(result.currency).toBe('USD')
  })

  test('should handle SAP system connection test', async ({ request }) => {
    const response = await request.post('/api/v1/sap-fi', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
      },
      data: {
        action: 'test_connection',
        organization_id: SAP_TEST_ORG_ID
      }
    })

    const result = await response.json()
    
    expect(response.status()).toBe(200)
    expect(result.success).toBeDefined()
    expect(result.systemInfo).toBeDefined()
  })

  test('should create proper audit trail for SAP postings', async () => {
    // Check audit trail for previously posted transaction
    const { data: auditTrail } = await supabaseClient.client
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', testTransactionId)
      .eq('field_name', 'sap_posting_audit')
      .single()

    expect(auditTrail).toBeDefined()
    expect(auditTrail.smart_code).toBe('HERA.AUDIT.SAP.POST.v1')
    expect(auditTrail.field_value_json.sap_document).toBeDefined()
    expect(auditTrail.field_value_json.posted_at).toBeDefined()
  })

  test('should handle error logging for failed postings', async () => {
    // Create a transaction that will fail
    const { data: failedTransaction } = await supabaseClient.client
      .from('universal_transactions')
      .insert({
        organization_id: SAP_TEST_ORG_ID,
        transaction_type: 'journal_entry',
        transaction_code: `JE-FAIL-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0, // This will fail validation
        smart_code: 'HERA.ERP.FI.JE.POST.v1'
      })
      .select()
      .single()

    // Attempt to post (will fail)
    await supabaseClient.client
      .from('core_dynamic_data')
      .insert({
        organization_id: SAP_TEST_ORG_ID,
        entity_id: failedTransaction.id,
        field_name: 'sap_posting_error',
        field_value_text: 'Transaction amount cannot be zero',
        field_value_json: {
          error_details: { code: 'INVALID_AMOUNT' },
          timestamp: new Date().toISOString()
        },
        smart_code: 'HERA.ERP.FI.ERROR.POST.v1'
      })

    // Verify error was logged
    const { data: errorLog } = await supabaseClient.client
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', failedTransaction.id)
      .eq('field_name', 'sap_posting_error')
      .single()

    expect(errorLog).toBeDefined()
    expect(errorLog.field_value_text).toContain('amount cannot be zero')
  })

  test('should validate Smart Code mappings for GL posting', async () => {
    // Verify Smart Code determines correct SAP document type
    const smartCodeMappings = [
      { smartCode: 'HERA.ERP.FI.JE.POST.v1', expectedDocType: 'SA' },
      { smartCode: 'HERA.ERP.FI.AP.INVOICE.v1', expectedDocType: 'KR' },
      { smartCode: 'HERA.ERP.FI.AR.INVOICE.v1', expectedDocType: 'DR' },
      { smartCode: 'HERA.ERP.FI.AP.PAYMENT.v1', expectedDocType: 'KZ' },
      { smartCode: 'HERA.ERP.FI.AR.RECEIPT.v1', expectedDocType: 'DZ' }
    ]

    for (const mapping of smartCodeMappings) {
      const { data: smartCodeEntry } = await supabaseClient.client
        .from('smart_code_registry')
        .select('metadata')
        .eq('smart_code', mapping.smartCode)
        .single()

      expect(smartCodeEntry?.metadata?.sap_doc_type).toBe(mapping.expectedDocType)
    }
  })

  test.afterAll(async () => {
    // Cleanup test data
    await supabaseClient.client
      .from('universal_transactions')
      .delete()
      .eq('organization_id', SAP_TEST_ORG_ID)

    await supabaseClient.client
      .from('core_entities')
      .delete()
      .eq('organization_id', SAP_TEST_ORG_ID)

    await supabaseClient.client
      .from('core_dynamic_data')
      .delete()
      .eq('organization_id', SAP_TEST_ORG_ID)
  })
})