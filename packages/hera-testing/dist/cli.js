#!/usr/bin/env node
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
const commander_1 = require("commander");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const hera_testing_1 = require("./hera-testing");
const program = new commander_1.Command();
program
    .name('hera-test')
    .description('HERA Testing Framework CLI')
    .version('1.0.0');
// Run command
program
    .command('run <testFile>')
    .description('Run a business process test from YAML/JSON file')
    .option('-o, --org-id <id>', 'Organization ID for testing')
    .option('-v, --verbose', 'Verbose output', true)
    .option('-d, --dry-run', 'Dry run (don\'t execute actual operations)')
    .option('-c, --continue-on-error', 'Continue running even if steps fail')
    .option('-t, --timeout <ms>', 'Timeout in milliseconds', '300000')
    .option('-r, --report <format>', 'Report format (console|json|html|markdown)', 'console')
    .option('-o, --output <file>', 'Output file for report')
    .action(async (testFile, options) => {
    try {
        const testing = new hera_testing_1.HeraTesting(options.orgId || 'test-org', {
            verbose: options.verbose,
            dryRun: options.dryRun,
            continueOnError: options.continueOnError,
            timeout: parseInt(options.timeout),
        });
        console.log(chalk_1.default.blue(`Running test: ${testFile}`));
        const result = await testing.runTestFile(testFile);
        await testing.generateReport(result, {
            format: options.report,
            outputPath: options.output,
            includeDetails: true,
        });
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
});
// Run suite command
program
    .command('suite <testDir>')
    .description('Run all tests in a directory')
    .option('-o, --org-id <id>', 'Organization ID for testing')
    .option('-p, --pattern <pattern>', 'File pattern to match', '*.test.yaml')
    .option('-r, --report <format>', 'Report format', 'html')
    .option('-o, --output <file>', 'Output file for report')
    .action(async (testDir, options) => {
    try {
        const testing = new hera_testing_1.HeraTesting(options.orgId || 'test-org');
        // Find test files
        const files = await fs.readdir(testDir);
        const testFiles = files
            .filter(file => file.match(options.pattern.replace('*', '.*')))
            .map(file => path.join(testDir, file));
        console.log(chalk_1.default.blue(`Running ${testFiles.length} test(s):`));
        testFiles.forEach(file => console.log(chalk_1.default.gray(`  - ${file}`)));
        const results = await testing.runTestSuite(testFiles);
        await testing.generateReport(results, {
            format: options.report,
            outputPath: options.output,
            includeDetails: true,
        });
        const passed = results.filter(r => r.success).length;
        process.exit(passed === results.length ? 0 : 1);
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
});
// Generate command
program
    .command('generate <testFile> <outputDir>')
    .description('Generate test code from DSL definition')
    .option('-t, --types <types>', 'Test types to generate (playwright,jest,pgtap,agent)', 'jest')
    .action(async (testFile, outputDir, options) => {
    try {
        const testing = new hera_testing_1.HeraTesting('test-org');
        const types = options.types.split(',');
        console.log(chalk_1.default.blue(`Generating tests from: ${testFile}`));
        console.log(chalk_1.default.gray(`Types: ${types.join(', ')}`));
        console.log(chalk_1.default.gray(`Output: ${outputDir}`));
        await fs.mkdir(outputDir, { recursive: true });
        await testing.generateTests(testFile, outputDir, types);
        console.log(chalk_1.default.green('✅ Test generation complete!'));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
});
// Validate command
program
    .command('validate <testFile>')
    .description('Validate DSL test definition')
    .action(async (testFile) => {
    try {
        const content = await fs.readFile(testFile, 'utf-8');
        const testing = new hera_testing_1.HeraTesting('test-org');
        const result = testing.parser.parseString(content, testFile.endsWith('.json') ? 'json' : 'yaml');
        console.log(chalk_1.default.green('✅ Test definition is valid!'));
        console.log(chalk_1.default.gray(`Test: ${result.metadata.name}`));
        console.log(chalk_1.default.gray(`Steps: ${result.steps.length}`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`❌ Validation failed: ${error.message}`));
        process.exit(1);
    }
});
// Init command - create sample test files
program
    .command('init <directory>')
    .description('Initialize HERA testing in a directory with sample files')
    .option('-i, --industry <industry>', 'Industry type (restaurant|healthcare|retail|salon)', 'restaurant')
    .action(async (directory, options) => {
    try {
        await fs.mkdir(directory, { recursive: true });
        // Create directory structure
        await fs.mkdir(path.join(directory, 'tests'), { recursive: true });
        await fs.mkdir(path.join(directory, 'fixtures'), { recursive: true });
        await fs.mkdir(path.join(directory, 'reports'), { recursive: true });
        // Create sample test based on industry
        const sampleTest = createSampleTest(options.industry);
        await fs.writeFile(path.join(directory, 'tests', `${options.industry}-order-to-cash.test.yaml`), sampleTest);
        // Create package.json
        const packageJson = {
            name: `hera-testing-${options.industry}`,
            version: '1.0.0',
            scripts: {
                'test': 'hera-test suite tests',
                'test:single': 'hera-test run',
                'generate': 'hera-test generate',
                'validate': 'hera-test validate'
            },
            dependencies: {
                '@hera/testing': '^1.0.0'
            }
        };
        await fs.writeFile(path.join(directory, 'package.json'), JSON.stringify(packageJson, null, 2));
        console.log(chalk_1.default.green(`✅ HERA testing initialized for ${options.industry}!`));
        console.log(chalk_1.default.gray(`Created:`));
        console.log(chalk_1.default.gray(`  - tests/${options.industry}-order-to-cash.test.yaml`));
        console.log(chalk_1.default.gray(`  - package.json`));
        console.log(chalk_1.default.gray(`  - Directory structure`));
        console.log(chalk_1.default.blue(`\\nNext steps:`));
        console.log(chalk_1.default.blue(`  cd ${directory}`));
        console.log(chalk_1.default.blue(`  npm install`));
        console.log(chalk_1.default.blue(`  npm test`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
});
function createSampleTest(industry) {
    const samples = {
        restaurant: `
version: "1.0"
metadata:
  name: "Restaurant Order-to-Cash Process"
  description: "Complete customer order processing from table order to payment"
  industry: "restaurant"
  process_type: "order-to-cash"
  tags: ["pos", "payment", "kitchen"]

setup:
  organization:
    name: "Mario's Test Restaurant"
    business_type: "restaurant"
  entities:
    - entity_type: "product"
      entity_name: "Margherita Pizza"
      entity_code: "PIZZA-001"
      smart_code: "HERA.REST.MENU.ENT.ITEM.v1"
      dynamic_fields:
        price: 28.50
        category: "main"
        preparation_time: 15
    - entity_type: "location"
      entity_name: "Table 5"
      entity_code: "TABLE-05"
      smart_code: "HERA.REST.LOC.ENT.TABLE.v1"
      dynamic_fields:
        seats: 4
        section: "main"

steps:
  - id: "customer"
    name: "Create walk-in customer"
    type: "create_entity"
    data:
      entity_type: "customer"
      entity_name: "Walk-in Customer"
      entity_code: "WALKIN-001"
      smart_code: "HERA.REST.CUST.ENT.DINER.v1"

  - id: "order"
    name: "Create table order"
    type: "create_transaction"
    data:
      transaction_type: "sale"
      transaction_code: "ORDER-001"
      smart_code: "HERA.REST.SALE.TXN.ORDER.v1"
      total_amount: 28.50
      from_entity_id: "{{customer.id}}"
      line_items:
        - line_entity_id: "{{setup.pizza.id}}"
          quantity: 1
          unit_price: 28.50
          line_amount: 28.50
    validations:
      - type: "exists"
        field: "id"
      - type: "equals"
        field: "total_amount"
        expected: 28.50

  - id: "payment"
    name: "Process payment"
    type: "create_transaction"
    data:
      transaction_type: "payment"
      transaction_code: "PAY-001"
      smart_code: "HERA.REST.PAY.TXN.CASH.v1"
      total_amount: 28.50
      from_entity_id: "{{customer.id}}"

  - id: "validate_order"
    name: "Validate order completion"
    type: "validate"
    validations:
      - type: "business_rule"
        field: "{{order.total_amount}}"
        oracle: "calculateProfitability"
        expected: "positive_margin"

teardown:
  clean_data: true
`,
        healthcare: `
version: "1.0"
metadata:
  name: "Healthcare Patient Visit Process"
  description: "Patient appointment scheduling to billing"
  industry: "healthcare"
  process_type: "custom"
  tags: ["appointment", "billing", "insurance"]

setup:
  organization:
    name: "Family Health Clinic"
    business_type: "healthcare"
  entities:
    - entity_type: "service"
      entity_name: "General Consultation"
      entity_code: "CONSULT-001"
      smart_code: "HERA.HLTH.SVC.ENT.PROCEDURE.v1"
      dynamic_fields:
        price: 150.00
        cpt_code: "99213"
        duration_minutes: 30

steps:
  - id: "patient"
    name: "Register new patient"
    type: "create_entity"
    data:
      entity_type: "patient"
      entity_name: "John Doe"
      entity_code: "PAT-001"
      smart_code: "HERA.HLTH.PAT.ENT.PROFILE.v1"
      dynamic_fields:
        date_of_birth: "1985-06-15"
        insurance_provider: "Emirates Health Insurance"

  - id: "appointment"
    name: "Schedule appointment"
    type: "create_transaction"
    data:
      transaction_type: "service"
      transaction_code: "APPT-001"
      smart_code: "HERA.HLTH.APPT.TXN.SCHEDULE.v1"
      total_amount: 150.00
      from_entity_id: "{{patient.id}}"

  - id: "billing"
    name: "Generate bill"
    type: "create_transaction"
    data:
      transaction_type: "invoice"
      transaction_code: "INV-001"
      smart_code: "HERA.HLTH.BILL.TXN.INVOICE.v1"
      total_amount: 150.00
      from_entity_id: "{{patient.id}}"

teardown:
  clean_data: true
`,
        retail: `
version: "1.0"
metadata:
  name: "Retail Sale Process"
  description: "Customer purchase from product selection to receipt"
  industry: "retail"
  process_type: "order-to-cash"

setup:
  organization:
    name: "Fashion Boutique"
    business_type: "retail"

steps:
  - id: "customer"
    name: "Create customer"
    type: "create_entity"
    data:
      entity_type: "customer"
      entity_name: "Sarah Johnson"
      entity_code: "CUST-001"
      smart_code: "HERA.RETAIL.CUST.ENT.SHOPPER.v1"

  - id: "sale"
    name: "Process sale"
    type: "create_transaction"
    data:
      transaction_type: "sale"
      transaction_code: "SALE-001"
      smart_code: "HERA.RETAIL.SALE.TXN.POS.v1"
      total_amount: 85.00
      from_entity_id: "{{customer.id}}"

teardown:
  clean_data: true
`,
        salon: `
version: "1.0"
metadata:
  name: "Salon Service Process"
  description: "Customer booking to service completion and payment"
  industry: "salon"
  process_type: "order-to-cash"

setup:
  organization:
    name: "Glamour Beauty Salon"
    business_type: "salon"

steps:
  - id: "customer"
    name: "Create customer"
    type: "create_entity"
    data:
      entity_type: "customer"
      entity_name: "Emma Wilson"
      entity_code: "CLIENT-001"
      smart_code: "HERA.SALON.CUST.ENT.CLIENT.v1"

  - id: "booking"
    name: "Create service booking"
    type: "create_transaction"
    data:
      transaction_type: "service"
      transaction_code: "BOOK-001"
      smart_code: "HERA.SALON.BOOK.TXN.APPOINTMENT.v1"
      total_amount: 120.00
      from_entity_id: "{{customer.id}}"

teardown:
  clean_data: true
`
    };
    return samples[industry] || samples.restaurant;
}
program.parse();
