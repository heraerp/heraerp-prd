/**
 * HERA Guardrails - Sacred Rules Enforcement
 * Smart Code: HERA.CORE.GUARDRAILS.VALIDATOR.V1
 */

export const SACRED_TABLES = [
  'core_organizations',
  'core_entities',
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
] as const

export type SacredTable = (typeof SACRED_TABLES)[number]

export const SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[vV][0-9]+$/

// Import from canonical location
import type { GuardrailViolation, GuardrailSeverity } from '@/lib/universal/guardrails'

export interface GuardrailResult {
  passed: boolean
  violations: GuardrailViolation[]
  autoFixes?: string[]
}

export class HERAGuardrails {
  /**
   * Validate Smart Code format
   */
  static validateSmartCode(code: string): GuardrailResult {
    const violations: GuardrailViolation[] = []

    if (!code) {
      violations.push({
        code: 'SMART_CODE_REQUIRED.V1',
        message: 'Smart code is required for all HERA entities',
        severity: 'error'
      })
    } else if (!SMART_CODE_PATTERN.test(code)) {
      violations.push({
        code: 'SMART_CODE_INVALID_FORMAT.V1',
        message: `Smart code '${code}' does not match required pattern: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}`,
        severity: 'error'
      })
    }

    return {
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate multi-tenancy requirements
   */
  static validateMultiTenancy(data: any, organizationId?: string): GuardrailResult {
    const violations: GuardrailViolation[] = []

    if (!organizationId) {
      violations.push({
        code: 'ORG_ID_REQUIRED.V1',
        message: 'organization_id is required for multi-tenant isolation',
        severity: 'error'
      })
    }

    if (data && typeof data === 'object') {
      if (!data.organization_id && organizationId) {
        // Auto-fix: add organization_id
        data.organization_id = organizationId
        violations.push({
          code: 'ORG_ID_AUTO_ADDED.V1',
          message: 'organization_id automatically added to maintain isolation',
          severity: 'warn'
        })
      } else if (data.organization_id && data.organization_id !== organizationId) {
        violations.push({
          code: 'ORG_ID_MISMATCH.V1',
          message: 'Data organization_id does not match context organization_id',
          severity: 'error'
        })
      }
    }

    return {
      passed: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations,
      autoFixes: violations.filter(v => v.code === 'ORG_ID_AUTO_ADDED').map(v => v.code)
    }
  }

  /**
   * Validate Sacred Six table usage
   */
  static validateSacredTables(tableName: string): GuardrailResult {
    const violations: GuardrailViolation[] = []

    if (!SACRED_TABLES.includes(tableName as SacredTable)) {
      violations.push({
        code: 'SACRED_TABLE_VIOLATION.V1',
        message: `Table '${tableName}' is not one of the Sacred Six. Use only: ${SACRED_TABLES.join(', ')}`,
        severity: 'error'
      })
    }

    return {
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate GL balance for journal entries
   */
  static validateGLBalance(lines: any[]): GuardrailResult {
    const violations: GuardrailViolation[] = []

    if (!lines || !Array.isArray(lines)) {
      return { passed: true, violations: [] }
    }

    // Group by currency and sum amounts
    const balances = new Map<string, number>()

    lines.forEach((line, index) => {
      if (line.line_type === 'GL') {
        const currency = line.line_data?.currency || 'USD'
        const amount = line.line_amount || 0

        balances.set(currency, (balances.get(currency) || 0) + amount)
      }
    })

    // Check each currency balance
    balances.forEach((balance, currency) => {
      if (Math.abs(balance) >= 0.01) {
        // Allow for rounding errors
        violations.push({
          code: 'GL_UNBALANCED.V1',
          message: `GL entries not balanced for ${currency}: ${balance.toFixed(2)} difference`,
          severity: 'error',
          context: { currency, balance }
        })
      }
    })

    return {
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate transaction structure
   */
  static validateTransaction(transaction: any): GuardrailResult {
    const violations: GuardrailViolation[] = []

    // Check required fields
    const requiredFields = ['transaction_type', 'smart_code']
    requiredFields.forEach(field => {
      if (!transaction[field]) {
        violations.push({
          code: 'REQUIRED_FIELD_MISSING.V1',
          message: `Required field '${field}' is missing`,
          severity: 'error'
        })
      }
    })

    // Validate smart code
    if (transaction.smart_code) {
      const smartCodeResult = this.validateSmartCode(transaction.smart_code)
      violations.push(...smartCodeResult.violations)
    }

    // Validate lines if present
    if (transaction.lines && Array.isArray(transaction.lines)) {
      transaction.lines.forEach((line: any, index: number) => {
        if (!line.smart_code) {
          violations.push({
            code: 'LINE_SMART_CODE_MISSING.V1',
            message: `Transaction line ${index + 1} missing smart_code`,
            severity: 'error'
          })
        } else {
          const lineSmartCodeResult = this.validateSmartCode(line.smart_code)
          violations.push(
            ...lineSmartCodeResult.violations.map(v => ({
              ...v,
              message: `Line ${index + 1}: ${v.message}`
            }))
          )
        }

        if (typeof line.line_amount !== 'number') {
          violations.push({
            code: 'LINE_AMOUNT_INVALID.V1',
            message: `Transaction line ${index + 1} has invalid line_amount`,
            severity: 'error'
          })
        }
      })

      // Check GL balance
      const glBalanceResult = this.validateGLBalance(transaction.lines)
      violations.push(...glBalanceResult.violations)
    }

    return {
      passed: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    }
  }

  /**
   * Comprehensive validation for CLI operations
   */
  static validateCLIOperation(params: {
    operation: 'create' | 'read' | 'update' | 'delete'
    table: string
    data?: any
    organizationId?: string
  }): GuardrailResult {
    const { operation, table, data, organizationId } = params
    const allViolations: GuardrailViolation[] = []

    // Validate Sacred Six
    const tableResult = this.validateSacredTables(table)
    allViolations.push(...tableResult.violations)

    // Validate multi-tenancy
    if (data || organizationId) {
      const multiTenantResult = this.validateMultiTenancy(data, organizationId)
      allViolations.push(...multiTenantResult.violations)
    }

    // Validate transaction structure if applicable
    if (table === 'universal_transactions' && data) {
      const transactionResult = this.validateTransaction(data)
      allViolations.push(...transactionResult.violations)
    }

    // Validate entity smart codes
    if (table === 'core_entities' && data?.smart_code) {
      const smartCodeResult = this.validateSmartCode(data.smart_code)
      allViolations.push(...smartCodeResult.violations)
    }

    return {
      passed: allViolations.filter(v => v.severity === 'ERROR').length === 0,
      violations: allViolations
    }
  }

  /**
   * Generate guardrail report
   */
  static generateReport(results: GuardrailResult[]): string {
    const allViolations = results.flatMap(r => r.violations)
    const errors = allViolations.filter(v => v.severity === 'ERROR')
    const warnings = allViolations.filter(v => v.severity === 'WARNING')

    let report = '🛡️ HERA Guardrails Report\n'
    report += '='.repeat(50) + '\n\n'

    if (errors.length === 0 && warnings.length === 0) {
      report += '✅ All guardrails passed!\n'
    } else {
      if (errors.length > 0) {
        report += `❌ ${errors.length} ERRORS:\n`
        errors.forEach((error, i) => {
          report += `  ${i + 1}. [${error.code}] ${error.message}\n`
        })
        report += '\n'
      }

      if (warnings.length > 0) {
        report += `⚠️  ${warnings.length} WARNINGS:\n`
        warnings.forEach((warning, i) => {
          report += `  ${i + 1}. [${warning.code}] ${warning.message}\n`
        })
        report += '\n'
      }
    }

    report += `Summary: ${errors.length} errors, ${warnings.length} warnings\n`
    report += `Status: ${errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}\n`

    return report
  }
}

// CLI Exit codes
export const CLI_EXIT_CODES = {
  SUCCESS: 0,

  // Init command
  CONNECTION_FAILURE: 10,
  SACRED_TABLES_MISSING: 11,
  ORG_NOT_FOUND: 12,
  GUARDRAILS_UNAVAILABLE: 13,

  // Smart code command
  SMART_CODE_INVALID: 20,
  SMART_CODE_DEPRECATED: 21,

  // Transaction command
  ORG_ID_MISSING: 30,
  SMART_CODE_VIOLATION: 31,
  GL_UNBALANCED: 32,
  SCHEMA_VIOLATION: 33
} as const

export type CLIExitCode = (typeof CLI_EXIT_CODES)[keyof typeof CLI_EXIT_CODES]
