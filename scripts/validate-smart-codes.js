#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Smart code pattern
const SMART_CODE_PATTERN = /HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[Vv][0-9]+/g;
const VALID_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$/;

// Files to check
const FILE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
];

// Directories to ignore
const IGNORE_DIRS = ['node_modules', '.next', 'dist', 'build'];

let hasErrors = false;

function validateSmartCode(code, file, line) {
  if (!VALID_PATTERN.test(code)) {
    // Check if it's lowercase v
    if (code.match(/\.v\d+$/)) {
      console.error(`❌ Smart code has lowercase 'v' in ${file}:${line}`);
      console.error(`   Found: ${code}`);
      console.error(`   Fix:   ${code.replace(/\.v(\d+)$/, '.V$1')}`);
    } else {
      console.error(`❌ Invalid smart code in ${file}:${line}`);
      console.error(`   Found: ${code}`);
      console.error(`   See: /docs/playbooks/_shared/SMART_CODE_GUIDE.md`);
    }
    hasErrors = true;
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const matches = line.match(SMART_CODE_PATTERN);
    if (matches) {
      matches.forEach(match => {
        validateSmartCode(match, filePath, index + 1);
      });
    }
  });
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file) && !file.startsWith('.')) {
        walkDir(filePath);
      }
    } else if (stat.isFile()) {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        checkFile(filePath);
      }
    }
  });
}

console.log('🔍 Validating smart codes...\n');

// Start from src directory
if (fs.existsSync('src')) {
  walkDir('src');
}

if (hasErrors) {
  console.error('\n❌ Smart code validation failed!');
  console.error('📖 See /docs/playbooks/_shared/SMART_CODE_GUIDE.md for rules');
  process.exit(1);
} else {
  console.log('✅ All smart codes are valid!');
}