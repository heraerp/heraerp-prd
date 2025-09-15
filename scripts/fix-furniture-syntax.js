#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Fix 'use client' on same line as import
    if (content.includes("'use client' import")) {
      content = content.replace(/^'use client'\s*import/gm, "'use client'\n\nimport");
      modified = true;
    }
    
    // Fix export const on same line as import
    content = content.replace(/import\s+(.+?)\s+export\s+const/g, "import $1\n\nexport const");
    if (content.includes('import') && content.includes('export const') && content.match(/import.*export const/)) {
      modified = true;
    }
    
    // Fix } interface pattern
    content = content.replace(/\}\s*interface\s+(\w+)\s*\{/g, "}\n\ninterface $1 {");
    if (content.includes('} interface')) {
      modified = true;
    }
    
    // Fix ] export pattern
    content = content.replace(/\]\s*export\s+(default|const|function)/g, "]\n\nexport $1");
    if (content.includes('] export')) {
      modified = true;
    }
    
    // Save if modified
    if (modified) {
      await fs.writeFile(filePath, content);
      return { success: true, path: filePath };
    }
    
    return { success: false, path: filePath };
  } catch (error) {
    return { success: false, path: filePath, error: error.message };
  }
}

async function processDirectory(dir) {
  const results = [];
  
  try {
    const files = await fs.readdir(dir, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
        const result = await fixFile(filePath);
        if (result.success) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return results;
}

async function main() {
  console.log('🔧 Fixing Syntax Issues in Furniture Module\n');
  
  const directories = [
    path.join(process.cwd(), 'src/app/furniture'),
    path.join(process.cwd(), 'src/components/furniture')
  ];
  
  let totalFixed = 0;
  
  for (const dir of directories) {
    console.log(`Processing ${path.relative(process.cwd(), dir)}...`);
    const results = await processDirectory(dir);
    
    if (results.length > 0) {
      console.log(`✅ Fixed ${results.length} files:`);
      results.forEach(result => {
        console.log(`   - ${path.relative(process.cwd(), result.path)}`);
      });
      totalFixed += results.length;
    } else {
      console.log('   No fixes needed');
    }
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log(`✨ Fixed syntax issues in ${totalFixed} files!`);
}

main().catch(console.error);