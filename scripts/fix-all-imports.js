#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing all @/lib and @/components imports in src directory...\n');

// Find all TypeScript/TSX files in src, excluding node_modules and old directories
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/*_old/**', '**/dist/**']
});

let fixedCount = 0;
let totalFiles = files.length;

files.forEach((file, index) => {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;
    
    // Fix imports from '@/lib' to '@/src/lib'
    content = content.replace(/from ['"]@\/lib/g, "from '@/src/lib");
    
    // Fix imports from '@/components' to '@/src/components'
    content = content.replace(/from ['"]@\/components/g, "from '@/src/components");
    
    // Fix imports from '@/app' to '@/src/app'
    content = content.replace(/from ['"]@\/app/g, "from '@/src/app");
    
    // Fix imports from '@/types' to '@/src/types'
    content = content.replace(/from ['"]@\/types/g, "from '@/src/types");
    
    // Fix imports from '@/hooks' to '@/src/hooks'
    content = content.replace(/from ['"]@\/hooks/g, "from '@/src/hooks");
    
    // Fix imports from '@/utils' to '@/src/utils'
    content = content.replace(/from ['"]@\/utils/g, "from '@/src/utils");
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✓ Fixed imports in ${file}`);
      fixedCount++;
    }
    
    // Show progress
    if ((index + 1) % 100 === 0) {
      console.log(`Progress: ${index + 1}/${totalFiles} files processed...`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files out of ${totalFiles} total files`);