#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';
import { playbookRegistry } from '../packages/hera-playbooks/src/registry';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalPlaybooks: number;
    validPlaybooks: number;
    totalSteps: number;
    industryBreakdown: Record<string, number>;
  };
}

// Smart code validation for playbooks
function validatePlaybookSmartCode(id: string): string[] {
  const errors: string[] = [];
  
  // Must match HERA.{INDUSTRY}.{MODULE}.PLAYBOOK.v{VERSION}
  const parts = id.split('.');
  
  if (!id.startsWith('HERA.')) {
    errors.push(`Smart code must start with 'HERA.': ${id}`);
  }
  
  if (!id.includes('.PLAYBOOK.')) {
    errors.push(`Smart code must contain '.PLAYBOOK.': ${id}`);
  }
  
  if (parts.length < 5) {
    errors.push(`Smart code must have at least 5 segments: ${id}`);
  }
  
  const version = parts[parts.length - 1];
  if (!version.match(/^v\d+$/)) {
    errors.push(`Smart code must end with version (e.g., v1): ${id}`);
  }
  
  return errors;
}

// Validate individual playbook
function validatePlaybook(id: string, playbook: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate ID matches
  if (playbook.id !== id) {
    errors.push(`Playbook ID mismatch: registry key '${id}' vs playbook.id '${playbook.id}'`);
  }
  
  // Validate smart code format
  errors.push(...validatePlaybookSmartCode(playbook.id));
  
  // Validate required fields
  if (!playbook.entityType) {
    errors.push(`Missing entityType for playbook ${id}`);
  }
  
  if (!playbook.version) {
    errors.push(`Missing version for playbook ${id}`);
  }
  
  if (!playbook.steps || !Array.isArray(playbook.steps)) {
    errors.push(`Missing or invalid steps array for playbook ${id}`);
  } else if (playbook.steps.length === 0) {
    warnings.push(`Empty steps array for playbook ${id}`);
  }
  
  // Validate version matches smart code
  const smartCodeVersion = id.split('.').pop();
  if (smartCodeVersion && playbook.version !== smartCodeVersion) {
    warnings.push(`Version mismatch: playbook.version '${playbook.version}' vs smart code version '${smartCodeVersion}'`);
  }
  
  // Check for common step types
  const stepTypes = new Set<string>();
  playbook.steps?.forEach((step: any, index: number) => {
    if (step.name) {
      // Track step types from function names
      const stepType = step.name.split('.')[0];
      if (stepType) stepTypes.add(stepType);
    }
  });
  
  if (stepTypes.size === 0 && playbook.steps?.length > 0) {
    warnings.push(`No identifiable step types found in playbook ${id}`);
  }
  
  return { errors, warnings };
}

async function validateAllPlaybooks(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {
      totalPlaybooks: 0,
      validPlaybooks: 0,
      totalSteps: 0,
      industryBreakdown: {},
    },
  };
  
  console.log('🔍 Validating HERA Playbooks...\n');
  
  // Validate each playbook in registry
  for (const [id, playbook] of Object.entries(playbookRegistry)) {
    result.summary.totalPlaybooks++;
    
    const { errors, warnings } = validatePlaybook(id, playbook);
    
    if (errors.length === 0) {
      result.summary.validPlaybooks++;
    } else {
      result.valid = false;
    }
    
    result.errors.push(...errors);
    result.warnings.push(...warnings);
    
    // Track steps
    result.summary.totalSteps += playbook.steps?.length || 0;
    
    // Track by industry
    const industry = id.split('.')[1]; // e.g., SALON, JEWELRY
    if (industry) {
      result.summary.industryBreakdown[industry] = (result.summary.industryBreakdown[industry] || 0) + 1;
    }
    
    // Report per playbook
    console.log(`📋 ${id}:`);
    console.log(`   Entity Type: ${playbook.entityType}`);
    console.log(`   Version: ${playbook.version}`);
    console.log(`   Steps: ${playbook.steps?.length || 0}`);
    
    if (errors.length > 0) {
      console.log(`   ❌ Errors: ${errors.length}`);
      errors.forEach(e => console.log(`      - ${e}`));
    } else {
      console.log(`   ✅ Valid`);
    }
    
    if (warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${warnings.length}`);
      warnings.forEach(w => console.log(`      - ${w}`));
    }
    
    console.log();
  }
  
  // Summary
  console.log('=' .repeat(60));
  console.log('\n📊 Validation Summary:\n');
  console.log(`Total Playbooks: ${result.summary.totalPlaybooks}`);
  console.log(`Valid Playbooks: ${result.summary.validPlaybooks}`);
  console.log(`Total Steps: ${result.summary.totalSteps}`);
  console.log(`Average Steps per Playbook: ${(result.summary.totalSteps / result.summary.totalPlaybooks).toFixed(1)}`);
  console.log('\nIndustry Breakdown:');
  Object.entries(result.summary.industryBreakdown).forEach(([industry, count]) => {
    console.log(`  ${industry}: ${count} playbook(s)`);
  });
  console.log('\n' + '=' .repeat(60));
  
  if (result.errors.length > 0) {
    console.log(`\n❌ Total Errors: ${result.errors.length}`);
  }
  
  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Total Warnings: ${result.warnings.length}`);
  }
  
  if (result.valid) {
    console.log('\n✅ All playbooks are valid!\n');
  } else {
    console.log('\n❌ Validation failed! Please fix the errors above.\n');
    process.exit(1);
  }
  
  return result;
}

// Generate Mermaid diagram for a playbook
async function generatePlaybookDiagram(id: string, playbook: any): Promise<string> {
  let mermaid = `graph TD\n`;
  mermaid += `  Start([${playbook.entityType}]) --> Steps\n`;
  
  let prevStep = 'Steps';
  playbook.steps?.forEach((step: any, index: number) => {
    const stepId = `Step${index}`;
    const stepLabel = step.name || `step_${index}`;
    
    // Determine step shape based on type
    let shape = '[]'; // Default rectangle
    if (stepLabel.includes('validate')) shape = '{}'; // Diamond for validation
    if (stepLabel.includes('branch')) shape = '{{}}'; // Hexagon for branch
    if (stepLabel.includes('audit')) shape = '(())'; // Circle for audit
    if (stepLabel.includes('tx')) shape = '[()]'; // Stadium for transaction
    
    mermaid += `  ${prevStep} --> ${stepId}${shape.replace('[]', `[${stepLabel}]`)}\n`;
    prevStep = stepId;
  });
  
  mermaid += `  ${prevStep} --> End([Complete])\n`;
  
  return mermaid;
}

// Run validation
validateAllPlaybooks().catch(console.error);