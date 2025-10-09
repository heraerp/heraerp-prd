#!/usr/bin/env node
/**
 * Finance DNA v2 - Documentation Validation Script
 * Validates the living contract documentation for accuracy and completeness
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = path.join(__dirname, '../docs/finance-dna-v2');
const MERMAID_DIR = path.join(__dirname, '../docs/mermaid');
const SQL_DIR = path.join(__dirname, '../database/functions/finance-dna-v2');

console.log('📚 Finance DNA v2 - Documentation Validation');
console.log('============================================');
console.log('');

// Validation results tracking
let validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0,
  details: []
};

function runValidation(testName, testFunction) {
  validationResults.total++;
  console.log(`🔍 Validating: ${testName}`);
  
  try {
    const result = testFunction();
    if (result.success) {
      validationResults.passed++;
      console.log(`   ✅ PASS: ${result.message}`);
    } else if (result.warning) {
      validationResults.warnings++;
      console.log(`   ⚠️  WARNING: ${result.message}`);
    } else {
      validationResults.failed++;
      console.log(`   ❌ FAIL: ${result.message}`);
    }
    validationResults.details.push({ test: testName, ...result });
  } catch (error) {
    validationResults.failed++;
    console.log(`   ❌ ERROR: ${error.message}`);
    validationResults.details.push({ test: testName, success: false, error: error.message });
  }
  console.log('');
}

function validateDocumentationStructure() {
  const requiredFiles = [
    'README.md',
    '01-overview.md',
    '02-smart-code-registry.md',
    '03-policy-as-data.md',
    '04-guardrails.md',
    '05-reporting-rpcs.md',
    '06-migration-runbook.md',
    '07-security-rls.md'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(DOCS_DIR, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    return {
      success: false,
      message: `Missing required files: ${missingFiles.join(', ')}`
    };
  }
  
  return {
    success: true,
    message: `All ${requiredFiles.length} required documentation files present`
  };
}

function validateSmartCodeRegistry() {
  const registryFile = path.join(DOCS_DIR, '02-smart-code-registry.md');
  
  if (!fs.existsSync(registryFile)) {
    return {
      success: false,
      message: 'Smart code registry file not found'
    };
  }
  
  const content = fs.readFileSync(registryFile, 'utf8');
  
  // Check for v2 smart codes
  const v2CodesRegex = /HERA\.ACCOUNTING\.[A-Z][A-Z_]*\.v2/g;
  const v2Codes = content.match(v2CodesRegex) || [];
  
  // Check for deprecated v1 codes
  const v1CodesRegex = /HERA\.ACCOUNTING\.[A-Z][A-Z_]*\.v1/g;
  const v1Codes = content.match(v1CodesRegex) || [];
  
  if (v2Codes.length === 0) {
    return {
      success: false,
      message: 'No v2 smart codes found in registry'
    };
  }
  
  if (v1Codes.length > 0) {
    return {
      success: false,
      message: `Found ${v1Codes.length} deprecated v1 smart codes in documentation`
    };
  }
  
  return {
    success: true,
    message: `Found ${v2Codes.length} v2 smart codes, no deprecated v1 codes`
  };
}

function validateSQLFunctions() {
  const requiredSQLFiles = [
    '01-core-setup.sql',
    '02-reporting-rpcs.sql',
    '03-policy-engine.sql',
    '04-migration-functions.sql'
  ];
  
  const missingFiles = [];
  
  requiredSQLFiles.forEach(file => {
    const filePath = path.join(SQL_DIR, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    return {
      success: false,
      message: `Missing SQL files: ${missingFiles.join(', ')}`
    };
  }
  
  // Check for key functions in SQL files
  const reportingFile = path.join(SQL_DIR, '02-reporting-rpcs.sql');
  const reportingContent = fs.readFileSync(reportingFile, 'utf8');
  
  const requiredFunctions = [
    'hera_generate_trial_balance_v2',
    'hera_validate_organization_access',
    'validate_finance_dna_smart_code'
  ];
  
  const missingFunctions = [];
  
  requiredFunctions.forEach(func => {
    if (!reportingContent.includes(func)) {
      missingFunctions.push(func);
    }
  });
  
  if (missingFunctions.length > 0) {
    return {
      success: false,
      message: `Missing required functions: ${missingFunctions.join(', ')}`
    };
  }
  
  return {
    success: true,
    message: `All ${requiredSQLFiles.length} SQL files present with required functions`
  };
}

function validateMermaidDiagrams() {
  const architectureFile = path.join(MERMAID_DIR, 'finance-dna-v2-architecture.md');
  
  if (!fs.existsSync(architectureFile)) {
    return {
      success: false,
      message: 'Architecture diagrams file not found'
    };
  }
  
  const content = fs.readFileSync(architectureFile, 'utf8');
  
  // Count mermaid diagrams
  const mermaidBlocks = content.match(/```mermaid/g) || [];
  
  if (mermaidBlocks.length < 6) {
    return {
      success: false,
      message: `Expected 6+ Mermaid diagrams, found ${mermaidBlocks.length}`
    };
  }
  
  // Check for key diagram types
  const requiredDiagrams = [
    'System Architecture',
    'Data Flow',
    'Smart Code Validation',
    'Policy Engine',
    'Performance',
    'Security'
  ];
  
  const missingDiagrams = requiredDiagrams.filter(diagram => 
    !content.toLowerCase().includes(diagram.toLowerCase())
  );
  
  if (missingDiagrams.length > 0) {
    return {
      warning: true,
      message: `Missing diagram sections: ${missingDiagrams.join(', ')}`
    };
  }
  
  return {
    success: true,
    message: `Found ${mermaidBlocks.length} Mermaid diagrams with all required sections`
  };
}

function validateLivingContractMarkers() {
  const files = fs.readdirSync(DOCS_DIR).filter(file => file.endsWith('.md'));
  const missingMarkers = [];
  
  files.forEach(file => {
    const filePath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for auto-generation markers
    if (!content.includes('Auto-Generated') && !content.includes('Living Contract')) {
      missingMarkers.push(file);
    }
  });
  
  if (missingMarkers.length > 0) {
    return {
      success: false,
      message: `Files missing living contract markers: ${missingMarkers.join(', ')}`
    };
  }
  
  return {
    success: true,
    message: `All ${files.length} documentation files have living contract markers`
  };
}

function validatePerformanceBenchmarks() {
  const reportingFile = path.join(DOCS_DIR, '05-reporting-rpcs.md');
  
  if (!fs.existsSync(reportingFile)) {
    return {
      success: false,
      message: 'Reporting RPC documentation not found'
    };
  }
  
  const content = fs.readFileSync(reportingFile, 'utf8');
  
  // Check for performance targets
  const performanceTargets = [
    'sub-second',
    '500ms',
    '1000ms',
    '2s',
    'performance'
  ];
  
  const foundTargets = performanceTargets.filter(target => 
    content.toLowerCase().includes(target)
  );
  
  if (foundTargets.length < 2) {
    return {
      warning: true,
      message: 'Performance benchmarks may be missing or incomplete'
    };
  }
  
  return {
    success: true,
    message: `Performance benchmarks documented with ${foundTargets.length} target references`
  };
}

function validateSacredSixCompliance() {
  const allFiles = [
    ...fs.readdirSync(DOCS_DIR).map(f => path.join(DOCS_DIR, f)),
    ...fs.readdirSync(SQL_DIR).map(f => path.join(SQL_DIR, f))
  ];
  
  // Forbidden table references (should use Sacred Six only)
  const forbiddenTables = [
    'financial_accounts',
    'gl_accounts_table',
    'chart_of_accounts_table',
    'financial_transactions_table',
    'journal_entries_table',
    'policies_table',
    'financial_policies_table'
  ];
  
  const violations = [];
  
  allFiles.forEach(filePath => {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.md') && !filePath.endsWith('.sql')) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    forbiddenTables.forEach(table => {
      if (content.includes(table)) {
        violations.push({
          file: path.basename(filePath),
          table: table
        });
      }
    });
  });
  
  if (violations.length > 0) {
    return {
      success: false,
      message: `Sacred Six violations found: ${violations.length} references to forbidden tables`
    };
  }
  
  return {
    success: true,
    message: 'Sacred Six architecture compliance verified - no forbidden table references'
  };
}

function main() {
  console.log('Finance DNA v2 Living Contract Validation');
  console.log('========================================');
  console.log('');
  
  // Core validation tests
  console.log('🔧 Core Documentation');
  console.log('--------------------');
  runValidation('Documentation Structure', validateDocumentationStructure);
  runValidation('Smart Code Registry', validateSmartCodeRegistry);
  runValidation('Living Contract Markers', validateLivingContractMarkers);
  
  // Implementation validation
  console.log('🗄️ Implementation Validation');
  console.log('---------------------------');
  runValidation('SQL Functions', validateSQLFunctions);
  runValidation('Performance Benchmarks', validatePerformanceBenchmarks);
  runValidation('Sacred Six Compliance', validateSacredSixCompliance);
  
  // Visual documentation
  console.log('🎨 Visual Documentation');
  console.log('----------------------');
  runValidation('Mermaid Diagrams', validateMermaidDiagrams);
  
  // Final results
  console.log('📊 VALIDATION RESULTS');
  console.log('====================');
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`⚠️  Warnings: ${validationResults.warnings}`);
  console.log(`❌ Failed: ${validationResults.failed}`);
  console.log(`📋 Total: ${validationResults.total}`);
  
  const successRate = ((validationResults.passed + validationResults.warnings) / validationResults.total) * 100;
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
  
  console.log('');
  console.log('📋 Detailed Results:');
  validationResults.details.forEach((result, index) => {
    const status = result.success ? '✅' : result.warning ? '⚠️' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    if (!result.success && !result.warning) {
      console.log(`   Error: ${result.error || result.message}`);
    }
  });
  
  console.log('');
  
  if (validationResults.failed === 0) {
    if (validationResults.warnings === 0) {
      console.log('🎉 ALL VALIDATIONS PASSED!');
      console.log('✅ Finance DNA v2 Living Contract is fully compliant');
      console.log('🚀 Documentation ready for production deployment');
    } else {
      console.log('⚠️ VALIDATIONS PASSED WITH WARNINGS');
      console.log('💡 Address warnings for optimal documentation quality');
    }
    process.exit(0);
  } else if (validationResults.failed <= 2) {
    console.log('⚠️ MINOR ISSUES DETECTED');
    console.log('🔧 Please address the failed validations before deployment');
    process.exit(1);
  } else {
    console.log('🚨 CRITICAL ISSUES DETECTED');
    console.log('❌ Documentation requires significant fixes before deployment');
    process.exit(2);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  validateDocumentationStructure,
  validateSmartCodeRegistry,
  validateSQLFunctions,
  validateMermaidDiagrams
};