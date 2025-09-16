#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Final cleanup for all furniture module files...\n');

const filesToFix = [
  'src/app/furniture/products/catalog/page.tsx',
  'src/app/furniture/sales/orders/page.tsx',
  'src/app/furniture/tender/bids/page.tsx',
  'src/app/furniture/tender/[code]/bid/new/page.tsx',
  'src/app/furniture/tender/documents/page.tsx',
  'src/app/furniture/tender/watchlist/page.tsx',
  'src/app/furniture/production/tracking/page.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix compressed return statements
    content = content.replace(/\} return \(/g, '}\n\n  return (');
    
    // Fix className attributes that span multiple properties
    content = content.replace(/className="([^"]+)"\s+disabled/g, 'className="$1"\n          disabled');
    content = content.replace(/className="([^"]+)"\s+onClick/g, 'className="$1"\n          onClick');
    content = content.replace(/className="([^"]+)"\s+variant/g, 'className="$1"\n          variant');
    
    // Fix JSX elements
    content = content.replace(/<\/div>\s*<div/g, '</div>\n        <div');
    content = content.replace(/<\/Card>\s*<Card/g, '</Card>\n        <Card');
    content = content.replace(/<\/Button>\s*<Button/g, '</Button>\n        <Button');
    
    // Fix comments that are compressed
    content = content.replace(/\{\/\*\s*([^*]+)\s*\*\/\}\s*</g, '\n        {/* $1 */}\n        <');
    
    // Fix callback functions
    content = content.replace(/onClick=\{([^}]+)\}\s*>/g, 'onClick={$1}\n        >');
    content = content.replace(/onSubmit=\{([^}]+)\}\s*>/g, 'onSubmit={$1}\n        >');
    
    // Fix closing tags
    content = content.replace(/<\/div>\s*\)\s*}/g, '</div>\n      )\n    }');
    content = content.replace(/<\/Card>\s*\)\s*}/g, '</Card>\n      )\n    }');
    
    // Fix badge and status components
    content = content.replace(/<Badge\s+([^>]+)>\s*([^<]+)\s*<\/Badge>/g, '<Badge $1>\n          $2\n        </Badge>');
    
    // Fix the final return closing
    content = content.replace(/\)\s*\}\s*$/g, ')\n}');
    
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

console.log('\n✨ Final furniture module cleanup complete!');