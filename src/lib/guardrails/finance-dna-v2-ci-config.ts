/**
 * Finance DNA v2 - CI/CD Integration Configuration
 * Smart Code: HERA.ACCOUNTING.CI.GUARDRAIL.CONFIG.v2
 *
 * Comprehensive CI pipeline integration for Finance DNA v2 guardrails
 * with automated smoke tests and deployment gates.
 */

import { HERAGuardrailsV2, CLI_EXIT_CODES_V2 } from './hera-guardrails-v2'
import type { GuardrailResult } from './hera-guardrails'

// CI Environment Configuration
export interface CIEnvironmentConfig {
  environment: 'development' | 'staging' | 'production'
  strict_mode: boolean
  auto_fix_enabled: boolean
  notification_channels: string[]
  rollback_on_failure: boolean
  smoke_test_timeout: number
}

// CI Test Suite Configuration
export interface CISmokeTestConfig {
  gl_balance_validation: boolean
  fiscal_period_validation: boolean
  coa_mapping_validation: boolean
  ai_confidence_validation: boolean
  multi_currency_validation: boolean
  performance_benchmarks: {
    max_processing_time_ms: number
    max_memory_usage_mb: number
    min_throughput_per_second: number
  }
}

// CI Gate Rules
export interface CIGateRule {
  gate_id: string
  description: string
  validation_type: 'BLOCKING' | 'WARNING' | 'INFORMATIONAL'
  conditions: {
    max_errors: number
    max_warnings: number
    required_confidence_score: number
  }
  bypass_roles: string[]
  notification_required: boolean
}

export class FinanceDNAV2CIIntegration {
  private static defaultConfig: CIEnvironmentConfig = {
    environment: 'development',
    strict_mode: false,
    auto_fix_enabled: true,
    notification_channels: ['console', 'slack'],
    rollback_on_failure: false,
    smoke_test_timeout: 30000
  }

  private static smokeTestConfig: CISmokeTestConfig = {
    gl_balance_validation: true,
    fiscal_period_validation: true,
    coa_mapping_validation: true,
    ai_confidence_validation: true,
    multi_currency_validation: true,
    performance_benchmarks: {
      max_processing_time_ms: 5000,
      max_memory_usage_mb: 256,
      min_throughput_per_second: 100
    }
  }

  private static gateRules: CIGateRule[] = [
    {
      gate_id: 'FINANCE_DNA_V2_CORE_VALIDATION',
      description: 'Core Finance DNA v2 validation rules',
      validation_type: 'BLOCKING',
      conditions: {
        max_errors: 0,
        max_warnings: 5,
        required_confidence_score: 0.95
      },
      bypass_roles: ['finance_admin', 'system_admin'],
      notification_required: true
    },
    {
      gate_id: 'GL_BALANCE_INTEGRITY',
      description: 'GL balance validation across all currencies',
      validation_type: 'BLOCKING',
      conditions: {
        max_errors: 0,
        max_warnings: 0,
        required_confidence_score: 1.0
      },
      bypass_roles: ['system_admin'],
      notification_required: true
    },
    {
      gate_id: 'FISCAL_PERIOD_COMPLIANCE',
      description: 'Fiscal period and calendar compliance',
      validation_type: 'BLOCKING',
      conditions: {
        max_errors: 0,
        max_warnings: 2,
        required_confidence_score: 0.98
      },
      bypass_roles: ['finance_admin'],
      notification_required: false
    },
    {
      gate_id: 'COA_MAPPING_INTEGRITY',
      description: 'Chart of Accounts mapping validation',
      validation_type: 'WARNING',
      conditions: {
        max_errors: 2,
        max_warnings: 10,
        required_confidence_score: 0.9
      },
      bypass_roles: ['finance_manager'],
      notification_required: false
    }
  ]

