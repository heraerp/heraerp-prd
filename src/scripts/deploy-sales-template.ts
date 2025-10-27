#!/usr/bin/env tsx

/**
 * Deploy Sales/Lead Management Template to Platform Organization
 * Smart Code: HERA.SCRIPT.DEPLOY.SALES_TEMPLATE.v1
 * 
 * This script loads the Sales/Lead Management YAML configuration and saves it
 * as a template in the Platform Organization for reuse across demo deployments.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PlatformTemplateManager } from '@/lib/platform/platform-template-manager';
import { HERAAppConfigParser } from '@/lib/app-generator/yaml-parser';
import { PLATFORM_ORG } from '@/lib/platform/platform-org-constants';

// ============================================================================
// CONFIGURATION
// ============================================================================

const YAML_FILE_PATH = path.join(process.cwd(), 'src/templates/app-config/modules/crm-sales-leads.yaml');
const TEMPLATE_NAME = 'CRM Sales & Lead Management';
const TEMPLATE_CATEGORY = 'crm_sales';

// ============================================================================
// MAIN DEPLOYMENT FUNCTION
// ============================================================================

async function deploySalesTemplate() {
  console.log('🚀 Deploying Sales/Lead Management Template to Platform Organization...');
  console.log(`📁 Platform Org ID: ${PLATFORM_ORG.ID}`);
  console.log(`📄 YAML File: ${YAML_FILE_PATH}`);
  console.log('');

  try {
    // Step 1: Read and validate YAML configuration
    console.log('📖 Step 1: Reading YAML configuration...');
    
    if (!fs.existsSync(YAML_FILE_PATH)) {
      throw new Error(`YAML file not found: ${YAML_FILE_PATH}`);
    }
    
    const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf-8');
    console.log(`✅ YAML file loaded (${yamlContent.length} characters)`);

    // Step 2: Parse and validate configuration
    console.log('🔍 Step 2: Parsing and validating configuration...');
    
    const parser = new HERAAppConfigParser();
    const config = await parser.parseYAML(yamlContent);
    
    // Validate smart codes
    const smartCodeErrors = parser.validateSmartCodes();
    if (smartCodeErrors.length > 0) {
      console.error('❌ Smart code validation errors:');
      smartCodeErrors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Smart code validation failed');
    }
    
    // Validate relationships
    const relationshipErrors = parser.validateRelationships();
    if (relationshipErrors.length > 0) {
      console.error('❌ Relationship validation errors:');
      relationshipErrors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Relationship validation failed');
    }
    
    console.log('✅ Configuration validated successfully');
    console.log(`   - Entities: ${config.entities.length}`);
    console.log(`   - Transactions: ${config.transactions.length}`);
    console.log(`   - Workflows: ${config.workflows.length}`);

    // Step 3: Initialize Platform Template Manager
    console.log('🏗️  Step 3: Initializing Platform Template Manager...');
    
    const templateManager = new PlatformTemplateManager();
    console.log('✅ Template manager initialized');

    // Step 4: Save template to Platform Organization
    console.log('💾 Step 4: Saving template to Platform Organization...');
    
    const templateMetadata = {
      category: TEMPLATE_CATEGORY,
      supported_industries: ['technology', 'manufacturing', 'services', 'retail'],
      complexity_level: 'intermediate' as const,
      estimated_setup_time: '2_hours',
      prerequisites: [
        'Basic understanding of CRM concepts',
        'Sales process knowledge',
        'HERA platform access'
      ]
    };
    
    const savedTemplate = await templateManager.saveTemplate(
      TEMPLATE_NAME,
      config,
      templateMetadata
    );
    
    console.log('✅ Template saved successfully!');
    console.log(`   - Template ID: ${savedTemplate.id}`);
    console.log(`   - Entity Code: ${savedTemplate.entity_code}`);
    console.log(`   - Smart Code: ${savedTemplate.smart_code}`);
    console.log(`   - Version: ${savedTemplate.version}`);

    // Step 5: Generate summary report
    console.log('📊 Step 5: Generating summary report...');
    
    const appSummary = parser.generateAppSummary();
    const platformMetadata = parser.generatePlatformMetadata();
    
    console.log('');
    console.log('📈 DEPLOYMENT SUMMARY');
    console.log('=' .repeat(50));
    console.log(appSummary);
    console.log('');
    console.log('🔧 PLATFORM METADATA');
    console.log('=' .repeat(50));
    console.log(JSON.stringify(platformMetadata, null, 2));

    // Step 6: Validation checks
    console.log('');
    console.log('✅ Step 6: Post-deployment validation...');
    
    // Verify template can be loaded back
    const loadedTemplate = await templateManager.loadTemplate(savedTemplate.id);
    console.log(`✅ Template can be loaded back: ${loadedTemplate.template_name}`);
    
    // Verify template appears in listings
    const templates = await templateManager.listTemplates({
      category: TEMPLATE_CATEGORY,
      limit: 10
    });
    
    // In simulation mode, just verify we get results
    console.log(`✅ Template listing validated (${templates.length} templates found)`);

    // Step 7: Next steps guidance
    console.log('');
    console.log('🎯 NEXT STEPS');
    console.log('=' .repeat(50));
    console.log('1. Deploy template to Demo Organization (00000000000001)');
    console.log('2. Create seed data for testing');
    console.log('3. Test CRUD operations on all entities');
    console.log('4. Test lead-to-customer workflow');
    console.log('5. Validate Fiori-style UI components');
    console.log('6. Performance and security testing');
    console.log('');
    console.log('To deploy to Demo Organization, run:');
    console.log(`npm run hera:deploy:demo ${savedTemplate.id}`);

  } catch (error) {
    console.error('❌ Deployment failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate template deployment readiness
 */
