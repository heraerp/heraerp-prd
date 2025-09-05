#!/usr/bin/env node

/**
 * Smart Code Validation Script
 * Scans codebase for smart codes and validates format
 */

const fs = require('fs');
const path = require('path');

const SMART_CODE_REGEX = /HERA\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.[vV]\d+/g;
const VALID_REGEX = /^HERA\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.v\d+$/;

let totalCodes = 0;
let invalidCodes = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(SMART_CODE_REGEX) || [];
  
  matches.forEach(code => {
    totalCodes++;
    
    if (!VALID_REGEX.test(code)) {
      // Check if it's the uppercase V issue
      if (code.match(/\.V\d+$/)) {
        invalidCodes.push({
          file: filePath,
          code: code,
          issue: 'Uppercase V in version (should be lowercase v)',
          line: getLineNumber(content, code)
        });
      } else {
        invalidCodes.push({
          file: filePath,
          code: code,
          issue: 'Invalid format',
          line: getLineNumber(content, code)
        });
      }
    }
  });
}

function getLineNumber(content, searchStr) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return 0;
}

function scanDirectory(dir, excludeDirs = ['node_modules', '.next', 'dist']) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file) && !file.startsWith('.')) {
        scanDirectory(filePath, excludeDirs);
      }
    } else if (file.match(/\.(js|ts|tsx|json|sql)$/)) {
      scanFile(filePath);
    }
  });
}

console.log('🔍 Scanning for Smart Codes...\n');

// Scan source directories
const dirsToScan = ['src', 'database', 'scripts', 'mcp-server'];
dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

console.log(`📊 Smart Code Validation Results:`);
console.log(`   Total codes found: ${totalCodes}`);
console.log(`   Valid codes: ${totalCodes - invalidCodes.length}`);
console.log(`   Invalid codes: ${invalidCodes.length}`);

if (invalidCodes.length > 0) {
  console.log('\n❌ Invalid Smart Codes Found:\n');
  
  invalidCodes.forEach(({ file, code, issue, line }) => {
    console.log(`   File: ${file}:${line}`);
    console.log(`   Code: ${code}`);
    console.log(`   Issue: ${issue}`);
    console.log(`   Fix: ${code.replace(/\.V(\d+)$/, '.v$1')}`);
    console.log('');
  });
  
  console.log('💡 To fix all uppercase V issues, run:');
  console.log('   find src -type f -name "*.ts" -exec sed -i "" "s/\\.V\\([0-9]\\+\\)$/.v\\1/g" {} +\n');
  
  process.exit(1);
} else {
  console.log('\n✅ All Smart Codes are valid!');
}