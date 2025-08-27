#!/usr/bin/env node

/**
 * HERA Salon Module UAT Test Runner
 * Comprehensive testing for all salon functionality
 */

const { exec } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');

// Salon test suites with priority and dependencies
const salonTestSuites = [
  {
    name: 'Salon Dashboard',
    file: 'dashboard.spec.ts',
    priority: 1,
    critical: true,
    description: 'Tests main dashboard KPIs, quick actions, and navigation'
  },
  {
    name: 'Appointments Management',
    file: 'appointments.spec.ts',
    priority: 2,
    critical: true,
    description: 'Tests appointment booking, editing, check-in, and cancellation'
  },
  {
    name: 'Client Management',
    file: 'clients.spec.ts',
    priority: 3,
    critical: true,
    description: 'Tests client CRUD, loyalty tiers, and client history'
  },
  {
    name: 'Point of Sale',
    file: 'pos.spec.ts',
    priority: 4,
    critical: true,
    description: 'Tests service/product sales, payment processing, and receipts'
  },
  {
    name: 'Services Catalog',
    file: 'services.spec.ts',
    priority: 5,
    critical: false,
    description: 'Tests service management, categories, and pricing'
  }
];

// Test configuration
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  headless: process.env.TEST_HEADLESS !== 'false',
  slowMo: parseInt(process.env.TEST_SLOW_MO || '0'),
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  retries: parseInt(process.env.TEST_RETRIES || '1')
};

