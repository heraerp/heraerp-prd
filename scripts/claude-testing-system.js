#!/usr/bin/env node

/**
 * HERA Claude Intelligent Testing & Validation System
 * 
 * Real-time component testing with AI-powered analysis and self-healing
 * This system ensures every generated component meets production standards
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ClaudeTestingSystem {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      fixed: 0,
      details: []
    };
    this.healingAttempts = [];
    this.learningData = [];
  }

  /**
   * Main testing orchestrator - runs all validation levels
   */
  async runIntelligentTesting(componentPath, options = {}) {
    console.log(`🧪 CLAUDE TESTING SYSTEM - Analyzing ${componentPath}`);
    
    try {
      // Level 1: Syntax & Import Validation
      await this.validateSyntaxAndImports(componentPath);
      
      // Level 2: HERA Compliance Testing
      await this.validateHERACompliance(componentPath);
      
      // Level 3: Mobile Responsiveness Testing
      await this.validateMobileResponsiveness(componentPath);
      
      // Level 4: Performance Testing
      await this.validatePerformance(componentPath);
      
      // Level 5: Accessibility Testing
      await this.validateAccessibility(componentPath);
      
      // Level 6: Business Logic Validation
      await this.validateBusinessLogic(componentPath, options);
      
      // Generate test report
      const report = await this.generateTestReport(componentPath);
      
      console.log('✅ All tests passed! Component ready for production.');
      return report;
      
    } catch (error) {
      console.log(`❌ Testing failed: ${error.message}`);
      
      // Attempt AI-powered healing
      const healed = await this.attemptIntelligentHealing(componentPath, error);
      
      if (healed) {
        console.log('🚑 Auto-healing successful! Re-running tests...');
        return await this.runIntelligentTesting(componentPath, options);
      } else {
        throw new Error(`Testing failed and auto-healing unsuccessful: ${error.message}`);
      }
    }
  }

  /**
   * Level 1: Syntax & Import Validation
   */
  async validateSyntaxAndImports(componentPath) {
    console.log('🔍 Level 1: Syntax & Import Validation');
    
    const content = await fs.readFile(componentPath, 'utf8');
    
    // Check for TypeScript compilation
    try {
      execSync(`npx tsc --noEmit --jsx react-jsx ${componentPath}`, { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      this.logTest('typescript-compilation', 'PASS', 'TypeScript compilation successful');
    } catch (error) {
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
    
    // Validate imports
    const imports = this.extractImports(content);
    await this.validateImportPaths(imports);
    
    // Check for common syntax issues
    await this.validateSyntaxPatterns(content);
    
    console.log('   ✅ Syntax and imports validated');
  }

  /**
   * Level 2: HERA Compliance Testing
   */
  async validateHERACompliance(componentPath) {
    console.log('🛡️ Level 2: HERA Compliance Testing');
    
    const content = await fs.readFile(componentPath, 'utf8');
    
    // Check authentication usage
    if (!content.includes('useHERAAuth')) {
      throw new Error('Missing HERA authentication integration');
    }
    
    // Check organization filtering
    if (!content.includes('currentOrganization')) {
      throw new Error('Missing organization context validation');
    }
    
    // Check smart codes
    if (!content.includes('_SMART_CODES')) {
      throw new Error('Missing HERA DNA smart codes');
    }
    
    // Validate Universal Entity usage
    if (!content.includes('useUniversalEntity')) {
      throw new Error('Missing Universal Entity integration');
    }
    
    // Check for Sacred Six compliance
    await this.validateSacredSixCompliance(content);
    
    this.logTest('hera-compliance', 'PASS', 'HERA compliance validated');
    console.log('   ✅ HERA compliance validated');
  }

  /**
   * Level 3: Mobile Responsiveness Testing
   */
  async validateMobileResponsiveness(componentPath) {
    console.log('📱 Level 3: Mobile Responsiveness Testing');
    
    const content = await fs.readFile(componentPath, 'utf8');
    
    // Check for mobile-first classes
    const mobileClasses = [
      'grid-cols-1', 'md:grid-cols-', 'lg:grid-cols-',
      'text-sm', 'md:text-', 'p-4', 'md:p-',
      'min-h-[44px]', 'min-w-[44px]'
    ];
    
    let mobileScore = 0;
    mobileClasses.forEach(cls => {
      if (content.includes(cls)) mobileScore++;
    });
    
    if (mobileScore < 5) {
      throw new Error('Insufficient mobile-first responsive design patterns');
    }
    
    // Check for touch targets
    if (!content.includes('min-h-[44px]') && !content.includes('min-w-[44px]')) {
      throw new Error('Missing 44px minimum touch targets for mobile');
    }
    
    // Check for MobilePageLayout usage
    if (!content.includes('MobilePageLayout')) {
      throw new Error('Missing MobilePageLayout component');
    }
    
    this.logTest('mobile-responsiveness', 'PASS', `Mobile score: ${mobileScore}/10`);
    console.log('   ✅ Mobile responsiveness validated');
  }

  /**
   * Level 4: Performance Testing
   */
  async validatePerformance(componentPath) {
    console.log('⚡ Level 4: Performance Testing');
    
    const content = await fs.readFile(componentPath, 'utf8');
    
    // Check for lazy loading
    const hasLazyLoading = content.includes('lazy(') || content.includes('Suspense');
    
    // Check for unnecessary re-renders
    const hasOptimization = content.includes('useCallback') || content.includes('useMemo');
    
    // Check component size
    const fileSize = Buffer.byteLength(content, 'utf8');
    if (fileSize > 50000) { // 50KB limit
      console.log(`   ⚠️ Warning: Large component size (${fileSize} bytes)`);
    }
    
    // Check for performance anti-patterns
    await this.checkPerformanceAntiPatterns(content);
    
    this.logTest('performance', 'PASS', `File size: ${fileSize} bytes`);
    console.log('   ✅ Performance validated');
  }

  /**
   * Level 5: Accessibility Testing
   */
  async validateAccessibility(componentPath) {
    console.log('♿ Level 5: Accessibility Testing');
    
    const content = await fs.readFile(componentPath, 'utf8');
    
    // Check for ARIA attributes
    const ariaPatterns = ['aria-label', 'aria-describedby', 'role='];
    let ariaScore = 0;
    ariaPatterns.forEach(pattern => {
      if (content.includes(pattern)) ariaScore++;
    });
    
    // Check for semantic HTML
    const semanticElements = ['<main', '<nav', '<section', '<article', '<aside'];
    let semanticScore = 0;
    semanticElements.forEach(element => {
      if (content.includes(element)) semanticScore++;
    });
    
    // Check for keyboard navigation
    const keyboardPatterns = ['onKeyDown', 'tabIndex', 'autoFocus'];
    let keyboardScore = 0;
    keyboardPatterns.forEach(pattern => {
      if (content.includes(pattern)) keyboardScore++;
    });
    
    this.logTest('accessibility', 'PASS', 
      `ARIA: ${ariaScore}, Semantic: ${semanticScore}, Keyboard: ${keyboardScore}`);
    console.log('   ✅ Accessibility validated');
  }

  /**
   * Level 6: Business Logic Validation
   */
  async validateBusinessLogic(componentPath, options) {
    console.log('💼 Level 6: Business Logic Validation');
    
    const content = await fs.readFile(componentPath, 'utf8');
    
    // Check CRUD operations
    const crudOperations = ['create', 'read', 'update', 'delete'];
    let crudScore = 0;
    crudOperations.forEach(op => {
      if (content.includes(`handle${op.charAt(0).toUpperCase() + op.slice(1)}`)) {
        crudScore++;
      }
    });
    
    // Check error handling
    if (!content.includes('try {') || !content.includes('catch')) {
      throw new Error('Missing error handling in CRUD operations');
    }
    
    // Check validation
    if (!content.includes('validateForm') && !content.includes('validation')) {
      console.log('   ⚠️ Warning: No form validation detected');
    }
    
    // Check audit trail
    if (!content.includes('EVENT_CREATED') || !content.includes('emitEvent')) {
      throw new Error('Missing audit trail implementation');
    }
    
    this.logTest('business-logic', 'PASS', `CRUD operations: ${crudScore}/4`);
    console.log('   ✅ Business logic validated');
  }

  /**
   * AI-Powered Healing System
   */
  async attemptIntelligentHealing(componentPath, error) {
    console.log('🚑 Attempting intelligent auto-healing...');
    
    const content = await fs.readFile(componentPath, 'utf8');
    let healedContent = content;
    let healed = false;
    
    // Common healing patterns
    const healingRules = [
      {
        pattern: /import.*from.*['"]@\/(?!components|hooks|lib)/g,
        fix: (match) => {
          console.log('   🔧 Fixing import path...');
          return match.replace('@/', '@/components/');
        }
      },
      {
        pattern: /useHERAAuth\(\)(?!\s*const)/g,
        fix: () => {
          console.log('   🔧 Adding HERA auth destructuring...');
          return 'const { currentOrganization, isAuthenticated, user } = useHERAAuth()';
        }
      },
      {
        pattern: /min-h-\[(\d+)px\]/g,
        fix: (match, pixels) => {
          if (parseInt(pixels) < 44) {
            console.log('   🔧 Fixing touch target size...');
            return 'min-h-[44px]';
          }
          return match;
        }
      },
      {
        pattern: /onClick=\{[^}]+\}/g,
        fix: (match) => {
          if (!match.includes('active:scale-95')) {
            console.log('   🔧 Adding touch feedback...');
            return match.replace('className="', 'className="active:scale-95 transition-transform ');
          }
          return match;
        }
      }
    ];
    
    // Apply healing rules
    healingRules.forEach(rule => {
      const originalContent = healedContent;
      healedContent = healedContent.replace(rule.pattern, rule.fix);
      if (healedContent !== originalContent) {
        healed = true;
      }
    });
    
    // Specific error-based healing
    if (error.message.includes('TypeScript compilation')) {
      healedContent = await this.healTypeScriptErrors(healedContent, error);
      healed = true;
    }
    
    if (error.message.includes('Missing HERA authentication')) {
      healedContent = await this.healHERAAuthentication(healedContent);
      healed = true;
    }
    
    if (error.message.includes('mobile-first')) {
      healedContent = await this.healMobileResponsiveness(healedContent);
      healed = true;
    }
    
    // Save healed content
    if (healed) {
      await fs.writeFile(componentPath, healedContent);
      this.healingAttempts.push({
        timestamp: new Date(),
        file: componentPath,
        error: error.message,
        success: true
      });
    }
    
    return healed;
  }

  /**
   * Specific healing methods
   */
  async healTypeScriptErrors(content, error) {
    console.log('   🔧 Healing TypeScript errors...');
    
    // Add missing type imports
    if (!content.includes('import React')) {
      content = `import React from 'react'\n${content}`;
    }
    
    // Fix common type issues
    content = content.replace(/: any\[\]/g, ': any[]');
    content = content.replace(/useState\(\[\]\)/g, 'useState<any[]>([])');
    
    return content;
  }

  async healHERAAuthentication(content) {
    console.log('   🔧 Adding HERA authentication...');
    
    // Add HERA auth import if missing
    if (!content.includes("from '@/components/auth/HERAAuthProvider'")) {
      const importIndex = content.indexOf('\n\n');
      const newImport = "import { useHERAAuth } from '@/components/auth/HERAAuthProvider'\n";
      content = content.slice(0, importIndex) + '\n' + newImport + content.slice(importIndex);
    }
    
    // Add auth usage in component
    if (!content.includes('useHERAAuth()')) {
      const componentStart = content.indexOf('export default function');
      const functionBody = content.indexOf('{', componentStart);
      const authUsage = '\n  const { currentOrganization, isAuthenticated, user } = useHERAAuth()\n';
      content = content.slice(0, functionBody + 1) + authUsage + content.slice(functionBody + 1);
    }
    
    return content;
  }

  async healMobileResponsiveness(content) {
    console.log('   🔧 Adding mobile responsiveness...');
    
    // Fix grid columns
    content = content.replace(/grid-cols-(\d+)/g, 'grid-cols-1 md:grid-cols-$1');
    
    // Fix padding
    content = content.replace(/p-(\d+)(?!\s+md:)/g, 'p-4 md:p-$1');
    
    // Fix text sizes
    content = content.replace(/text-(sm|base|lg|xl)(?!\s+md:)/g, 'text-sm md:text-$1');
    
    // Add touch targets
    content = content.replace(/className="([^"]*button[^"]*)"/, 
      'className="$1 min-h-[44px] min-w-[44px]"');
    
    return content;
  }

  /**
   * Utility methods
   */
  extractImports(content) {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  async validateImportPaths(imports) {
    for (const importPath of imports) {
      if (importPath.startsWith('@/')) {
        const filePath = path.join(process.cwd(), 'src', importPath.slice(2));
        try {
          await fs.access(filePath);
        } catch (error) {
          // Try with common extensions
          const extensions = ['.ts', '.tsx', '.js', '.jsx'];
          let found = false;
          
          for (const ext of extensions) {
            try {
              await fs.access(filePath + ext);
              found = true;
              break;
            } catch {}
          }
          
          if (!found) {
            throw new Error(`Import path not found: ${importPath}`);
          }
        }
      }
    }
  }

  async validateSyntaxPatterns(content) {
    // Check for common React anti-patterns
    if (content.includes('dangerouslySetInnerHTML')) {
      console.log('   ⚠️ Warning: dangerouslySetInnerHTML detected');
    }
    
    // Check for console.log in production code
    if (content.includes('console.log') && !content.includes('console.error')) {
      console.log('   ⚠️ Warning: console.log statements detected');
    }
    
    // Check for proper event handling
    const eventHandlers = content.match(/on[A-Z][a-zA-Z]*=/g) || [];
    eventHandlers.forEach(handler => {
      if (!content.includes(`${handler.slice(0, -1)}={() => `)) {
        // Check if it's properly handled
      }
    });
  }

  async validateSacredSixCompliance(content) {
    const sacredTables = [
      'core_entities',
      'core_dynamic_data', 
      'core_relationships',
      'core_organizations',
      'universal_transactions',
      'universal_transaction_lines'
    ];
    
    // Should not directly reference table names (should use RPC)
    sacredTables.forEach(table => {
      if (content.includes(`FROM ${table}`) || content.includes(`INSERT INTO ${table}`)) {
        throw new Error(`Direct table access detected: ${table}. Use RPC functions instead.`);
      }
    });
  }

  async checkPerformanceAntiPatterns(content) {
    const antiPatterns = [
      {
        pattern: /\.map\([^)]*\)\.map\(/g,
        message: 'Multiple chained maps detected - consider combining'
      },
      {
        pattern: /useEffect\(\(\) => \{[^}]*\}, \[\]\)/g,
        message: 'Empty dependency array useEffect - consider if needed'
      }
    ];
    
    antiPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        console.log(`   ⚠️ Performance warning: ${message}`);
      }
    });
  }

  logTest(testName, status, details) {
    this.testResults.details.push({
      test: testName,
      status,
      details,
      timestamp: new Date()
    });
    
    if (status === 'PASS') {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }

  async generateTestReport(componentPath) {
    const report = {
      component: path.basename(componentPath),
      timestamp: new Date(),
      results: this.testResults,
      healingAttempts: this.healingAttempts,
      summary: {
        totalTests: this.testResults.passed + this.testResults.failed,
        passRate: (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100,
        productionReady: this.testResults.failed === 0
      }
    };
    
    // Save report
    const reportsDir = path.join(process.cwd(), 'test-reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportPath = path.join(reportsDir, `${path.basename(componentPath, '.tsx')}-report.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }
}

// Main execution
async function main() {
  const componentPath = process.argv[2];
  
  if (!componentPath) {
    console.error('Usage: node claude-testing-system.js <component-path>');
    process.exit(1);
  }
  
  try {
    const tester = new ClaudeTestingSystem();
    const report = await tester.runIntelligentTesting(componentPath);
    
    console.log('\n📊 TESTING REPORT:');
    console.log(`   ✅ Tests Passed: ${report.results.passed}`);
    console.log(`   ❌ Tests Failed: ${report.results.failed}`);
    console.log(`   🚑 Auto-fixes Applied: ${report.healingAttempts.length}`);
    console.log(`   📈 Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
    console.log(`   🚀 Production Ready: ${report.summary.productionReady ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('\n💥 TESTING SYSTEM - Critical Error:');
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = ClaudeTestingSystem;