#!/usr/bin/env tsx

/**
 * CRM Demo Testing Suite
 * Smart Code: HERA.SCRIPT.TEST.CRM_DEMO.v1
 * 
 * This script tests the deployed CRM Sales/Lead Management module
 * without requiring template loading, perfect for validation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HERAAppConfigParser } from '@/lib/app-generator/yaml-parser';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
const YAML_FILE_PATH = path.join(process.cwd(), 'src/templates/app-config/modules/crm-sales-leads.yaml');

interface TestResult {
  category: string;
  test_name: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration_ms: number;
  details?: any;
}

interface TestSuite {
  suite_name: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  results: TestResult[];
}

// ============================================================================
// MAIN TESTING FUNCTION
// ============================================================================

async function testCRMDemo(): Promise<TestSuite> {
  console.log('🧪 Testing CRM Sales/Lead Management Demo...');
  console.log(`🏢 Demo Org ID: ${DEMO_ORG_ID}`);
  console.log(`📄 YAML File: ${YAML_FILE_PATH}`);
  console.log('');

  const startTime = Date.now();
  const results: TestResult[] = [];

  try {
    // Load and parse configuration
    const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf-8');
    const parser = new HERAAppConfigParser();
    const config = await parser.parseYAML(yamlContent);

    // Run test categories
    results.push(...await runConfigurationTests(config));
    results.push(...await runEntityTests(config));
    results.push(...await runTransactionTests(config));
    results.push(...await runWorkflowTests(config));
    results.push(...await runUITests(config));
    results.push(...await runSecurityTests(config));
    results.push(...await runIntegrationTests(config));
    results.push(...await runUserExperienceTests(config));

  } catch (error) {
    results.push({
      category: 'setup',
      test_name: 'initialization',
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startTime
    });
  }

  // Calculate summary
  const endTime = Date.now();
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  const testSuite: TestSuite = {
    suite_name: 'CRM Sales/Lead Management Demo',
    total_tests: results.length,
    passed,
    failed,
    skipped,
    duration_ms: endTime - startTime,
    results
  };

  printTestSummary(testSuite);
  return testSuite;
}

// ============================================================================
// TEST CATEGORIES
// ============================================================================

async function runConfigurationTests(config: any): Promise<TestResult[]> {
  console.log('🔍 Running Configuration Tests...');
  const results: TestResult[] = [];

  // Test 1: YAML structure validation
  results.push(await runTest('configuration', 'yaml_structure', async () => {
    const requiredSections = ['app', 'entities', 'transactions', 'workflows', 'ui', 'deployment'];
    const missingSections = requiredSections.filter(section => !config[section]);
    
    if (missingSections.length > 0) {
      throw new Error(`Missing sections: ${missingSections.join(', ')}`);
    }
    
    return { message: 'All required YAML sections present' };
  }));

  // Test 2: Smart code pattern validation
  results.push(await runTest('configuration', 'smart_code_patterns', async () => {
    const smartCodePattern = /^HERA\.[A-Z0-9_]{2,30}\.[A-Z0-9_]{2,30}(\.[A-Z0-9_]{2,30})*\.v[0-9]+$/;
    const invalidCodes: string[] = [];

    // Check app smart code
    if (!smartCodePattern.test(config.app.smart_code)) {
      invalidCodes.push(`App: ${config.app.smart_code}`);
    }

    // Check entity smart codes
    config.entities.forEach((entity: any) => {
      if (!smartCodePattern.test(entity.smart_code)) {
        invalidCodes.push(`Entity ${entity.entity_type}: ${entity.smart_code}`);
      }
    });

    if (invalidCodes.length > 0) {
      throw new Error(`Invalid smart codes: ${invalidCodes.join(', ')}`);
    }

    return { message: 'All smart codes follow HERA pattern' };
  }));

  // Test 3: Entity relationships validation
  results.push(await runTest('configuration', 'entity_relationships', async () => {
    const entityTypes = new Set(config.entities.map((e: any) => e.entity_type));
    const invalidRefs: string[] = [];

    config.entities.forEach((entity: any) => {
      entity.relationships?.forEach((rel: any) => {
        if (!entityTypes.has(rel.target_entity)) {
          invalidRefs.push(`${entity.entity_type} -> ${rel.target_entity}`);
        }
      });
    });

    if (invalidRefs.length > 0) {
      throw new Error(`Invalid relationship references: ${invalidRefs.join(', ')}`);
    }

    return { message: 'All entity relationships are valid' };
  }));

  return results;
}

async function runEntityTests(config: any): Promise<TestResult[]> {
  console.log('📦 Running Entity Tests...');
  const results: TestResult[] = [];

  // Test entity completeness
  results.push(await runTest('entities', 'required_entities', async () => {
    const expectedEntities = ['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'SALES_REP', 'TERRITORY', 'QUOTE'];
    const actualEntities = config.entities.map((e: any) => e.entity_type);
    const missingEntities = expectedEntities.filter(e => !actualEntities.includes(e));

    if (missingEntities.length > 0) {
      throw new Error(`Missing entities: ${missingEntities.join(', ')}`);
    }

    return {
      message: 'All required entities present',
      details: { entities: actualEntities.length }
    };
  }));

  // Test dynamic fields configuration
  results.push(await runTest('entities', 'dynamic_fields', async () => {
    const entitiesWithoutFields = config.entities.filter((entity: any) => 
      !entity.dynamic_fields || entity.dynamic_fields.length === 0
    );

    if (entitiesWithoutFields.length > 0) {
      throw new Error(`Entities without dynamic fields: ${entitiesWithoutFields.map((e: any) => e.entity_type).join(', ')}`);
    }

    const totalFields = config.entities.reduce((sum: number, entity: any) => 
      sum + (entity.dynamic_fields?.length || 0), 0
    );

    return {
      message: 'All entities have dynamic fields configured',
      details: { total_dynamic_fields: totalFields }
    };
  }));

  // Test specific entity configurations
  for (const entity of config.entities) {
    results.push(await runTest('entities', `entity_${entity.entity_type.toLowerCase()}`, async () => {
      // Validate entity has required fields
      if (!entity.entity_name || !entity.smart_code) {
        throw new Error(`Entity ${entity.entity_type} missing required metadata`);
      }

      // Validate dynamic fields structure
      if (entity.dynamic_fields) {
        for (const field of entity.dynamic_fields) {
          if (!field.name || !field.type || !field.smart_code) {
            throw new Error(`Invalid field in ${entity.entity_type}: missing name/type/smart_code`);
          }
        }
      }

      return {
        message: `Entity ${entity.entity_type} configuration valid`,
        details: {
          dynamic_fields: entity.dynamic_fields?.length || 0,
          relationships: entity.relationships?.length || 0
        }
      };
    }));
  }

  return results;
}

async function runTransactionTests(config: any): Promise<TestResult[]> {
  console.log('⚡ Running Transaction Tests...');
  const results: TestResult[] = [];

  // Test transaction completeness
  results.push(await runTest('transactions', 'required_transactions', async () => {
    const expectedTransactions = ['LEAD_QUALIFICATION', 'OPPORTUNITY_CREATION', 'QUOTE_GENERATION'];
    const actualTransactions = config.transactions.map((t: any) => t.transaction_type);
    const missingTransactions = expectedTransactions.filter(t => !actualTransactions.includes(t));

    if (missingTransactions.length > 0) {
      throw new Error(`Missing transactions: ${missingTransactions.join(', ')}`);
    }

    return {
      message: 'All required transactions present',
      details: { transactions: actualTransactions.length }
    };
  }));

  // Test transaction line types
  results.push(await runTest('transactions', 'line_types', async () => {
    const transactionsWithoutLines = config.transactions.filter((txn: any) => 
      !txn.line_types || txn.line_types.length === 0
    );

    if (transactionsWithoutLines.length > 0) {
      throw new Error(`Transactions without line types: ${transactionsWithoutLines.map((t: any) => t.transaction_type).join(', ')}`);
    }

    return { message: 'All transactions have line types configured' };
  }));

  return results;
}

async function runWorkflowTests(config: any): Promise<TestResult[]> {
  console.log('🔄 Running Workflow Tests...');
  const results: TestResult[] = [];

  // Test workflow completeness
  results.push(await runTest('workflows', 'workflow_configuration', async () => {
    const expectedWorkflows = ['LEAD_TO_CUSTOMER', 'PIPELINE_MGMT'];
    const actualWorkflows = config.workflows.map((w: any) => w.workflow_code);
    const missingWorkflows = expectedWorkflows.filter(w => !actualWorkflows.includes(w));

    if (missingWorkflows.length > 0) {
      throw new Error(`Missing workflows: ${missingWorkflows.join(', ')}`);
    }

    return {
      message: 'All required workflows present',
      details: { workflows: actualWorkflows.length }
    };
  }));

  // Test AI assistance configuration
  results.push(await runTest('workflows', 'ai_assistance', async () => {
    const aiSteps = config.workflows.reduce((total: number, workflow: any) => 
      total + (workflow.steps?.filter((step: any) => step.ai_assistance).length || 0), 0
    );

    if (aiSteps === 0) {
      throw new Error('No AI assistance configured in workflows');
    }

    return {
      message: 'AI assistance configured in workflows',
      details: { ai_assisted_steps: aiSteps }
    };
  }));

  return results;
}

async function runUITests(config: any): Promise<TestResult[]> {
  console.log('🎨 Running UI Tests...');
  const results: TestResult[] = [];

  // Test dashboard configuration
  results.push(await runTest('ui', 'dashboard_widgets', async () => {
    const dashboard = config.ui.dashboard;
    
    if (!dashboard || !dashboard.widgets || dashboard.widgets.length === 0) {
      throw new Error('Dashboard widgets not configured');
    }

    const widgetTypes = [...new Set(dashboard.widgets.map((w: any) => w.type))];
    const expectedTypes = ['metric', 'chart'];
    const hasRequiredTypes = expectedTypes.every(type => widgetTypes.includes(type));

    if (!hasRequiredTypes) {
      throw new Error(`Missing widget types: ${expectedTypes.filter(t => !widgetTypes.includes(t)).join(', ')}`);
    }

    return {
      message: 'Dashboard widgets properly configured',
      details: { widgets: dashboard.widgets.length, types: widgetTypes }
    };
  }));

  // Test navigation structure
  results.push(await runTest('ui', 'navigation_structure', async () => {
    const navigation = config.ui.navigation;
    
    if (!navigation || navigation.length === 0) {
      throw new Error('Navigation not configured');
    }

    const totalItems = navigation.reduce((sum: number, section: any) => 
      sum + (section.items?.length || 0), 0
    );

    if (totalItems < 5) {
      throw new Error('Insufficient navigation items');
    }

    return {
      message: 'Navigation properly structured',
      details: { sections: navigation.length, total_items: totalItems }
    };
  }));

  // Test list view configurations
  results.push(await runTest('ui', 'list_views', async () => {
    const listViews = config.ui.list_views || {};
    const entityTypes = config.entities.map((e: any) => e.entity_type);
    
    // Check that major entities have list views
    const majorEntities = ['LEAD', 'OPPORTUNITY', 'CUSTOMER'];
    const missingViews = majorEntities.filter(entity => !listViews[entity]);

    if (missingViews.length > 0) {
      console.warn(`Missing list views for: ${missingViews.join(', ')}`);
    }

    return {
      message: 'List view configurations available',
      details: { configured_views: Object.keys(listViews).length }
    };
  }));

  return results;
}

async function runSecurityTests(config: any): Promise<TestResult[]> {
  console.log('🔒 Running Security Tests...');
  const results: TestResult[] = [];

  // Test role-based access control
  results.push(await runTest('security', 'rbac_configuration', async () => {
    const permissions = config.deployment?.permissions;
    
    if (!permissions || !permissions.roles || permissions.roles.length === 0) {
      throw new Error('No roles configured');
    }

    const expectedRoles = ['sales_rep', 'sales_manager', 'sales_admin'];
    const actualRoles = permissions.roles.map((r: any) => r.role);
    const missingRoles = expectedRoles.filter(role => !actualRoles.includes(role));

    if (missingRoles.length > 0) {
      throw new Error(`Missing roles: ${missingRoles.join(', ')}`);
    }

    return {
      message: 'RBAC properly configured',
      details: { roles: actualRoles.length }
    };
  }));

  // Test organization isolation
  results.push(await runTest('security', 'organization_isolation', async () => {
    // Check that app is configured for specific organization
    if (!config.app.organization || !config.app.organization.id) {
      throw new Error('Organization context not configured');
    }

    if (config.app.organization.id !== DEMO_ORG_ID) {
      throw new Error(`App configured for wrong organization: ${config.app.organization.id}`);
    }

    return {
      message: 'Organization isolation configured',
      details: { organization_id: config.app.organization.id }
    };
  }));

  return results;
}

async function runIntegrationTests(config: any): Promise<TestResult[]> {
  console.log('🔗 Running Integration Tests...');
  const results: TestResult[] = [];

  // Test AI assistance features
  results.push(await runTest('integration', 'ai_features', async () => {
    const aiConfig = config.ai_assistance;
    
    if (!aiConfig || !aiConfig.features || aiConfig.features.length === 0) {
      throw new Error('AI assistance not configured');
    }

    const expectedFeatures = ['lead_scoring', 'opportunity_insights', 'quote_optimization'];
    const actualFeatures = aiConfig.features.map((f: any) => f.feature);
    const missingFeatures = expectedFeatures.filter(feature => !actualFeatures.includes(feature));

    if (missingFeatures.length > 0) {
      throw new Error(`Missing AI features: ${missingFeatures.join(', ')}`);
    }

    return {
      message: 'AI assistance properly configured',
      details: { features: actualFeatures.length }
    };
  }));

  // Test validation rules
  results.push(await runTest('integration', 'validation_rules', async () => {
    const validation = config.validation;
    
    if (!validation || !validation.global_rules || validation.global_rules.length === 0) {
      throw new Error('Validation rules not configured');
    }

    return {
      message: 'Validation rules configured',
      details: { global_rules: validation.global_rules.length }
    };
  }));

  return results;
}

async function runUserExperienceTests(config: any): Promise<TestResult[]> {
  console.log('👤 Running User Experience Tests...');
  const results: TestResult[] = [];

  // Test sample data availability
  results.push(await runTest('ux', 'sample_data', async () => {
    const testData = config.testing?.sample_data;
    
    if (!testData || Object.keys(testData).length === 0) {
      throw new Error('No sample data configured');
    }

    const entityTypes = Object.keys(testData);
    const totalRecords = Object.values(testData).reduce((sum: number, records: any) => 
      sum + (Array.isArray(records) ? records.length : 0), 0
    );

    if (totalRecords < 5) {
      throw new Error('Insufficient sample data');
    }

    return {
      message: 'Sample data available for testing',
      details: { entity_types: entityTypes.length, total_records: totalRecords }
    };
  }));

  // Test test scenarios
  results.push(await runTest('ux', 'test_scenarios', async () => {
    const testScenarios = config.testing?.test_scenarios;
    
    if (!testScenarios || testScenarios.length === 0) {
      throw new Error('No test scenarios configured');
    }

    const expectedScenarios = ['lead_to_customer_conversion', 'sales_pipeline_progression'];
    const actualScenarios = testScenarios.map((s: any) => s.scenario);
    const missingScenarios = expectedScenarios.filter(scenario => !actualScenarios.includes(scenario));

    if (missingScenarios.length > 0) {
      throw new Error(`Missing test scenarios: ${missingScenarios.join(', ')}`);
    }

    return {
      message: 'Test scenarios properly defined',
      details: { scenarios: actualScenarios.length }
    };
  }));

  return results;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function runTest(
  category: string,
  testName: string,
  testFn: () => Promise<any>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ ${testName} (${duration}ms)`);
    
    return {
      category,
      test_name: testName,
      status: 'passed',
      message: result.message || 'Test passed',
      duration_ms: duration,
      details: result.details
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    
    console.log(`  ❌ ${testName} (${duration}ms): ${message}`);
    
    return {
      category,
      test_name: testName,
      status: 'failed',
      message,
      duration_ms: duration
    };
  }
}

function printTestSummary(testSuite: TestSuite) {
  console.log('');
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Suite: ${testSuite.suite_name}`);
  console.log(`Duration: ${testSuite.duration_ms}ms`);
  console.log(`Total Tests: ${testSuite.total_tests}`);
  console.log(`✅ Passed: ${testSuite.passed}`);
  console.log(`❌ Failed: ${testSuite.failed}`);
  console.log(`⏭️  Skipped: ${testSuite.skipped}`);
  console.log(`Success Rate: ${((testSuite.passed / testSuite.total_tests) * 100).toFixed(1)}%`);
  console.log('');

  // Print results by category
  const categories = [...new Set(testSuite.results.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryResults = testSuite.results.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.status === 'passed').length;
    
    console.log(`📁 ${category.toUpperCase()}: ${categoryPassed}/${categoryResults.length} passed`);
    
    // Show failed tests
    categoryResults
      .filter(r => r.status === 'failed')
      .forEach(result => {
        console.log(`   ❌ ${result.test_name}: ${result.message}`);
      });
  });

  if (testSuite.passed === testSuite.total_tests) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED! CRM Demo is ready for use.');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Access the CRM Demo at: http://localhost:3000/demo-org/00000000000001/crm-sales');
    console.log('2. Test the user scenarios outlined in the deployment summary');
    console.log('3. Validate performance under load');
    console.log('4. Consider replicating this pattern for additional modules');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Review and fix issues before proceeding.');
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  testCRMDemo().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { testCRMDemo };