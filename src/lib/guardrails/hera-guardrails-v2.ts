/**
 * HERA Guardrails v2 - Enhanced Sacred Rules Enforcement
 * Smart Code: HERA.ACCOUNTING.GUARDRAIL.VALIDATOR.v2
 *
 * Enhanced guardrails with fiscal period validation, AI confidence checks,
 * and integration with PostgreSQL views for real-time validation.
 */

import {
  HERAGuardrails,
  GuardrailResult,
  GuardrailViolation,
  SACRED_TABLES
} from './hera-guardrails'

// Enhanced Smart Code Pattern for v2
export const SMART_CODE_V2_PATTERN =
  /^HERA\.ACCOUNTING\.[A-Z0-9]{2,10}(?:\.[A-Z0-9_]{2,15}){2,6}\.v2$/
export const SMART_CODE_V1_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[vV]1$/

// v2-specific validation rules
export interface GuardrailRuleV2 {
  rule_id: string
  rule_version: 'v2'
  description: string
  severity: 'ERROR' | 'WARNING' | 'INFO'
  validation_logic: {
    check: string
    error_message: string
    auto_fix?: boolean
    bypass_roles?: string[]
  }
  integration?: {
    database_function?: string
    view_lookup?: string
    cache_ttl?: number
    real_time?: boolean
  }
  workflow?: {
    auto_approve?: string
    require_manager?: string
    require_owner?: string
    auto_reject?: string
  }
}

// AI Confidence thresholds
export interface AIConfidenceConfig {
  auto_approve_threshold: number
  require_approval_threshold: number
  reject_threshold: number
  learning_enabled: boolean
}

// Fiscal period status
export interface FiscalPeriodStatus {
  period_code: string
  period_name: string
  status: 'OPEN' | 'CLOSED' | 'LOCKED'
  fiscal_year: string
  start_date: string
  end_date: string
}

export class HERAGuardrailsV2 extends HERAGuardrails {
  private static aiConfig: AIConfidenceConfig = {
    auto_approve_threshold: 0.8,
    require_approval_threshold: 0.7,
    reject_threshold: 0.3,
    learning_enabled: true
  }

  /**
   * Enhanced Smart Code validation for v2
   */
  static validateSmartCodeV2(code: string): GuardrailResult {
    const violations: GuardrailViolation[] = []

    if (!code) {
      violations.push({
        code: 'SMART_CODE_REQUIRED',
        message: 'Smart code is required for all HERA entities',
        severity: 'ERROR'
      })
      return { passed: false, violations }
    }

    // Determine version and validate accordingly
    const version = this.getSmartCodeVersion(code)

    if (version === 'v2') {
      if (!SMART_CODE_V2_PATTERN.test(code)) {
        violations.push({
          code: 'SMART-CODE-V2-FORMAT',
          message: `Smart code '${code}' does not match v2 pattern: HERA.ACCOUNTING.{MODULE}.{TYPE}.{SUBTYPE}.v2`,
          severity: 'ERROR',
          context: {
            expected_pattern: 'HERA.ACCOUNTING.{MODULE}.{TYPE}.{SUBTYPE}.v2',
            examples: [
              'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
              'HERA.ACCOUNTING.AR.RULE.REVENUE_RECOGNITION.v2'
            ]
          }
        })
      }
    } else if (version === 'v1') {
      // Still validate v1 codes for backward compatibility
      const v1Result = super.validateSmartCode(code)
      violations.push(...v1Result.violations)
    } else {
      violations.push({
        code: 'SMART_CODE_VERSION_UNKNOWN',
        message: `Smart code '${code}' does not match any known version pattern`,
        severity: 'ERROR'
      })
    }

    return {
      passed: violations.length === 0,
      violations
    }
  }

