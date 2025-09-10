#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/TSX files
const files = glob.sync('src/**/*.{ts,tsx}', { cwd: path.join(__dirname, '..') });

console.log(`Found ${files.length} TypeScript files to check`);

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix UniversalApiClient to universalApi
  if (content.includes('UniversalApiClient')) {
    // Replace UniversalApiClient with universalApi
    content = content.replace(/UniversalApiClient/g, 'universalApi');
    modified = true;
    console.log(`Fixed UniversalApiClient → universalApi in ${file}`);
  }
  
  // Fix the import as well
  if (content.includes("from '@/lib/universal-api'") && content.includes('UniversalApiClient')) {
    content = content.replace(
      /import\s*{\s*UniversalApiClient\s*}\s*from\s*['"]@\/lib\/universal-api['"]/g,
      "import { universalApi } from '@/lib/universal-api'"
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
  }
});

console.log(`\nFixed UniversalApiClient references in ${fixedCount} files`);