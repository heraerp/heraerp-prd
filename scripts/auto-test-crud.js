#!/usr/bin/env node

/**
 * Auto Test CRUD - Automated testing for HERA CRUD modules
 * 
 * This script automatically generates and runs comprehensive tests
 * for any CRUD module following HERA's universal architecture
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const ora = require('ora');

const execAsync = promisify(exec);

// Import the test generator
const { UniversalCrudTestGenerator, createTestConfig } = require('../src/lib/testing/universal-crud-test-generator');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    entityType: '',
    moduleName: '',
    skipRun: false,
    outputOnly: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--entity':
      case '-e':
        options.entityType = args[++i];
        break;
      case '--module':
      case '-m':
        options.moduleName = args[++i];
        break;
      case '--skip-run':
        options.skipRun = true;
        break;
      case '--output-only':
        options.outputOnly = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${chalk.bold.blue('HERA Auto Test CRUD')}

${chalk.bold('Usage:')}
  npm run test:crud -- --entity <entity-type> [options]
  node scripts/auto-test-crud.js --entity <entity-type> [options]

${chalk.bold('Options:')}
  -e, --entity <type>    Entity type to test (required)
  -m, --module <name>    Module name (optional, defaults to entity type)
  --skip-run             Generate tests only, don't run them
  --output-only          Only output test file path
  -v, --verbose          Show detailed output
  -h, --help             Show this help message

${chalk.bold('Examples:')}
  npm run test:crud -- --entity customer
  npm run test:crud -- --entity salon_service --module salon-services
  npm run test:crud -- --entity product --skip-run

${chalk.bold('Supported Entity Types:')}
  - customer
  - product
  - employee
  - salon_service
  - vendor
  - gl_account
  - Any custom entity type
  `);
}

/**
 * Detect CRUD configuration from existing code
 */
async function detectCrudConfig(entityType) {
  const spinner = ora('Detecting CRUD configuration...').start();
  
  try {
    // Try to find existing API routes or pages for this entity
    const possiblePaths = [
      `src/app/api/v1/${entityType}`,
      `src/app/${entityType}`,
      `src/components/${entityType}`,
      `src/app/${entityType.replace('_', '-')}`,
    ];

    let detectedConfig = {
      exists: false,
      dynamicFields: [],
      relationships: [],
      transactions: []
    };

    for (const checkPath of possiblePaths) {
      if (fs.existsSync(path.join(process.cwd(), checkPath))) {
        detectedConfig.exists = true;
        break;
      }
    }

    // Try to detect dynamic fields from code
    const searchPatterns = [
      `setDynamicField.*${entityType}`,
      `field_name.*${entityType}`,
      `dynamic.*${entityType}`
    ];

    // This is a simplified detection - in production, you'd parse the AST
    spinner.succeed('Configuration detected');
    return detectedConfig;
  } catch (error) {
    spinner.fail('Configuration detection failed');
    return { exists: false, dynamicFields: [], relationships: [], transactions: [] };
  }
}

/**
 * Generate comprehensive test configuration
 */
function generateTestConfig(entityType, moduleName, detectedConfig) {
  // Check for custom configuration file
  const customConfigPath = path.join(process.cwd(), 'scripts', 'test-configs', `${moduleName}.js`);
  if (fs.existsSync(customConfigPath)) {
    console.log(chalk.green(`✓ Using custom configuration for ${moduleName}`));
    return require(customConfigPath);
  }

  // Special configurations for known entity types
  const specialConfigs = {
    salon_service: {
      displayName: 'Salon Service',
      smartCodePrefix: 'HERA.SALON.SERVICE',
      dynamicFields: [
        {
          name: 'price',
          type: 'number',
          testValue: 150.00,
          smartCode: 'HERA.SALON.SERVICE.FIELD.PRICE.v1'
        },
        {
          name: 'duration',
          type: 'number',
          testValue: 45,
          smartCode: 'HERA.SALON.SERVICE.FIELD.DURATION.v1'
        },
        {
          name: 'description',
          type: 'text',
          testValue: 'Premium hair styling service',
          smartCode: 'HERA.SALON.SERVICE.FIELD.DESC.v1'
        }
      ],
      relationships: [
        {
          type: 'belongs_to_category',
          targetEntityType: 'service_category',
          smartCode: 'HERA.SALON.REL.SERVICE_CATEGORY.v1'
        }
      ],
      transactions: [
        {
          type: 'service_booking',
          smartCode: 'HERA.SALON.TXN.BOOKING.v1',
          hasLineItems: true
        }
      ]
    },
    vendor: {
      displayName: 'Vendor',
      smartCodePrefix: 'HERA.SCM.VENDOR',
      dynamicFields: [
        {
          name: 'contact_email',
          type: 'text',
          testValue: 'vendor@example.com',
          smartCode: 'HERA.SCM.VENDOR.FIELD.EMAIL.v1'
        },
        {
          name: 'payment_terms',
          type: 'text',
          testValue: 'NET30',
          smartCode: 'HERA.SCM.VENDOR.FIELD.TERMS.v1'
        }
      ],
      transactions: [
        {
          type: 'purchase_order',
          smartCode: 'HERA.SCM.TXN.PO.v1',
          hasLineItems: true
        }
      ]
    },
    gl_account: {
      displayName: 'GL Account',
      smartCodePrefix: 'HERA.FIN.GL.ACCOUNT',
      dynamicFields: [
        {
          name: 'account_type',
          type: 'text',
          testValue: 'asset',
          smartCode: 'HERA.FIN.GL.FIELD.TYPE.v1'
        },
        {
          name: 'normal_balance',
          type: 'text',
          testValue: 'debit',
          smartCode: 'HERA.FIN.GL.FIELD.BALANCE.v1'
        }
      ],
      relationships: [
        {
          type: 'parent_of',
          targetEntityType: 'gl_account',
          smartCode: 'HERA.FIN.GL.REL.HIERARCHY.v1'
        }
      ]
    }
  };

  const baseConfig = createTestConfig(entityType, {
    moduleName: moduleName || entityType.toLowerCase().replace(/_/g, '-'),
    ...specialConfigs[entityType]
  });

  // Merge with detected configuration
  if (detectedConfig.dynamicFields.length > 0) {
    baseConfig.dynamicFields = [...baseConfig.dynamicFields, ...detectedConfig.dynamicFields];
  }

  return baseConfig;
}

