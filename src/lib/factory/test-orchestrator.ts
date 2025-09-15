/**
 * HERA Universal Factory Test Orchestrator
 * Orchestrates Jest API and Playwright E2E tests within factory pipeline
 */

import { universalApi } from '@/lib/universal-api'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const execAsync = promisify(exec)

export interface TestMatrix {
  personas?: string[]
  locales?: string[]
  browsers?: string[]
  datasets?: string[]
  environments?: string[]
}

export interface TestConfiguration {
  moduleSmartCode: string
  testMatrix: TestMatrix
  coverageThreshold: number
  artifactBasePath: string
  guardrailPacks: string[]
  ucrPolicies: Record<string, any>
}

export interface TestResult {
  type: 'unit' | 'contract' | 'e2e' | 'security'
  status: 'PASSED' | 'FAILED' | 'SKIPPED'
  coverage?: number
  duration_ms: number
  passed: number
  failed: number
  skipped: number
  artifacts: {
    coverage_uri?: string
    report_uri?: string
    screenshots_uri?: string
    videos_uri?: string
    traces_uri?: string
    junit_uri?: string
  }
  violations?: string[]
}

export class TestOrchestrator {
  constructor(
    private organizationId: string,
    private config: TestConfiguration
  ) {
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Execute complete test stage for factory pipeline
   */
  async executeTestStage(pipelineId: string): Promise<TestResult[]> {
    console.log('🧪 Executing TEST stage for pipeline:', pipelineId)

    // Create TEST transaction
    const testTransaction = await this.createTestTransaction(pipelineId)

    // Execute test matrix
    const results: TestResult[] = []

    // 1. Unit Tests (Jest API)
    const unitResult = await this.runUnitTests(testTransaction.id)
    results.push(unitResult)
    await this.recordTestLine(testTransaction.id, 'STEP.UNIT', unitResult)

    // 2. Contract Tests (Jest + OpenAPI)
    const contractResult = await this.runContractTests(testTransaction.id)
    results.push(contractResult)
    await this.recordTestLine(testTransaction.id, 'STEP.CONTRACT', contractResult)

    // 3. E2E Tests (Playwright)
    const e2eResult = await this.runE2ETests(testTransaction.id)
    results.push(e2eResult)
    await this.recordTestLine(testTransaction.id, 'STEP.E2E', e2eResult)

    // 4. Security Tests (Optional)
    if (this.config.guardrailPacks.includes('SECURITY')) {
      const securityResult = await this.runSecurityTests(testTransaction.id)
      results.push(securityResult)
      await this.recordTestLine(testTransaction.id, 'STEP.SECURITY', securityResult)
    }

    // Evaluate guardrails
    await this.evaluateTestGuardrails(results)

    return results
  }

  /**
   * Create TEST transaction header
   */
  private async createTestTransaction(pipelineId: string) {
    return await universalApi.createTransaction({
      transaction_type: 'factory_test',
      transaction_code: `TEST-${Date.now()}`,
      smart_code: 'HERA.UNIVERSAL.FACTORY.TEST.v1_0',
      metadata: {
        pipeline_id: pipelineId,
        module_smart_code: this.config.moduleSmartCode,
        test_matrix: this.config.testMatrix,
        started_at: new Date().toISOString()
      },
      ai_confidence: 0.95,
      ai_insights: 'Comprehensive test suite execution'
    })
  }

  /**
   * Run Jest unit tests
   */
  private async runUnitTests(transactionId: string): Promise<TestResult> {
    const startTime = Date.now()

    try {
      // Execute Jest with coverage
      const { stdout, stderr } = await execAsync(
        'npm run test:api -- --coverage --json --outputFile=artifacts/jest-results.json',
        { env: { ...process.env, CI: 'true' } }
      )

      // Parse results
      const results = JSON.parse(await readFile('artifacts/jest-results.json', 'utf-8'))

      // Upload artifacts
      const coverageUri = await this.uploadArtifact(
        'artifacts/coverage/lcov.info',
        `${this.config.moduleSmartCode}/unit-coverage.lcov`
      )

      const junitUri = await this.uploadArtifact(
        'artifacts/junit/jest-junit.xml',
        `${this.config.moduleSmartCode}/unit-junit.xml`
      )

      return {
        type: 'unit',
        status: results.success ? 'PASSED' : 'FAILED',
        coverage: results.coverageMap ? this.calculateCoverage(results.coverageMap) : 0,
        duration_ms: Date.now() - startTime,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numPendingTests,
        artifacts: {
          coverage_uri: coverageUri,
          junit_uri: junitUri
        }
      }
    } catch (error) {
      return {
        type: 'unit',
        status: 'FAILED',
        duration_ms: Date.now() - startTime,
        passed: 0,
        failed: 1,
        skipped: 0,
        artifacts: {},
        violations: [error.message]
      }
    }
  }

  /**
   * Run contract tests
   */
  private async runContractTests(transactionId: string): Promise<TestResult> {
    const startTime = Date.now()

    try {
      // Execute contract tests
      const { stdout } = await execAsync('npm run test:contract -- --reporter json', {
        env: { ...process.env, CI: 'true' }
      })

      const results = JSON.parse(stdout)

      return {
        type: 'contract',
        status: results.failures === 0 ? 'PASSED' : 'FAILED',
        duration_ms: Date.now() - startTime,
        passed: results.passes,
        failed: results.failures,
        skipped: results.pending,
        artifacts: {
          report_uri: await this.uploadArtifact(
            'artifacts/contract-report.json',
            `${this.config.moduleSmartCode}/contract-report.json`
          )
        }
      }
    } catch (error) {
      return {
        type: 'contract',
        status: 'FAILED',
        duration_ms: Date.now() - startTime,
        passed: 0,
        failed: 1,
        skipped: 0,
        artifacts: {},
        violations: ['Contract validation failed']
      }
    }
  }

  /**
   * Run Playwright E2E tests
   */
  private async runE2ETests(transactionId: string): Promise<TestResult> {
    const startTime = Date.now()

    try {
      // Execute Playwright tests for each browser in matrix
      const browsers = this.config.testMatrix.browsers || ['chromium']
      let totalPassed = 0
      let totalFailed = 0

      for (const browser of browsers) {
        const { stdout } = await execAsync(
          `npm run test:e2e -- --project="${browser}" --reporter=json`,
          { env: { ...process.env, CI: 'true', BROWSER: browser } }
        )

        const results = JSON.parse(stdout)
        totalPassed += results.stats.expected
        totalFailed += results.stats.unexpected
      }

      // Upload artifacts
      const artifacts = {
        report_uri: await this.uploadArtifact(
          'artifacts/pw-report/index.html',
          `${this.config.moduleSmartCode}/e2e-report.html`
        ),
        screenshots_uri: await this.uploadDirectory(
          'artifacts/screenshots',
          `${this.config.moduleSmartCode}/screenshots`
        ),
        videos_uri: await this.uploadDirectory(
          'artifacts/videos',
          `${this.config.moduleSmartCode}/videos`
        ),
        traces_uri: await this.uploadDirectory(
          'artifacts/traces',
          `${this.config.moduleSmartCode}/traces`
        ),
        junit_uri: await this.uploadArtifact(
          'artifacts/pw-junit.xml',
          `${this.config.moduleSmartCode}/e2e-junit.xml`
        )
      }

      return {
        type: 'e2e',
        status: totalFailed === 0 ? 'PASSED' : 'FAILED',
        duration_ms: Date.now() - startTime,
        passed: totalPassed,
        failed: totalFailed,
        skipped: 0,
        artifacts
      }
    } catch (error) {
      return {
        type: 'e2e',
        status: 'FAILED',
        duration_ms: Date.now() - startTime,
        passed: 0,
        failed: 1,
        skipped: 0,
        artifacts: {},
        violations: [error.message]
      }
    }
  }

  /**
   * Run security tests
   */
  private async runSecurityTests(transactionId: string): Promise<TestResult> {
    const startTime = Date.now()

    try {
      // Run dependency audit
      const { stdout: auditOutput } = await execAsync('npm audit --json')
      const auditResults = JSON.parse(auditOutput)

      // Run OWASP dependency check if available
      let owaspViolations = 0
      try {
        await execAsync(
          'dependency-check --project test --scan . --format JSON --out artifacts/owasp-report.json'
        )
        const owaspReport = JSON.parse(await readFile('artifacts/owasp-report.json', 'utf-8'))
        owaspViolations =
          owaspReport.dependencies?.filter(d => d.vulnerabilities?.length > 0).length || 0
      } catch (e) {
        // OWASP not installed, skip
      }

      const totalViolations = auditResults.metadata.vulnerabilities.total + owaspViolations

      return {
        type: 'security',
        status: totalViolations === 0 ? 'PASSED' : 'FAILED',
        duration_ms: Date.now() - startTime,
        passed: totalViolations === 0 ? 1 : 0,
        failed: totalViolations > 0 ? 1 : 0,
        skipped: 0,
        artifacts: {
          report_uri: await this.uploadArtifact(
            'artifacts/security-report.json',
            `${this.config.moduleSmartCode}/security-report.json`
          )
        },
        violations: totalViolations > 0 ? [`${totalViolations} security vulnerabilities found`] : []
      }
    } catch (error) {
      return {
        type: 'security',
        status: 'FAILED',
        duration_ms: Date.now() - startTime,
        passed: 0,
        failed: 1,
        skipped: 0,
        artifacts: {},
        violations: ['Security scan failed']
      }
    }
  }

  /**
   * Record test result as transaction line
   */
  private async recordTestLine(transactionId: string, lineType: string, result: TestResult) {
    await universalApi.createTransactionLine({
      transaction_id: transactionId,
      line_type: lineType,
      line_number: this.getLineNumber(lineType),
      metadata: {
        type: lineType,
        status: result.status,
        duration_ms: result.duration_ms,
        coverage: result.coverage,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        artifacts: result.artifacts,
        violations: result.violations,
        completed_at: new Date().toISOString()
      }
    })
  }

  /**
   * Evaluate guardrails for test results
   */
  private async evaluateTestGuardrails(results: TestResult[]) {
    const overallCoverage = this.calculateOverallCoverage(results)
    const hasFailures = results.some(r => r.status === 'FAILED')
    const hasSecurityViolations = results.some(r => r.violations && r.violations.length > 0)

    // Check coverage threshold
    if (overallCoverage < this.config.coverageThreshold) {
      throw new Error(
        `Coverage ${overallCoverage.toFixed(2)}% below required ${this.config.coverageThreshold}%`
      )
    }

    // Check for critical failures
    if (hasFailures && this.config.ucrPolicies.block_on_test_fail) {
      throw new Error('Tests failed - pipeline blocked by guardrail')
    }

    // Check security violations
    if (hasSecurityViolations && this.config.guardrailPacks.includes('SECURITY')) {
      throw new Error('Security violations detected - pipeline blocked')
    }
  }

  // Helper methods
  private getLineNumber(lineType: string): number {
    const typeOrder = ['STEP.UNIT', 'STEP.CONTRACT', 'STEP.E2E', 'STEP.SECURITY']
    return typeOrder.indexOf(lineType) + 1
  }

  private calculateCoverage(coverageMap: any): number {
    // Simplified coverage calculation
    let totalStatements = 0
    let coveredStatements = 0

    for (const file of Object.values(coverageMap)) {
      const statements = (file as any).s || {}
      for (const count of Object.values(statements)) {
        totalStatements++
        if ((count as number) > 0) coveredStatements++
      }
    }

    return totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
  }

  private calculateOverallCoverage(results: TestResult[]): number {
    const coverages = results.filter(r => r.coverage !== undefined).map(r => r.coverage!)
    return coverages.length > 0 ? coverages.reduce((sum, c) => sum + c, 0) / coverages.length : 0
  }

  private async uploadArtifact(localPath: string, remotePath: string): Promise<string> {
    // In real implementation, upload to S3/GCS/Azure
    // For now, return a mock URI
    return `s3://hera-artifacts/${this.organizationId}/${remotePath}`
  }

  private async uploadDirectory(localDir: string, remoteDir: string): Promise<string> {
    // In real implementation, recursively upload directory
    return `s3://hera-artifacts/${this.organizationId}/${remoteDir}/`
  }
}

/**
 * Factory integration - enhance the existing factory with testing
 */
export async function integrateTestingIntoFactory(factory: any) {
  // Override the existing testStage method
  const originalTestStage = factory.testStage.bind(factory)

  factory.testStage = async function (pipelineId: string) {
    const pipeline = await universalApi.getTransaction(pipelineId)
    const moduleSmartCode = pipeline.data.metadata.module_smart_code
    const params = pipeline.data.metadata.params || {}

    // Get module manifest
    const module = await factory.resolveModule(moduleSmartCode)
    const manifest = JSON.parse(await universalApi.getDynamicField(module.id, 'module_manifest'))

    // Create test orchestrator
    const orchestrator = new TestOrchestrator(this.organizationId, {
      moduleSmartCode,
      testMatrix: params.test_matrix || {
        browsers: ['chromium'],
        personas: ['user'],
        locales: ['en-US'],
        datasets: ['happy_path']
      },
      coverageThreshold: params.coverage_threshold || 0.8,
      artifactBasePath: 'artifacts/',
      guardrailPacks: manifest.guardrail_packs || ['GENERAL'],
      ucrPolicies: params.ucr_policies || { block_on_test_fail: true }
    })

    // Execute comprehensive test stage
    const results = await orchestrator.executeTestStage(pipelineId)

    // Return summary
    return {
      test_suites_run: results.length,
      overall_status: results.every(r => r.status === 'PASSED') ? 'PASSED' : 'FAILED',
      overall_coverage: orchestrator.calculateOverallCoverage(results),
      total_tests: results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0),
      passed_tests: results.reduce((sum, r) => sum + r.passed, 0),
      failed_tests: results.reduce((sum, r) => sum + r.failed, 0),
      artifacts_generated: results.flatMap(r => Object.values(r.artifacts)).filter(Boolean).length
    }
  }
}