  /**
   * Execute comprehensive CI validation suite
   */
  static async executeCI(
    config: Partial<CIEnvironmentConfig> = {},
    testConfig: Partial<CISmokeTestConfig> = {}
  ): Promise<{
    success: boolean
    exit_code: number
    results: {
      gate_results: Array<{
        gate_id: string
        passed: boolean
        violations: any[]
        performance_metrics?: any
      }>
      smoke_test_results: any
      performance_summary: any
    }
    recommendations: string[]
  }> {
    const startTime = performance.now()
    const effectiveConfig = { ...this.defaultConfig, ...config }
    const effectiveTestConfig = { ...this.smokeTestConfig, ...testConfig }

    console.log(`🚀 Starting Finance DNA v2 CI Validation Pipeline`)
    console.log(`Environment: ${effectiveConfig.environment}`)
    console.log(`Strict Mode: ${effectiveConfig.strict_mode}`)

    const results = {
      gate_results: [] as any[],
      smoke_test_results: {} as any,
      performance_summary: {} as any
    }

    let overallSuccess = true
    let finalExitCode = 0
    const recommendations: string[] = []

    try {
      // Execute CI Gates
      console.log(`\n📋 Executing CI Gates (${this.gateRules.length} gates)...`)

      for (const gate of this.gateRules) {
        console.log(`\n🔍 Gate: ${gate.gate_id}`)

        const gateResult = await this.executeGate(gate, effectiveConfig)
        results.gate_results.push(gateResult)

        if (!gateResult.passed && gate.validation_type === 'BLOCKING') {
          overallSuccess = false
          finalExitCode = this.getExitCodeForGate(gate.gate_id)
          console.log(`❌ BLOCKING gate failed: ${gate.gate_id}`)
        } else if (!gateResult.passed && gate.validation_type === 'WARNING') {
          console.log(`⚠️  WARNING gate failed: ${gate.gate_id}`)
          recommendations.push(`Review ${gate.description}`)
        }
      }

      // Execute Smoke Tests
      console.log(`\n🧪 Executing Smoke Tests...`)
      results.smoke_test_results = await this.executeSmokeTests(effectiveTestConfig)

      if (!results.smoke_test_results.all_passed) {
        overallSuccess = false
        if (finalExitCode === 0) finalExitCode = CLI_EXIT_CODES_V2.VALIDATION_FAILED
      }

      // Performance Benchmarking
      console.log(`\n⚡ Performance Benchmarking...`)
      results.performance_summary = await this.executePerformanceBenchmarks(effectiveTestConfig)

      if (!results.performance_summary.benchmarks_met) {
        recommendations.push('Consider performance optimizations')
        if (effectiveConfig.strict_mode) {
          overallSuccess = false
          if (finalExitCode === 0) finalExitCode = CLI_EXIT_CODES_V2.PERFORMANCE_DEGRADED
        }
      }
    } catch (error) {
      console.error(`💥 CI Pipeline Error: ${error.message}`)
      overallSuccess = false
      finalExitCode = CLI_EXIT_CODES_V2.CI_PIPELINE_ERROR
    }

    const totalTime = performance.now() - startTime
    results.performance_summary.total_ci_time_ms = totalTime

    // Final Report
    console.log(`\n📊 CI Pipeline Summary`)
    console.log(`=`.repeat(50))
    console.log(`Overall Success: ${overallSuccess ? '✅' : '❌'}`)
    console.log(`Exit Code: ${finalExitCode}`)
    console.log(`Total Time: ${totalTime.toFixed(2)}ms`)
    console.log(
      `Gates Passed: ${results.gate_results.filter(g => g.passed).length}/${results.gate_results.length}`
    )

    if (recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`)
      recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`))
    }

    return {
      success: overallSuccess,
      exit_code: finalExitCode,
      results,
      recommendations
    }
  }

  /**
   * Execute individual CI gate
   */
  private static async executeGate(
    gate: CIGateRule,
    config: CIEnvironmentConfig
  ): Promise<{
    gate_id: string
    passed: boolean
    violations: any[]
    performance_metrics?: any
  }> {
    const startTime = performance.now()

    try {
      let validationResult: GuardrailResult

      switch (gate.gate_id) {
        case 'FINANCE_DNA_V2_CORE_VALIDATION':
          validationResult = await this.validateCoreFunctionality()
          break

        case 'GL_BALANCE_INTEGRITY':
          validationResult = await this.validateGLBalanceIntegrity()
          break

        case 'FISCAL_PERIOD_COMPLIANCE':
          validationResult = await this.validateFiscalPeriodCompliance()
          break

        case 'COA_MAPPING_INTEGRITY':
          validationResult = await this.validateCOAMappingIntegrity()
          break

        default:
          validationResult = { passed: true, violations: [] }
      }

      const errors = validationResult.violations.filter(v => v.severity === 'ERROR')
      const warnings = validationResult.violations.filter(v => v.severity === 'WARNING')

      const passed =
        errors.length <= gate.conditions.max_errors &&
        warnings.length <= gate.conditions.max_warnings &&
        validationResult.passed

      const processingTime = performance.now() - startTime

      return {
        gate_id: gate.gate_id,
        passed,
        violations: validationResult.violations,
        performance_metrics: {
          processing_time_ms: processingTime,
          error_count: errors.length,
          warning_count: warnings.length
        }
      }
    } catch (error) {
      return {
        gate_id: gate.gate_id,
        passed: false,
        violations: [
          {
            code: 'GATE_EXECUTION_ERROR',
            message: `Gate execution failed: ${error.message}`,
            severity: 'ERROR'
          }
        ]
      }
    }
  }

  /**
   * Execute comprehensive smoke tests
   */
  private static async executeSmokeTests(config: CISmokeTestConfig): Promise<{
    all_passed: boolean
    test_results: Array<{
      test_name: string
      passed: boolean
      execution_time_ms: number
      details?: any
    }>
  }> {
    const testResults: any[] = []
    let allPassed = true

    // GL Balance Test
    if (config.gl_balance_validation) {
      const result = await this.smokeTestGLBalance()
      testResults.push(result)
      if (!result.passed) allPassed = false
    }

    // Fiscal Period Test
    if (config.fiscal_period_validation) {
      const result = await this.smokeTestFiscalPeriod()
      testResults.push(result)
      if (!result.passed) allPassed = false
    }

    // COA Mapping Test
    if (config.coa_mapping_validation) {
      const result = await this.smokeTestCOAMapping()
      testResults.push(result)
      if (!result.passed) allPassed = false
    }

    // AI Confidence Test
    if (config.ai_confidence_validation) {
      const result = await this.smokeTestAIConfidence()
      testResults.push(result)
      if (!result.passed) allPassed = false
    }

    // Multi-Currency Test
    if (config.multi_currency_validation) {
      const result = await this.smokeTestMultiCurrency()
      testResults.push(result)
      if (!result.passed) allPassed = false
    }

    return {
      all_passed: allPassed,
      test_results: testResults
    }
  }

  /**
   * Execute performance benchmarks
   */
  private static async executePerformanceBenchmarks(config: CISmokeTestConfig): Promise<{
    benchmarks_met: boolean
    metrics: {
      avg_processing_time_ms: number
      memory_usage_mb: number
      throughput_per_second: number
    }
    benchmark_results: Array<{
      metric: string
      actual: number
      expected: number
      passed: boolean
    }>
  }> {
    // Simulate performance testing
    const metrics = {
      avg_processing_time_ms: 45, // Simulated
      memory_usage_mb: 128, // Simulated
      throughput_per_second: 150 // Simulated
    }

    const benchmarkResults = [
      {
        metric: 'Processing Time',
        actual: metrics.avg_processing_time_ms,
        expected: config.performance_benchmarks.max_processing_time_ms,
        passed:
          metrics.avg_processing_time_ms <= config.performance_benchmarks.max_processing_time_ms
      },
      {
        metric: 'Memory Usage',
        actual: metrics.memory_usage_mb,
        expected: config.performance_benchmarks.max_memory_usage_mb,
        passed: metrics.memory_usage_mb <= config.performance_benchmarks.max_memory_usage_mb
      },
      {
        metric: 'Throughput',
        actual: metrics.throughput_per_second,
        expected: config.performance_benchmarks.min_throughput_per_second,
        passed:
          metrics.throughput_per_second >= config.performance_benchmarks.min_throughput_per_second
      }
    ]

    const benchmarksMet = benchmarkResults.every(b => b.passed)

    return {
      benchmarks_met: benchmarksMet,
      metrics,
      benchmark_results: benchmarkResults
    }
  }

  // Core validation methods
  private static async validateCoreFunctionality(): Promise<GuardrailResult> {
    const mockTransaction = {
      smart_code: 'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      transaction_date: '2024-12-09',
      total_amount: 1000.0,
      ai_confidence: 0.85,
      lines: [
        {
          line_type: 'GL',
          account_code: '1100000',
          debit_amount: 1000.0,
          credit_amount: 0,
          currency: 'USD'
        },
        {
          line_type: 'GL',
          account_code: '4100000',
          debit_amount: 0,
          credit_amount: 1000.0,
          currency: 'USD'
        }
      ]
    }

    return await HERAGuardrailsV2.validateTransactionV2(mockTransaction)
  }

  private static async validateGLBalanceIntegrity(): Promise<GuardrailResult> {
    const mockLines = [
      { line_type: 'GL', debit_amount: 1000, credit_amount: 0, currency: 'USD' },
      { line_type: 'GL', debit_amount: 0, credit_amount: 1000, currency: 'USD' }
    ]

    return HERAGuardrailsV2.validateMultiCurrencyGLBalance(mockLines)
  }

  private static async validateFiscalPeriodCompliance(): Promise<GuardrailResult> {
    return await HERAGuardrailsV2.validateFiscalPeriod(
      '2024-12-09',
      '123e4567-e89b-12d3-a456-426614174000'
    )
  }

  private static async validateCOAMappingIntegrity(): Promise<GuardrailResult> {
    return await HERAGuardrailsV2.validateCOAMapping(
      ['1100000', '4100000'],
      '123e4567-e89b-12d3-a456-426614174000'
    )
  }

  // Smoke test implementations
  private static async smokeTestGLBalance(): Promise<any> {
    const startTime = performance.now()

    try {
      const result = await this.validateGLBalanceIntegrity()
      return {
        test_name: 'GL Balance Validation',
        passed: result.passed,
        execution_time_ms: performance.now() - startTime,
        details: { violations: result.violations }
      }
    } catch (error) {
      return {
        test_name: 'GL Balance Validation',
        passed: false,
        execution_time_ms: performance.now() - startTime,
        details: { error: error.message }
      }
    }
  }

  private static async smokeTestFiscalPeriod(): Promise<any> {
    const startTime = performance.now()

    try {
      const result = await this.validateFiscalPeriodCompliance()
      return {
        test_name: 'Fiscal Period Validation',
        passed: result.passed,
        execution_time_ms: performance.now() - startTime,
        details: { violations: result.violations }
      }
    } catch (error) {
      return {
        test_name: 'Fiscal Period Validation',
        passed: false,
        execution_time_ms: performance.now() - startTime,
        details: { error: error.message }
      }
    }
  }

  private static async smokeTestCOAMapping(): Promise<any> {
    const startTime = performance.now()

    try {
      const result = await this.validateCOAMappingIntegrity()
      return {
        test_name: 'COA Mapping Validation',
        passed: result.passed,
        execution_time_ms: performance.now() - startTime,
        details: { violations: result.violations }
      }
    } catch (error) {
      return {
        test_name: 'COA Mapping Validation',
        passed: false,
        execution_time_ms: performance.now() - startTime,
        details: { error: error.message }
      }
    }
  }

  private static async smokeTestAIConfidence(): Promise<any> {
    const startTime = performance.now()

    try {
      const result = HERAGuardrailsV2.validateAIConfidence(0.85, 1000, 'manager')
      return {
        test_name: 'AI Confidence Validation',
        passed: result.passed,
        execution_time_ms: performance.now() - startTime,
        details: { violations: result.violations }
      }
    } catch (error) {
      return {
        test_name: 'AI Confidence Validation',
        passed: false,
        execution_time_ms: performance.now() - startTime,
        details: { error: error.message }
      }
    }
  }

  private static async smokeTestMultiCurrency(): Promise<any> {
    const startTime = performance.now()

    try {
      const mockLines = [
        { line_type: 'GL', debit_amount: 1000, credit_amount: 0, currency: 'USD' },
        { line_type: 'GL', debit_amount: 0, credit_amount: 1000, currency: 'USD' },
        { line_type: 'GL', debit_amount: 500, credit_amount: 0, currency: 'EUR' },
        { line_type: 'GL', debit_amount: 0, credit_amount: 500, currency: 'EUR' }
      ]

      const result = HERAGuardrailsV2.validateMultiCurrencyGLBalance(mockLines)
      return {
        test_name: 'Multi-Currency Balance Validation',
        passed: result.passed,
        execution_time_ms: performance.now() - startTime,
        details: { violations: result.violations }
      }
    } catch (error) {
      return {
        test_name: 'Multi-Currency Balance Validation',
        passed: false,
        execution_time_ms: performance.now() - startTime,
        details: { error: error.message }
      }
    }
  }

  private static getExitCodeForGate(gateId: string): number {
    switch (gateId) {
      case 'FINANCE_DNA_V2_CORE_VALIDATION':
        return CLI_EXIT_CODES_V2.VALIDATION_FAILED
      case 'GL_BALANCE_INTEGRITY':
        return CLI_EXIT_CODES_V2.MULTI_CURRENCY_UNBALANCED
      case 'FISCAL_PERIOD_COMPLIANCE':
        return CLI_EXIT_CODES_V2.FISCAL_PERIOD_CLOSED
      case 'COA_MAPPING_INTEGRITY':
        return CLI_EXIT_CODES_V2.COA_MAPPING_INVALID
      default:
        return CLI_EXIT_CODES_V2.VALIDATION_FAILED
    }
  }
}

