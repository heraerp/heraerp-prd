/**
 * HERA MDA Smoke Test Script
 * 
 * Quick smoke tests to verify the MDA system is working correctly.
 * Can be run manually or as part of CI/CD pipeline.
 * 
 * Usage:
 * node tests/finance/smoke-test.ts <organization_id>
 */

import { UniversalFinanceEvent, SALON_FINANCE_SMART_CODES, FINANCE_TRANSACTION_TYPES } from '../../src/types/universal-finance-event'
import { processUniversalFinanceEvent } from '../../src/server/finance/autoPostingEngine'
import { processPOSDailySummary, createSamplePOSSummary } from '../../src/server/finance/posEodService'
import { validateFiscalPeriodForPosting } from '../../src/server/finance/fiscalPeriodService'
import { postFinanceEvent } from '../../mcp/skills/finance/post_finance_event'

interface SmokeTestResult {
  test_name: string
  success: boolean
  duration_ms: number
  error?: string
  details?: any
}

class MDAokeTest {
  private organizationId: string
  private results: SmokeTestResult[] = []
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
  }
  
  async runAllTests(): Promise<void> {
    console.log(`🔍 Starting HERA MDA Smoke Tests for org: ${this.organizationId}`)
    console.log('=' .repeat(60))
    
    await this.testFiscalPeriodValidation()
    await this.testExpensePosting()
    await this.testRevenuePosting()
    await this.testPOSEODProcessing()
    await this.testMCPNaturalLanguage()
    await this.testAPIEndpoint()
    
    this.printSummary()
  }
  
  private async runTest(testName: string, testFn: () => Promise<any>): Promise<SmokeTestResult> {
    const start = Date.now()
    
    try {
      console.log(`\n🧪 ${testName}...`)
      const result = await testFn()
      const duration = Date.now() - start
      
      const testResult: SmokeTestResult = {
        test_name: testName,
        success: true,
        duration_ms: duration,
        details: result
      }
      
      console.log(`   ✅ PASS (${duration}ms)`)
      this.results.push(testResult)
      return testResult
      
    } catch (error) {
      const duration = Date.now() - start
      
      const testResult: SmokeTestResult = {
        test_name: testName,
        success: false,
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      
      console.log(`   ❌ FAIL (${duration}ms): ${testResult.error}`)
      this.results.push(testResult)
      return testResult
    }
  }
  
  async testFiscalPeriodValidation(): Promise<void> {
    await this.runTest('Fiscal Period Validation', async () => {
      const testDate = new Date().toISOString().split('T')[0]
      const result = await validateFiscalPeriodForPosting(this.organizationId, testDate)
      
      if (!result.isValid || !result.canPost) {
        throw new Error(`Fiscal period validation failed: ${result.error}`)
      }
      
      return {
        period_code: result.period?.period_code,
        fiscal_year: result.period?.fiscal_year,
        status: result.period?.status
      }
    })
  }
  
  async testExpensePosting(): Promise<void> {
    await this.runTest('Expense Posting (Salary)', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: this.organizationId,
        transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
        smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY,
        transaction_date: new Date().toISOString().split('T')[0],
        total_amount: 10000,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'MCP',
          note: 'Smoke test salary posting'
        },
        metadata: {
          ingest_source: 'Smoke_Test',
          original_ref: `SMOKE-${Date.now()}`
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(this.organizationId, ufe)
      
      if (!result.success) {
        throw new Error(`Expense posting failed: ${result.message || 'Unknown error'}`)
      }
      
      // Validate GL balancing
      const totalDebits = result.gl_lines?.reduce((sum, line) => sum + (line.debit_amount || 0), 0) || 0
      const totalCredits = result.gl_lines?.reduce((sum, line) => sum + (line.credit_amount || 0), 0) || 0
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`GL not balanced: Debits ${totalDebits}, Credits ${totalCredits}`)
      }
      
      return {
        transaction_id: result.transaction_id,
        posting_period: result.posting_period,
        gl_lines_count: result.gl_lines?.length,
        total_debits: totalDebits,
        total_credits: totalCredits
      }
    })
  }
  
  async testRevenuePosting(): Promise<void> {
    await this.runTest('Revenue Posting (Service)', async () => {
      const ufe: UniversalFinanceEvent = {
        organization_id: this.organizationId,
        transaction_type: FINANCE_TRANSACTION_TYPES.REVENUE,
        smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE,
        transaction_date: new Date().toISOString().split('T')[0],
        total_amount: 525, // Includes VAT
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'POS',
          note: 'Smoke test service revenue',
          vat_inclusive: true
        },
        metadata: {
          ingest_source: 'Smoke_Test',
          original_ref: `SMOKE-REV-${Date.now()}`
        },
        lines: []
      }
      
      const result = await processUniversalFinanceEvent(this.organizationId, ufe)
      
      if (!result.success) {
        throw new Error(`Revenue posting failed: ${result.message || 'Unknown error'}`)
      }
      
      return {
        transaction_id: result.transaction_id,
        posting_period: result.posting_period,
        gl_lines_count: result.gl_lines?.length
      }
    })
  }
  
  async testPOSEODProcessing(): Promise<void> {
    await this.runTest('POS EOD Summary Processing', async () => {
      const summary = createSamplePOSSummary(this.organizationId)
      
      // Reduce amounts for smoke test
      summary.sales.services.gross_amount = 1000
      summary.sales.services.net_amount = 952.38
      summary.sales.services.vat_amount = 47.62
      summary.sales.products.gross_amount = 200
      summary.sales.products.net_amount = 190.48
      summary.sales.products.vat_amount = 9.52
      summary.payments.cash.collected = 400
      summary.payments.cards.settlement = 800
      summary.payments.cards.processing_fees = 12
      
      // Reduce staff commission amounts
      if (summary.staff) {
        summary.staff[0].services_revenue = 600
        summary.staff[0].commission_amount = 90
        summary.staff[1].services_revenue = 400
        summary.staff[1].commission_amount = 60
      }
      
      const result = await processPOSDailySummary(this.organizationId, summary)
      
      if (!result.success) {
        throw new Error(`POS EOD processing failed: ${result.message || 'Unknown error'}`)
      }
      
      return {
        summary_id: result.summary_id,
        journal_entries_count: result.journal_entries.length,
        commission_accruals_count: result.commission_accruals.length,
        gross_sales: result.totals.gross_sales,
        total_vat: result.totals.total_vat
      }
    })
  }
  
  async testMCPNaturalLanguage(): Promise<void> {
    await this.runTest('MCP Natural Language Processing', async () => {
      const testDescriptions = [
        "Paid staff salary AED 5,000 from bank",
        "Commission payment AED 800 to stylist",
        "Rent expense AED 6,000 for October",
        "Hair product supplies AED 1,200 with VAT"
      ]
      
      const results = []
      
      for (const description of testDescriptions) {
        const result = await postFinanceEvent({
          organization_id: this.organizationId,
          description,
          dry_run: true // Don't actually post during smoke test
        })
        
        if (!result.success) {
          throw new Error(`MCP parsing failed for "${description}": ${result.error}`)
        }
        
        results.push({
          description,
          parsed_amount: result.parsed_info?.amount,
          parsed_category: result.parsed_info?.category,
          smart_code: result.parsed_info?.smart_code
        })
      }
      
      return { parsed_descriptions: results }
    })
  }
  
  async testAPIEndpoint(): Promise<void> {
    await this.runTest('API v2 Endpoint', async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v2/transactions/post`
      
      const ufe: UniversalFinanceEvent = {
        organization_id: this.organizationId,
        transaction_type: FINANCE_TRANSACTION_TYPES.BANK_FEE,
        smart_code: SALON_FINANCE_SMART_CODES.BANK.FEE,
        transaction_date: new Date().toISOString().split('T')[0],
        total_amount: 25,
        transaction_currency_code: 'AED',
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        business_context: {
          channel: 'BANK',
          note: 'Smoke test bank fee'
        },
        metadata: {
          ingest_source: 'Smoke_Test_API',
          original_ref: `SMOKE-API-${Date.now()}`
        },
        lines: []
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hera-api-version': 'v2',
          'Authorization': 'Bearer demo-token-salon-manager'
        },
        body: JSON.stringify({ apiVersion: 'v2', ...ufe })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API call failed (${response.status}): ${errorText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(`API processing failed: ${result.error?.message}`)
      }
      
      return {
        api_status: response.status,
        transaction_id: result.data?.transaction_id,
        processing_time_ms: result.metadata?.processing_time_ms
      }
    })
  }
  
  private printSummary(): void {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    const totalTime = this.results.reduce((sum, r) => sum + r.duration_ms, 0)
    
    console.log('\n' + '='.repeat(60))
    console.log('🏁 HERA MDA Smoke Test Summary')
    console.log('='.repeat(60))
    console.log(`Organization: ${this.organizationId}`)
    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`⏱️  Total Time: ${totalTime}ms`)
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:')
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.test_name}: ${result.error}`)
      })
    }
    
    console.log('\n📊 Performance:')
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`   ${status} ${result.test_name}: ${result.duration_ms}ms`)
    })
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! MDA system is working correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.')
      process.exit(1)
    }
  }
}

// Main execution
async function main() {
  const organizationId = process.argv[2]
  
  if (!organizationId) {
    console.error('❌ Usage: node smoke-test.ts <organization_id>')
    console.error('Example: node smoke-test.ts demo-salon-org-uuid')
    process.exit(1)
  }
  
  const smokeTest = new MDASmokeTest(organizationId)
  await smokeTest.runAllTests()
}

// Export for testing
export { MDASmokeTest }

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Smoke test failed with error:', error)
    process.exit(1)
  })
}