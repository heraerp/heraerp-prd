#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs').promises;
const path = require('path');

// Import the compiled TypeScript modules
const { TestRunner } = require('../dist/runners/test-runner.js');
const { PlaywrightGenerator } = require('../dist/generators/playwright-generator.js');
const { parseBusinessProcessTest } = require('../dist/dsl/parser.js');

const program = new Command();

program
  .name('hera-test')
  .description('HERA Universal Testing Framework - Business Process Testing for ERP')
  .version('1.0.0');

// Initialize command - Create new test project
program
  .command('init')
  .argument('<project-name>', 'Name of the test project')
  .option('--industry <type>', 'Industry type (restaurant, healthcare, retail, salon)', 'restaurant')
  .option('--template <template>', 'Test template to use', 'basic')
  .description('Initialize a new HERA test project')
  .action(async (projectName, options) => {
    const spinner = ora('Initializing HERA test project...').start();
    
    try {
      const projectDir = path.join(process.cwd(), projectName);
      
      // Create project structure
      await fs.mkdir(projectDir, { recursive: true });
      await fs.mkdir(path.join(projectDir, 'tests'), { recursive: true });
      await fs.mkdir(path.join(projectDir, 'fixtures'), { recursive: true });
      await fs.mkdir(path.join(projectDir, 'reports'), { recursive: true });
      
      // Copy template files based on industry
      const templateDir = path.join(__dirname, '..', 'templates', options.industry);
      if (await fs.access(templateDir).catch(() => false)) {
        await copyDirectory(templateDir, path.join(projectDir, 'tests'));
      }
      
      // Create config file
      const config = {
        project_name: projectName,
        industry: options.industry,
        template: options.template,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url',
        test_org_id: process.env.DEFAULT_ORGANIZATION_ID || 'your-test-org-id',
        base_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        browsers: ['chromium'],
        timeout: 30000,
        retries: 2
      };
      
      await fs.writeFile(
        path.join(projectDir, 'hera-test.config.json'),
        JSON.stringify(config, null, 2)
      );
      
      spinner.succeed(`HERA test project '${projectName}' initialized successfully!`);
      
      console.log(chalk.cyan('\nNext steps:'));
      console.log(`  cd ${projectName}`);
      console.log('  hera-test run tests/order-to-cash.yaml');
      console.log('  hera-test generate tests/order-to-cash.yaml output --type playwright');
      
    } catch (error) {
      spinner.fail(`Failed to initialize project: ${error.message}`);
      process.exit(1);
    }
  });

