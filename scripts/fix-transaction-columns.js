#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Column replacements
const columnReplacements = {
  'transaction_number': 'transaction_code',
  'parent_entity_id': 'from_entity_id',
  'child_entity_id': 'to_entity_id'
};

// Find all TypeScript/TSX files
const files = glob.sync('src/**/*.{ts,tsx}', { cwd: path.join(__dirname, '..') });

console.log(`Found ${files.length} TypeScript files to check`);

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check each replacement
  Object.entries(columnReplacements).forEach(([oldColumn, newColumn]) => {
    if (content.includes(oldColumn)) {
      // Replace in various contexts
      const patterns = [
        new RegExp(`\\.${oldColumn}\\b`, 'g'),  // .transaction_number
        new RegExp(`\\['${oldColumn}'\\]`, 'g'),  // ['transaction_number']
        new RegExp(`"${oldColumn}"`, 'g'),  // "transaction_number"
        new RegExp(`'${oldColumn}'`, 'g'),  // 'transaction_number'
        new RegExp(`\\b${oldColumn}:`, 'g'),  // transaction_number:
      ];
      
      patterns.forEach(pattern => {
        const newContent = content.replace(pattern, (match) => {
          return match.replace(oldColumn, newColumn);
        });
        
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      });
      
      if (modified) {
        console.log(`Fixed ${oldColumn} → ${newColumn} in ${file}`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
  }
});

console.log(`\nFixed column names in ${fixedCount} files`);