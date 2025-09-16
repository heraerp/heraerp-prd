#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/TSX files in the furniture directory
const furnitureFiles = glob.sync('src/app/furniture/**/*.{ts,tsx}', {
  cwd: process.cwd()
});

console.log(`Found ${furnitureFiles.length} furniture files to check...`);

let fixedCount = 0;

// Common pattern: export const dynamic = 'force-dynamic' import
const exportImportPattern = /export const dynamic = 'force-dynamic' import/g;

furnitureFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix the common pattern of export and import on same line
    if (exportImportPattern.test(content)) {
      content = content.replace(
        /export const dynamic = 'force-dynamic' import/g,
        "export const dynamic = 'force-dynamic'\n\nimport"
      );
    }
    
    // Fix compressed import statements
    content = content.replace(
      /from 'react'\nimport \{/g,
      "from 'react'\nimport {"
    );
    
    // Fix other common compression patterns
    content = content.replace(
      /\}\nfrom/g,
      "} from"
    );
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${fixedCount} files with syntax issues!`);

// Now specifically fix the sales page if it has more issues
const salesPagePath = path.join(process.cwd(), 'src/app/furniture/sales/page.tsx');
if (fs.existsSync(salesPagePath)) {
  console.log('\nChecking sales page for additional issues...');
  
  let content = fs.readFileSync(salesPagePath, 'utf8');
  
  // Check if it still has syntax issues by looking for common patterns
  if (content.includes("'use client'") && !content.includes("'use client'\n\n")) {
    // Ensure proper spacing after 'use client'
    content = content.replace(/^'use client'\n(?!\n)/, "'use client'\n\n");
    fs.writeFileSync(salesPagePath, content, 'utf8');
    console.log('✅ Fixed sales page formatting');
  }
}