#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface TestSuite {
  name: string;
  path: string;
  priority: number;
  required: boolean;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  failures: number;
  tests: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

/**
 * Test suite runner for HERA Playbook tests
 * Runs all test suites in order and generates comprehensive reports
 */
class PlaybookTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      path: 'tests/unit',
      priority: 1,
      required: true,
    },
    {
      name: 'Golden Path Tests',
      path: 'tests/golden-path',
      priority: 2,
      required: true,
    },
    {
      name: 'Failure Scenario Tests',
      path: 'tests/failure-scenarios',
      priority: 3,
      required: true,
    },
    {
      name: 'Property-Based Tests',
      path: 'tests/property-based',
      priority: 4,
      required: false,
    },
    {
      name: 'Integration Tests',
      path: 'tests/integration',
      priority: 5,
      required: false,
    },
  ];

  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async run(): Promise<boolean> {
    console.log(chalk.bold.blue('🧪 HERA Playbook Test Suite Runner'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Setup test environment
    await this.setupTestEnvironment();
    
    // Sort suites by priority
    const sortedSuites = [...this.testSuites].sort((a, b) => a.priority - b.priority);
    
    // Run each test suite
    for (const suite of sortedSuites) {
      await this.runTestSuite(suite);
    }
    
    // Generate reports
    await this.generateReports();
    
    // Cleanup
    await this.cleanupTestEnvironment();
    
    // Return overall pass/fail status
    return this.calculateOverallStatus();
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log(chalk.yellow('📦 Setting up test environment...'));
    
    // Create coverage directory if it doesn't exist
    const coverageDir = path.join(__dirname, 'coverage');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }
    
    // Create test results directory
    const resultsDir = path.join(__dirname, 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.JEST_JUNIT_OUTPUT_DIR = coverageDir;
    
    console.log(chalk.green('✅ Test environment ready'));
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log();
    console.log(chalk.bold.cyan(`Running ${suite.name}...`));
    console.log(chalk.gray('─'.repeat(40)));
    
    const startTime = Date.now();
    const testPath = path.join(__dirname, suite.path);
    
    try {
      const result = await this.executeJest(testPath);
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        passed: result.success,
        duration,
        failures: result.failures,
        tests: result.total,
        coverage: result.coverage,
      });
      
      if (result.success) {
        console.log(chalk.green(`✅ ${suite.name} passed (${this.formatDuration(duration)})`));
      } else {
        console.log(chalk.red(`❌ ${suite.name} failed (${result.failures} failures)`));
        
        if (suite.required) {
          console.log(chalk.red('This is a required test suite. Stopping execution.'));
          throw new Error(`Required test suite ${suite.name} failed`);
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error running ${suite.name}:`), error);
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration: Date.now() - startTime,
        failures: -1,
        tests: 0,
      });
      
      if (suite.required) {
        throw error;
      }
    }
  }

  private executeJest(testPath: string): Promise<{
    success: boolean;
    failures: number;
    total: number;
    coverage?: any;
  }> {
    return new Promise((resolve) => {
      const jestConfig = path.join(__dirname, 'jest.config.js');
      const args = [
        '--config', jestConfig,
        '--json',
        '--outputFile', path.join(__dirname, 'test-results', 'jest-results.json'),
        testPath,
      ];
      
      const jest = spawn('npx', ['jest', ...args], {
        stdio: 'inherit',
        env: { ...process.env },
      });
      
      jest.on('close', (code) => {
        try {
          const resultsFile = path.join(__dirname, 'test-results', 'jest-results.json');
          if (fs.existsSync(resultsFile)) {
            const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
            
            resolve({
              success: code === 0,
              failures: results.numFailedTests || 0,
              total: results.numTotalTests || 0,
              coverage: results.coverageMap,
            });
          } else {
            resolve({
              success: code === 0,
              failures: code === 0 ? 0 : 1,
              total: 0,
            });
          }
        } catch (error) {
          resolve({
            success: false,
            failures: 1,
            total: 0,
          });
        }
      });
    });
  }

  private async generateReports(): Promise<void> {
    console.log();
    console.log(chalk.bold.yellow('📊 Generating test reports...'));
    console.log(chalk.gray('─'.repeat(60)));
    
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.reduce((sum, r) => sum + r.tests, 0);
    const totalFailures = this.results.reduce((sum, r) => sum + r.failures, 0);
    const passedSuites = this.results.filter(r => r.passed).length;
    
    // Summary report
    console.log(chalk.bold('Test Summary:'));
    console.log(`  Total Suites: ${this.results.length}`);
    console.log(`  Passed Suites: ${passedSuites}`);
    console.log(`  Failed Suites: ${this.results.length - passedSuites}`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Total Failures: ${totalFailures}`);
    console.log(`  Total Duration: ${this.formatDuration(totalDuration)}`);
    console.log();
    
    // Detailed results
    console.log(chalk.bold('Suite Results:'));
    for (const result of this.results) {
      const status = result.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`  ${status} ${result.suite}`);
      console.log(`       Tests: ${result.tests}, Failures: ${result.failures}, Duration: ${this.formatDuration(result.duration)}`);
      
      if (result.coverage) {
        console.log(`       Coverage: ${this.formatCoverage(result.coverage)}`);
      }
    }
    
    // Generate JSON report
    const reportPath = path.join(__dirname, 'test-results', 'summary.json');
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      suites: this.results,
      summary: {
        totalSuites: this.results.length,
        passedSuites,
        failedSuites: this.results.length - passedSuites,
        totalTests,
        totalFailures,
        overallStatus: this.calculateOverallStatus() ? 'PASSED' : 'FAILED',
      },
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log();
    console.log(chalk.green(`✅ Test report saved to: ${reportPath}`));
    
    // Generate HTML report
    await this.generateHtmlReport(report);
  }

  private async generateHtmlReport(report: any): Promise<void> {
    const htmlPath = path.join(__dirname, 'test-results', 'summary.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>HERA Playbook Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .status-passed { color: #28a745; font-weight: bold; }
    .status-failed { color: #dc3545; font-weight: bold; }
    .summary { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .suite { margin: 10px 0; padding: 10px; border-left: 3px solid #ddd; }
    .suite.passed { border-color: #28a745; }
    .suite.failed { border-color: #dc3545; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>HERA Playbook Test Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <h2>Summary</h2>
      <p class="${report.summary.overallStatus === 'PASSED' ? 'status-passed' : 'status-failed'}">
        Overall Status: ${report.summary.overallStatus}
      </p>
      <p>Total Duration: ${this.formatDuration(report.duration)}</p>
      <p>Suites: ${report.summary.passedSuites}/${report.summary.totalSuites} passed</p>
      <p>Tests: ${report.summary.totalTests} total, ${report.summary.totalFailures} failures</p>
    </div>
    
    <h2>Suite Results</h2>
    <table>
      <tr>
        <th>Suite</th>
        <th>Status</th>
        <th>Tests</th>
        <th>Failures</th>
        <th>Duration</th>
      </tr>
      ${report.suites.map((suite: TestResult) => `
        <tr class="suite ${suite.passed ? 'passed' : 'failed'}">
          <td>${suite.suite}</td>
          <td class="${suite.passed ? 'status-passed' : 'status-failed'}">
            ${suite.passed ? 'PASSED' : 'FAILED'}
          </td>
          <td>${suite.tests}</td>
          <td>${suite.failures}</td>
          <td>${this.formatDuration(suite.duration)}</td>
        </tr>
      `).join('')}
    </table>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(htmlPath, html);
    console.log(chalk.green(`✅ HTML report saved to: ${htmlPath}`));
  }

  private async cleanupTestEnvironment(): Promise<void> {
    console.log();
    console.log(chalk.yellow('🧹 Cleaning up test environment...'));
    
    // Clean up temporary files
    const tempFiles = [
      path.join(__dirname, 'test-results', 'jest-results.json'),
    ];
    
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    
    console.log(chalk.green('✅ Cleanup complete'));
  }

  private calculateOverallStatus(): boolean {
    // All required test suites must pass
    const requiredSuites = this.testSuites.filter(s => s.required);
    const requiredResults = this.results.filter(r => 
      requiredSuites.some(s => s.name === r.suite)
    );
    
    return requiredResults.every(r => r.passed);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  private formatCoverage(coverage: any): string {
    if (!coverage) return 'N/A';
    
    const avg = (
      coverage.statements +
      coverage.branches +
      coverage.functions +
      coverage.lines
    ) / 4;
    
    return `${avg.toFixed(1)}%`;
  }
}

// Main execution
async function main() {
  const runner = new PlaybookTestRunner();
  
  try {
    const success = await runner.run();
    
    console.log();
    console.log(chalk.gray('═'.repeat(60)));
    
    if (success) {
      console.log(chalk.bold.green('✅ All required test suites passed!'));
      process.exit(0);
    } else {
      console.log(chalk.bold.red('❌ Some required test suites failed!'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.bold.red('💥 Test runner encountered an error:'), error);
    process.exit(2);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.bold.red('Fatal error:'), error);
    process.exit(3);
  });
}

export { PlaybookTestRunner };