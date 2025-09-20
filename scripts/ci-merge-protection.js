#!/usr/bin/env node

/**
 * HERA CI Merge Protection System
 * 
 * This script implements hard repo gates that prevent merging code that violates
 * contract-first development principles. It's designed to run in CI/CD pipelines
 * and as pre-commit/pre-push hooks.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class CIMergeProtection {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passedChecks = [];
    this.coverageThreshold = 100; // 100% coverage required for changed lines
  }

  // Utility methods
  logError(message) {
    this.errors.push(message);
    console.log(chalk.red('❌ ' + message));
  }

  logWarning(message) {
    this.warnings.push(message);
    console.log(chalk.yellow('⚠️  ' + message));
  }

  logSuccess(message) {
    this.passedChecks.push(message);
    console.log(chalk.green('✅ ' + message));
  }

  logInfo(message) {
    console.log(chalk.blue('ℹ️  ' + message));
  }

  /**
   * Gate 1: Contract-First Development Compliance
   */
  async validateContractFirstCompliance() {
    console.log(chalk.bold.cyan('\n🔒 Gate 1: Contract-First Development Compliance'));

    try {
      // Check if implementation blocked flag exists
      if (fs.existsSync('./IMPLEMENTATION_BLOCKED.flag')) {
        const blockInfo = JSON.parse(fs.readFileSync('./IMPLEMENTATION_BLOCKED.flag', 'utf-8'));
        this.logError(`Implementation is blocked: ${blockInfo.reason}`);
        this.logError(`Since: ${blockInfo.timestamp}`);
        this.logError(`To unblock: ${blockInfo.unblock_command}`);
        return false;
      }

      // Check for handshake approval
      const handshakesDir = './handshakes';
      if (fs.existsSync(handshakesDir)) {
        const handshakes = fs.readdirSync(handshakesDir)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(handshakesDir, f), 'utf-8')))
          .filter(h => h.status === 'approved');

        if (handshakes.length === 0) {
          this.logError('No approved handshakes found. Claude must complete handshake before implementation.');
          return false;
        }

        this.logSuccess(`Found ${handshakes.length} approved handshake(s)`);
      }

      // Check for contract files
      const contractsDir = './src/contracts';
      if (!fs.existsSync(contractsDir)) {
        this.logError('Contracts directory not found. All types must be defined in @/contracts');
        return false;
      }

      const contractFiles = this.findFilesRecursively(contractsDir, '.ts');
      if (contractFiles.length === 0) {
        this.logError('No contract files found. At least one contract must be defined.');
        return false;
      }

      this.logSuccess(`Found ${contractFiles.length} contract file(s)`);

      // Validate contract files have Zod schemas
      for (const contractFile of contractFiles) {
        const content = fs.readFileSync(contractFile, 'utf-8');
        if (!content.includes('z.object') && !content.includes('Schema')) {
          this.logWarning(`Contract file ${contractFile} may be missing Zod schemas`);
        }
      }

      return true;

    } catch (error) {
      this.logError(`Contract-first validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Gate 2: TypeScript Strict Mode Compliance
   */
  async validateTypeScriptStrictMode() {
    console.log(chalk.bold.cyan('\n🔒 Gate 2: TypeScript Strict Mode Compliance'));

    try {
      // Run TypeScript compilation in strict mode
      execSync('npm run typecheck:strict', { stdio: 'pipe' });
      this.logSuccess('TypeScript strict mode compilation passed');
      return true;

    } catch (error) {
      this.logError('TypeScript strict mode compilation failed');
      this.logError('Fix all type errors before merging');
      
      // Try to capture TypeScript errors
      try {
        const output = execSync('npm run typecheck:strict 2>&1 || true', { encoding: 'utf-8' });
        console.log(chalk.red('\nTypeScript Errors:'));
        console.log(output);
      } catch {
        // Ignore error capture failures
      }
      
      return false;
    }
  }

  /**
   * Gate 3: ESLint Validation with Contract Rules
   */
  async validateESLintCompliance() {
    console.log(chalk.bold.cyan('\n🔒 Gate 3: ESLint Contract-First Rules'));

    try {
      // Run ESLint with all contract-first rules
      execSync('npm run lint', { stdio: 'pipe' });
      this.logSuccess('ESLint validation passed with contract-first rules');
      return true;

    } catch (error) {
      this.logError('ESLint validation failed');
      this.logError('Fix all linting errors, especially contract-first violations');
      
      // Try to capture ESLint errors
      try {
        const output = execSync('npm run lint 2>&1 || true', { encoding: 'utf-8' });
        console.log(chalk.red('\nESLint Errors:'));
        console.log(output);
      } catch {
        // Ignore error capture failures
      }
      
      return false;
    }
  }

  /**
   * Gate 4: Test Coverage Requirements
   */
  async validateTestCoverage() {
    console.log(chalk.bold.cyan('\n🔒 Gate 4: Test Coverage Requirements'));

    try {
      // Run tests with coverage
      const coverageOutput = execSync('npm run test:coverage 2>&1 || true', { encoding: 'utf-8' });
      
      // Parse coverage results (basic parsing - can be enhanced)
      const coverageMatch = coverageOutput.match(/All files\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        const coverage = parseFloat(coverageMatch[1]);
        if (coverage >= this.coverageThreshold) {
          this.logSuccess(`Test coverage: ${coverage}% (≥${this.coverageThreshold}% required)`);
        } else {
          this.logError(`Test coverage: ${coverage}% (${this.coverageThreshold}% required)`);
          return false;
        }
      } else {
        this.logWarning('Could not parse coverage results');
      }

      // Run type safety tests specifically
      execSync('npm run test:type-safety', { stdio: 'pipe' });
      this.logSuccess('Type safety tests passed');
      
      return true;

    } catch (error) {
      this.logError('Test coverage validation failed');
      this.logError('All tests must pass with required coverage');
      return false;
    }
  }

  /**
   * Gate 5: Contract Import Validation
   */
  async validateContractImports() {
    console.log(chalk.bold.cyan('\n🔒 Gate 5: Contract Import Validation'));

    try {
      const srcFiles = this.findFilesRecursively('./src', '.ts', '.tsx');
      let hasViolations = false;

      for (const file of srcFiles) {
        // Skip contract files themselves
        if (file.includes('/contracts/')) continue;
        
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for direct type imports outside contracts
        if (content.match(/import.*type.*from ['"](?!@\/contracts).*['"];/)) {
          this.logError(`${file}: Type imports must come from @/contracts only`);
          hasViolations = true;
        }

        // Check for inline type definitions (should be in contracts)
        if (content.match(/type\s+\w+\s*=/) && !file.includes('.test.')) {
          this.logWarning(`${file}: Consider moving type definitions to @/contracts`);
        }

        // Check for 'any' usage
        if (content.includes(': any') || content.includes('<any>')) {
          this.logError(`${file}: Type 'any' is forbidden. Use specific types from @/contracts`);
          hasViolations = true;
        }
      }

      if (!hasViolations) {
        this.logSuccess('Contract import validation passed');
        return true;
      } else {
        this.logError('Contract import violations found');
        return false;
      }

    } catch (error) {
      this.logError(`Contract import validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Gate 6: Exact Props Pattern Enforcement
   */
  async validateExactPropsPattern() {
    console.log(chalk.bold.cyan('\n🔒 Gate 6: Exact Props Pattern Enforcement'));

    try {
      const componentFiles = this.findFilesRecursively('./src/components', '.tsx');
      let hasViolations = false;

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Look for component functions
        const componentMatches = content.match(/export\s+function\s+\w+\s*\([^)]*props[^)]*\)/g);
        
        if (componentMatches) {
          // Check if exact<T>() pattern is used
          if (!content.includes('exact<') && !content.includes('exact(')) {
            this.logError(`${file}: Component must use exact<T>() pattern for props to prevent drift`);
            hasViolations = true;
          }
        }
      }

      if (!hasViolations) {
        this.logSuccess('Exact props pattern validation passed');
        return true;
      } else {
        this.logError('Exact props pattern violations found');
        return false;
      }

    } catch (error) {
      this.logError(`Exact props pattern validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Gate 7: DOOD Compliance Check
   */
  async validateDOODCompliance() {
    console.log(chalk.bold.cyan('\n🔒 Gate 7: Definition of Done (DOOD) Compliance'));

    try {
      const doodPath = './DOOD.md';
      if (!fs.existsSync(doodPath)) {
        this.logError('DOOD.md file not found. Definition of Done must be present.');
        return false;
      }

      // Check for TODO/FIXME comments in production code
      const srcFiles = this.findFilesRecursively('./src', '.ts', '.tsx');
      let hasTodos = false;

      for (const file of srcFiles) {
        if (file.includes('.test.')) continue; // Skip test files
        
        const content = fs.readFileSync(file, 'utf-8');
        
        if (content.match(/\/\/\s*(TODO|FIXME|HACK)/i)) {
          this.logError(`${file}: TODO/FIXME/HACK comments not allowed in production code`);
          hasTodos = true;
        }
      }

      if (hasTodos) {
        this.logError('TODO/FIXME/HACK comments found in production code');
        return false;
      }

      this.logSuccess('DOOD compliance validation passed');
      return true;

    } catch (error) {
      this.logError(`DOOD compliance validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Run all gates
   */
  async runAllGates() {
    console.log(chalk.bold.magenta('🔒 HERA CI Merge Protection System'));
    console.log(chalk.bold.magenta('Enforcing Contract-First Development Standards'));
    console.log('='.repeat(60));

    const gates = [
      { name: 'Contract-First Compliance', fn: () => this.validateContractFirstCompliance() },
      { name: 'TypeScript Strict Mode', fn: () => this.validateTypeScriptStrictMode() },
      { name: 'ESLint Contract Rules', fn: () => this.validateESLintCompliance() },
      { name: 'Test Coverage', fn: () => this.validateTestCoverage() },
      { name: 'Contract Imports', fn: () => this.validateContractImports() },
      { name: 'Exact Props Pattern', fn: () => this.validateExactPropsPattern() },
      { name: 'DOOD Compliance', fn: () => this.validateDOODCompliance() }
    ];

    let allPassed = true;

    for (const gate of gates) {
      const passed = await gate.fn();
      if (!passed) {
        allPassed = false;
      }
    }

    // Summary
    console.log(chalk.bold.cyan('\n📊 Merge Protection Summary'));
    console.log('='.repeat(60));
    
    if (this.passedChecks.length > 0) {
      console.log(chalk.green(`✅ Passed Checks (${this.passedChecks.length}):`));
      this.passedChecks.forEach(check => console.log(chalk.green('  • ' + check)));
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Warnings (${this.warnings.length}):`));
      this.warnings.forEach(warning => console.log(chalk.yellow('  • ' + warning)));
    }

    if (this.errors.length > 0) {
      console.log(chalk.red(`\n❌ Blocking Errors (${this.errors.length}):`));
      this.errors.forEach(error => console.log(chalk.red('  • ' + error)));
      console.log(chalk.red('\n🚫 MERGE BLOCKED - Fix all errors before merging'));
    }

    if (allPassed) {
      console.log(chalk.bold.green('\n🎉 All gates passed! Merge protection complete.'));
      console.log(chalk.green('✅ Safe to merge'));
    }

    return allPassed;
  }

  // Utility: Find files recursively
  findFilesRecursively(dir, ...extensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const walk = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    walk(dir);
    return files;
  }
}

// CLI Interface
async function main() {
  const protection = new CIMergeProtection();
  const success = await protection.runAllGates();
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = { CIMergeProtection };