  /**
   * Validate fiscal period for transaction posting
   */
  static async validateFiscalPeriod(
    transactionDate: string,
    organizationId: string
  ): Promise<GuardrailResult> {
    const violations: GuardrailViolation[] = []

    try {
      // This would be implemented with actual database call
      // For now, we'll simulate the validation
      const periodStatus = await this.getFiscalPeriodStatus(transactionDate, organizationId)

      if (!periodStatus) {
        violations.push({
          code: 'TXN-PERIOD-NOT-FOUND',
          message: `No fiscal period found for date ${transactionDate}`,
          severity: 'ERROR'
        })
      } else if (periodStatus.status === 'CLOSED') {
        violations.push({
          code: 'TXN-PERIOD-CLOSED',
          message: `Cannot post to closed fiscal period ${periodStatus.period_code} (${periodStatus.period_name})`,
          severity: 'ERROR',
          context: {
            period_code: periodStatus.period_code,
            period_status: periodStatus.status,
            fiscal_year: periodStatus.fiscal_year
          }
        })
      } else if (periodStatus.status === 'LOCKED') {
        violations.push({
          code: 'TXN-PERIOD-LOCKED',
          message: `Cannot post to locked fiscal period ${periodStatus.period_code}`,
          severity: 'ERROR'
        })
      }
    } catch (error) {
      violations.push({
        code: 'TXN-PERIOD-VALIDATION-ERROR',
        message: `Error validating fiscal period: ${error.message}`,
        severity: 'ERROR'
      })
    }

    return {
      passed: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    }
  }

  /**
   * Validate Chart of Accounts mapping
   */
  static async validateCOAMapping(
    accountCodes: string[],
    organizationId: string
  ): Promise<GuardrailResult> {
    const violations: GuardrailViolation[] = []

    try {
      // This would query v_gl_accounts_enhanced view
      const validAccounts = await this.validateAccountsExist(accountCodes, organizationId)

      for (const accountCode of accountCodes) {
        const accountInfo = validAccounts.find(a => a.account_code === accountCode)

        if (!accountInfo) {
          violations.push({
            code: 'COA-MAPPING-NOT-FOUND',
            message: `GL account ${accountCode} not found in Chart of Accounts`,
            severity: 'ERROR',
            context: { account_code: accountCode }
          })
        } else if (!accountInfo.is_active) {
          violations.push({
            code: 'COA-MAPPING-INACTIVE',
            message: `GL account ${accountCode} is inactive`,
            severity: 'ERROR',
            context: { account_code: accountCode, status: 'INACTIVE' }
          })
        }
      }
    } catch (error) {
      violations.push({
        code: 'COA-MAPPING-VALIDATION-ERROR',
        message: `Error validating COA mapping: ${error.message}`,
        severity: 'ERROR'
      })
    }

    return {
      passed: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    }
  }

  /**
   * AI Confidence verification with workflow routing
   */
  static validateAIConfidence(
    aiConfidence: number,
    transactionAmount?: number,
    userRole?: string
  ): GuardrailResult {
    const violations: GuardrailViolation[] = []
    const config = this.aiConfig

    if (aiConfidence < config.reject_threshold) {
      violations.push({
        code: 'TXN-AI-CONFIDENCE-TOO-LOW',
        message: `AI confidence ${aiConfidence.toFixed(3)} is below rejection threshold ${config.reject_threshold}`,
        severity: 'ERROR',
        context: {
          ai_confidence: aiConfidence,
          threshold: config.reject_threshold,
          recommendation: 'REJECT'
        }
      })
    } else if (aiConfidence < config.require_approval_threshold) {
      const approvalLevel = this.determineApprovalLevel(aiConfidence, transactionAmount)
      violations.push({
        code: 'TXN-AI-VERIFY',
        message: `AI confidence ${aiConfidence.toFixed(3)} requires ${approvalLevel} approval`,
        severity: 'WARNING',
        context: {
          ai_confidence: aiConfidence,
          approval_level: approvalLevel,
          threshold: config.require_approval_threshold
        }
      })
    }

    return {
      passed: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    }
  }

