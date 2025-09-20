#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Smart code pattern with lowercase v
const LOWERCASE_V_PATTERN = /HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+/g;

// Files to check
const FILE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
];

// Directories to ignore
const IGNORE_DIRS = ['node_modules', '.next', 'dist', 'build'];

let fixedCount = 0;

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(LOWERCASE_V_PATTERN, (match) => {
    const fixed = match.replace(/\.v(\d+)$/, '.V$1');
    console.log(`  Fixed: ${match} → ${fixed}`);
    fixedCount++;
    return fixed;
  });
  
  if (content !== newContent) {
    console.log(`📝 Fixing ${filePath}`);
    fs.writeFileSync(filePath, newContent);
  }
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
        fixFile(filePath);
      }
    }
  });
}

console.log('🔧 Fixing smart codes with lowercase v...\n');

// Start from src directory
if (fs.existsSync('src')) {
  walkDir('src');
}

// Also fix hera directory YAML files
if (fs.existsSync('hera')) {
  const walkYamlDir = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkYamlDir(filePath);
      } else if (stat.isFile() && (file.endsWith('.yml') || file.endsWith('.yaml'))) {
        fixFile(filePath);
      }
    });
  };
  
  walkYamlDir('hera');
}

console.log(`\n✅ Fixed ${fixedCount} smart codes!`);