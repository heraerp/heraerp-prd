#!/usr/bin/env node

/**
 * HERA Factory Dashboard Demo
 * 
 * This script demonstrates the Factory Dashboard reading from Six Sacred Tables
 * and displaying pipeline runs, guardrail status, and KPIs.
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Missing Supabase credentials in .env.local'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const orgId = process.env.DEFAULT_ORGANIZATION_ID || 'demo-org';

// Smart codes for factory operations
const FACTORY_SMART_CODES = {
  PLAN: 'HERA.FACTORY.MODULE.PLAN.PIPELINE.v1',
  BUILD: 'HERA.FACTORY.MODULE.BUILD.PIPELINE.v1',
  TEST: 'HERA.FACTORY.MODULE.TEST.PIPELINE.v1',
  COMPLY: 'HERA.FACTORY.MODULE.COMPLY.PIPELINE.v1',
  PACKAGE: 'HERA.FACTORY.MODULE.PACKAGE.PIPELINE.v1',
  RELEASE: 'HERA.FACTORY.MODULE.RELEASE.PIPELINE.v1',
};

const MODULE_SMART_CODES = {
  RESTAURANT_LOYALTY: 'HERA.REST.MODULE.LOYALTY.v1',
  ICE_CREAM_INVENTORY: 'HERA.ICE.MODULE.INVENTORY.v1',
  HEALTHCARE_PORTAL: 'HERA.HLTH.MODULE.PORTAL.v1',
};

async function createDemoData() {
  const spinner = ora('Creating Factory Dashboard demo data...').start();
  
  try {
    // Create modules as entities
    spinner.text = 'Creating module entities...';
    const modules = [];
    
    for (const [key, smartCode] of Object.entries(MODULE_SMART_CODES)) {
      const { data: module, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'factory_module',
          entity_name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          entity_code: `MODULE-${key}`,
          smart_code: smartCode,
          metadata: {
            version: '1.0.0',
            channel: key === 'RESTAURANT_LOYALTY' ? 'stable' : 'beta',
            language: 'typescript',
            framework: 'nextjs',
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      modules.push(module);
    }
    
    // Create pipeline runs
    spinner.text = 'Creating pipeline transactions...';
    const pipelines = [];
    
    // Restaurant Loyalty - Complete pipeline
    for (const stage of ['PLAN', 'BUILD', 'TEST', 'COMPLY', 'PACKAGE', 'RELEASE']) {
      const { data: txn, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: orgId,
          transaction_type: `FACTORY.${stage}`,
          smart_code: MODULE_SMART_CODES.RESTAURANT_LOYALTY,
          transaction_date: new Date(Date.now() - (6 - Object.keys(FACTORY_SMART_CODES).indexOf(stage)) * 3600000).toISOString(),
          transaction_status: 'passed',
          reference_entity_id: modules[0].id,
          ai_confidence: 0.95,
          metadata: {
            channel: 'stable',
            duration_ms: 45000 + Math.random() * 30000,
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      pipelines.push(txn);
      
      // Add transaction lines
      await createTransactionLines(txn.id, stage, 'passed');
    }
    
    // Ice Cream Inventory - Blocked at compliance
    for (const stage of ['PLAN', 'BUILD', 'TEST', 'COMPLY']) {
      const status = stage === 'COMPLY' ? 'blocked' : 'passed';
      const { data: txn, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: orgId,
          transaction_type: `FACTORY.${stage}`,
          smart_code: MODULE_SMART_CODES.ICE_CREAM_INVENTORY,
          transaction_date: new Date(Date.now() - (4 - Object.keys(FACTORY_SMART_CODES).indexOf(stage)) * 3600000).toISOString(),
          transaction_status: status,
          reference_entity_id: modules[1].id,
          ai_confidence: 0.88,
          metadata: {
            channel: 'beta',
            duration_ms: 45000 + Math.random() * 30000,
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      pipelines.push(txn);
      
      // Add transaction lines with violations for COMPLY
      await createTransactionLines(txn.id, stage, status, stage === 'COMPLY');
    }
    
    // Healthcare Portal - Currently testing
    for (const stage of ['PLAN', 'BUILD', 'TEST']) {
      const status = stage === 'TEST' ? 'running' : 'passed';
      const { data: txn, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: orgId,
          transaction_type: `FACTORY.${stage}`,
          smart_code: MODULE_SMART_CODES.HEALTHCARE_PORTAL,
          transaction_date: new Date(Date.now() - (3 - Object.keys(FACTORY_SMART_CODES).indexOf(stage)) * 2400000).toISOString(),
          transaction_status: status,
          reference_entity_id: modules[2].id,
          ai_confidence: 0.92,
          metadata: {
            channel: 'beta',
            duration_ms: stage === 'TEST' ? null : 45000 + Math.random() * 30000,
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      pipelines.push(txn);
      
      // Add transaction lines
      await createTransactionLines(txn.id, stage, status);
    }
    
    // Create module dependencies
    spinner.text = 'Creating module dependencies...';
    
    // Restaurant Loyalty depends on a capability
    const { data: authCapability } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'factory_capability',
        entity_name: 'Authentication Service',
        entity_code: 'CAP-AUTH',
        smart_code: 'HERA.FACTORY.CAP.AUTH.v1',
      })
      .select()
      .single();
    
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: modules[0].id,
        to_entity_id: authCapability.id,
        relationship_type: 'DEPENDS_ON',
        metadata: {
          version_constraint: '^2.0.0',
        }
      });
    
    // Ice Cream depends on Restaurant Loyalty
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: modules[1].id,
        to_entity_id: modules[0].id,
        relationship_type: 'DEPENDS_ON',
        metadata: {
          version_constraint: '^1.0.0',
        }
      });
    
    // Create fiscal period
    spinner.text = 'Creating fiscal period...';
    await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'fiscal_period',
        entity_name: 'Q1 2024',
        entity_code: 'FY2024-Q1',
        metadata: {
          status: 'open',
          period_start: '2024-01-01',
          period_end: '2024-03-31',
          fiscal_year: 2024,
        }
      });
    
    spinner.succeed('Factory Dashboard demo data created successfully!');
    
    console.log(chalk.green('\n✅ Demo data created:'));
    console.log(chalk.gray(`   - 3 modules (${modules.map(m => m.entity_name).join(', ')})`));
    console.log(chalk.gray(`   - ${pipelines.length} pipeline runs`));
    console.log(chalk.gray('   - Module dependencies and capabilities'));
    console.log(chalk.gray('   - Open fiscal period'));
    
    console.log(chalk.cyan('\n🚀 To view the Factory Dashboard:'));
    console.log(chalk.gray('   npm run dev'));
    console.log(chalk.gray('   Navigate to: http://localhost:3000/factory'));
    
  } catch (error) {
    spinner.fail('Failed to create demo data');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function createTransactionLines(transactionId, stage, status, hasViolations = false) {
  const lines = [];
  
  switch (stage) {
    case 'BUILD':
      lines.push({
        line_type: 'STEP.BUILD',
        smart_code: 'HERA.FACTORY.BUILD.COMPILE.v1',
        metadata: {
          status: status === 'running' ? 'RUNNING' : 'PASSED',
          duration_ms: 15000,
          artifacts: {
            bundle: 's3://artifacts/bundle.js',
            sourcemap: 's3://artifacts/bundle.js.map',
          }
        }
      });
      break;
      
    case 'TEST':
      lines.push({
        line_type: 'STEP.UNIT',
        smart_code: 'HERA.FACTORY.TEST.UNIT.v1',
        metadata: {
          status: status === 'running' ? 'RUNNING' : 'PASSED',
          coverage: 0.85,
          duration_ms: 12000,
        }
      });
      lines.push({
        line_type: 'STEP.E2E',
        smart_code: 'HERA.FACTORY.TEST.E2E.v1',
        metadata: {
          status: status === 'running' ? 'PENDING' : 'PASSED',
          coverage: 0.72,
          duration_ms: status === 'running' ? null : 25000,
        }
      });
      break;
      
    case 'COMPLY':
      lines.push({
        line_type: 'STEP.COMPLIANCE.SOX',
        smart_code: 'HERA.FACTORY.COMPLY.SOX.v1',
        metadata: {
          status: hasViolations ? 'FAILED' : 'PASSED',
          violations: hasViolations ? [{
            policy: 'SOX-404',
            severity: 'high',
            message: 'Missing segregation of duties in payment processing',
            waivable: true,
          }] : []
        }
      });
      lines.push({
        line_type: 'STEP.SECURITY',
        smart_code: 'HERA.FACTORY.COMPLY.SECURITY.v1',
        metadata: {
          status: 'PASSED',
        }
      });
      break;
      
    case 'PACKAGE':
      lines.push({
        line_type: 'STEP.PACKAGE',
        smart_code: 'HERA.FACTORY.PACKAGE.NPM.v1',
        metadata: {
          status: 'PASSED',
          artifacts: {
            package: 's3://artifacts/hera-restaurant-loyalty-1.0.0.tgz',
            sbom: 's3://artifacts/sbom.json',
          }
        }
      });
      lines.push({
        line_type: 'STEP.ATTESTATION',
        smart_code: 'HERA.FACTORY.PACKAGE.ATTEST.v1',
        metadata: {
          status: 'PASSED',
        }
      });
      break;
  }
  
  // Insert all lines
  for (let i = 0; i < lines.length; i++) {
    await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: orgId,
        transaction_id: transactionId,
        line_number: i + 1,
        ...lines[i]
      });
  }
}

// Main execution
console.log(chalk.blue('\n🏭 HERA Factory Dashboard Demo\n'));

createDemoData().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});