#!/usr/bin/env node
/**
 * HERA Auto-Validator - Permanent Background Validation System
 * Automatically validates TypeScript and modules after every file save
 * This runs transparently in the background during development
 */

const chokidar = require('chokidar');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

function log(color, message, timestamp = true) {
  const time = timestamp ? `${colors.gray}[${new Date().toLocaleTimeString()}]${colors.reset} ` : '';
  console.log(`${time}${colors[color]}${message}${colors.reset}`);
}

class HERAAutoValidator {
  constructor() {
    this.isValidating = false;
    this.validationQueue = new Set();
    this.lastValidation = {};
    this.stats = {
      filesChecked: 0,
      errorsFound: 0,
      startTime: Date.now()
    };
    
    this.initializeWatcher();
    this.showStartupBanner();
  }

  showStartupBanner() {
    console.clear();
    log('cyan', '🛡️  HERA Auto-Validator Started', false);
    log('blue', '     Permanent background validation is now active', false);
    log('gray', '     TypeScript & Module validation on every save', false);
    log('gray', '     Press Ctrl+C to stop\n', false);
  }

  initializeWatcher() {
    const watcher = chokidar.watch([
      'src/**/*.{js,jsx,ts,tsx}',
      'components/**/*.{js,jsx,ts,tsx}',
      '!node_modules/**',
      '!.next/**',
      '!dist/**',
      '!build/**'
    ], {
      ignored: /node_modules|\.git|\.next|dist|build/,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    watcher.on('change', (filePath) => this.handleFileChange(filePath));
    watcher.on('add', (filePath) => this.handleFileChange(filePath));
    watcher.on('error', (error) => log('red', `Watcher error: ${error.message}`));

    // Graceful shutdown
    process.on('SIGINT', () => {
      log('yellow', '\n🛑 Auto-validator shutting down...');
      this.showStats();
      process.exit(0);
    });
  }

  async handleFileChange(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Skip non-source files
    if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) return;
    
    // Add to validation queue
    this.validationQueue.add(filePath);
    
    // Debounce validation
    clearTimeout(this.validationTimeout);
    this.validationTimeout = setTimeout(() => {
      this.validateQueuedFiles();
    }, 500);
  }

  async validateQueuedFiles() {
    if (this.isValidating || this.validationQueue.size === 0) return;
    
    this.isValidating = true;
    const filesToValidate = Array.from(this.validationQueue);
    this.validationQueue.clear();

    const startTime = Date.now();
    let hasErrors = false;

    try {
      // Show validation start
      if (filesToValidate.length === 1) {
        const file = path.relative(process.cwd(), filesToValidate[0]);
        log('blue', `🔍 Validating ${file}...`);
      } else {
        log('blue', `🔍 Validating ${filesToValidate.length} files...`);
      }

      // Run TypeScript check
      const tsResult = await this.checkTypeScript(filesToValidate);
      
      // Run module check
      const moduleResult = await this.checkModules(filesToValidate);
      
      // Run JSX entity check
      const jsxResult = await this.checkJSXEntities(filesToValidate);

      const duration = Date.now() - startTime;
      
      if (tsResult && moduleResult && jsxResult) {
        log('green', `✅ All checks passed (${duration}ms)`);
      } else {
        hasErrors = true;
        this.stats.errorsFound++;
        log('red', `❌ Validation failed (${duration}ms)`);
      }

      this.stats.filesChecked += filesToValidate.length;

    } catch (error) {
      log('red', `💥 Validation error: ${error.message}`);
      hasErrors = true;
    } finally {
      this.isValidating = false;
    }

    // Auto-suggest fixes if errors found
    if (hasErrors) {
      setTimeout(() => {
        log('yellow', '💡 Tip: Run `npm run fix:auto` to auto-fix common issues');
      }, 1000);
    }
  }

  async checkTypeScript(files) {
    try {
      const tsFiles = files.filter(f => f.match(/\.(ts|tsx)$/));
      if (tsFiles.length === 0) return true;

      // Use incremental TypeScript compilation for speed
      execSync('npx tsc --noEmit --skipLibCheck --incremental', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      return true;
    } catch (error) {
      // Parse and display TypeScript errors concisely
      const output = error.stdout || error.stderr || '';
      const errors = this.parseTypeScriptErrors(output);
      
      if (errors.length > 0) {
        log('red', '🔧 TypeScript Issues:');
        errors.slice(0, 3).forEach(err => { // Show max 3 errors
          log('yellow', `   ${err.file}:${err.line} - ${err.message}`);
        });
        
        if (errors.length > 3) {
          log('gray', `   ... and ${errors.length - 3} more errors`);
        }
      }
      
      return false;
    }
  }

  async checkModules(files) {
    try {
      const missingModules = new Set();
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const imports = this.extractImports(content);
        
        for (const importPath of imports) {
          if (!await this.moduleExists(importPath)) {
            missingModules.add(importPath);
          }
        }
      }
      
      if (missingModules.size > 0) {
        log('red', '📦 Missing Modules:');
        Array.from(missingModules).slice(0, 3).forEach(module => {
          log('yellow', `   ${module}`);
        });
        
        if (missingModules.size > 3) {
          log('gray', `   ... and ${missingModules.size - 3} more missing`);
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      return true; // Don't fail on module check errors
    }
  }

  async checkJSXEntities(files) {
    try {
      const jsxFiles = files.filter(f => f.match(/\.(jsx|tsx)$/));
      if (jsxFiles.length === 0) return true;

      const issues = [];
      
      for (const file of jsxFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Check for unescaped < in JSX content
          if (line.match(/>[^<]*<[^>]*</)) {
            issues.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              message: 'Unescaped < character - use &lt; or {\'<\'}'
            });
          }
          
          // Check for unescaped & in JSX content  
          if (line.match(/>[^&]*&[^&;]*</)) {
            issues.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              message: 'Unescaped & character - use &amp;'
            });
          }
        });
      }
      
      if (issues.length > 0) {
        log('red', '🔤 JSX Entity Issues:');
        issues.slice(0, 3).forEach(issue => {
          log('yellow', `   ${issue.file}:${issue.line} - ${issue.message}`);
        });
        
        if (issues.length > 3) {
          log('gray', `   ... and ${issues.length - 3} more issues`);
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      return true; // Don't fail on JSX check errors
    }
  }

  parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\): (.+)$/);
      if (match) {
        const [, file, lineNum, colNum, message] = match;
        errors.push({
          file: path.relative(process.cwd(), file),
          line: lineNum,
          col: colNum,
          message: message.replace(/^error TS\d+: /, '').substring(0, 80) + '...'
        });
      }
    }
    
    return errors;
  }

  extractImports(content) {
    const imports = [];
    
    // ES6 imports: import ... from 'module'
    const es6ImportRegex = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Dynamic imports: import('module')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports.filter(imp => 
      // Filter out relative imports and built-ins
      !imp.startsWith('.') && 
      !imp.startsWith('/') &&
      !['fs', 'path', 'os', 'crypto', 'util', 'events'].includes(imp)
    );
  }

  async moduleExists(moduleName) {
    try {
      // Check if it's in node_modules
      const packagePath = path.join(process.cwd(), 'node_modules', moduleName.split('/')[0], 'package.json');
      if (fs.existsSync(packagePath)) {
        return true;
      }
      
      // Check TypeScript path mappings
      const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
      if (fs.existsSync(tsConfigPath)) {
        const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
        const paths = tsConfig.compilerOptions?.paths || {};
        
        for (const [pattern, mappings] of Object.entries(paths)) {
          const regex = new RegExp(pattern.replace('*', '(.*)'));
          const match = moduleName.match(regex);
          if (match && mappings.length > 0) {
            const resolvedPath = mappings[0].replace('*', match[1] || '');
            const fullPath = path.join(process.cwd(), resolvedPath);
            
            // Check various extensions
            const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
            for (const ext of extensions) {
              if (fs.existsSync(fullPath + ext)) {
                return true;
              }
            }
          }
        }
      }
      
      return false;
    } catch {
      return true; // Assume it exists if we can't check
    }
  }

  showStats() {
    const runtime = Math.round((Date.now() - this.stats.startTime) / 1000);
    log('cyan', '\n📊 Auto-Validator Session Stats:', false);
    log('gray', `   Runtime: ${runtime}s`, false);
    log('gray', `   Files checked: ${this.stats.filesChecked}`, false);
    log('gray', `   Errors found: ${this.stats.errorsFound}`, false);
    log('green', '   Thanks for using HERA Auto-Validator! 🚀\n', false);
  }
}

// Start the auto-validator
new HERAAutoValidator();