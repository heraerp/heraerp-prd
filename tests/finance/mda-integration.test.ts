/**
 * HERA Modern Digital Accountant (MDA) Integration Tests
 * 
 * Comprehensive test suite covering all posting scenarios:
 * - Expense postings (salary, rent, utilities, supplies)
 * - Revenue postings (services, products)
 * - POS End-of-Day summaries
 * - Bank fees and transfers
 * - VAT handling (UAE 5%, UK 20%)
 * - GL balancing validation
 * - Fiscal period enforcement
 * - MCP natural language processing
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { UniversalFinanceEvent, SALON_FINANCE_SMART_CODES, FINANCE_TRANSACTION_TYPES } from '@/types/universal-finance-event'
import { processUniversalFinanceEvent } from '@/server/finance/autoPostingEngine'
import { processPOSDailySummary, createSamplePOSSummary } from '@/server/finance/posEodService'
import { validateFiscalPeriodForPosting } from '@/server/finance/fiscalPeriodService'
import { postFinanceEvent, FinanceEventParser } from '@/mcp/skills/finance/post_finance_event'
import { seedUAESalonFinanceRules } from '@/scripts/seed/finance-rules.salon.ae'
import { seedUKSalonFinanceRules } from '@/scripts/seed/finance-rules.salon.uk'
import { seedUAESalonCOA } from '@/scripts/seed/coa.ae'
import { seedUKSalonCOA } from '@/scripts/seed/coa.uk'

describe('HERA Modern Digital Accountant (MDA) Integration Tests', () => {
  const TEST_ORG_UAE = 'test-salon-uae-uuid'
  const TEST_ORG_UK = 'test-salon-uk-uuid'
  const TEST_DATE = '2025-10-05'
  
  beforeAll(async () => {
    console.log('🚀 Setting up MDA test environment...')
    
    // Seed UAE test data
    try {
      await seedUAESalonCOA(TEST_ORG_UAE)
      await seedUAESalonFinanceRules(TEST_ORG_UAE)
      console.log('✅ UAE test data seeded')
    } catch (error) {
      console.warn('⚠️ UAE seeding failed (may already exist):', error)
    }
    
    // Seed UK test data
    try {
      await seedUKSalonCOA(TEST_ORG_UK)
      await seedUKSalonFinanceRules(TEST_ORG_UK)
      console.log('✅ UK test data seeded')
    } catch (error) {
      console.warn('⚠️ UK seeding failed (may already exist):', error)
    }
  })
  
  describe('1. Fiscal Period Validation', () => {
    test('should allow posting to current period', async () => {
      const result = await validateFiscalPeriodForPosting(TEST_ORG_UAE, TEST_DATE)
      
      expect(result.isValid).toBe(true)
      expect(result.canPost).toBe(true)
      expect(result.period).toBeDefined()
      expect(result.period?.status).toMatch(/open|current/)
    })
    
    test('should reject posting to future periods', async () => {
      const futureDate = '2026-12-31'
      const result = await validateFiscalPeriodForPosting(TEST_ORG_UAE, futureDate)
      
      expect(result.canPost).toBe(false)
      expect(result.error).toContain('future period')
    })
    
    test('should create fiscal period automatically', async () => {
      const newDate = '2025-11-15'
      const result = await validateFiscalPeriodForPosting(TEST_ORG_UAE, newDate)
      
      expect(result.isValid).toBe(true)
      expect(result.period?.period_code).toBe('2025-11')
      expect(result.period?.fiscal_year).toBe('2025')
    })
  })
  
  describe('2. UAE Salon Expense Postings (5% VAT)', () => {
    test('should post salary expense correctly', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UAE,
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY,
        transaction_date: TEST_DATE,
        total_amount: 15000,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'MCP',
          note: 'October salary payment',
          category: 'Payroll'
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-SALARY-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UAE, ufe)
      
      expect(result.success).toBe(true)
      expect(result.transaction_id).toBeDefined()
      expect(result.gl_lines).toBeDefined()
      expect(result.gl_lines?.length).toBeGreaterThan(1)
      
      // Validate GL balancing
      const totalDebits = result.gl_lines?.reduce((sum, line) => sum + (line.debit_amount || 0), 0) || 0
      const totalCredits = result.gl_lines?.reduce((sum, line) => sum + (line.credit_amount || 0), 0) || 0
      expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01)
    })
    
    test('should post rent expense correctly', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UAE,
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.RENT,
        transaction_date: TEST_DATE,
        total_amount: 12500,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'BANK',
          note: 'October rent payment',
          category: 'Rent'
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-RENT-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UAE, ufe)
      
      expect(result.success).toBe(true)
      expect(result.transaction_id).toBeDefined()
      
      // Check that rent expense was debited
      const rentDebit = result.gl_lines?.find(line => line.debit_amount && line.description.toLowerCase().includes('rent'))
      expect(rentDebit).toBeDefined()
      expect(rentDebit?.debit_amount).toBe(12500)
    })
    
    test('should handle supplies expense with VAT', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UAE,
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SUPPLIES,
        transaction_date: TEST_DATE,
        total_amount: 2100, // Includes 5% VAT (2000 + 100)
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'MANUAL',
          note: 'Hair products purchase',
          category: 'Supplies',
          vat_inclusive: true
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-SUPPLIES-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UAE, ufe)
      
      expect(result.success).toBe(true)
      
      // Should have supplies expense (net), VAT recoverable (debit), and bank (credit)
      expect(result.gl_lines?.length).toBeGreaterThanOrEqual(3)
      
      // Check VAT calculation (5% of net amount)
      const vatLine = result.gl_lines?.find(line => line.description.toLowerCase().includes('vat'))
      expect(vatLine).toBeDefined()
      expect(vatLine?.debit_amount).toBeCloseTo(100, 2) // 2000 * 0.05
    })
  })
  
  describe('3. UK Salon Expense Postings (20% VAT)', () => {
    test('should post salary with PAYE/NI deductions', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UK,
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY,
        transaction_date: TEST_DATE,
        total_amount: 8000, // Net pay after deductions
        transaction_currency_code: 'GBP',
        base_currency_code: 'GBP',
        exchange_rate: 1.0,
        business_context: {
          channel: 'BANK',
          note: 'October payroll payment',
          category: 'Payroll'
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-UK-SALARY-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UK, ufe)
      
      expect(result.success).toBe(true)
      expect(result.transaction_id).toBeDefined()
      
      // UK salary posting should handle PAYE/NI complexity
      expect(result.gl_lines?.length).toBeGreaterThanOrEqual(2)
    })
    
    test('should handle utilities with reduced VAT rate', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UK,
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES,
        transaction_date: TEST_DATE,
        total_amount: 420, // £400 + £20 VAT (5% on utilities)
        transaction_currency_code: 'GBP',
        base_currency_code: 'GBP',
        exchange_rate: 1.0,
        business_context: {
          channel: 'BANK',
          note: 'Gas & electricity bill',
          category: 'Utilities',
          vat_inclusive: true
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-UK-UTILITIES-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UK, ufe)
      
      expect(result.success).toBe(true)
      
      // Should handle reduced VAT rate for utilities in UK
      const vatLine = result.gl_lines?.find(line => line.description.toLowerCase().includes('vat'))
      expect(vatLine).toBeDefined()
    })
  })
  
  describe('4. Revenue Postings with VAT', () => {
    test('should post service revenue with output VAT (UAE)', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UAE,
        transaction_type: FINANCE_TRANSACTION_TYPES.REVENUE,
        smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE,
        transaction_date: TEST_DATE,
        total_amount: 525, // AED 500 + AED 25 VAT
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'POS',
          note: 'Hair styling service',
          category: 'Service',
          vat_inclusive: true
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-SERVICE-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UAE, ufe)
      
      expect(result.success).toBe(true)
      
      // Should have cash/bank (debit), service revenue (credit), VAT payable (credit)
      expect(result.gl_lines?.length).toBeGreaterThanOrEqual(3)
      
      const vatPayable = result.gl_lines?.find(line => 
        line.credit_amount && line.description.toLowerCase().includes('vat')
      )
      expect(vatPayable).toBeDefined()
      expect(vatPayable?.credit_amount).toBeCloseTo(25, 2) // 500 * 0.05
    })
    
    test('should post product revenue with VAT (UK)', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UK,
        transaction_type: FINANCE_TRANSACTION_TYPES.REVENUE,
        smart_code: SALON_FINANCE_SMART_CODES.REVENUE.PRODUCT,
        transaction_date: TEST_DATE,
        total_amount: 120, // £100 + £20 VAT
        transaction_currency_code: 'GBP',
        base_currency_code: 'GBP',
        exchange_rate: 1.0,
        business_context: {
          channel: 'POS',
          note: 'Hair product sale',
          category: 'Product',
          vat_inclusive: true
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-UK-PRODUCT-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UK, ufe)
      
      expect(result.success).toBe(true)
      
      // Check 20% VAT calculation
      const vatPayable = result.gl_lines?.find(line => 
        line.credit_amount && line.description.toLowerCase().includes('vat')
      )
      expect(vatPayable).toBeDefined()
      expect(vatPayable?.credit_amount).toBeCloseTo(20, 2) // 100 * 0.20
    })
  })
  
  describe('5. POS End-of-Day Summary', () => {
    test('should process complete EOD summary with multiple components', async () => {
      const summary = createSamplePOSSummary(TEST_ORG_UAE, TEST_DATE)
      
      const result = await processPOSDailySummary(TEST_ORG_UAE, summary)
      
      expect(result.success).toBe(true)
      expect(result.summary_id).toBeDefined()
      expect(result.journal_entries.length).toBeGreaterThan(0)
      
      // Check main sales summary entry
      const salesEntry = result.journal_entries.find(entry => 
        entry.description.includes('Daily sales summary')
      )
      expect(salesEntry).toBeDefined()
      expect(salesEntry?.total_amount).toBeGreaterThan(0)
      
      // Check commission accruals
      expect(result.commission_accruals.length).toBeGreaterThan(0)
      
      // Verify totals calculation
      expect(result.totals.gross_sales).toBeGreaterThan(0)
      expect(result.totals.total_vat).toBeGreaterThan(0)
      expect(result.totals.total_commission).toBeGreaterThan(0)
    })
    
    test('should validate EOD summary data', async () => {
      const invalidSummary = createSamplePOSSummary(TEST_ORG_UAE, TEST_DATE)
      // Make payments not match sales (invalid)
      invalidSummary.payments.cash.collected = 1000
      invalidSummary.payments.cards.settlement = 1000 // Total 2000, but sales are 10000
      
      const result = await processPOSDailySummary(TEST_ORG_UAE, invalidSummary)
      
      expect(result.success).toBe(false)
      expect(result.validation_errors).toBeDefined()
      expect(result.validation_errors?.[0]).toContain('does not match')
    })
  })
  
  describe('6. Bank Operations', () => {
    test('should post bank fees correctly', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UAE,
        transaction_type: FINANCE_TRANSACTION_TYPES.BANK_FEE,
        smart_code: SALON_FINANCE_SMART_CODES.BANK.FEE,
        transaction_date: TEST_DATE,
        total_amount: 50,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'BANK',
          note: 'Monthly bank charges',
          category: 'BankFees'
        },
        metadata: {
          ingest_source: 'Test_Suite',
          original_ref: 'TEST-BANK-FEE-001'
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UAE, ufe)
      
      expect(result.success).toBe(true)
      
      // Should have bank charges (debit) and bank account (credit)
      expect(result.gl_lines?.length).toBe(2)
      
      const bankChargeDebit = result.gl_lines?.find(line => line.debit_amount)
      const bankCredit = result.gl_lines?.find(line => line.credit_amount)
      
      expect(bankChargeDebit?.debit_amount).toBe(50)
      expect(bankCredit?.credit_amount).toBe(50)
    })
  })
  
  describe('7. MCP Natural Language Processing', () => {
    test('should parse salary payment correctly', async () => {
      const description = "Paid stylist salary AED 15,000 from Emirates NBD on 2025-10-05"
      const parsed = FinanceEventParser.parseDescription(description)
      
      expect(parsed.operation_type).toBe('expense')
      expect(parsed.amount).toBe(15000)
      expect(parsed.currency).toBe('AED')
      expect(parsed.date).toBe('2025-10-05')
      expect(parsed.category).toBe('SALARY')
      expect(parsed.smart_code).toBe(SALON_FINANCE_SMART_CODES.EXPENSE.SALARY)
    })
    
    test('should parse commission payment', async () => {
      const description = "Commission payment AED 3,500 to Sarah (October)"
      const parsed = FinanceEventParser.parseDescription(description)
      
      expect(parsed.operation_type).toBe('expense')
      expect(parsed.amount).toBe(3500)
      expect(parsed.currency).toBe('AED')
      expect(parsed.category).toBe('COMMISSION')
      expect(parsed.date).toContain('2025-10') // October of current year
    })
    
    test('should parse EOD summary', async () => {
      const description = "Post EOD POS summary for Downtown branch AED 8,500"
      const parsed = FinanceEventParser.parseDescription(description)
      
      expect(parsed.operation_type).toBe('pos_eod')
      expect(parsed.amount).toBe(8500)
      expect(parsed.category).toBe('DAILY_SUMMARY')
      expect(parsed.channel).toBe('POS')
    })
    
    test('should parse utilities with VAT', async () => {
      const description = "DEWA electricity bill AED 850 paid via bank transfer"
      const parsed = FinanceEventParser.parseDescription(description)
      
      expect(parsed.operation_type).toBe('expense')
      expect(parsed.amount).toBe(850)
      expect(parsed.category).toBe('UTILITIES')
      expect(parsed.smart_code).toBe(SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES)
    })
    
    test('should handle MCP full posting flow (dry run)', async () => {
      const result = await postFinanceEvent({
        organization_id: TEST_ORG_UAE,
        description: "Record rent AED 12,500 (Oct)",
        dry_run: true
      })
      
      expect(result.success).toBe(true)
      expect(result.dry_run).toBe(true)
      expect(result.parsed_info.amount).toBe(12500)
      expect(result.parsed_info.category).toBe('RENT')
      expect(result.generated_ufe).toBeDefined()
      expect(result.generated_ufe.smart_code).toBe(SALON_FINANCE_SMART_CODES.EXPENSE.RENT)
    })
  })
  
  describe('8. Error Handling and Validation', () => {
    test('should reject UFE with missing organization ID', async () => {
      const invalidUFE = {
        organization_id: '', // Invalid
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY,
        transaction_date: TEST_DATE,
        total_amount: 15000,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: { channel: 'MCP' as const, note: 'Test' },
        metadata: { ingest_source: 'Test' },
        lines: []
      } as UniversalFinanceEvent
      
      const result = await processUniversalFinanceEvent('invalid-org', invalidUFE)
      
      expect(result.success).toBe(false)
      expect(result.validation_errors).toBeDefined()
    })
    
    test('should reject UFE with non-empty lines array', async () => {
      const invalidUFE: UniversalFinanceEvent = {
        organization_id: TEST_ORG_UAE,
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY,
        transaction_date: TEST_DATE,
        total_amount: 15000,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: { channel: 'MCP', note: 'Test' },
        metadata: { ingest_source: 'Test' },
        lines: [{ some: 'invalid_line' }] as any // Should be empty
      }
      
      const result = await processUniversalFinanceEvent(TEST_ORG_UAE, invalidUFE)
      
      expect(result.success).toBe(false)
      expect(result.validation_errors).toContain('Lines array must be empty')
    })
    
    test('should reject posting to organization without rules', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: 'non-existent-org-uuid',
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY,
        transaction_date: TEST_DATE,
        total_amount: 15000,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: { channel: 'MCP', note: 'Test' },
        metadata: { ingest_source: 'Test' },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent('non-existent-org-uuid', ufe)
      
      expect(result.success).toBe(false)
      expect(result.posting_errors).toContain('Missing posting configuration')
    })
    
    test('should handle unknown smart code gracefully', async () => {
      const result = await postFinanceEvent({
        organization_id: TEST_ORG_UAE,
        description: "Some unknown operation XYZ 9999"
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Could not determine the type of finance operation')
      expect(result.suggestions).toBeDefined()
    })
  })
  
  describe('9. GL Balancing Validation', () => {
    test('should ensure all journal entries are balanced', async () => {
      const testCases = [
        { smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY, amount: 15000 },
        { smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.RENT, amount: 12500 },
        { smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES, amount: 850 },
        { smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE, amount: 525 },
        { smart_code: SALON_FINANCE_SMART_CODES.BANK.FEE, amount: 50 }
      ]
      
      for (const testCase of testCases) {
        const ufe: UniversalFinanceEvent = {
          organization_id: TEST_ORG_UAE,
          transaction_type: testCase.smart_code.includes('REVENUE') ? FINANCE_TRANSACTION_TYPES.REVENUE : 
                           testCase.smart_code.includes('BANK') ? FINANCE_TRANSACTION_TYPES.BANK_FEE :
                           FINANCE_TRANSACTION_TYPES.EXPENSE,
          smart_code: testCase.smart_code,
          transaction_date: TEST_DATE,
          total_amount: testCase.amount,
          transaction_currency_code: 'AED',
          base_currency_code: 'AED',
          exchange_rate: 1.0,
          business_context: { channel: 'MCP', note: `Test ${testCase.smart_code}` },
          metadata: { ingest_source: 'Balance_Test' },
          lines: []
        }
        
        const result = await processUniversalFinanceEvent(TEST_ORG_UAE, ufe)
        
        expect(result.success).toBe(true)
        
        if (result.gl_lines) {
          const totalDebits = result.gl_lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
          const totalCredits = result.gl_lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
          const difference = Math.abs(totalDebits - totalCredits)
          
          expect(difference).toBeLessThan(0.01) // Allow for rounding differences
        }
      }
    })
  })
  
  afterAll(async () => {
    console.log('🧹 Cleaning up MDA test environment...')
    // In a real test environment, you might want to clean up test data
    // For this demo, we'll leave the test data in place
  })
})

/**
 * Performance benchmarks for MDA system
 */
describe('MDA Performance Benchmarks', () => {
  test('should process expense posting within 500ms', async () => {
    const start = Date.now()
    
    const ufe: UniversalFinanceEvent = {
      organization_id: 'test-salon-uae-uuid',
      transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
      smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY,
      transaction_date: '2025-10-05',
      total_amount: 15000,
      transaction_currency_code: 'AED',
      base_currency_code: 'AED',
      exchange_rate: 1.0,
      business_context: { channel: 'MCP', note: 'Performance test' },
      metadata: { ingest_source: 'Performance_Test' },
      lines: []
    }
    
    const result = await processUniversalFinanceEvent('test-salon-uae-uuid', ufe)
    const duration = Date.now() - start
    
    expect(result.success).toBe(true)
    expect(duration).toBeLessThan(500) // Should complete within 500ms
  })
  
  test('should process EOD summary within 2 seconds', async () => {
    const start = Date.now()
    
    const summary = createSamplePOSSummary('test-salon-uae-uuid', '2025-10-05')
    const result = await processPOSDailySummary('test-salon-uae-uuid', summary)
    
    const duration = Date.now() - start
    
    expect(result.success).toBe(true)
    expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
  })
})