// CLI Command Interface
export interface CLICommand {
  command: string
  description: string
  options: Record<string, any>
  handler: (options: any) => Promise<number>
}

// Export CLI commands for package.json scripts
export const CLI_COMMANDS: CLICommand[] = [
  {
    command: 'finance-dna-v2:ci',
    description: 'Run complete Finance DNA v2 CI validation pipeline',
    options: {
      '--environment': 'Target environment (development|staging|production)',
      '--strict': 'Enable strict mode validation',
      '--timeout': 'Timeout in milliseconds (default: 30000)'
    },
    handler: async options => {
      const config: Partial<CIEnvironmentConfig> = {
        environment: options.environment || 'development',
        strict_mode: options.strict || false,
        smoke_test_timeout: options.timeout || 30000
      }

      const result = await FinanceDNAV2CIIntegration.executeCI(config)
      return result.exit_code
    }
  },
  {
    command: 'finance-dna-v2:smoke-test',
    description: 'Run Finance DNA v2 smoke tests only',
    options: {
      '--quick': 'Run quick smoke tests only'
    },
    handler: async options => {
      const testConfig: Partial<CISmokeTestConfig> = {
        gl_balance_validation: true,
        fiscal_period_validation: !options.quick,
        coa_mapping_validation: !options.quick,
        ai_confidence_validation: true,
        multi_currency_validation: !options.quick
      }

      const result = await FinanceDNAV2CIIntegration.executeCI({}, testConfig)
      return result.exit_code
    }
  }
]