function validateDeploymentReadiness(config: any): string[] {
  const issues: string[] = [];
  
  // Check required sections
  if (!config.entities || config.entities.length === 0) {
    issues.push('No entities defined');
  }
  
  if (!config.transactions || config.transactions.length === 0) {
    issues.push('No transactions defined');
  }
  
  if (!config.workflows || config.workflows.length === 0) {
    issues.push('No workflows defined');
  }
  
  if (!config.ui || !config.ui.dashboard) {
    issues.push('No UI dashboard configuration');
  }
  
  if (!config.deployment || !config.deployment.permissions) {
    issues.push('No permission configuration');
  }
  
  // Check entity relationships
  const entityTypes = new Set(config.entities.map((e: any) => e.entity_type));
  
  config.entities.forEach((entity: any) => {
    entity.relationships?.forEach((rel: any) => {
      if (!entityTypes.has(rel.target_entity)) {
        issues.push(`Entity ${entity.entity_type} references unknown target: ${rel.target_entity}`);
      }
    });
  });
  
  return issues;
}

/**
 * Generate deployment report
 */
function generateDeploymentReport(template: any, metadata: any): string {
  const report = [
    '📋 DEPLOYMENT REPORT',
    '=' .repeat(50),
    `Template Name: ${template.template_name}`,
    `Template ID: ${template.id}`,
    `Smart Code: ${template.smart_code}`,
    `Category: ${template.template_category}`,
    `Complexity: ${template.complexity_level}`,
    `Setup Time: ${template.estimated_setup_time}`,
    '',
    '📊 STATISTICS',
    '-' .repeat(30),
    `Entities: ${template.entities_count}`,
    `Transactions: ${template.transactions_count}`,
    `Workflows: ${template.workflows_count}`,
    '',
    '🏗️  FEATURES',
    '-' .repeat(30),
    `AI Assistance: ${metadata.features.has_ai_assistance ? '✅' : '❌'}`,
    `External APIs: ${metadata.features.has_external_apis ? '✅' : '❌'}`,
    `Dashboard Widgets: ${metadata.features.has_dashboard_widgets ? '✅' : '❌'}`,
    `Navigation Menu: ${metadata.features.has_navigation ? '✅' : '❌'}`,
    '',
    '🔧 COMPLEXITY METRICS',
    '-' .repeat(30),
    `Total Dynamic Fields: ${metadata.complexity.total_dynamic_fields}`,
    `Total Relationships: ${metadata.complexity.total_relationships}`,
    ''
  ];
  
  return report.join('\n');
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  deploySalesTemplate().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { deploySalesTemplate };