/**
 * Main execution
 */
async function main() {
  console.log(chalk.bold.blue('\n🧪 HERA Auto Test CRUD Generator\n'));

  const options = parseArgs();

  // Validate required options
  if (!options.entityType) {
    console.error(chalk.red('Error: Entity type is required'));
    showHelp();
    process.exit(1);
  }

  try {
    // Step 1: Detect existing configuration
    const detectedConfig = await detectCrudConfig(options.entityType);
    
    if (!detectedConfig.exists && !options.skipRun) {
      console.log(chalk.yellow(`⚠️  Warning: No existing code found for entity type '${options.entityType}'`));
      console.log(chalk.yellow('  Tests will be generated based on default configuration.'));
    }

    // Step 2: Generate test configuration
    const testConfig = generateTestConfig(
      options.entityType, 
      options.moduleName,
      detectedConfig
    );

    if (options.verbose) {
      console.log(chalk.bold('\nTest Configuration:'));
      console.log(JSON.stringify(testConfig, null, 2));
    }

    // Step 3: Generate tests
    const generator = new UniversalCrudTestGenerator(testConfig);
    
    const spinner = ora('Generating test file...').start();
    const testPath = await generator.generateTestFile();
    spinner.succeed(`Test file generated: ${chalk.green(path.basename(testPath))}`);

    if (options.outputOnly) {
      console.log(testPath);
      process.exit(0);
    }

    // Step 4: Run tests (unless skipped)
    if (!options.skipRun) {
      console.log('\n' + chalk.bold('Running tests...'));
      const testResult = await generator.runTests();

      if (testResult.success) {
        console.log(chalk.green('\n✅ All tests passed!'));
        
        // Show summary
        const summary = extractTestSummary(testResult.output);
        if (summary) {
          console.log(chalk.bold('\nTest Summary:'));
          console.log(summary);
        }
      } else {
        console.log(chalk.red('\n❌ Some tests failed'));
        if (options.verbose) {
          console.log('\nTest Output:');
          console.log(testResult.output);
        }
        process.exit(1);
      }
    } else {
      console.log(chalk.yellow('\n⏭️  Test execution skipped'));
      console.log(chalk.dim(`   Run tests manually: npx jest ${testPath}`));
    }

    // Step 5: Integration tips
    console.log(chalk.bold('\n📝 Integration Tips:'));
    console.log('1. Add to package.json scripts:');
    console.log(chalk.dim(`   "test:${testConfig.moduleName}": "jest tests/generated/${testConfig.moduleName}-crud.test.js"`));
    console.log('2. Include in CI/CD pipeline');
    console.log('3. Run after each CRUD module build');

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Extract test summary from Jest output
 */
function extractTestSummary(output) {
  const lines = output.split('\n');
  const summaryLines = [];
  let inSummary = false;

  for (const line of lines) {
    if (line.includes('Test Suites:') || line.includes('Tests:')) {
      inSummary = true;
    }
    if (inSummary && line.trim()) {
      summaryLines.push(line);
    }
    if (line.includes('Time:')) {
      break;
    }
  }

  return summaryLines.join('\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = {
  generateTestConfig,
  detectCrudConfig
};