#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Icon replacements
const iconReplacements = {
  'Grid3X3': 'Grid3x3',
  'Edit2': 'Edit',
  'Edit ': 'Pencil ', // Replace Edit with space after to Pencil
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
  Object.entries(iconReplacements).forEach(([oldIcon, newIcon]) => {
    if (content.includes(oldIcon)) {
      const regex = new RegExp(`\\b${oldIcon}\\b`, 'g');
      content = content.replace(regex, newIcon);
      modified = true;
      console.log(`Fixed ${oldIcon} → ${newIcon} in ${file}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
  }
});

console.log(`\nFixed icon imports in ${fixedCount} files`);