#!/usr/bin/env node

/**
 * HERA UAT Test Runner
 * Comprehensive UI testing with Playwright
 */

const { exec } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

const testSuites = [
  {
    name: 'Authentication Flow',
    command: 'npm run test:e2e -- tests/e2e/auth/login.spec.ts',
    critical: true
  },
  {
    name: 'Organization Management',
    command: 'npm run test:e2e -- tests/e2e/organization/organization-flow.spec.ts',
    critical: true
  },
  {
    name: 'MCP Chat Interface',
    command: 'npm run test:e2e -- tests/e2e/mcp-chat/chat-interaction.spec.ts',
    critical: true
  },
  {
    name: 'Entity Management',
    command: 'npm run test:e2e -- tests/e2e/universal-crud/entity-management.spec.ts',
    critical: true
  },
  {
    name: 'Performance Tests',
    command: 'npm run test:e2e -- tests/e2e/performance/load-test.spec.ts',
    critical: false
  },
  {
    name: 'Mobile Responsiveness',
    command: 'npm run test:e2e:mobile -- tests/e2e/mobile/mobile-responsive.spec.ts',
    critical: false
  }
];

async function runTest(suite) {
  return new Promise((resolve) => {
    const spinner = ora(`Running ${suite.name}...`).start();
    
    exec(suite.command, (error, stdout, stderr) => {
      if (error) {
        spinner.fail(chalk.red(`${suite.name} - FAILED`));
        console.error(chalk.red(stderr));
        resolve({ suite: suite.name, passed: false, critical: suite.critical });
      } else {
        spinner.succeed(chalk.green(`${suite.name} - PASSED`));
        resolve({ suite: suite.name, passed: true, critical: suite.critical });
      }
    });
  });
}

async function runAllTests() {
  console.log(chalk.blue.bold('\n🧪 HERA UAT Test Suite\n'));
  
  // Install Playwright browsers first
  const installSpinner = ora('Installing Playwright browsers...').start();
  await new Promise((resolve) => {
    exec('npm run test:e2e:install', (error) => {
      if (error) {
        installSpinner.warn('Failed to install browsers, continuing anyway...');
      } else {
        installSpinner.succeed('Browsers installed');
      }
      resolve();
    });
  });

  const results = [];
  
  // Run tests sequentially
  for (const suite of testSuites) {
    const result = await runTest(suite);
    results.push(result);
  }
  
  // Summary
  console.log(chalk.blue.bold('\n📊 Test Summary\n'));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? chalk.green : chalk.red;
    console.log(`${icon} ${color(result.suite)}`);
  });
  
  console.log(chalk.blue(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`));
  
  if (criticalFailed > 0) {
    console.log(chalk.red.bold(`\n❌ ${criticalFailed} critical tests failed!`));
    process.exit(1);
  } else if (failed > 0) {
    console.log(chalk.yellow(`\n⚠️  ${failed} non-critical tests failed`));
  } else {
    console.log(chalk.green.bold('\n✅ All tests passed!'));
  }
  
  // Generate report
  console.log(chalk.blue('\n📈 Generating test report...'));
  exec('npm run test:e2e:report', () => {
    console.log(chalk.green('Report generated. Run "npm run test:e2e:report" to view.'));
  });
}

// Run tests
runAllTests().catch(console.error);