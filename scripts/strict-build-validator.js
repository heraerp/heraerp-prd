#!/usr/bin/env node

/**
 * Strict Build Validator for HERA
 * 
 * Performs comprehensive validation before builds to catch all TypeScript,
 * import, and Next.js issues early.
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class StrictBuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async validateTypeScript() {
    this.log('\n🔍 Running TypeScript validation...', 'cyan');
    
    return new Promise((resolve) => {
      exec('npx tsc --noEmit --pretty false', (error, stdout, stderr) => {
        if (error) {
          const errors = stdout.split('\n').filter(line => line.trim());
          errors.forEach(error => {
            if (error.includes(': error TS')) {
              this.errors.push({
                type: 'typescript',
                message: error,
                fix: this.getTypeScriptFix(error)
              });
            }
          });
        }
        resolve();
      });
    });
  }

  getTypeScriptFix(error) {
    // Common TypeScript fixes
    if (error.includes("Cannot find name 'Shield'")) {
      return "Add: import { Shield } from 'lucide-react'";
    }
    if (error.includes("Object is possibly 'undefined'")) {
      return "Add optional chaining (?.) or null check";
    }
    if (error.includes("Property does not exist on type")) {
      return "Check type definitions or add type assertion";
    }
    return null;
  }

  async validateImports() {
    this.log('\n📦 Validating imports...', 'cyan');
    
    const files = glob.sync('src/**/*.{ts,tsx}', { 
      ignore: ['node_modules/**', '.next/**', 'src/**/*.test.{ts,tsx}']
    });

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check for lucide-react imports
      const lucideImports = [...content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)];
      
      for (const match of lucideImports) {
        const icons = match[1].split(',').map(icon => icon.trim());
        
        for (const icon of icons) {
          // Check if icon is used in the file
          const iconRegex = new RegExp(`<${icon}[\\s/>]|icon:\\s*${icon}|Icon\\s*=\\s*${icon}`, 'g');
          if (!iconRegex.test(content.substring(match.index + match[0].length))) {
            this.warnings.push({
              type: 'unused-import',
              file,
              message: `Unused icon import: ${icon}`,
              fix: `Remove ${icon} from lucide-react imports`
            });
          }
        }
      }

      // Check for missing icons used but not imported
      const iconUsages = [...content.matchAll(/icon:\s*(\w+)|<(\w+)\s+className/g)];
      const importedIcons = lucideImports.flatMap(m => 
        m[1].split(',').map(icon => icon.trim())
      );
      
      for (const usage of iconUsages) {
        const iconName = usage[1] || usage[2];
        if (iconName && iconName[0] === iconName[0].toUpperCase() && 
            !importedIcons.includes(iconName) && 
            !iconName.includes('Icon')) {
          
          // Check if it might be a lucide icon
          if (this.isLikelyLucideIcon(iconName)) {
            this.errors.push({
              type: 'missing-import',
              file,
              message: `Icon '${iconName}' used but not imported`,
              fix: `Add ${iconName} to lucide-react imports`
            });
          }
        }
      }
    }
  }

  isLikelyLucideIcon(name) {
    const commonIcons = ['Shield', 'ShieldCheck', 'Heart', 'Users', 'Calendar', 
                        'Settings', 'Home', 'Menu', 'X', 'Check', 'Plus', 'Minus'];
    return commonIcons.includes(name);
  }

  async validateNextJs15() {
    this.log('\n⚡ Checking Next.js 15 compatibility...', 'cyan');
    
    const files = glob.sync('src/**/*.{ts,tsx}', { 
      ignore: ['node_modules/**', '.next/**']
    });

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check useSearchParams without Suspense
      if (content.includes('useSearchParams()')) {
        const hasSuspense = content.includes('<Suspense') || 
                           content.includes('Suspense>') ||
                           file.includes('loading.tsx');
        
        if (!hasSuspense) {
          this.errors.push({
            type: 'nextjs15',
            file,
            message: 'useSearchParams() must be wrapped in Suspense',
            fix: 'Wrap component with <Suspense fallback={<LoadingSpinner />}>'
          });
        }
      }

      // Check toast imports
      if (content.includes('@/components/ui/use-toast')) {
        this.errors.push({
          type: 'import-path',
          file,
          message: 'Incorrect toast import path',
          fix: "Change to: import { useToast } from '@/hooks/use-toast'"
        });
      }

      // Check missing 'use client' for client components
      const clientHooks = ['useState', 'useEffect', 'useContext', 'useReducer'];
      const usesClientHooks = clientHooks.some(hook => content.includes(hook));
      const hasUseClient = content.startsWith("'use client'") || content.startsWith('"use client"');
      
      if (usesClientHooks && !hasUseClient && !file.includes('/api/')) {
        this.warnings.push({
          type: 'missing-directive',
          file,
          message: 'Component uses client hooks but missing "use client" directive',
          fix: 'Add "use client" at the top of the file'
        });
      }
    }
  }

  async runESLint() {
    this.log('\n🔧 Running ESLint...', 'cyan');
    
    return new Promise((resolve) => {
      exec('npx eslint src --ext .ts,.tsx --format compact', (error, stdout, stderr) => {
        if (error && stdout) {
          const lines = stdout.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            if (line.includes('Warning:')) {
              this.warnings.push({
                type: 'eslint',
                message: line
              });
            } else if (line.includes('Error:')) {
              this.errors.push({
                type: 'eslint',
                message: line
              });
            }
          });
        }
        resolve();
      });
    });
  }

  async applyAutoFixes() {
    if (this.fixes.length === 0) return;
    
    this.log('\n🔧 Applying automatic fixes...', 'yellow');
    
    for (const fix of this.fixes) {
      this.log(`  Fixing: ${fix.file}`, 'blue');
      this.log(`    ${fix.description}`, 'cyan');
      
      try {
        await fs.writeFile(fix.file, fix.content);
        this.log(`    ✓ Fixed`, 'green');
      } catch (error) {
        this.log(`    ✗ Failed: ${error.message}`, 'red');
      }
    }
  }

  showReport() {
    console.log('\n' + '='.repeat(80));
    this.log('📊 Build Validation Report', 'cyan');
    console.log('='.repeat(80));

    const totalIssues = this.errors.length + this.warnings.length;
    
    if (totalIssues === 0) {
      this.log('\n✅ All checks passed! Ready to build.', 'green');
      return true;
    }

    if (this.errors.length > 0) {
      this.log(`\n❌ Errors (${this.errors.length}):`, 'red');
      this.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.message}`);
        if (error.file) {
          console.log(`   File: ${error.file}`);
        }
        if (error.fix) {
          console.log(`   💡 Fix: ${colors.yellow}${error.fix}${colors.reset}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠️  Warnings (${this.warnings.length}):`, 'yellow');
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.message}`);
        if (warning.file) {
          console.log(`   File: ${warning.file}`);
        }
        if (warning.fix) {
          console.log(`   💡 Suggestion: ${colors.cyan}${warning.fix}${colors.reset}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    
    return this.errors.length === 0;
  }

  async run() {
    console.clear();
    this.log('🚀 HERA Strict Build Validator\n', 'cyan');
    
    const startTime = Date.now();
    
    // Run all validations
    await this.validateTypeScript();
    await this.validateImports();
    await this.validateNextJs15();
    await this.runESLint();
    
    // Apply auto-fixes if available
    if (this.fixes.length > 0) {
      await this.applyAutoFixes();
    }
    
    // Show report
    const success = this.showReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.log(`\n⏱️  Validation completed in ${duration}s`, 'cyan');
    
    if (!success) {
      this.log('\n❌ Build validation failed. Fix errors before building.', 'red');
      process.exit(1);
    } else {
      this.log('\n✅ Build validation passed!', 'green');
      process.exit(0);
    }
  }
}

// Run validator
if (require.main === module) {
  const validator = new StrictBuildValidator();
  validator.run().catch(console.error);
}

module.exports = StrictBuildValidator;