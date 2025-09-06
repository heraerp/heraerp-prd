#!/usr/bin/env node

/**
 * Build with Automated Tests
 * 
 * Enhanced build process that automatically generates and runs tests
 * for CRUD modules before completing the build
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

const execAsync = promisify(exec);

/**
 * Detect CRUD modules in the codebase
 */
async function detectCrudModules() {
  const crudModules = [];
  
  // Check common CRUD locations
  const checkPaths = [
    'src/app',
    'src/app/api/v1'
  ];

  for (const checkPath of checkPaths) {
    const fullPath = path.join(process.cwd(), checkPath);
    if (!fs.existsSync(fullPath)) continue;

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Look for CRUD patterns
        const modulePath = path.join(fullPath, entry.name);
        const hasPage = fs.existsSync(path.join(modulePath, 'page.tsx'));
        const hasRoute = fs.existsSync(path.join(modulePath, 'route.ts'));
        
        // Check for data folders that indicate CRUD modules
        if (entry.name.includes('-data') || entry.name.includes('manage-')) {
          crudModules.push({
            name: entry.name,
            path: modulePath,
            entityType: entry.name.replace('-data', '').replace('manage-', '').replace(/-/g, '_')
          });
        } else if (hasPage || hasRoute) {
          // Check if it looks like a CRUD module by examining the content
          const isCrud = await checkIfCrudModule(modulePath);
          if (isCrud) {
            crudModules.push({
              name: entry.name,
              path: modulePath,
              entityType: entry.name.replace(/-/g, '_')
            });
          }
        }
      }
    }
  }

  return crudModules;
}

/**
 * Check if a module is a CRUD module by examining its content
 */
async function checkIfCrudModule(modulePath) {
  const crudIndicators = [
    'createEntity',
    'updateEntity',
    'deleteEntity',
    'getEntities',
    'DataTable',
    'EntityForm',
    'CRUD',
    'universalApi'
  ];

  try {
    // Check main files
    const filesToCheck = ['page.tsx', 'route.ts', 'components.tsx'];
    
    for (const file of filesToCheck) {
      const filePath = path.join(modulePath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for CRUD indicators
        for (const indicator of crudIndicators) {
          if (content.includes(indicator)) {
            return true;
          }
        }
      }
    }
  } catch (error) {
    // Ignore read errors
  }

  return false;
}

/**
 * Run tests for a CRUD module
 */
async function runCrudTests(module, options = {}) {
  const spinner = ora(`Testing ${module.name}...`).start();
  
  try {
    // Generate and run tests
    const { stdout, stderr } = await execAsync(
      `node scripts/auto-test-crud.js --entity ${module.entityType} --module ${module.name}`,
      { cwd: process.cwd() }
    );

    if (stderr && !stderr.includes('PASS')) {
      spinner.fail(`Tests failed for ${module.name}`);
      if (options.verbose) {
        console.error(stderr);
      }
      return { success: false, module: module.name, error: stderr };
    }

    spinner.succeed(`Tests passed for ${module.name}`);
    return { success: true, module: module.name };
  } catch (error) {
    spinner.fail(`Test execution failed for ${module.name}`);
    return { 
      success: false, 
      module: module.name, 
      error: error.message 
    };
  }
}

/**
 * Generate test report
 */
function generateTestReport(results, buildTime) {
  const report = {
    timestamp: new Date().toISOString(),
    buildTime,
    totalModules: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results.map(r => ({
      module: r.module,
      status: r.success ? 'PASSED' : 'FAILED',
      error: r.error
    }))
  };

  // Save report
  const reportPath = path.join(process.cwd(), 'test-results', 'crud-test-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * Main build process with integrated testing
 */
async function buildWithTests() {
  console.log(chalk.bold.blue('\n🏗️  HERA Build with Automated Tests\n'));

  const startTime = Date.now();
  const options = {
    skipTests: process.argv.includes('--skip-tests'),
    verbose: process.argv.includes('--verbose'),
    testOnly: process.argv.includes('--test-only')
  };

  try {
    // Step 1: Detect CRUD modules
    if (!options.skipTests) {
      const spinner = ora('Detecting CRUD modules...').start();
      const crudModules = await detectCrudModules();
      spinner.succeed(`Found ${crudModules.length} CRUD modules`);

      if (crudModules.length > 0) {
        console.log(chalk.bold('\nModules to test:'));
        crudModules.forEach(m => console.log(`  - ${m.name} (${m.entityType})`));

        // Step 2: Run tests for each module
        console.log(chalk.bold('\n🧪 Running automated tests...\n'));
        const testResults = [];

        for (const module of crudModules) {
          const result = await runCrudTests(module, options);
          testResults.push(result);
        }

        // Step 3: Generate test report
        const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const report = generateTestReport(testResults, buildTime);

        // Step 4: Check if all tests passed
        if (report.failed > 0) {
          console.log(chalk.red(`\n❌ Build failed: ${report.failed} test(s) failed`));
          console.log(chalk.dim(`   Report saved to: test-results/crud-test-report.json`));
          
          if (!options.testOnly) {
            process.exit(1);
          }
        } else {
          console.log(chalk.green(`\n✅ All tests passed! (${report.passed}/${report.totalModules})`));
        }
      } else {
        console.log(chalk.yellow('\n⚠️  No CRUD modules detected for testing'));
      }
    }

    // Step 5: Run the actual build (unless test-only mode)
    if (!options.testOnly) {
      console.log(chalk.bold('\n📦 Running production build...\n'));
      
      const buildSpinner = ora('Building application...').start();
      const { stdout, stderr } = await execAsync('npm run build');
      
      if (stderr && !stderr.includes('warn')) {
        buildSpinner.fail('Build failed');
        console.error(stderr);
        process.exit(1);
      }
      
      buildSpinner.succeed('Build completed successfully');
      
      if (options.verbose && stdout) {
        console.log('\nBuild output:');
        console.log(stdout);
      }
    }

    // Step 6: Final summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.bold.green(`\n✨ Build completed in ${totalTime}s\n`));

  } catch (error) {
    console.error(chalk.red('\n❌ Build failed:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildWithTests();
}

module.exports = {
  buildWithTests,
  detectCrudModules,
  runCrudTests
};