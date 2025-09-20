#!/usr/bin/env node

/**
 * HERA Contract Validation Script
 * 
 * This script validates that all type contracts are properly defined,
 * exported, and follow HERA's type safety conventions.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.cyan}\n🔍 ${msg}${colors.reset}`)
};

// Validation rules
const validationRules = {
  // Contract files must export both types and schemas
  CONTRACT_EXPORTS: [
    'Schema',
    'type',
    'validation functions',
    'smart codes'
  ],
  
  // Required naming conventions
  NAMING_CONVENTIONS: {
    schemas: /^[A-Z][a-zA-Z]*Schema$/,
    types: /^[A-Z][a-zA-Z]*$/,
    validators: /^validate[A-Z][a-zA-Z]*$/,
    typeGuards: /^is[A-Z][a-zA-Z]*$/
  },
  
  // Files that must exist
  REQUIRED_FILES: [
    'src/contracts/index.ts',
    'src/contracts/base.ts',
    'src/contracts/ui-components.ts',
    'src/utils/exact.ts'
  ],
  
  // Patterns that should not exist (anti-patterns)
  ANTI_PATTERNS: [
    'any',
    'unknown',
    'object',
    'Function'
  ]
};

class ContractValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.contractsDir = path.join(process.cwd(), 'src/contracts');
    this.utilsDir = path.join(process.cwd(), 'src/utils');
  }

  /**
   * Main validation entry point
   */
  async validate() {
    log.header('HERA Contract Validation');
    
    try {
      await this.validateRequiredFiles();
      await this.validateContractStructure();
      await this.validateNamingConventions();
      await this.validateTypeExports();
      await this.validateSchemaExports();
      await this.validateAntiPatterns();
      await this.validateImports();
      
      this.printResults();
      
      if (this.errors.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      log.error(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Check that all required files exist
   */
  async validateRequiredFiles() {
    log.info('Validating required files...');
    
    for (const filePath of validationRules.REQUIRED_FILES) {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`Missing required file: ${filePath}`);
      } else {
        log.success(`Found required file: ${filePath}`);
      }
    }
  }

  /**
   * Validate contract file structure
   */
  async validateContractStructure() {
    log.info('Validating contract structure...');
    
    if (!fs.existsSync(this.contractsDir)) {
      this.errors.push('Contracts directory does not exist: src/contracts');
      return;
    }
    
    const contractFiles = fs.readdirSync(this.contractsDir)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts');
    
    if (contractFiles.length === 0) {
      this.errors.push('No contract files found in src/contracts');
      return;
    }
    
    log.success(`Found ${contractFiles.length} contract files`);
    
    // Validate each contract file
    for (const file of contractFiles) {
      await this.validateContractFile(path.join(this.contractsDir, file));
    }
  }

  /**
   * Validate individual contract file
   */
  async validateContractFile(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    log.info(`Validating ${fileName}...`);
    
    // Check for required imports
    if (!content.includes("import { z } from 'zod'")) {
      this.errors.push(`${fileName}: Missing Zod import`);
    }
    
    // Check for schema definitions
    const schemaMatches = content.match(/export const \w+Schema = z\./g);
    if (!schemaMatches || schemaMatches.length === 0) {
      this.errors.push(`${fileName}: No Zod schemas found`);
    }
    
    // Check for type exports
    const typeMatches = content.match(/export type \w+ = z\.infer<typeof \w+Schema>/g);
    if (!typeMatches || typeMatches.length === 0) {
      this.warnings.push(`${fileName}: No type exports found`);
    }
    
    // Check for validation functions
    if (!content.includes('validate') && !content.includes('parse')) {
      this.warnings.push(`${fileName}: No validation functions found`);
    }
    
    log.success(`${fileName}: Structure validation complete`);
  }

  /**
   * Validate naming conventions
   */
  async validateNamingConventions() {
    log.info('Validating naming conventions...');
    
    const contractFiles = this.getContractFiles();
    
    for (const file of contractFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check schema naming
      const schemaMatches = content.match(/export const (\w+) = z\./g);
      if (schemaMatches) {
        for (const match of schemaMatches) {
          const schemaName = match.match(/export const (\w+) = z\./)[1];
          if (!validationRules.NAMING_CONVENTIONS.schemas.test(schemaName)) {
            this.errors.push(`${path.basename(file)}: Invalid schema name '${schemaName}' - should end with 'Schema'`);
          }
        }
      }
      
      // Check validation function naming
      const validatorMatches = content.match(/export const (validate\w+)/g);
      if (validatorMatches) {
        for (const match of validatorMatches) {
          const validatorName = match.match(/export const (validate\w+)/)[1];
          if (!validationRules.NAMING_CONVENTIONS.validators.test(validatorName)) {
            this.errors.push(`${path.basename(file)}: Invalid validator name '${validatorName}' - should start with 'validate'`);
          }
        }
      }
    }
  }

  /**
   * Validate type exports
   */
  async validateTypeExports() {
    log.info('Validating type exports...');
    
    const indexFile = path.join(this.contractsDir, 'index.ts');
    if (!fs.existsSync(indexFile)) {
      this.errors.push('Missing contracts index.ts barrel export file');
      return;
    }
    
    const content = fs.readFileSync(indexFile, 'utf8');
    
    // Check for proper barrel exports
    if (!content.includes("export * from")) {
      this.errors.push('index.ts: No barrel exports found');
    }
    
    // Check that all contract files are exported
    const contractFiles = this.getContractFiles()
      .map(file => path.basename(file, '.ts'))
      .filter(name => name !== 'index');
    
    for (const contractName of contractFiles) {
      if (!content.includes(`export * from './${contractName}'`)) {
        this.warnings.push(`index.ts: Missing export for ./${contractName}`);
      }
    }
  }

  /**
   * Validate schema exports
   */
  async validateSchemaExports() {
    log.info('Validating schema exports...');
    
    const contractFiles = this.getContractFiles();
    
    for (const file of contractFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const schemas = this.extractSchemas(content);
      
      for (const schema of schemas) {
        // Check that each schema has a corresponding type
        const typeName = schema.replace('Schema', '');
        const typeExport = `export type ${typeName} = z.infer<typeof ${schema}>`;
        
        if (!content.includes(typeExport)) {
          this.warnings.push(`${path.basename(file)}: Missing type export for ${schema}`);
        }
      }
    }
  }

  /**
   * Check for anti-patterns
   */
  async validateAntiPatterns() {
    log.info('Checking for anti-patterns...');
    
    const contractFiles = this.getContractFiles();
    
    for (const file of contractFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const antiPattern of validationRules.ANTI_PATTERNS) {
        // Skip if it's in a comment or string
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes(antiPattern) && 
              !line.trim().startsWith('//') && 
              !line.trim().startsWith('*') &&
              !line.includes(`'${antiPattern}'`) &&
              !line.includes(`"${antiPattern}"`)) {
            
            this.warnings.push(`${path.basename(file)}:${i + 1}: Potential anti-pattern '${antiPattern}' found`);
          }
        }
      }
    }
  }

  /**
   * Validate imports
   */
  async validateImports() {
    log.info('Validating imports...');
    
    const contractFiles = this.getContractFiles();
    
    for (const file of contractFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for relative imports to contracts (should use barrel)
      const relativeImports = content.match(/import.*from ['"]\.\.?\//g);
      if (relativeImports) {
        for (const importLine of relativeImports) {
          if (importLine.includes('/contracts/') && !importLine.includes('./')) {
            this.warnings.push(`${path.basename(file)}: Use barrel import instead of: ${importLine.trim()}`);
          }
        }
      }
      
      // Check for proper contract imports
      if (content.includes('@/contracts') || content.includes('@/utils/exact')) {
        log.success(`${path.basename(file)}: Using proper import paths`);
      }
    }
  }

  /**
   * Extract schema names from file content
   */
  extractSchemas(content) {
    const schemas = [];
    const matches = content.match(/export const (\w+Schema) = z\./g);
    
    if (matches) {
      for (const match of matches) {
        const schemaName = match.match(/export const (\w+Schema) = z\./)[1];
        schemas.push(schemaName);
      }
    }
    
    return schemas;
  }

  /**
   * Get all contract files
   */
  getContractFiles() {
    if (!fs.existsSync(this.contractsDir)) {
      return [];
    }
    
    return fs.readdirSync(this.contractsDir)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(this.contractsDir, file));
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n' + '='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log.success('All contract validations passed! 🎉');
    } else {
      if (this.errors.length > 0) {
        log.header(`${this.errors.length} Error(s) Found:`);
        this.errors.forEach(error => log.error(error));
      }
      
      if (this.warnings.length > 0) {
        log.header(`${this.warnings.length} Warning(s) Found:`);
        this.warnings.forEach(warning => log.warning(warning));
      }
    }
    
    console.log('='.repeat(50));
    
    // Summary
    log.info(`Validation Summary:`);
    log.info(`  - Errors: ${this.errors.length}`);
    log.info(`  - Warnings: ${this.warnings.length}`);
    log.info(`  - Contract Files: ${this.getContractFiles().length}`);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ContractValidator();
  validator.validate().catch(error => {
    log.error(`Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { ContractValidator };