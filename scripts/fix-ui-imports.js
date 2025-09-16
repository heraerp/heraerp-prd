#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing UI component imports...\n');

// Find all TypeScript/TSX files in src/components/ui
const files = glob.sync('src/components/ui/**/*.{ts,tsx}');

let fixedCount = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;
    
    // Fix imports from '@/lib' to '@/src/lib'
    content = content.replace(/from ['"]@\/lib/g, "from '@/src/lib");
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✓ Fixed imports in ${file}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);