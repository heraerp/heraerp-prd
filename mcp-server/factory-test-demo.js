#!/usr/bin/env node

/**
 * HERA Factory Test Demo
 * Demonstrates complete test generation and execution flow
 */

const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');
const ora = require('ora');
require('dotenv').config();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class FactoryTestDemo {
  constructor() {
    this.orgId = process.env.DEFAULT_ORGANIZATION_ID;
  }

  async run() {
    console.log(chalk.magenta('\n🏭 HERA Universal Factory - Testing Demo\n'));

    try {
      // Step 1: Create a demo module
      console.log(chalk.cyan('Step 1: Creating Restaurant Loyalty Module'));
      const module = await this.createDemoModule();
      
      // Step 2: Generate tests
      console.log(chalk.cyan('\nStep 2: Generating Comprehensive Test Suite'));
      const tests = await this.generateTests(module);
      
      // Step 3: Run factory pipeline with tests
      console.log(chalk.cyan('\nStep 3: Running Factory Pipeline with Testing'));
      const pipeline = await this.runPipelineWithTests(module);
      
      // Step 4: Show results
      console.log(chalk.cyan('\nStep 4: Test Results Summary'));
      await this.showTestResults(pipeline);

      console.log(chalk.green('\n✅ Demo completed successfully!'));
      console.log(chalk.gray('\nExplore the generated tests in:'));
      console.log(chalk.white('  - tests/api/restaurant-loyalty/'));
      console.log(chalk.white('  - tests/e2e/restaurant-loyalty/'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Demo failed:'), error.message);
    }
  }

  async createDemoModule() {
    const spinner = ora('Creating module...').start();

    const moduleData = {
      entity_type: 'module',
      entity_name: 'Restaurant Loyalty',
      entity_code: 'MODULE-RESTAURANT-LOYALTY',
      smart_code: 'HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0',
      organization_id: this.orgId,
      metadata: {
        industry: 'restaurant',
        description: 'Customer loyalty and rewards management',
        author: 'HERA Factory Demo'
      }
    };

    const { data: module, error } = await supabase
      .from('core_entities')
      .insert(moduleData)
      .select()
      .single();

    if (error) throw error;

    // Create module manifest
    const manifest = {
      name: 'Restaurant Loyalty',
      smart_code: module.smart_code,
      version: '1.0.0',
      entrypoints: {
        api: ['/api/v1/loyalty', '/api/v1/rewards'],
        ui: ['dna:LoyaltyDashboard', 'dna:CustomerRewards', 'dna:PointsHistory']
      },
      depends_on: [
        { smart_code: 'HERA.UNIVERSAL.CAPABILITY.API.POST-TRANSACTIONS.v1_0', version: '>=1.0' }
      ],
      ucr_packs: ['HERA.RESTAURANT.UCR.LOYALTY.v1_0'],
      guardrail_packs: ['HERA.UNIVERSAL.GUARDRAIL.PACK.GENERAL.v1_0'],
      release_channels: ['beta', 'stable'],
      test_config: {
        matrix: {
          personas: ['cashier', 'manager', 'customer'],
          browsers: ['chromium', 'webkit'],
          datasets: ['happy_path', 'edge_cases', 'high_volume'],
          locales: ['en-US', 'es-MX']
        },
        coverage: {
          unit: 0.9,
          e2e: 0.8,
          overall: 0.85
        }
      }
    };

    await supabase
      .from('core_dynamic_data')
      .insert({
        entity_id: module.id,
        field_name: 'module_manifest',
        field_value_text: JSON.stringify(manifest, null, 2),
        smart_code: 'HERA.UNIVERSAL.MODULE.MANIFEST.v1',
        organization_id: this.orgId
      });

    spinner.succeed('Module created: ' + chalk.green(module.smart_code));
    return module;
  }

  async generateTests(module) {
    const spinner = ora('Generating test suite...').start();

    // Simulate test generation
    const testFiles = [
      // API Tests
      'tests/api/restaurant-loyalty/loyalty.spec.ts',
      'tests/api/restaurant-loyalty/rewards.spec.ts',
      'tests/api/restaurant-loyalty/points.spec.ts',
      'tests/api/restaurant-loyalty/performance.spec.ts',
      'tests/api/restaurant-loyalty/contract.spec.ts',
      
      // E2E Tests
      'tests/e2e/restaurant-loyalty/loyalty-dashboard.spec.ts',
      'tests/e2e/restaurant-loyalty/earn-points.spec.ts',
      'tests/e2e/restaurant-loyalty/redeem-rewards.spec.ts',
      'tests/e2e/restaurant-loyalty/customer-portal.spec.ts',
      'tests/e2e/restaurant-loyalty/accessibility.spec.ts',
      
      // Shared Helpers
      'tests/shared/http.ts',
      'tests/shared/builders.ts',
      'tests/shared/assertions.ts',
      
      // Configs
      'jest.config.ts',
      'playwright.config.ts',
      '.github/workflows/test.yml'
    ];

    // Store test suite reference
    const { data: testSuite, error } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'test_suite',
        entity_name: `${module.entity_name} Test Suite`,
        entity_code: `TEST-${module.entity_code}`,
        smart_code: `HERA.UNIVERSAL.TESTSUITE.${module.entity_code}.v1_0`,
        organization_id: this.orgId,
        metadata: {
          module_id: module.id,
          test_files: testFiles,
          coverage_target: 0.85,
          test_matrix: {
            personas: ['cashier', 'manager', 'customer'],
            browsers: ['chromium', 'webkit'],
            datasets: ['happy_path', 'edge_cases']
          }
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Create relationship
    await supabase
      .from('core_relationships')
      .insert({
        from_entity_id: module.id,
        to_entity_id: testSuite.id,
        relationship_type: 'validated_by',
        smart_code: 'HERA.UNIVERSAL.REL.VALIDATED_BY.v1',
        organization_id: this.orgId
      });

    spinner.succeed(`Generated ${testFiles.length} test files`);
    
    // Show generated files
    console.log(chalk.gray('\n  Generated files:'));
    testFiles.forEach(file => {
      const icon = file.includes('.spec.ts') ? '🧪' : 
                   file.includes('.yml') ? '⚙️' : '📁';
      console.log(chalk.gray(`  ${icon}  ${file}`));
    });

    return testSuite;
  }

  async runPipelineWithTests(module) {
    console.log(chalk.yellow('\n🔄 Running Factory Pipeline...\n'));

    // Create pipeline transaction
    const { data: pipeline, error: pipelineError } = await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'factory_pipeline',
        transaction_code: `PIPELINE-DEMO-${Date.now()}`,
        smart_code: 'HERA.UNIVERSAL.FACTORY.PIPELINE.RUN.v1_0',
        organization_id: this.orgId,
        metadata: {
          module_smart_code: module.smart_code,
          params: {
            test_matrix: ['unit', 'contract', 'e2e', 'security'],
            channels: ['beta'],
            compliance_profiles: ['GENERAL']
          }
        }
      })
      .select()
      .single();

    if (pipelineError) throw pipelineError;

    // Simulate pipeline stages
    const stages = [
      { name: 'PLAN', duration: 2000 },
      { name: 'DRAFT', duration: 3000 },
      { name: 'BUILD', duration: 5000 },
      { name: 'TEST', duration: 8000 },  // Longer for testing
      { name: 'COMPLY', duration: 3000 },
      { name: 'PACKAGE', duration: 2000 },
      { name: 'RELEASE', duration: 2000 }
    ];

    for (const [index, stage] of stages.entries()) {
      const spinner = ora(`${stage.name} stage...`).start();
      
      // Special handling for TEST stage
      if (stage.name === 'TEST') {
        await this.runTestStage(pipeline.id, spinner);
      } else {
        await new Promise(resolve => setTimeout(resolve, stage.duration));
        
        // Record stage completion
        await supabase
          .from('universal_transaction_lines')
          .insert({
            transaction_id: pipeline.id,
            line_type: 'pipeline_stage',
            line_number: index + 1,
            metadata: {
              stage: stage.name,
              status: 'PASSED',
              duration_ms: stage.duration,
              completed_at: new Date().toISOString()
            }
          });
      }
      
      spinner.succeed(`${stage.name} completed`);
    }

    return pipeline;
  }

  async runTestStage(pipelineId, spinner) {
    spinner.text = 'Running unit tests...';
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create TEST transaction
    const { data: testTxn } = await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'factory_test',
        transaction_code: `TEST-${Date.now()}`,
        smart_code: 'HERA.UNIVERSAL.FACTORY.TEST.v1_0',
        organization_id: this.orgId,
        metadata: {
          pipeline_id: pipelineId,
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    // Simulate test execution
    const testResults = [
      {
        type: 'STEP.UNIT',
        name: 'Unit Tests (Jest)',
        duration: 3421,
        passed: 145,
        failed: 2,
        coverage: 0.92,
        status: 'PASSED'
      },
      {
        type: 'STEP.CONTRACT',
        name: 'Contract Tests',
        duration: 1234,
        passed: 24,
        failed: 0,
        coverage: null,
        status: 'PASSED'
      },
      {
        type: 'STEP.E2E',
        name: 'E2E Tests (Playwright)',
        duration: 8765,
        passed: 38,
        failed: 1,
        coverage: 0.86,
        status: 'PASSED'
      },
      {
        type: 'STEP.SECURITY',
        name: 'Security Scan',
        duration: 2100,
        passed: 1,
        failed: 0,
        coverage: null,
        status: 'PASSED'
      }
    ];

    for (const [index, result] of testResults.entries()) {
      spinner.text = `Running ${result.name}...`;
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Record test result
      await supabase
        .from('universal_transaction_lines')
        .insert({
          transaction_id: testTxn.id,
          line_type: result.type,
          line_number: index + 1,
          metadata: {
            type: result.type,
            status: result.status,
            duration_ms: result.duration,
            passed: result.passed,
            failed: result.failed,
            coverage: result.coverage,
            artifacts: {
              coverage_uri: result.coverage ? `s3://artifacts/coverage-${index}.lcov` : null,
              report_uri: `s3://artifacts/report-${index}.html`
            }
          }
        });
    }

    // Create stage line for TEST
    await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: pipelineId,
        line_type: 'pipeline_stage',
        line_number: 4,
        metadata: {
          stage: 'TEST',
          status: 'PASSED',
          duration_ms: 15520,
          test_transaction_id: testTxn.id,
          summary: {
            total_tests: 208,
            passed: 205,
            failed: 3,
            coverage: 0.89
          }
        }
      });
  }

  async showTestResults(pipeline) {
    // Get test results
    const { data: testLines } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('line_type', 'pipeline_stage')
      .eq('metadata->>stage', 'TEST')
      .single();

    const summary = testLines.metadata.summary;

    console.log(chalk.white('\n📊 Test Execution Summary'));
    console.log(chalk.white('═══════════════════════════'));
    
    console.log(chalk.gray('\nTest Suites:'));
    console.log(`  ${chalk.green('✓')} Unit Tests (Jest)      - 145/147 passed (${chalk.green('92% coverage')})`);
    console.log(`  ${chalk.green('✓')} Contract Tests         - 24/24 passed`);
    console.log(`  ${chalk.yellow('⚠')} E2E Tests (Playwright) - 38/39 passed (${chalk.yellow('86% coverage')})`);
    console.log(`  ${chalk.green('✓')} Security Scan          - No vulnerabilities found`);
    
    console.log(chalk.gray('\nOverall Results:'));
    console.log(`  Total Tests: ${chalk.white(summary.total_tests)}`);
    console.log(`  Passed: ${chalk.green(summary.passed)}`);
    console.log(`  Failed: ${chalk.red(summary.failed)}`);
    console.log(`  Coverage: ${chalk.cyan(summary.coverage * 100 + '%')}`);
    
    console.log(chalk.gray('\nArtifacts Generated:'));
    console.log('  📁 coverage/lcov.info');
    console.log('  📁 coverage/html/index.html');
    console.log('  📁 playwright-report/index.html');
    console.log('  📁 screenshots/ (12 files)');
    console.log('  📁 videos/ (3 files)');
    console.log('  📁 junit-results.xml');
    
    console.log(chalk.gray('\nGuardrail Evaluation:'));
    console.log(`  ${chalk.green('✓')} Coverage threshold met (required: 85%, actual: 89%)`);
    console.log(`  ${chalk.green('✓')} All contract tests passed`);
    console.log(`  ${chalk.green('✓')} No security vulnerabilities`);
    console.log(`  ${chalk.yellow('⚠')} Minor E2E failures (non-blocking for beta)`);
    
    console.log(chalk.green('\n🎉 Module approved for BETA release!'));
  }
}

// Run the demo
if (require.main === module) {
  new FactoryTestDemo().run();
}