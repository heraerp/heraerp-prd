#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that still have the compressed pattern
const filesToFix = [
  'src/app/furniture/products/[id]/page.tsx',
  'src/app/furniture/products/page.tsx',
  'src/app/furniture/sales/page-old.tsx',
  'src/app/furniture/settings/ucr/page.tsx'
];

console.log('Fixing remaining furniture files with compressed export/import...\n');

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix the specific pattern
    content = content.replace(
      /export const dynamic = 'force-dynamic' import/g,
      "export const dynamic = 'force-dynamic'\n\nimport"
    );
    
    // Also fix any other compressed patterns
    content = content.replace(
      /from 'react'\nimport/g,
      "from 'react'\nimport"
    );
    
    // Fix imports that might be on wrong lines
    content = content.replace(
      /\} from 'react'(?!\n)/g,
      "} from 'react'\n"
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`ℹ️  No changes needed for: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n✨ Final furniture syntax fixes complete!');