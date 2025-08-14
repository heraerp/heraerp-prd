#!/usr/bin/env node

/**
 * HERA Universal Quality Checker
 * Automatically validates modules after build for CRUD functionality, links, and integration
 * 
 * Usage: node scripts/universal-quality-checker.js [module-path]
 * Example: node scripts/universal-quality-checker.js financial/budgets
 */

const fs = require('fs');
const path = require('path');

class UniversalQualityChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
    
    this.srcPath = path.join(__dirname, '../src');
    this.appPath = path.join(this.srcPath, 'app');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkModule(modulePath) {
    this.log(`🔍 Running Universal Quality Check for: ${modulePath}`, 'info');
    
    const fullPath = path.join(this.appPath, modulePath);
    
    // Check if module exists
    if (!fs.existsSync(fullPath)) {
      this.addIssue('critical', `Module path does not exist: ${fullPath}`, 'MISSING_MODULE');
      return this.generateReport();
    }

    // Run all validation checks
    await this.validateFileStructure(fullPath, modulePath);
    await this.validatePageComponent(fullPath, modulePath);
    await this.validateCRUDFunctionality(fullPath, modulePath);
    await this.validateAPIIntegration(modulePath);
    await this.validateNavigation(modulePath);
    await this.validateTypeSafety(fullPath);
    await this.validateUIComponents(fullPath);
    
    return this.generateReport();
  }

  async validateFileStructure(fullPath, modulePath) {
    this.log('📁 Validating file structure...', 'info');
    
    const requiredFiles = ['page.tsx'];
    const optionalFiles = ['layout.tsx', 'loading.tsx', 'error.tsx'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(fullPath, file);
      if (fs.existsSync(filePath)) {
        this.passed();
      } else {
        this.addIssue('high', `Missing required file: ${file}`, 'MISSING_FILE', `Create ${filePath}`);
      }
    }
    
    for (const file of optionalFiles) {
      const filePath = path.join(fullPath, file);
      if (!fs.existsSync(filePath)) {
        this.addWarning(`Optional file missing: ${file}`, 'MISSING_OPTIONAL_FILE', `Consider adding ${filePath} for better UX`);
      }
    }
  }

  async validatePageComponent(fullPath, modulePath) {
    this.log('⚛️ Validating React component...', 'info');
    
    const pagePath = path.join(fullPath, 'page.tsx');
    if (!fs.existsSync(pagePath)) {
      return;
    }

    const content = fs.readFileSync(pagePath, 'utf8');
    
    // Check for required imports
    const requiredImports = [
      'react',
      'useState',
      'useEffect',
      '@/components/ui/button',
      '@/components/ui/card',
      '@/lib/universal-api'
    ];
    
    requiredImports.forEach(importName => {
      if (content.includes(importName) || content.includes(`from '${importName}'`) || content.includes(`from "${importName}"`)) {
        this.passed();
      } else {
        this.addIssue('medium', `Missing import: ${importName}`, 'MISSING_IMPORT', `Add import for ${importName}`);
      }
    });
    
    // Check for default export
    if (content.includes('export default function') || content.includes('export default')) {
      this.passed();
    } else {
      this.addIssue('high', 'Missing default export', 'MISSING_EXPORT', 'Add default export for the page component');
    }
    
    // Check for proper TypeScript usage
    if (content.includes('interface ') && content.includes(': React.') || content.includes('useState<') || content.includes('useEffect(')) {
      this.passed();
    } else {
      this.addWarning('Limited TypeScript usage detected', 'WEAK_TYPESCRIPT', 'Consider adding more type definitions');
    }
  }

  async validateCRUDFunctionality(fullPath, modulePath) {
    this.log('🔧 Validating CRUD functionality...', 'info');
    
    const pagePath = path.join(fullPath, 'page.tsx');
    if (!fs.existsSync(pagePath)) {
      return;
    }

    const content = fs.readFileSync(pagePath, 'utf8');
    
    // Check for CRUD operations
    const crudChecks = [
      { name: 'CREATE', patterns: ['create', 'new', 'add', 'POST'], found: false },
      { name: 'READ', patterns: ['load', 'fetch', 'get', 'read', 'GET'], found: false },
      { name: 'UPDATE', patterns: ['update', 'edit', 'modify', 'PUT', 'PATCH'], found: false },
      { name: 'DELETE', patterns: ['delete', 'remove', 'DELETE'], found: false }
    ];
    
    crudChecks.forEach(check => {
      check.patterns.forEach(pattern => {
        if (content.toLowerCase().includes(pattern.toLowerCase())) {
          check.found = true;
        }
      });
      
      if (check.found) {
        this.passed();
      } else {
        this.addIssue('high', `Missing ${check.name} functionality`, 'MISSING_CRUD', 
          `Implement ${check.name} operations with proper API integration`);
      }
    });
    
    // Check for form handling
    if (content.includes('onSubmit') || content.includes('handleSubmit') || content.includes('Button')) {
      this.passed();
    } else {
      this.addIssue('medium', 'No form handling detected', 'MISSING_FORMS', 'Add form components for user interactions');
    }
    
    // Check for state management
    if (content.includes('useState') || content.includes('loading') || content.includes('setLoading')) {
      this.passed();
    } else {
      this.addIssue('medium', 'Limited state management', 'WEAK_STATE', 'Add proper state management for loading and data states');
    }
  }

  async validateAPIIntegration(modulePath) {
    this.log('🌐 Validating API integration...', 'info');
    
    // Check if corresponding API route exists
    const apiPath = path.join(this.appPath, 'api', 'v1', modulePath.replace('/page.tsx', ''), 'route.ts');
    const alternateApiPath = path.join(this.appPath, 'api', 'v1', modulePath.split('/')[0], 'route.ts');
    
    if (fs.existsSync(apiPath) || fs.existsSync(alternateApiPath)) {
      this.passed();
    } else {
      this.addIssue('high', `Missing API route: ${apiPath}`, 'MISSING_API', 
        `Create API route at ${apiPath} or ${alternateApiPath}`);
    }
    
    // Check for universal API usage
    const pagePath = path.join(this.appPath, modulePath, 'page.tsx');
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, 'utf8');
      if (content.includes('universalApi') || content.includes('/api/v1/')) {
        this.passed();
      } else {
        this.addWarning('No universal API integration detected', 'WEAK_API_INTEGRATION', 
          'Consider using universalApi for consistent data operations');
      }
    }
  }

  async validateNavigation(modulePath) {
    this.log('🧭 Validating navigation integration...', 'info');
    
    // Check if module is integrated into main navigation
    const layoutFiles = [
      path.join(this.srcPath, 'components', 'layout', 'AppSidebar.tsx'),
      path.join(this.srcPath, 'components', 'layout', 'ProgressiveLayout.tsx'),
      path.join(this.appPath, 'layout.tsx'),
      path.join(this.appPath, 'financial', 'layout.tsx')
    ];
    
    let navigationFound = false;
    const moduleUrl = `/${modulePath}`;
    
    layoutFiles.forEach(layoutFile => {
      if (fs.existsSync(layoutFile)) {
        const content = fs.readFileSync(layoutFile, 'utf8');
        if (content.includes(moduleUrl) || content.includes(modulePath)) {
          navigationFound = true;
        }
      }
    });
    
    if (navigationFound) {
      this.passed();
    } else {
      this.addIssue('medium', 'Module not integrated in navigation', 'MISSING_NAVIGATION', 
        `Add navigation link for ${moduleUrl} in appropriate layout component`);
    }
  }

  async validateTypeSafety(fullPath) {
    this.log('🔒 Validating TypeScript safety...', 'info');
    
    const pagePath = path.join(fullPath, 'page.tsx');
    if (!fs.existsSync(pagePath)) {
      return;
    }

    const content = fs.readFileSync(pagePath, 'utf8');
    
    // Check for proper interface definitions
    if (content.includes('interface ') && content.includes('{')) {
      this.passed();
    } else {
      this.addWarning('No TypeScript interfaces found', 'MISSING_INTERFACES', 'Add proper type definitions');
    }
    
    // Check for any usage (should be avoided)
    const anyUsage = (content.match(/:\s*any/g) || []).length;
    if (anyUsage === 0) {
      this.passed();
    } else {
      this.addWarning(`Found ${anyUsage} 'any' type usage`, 'WEAK_TYPING', 'Replace any types with specific interfaces');
    }
    
    // Check for proper error handling
    if (content.includes('try') && content.includes('catch')) {
      this.passed();
    } else {
      this.addIssue('medium', 'No error handling detected', 'MISSING_ERROR_HANDLING', 'Add try-catch blocks for API calls');
    }
  }

  async validateUIComponents(fullPath) {
    this.log('🎨 Validating UI components...', 'info');
    
    const pagePath = path.join(fullPath, 'page.tsx');
    if (!fs.existsSync(pagePath)) {
      return;
    }

    const content = fs.readFileSync(pagePath, 'utf8');
    
    // Check for consistent UI components
    const uiComponents = [
      'Card', 'Button', 'Input', 'Table', 'Dialog', 'Badge', 'Alert'
    ];
    
    let componentCount = 0;
    uiComponents.forEach(component => {
      if (content.includes(`<${component}`) || content.includes(`<${component}/>`)) {
        componentCount++;
      }
    });
    
    if (componentCount >= 5) {
      this.passed();
    } else {
      this.addWarning(`Only ${componentCount}/7 standard UI components used`, 'LIMITED_UI_COMPONENTS', 
        'Consider using more consistent UI components from shadcn/ui');
    }
    
    // Check for responsive design
    if (content.includes('md:') || content.includes('lg:') || content.includes('responsive')) {
      this.passed();
    } else {
      this.addWarning('Limited responsive design detected', 'WEAK_RESPONSIVE', 'Add responsive classes for mobile compatibility');
    }
    
    // Check for accessibility
    if (content.includes('aria-') || content.includes('role=') || content.includes('alt=')) {
      this.passed();
    } else {
      this.addWarning('Limited accessibility features', 'WEAK_ACCESSIBILITY', 'Add ARIA labels and accessibility features');
    }
  }

  passed() {
    this.results.passed++;
  }

  addIssue(severity, message, code, recommendation = '') {
    this.results.failed++;
    this.results.issues.push({
      severity,
      message,
      code,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    const color = severity === 'critical' ? 'error' : severity === 'high' ? 'error' : 'warning';
    this.log(`❌ ${severity.toUpperCase()}: ${message}`, color);
    if (recommendation) {
      this.log(`   💡 ${recommendation}`, 'info');
    }
  }

  addWarning(message, code, recommendation = '') {
    this.results.warnings++;
    this.results.issues.push({
      severity: 'warning',
      message,
      code,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    this.log(`⚠️ WARNING: ${message}`, 'warning');
    if (recommendation) {
      this.log(`   💡 ${recommendation}`, 'info');
    }
  }

  generateReport() {
    const totalChecks = this.results.passed + this.results.failed;
    const successRate = totalChecks > 0 ? Math.round((this.results.passed / totalChecks) * 100) : 0;
    
    this.log('\n📊 QUALITY CHECK REPORT', 'info');
    this.log('════════════════════════════════════════', 'info');
    this.log(`✅ Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Failed: ${this.results.failed}`, 'error');
    this.log(`⚠️ Warnings: ${this.results.warnings}`, 'warning');
    this.log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error');
    
    // Grade assignment
    let grade = 'F';
    if (successRate >= 95) grade = 'A+';
    else if (successRate >= 90) grade = 'A';
    else if (successRate >= 85) grade = 'B+';
    else if (successRate >= 80) grade = 'B';
    else if (successRate >= 75) grade = 'C+';
    else if (successRate >= 70) grade = 'C';
    else if (successRate >= 60) grade = 'D';
    
    this.log(`🎓 Quality Grade: ${grade}`, grade.includes('A') ? 'success' : grade.includes('B') ? 'warning' : 'error');
    
    if (this.results.issues.length > 0) {
      this.log('\n🔧 ISSUES TO FIX:', 'info');
      this.log('────────────────────────────────────────', 'info');
      
      // Group issues by severity
      const critical = this.results.issues.filter(i => i.severity === 'critical');
      const high = this.results.issues.filter(i => i.severity === 'high');
      const medium = this.results.issues.filter(i => i.severity === 'medium');
      const warnings = this.results.issues.filter(i => i.severity === 'warning');
      
      [
        { name: 'CRITICAL', issues: critical, color: 'error' },
        { name: 'HIGH', issues: high, color: 'error' },
        { name: 'MEDIUM', issues: medium, color: 'warning' },
        { name: 'WARNINGS', issues: warnings, color: 'warning' }
      ].forEach(category => {
        if (category.issues.length > 0) {
          this.log(`\n${category.name} PRIORITY (${category.issues.length}):`, category.color);
          category.issues.forEach((issue, index) => {
            this.log(`  ${index + 1}. ${issue.message}`, category.color);
            if (issue.recommendation) {
              this.log(`     → ${issue.recommendation}`, 'info');
            }
          });
        }
      });
    }
    
    // Generate automated fix suggestions
    this.generateFixSuggestions();
    
    return {
      grade,
      successRate,
      ...this.results,
      recommendations: this.generateRecommendations()
    };
  }

  generateFixSuggestions() {
    this.log('\n🔨 AUTOMATED FIX SUGGESTIONS:', 'info');
    this.log('────────────────────────────────────────', 'info');
    
    const fixSuggestions = [];
    
    // Analyze common issues and provide fix templates
    const missingCrudIssues = this.results.issues.filter(i => i.code === 'MISSING_CRUD');
    if (missingCrudIssues.length > 0) {
      fixSuggestions.push({
        title: 'Add CRUD Operations',
        command: 'npm run generate-crud --module=<module-name>',
        description: 'Generate complete CRUD operations with API integration'
      });
    }
    
    const missingApiIssues = this.results.issues.filter(i => i.code === 'MISSING_API');
    if (missingApiIssues.length > 0) {
      fixSuggestions.push({
        title: 'Create API Routes',
        command: 'npm run generate-api --module=<module-name>',
        description: 'Generate corresponding API routes for the module'
      });
    }
    
    fixSuggestions.forEach((suggestion, index) => {
      this.log(`${index + 1}. ${suggestion.title}:`, 'info');
      this.log(`   Command: ${suggestion.command}`, 'success');
      this.log(`   ${suggestion.description}`, 'info');
    });
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.failed > this.results.passed) {
      recommendations.push('Consider using HERA generators to create standardized modules');
      recommendations.push('Run: npm run generate-module --name=<module> --type=financial');
    }
    
    if (this.results.issues.some(i => i.code === 'MISSING_API')) {
      recommendations.push('Implement universal API integration for consistent data operations');
    }
    
    if (this.results.issues.some(i => i.code === 'MISSING_NAVIGATION')) {
      recommendations.push('Add navigation links to improve module discoverability');
    }
    
    return recommendations;
  }

  // Static method to check all financial modules
  static async checkAllFinancialModules() {
    const checker = new UniversalQualityChecker();
    const financialModules = [
      'financial/gl',
      'financial/ap', 
      'financial/ar',
      'financial/fixed-assets',
      'financial/banks',
      'financial/budgets'
    ];
    
    const results = [];
    
    for (const module of financialModules) {
      checker.log(`\n🔍 Checking ${module}...`, 'info');
      const result = await checker.checkModule(module);
      results.push({ module, ...result });
      
      // Reset for next module
      checker.results = { passed: 0, failed: 0, warnings: 0, issues: [] };
    }
    
    // Generate overall report
    checker.log('\n📈 OVERALL FINANCIAL SUITE QUALITY REPORT', 'info');
    checker.log('═══════════════════════════════════════════════', 'info');
    
    results.forEach(result => {
      const status = result.grade.includes('A') ? '✅' : result.grade.includes('B') ? '⚠️' : '❌';
      checker.log(`${status} ${result.module}: ${result.grade} (${result.successRate}%)`, 
        result.grade.includes('A') ? 'success' : result.grade.includes('B') ? 'warning' : 'error');
    });
    
    return results;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const checker = new UniversalQualityChecker();
  
  if (args[0] === '--all-financial') {
    UniversalQualityChecker.checkAllFinancialModules()
      .then(results => {
        const overallGrade = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
        checker.log(`\n🎓 Overall Financial Suite Grade: ${overallGrade >= 90 ? 'A' : overallGrade >= 80 ? 'B' : overallGrade >= 70 ? 'C' : 'D'} (${overallGrade.toFixed(1)}%)`, 
          overallGrade >= 80 ? 'success' : 'warning');
      })
      .catch(error => {
        checker.log(`Error: ${error.message}`, 'error');
        process.exit(1);
      });
  } else if (args[0]) {
    checker.checkModule(args[0])
      .then(result => {
        process.exit(result.grade.includes('A') || result.grade.includes('B') ? 0 : 1);
      })
      .catch(error => {
        checker.log(`Error: ${error.message}`, 'error');
        process.exit(1);
      });
  } else {
    checker.log('Usage: node scripts/universal-quality-checker.js <module-path>', 'info');
    checker.log('       node scripts/universal-quality-checker.js --all-financial', 'info');
    checker.log('Example: node scripts/universal-quality-checker.js financial/budgets', 'info');
  }
}

module.exports = { UniversalQualityChecker };