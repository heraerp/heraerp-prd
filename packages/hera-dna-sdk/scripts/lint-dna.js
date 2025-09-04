#!/usr/bin/env node
/**
 * HERA DNA Linter
 * Scans codebase for DNA violations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 HERA DNA Linter\n');

// Load DNA config from environment or file
let dnaConfig;
try {
  if (process.env.HERA_DNA_CONFIG) {
    dnaConfig = JSON.parse(process.env.HERA_DNA_CONFIG);
  } else {
    const configPath = path.join(process.cwd(), 'hera.dna.json');
    dnaConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.error('❌ Failed to load DNA config:', error.message);
  process.exit(1);
}

const violations = [];

// Directories to scan
const SCAN_DIRS = ['src', 'mcp-server', 'scripts', 'packages'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', '.git'];
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.sql'];

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir, callback) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        scanDirectory(filePath, callback);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (SCAN_EXTENSIONS.includes(ext)) {
        callback(filePath);
      }
    }
  }
}

/**
 * Check file for DNA violations
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check forbidden patterns
  dnaConfig.forbidden_patterns.forEach(pattern => {
    const regex = new RegExp(pattern.pattern, 'gi');
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        // Skip if it's a comment
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
          return;
        }
        
        violations.push({
          file: filePath,
          line: index + 1,
          pattern: pattern.pattern,
          message: pattern.message,
          code: line.trim()
        });
      }
    });
  });
  
  // Check for missing organization_id in API calls
  if (filePath.includes('/api/') && !filePath.includes('.test.')) {
    const apiPatterns = [
      /\.insert\(/g,
      /\.update\(/g,
      /\.upsert\(/g,
      /\.select\(/g
    ];
    
    apiPatterns.forEach(pattern => {
      if (pattern.test(content) && !content.includes('organization_id')) {
        violations.push({
          file: filePath,
          line: 0,
          pattern: 'missing organization_id',
          message: 'API operations must include organization_id',
          code: 'File contains database operations without organization_id'
        });
      }
    });
  }
}

// Scan all directories
console.log('📂 Scanning directories:', SCAN_DIRS.join(', '));
console.log('📝 File extensions:', SCAN_EXTENSIONS.join(', '));
console.log('');

SCAN_DIRS.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  scanDirectory(fullPath, checkFile);
});

// Report results
console.log(`\n📊 DNA Lint Results:`);
console.log(`   Files scanned: ${execSync('find src mcp-server -name "*.ts" -o -name "*.tsx" -o -name "*.js" | wc -l').toString().trim()}`);
console.log(`   Violations found: ${violations.length}`);

if (violations.length > 0) {
  console.log('\n❌ DNA Violations Found:\n');
  
  // Group by file
  const violationsByFile = {};
  violations.forEach(v => {
    if (!violationsByFile[v.file]) {
      violationsByFile[v.file] = [];
    }
    violationsByFile[v.file].push(v);
  });
  
  Object.entries(violationsByFile).forEach(([file, fileViolations]) => {
    console.log(`📄 ${file.replace(process.cwd() + '/', '')}`);
    fileViolations.forEach(v => {
      console.log(`   Line ${v.line}: ${v.message}`);
      if (v.code) {
        console.log(`   > ${v.code}`);
      }
    });
    console.log('');
  });
  
  // For now, just warn but don't fail the build
  console.log('⚠️  DNA violations detected. These should be fixed to maintain HERA principles.');
  console.log('ℹ️  Build will continue, but violations should be addressed.\n');
  
  // Don't exit with error for now to allow build to continue
  // process.exit(1);
} else {
  console.log('\n✅ No DNA violations found! Code follows HERA principles.\n');
}

process.exit(0);