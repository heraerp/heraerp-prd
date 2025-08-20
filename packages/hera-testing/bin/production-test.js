#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
require('dotenv').config();

// Import the compiled modules (will be available after build)
let parseBusinessProcessTest, ProductionTestRunner;

try {
  const parser = require('../dist/dsl/parser');
  const runner = require('../dist/runners/production-runner');
  parseBusinessProcessTest = parser.parseBusinessProcessTest;
  ProductionTestRunner = runner.ProductionTestRunner;
} catch (error) {
  console.error(chalk.red('❌ HERA Testing Framework not built. Run: npm run build'));
  console.error(chalk.red('Or compile production runner: npx tsc src/runners/production-runner.ts --outDir dist --moduleResolution node --esModuleInterop'));
  process.exit(1);
}

program
  .name('production-test')
  .description('HERA Production Test Runner - Creates Real Data in Supabase')
  .version('1.0.0');

// Run salon production test command
program
  .command('salon')
  .argument('[test-file]', 'YAML test file to run', 'examples/salon-appointment-booking.yaml')
  .option('--org-id <id>', 'Organization ID for test execution')
  .option('--debug', 'Enable debug mode with detailed logging')
  .option('--keep-data', 'Keep created data (skip cleanup)')
  .description('Run salon production test with real Supabase data')
  .action(async (testFile, options) => {
    console.log(chalk.cyan('🧪 HERA PRODUCTION Testing Framework'));
    console.log(chalk.cyan('🔥 Creating REAL data in Supabase'));
    console.log(chalk.cyan('====================================='));
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let organizationId = options.orgId || process.env.DEFAULT_ORGANIZATION_ID || process.env.HERA_ORG_ID;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(chalk.red('❌ Missing Supabase configuration'));
      console.error('Required environment variables:');
      console.error('  - NEXT_PUBLIC_SUPABASE_URL');
      console.error('  - SUPABASE_SERVICE_ROLE_KEY');
      console.error('  - DEFAULT_ORGANIZATION_ID (optional)');
      console.error('');
      console.error('Create .env file or export these variables');
      process.exit(1);
    }
    
    if (!organizationId) {
      console.error(chalk.red('❌ No organization ID provided'));
      console.error('Use --org-id <id> or set DEFAULT_ORGANIZATION_ID environment variable');
      process.exit(1);
    }
    
    try {
      // Check if test file exists
      const fullPath = path.resolve(testFile);
      if (!fs.existsSync(fullPath)) {
        console.error(chalk.red(`❌ Test file not found: ${fullPath}`));
        process.exit(1);
      }
      
      console.log(`📄 Test file: ${testFile}`);
      console.log(`🏢 Organization ID: ${organizationId}`);
      console.log(`🔌 Supabase URL: ${supabaseUrl}`);
      console.log(`🐛 Debug mode: ${options.debug ? 'ON' : 'OFF'}`);
      console.log(`🗑️  Cleanup: ${options.keepData ? 'SKIP' : 'ENABLED'}`);
      console.log('');
      
      // Confirm production run
      if (process.env.NODE_ENV === 'production') {
        console.log(chalk.yellow('⚠️  PRODUCTION ENVIRONMENT DETECTED'));
        console.log(chalk.yellow('This will create REAL data in your production database!'));
        console.log('');
      }
      
      // Read and parse test file
      const testContent = fs.readFileSync(fullPath, 'utf-8');
      const businessTest = await parseBusinessProcessTest(testContent);
      
      // Override organization ID in test context
      businessTest.context.organization_id = organizationId;
      
      console.log(chalk.green(`✅ Test parsed successfully: ${businessTest.id}`));
      console.log(`📋 Title: ${businessTest.title}`);
      console.log(`🏭 Industry: ${businessTest.industry}`);
      console.log(`👥 Personas: ${Object.keys(businessTest.personas).length}`);
      console.log(`📝 Steps: ${businessTest.steps.length}`);
      console.log(`🎯 Assertions: ${businessTest.assertions.length}`);
      console.log('');
      
      // Create and run production test
      const runner = new ProductionTestRunner({
        supabaseUrl,
        supabaseServiceKey,
        organizationId,
        debug: options.debug
      });
      
      console.log(chalk.magenta('🚀 Starting PRODUCTION test execution...'));
      console.log('');
      
      const result = await runner.runTest(businessTest);
      
      // Display results
      console.log('');
      console.log(chalk.cyan('📊 PRODUCTION Test Results:'));
      console.log('=============================');
      console.log(`Status: ${result.success ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED')}`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Steps completed: ${result.steps.length}`);
      console.log('');
      
      if (result.steps.length > 0) {
        console.log(chalk.cyan('📋 Step Results:'));
        result.steps.forEach(step => {
          const status = step.success ? '✅' : '❌';
          console.log(`  ${status} ${step.id} (${step.duration}ms)`);
          if (step.actions) {
            step.actions.forEach(action => {
              const actionStatus = action.success ? '✅' : '❌';
              const id = action.created_id ? ` [${action.created_id}]` : '';
              console.log(`    ${actionStatus} ${action.action_type}${id}`);
            });
          }
        });
        console.log('');
      }
      
      // Show created data summary
      if (result.createdData) {
        console.log(chalk.green('🔥 REAL DATA CREATED IN SUPABASE:'));
        console.log('=====================================');
        console.log(`📄 Entities: ${result.createdData.entities.length}`);
        if (result.createdData.entities.length > 0) {
          result.createdData.entities.forEach(id => console.log(`  - ${id}`));
        }
        console.log(`💰 Transactions: ${result.createdData.transactions.length}`);
        if (result.createdData.transactions.length > 0) {
          result.createdData.transactions.forEach(id => console.log(`  - ${id}`));
        }
        console.log(`🔗 Relationships: ${result.createdData.relationships.length}`);
        if (result.createdData.relationships.length > 0) {
          result.createdData.relationships.forEach(id => console.log(`  - ${id}`));
        }
        console.log(`📝 Dynamic Fields: ${result.createdData.dynamic_fields.length}`);
        if (result.createdData.dynamic_fields.length > 0) {
          result.createdData.dynamic_fields.forEach(field => 
            console.log(`  - ${field.entity_id}.${field.field_name}`)
          );
        }
        console.log('');
      }
      
      console.log(`💬 ${result.message}`);
      
      // Show salon-specific insights
      if (businessTest.industry === 'salon') {
        console.log('');
        console.log(chalk.magenta('💅 Salon PRODUCTION Data Created:'));
        console.log('====================================');
        console.log('✅ Customer profile with contact info');
        console.log('✅ Stylist employee with commission rate');
        console.log('✅ Service offerings with pricing');
        console.log('✅ Product inventory with cost tracking');
        console.log('✅ Complete appointment workflow');
        console.log('✅ Payment transaction with commission');
        console.log('✅ Status workflow validation');
        console.log('');
        console.log(chalk.yellow('🎯 You can now view this data in:'));
        console.log(`   - Supabase Dashboard: ${supabaseUrl.replace('/rest/v1', '')}/project/_/editor`);
        console.log(`   - HERA App: View appointment, customer, and transaction records`);
        console.log(`   - Organization: ${organizationId}`);
      }
      
      if (options.keepData) {
        console.log('');
        console.log(chalk.yellow('🗄️  DATA PRESERVED: Test data kept in database'));
        console.log('Use Supabase dashboard to view or manually delete if needed');
      }
      
      process.exit(result.success ? 0 : 1);
      
    } catch (error) {
      console.error(chalk.red('❌ Production test execution failed:'));
      console.error(error.message);
      
      if (options.debug && error.stack) {
        console.error('');
        console.error('Stack trace:');
        console.error(error.stack);
      }
      
      if (error.errors && Array.isArray(error.errors)) {
        console.log('');
        console.log(chalk.red('Validation errors:'));
        error.errors.forEach(err => console.log(`  - ${err}`));
      }
      
      process.exit(1);
    }
  });

// Environment check command
program
  .command('check-env')
  .description('Check environment configuration for production testing')
  .action(() => {
    console.log(chalk.cyan('🔍 Environment Configuration Check'));
    console.log('==================================');
    
    const checks = [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
      { name: 'DEFAULT_ORGANIZATION_ID', value: process.env.DEFAULT_ORGANIZATION_ID || process.env.HERA_ORG_ID },
      { name: 'NODE_ENV', value: process.env.NODE_ENV }
    ];
    
    let allGood = true;
    
    checks.forEach(check => {
      if (check.value) {
        const displayValue = check.name.includes('KEY') ? 
          `${check.value.substring(0, 10)}...${check.value.substring(check.value.length - 4)}` : 
          check.value;
        console.log(`✅ ${check.name}: ${displayValue}`);
      } else {
        console.log(`❌ ${check.name}: Not set`);
        allGood = false;
      }
    });
    
    console.log('');
    
    if (allGood) {
      console.log(chalk.green('🎉 Environment configuration is complete!'));
      console.log('Ready to run production tests with real Supabase data.');
    } else {
      console.log(chalk.red('❌ Environment configuration incomplete'));
      console.log('Set missing environment variables before running production tests.');
    }
  });

program.parse();