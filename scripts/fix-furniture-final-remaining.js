#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/React files in furniture directories
const files = glob.sync('src/{components,app}/furniture/**/*.{ts,tsx}');

console.log(`Found ${files.length} furniture files to check...`);

let fixedCount = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;

    // Fix arrays that are all on one line
    content = content.replace(/const\s+(\w+)\s*=\s*\[\s*({[^}]+}[,\s]*)+\]/g, (match, varName, items) => {
      if (!match.includes('\n')) {
        modified = true;
        // Split the items
        const itemsArray = match.match(/{[^}]+}/g) || [];
        const formattedItems = itemsArray.map(item => `  ${item.trim()}`).join(',\n');
        return `const ${varName} = [\n${formattedItems}\n]`;
      }
      return match;
    });

    // Fix } from '@/components/ui/select' pattern
    content = content.replace(/}\s+from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
      modified = true;
      return `}\nfrom '${importPath}'`;
    });

    // Fix closing brace followed by const
    content = content.replace(/}\s+const\s+/g, (match) => {
      if (!match.includes('\n')) {
        modified = true;
        return '}\n\nconst ';
      }
      return match;
    });

    // Fix interface properties followed by const
    content = content.replace(/}\s*const\s+(\w+)\s*=\s*\[/g, (match, varName) => {
      modified = true;
      return `}\n\nconst ${varName} = [`;
    });

    // Fix arrays of objects that are compressed
    content = content.replace(/\[\s*({[^}]+},?\s*)+\]/g, (match) => {
      if (!match.includes('\n') && match.length > 80) {
        const objects = match.match(/{[^}]+}/g) || [];
        if (objects.length > 1) {
          modified = true;
          const formatted = objects.map(obj => `  ${obj.trim()}`).join(',\n');
          return `[\n${formatted}\n]`;
        }
      }
      return match;
    });

    // Save if modified
    if (modified && content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${file}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);