#!/usr/bin/env node

/**
 * Enhanced Build System for HERA
 * 
 * Provides real-time TypeScript error checking, import validation, and build monitoring
 * to catch errors during development before they reach production builds.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class EnhancedBuildSystem {
  constructor() {
    this.errors = new Map();
    this.warnings = new Map();
    this.isBuilding = false;
    this.lastBuildTime = null;
    this.importGraph = new Map();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logError(message) {
    console.error(`${colors.red}✖ ${message}${colors.reset}`);
  }

  logSuccess(message) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
  }

  logWarning(message) {
    console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
  }

  /**
   * Run TypeScript compiler in watch mode for real-time error checking
   */
  startTypeScriptWatch() {
    this.log('\n🔍 Starting TypeScript compiler in watch mode...', 'cyan');
    
    const tsc = spawn('npx', ['tsc', '--noEmit', '--watch', '--pretty'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';

    tsc.stdout.on('data', (data) => {
      output += data.toString();
      const lines = output.split('\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        
        // Parse TypeScript errors
        if (line.includes(': error TS')) {
          this.parseTypeScriptError(line);
        }
        
        // Check for successful compilation
        if (line.includes('Found 0 errors')) {
          this.errors.clear();
          this.logSuccess('TypeScript compilation successful!');
          this.showSummary();
        }
        
        // Check for errors summary
        if (line.includes('Found') && line.includes('error')) {
          const errorCount = line.match(/Found (\d+) error/)?.[1];
          if (errorCount && parseInt(errorCount) > 0) {
            this.logError(`Found ${errorCount} TypeScript error(s)`);
            this.showSummary();
          }
        }
      }
      
      output = lines[lines.length - 1];
    });

    tsc.stderr.on('data', (data) => {
      this.logError(data.toString());
    });

    return tsc;
  }

  /**
   * Parse TypeScript error messages
   */
  parseTypeScriptError(line) {
    const match = line.match(/(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/);
    if (match) {
      const [, file, line, column, code, message] = match;
      const key = `${file}:${line}:${column}`;
      
      this.errors.set(key, {
        file,
        line: parseInt(line),
        column: parseInt(column),
        code,
        message,
        type: 'typescript'
      });
    }
  }

  /**
   * Validate imports and check for missing dependencies
   */
  async validateImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:\*\s+as\s+\w+)|(?:\w+))\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Check lucide-react imports specifically
    const lucideImports = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g);
    if (lucideImports) {
      for (const importStatement of lucideImports) {
        const icons = importStatement.match(/\{([^}]+)\}/)?.[1]
          .split(',')
          .map(icon => icon.trim())
          .filter(Boolean) || [];
        
        // Check if these icons are actually used in the file
        for (const icon of icons) {
          const iconUsageRegex = new RegExp(`<${icon}[\\s/>]|icon:\\s*${icon}`, 'g');
          if (!iconUsageRegex.test(content)) {
            this.warnings.set(`${filePath}:unused:${icon}`, {
              file: filePath,
              message: `Imported icon '${icon}' from lucide-react is not used`,
              type: 'unused-import'
            });
          }
        }
      }
    }

    // Store import graph for dependency analysis
    this.importGraph.set(filePath, imports);

    return imports;
  }

  /**
   * Check for common Next.js 15 issues
   */
  checkNextJs15Issues(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Check for useSearchParams without Suspense
    if (content.includes('useSearchParams()') && !content.includes('<Suspense')) {
      issues.push({
        file: filePath,
        message: 'useSearchParams() must be wrapped in <Suspense> boundary in Next.js 15',
        type: 'nextjs15'
      });
    }

    // Check for incorrect toast imports
    if (content.includes('@/components/ui/use-toast')) {
      issues.push({
        file: filePath,
        message: 'Import useToast from @/hooks/use-toast, not @/components/ui/use-toast',
        type: 'import-path'
      });
    }

    // Check for missing 'use client' directive
    if ((content.includes('useState') || content.includes('useEffect')) && !content.includes("'use client'")) {
      issues.push({
        file: filePath,
        message: 'Component uses hooks but missing "use client" directive',
        type: 'missing-directive'
      });
    }

    return issues;
  }

  /**
   * Run a quick build test
   */
  async runBuildTest() {
    this.log('\n🏗️  Running quick build test...', 'blue');
    this.isBuilding = true;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      exec('npm run build', { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        this.isBuilding = false;
        this.lastBuildTime = duration;

        if (error) {
          this.logError(`Build failed in ${duration}s`);
          console.log(stderr);
          resolve(false);
        } else {
          this.logSuccess(`Build succeeded in ${duration}s`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Show summary of all errors and warnings
   */
  showSummary() {
    console.log('\n' + '='.repeat(80));
    
    if (this.errors.size === 0 && this.warnings.size === 0) {
      this.logSuccess('No errors or warnings found!');
      return;
    }

    if (this.errors.size > 0) {
      this.log(`\n❌ Errors (${this.errors.size}):`, 'red');
      for (const [key, error] of this.errors) {
        console.log(`  ${error.file}:${error.line}:${error.column}`);
        console.log(`    ${error.message}`);
        if (error.suggestion) {
          console.log(`    💡 ${error.suggestion}`);
        }
      }
    }

    if (this.warnings.size > 0) {
      this.log(`\n⚠️  Warnings (${this.warnings.size}):`, 'yellow');
      for (const [key, warning] of this.warnings) {
        console.log(`  ${warning.file}`);
        console.log(`    ${warning.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Watch for file changes
   */
  startFileWatcher() {
    const watcher = chokidar.watch(['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'], {
      ignored: [/node_modules/, /.next/],
      persistent: true,
      ignoreInitial: false
    });

    watcher.on('change', async (filePath) => {
      this.log(`\n📝 File changed: ${filePath}`, 'cyan');
      
      // Clear errors for this file
      for (const [key] of this.errors) {
        if (key.startsWith(filePath)) {
          this.errors.delete(key);
        }
      }
      
      // Clear warnings for this file
      for (const [key] of this.warnings) {
        if (key.startsWith(filePath)) {
          this.warnings.delete(key);
        }
      }

      // Validate imports
      await this.validateImports(filePath);

      // Check Next.js 15 issues
      const issues = this.checkNextJs15Issues(filePath);
      for (const issue of issues) {
        this.warnings.set(`${issue.file}:${issue.type}`, issue);
      }
    });

    return watcher;
  }

  /**
   * Interactive CLI commands
   */
  setupInteractiveCommands() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', async (key) => {
      // Ctrl+C to exit
      if (key === '\u0003') {
        process.exit();
      }

      switch(key) {
        case 'b':
          await this.runBuildTest();
          break;
        case 's':
          this.showSummary();
          break;
        case 'c':
          console.clear();
          this.log('Enhanced Build System - HERA', 'bright');
          this.showCommands();
          break;
        case 'h':
          this.showCommands();
          break;
      }
    });
  }

  showCommands() {
    console.log('\n📋 Available Commands:');
    console.log('  b - Run build test');
    console.log('  s - Show error/warning summary');
    console.log('  c - Clear console');
    console.log('  h - Show this help');
    console.log('  Ctrl+C - Exit\n');
  }

  /**
   * Main entry point
   */
  async start() {
    console.clear();
    this.log('🚀 HERA Enhanced Build System', 'bright');
    this.log('Real-time TypeScript checking and build validation\n', 'cyan');

    // Start TypeScript watch
    const tscProcess = this.startTypeScriptWatch();

    // Start file watcher
    const fileWatcher = this.startFileWatcher();

    // Setup interactive commands
    this.setupInteractiveCommands();
    this.showCommands();

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      tscProcess.kill();
      fileWatcher.close();
      process.exit();
    });
  }
}

// Run the enhanced build system
if (require.main === module) {
  const buildSystem = new EnhancedBuildSystem();
  buildSystem.start();
}

module.exports = EnhancedBuildSystem;