  /**
   * Enhanced multi-currency GL balance validation
   */
  static validateMultiCurrencyGLBalance(lines: any[]): GuardrailResult {
    const violations: GuardrailViolation[] = []

    if (!lines || !Array.isArray(lines)) {
      return { passed: true, violations: [] }
    }

    // Group by currency and calculate balances
    const currencyBalances = new Map<
      string,
      {
        total_debits: number
        total_credits: number
        net_balance: number
        line_count: number
      }
    >()

    lines.forEach((line, index) => {
      if (line.line_type === 'GL') {
        const currency = line.currency || line.line_data?.currency || 'USD'
        const debitAmount = parseFloat(line.debit_amount || 0)
        const creditAmount = parseFloat(line.credit_amount || 0)

        if (isNaN(debitAmount) || isNaN(creditAmount)) {
          violations.push({
            code: 'GL-AMOUNT-INVALID',
            message: `Invalid amount in GL line ${index + 1}: debit=${line.debit_amount}, credit=${line.credit_amount}`,
            severity: 'ERROR'
          })
          return
        }

        const existing = currencyBalances.get(currency) || {
          total_debits: 0,
          total_credits: 0,
          net_balance: 0,
          line_count: 0
        }

        existing.total_debits += debitAmount
        existing.total_credits += creditAmount
        existing.net_balance = existing.total_debits - existing.total_credits
        existing.line_count += 1

        currencyBalances.set(currency, existing)
      }
    })

    // Validate balance for each currency
    currencyBalances.forEach((balance, currency) => {
      if (Math.abs(balance.net_balance) >= 0.01) {
        violations.push({
          code: 'MULTI-CURRENCY-BALANCE',
          message: `GL entries not balanced for ${currency}: ${balance.net_balance.toFixed(2)} difference`,
          severity: 'ERROR',
          context: {
            currency,
            total_debits: balance.total_debits,
            total_credits: balance.total_credits,
            net_balance: balance.net_balance,
            line_count: balance.line_count
          }
        })
      }
    })

    return {
      passed: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    }
  }

  /**
   * Comprehensive v2 transaction validation
   */
  static async validateTransactionV2(transaction: any): Promise<GuardrailResult> {
    const allViolations: GuardrailViolation[] = []

    // Enhanced v1 validation
    const baseResult = this.validateTransaction(transaction)
    allViolations.push(...baseResult.violations)

    // v2-specific validations
    if (transaction.smart_code) {
      const smartCodeResult = this.validateSmartCodeV2(transaction.smart_code)
      allViolations.push(...smartCodeResult.violations)
    }

    // Fiscal period validation
    if (transaction.transaction_date && transaction.organization_id) {
      const fiscalResult = await this.validateFiscalPeriod(
        transaction.transaction_date,
        transaction.organization_id
      )
      allViolations.push(...fiscalResult.violations)
    }

    // AI confidence validation
    if (typeof transaction.ai_confidence === 'number') {
      const aiResult = this.validateAIConfidence(
        transaction.ai_confidence,
        transaction.total_amount,
        transaction.user_role
      )
      allViolations.push(...aiResult.violations)
    }

    // Enhanced multi-currency GL validation
    if (transaction.lines && Array.isArray(transaction.lines)) {
      const glResult = this.validateMultiCurrencyGLBalance(transaction.lines)
      allViolations.push(...glResult.violations)

      // COA mapping validation for GL lines
      const glLines = transaction.lines.filter(l => l.line_type === 'GL')
      if (glLines.length > 0) {
        const accountCodes = glLines
          .map(l => l.account_code || l.line_data?.account_code)
          .filter(Boolean)

        if (accountCodes.length > 0) {
          const coaResult = await this.validateCOAMapping(accountCodes, transaction.organization_id)
          allViolations.push(...coaResult.violations)
        }
      }
    }

    return {
      passed: allViolations.filter(v => v.severity === 'ERROR').length === 0,
      violations: allViolations
    }
  }

  // Helper methods
  private static getSmartCodeVersion(code: string): 'v1' | 'v2' | 'unknown' {
    if (SMART_CODE_V2_PATTERN.test(code)) return 'v2'
    if (SMART_CODE_V1_PATTERN.test(code)) return 'v1'
    return 'unknown'
  }

