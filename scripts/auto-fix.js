#!/usr/bin/env node
/**
 * HERA Auto-Fix - Automatic Code Issue Resolution
 * Fixes common TypeScript, JSX, and import issues automatically
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class HERAAutoFix {
  constructor() {
    this.fixedFiles = new Set();
    this.fixedIssues = 0;
  }

  async run() {
    log('blue', '🔧 HERA Auto-Fix Starting...');
    
    // Fix JSX entities
    await this.fixJSXEntities();
    
    // Fix import issues
    await this.fixImportIssues();
    
    // Fix TypeScript issues (where possible)
    await this.fixTypeScriptIssues();
    
    // Run Prettier for formatting
    await this.runPrettier();

    this.showSummary();
  }

  async fixJSXEntities() {
    log('blue', '🔤 Fixing JSX entity issues...');
    
    const jsxFiles = await this.getSourceFiles(/\.(jsx|tsx)$/);
    
    for (const file of jsxFiles) {
      const content = fs.readFileSync(file, 'utf8');
      let modified = content;
      
      // Fix unescaped < characters in JSX content
      // Look for pattern: >...text with < character...<
      modified = modified.replace(
        /(\>)([^<]*?)(<)([^>]*?)(<)/g,
        (match, openBracket, beforeChar, lessThan, afterChar, closeBracket) => {
          // Only replace if it's actually text content, not a tag
          if (beforeChar.trim() && !beforeChar.includes('{')) {
            return openBracket + beforeChar + '&lt;' + afterChar + closeBracket;
          }
          return match;
        }
      );
      
      // Fix unescaped & characters in JSX content
      modified = modified.replace(
        /(\>)([^<]*?)(&)([^&;<]*?)(<)/g,
        (match, openBracket, beforeChar, ampersand, afterChar, closeBracket) => {
          // Only replace if it's actually text content and not already an entity
          if (beforeChar.trim() && !afterChar.startsWith('lt;') && !afterChar.startsWith('gt;') && !afterChar.startsWith('amp;')) {
            return openBracket + beforeChar + '&amp;' + afterChar + closeBracket;
          }
          return match;
        }
      );
      
      if (modified !== content) {
        fs.writeFileSync(file, modified);
        this.fixedFiles.add(file);
        this.fixedIssues++;
        log('green', `   ✅ Fixed JSX entities in ${path.relative(process.cwd(), file)}`);
      }
    }
  }

  async fixImportIssues() {
    log('blue', '📦 Fixing import issues...');
    
    const sourceFiles = await this.getSourceFiles(/\.(js|jsx|ts|tsx)$/);
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      let modified = content;
      
      // Fix common import path issues
      modified = modified.replace(
        /from ['"]@\/components\/([^'"]+)['"]/g,
        (match, componentPath) => {
          // Check if the component actually exists
          const possiblePaths = [
            `src/components/${componentPath}.tsx`,
            `src/components/${componentPath}.ts`, 
            `src/components/${componentPath}/index.tsx`,
            `src/components/${componentPath}/index.ts`
          ];
          
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              return match; // Path is correct
            }
          }
          
          // Try to find the actual path
          const actualPath = this.findComponentPath(componentPath);
          if (actualPath) {
            const newImport = `from '@/components/${actualPath}'`;
            log('yellow', `   🔄 Fixed import path: ${componentPath} → ${actualPath}`);
            this.fixedIssues++;
            return newImport;
          }
          
          return match;
        }
      );
      
      if (modified !== content) {
        fs.writeFileSync(file, modified);
        this.fixedFiles.add(file);
      }
    }
  }

  async fixTypeScriptIssues() {
    log('blue', '🔧 Fixing TypeScript issues...');
    
    const tsFiles = await this.getSourceFiles(/\.(ts|tsx)$/);
    
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      let modified = content;
      
      // Fix common missing semicolons
      modified = modified.replace(/^(\s*)(import .+)$/gm, '$1$2;');
      modified = modified.replace(/^(\s*)(export .+)$/gm, '$1$2;');
      
      // Fix common unused imports (basic cases)
      const lines = modified.split('\n');
      const fixedLines = lines.filter(line => {
        // Remove unused React import if React is not used
        if (line.includes("import React") && !modified.includes('React.') && !modified.includes('<')) {
          this.fixedIssues++;
          log('yellow', `   🧹 Removed unused React import in ${path.relative(process.cwd(), file)}`);
          return false;
        }
        return true;
      });
      
      modified = fixedLines.join('\n');
      
      if (modified !== content) {
        fs.writeFileSync(file, modified);
        this.fixedFiles.add(file);
      }
    }
  }

  async runPrettier() {
    log('blue', '✨ Running Prettier for formatting...');
    
    try {
      execSync('npx prettier --write "src/**/*.{js,jsx,ts,tsx}" --ignore-unknown', {
        stdio: 'pipe'
      });
      log('green', '   ✅ Code formatted with Prettier');
    } catch (error) {
      log('yellow', '   ⚠️  Prettier formatting skipped (not configured)');
    }
  }

  findComponentPath(componentPath) {
    // This is a simplified component finder
    // In a real implementation, you'd want more sophisticated path resolution
    const componentsDir = path.join(process.cwd(), 'src/components');
    
    try {
      const files = this.getAllFiles(componentsDir);
      const targetFile = componentPath.split('/').pop();
      
      for (const file of files) {
        if (path.basename(file, path.extname(file)) === targetFile) {
          return path.relative(componentsDir, file).replace(/\.[^.]+$/, '');
        }
      }
    } catch (error) {
      // Component directory might not exist
    }
    
    return null;
  }

  async getSourceFiles(pattern) {
    const files = [];
    const srcDir = path.join(process.cwd(), 'src');
    
    if (!fs.existsSync(srcDir)) return files;
    
    const allFiles = this.getAllFiles(srcDir);
    return allFiles.filter(file => pattern.test(file));
  }

  getAllFiles(dir) {
    const files = [];
    
    function walkDir(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    walkDir(dir);
    return files;
  }

  showSummary() {
    log('green', '\n🎉 Auto-Fix Complete!');
    log('blue', `   Fixed ${this.fixedIssues} issues in ${this.fixedFiles.size} files`);
    
    if (this.fixedFiles.size > 0) {
      log('yellow', '\n📁 Modified files:');
      this.fixedFiles.forEach(file => {
        log('gray', `   • ${path.relative(process.cwd(), file)}`);
      });
    }
    
    log('blue', '\n💡 Run the auto-validator to verify fixes worked!');
  }
}

// Run auto-fix
new HERAAutoFix().run();