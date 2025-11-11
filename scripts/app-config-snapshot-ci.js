#!/usr/bin/env node

/**
 * HERA APP_CONFIG Snapshot CI Integration Script
 * Smart Code: HERA.PLATFORM.CONFIG.SNAPSHOT.CI.v2
 * 
 * CI/CD integration script for APP_CONFIG snapshot testing
 * following the established Salon Staff preset CI patterns.
 */

const { execSync } = require('child_process')
const { existsSync, readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const path = require('path')

require('dotenv').config()

class AppConfigSnapshotCI {
  constructor() {
    this.resultsDir = join(process.cwd(), 'test-results')
    this.snapshotsDir = join(process.cwd(), 'snapshots')
    this.comparisonsDir = join(this.snapshotsDir, 'comparisons')
    this.isCI = process.env.CI === 'true'
    this.verbose = process.env.VERBOSE === 'true' || process.argv.includes('--verbose')
  }

  /**
   * Log message with timestamp
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌' }
    const icon = icons[level] || '📋'
    
    console.log(`${icon} [${timestamp}] ${message}`)
  }

  /**
   * Execute command with error handling
   */
  exec(command, options = {}) {
    if (this.verbose) {
      this.log(`Executing: ${command}`)
    }

    try {
      const result = execSync(command, {
        encoding: 'utf-8',
        stdio: this.verbose ? 'inherit' : 'pipe',
        ...options
      })
      return result
    } catch (error) {
      this.log(`Command failed: ${command}`, 'error')
      this.log(`Error: ${error.message}`, 'error')
      throw error
    }
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [this.resultsDir, this.snapshotsDir, this.comparisonsDir]
    
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        this.exec(`mkdir -p "${dir}"`)
        this.log(`Created directory: ${dir}`)
      }
    })
  }

  /**
   * Check if all required tools are available
   */
  checkPrerequisites() {
    this.log('Checking prerequisites...')

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`)
      }
    }

    // Check if tsx is available
    try {
      this.exec('npx tsx --version', { stdio: 'pipe' })
    } catch (error) {
      throw new Error('tsx not available. Run: npm install -g tsx')
    }

    // Check if vitest is available
    try {
      this.exec('npx vitest --version', { stdio: 'pipe' })
    } catch (error) {
      throw new Error('vitest not available. Run: npm install')
    }

    this.log('Prerequisites check passed', 'success')
  }

  /**
   * Generate current snapshot
   */
  async generateSnapshot() {
    this.log('Generating current APP_CONFIG snapshot...')

    try {
      this.exec('npx tsx scripts/generate-app-config-snapshots.ts')
      
      const snapshotPath = join(this.snapshotsDir, 'app-configs.json')
      if (!existsSync(snapshotPath)) {
        throw new Error('Snapshot generation failed - no output file found')
      }

      // Validate snapshot structure
      const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'))
      if (!snapshot.metadata || !snapshot.configs) {
        throw new Error('Invalid snapshot structure')
      }

      this.log(`Snapshot generated successfully: ${Object.keys(snapshot.configs).length} configurations`, 'success')
      return snapshot
    } catch (error) {
      this.log(`Snapshot generation failed: ${error.message}`, 'error')
      throw error
    }
  }

  /**
   * Run snapshot validation tests
   */
  async runSnapshotTests() {
    this.log('Running APP_CONFIG snapshot validation tests...')

    try {
      const testCommand = this.isCI 
        ? 'npx vitest run --config vitest.app-config.config.ts --reporter=json --outputFile=test-results/app-config-test-results.json'
        : 'npx vitest run --config vitest.app-config.config.ts'

      this.exec(testCommand)
      
      // Parse test results if in CI
      if (this.isCI) {
        const resultsPath = join(this.resultsDir, 'app-config-test-results.json')
        if (existsSync(resultsPath)) {
          const results = JSON.parse(readFileSync(resultsPath, 'utf-8'))
          const summary = results.testResults?.summary || results.summary
          
          if (summary) {
            this.log(`Test Results: ${summary.passed || 0} passed, ${summary.failed || 0} failed, ${summary.skipped || 0} skipped`)
            
            if (summary.failed > 0) {
              throw new Error(`${summary.failed} tests failed`)
            }
          }
        }
      }

      this.log('Snapshot validation tests passed', 'success')
    } catch (error) {
      this.log(`Snapshot tests failed: ${error.message}`, 'error')
      throw error
    }
  }

  /**
   * Compare with baseline snapshot if available
   */
  async compareWithBaseline() {
    const baselinePath = join(this.snapshotsDir, 'app-configs-baseline.json')
    const currentPath = join(this.snapshotsDir, 'app-configs.json')

    if (!existsSync(baselinePath)) {
      this.log('No baseline snapshot found - creating baseline from current snapshot', 'warning')
      
      if (existsSync(currentPath)) {
        this.exec(`cp "${currentPath}" "${baselinePath}"`)
        this.log('Baseline snapshot created', 'success')
      }
      return
    }

    this.log('Comparing current snapshot with baseline...')

    try {
      const compareCommand = `npx tsx scripts/compare-app-config-snapshots.ts --baseline="${baselinePath}" --current="${currentPath}" --output="${this.comparisonsDir}" --format=both`
      
      this.exec(compareCommand)
      
      // Parse comparison results
      const comparisonFiles = this.exec(`find "${this.comparisonsDir}" -name "app-config-diff-*.json" -type f | head -1`, { stdio: 'pipe' }).trim().split('\n')
      
      if (comparisonFiles.length > 0 && comparisonFiles[0]) {
        const comparisonPath = comparisonFiles[0]
        const comparison = JSON.parse(readFileSync(comparisonPath, 'utf-8'))
        
        this.log(`Comparison complete: ${comparison.summary.total_changes} total changes`)
        this.log(`  Added: ${comparison.summary.added_configs.length}`)
        this.log(`  Removed: ${comparison.summary.removed_configs.length}`)
        this.log(`  Modified: ${comparison.summary.modified_configs.length}`)
        this.log(`  Unchanged: ${comparison.summary.unchanged_configs.length}`)

        // Check for breaking changes
        const breakingChanges = Object.values(comparison.detailed_changes)
          .filter(change => change.guardrail_impact === 'breaking')
        
        if (breakingChanges.length > 0) {
          this.log(`Found ${breakingChanges.length} breaking changes`, 'warning')
          
          if (this.isCI && !process.argv.includes('--allow-breaking')) {
            throw new Error('Breaking changes detected in APP_CONFIG snapshots')
          }
        }

        this.log('Snapshot comparison completed', 'success')
      }
    } catch (error) {
      this.log(`Snapshot comparison failed: ${error.message}`, 'error')
      throw error
    }
  }

  /**
   * Run guardrail validation
   */
  async runGuardrailValidation() {
    this.log('Running APP_CONFIG guardrail validation...')

    try {
      this.exec('node scripts/validate-app-config-guardrails.js')
      this.log('Guardrail validation passed', 'success')
    } catch (error) {
      this.log(`Guardrail validation failed: ${error.message}`, 'error')
      throw error
    }
  }

  /**
   * Generate CI artifacts
   */
  async generateArtifacts() {
    this.log('Generating CI artifacts...')

    const artifacts = {
      timestamp: new Date().toISOString(),
      ci_run: {
        is_ci: this.isCI,
        commit_sha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || 'unknown',
        branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME || 'unknown',
        workflow: process.env.GITHUB_WORKFLOW || 'APP_CONFIG Snapshot CI'
      },
      snapshots: {
        current_snapshot: existsSync(join(this.snapshotsDir, 'app-configs.json')),
        baseline_snapshot: existsSync(join(this.snapshotsDir, 'app-configs-baseline.json')),
        comparison_reports: this.exec(`find "${this.comparisonsDir}" -name "*.md" -o -name "*.json" | wc -l`, { stdio: 'pipe' }).trim()
      },
      test_results: {
        snapshot_tests: existsSync(join(this.resultsDir, 'app-config-test-results.json')),
        guardrail_validation: existsSync(join(this.resultsDir, 'app-config-guardrail-results.json'))
      }
    }

    const artifactsPath = join(this.resultsDir, 'app-config-ci-artifacts.json')
    writeFileSync(artifactsPath, JSON.stringify(artifacts, null, 2))
    
    this.log(`CI artifacts saved: ${artifactsPath}`, 'success')
    return artifacts
  }

  /**
   * Main CI workflow
   */
  async run() {
    this.log('🚀 Starting HERA APP_CONFIG Snapshot CI Pipeline')
    
    const startTime = Date.now()
    
    try {
      // Setup
      this.ensureDirectories()
      this.checkPrerequisites()

      // Generate current snapshot
      await this.generateSnapshot()

      // Run validation tests
      await this.runSnapshotTests()

      // Run guardrail validation
      await this.runGuardrailValidation()

      // Compare with baseline
      await this.compareWithBaseline()

      // Generate artifacts
      const artifacts = await this.generateArtifacts()

      const duration = (Date.now() - startTime) / 1000
      this.log(`✅ APP_CONFIG Snapshot CI completed successfully in ${duration}s`, 'success')

      return {
        success: true,
        duration,
        artifacts
      }

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000
      this.log(`❌ APP_CONFIG Snapshot CI failed after ${duration}s: ${error.message}`, 'error')

      // Generate failure artifacts
      try {
        await this.generateArtifacts()
      } catch (artifactError) {
        this.log(`Failed to generate failure artifacts: ${artifactError.message}`, 'error')
      }

      return {
        success: false,
        duration,
        error: error.message
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
HERA APP_CONFIG Snapshot CI Tool

Usage: node app-config-snapshot-ci.js [options]

Options:
  --verbose              Enable verbose logging
  --allow-breaking       Allow breaking changes in CI
  --help, -h            Show this help message

Environment Variables:
  CI=true               Enable CI mode
  VERBOSE=true          Enable verbose logging
  NEXT_PUBLIC_SUPABASE_URL    Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Supabase service role key

Examples:
  node app-config-snapshot-ci.js
  node app-config-snapshot-ci.js --verbose
  CI=true node app-config-snapshot-ci.js --allow-breaking
`)
    process.exit(0)
  }

  const ci = new AppConfigSnapshotCI()
  const result = await ci.run()
  
  process.exit(result.success ? 0 : 1)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { AppConfigSnapshotCI }