"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HERAReporter = void 0;
const fs = __importStar(require("fs/promises"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Generate test reports in various formats
 */
class HERAReporter {
    /**
     * Generate report based on test results
     */
    static async generateReport(results, options) {
        const allResults = Array.isArray(results) ? results : [results];
        switch (options.format) {
            case 'console':
                this.generateConsoleReport(allResults, options);
                break;
            case 'json':
                await this.generateJSONReport(allResults, options);
                break;
            case 'html':
                await this.generateHTMLReport(allResults, options);
                break;
            case 'markdown':
                await this.generateMarkdownReport(allResults, options);
                break;
        }
    }
    /**
     * Generate console report
     */
    static generateConsoleReport(results, options) {
        console.log(chalk_1.default.bold.blue('\\n📊 HERA Test Report'));
        console.log(chalk_1.default.gray('='.repeat(50)));
        const totalTests = results.length;
        const passedTests = results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        // Summary
        console.log(chalk_1.default.bold('\\nSummary:'));
        console.log(`  Total Tests: ${chalk_1.default.yellow(totalTests)}`);
        console.log(`  Passed: ${chalk_1.default.green(passedTests)}`);
        console.log(`  Failed: ${chalk_1.default.red(failedTests)}`);
        console.log(`  Duration: ${chalk_1.default.yellow(totalDuration + 'ms')}`);
        console.log(`  Success Rate: ${chalk_1.default.bold(((passedTests / totalTests) * 100).toFixed(1) + '%')}`);
        if (options.includeDetails) {
            // Detailed results
            console.log(chalk_1.default.bold('\\nDetailed Results:'));
            results.forEach((result, index) => {
                console.log(`\\n${chalk_1.default.bold(`Test ${index + 1}:`)}`);
                console.log(`  Status: ${result.success ? chalk_1.default.green('PASSED') : chalk_1.default.red('FAILED')}`);
                console.log(`  Duration: ${chalk_1.default.yellow(result.duration + 'ms')}`);
                console.log(`  Steps: ${result.steps.length}`);
                // Step details
                if (result.steps.length > 0) {
                    console.log('  Steps:');
                    result.steps.forEach(step => {
                        const status = step.success ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
                        console.log(`    ${status} ${step.stepName} (${step.duration}ms)`);
                        if (step.error) {
                            console.log(chalk_1.default.red(`      Error: ${step.error.message}`));
                        }
                    });
                }
                // Errors
                if (result.errors.length > 0) {
                    console.log(chalk_1.default.red('  Errors:'));
                    result.errors.forEach(error => {
                        console.log(chalk_1.default.red(`    - ${error.message}`));
                    });
                }
            });
        }
        console.log(chalk_1.default.gray('\\n' + '='.repeat(50)));
    }
    /**
     * Generate JSON report
     */
    static async generateJSONReport(results, options) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: results.length,
                passed: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
                successRate: (results.filter(r => r.success).length / results.length) * 100,
            },
            results: results.map(result => ({
                success: result.success,
                duration: result.duration,
                steps: result.steps,
                errors: result.errors.map(e => ({
                    message: e.message,
                    stack: e.stack,
                })),
            })),
        };
        const json = JSON.stringify(report, null, 2);
        if (options.outputPath) {
            await fs.writeFile(options.outputPath, json);
            console.log(chalk_1.default.green(`JSON report saved to: ${options.outputPath}`));
        }
        else {
            console.log(json);
        }
    }
    /**
     * Generate HTML report
     */
    static async generateHTMLReport(results, options) {
        const totalTests = results.length;
        const passedTests = results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        const successRate = (passedTests / totalTests) * 100;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>HERA Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .passed { color: #10b981; }
    .failed { color: #ef4444; }
    .test-result {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    .status-passed {
      background: #d1fae5;
      color: #065f46;
    }
    .status-failed {
      background: #fee2e2;
      color: #991b1b;
    }
    .step {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .step:last-child {
      border-bottom: none;
    }
    .step-passed::before {
      content: "✓ ";
      color: #10b981;
      font-weight: bold;
    }
    .step-failed::before {
      content: "✗ ";
      color: #ef4444;
      font-weight: bold;
    }
    .error {
      background: #fef2f2;
      color: #991b1b;
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
      font-family: monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>HERA Test Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Tests</h3>
      <p class="value">${totalTests}</p>
    </div>
    <div class="summary-card">
      <h3>Passed</h3>
      <p class="value passed">${passedTests}</p>
    </div>
    <div class="summary-card">
      <h3>Failed</h3>
      <p class="value failed">${failedTests}</p>
    </div>
    <div class="summary-card">
      <h3>Success Rate</h3>
      <p class="value">${successRate.toFixed(1)}%</p>
    </div>
    <div class="summary-card">
      <h3>Total Duration</h3>
      <p class="value">${(totalDuration / 1000).toFixed(2)}s</p>
    </div>
  </div>

  ${results.map((result, index) => `
    <div class="test-result">
      <div class="test-header">
        <h2>Test ${index + 1}</h2>
        <span class="status-badge ${result.success ? 'status-passed' : 'status-failed'}">
          ${result.success ? 'PASSED' : 'FAILED'}
        </span>
      </div>
      
      <p><strong>Duration:</strong> ${result.duration}ms</p>
      <p><strong>Steps:</strong> ${result.steps.length}</p>
      
      ${result.steps.length > 0 ? `
        <h3>Steps:</h3>
        ${result.steps.map(step => `
          <div class="step ${step.success ? 'step-passed' : 'step-failed'}">
            ${step.stepName} (${step.duration}ms)
            ${step.error ? `<div class="error">${step.error.message}</div>` : ''}
          </div>
        `).join('')}
      ` : ''}
      
      ${result.errors.length > 0 ? `
        <h3>Errors:</h3>
        ${result.errors.map(error => `
          <div class="error">${error.message}</div>
        `).join('')}
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
    `;
        if (options.outputPath) {
            await fs.writeFile(options.outputPath, html);
            console.log(chalk_1.default.green(`HTML report saved to: ${options.outputPath}`));
        }
        else {
            console.log(html);
        }
    }
    /**
     * Generate Markdown report
     */
    static async generateMarkdownReport(results, options) {
        const totalTests = results.length;
        const passedTests = results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        const successRate = (passedTests / totalTests) * 100;
        const markdown = `# HERA Test Report

Generated on: ${new Date().toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${totalTests} |
| Passed | ${passedTests} |
| Failed | ${failedTests} |
| Success Rate | ${successRate.toFixed(1)}% |
| Total Duration | ${totalDuration}ms |

## Detailed Results

${results.map((result, index) => `
### Test ${index + 1}

- **Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${result.duration}ms
- **Steps:** ${result.steps.length}

${result.steps.length > 0 ? `
#### Steps

| Step | Status | Duration |
|------|--------|----------|
${result.steps.map(step => `| ${step.stepName} | ${step.success ? '✅' : '❌'} | ${step.duration}ms |`).join('\\n')}
` : ''}

${result.errors.length > 0 ? `
#### Errors

${result.errors.map(error => `- ${error.message}`).join('\\n')}
` : ''}
`).join('\\n')}

---

*Report generated by HERA Testing Framework*
`;
        if (options.outputPath) {
            await fs.writeFile(options.outputPath, markdown);
            console.log(chalk_1.default.green(`Markdown report saved to: ${options.outputPath}`));
        }
        else {
            console.log(markdown);
        }
    }
}
exports.HERAReporter = HERAReporter;
