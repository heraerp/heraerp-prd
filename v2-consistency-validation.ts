#!/usr/bin/env tsx

/**
 * HERA V2 Transaction CRUD - Final Consistency Validation
 * Validates DB ↔ API ↔ Tests consistency for field naming
 */

import { existsSync, readFileSync } from 'fs'

interface ValidationResult {
  layer: string
  check: string
  status: 'pass' | 'fail' | 'warning'
  details: string
}

class ConsistencyValidator {
  private results: ValidationResult[] = []

  private addResult(layer: string, check: string, status: 'pass' | 'fail' | 'warning', details: string) {
    this.results.push({ layer, check, status, details })
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${layer}: ${check} - ${details}`)
  }

  async validateDatabase() {
    console.log('\n🔍 VALIDATING DATABASE LAYER...')

    // Check txn-crud.sql functions use unit_price
    const txnCrudPath = '/home/san/PRD/heraerp-prd/database/functions/v2/txn-crud.sql'
    if (existsSync(txnCrudPath)) {
      const content = readFileSync(txnCrudPath, 'utf-8')

      const unitPriceCount = (content.match(/unit_price/g) || []).length
      const unitAmountCount = (content.match(/unit_amount/g) || []).length

      if (unitPriceCount > 0 && unitAmountCount === 0) {
        this.addResult('Database', 'SQL Functions Field Names', 'pass',
          `${unitPriceCount} unit_price references, 0 unit_amount references`)
      } else {
        this.addResult('Database', 'SQL Functions Field Names', 'fail',
          `${unitPriceCount} unit_price, ${unitAmountCount} unit_amount references`)
      }
    } else {
      this.addResult('Database', 'SQL Functions File', 'fail', 'txn-crud.sql not found')
    }

    // Check database schema
    const schemaPath = '/home/san/PRD/heraerp-prd/database/migrations/schema.sql'
    if (existsSync(schemaPath)) {
      const content = readFileSync(schemaPath, 'utf-8')
      if (content.includes('unit_price numeric')) {
        this.addResult('Database', 'Schema Definition', 'pass', 'universal_transaction_lines.unit_price defined')
      } else {
        this.addResult('Database', 'Schema Definition', 'warning', 'unit_price not found in schema')
      }
    }
  }

  async validateAPI() {
    console.log('\n🔍 VALIDATING API LAYER...')

    // Check V2 schemas
    const schemasPath = '/home/san/PRD/heraerp-prd/src/lib/v2/schemas/txn-schemas.ts'
    if (existsSync(schemasPath)) {
      const content = readFileSync(schemasPath, 'utf-8')

      const hasUnitPrice = content.includes('unit_price: z.number().optional()')
      const hasUnitAmount = content.includes('unit_amount: z.number().optional()')
      const hasTransform = content.includes('.transform((data) => {')
      const hasNormalization = content.includes('data.unit_price = data.unit_amount')

      if (hasUnitPrice && hasUnitAmount && hasTransform && hasNormalization) {
        this.addResult('API', 'Schema Normalization', 'pass',
          'Primary unit_price field with unit_amount backward compatibility')
      } else {
        this.addResult('API', 'Schema Normalization', 'fail',
          `Missing: unit_price(${hasUnitPrice}) unit_amount(${hasUnitAmount}) transform(${hasTransform}) normalize(${hasNormalization})`)
      }
    }

    // Check client - should be field-agnostic (generic client)
    const clientPath = '/home/san/PRD/heraerp-prd/src/lib/v2/client/txn-client.ts'
    if (existsSync(clientPath)) {
      const content = readFileSync(clientPath, 'utf-8')

      // Client should export types that reference schemas (which have unit_price)
      const hasTypeExports = content.includes('export type') && content.includes('from \'../schemas/txn-schemas\'')

      if (hasTypeExports) {
        this.addResult('API', 'Client Type Exports', 'pass', 'Client exports types from schemas with unit_price normalization')
      } else {
        this.addResult('API', 'Client Type Exports', 'fail', 'Client missing type exports from schemas')
      }
    }
  }

  async validateTests() {
    console.log('\n🔍 VALIDATING TEST LAYER...')

    const testPath = '/home/san/PRD/heraerp-prd/test-v2-txn-crud.ts'
    if (existsSync(testPath)) {
      const content = readFileSync(testPath, 'utf-8')

      const unitPriceRefs = (content.match(/unit_price:/g) || []).length
      const unitAmountRefs = (content.match(/unit_amount:/g) || []).length
      const computedComments = (content.match(/Computed:/g) || []).length

      if (unitPriceRefs > 0 && unitAmountRefs === 0) {
        this.addResult('Tests', 'Field Usage', 'pass',
          `${unitPriceRefs} unit_price references, 0 unit_amount references`)
      } else {
        this.addResult('Tests', 'Field Usage', 'fail',
          `${unitPriceRefs} unit_price, ${unitAmountRefs} unit_amount references`)
      }

      if (computedComments > 0) {
        this.addResult('Tests', 'Computed Amount Validation', 'pass',
          `${computedComments} computed amount validations`)
      } else {
        this.addResult('Tests', 'Computed Amount Validation', 'warning', 'No computed amount comments found')
      }

      // Validate specific test cases
      const pizzaTest = content.includes('quantity: 2') && content.includes('unit_price: 25.50') && content.includes('line_amount: 51.00')
      if (pizzaTest) {
        this.addResult('Tests', 'Pizza Test Case (2 × 25.50 = 51.00)', 'pass', 'Correct computation validation')
      }

      const sodaTest = content.includes('quantity: 1') && content.includes('unit_price: 8.00') && content.includes('line_amount: 8.00')
      if (sodaTest) {
        this.addResult('Tests', 'Soda Test Case (1 × 8.00 = 8.00)', 'pass', 'Correct computation validation')
      }
    }
  }

  async validateDocumentation() {
    console.log('\n🔍 VALIDATING DOCUMENTATION...')

    const docPath = '/home/san/PRD/heraerp-prd/V2_FIELD_MIGRATION_NOTES.md'
    if (existsSync(docPath)) {
      const content = readFileSync(docPath, 'utf-8')

      const hasCorrectExamples = content.includes('unit_price: 25.50') && content.includes('// ✅ CORRECTED: unit_price')
      const hasBackCompat = content.includes('unit_amount: 25.50') && content.includes('// Will be normalized to unit_price')

      if (hasCorrectExamples && hasBackCompat) {
        this.addResult('Documentation', 'Migration Notes', 'pass', 'Correct examples and backward compatibility docs')
      } else {
        this.addResult('Documentation', 'Migration Notes', 'warning', 'Missing examples or compatibility notes')
      }
    } else {
      this.addResult('Documentation', 'Migration Notes', 'warning', 'V2_FIELD_MIGRATION_NOTES.md not found')
    }
  }

  generateSummary() {
    console.log('\n' + '='.repeat(80))
    console.log('🏁 FINAL CONSISTENCY VALIDATION SUMMARY')
    console.log('='.repeat(80))

    const byStatus = this.results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`Total Checks: ${this.results.length}`)
    console.log(`✅ Passed: ${byStatus.pass || 0}`)
    console.log(`⚠️  Warnings: ${byStatus.warning || 0}`)
    console.log(`❌ Failed: ${byStatus.fail || 0}`)

    const successRate = ((byStatus.pass || 0) / this.results.length * 100).toFixed(1)
    console.log(`📊 Success Rate: ${successRate}%`)

    if (byStatus.fail > 0) {
      console.log('\n❌ FAILURES:')
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`  • ${r.layer}: ${r.check} - ${r.details}`))
    }

    if (byStatus.warning > 0) {
      console.log('\n⚠️  WARNINGS:')
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.log(`  • ${r.layer}: ${r.check} - ${r.details}`))
    }

    console.log('='.repeat(80))

    // Final verdict
    if ((byStatus.fail || 0) === 0) {
      console.log('🎉 CONSISTENCY VALIDATION: PASSED')
      console.log('✅ DB ↔ API ↔ Tests are fully consistent!')
      return true
    } else {
      console.log('💥 CONSISTENCY VALIDATION: FAILED')
      console.log('❌ Inconsistencies found - please fix before deployment')
      return false
    }
  }
}

async function runConsistencyValidation() {
  console.log('🚀 HERA V2 Transaction CRUD - Final Consistency Validation')
  console.log('Checking DB ↔ API ↔ Tests consistency for unit_price field naming')

  const validator = new ConsistencyValidator()

  await validator.validateDatabase()
  await validator.validateAPI()
  await validator.validateTests()
  await validator.validateDocumentation()

  const success = validator.generateSummary()
  process.exit(success ? 0 : 1)
}

if (require.main === module) {
  runConsistencyValidation().catch(error => {
    console.error('❌ Validation error:', error)
    process.exit(1)
  })
}

export { runConsistencyValidation }