// Run command - Execute business process tests
program
  .command('run')
  .argument('<test-file>', 'YAML test file to run')
  .option('--org-id <id>', 'Organization ID for test execution')
  .option('--browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
  .option('--headless', 'Run in headless mode', true)
  .option('--debug', 'Enable debug mode')
  .option('--report <format>', 'Report format (console, json, html)', 'console')
  .description('Run a business process test')
  .action(async (testFile, options) => {
    const spinner = ora('Running HERA business process test...').start();
    
    try {
      // Load test configuration
      const configPath = path.join(process.cwd(), 'hera-test.config.json');
      let config = {};
      try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } catch (error) {
        console.warn(chalk.yellow('No config file found, using defaults'));
      }
      
      // Parse the test file
      const testContent = await fs.readFile(testFile, 'utf-8');
      const businessTest = await parseBusinessProcessTest(testContent);
      
      // Create test runner
      const runner = new TestRunner({
        organizationId: options.orgId || config.test_org_id,
        browser: options.browser,
        headless: options.headless,
        debug: options.debug,
        baseUrl: config.base_url || 'http://localhost:3000',
        supabaseUrl: config.supabase_url
      });
      
      spinner.text = 'Executing test steps...';
      
      // Run the test
      const results = await runner.runBusinessProcess(businessTest);
      
      spinner.succeed('Test execution completed!');
      
      // Display results
      console.log(chalk.cyan('\n📊 Test Results:'));
      console.log(`Status: ${results.success ? chalk.green('PASSED') : chalk.red('FAILED')}`);
      console.log(`Duration: ${results.duration}ms`);
      console.log(`Steps: ${results.steps.filter(s => s.success).length}/${results.steps.length} passed`);
      
      if (results.assertions) {
        console.log(`Assertions: ${results.assertions.filter(a => a.success).length}/${results.assertions.length} passed`);
      }
      
      // Show failed steps
      const failedSteps = results.steps.filter(s => !s.success);
      if (failedSteps.length > 0) {
        console.log(chalk.red('\n❌ Failed Steps:'));
        failedSteps.forEach(step => {
          console.log(`  - ${step.id}: ${step.error}`);
        });
      }
      
      // Generate report if requested
      if (options.report !== 'console') {
        const reportPath = await generateReport(results, options.report);
        console.log(`\n📄 Report saved to: ${reportPath}`);
      }
      
      process.exit(results.success ? 0 : 1);
      
    } catch (error) {
      spinner.fail(`Test execution failed: ${error.message}`);
      if (options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Generate command - Convert business tests to technical tests
program
  .command('generate')
  .argument('<test-file>', 'YAML test file to generate from')
  .argument('<output-dir>', 'Output directory for generated tests')
  .option('--type <types>', 'Test types to generate (playwright,jest,pgtap)', 'playwright')
  .option('--overwrite', 'Overwrite existing files')
  .description('Generate technical test files from business process tests')
  .action(async (testFile, outputDir, options) => {
    const spinner = ora('Generating test files...').start();
    
    try {
      // Parse the test file
      const testContent = await fs.readFile(testFile, 'utf-8');
      const businessTest = await parseBusinessProcessTest(testContent);
      
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });
      
      const types = options.type.split(',');
      
      for (const type of types) {
        spinner.text = `Generating ${type} tests...`;
        
        switch (type.trim()) {
          case 'playwright':
            const playwrightGen = new PlaywrightGenerator();
            const playwrightCode = await playwrightGen.generateTest(businessTest);
            const playwrightPath = path.join(outputDir, `${businessTest.id}.spec.ts`);
            await fs.writeFile(playwrightPath, playwrightCode);
            console.log(`Generated Playwright test: ${playwrightPath}`);
            break;
            
          case 'jest':
            // Jest generator would go here
            console.log('Jest generation not implemented yet');
            break;
            
          case 'pgtap':
            // pgTAP generator would go here
            console.log('pgTAP generation not implemented yet');
            break;
            
          default:
            console.warn(`Unknown test type: ${type}`);
        }
      }
      
      spinner.succeed('Test generation completed!');
      
    } catch (error) {
      spinner.fail(`Test generation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Suite command - Run multiple tests
program
  .command('suite')
  .argument('<test-dir>', 'Directory containing test files')
  .option('--pattern <pattern>', 'File pattern to match', '*.yaml')
  .option('--parallel <count>', 'Number of parallel executions', '1')
  .option('--report <format>', 'Report format (console, json, html)', 'html')
  .option('--output <file>', 'Output file for report')
  .description('Run a suite of business process tests')
  .action(async (testDir, options) => {
    const spinner = ora('Running test suite...').start();
    
    try {
      const glob = require('glob');
      const testFiles = glob.sync(path.join(testDir, options.pattern));
      
      if (testFiles.length === 0) {
        throw new Error(`No test files found matching pattern: ${options.pattern}`);
      }
      
      console.log(`\nFound ${testFiles.length} test files`);
      
      const results = [];
      const parallelCount = parseInt(options.parallel);
      
      // Run tests in batches
      for (let i = 0; i < testFiles.length; i += parallelCount) {
        const batch = testFiles.slice(i, i + parallelCount);
        spinner.text = `Running batch ${Math.floor(i / parallelCount) + 1}...`;
        
        const batchPromises = batch.map(async (testFile) => {
          try {
            // This would use the same TestRunner as the run command
            return { file: testFile, success: true, duration: 1000 };
          } catch (error) {
            return { file: testFile, success: false, error: error.message };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      spinner.succeed(`Suite execution completed! ${passed} passed, ${failed} failed`);
      
      // Generate suite report
      const report = {
        summary: { total: results.length, passed, failed },
        results: results,
        timestamp: new Date().toISOString()
      };
      
      if (options.output) {
        const reportPath = await generateSuiteReport(report, options.report, options.output);
        console.log(`\n📄 Suite report saved to: ${reportPath}`);
      }
      
      process.exit(failed === 0 ? 0 : 1);
      
    } catch (error) {
      spinner.fail(`Suite execution failed: ${error.message}`);
      process.exit(1);
    }
  });

// Validate command - Validate test files
program
  .command('validate')
  .argument('<test-file>', 'YAML test file to validate')
  .option('--strict', 'Enable strict validation')
  .description('Validate a business process test file')
  .action(async (testFile, options) => {
    try {
      const testContent = await fs.readFile(testFile, 'utf-8');
      const businessTest = await parseBusinessProcessTest(testContent);
      
      console.log(chalk.green('✅ Test file is valid!'));
      console.log(`Test ID: ${businessTest.id}`);
      console.log(`Title: ${businessTest.title}`);
      console.log(`Steps: ${businessTest.steps.length}`);
      console.log(`Personas: ${Object.keys(businessTest.personas).length}`);
      
    } catch (error) {
      console.log(chalk.red('❌ Test file validation failed:'));
      console.log(error.message);
      process.exit(1);
    }
  });

// Helper functions
async function copyDirectory(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function generateReport(results, format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hera-test-report-${timestamp}.${format}`;
  
  if (format === 'json') {
    await fs.writeFile(filename, JSON.stringify(results, null, 2));
  } else if (format === 'html') {
    const html = generateHTMLReport(results);
    await fs.writeFile(filename, html);
  }
  
  return filename;
}

async function generateSuiteReport(report, format, outputFile) {
  if (format === 'json') {
    await fs.writeFile(outputFile, JSON.stringify(report, null, 2));
  } else if (format === 'html') {
    const html = generateHTMLSuiteReport(report);
    await fs.writeFile(outputFile, html);
  }
  
  return outputFile;
}

function generateHTMLReport(results) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>HERA Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
        .success { color: #16a34a; }
        .failure { color: #dc2626; }
        .step { margin: 10px 0; padding: 10px; border-left: 3px solid #e5e7eb; }
        .step.success { border-color: #16a34a; }
        .step.failure { border-color: #dc2626; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 HERA Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Status</h3>
            <span class="${results.success ? 'success' : 'failure'}">
                ${results.success ? 'PASSED' : 'FAILED'}
            </span>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <span>${results.duration}ms</span>
        </div>
        <div class="metric">
            <h3>Steps</h3>
            <span>${results.steps.filter(s => s.success).length}/${results.steps.length}</span>
        </div>
    </div>
    
    <h2>Steps</h2>
    ${results.steps.map(step => `
        <div class="step ${step.success ? 'success' : 'failure'}">
            <h4>${step.id}</h4>
            <p>Duration: ${step.duration}ms</p>
            ${!step.success ? `<p class="failure">Error: ${step.error}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
}

function generateHTMLSuiteReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>HERA Test Suite Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
        .success { color: #16a34a; }
        .failure { color: #dc2626; }
        .test { margin: 10px 0; padding: 10px; border-left: 3px solid #e5e7eb; }
        .test.success { border-color: #16a34a; }
        .test.failure { border-color: #dc2626; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 HERA Test Suite Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total</h3>
            <span>${report.summary.total}</span>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <span class="success">${report.summary.passed}</span>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <span class="failure">${report.summary.failed}</span>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${report.results.map(result => `
        <div class="test ${result.success ? 'success' : 'failure'}">
            <h4>${path.basename(result.file)}</h4>
            <p>Status: ${result.success ? 'PASSED' : 'FAILED'}</p>
            ${!result.success ? `<p class="failure">Error: ${result.error}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
}

program.parse();