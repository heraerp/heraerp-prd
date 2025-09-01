import { test, expect } from '@playwright/test'
import { SupabaseTestClient } from '../../fixtures/supabase-client'

const SAP_TEST_ORG_ID = '12345678-1234-1234-1234-123456789012'

test.describe('SAP FI Edge Cases and Security Tests', () => {
  let supabaseClient: SupabaseTestClient

  test.beforeAll(async () => {
    supabaseClient = new SupabaseTestClient()
  })

  test.describe('Multi-tenancy Security', () => {
    test('should prevent cross-organization SAP posting', async ({ request }) => {
      const EVIL_ORG_ID = '99999999-9999-9999-9999-999999999999'
      
      // Create transaction in org A
      const { data: transaction } = await supabaseClient.client
        .from('universal_transactions')
        .insert({
          organization_id: SAP_TEST_ORG_ID,
          transaction_type: 'journal_entry',
          transaction_code: `JE-SECURITY-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: 1000,
          smart_code: 'HERA.ERP.FI.JE.POST.v1'
        })
        .select()
        .single()

      // Try to post from different org context
      const response = await request.post('/api/v1/sap-fi', {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`,
          'X-Organization-Id': EVIL_ORG_ID
        },
        data: {
          action: 'post_transaction',
          transaction_id: transaction.id
        }
      })

      expect(response.status()).toBe(403)
      const result = await response.json()
      expect(result.error).toContain('Unauthorized')
    })

    test('should isolate SAP configurations by organization', async () => {
      const ORG_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      const ORG_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

      // Create config for Org A
      await supabaseClient.client
        .from('core_dynamic_data')
        .insert({
          organization_id: ORG_A,
          entity_id: ORG_A,
          field_name: 'sap_system_type',
          field_value_text: 'S4HANA_CLOUD',
          smart_code: 'HERA.ERP.FI.CONFIG.v1'
        })

      // Create different config for Org B
      await supabaseClient.client
        .from('core_dynamic_data')
        .insert({
          organization_id: ORG_B,
          entity_id: ORG_B,
          field_name: 'sap_system_type',
          field_value_text: 'ECC',
          smart_code: 'HERA.ERP.FI.CONFIG.v1'
        })

      // Verify isolation
      const { data: configA } = await supabaseClient.client
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', ORG_A)
        .eq('field_name', 'sap_system_type')
        .single()

      const { data: configB } = await supabaseClient.client
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', ORG_B)
        .eq('field_name', 'sap_system_type')
        .single()

      expect(configA.field_value_text).toBe('S4HANA_CLOUD')
      expect(configB.field_value_text).toBe('ECC')
    })
  })

  test.describe('Performance and Concurrency', () => {
    test('should handle concurrent SAP postings without race conditions', async ({ request }) => {
      // Create multiple transactions
      const transactions = []
      for (let i = 0; i < 5; i++) {
        const { data: tx } = await supabaseClient.client
          .from('universal_transactions')
          .insert({
            organization_id: SAP_TEST_ORG_ID,
            transaction_type: 'journal_entry',
            transaction_code: `JE-CONCURRENT-${Date.now()}-${i}`,
            transaction_date: new Date().toISOString(),
            total_amount: 1000,
            smart_code: 'HERA.ERP.FI.JE.POST.v1'
          })
          .select()
          .single()
        
        transactions.push(tx)

        // Add balanced lines
        await supabaseClient.client
          .from('universal_transaction_lines')
          .insert([
            {
              organization_id: SAP_TEST_ORG_ID,
              transaction_id: tx.id,
              line_number: 1,
              gl_account_code: '6100',
              debit_amount: 1000,
              credit_amount: 0,
              line_amount: 1000
            },
            {
              organization_id: SAP_TEST_ORG_ID,
              transaction_id: tx.id,
              line_number: 2,
              gl_account_code: '1100',
              debit_amount: 0,
              credit_amount: 1000,
              line_amount: 1000
            }
          ])
      }

      // Post all transactions concurrently
      const postPromises = transactions.map(tx => 
        request.post('/api/v1/sap-fi', {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
          },
          data: {
            action: 'post_transaction',
            transaction_id: tx.id
          }
        })
      )

      const responses = await Promise.all(postPromises)
      const results = await Promise.all(responses.map(r => r.json()))

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.sapDocumentNumber).toBeDefined()
      })

      // Verify no duplicate SAP document numbers
      const docNumbers = results.map(r => r.sapDocumentNumber)
      const uniqueDocNumbers = new Set(docNumbers)
      expect(uniqueDocNumbers.size).toBe(docNumbers.length)
    })

    test('should handle large batch postings efficiently', async ({ request }) => {
      const BATCH_SIZE = 50
      const transactionIds = []

      // Create large batch
      for (let i = 0; i < BATCH_SIZE; i++) {
        const { data: tx } = await supabaseClient.client
          .from('universal_transactions')
          .insert({
            organization_id: SAP_TEST_ORG_ID,
            transaction_type: 'journal_entry',
            transaction_code: `JE-BATCH-LARGE-${Date.now()}-${i}`,
            transaction_date: new Date().toISOString(),
            total_amount: 100 + i,
            smart_code: 'HERA.ERP.FI.JE.POST.v1'
          })
          .select()
          .single()
        
        transactionIds.push(tx.id)
      }

      const startTime = Date.now()
      
      const response = await request.post('/api/v1/sap-fi', {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_JWT_TOKEN}`
        },
        data: {
          action: 'post_batch',
          transaction_ids: transactionIds
        },
        timeout: 60000 // 60 second timeout for large batch
      })

      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(response.status()).toBe(200)
      const results = await response.json()
      expect(results).toHaveLength(BATCH_SIZE)
      
      // Should process efficiently (less than 30 seconds for 50 transactions)
      expect(processingTime).toBeLessThan(30000)
    })
  })

  test.describe('Error Recovery and Resilience', () => {
    test('should handle SAP system unavailability gracefully', async ({ request }) => {
      // Configure SAP with invalid URL to simulate unavailability
      await supabaseClient.client
        .from('core_dynamic_data')
        .upsert({
          organization_id: SAP_TEST_ORG_ID,
          entity_id: SAP_TEST_ORG_ID,
          field_name: 'sap_url',
          field_value_text: 'https://invalid-sap-system.local',
          smart_code: 'HERA.ERP.FI.CONFIG.v1'
        })

      const { data: transaction } = await supabaseClient.client
        .from('universal_transactions')
        .insert({
          organization_id: SAP_TEST_ORG_ID,
          transaction_type: 'journal_entry',
          transaction_code: `JE-UNAVAILABLE-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: 1000,
          smart_code: 'HERA.ERP.FI.JE.POST.v1'
        })
        .select()
        .single()

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
      expect(result.success).toBe(false)
      expect(result.error).toContain('SAP system unavailable')
      
      // Verify error was logged
      const { data: errorLog } = await supabaseClient.client
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', transaction.id)
        .eq('field_name', 'sap_posting_error')
        .single()

      expect(errorLog).toBeDefined()
    })

    test('should handle partial batch failures correctly', async ({ request }) => {
      const transactionIds = []
      
      // Create mix of valid and invalid transactions
      for (let i = 0; i < 5; i++) {
        const { data: tx } = await supabaseClient.client
          .from('universal_transactions')
          .insert({
            organization_id: SAP_TEST_ORG_ID,
            transaction_type: 'journal_entry',
            transaction_code: `JE-MIXED-${Date.now()}-${i}`,
            transaction_date: new Date().toISOString(),
            total_amount: i % 2 === 0 ? 1000 : 0, // Every other one is invalid
            smart_code: 'HERA.ERP.FI.JE.POST.v1'
          })
          .select()
          .single()
        
        transactionIds.push(tx.id)

        // Add lines only for valid transactions
        if (i % 2 === 0) {
          await supabaseClient.client
            .from('universal_transaction_lines')
            .insert([
              {
                organization_id: SAP_TEST_ORG_ID,
                transaction_id: tx.id,
                line_number: 1,
                gl_account_code: '6100',
                debit_amount: 1000,
                credit_amount: 0,
                line_amount: 1000
              },
              {
                organization_id: SAP_TEST_ORG_ID,
                transaction_id: tx.id,
                line_number: 2,
                gl_account_code: '1100',
                debit_amount: 0,
                credit_amount: 1000,
                line_amount: 1000
              }
            ])
        }
      }

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
      expect(results).toHaveLength(5)
      
      // Check mixed results
      const successes = results.filter((r: any) => r.success)
      const failures = results.filter((r: any) => !r.success)
      
      expect(successes).toHaveLength(3)
      expect(failures).toHaveLength(2)
    })
  })

  test.describe('Smart Code Versioning', () => {
    test('should handle Smart Code version upgrades', async () => {
      // Simulate v1 transaction
      const { data: v1Transaction } = await supabaseClient.client
        .from('universal_transactions')
        .insert({
          organization_id: SAP_TEST_ORG_ID,
          transaction_type: 'journal_entry',
          transaction_code: `JE-V1-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: 1000,
          smart_code: 'HERA.ERP.FI.JE.POST.v1'
        })
        .select()
        .single()

      // Simulate v2 transaction with enhanced features
      const { data: v2Transaction } = await supabaseClient.client
        .from('universal_transactions')
        .insert({
          organization_id: SAP_TEST_ORG_ID,
          transaction_type: 'journal_entry',
          transaction_code: `JE-V2-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: 2000,
          smart_code: 'HERA.ERP.FI.JE.POST.v2',
          metadata: {
            enhanced_features: {
              multi_currency: true,
              tax_calculation: true,
              workflow_approval: true
            }
          }
        })
        .select()
        .single()

      // Both should be processable
      expect(v1Transaction.smart_code).toContain('.v1')
      expect(v2Transaction.smart_code).toContain('.v2')
      expect(v2Transaction.metadata.enhanced_features).toBeDefined()
    })
  })

  test.describe('Regional Compliance', () => {
    test('should handle India GST Smart Codes', async () => {
      const { data: gstTransaction } = await supabaseClient.client
        .from('universal_transactions')
        .insert({
          organization_id: SAP_TEST_ORG_ID,
          transaction_type: 'tax_invoice',
          transaction_code: `GST-INV-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: 118000, // 100000 + 18% GST
          smart_code: 'HERA.ERP.FI.REG.IN.GST.v1',
          metadata: {
            gstin: '29AABCT1332L1ZV',
            place_of_supply: 'Karnataka',
            tax_breakdown: {
              taxable_value: 100000,
              cgst: 9000,
              sgst: 9000,
              total: 118000
            }
          }
        })
        .select()
        .single()

      expect(gstTransaction.smart_code).toContain('.REG.IN.GST.')
      expect(gstTransaction.metadata.tax_breakdown.cgst).toBe(9000)
      expect(gstTransaction.metadata.tax_breakdown.sgst).toBe(9000)
    })

    test('should handle EU VAT Smart Codes', async () => {
      const { data: vatTransaction } = await supabaseClient.client
        .from('universal_transactions')
        .insert({
          organization_id: SAP_TEST_ORG_ID,
          transaction_type: 'vat_invoice',
          transaction_code: `VAT-INV-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: 12100, // 10000 + 21% VAT
          smart_code: 'HERA.ERP.FI.REG.EU.VAT.v1',
          metadata: {
            vat_number: 'DE123456789',
            reverse_charge: false,
            vat_rate: 21,
            vat_amount: 2100
          }
        })
        .select()
        .single()

      expect(vatTransaction.smart_code).toContain('.REG.EU.VAT.')
      expect(vatTransaction.metadata.vat_rate).toBe(21)
    })
  })

  test.afterAll(async () => {
    // Cleanup test data
    await supabaseClient.client
      .from('universal_transactions')
      .delete()
      .match({ 
        organization_id: SAP_TEST_ORG_ID,
        transaction_code: { ilike: '%TEST%' }
      })
  })
})