  private static determineApprovalLevel(aiConfidence: number, transactionAmount?: number): string {
    if (transactionAmount && transactionAmount > 10000) {
      return 'OWNER'
    } else if (aiConfidence < 0.5) {
      return 'OWNER'
    } else if (aiConfidence < 0.7) {
      return 'MANAGER'
    }
    return 'SUPERVISOR'
  }

  // Mock implementation - would be replaced with actual database calls
  private static async getFiscalPeriodStatus(
    date: string,
    organizationId: string
  ): Promise<FiscalPeriodStatus | null> {
    // This would query the fiscal calendar
    // For now, return a mock open period
    return {
      period_code: '2024-12',
      period_name: 'December 2024',
      status: 'OPEN',
      fiscal_year: '2024',
      start_date: '2024-12-01',
      end_date: '2024-12-31'
    }
  }

  private static async validateAccountsExist(
    accountCodes: string[],
    organizationId: string
  ): Promise<Array<{ account_code: string; is_active: boolean }>> {
    // This would query v_gl_accounts_enhanced
    // For now, return mock data
    return accountCodes.map(code => ({
      account_code: code,
      is_active: true
    }))
  }

  /**
   * Generate enhanced v2 guardrail report
   */
  static generateReportV2(results: GuardrailResult[]): string {
    const allViolations = results.flatMap(r => r.violations)
    const errors = allViolations.filter(v => v.severity === 'ERROR')
    const warnings = allViolations.filter(v => v.severity === 'WARNING')
    const infos = allViolations.filter(v => v.severity === 'INFO')

    let report = '🛡️ HERA Guardrails v2 Report\n'
    report += '='.repeat(50) + '\n\n'

    if (errors.length === 0 && warnings.length === 0 && infos.length === 0) {
      report += '✅ All guardrails passed!\n'
      report += '🧬 Finance DNA v2 compliance: PERFECT\n'
    } else {
      if (errors.length > 0) {
        report += `❌ ${errors.length} ERRORS:\n`
        errors.forEach((error, i) => {
          report += `  ${i + 1}. [${error.code}] ${error.message}\n`
          if (error.context) {
            report += `     Context: ${JSON.stringify(error.context)}\n`
          }
        })
        report += '\n'
      }

      if (warnings.length > 0) {
        report += `⚠️  ${warnings.length} WARNINGS:\n`
        warnings.forEach((warning, i) => {
          report += `  ${i + 1}. [${warning.code}] ${warning.message}\n`
          if (warning.context) {
            report += `     Context: ${JSON.stringify(warning.context)}\n`
          }
        })
        report += '\n'
      }

      if (infos.length > 0) {
        report += `ℹ️  ${infos.length} INFORMATION:\n`
        infos.forEach((info, i) => {
          report += `  ${i + 1}. [${info.code}] ${info.message}\n`
        })
        report += '\n'
      }
    }

    report += `Summary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info\n`
    report += `Status: ${errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}\n`
    report += `Finance DNA v2: ${errors.length === 0 && warnings.length === 0 ? '🧬 COMPLIANT' : '⚠️ REVIEW REQUIRED'}\n`

    return report
  }
}

// Enhanced CLI Exit codes for v2
export const CLI_EXIT_CODES_V2 = {
  ...require('./hera-guardrails').CLI_EXIT_CODES,

  // v2-specific exit codes
  FISCAL_PERIOD_CLOSED: 40,
  FISCAL_PERIOD_LOCKED: 41,
  AI_CONFIDENCE_TOO_LOW: 42,
  COA_MAPPING_INVALID: 43,
  MULTI_CURRENCY_UNBALANCED: 44,
  SMART_CODE_V2_INVALID: 45
} as const

export type CLIExitCodeV2 = (typeof CLI_EXIT_CODES_V2)[keyof typeof CLI_EXIT_CODES_V2]
