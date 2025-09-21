#!/usr/bin/env node

/**
 * Auto Fix TypeScript Issues
 * 
 * Automatically fixes common TypeScript errors in the HERA codebase
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TypeScriptAutoFixer {
  constructor() {
    this.fixes = 0;
    this.files = new Set();
  }

  log(message, emoji = '📝') {
    console.log(`${emoji} ${message}`);
  }

  async findMissingImports() {
    this.log('Scanning for missing imports...', '🔍');
    
    try {
      const { stdout } = await execAsync('npx tsc --noEmit --pretty false');
    } catch (error) {
      if (error.stdout) {
        const lines = error.stdout.split('\n');
        for (const line of lines) {
          // Parse TypeScript errors for missing imports
          const match = line.match(/(.+?)\((\d+),(\d+)\): error TS2304: Cannot find name '(\w+)'\./);
          if (match) {
            const [, file, lineNum, colNum, missingName] = match;
            await this.fixMissingImport(file, missingName);
          }
        }
      }
    }
  }

  async fixMissingImport(file, missingName) {
    const lucideIcons = [
      'Shield', 'ShieldCheck', 'Heart', 'Users', 'Calendar', 'Settings',
      'Home', 'Menu', 'X', 'Check', 'Plus', 'Minus', 'ChevronRight',
      'ChevronLeft', 'ChevronDown', 'ChevronUp', 'Search', 'Filter',
      'Edit', 'Trash', 'Save', 'Download', 'Upload', 'Copy', 'Clipboard',
      'Mail', 'Phone', 'MapPin', 'Clock', 'AlertCircle', 'Info',
      'CheckCircle', 'XCircle', 'AlertTriangle', 'Zap', 'Star',
      'Package', 'ShoppingCart', 'Truck', 'CreditCard', 'DollarSign',
      'Scissors', 'UtensilsCrossed'
    ];

    if (lucideIcons.includes(missingName)) {
      await this.addLucideImport(file, missingName);
    }
  }

  async addLucideImport(file, iconName) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check if lucide-react import already exists
      const lucideImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
      
      if (lucideImportMatch) {
        // Add to existing import
        const currentIcons = lucideImportMatch[1].split(',').map(icon => icon.trim());
        
        if (!currentIcons.includes(iconName)) {
          currentIcons.push(iconName);
          currentIcons.sort();
          
          const newImport = `import { ${currentIcons.join(', ')} } from 'lucide-react'`;
          const updatedContent = content.replace(lucideImportMatch[0], newImport);
          
          await fs.writeFile(file, updatedContent);
          this.log(`Added ${iconName} to existing lucide-react import in ${file}`, '✅');
          this.fixes++;
          this.files.add(file);
        }
      } else {
        // Add new import after other imports
        const importRegex = /import\s+.+\s+from\s+['"][^'"]+['"]/g;
        const imports = content.match(importRegex) || [];
        
        if (imports.length > 0) {
          const lastImport = imports[imports.length - 1];
          const lastImportIndex = content.lastIndexOf(lastImport);
          const insertPosition = lastImportIndex + lastImport.length;
          
          const newImport = `\nimport { ${iconName} } from 'lucide-react'`;
          const updatedContent = 
            content.slice(0, insertPosition) + 
            newImport + 
            content.slice(insertPosition);
          
          await fs.writeFile(file, updatedContent);
          this.log(`Added new lucide-react import for ${iconName} in ${file}`, '✅');
          this.fixes++;
          this.files.add(file);
        }
      }
    } catch (error) {
      this.log(`Failed to fix import in ${file}: ${error.message}`, '❌');
    }
  }

  async fixUseSearchParams() {
    this.log('Checking for useSearchParams without Suspense...', '🔍');
    
    const files = glob.sync('src/**/*.{tsx}', {
      ignore: ['node_modules/**', '.next/**', '**/*.test.tsx']
    });

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      if (content.includes('useSearchParams()') && !content.includes('<Suspense')) {
        await this.wrapWithSuspense(file);
      }
    }
  }

  async wrapWithSuspense(file) {
    try {
      let content = await fs.readFile(file, 'utf-8');
      
      // Check if Suspense is imported
      if (!content.includes('Suspense')) {
        // Add Suspense import
        if (content.includes('from \'react\'')) {
          content = content.replace(
            /from\s+['"]react['"]/,
            ', Suspense from \'react\''
          );
        } else {
          const firstImport = content.match(/import\s+.+\s+from/);
          if (firstImport) {
            const insertPos = content.indexOf(firstImport[0]);
            content = 
              content.slice(0, insertPos) + 
              `import { Suspense } from 'react'\n` +
              content.slice(insertPos);
          }
        }
      }
      
      // Find the component that uses useSearchParams
      const componentMatch = content.match(/(?:export\s+)?(?:default\s+)?function\s+(\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        
        // Create a wrapper component
        const wrapperName = `${componentName}WithSuspense`;
        const wrapper = `
// Wrapper component with Suspense boundary for Next.js 15
export default function ${wrapperName}() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <${componentName} />
    </Suspense>
  )
}`;

        // Replace export
        content = content.replace(
          /export\s+default\s+function\s+\w+/,
          `function ${componentName}`
        );
        
        // Add wrapper at the end
        content += wrapper;
        
        await fs.writeFile(file, content);
        this.log(`Wrapped ${componentName} with Suspense in ${file}`, '✅');
        this.fixes++;
        this.files.add(file);
      }
    } catch (error) {
      this.log(`Failed to add Suspense to ${file}: ${error.message}`, '❌');
    }
  }

  async fixToastImports() {
    this.log('Fixing toast import paths...', '🔍');
    
    const files = glob.sync('src/**/*.{ts,tsx}', {
      ignore: ['node_modules/**', '.next/**']
    });

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      if (content.includes('@/components/ui/use-toast')) {
        const updatedContent = content.replace(
          /@\/components\/ui\/use-toast/g,
          '@/hooks/use-toast'
        );
        
        await fs.writeFile(file, updatedContent);
        this.log(`Fixed toast import in ${file}`, '✅');
        this.fixes++;
        this.files.add(file);
      }
    }
  }

  async formatFiles() {
    if (this.files.size === 0) return;
    
    this.log(`Formatting ${this.files.size} fixed files...`, '🎨');
    
    for (const file of this.files) {
      try {
        await execAsync(`npx prettier --write "${file}"`);
      } catch (error) {
        this.log(`Failed to format ${file}`, '⚠️');
      }
    }
  }

  async run() {
    console.clear();
    this.log('🔧 HERA TypeScript Auto-Fixer\n', '🚀');
    
    const startTime = Date.now();
    
    // Run all fixes
    await this.findMissingImports();
    await this.fixUseSearchParams();
    await this.fixToastImports();
    
    // Format fixed files
    if (this.fixes > 0) {
      await this.formatFiles();
    }
    
    // Report
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    
    if (this.fixes === 0) {
      this.log('No fixes needed! Your code is clean.', '✨');
    } else {
      this.log(`Applied ${this.fixes} fixes in ${this.files.size} files`, '✅');
      this.log(`Completed in ${duration}s`, '⏱️');
      
      console.log('\nFixed files:');
      for (const file of this.files) {
        console.log(`  - ${file}`);
      }
      
      this.log('\nRun "npm run typecheck" to verify all issues are resolved', '💡');
    }
    
    console.log('='.repeat(60));
  }
}

// Run auto-fixer
if (require.main === module) {
  const fixer = new TypeScriptAutoFixer();
  fixer.run().catch(console.error);
}

module.exports = TypeScriptAutoFixer;