// Helper to run a single test suite
async function runTestSuite(suite) {
  return new Promise((resolve) => {
    const spinner = ora({
      text: `Running ${suite.name}...`,
      prefixText: chalk.blue(`[${suite.priority}]`)
    }).start();
    
    const testPath = path.join('tests/e2e/salon', suite.file);
    const command = `npx playwright test ${testPath} --reporter=json`;
    
    const startTime = Date.now();
    
    exec(command, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (error) {
        spinner.fail(chalk.red(`${suite.name} - FAILED (${duration}s)`));
        console.error(chalk.red(`\n${stderr}`));
        
        // Parse error details if available
        try {
          const jsonOutput = JSON.parse(stdout);
          const failedTests = jsonOutput.suites?.[0]?.specs?.filter(s => s.status === 'failed') || [];
          
          if (failedTests.length > 0) {
            console.log(chalk.red('\nFailed tests:'));
            failedTests.forEach(test => {
              console.log(chalk.red(`  ❌ ${test.title}`));
              if (test.error) {
                console.log(chalk.gray(`     ${test.error.message}`));
              }
            });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        resolve({
          suite: suite.name,
          passed: false,
          critical: suite.critical,
          duration,
          description: suite.description
        });
      } else {
        spinner.succeed(chalk.green(`${suite.name} - PASSED (${duration}s)`));
        
        // Parse test counts
        try {
          const jsonOutput = JSON.parse(stdout);
          const totalTests = jsonOutput.suites?.[0]?.specs?.length || 0;
          const passedTests = jsonOutput.suites?.[0]?.specs?.filter(s => s.status === 'passed').length || 0;
          
          console.log(chalk.gray(`  ✓ ${passedTests}/${totalTests} tests passed`));
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        resolve({
          suite: suite.name,
          passed: true,
          critical: suite.critical,
          duration,
          description: suite.description
        });
      }
    });
  });
}

// Main test runner
async function runSalonTests() {
  console.log(chalk.blue.bold('\n🎯 HERA Salon Module UAT Test Suite\n'));
  console.log(chalk.gray(`Base URL: ${config.baseUrl}`));
  console.log(chalk.gray(`Mode: ${config.headless ? 'Headless' : 'Headed'}`));
  console.log(chalk.gray(`Timeout: ${config.timeout}ms\n`));
  
  // Check if Playwright is installed
  const checkSpinner = ora('Checking Playwright installation...').start();
  
  await new Promise((resolve) => {
    exec('npx playwright --version', (error) => {
      if (error) {
        checkSpinner.fail('Playwright not installed');
        console.log(chalk.yellow('\nInstalling Playwright...'));
        exec('npm run test:e2e:install', (installError) => {
          if (installError) {
            console.error(chalk.red('Failed to install Playwright'));
            process.exit(1);
          }
          console.log(chalk.green('Playwright installed successfully'));
          resolve();
        });
      } else {
        checkSpinner.succeed('Playwright ready');
        resolve();
      }
    });
  });
  
  // Run tests in priority order
  const results = [];
  const sortedSuites = [...salonTestSuites].sort((a, b) => a.priority - b.priority);
  
  console.log(chalk.blue('\n📋 Test Execution Order:\n'));
  sortedSuites.forEach(suite => {
    console.log(chalk.gray(`${suite.priority}. ${suite.name} - ${suite.description}`));
  });
  console.log('');
  
  const totalStartTime = Date.now();
  
  for (const suite of sortedSuites) {
    const result = await runTestSuite(suite);
    results.push(result);
    
    // Stop on critical failure if requested
    if (!result.passed && result.critical && process.env.STOP_ON_FAILURE === 'true') {
      console.log(chalk.red('\n⛔ Stopping due to critical test failure'));
      break;
    }
  }
  
  const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
  
  // Generate summary report
  console.log(chalk.blue.bold('\n📊 Salon Test Summary\n'));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;
  
  // Display results table
  console.log(chalk.gray('─'.repeat(80)));
  console.log(chalk.gray('Test Suite'.padEnd(30) + 'Status'.padEnd(15) + 'Duration'.padEnd(15) + 'Critical'));
  console.log(chalk.gray('─'.repeat(80)));
  
  results.forEach(result => {
    const status = result.passed ? chalk.green('PASSED') : chalk.red('FAILED');
    const critical = result.critical ? '✓' : '';
    const duration = `${result.duration}s`;
    
    console.log(
      result.suite.padEnd(30) +
      status.padEnd(25) +
      duration.padEnd(15) +
      critical
    );
  });
  
  console.log(chalk.gray('─'.repeat(80)));
  console.log(`Total: ${results.length} | ${chalk.green(`Passed: ${passed}`)} | ${chalk.red(`Failed: ${failed}`)}`);
  console.log(`Total Duration: ${totalDuration}s\n`);
  
  // Generate detailed report file
  const reportData = {
    timestamp: new Date().toISOString(),
    config,
    totalDuration,
    summary: {
      total: results.length,
      passed,
      failed,
      criticalFailed
    },
    results
  };
  
  const reportPath = path.join('test-results', 'salon-test-report.json');
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(chalk.gray(`Detailed report saved to: ${reportPath}`));
  
  // Exit code based on results
  if (criticalFailed > 0) {
    console.log(chalk.red.bold(`\n❌ ${criticalFailed} critical salon tests failed!`));
    process.exit(1);
  } else if (failed > 0) {
    console.log(chalk.yellow(`\n⚠️  ${failed} non-critical salon tests failed`));
    process.exit(0);
  } else {
    console.log(chalk.green.bold('\n✅ All salon tests passed!'));
    process.exit(0);
  }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
${chalk.blue.bold('HERA Salon UAT Test Runner')}

${chalk.gray('Usage:')}
  node run-salon-tests.js [options]

${chalk.gray('Options:')}
  --help              Show this help message
  --headed            Run tests in headed mode (visible browser)
  --slow              Add 100ms delay between actions
  --stop-on-failure   Stop execution on first critical failure
  --timeout <ms>      Set test timeout (default: 30000)
  --url <url>         Set base URL (default: http://localhost:3000)

${chalk.gray('Examples:')}
  node run-salon-tests.js
  node run-salon-tests.js --headed --slow
  node run-salon-tests.js --url https://salon.heraerp.com
  `);
  process.exit(0);
}

// Process command line arguments
if (args.includes('--headed')) {
  process.env.TEST_HEADLESS = 'false';
}
if (args.includes('--slow')) {
  process.env.TEST_SLOW_MO = '100';
}
if (args.includes('--stop-on-failure')) {
  process.env.STOP_ON_FAILURE = 'true';
}

const timeoutIndex = args.indexOf('--timeout');
if (timeoutIndex > -1 && args[timeoutIndex + 1]) {
  process.env.TEST_TIMEOUT = args[timeoutIndex + 1];
}

const urlIndex = args.indexOf('--url');
if (urlIndex > -1 && args[urlIndex + 1]) {
  process.env.TEST_BASE_URL = args[urlIndex + 1];
}

// Run the tests
runSalonTests().catch(console.error);