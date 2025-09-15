#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Fix lines starting with export const/export default that also have imports or other statements
      if (line.startsWith('export const') || line.startsWith('export default')) {
        const afterExport = line.substring(line.indexOf('export'));
        
        // Check if there's an import statement before export
        if (line.includes('import') && line.indexOf('import') < line.indexOf('export')) {
          const importPart = line.substring(0, line.indexOf('export')).trim();
          const exportPart = line.substring(line.indexOf('export')).trim();
          newLines.push(importPart);
          newLines.push('');
          newLines.push(exportPart);
          modified = true;
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }
    
    if (modified) {
      content = newLines.join('\n');
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
  console.log('🔧 Fixing Export Syntax Issues in Furniture Module\n');
  
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
  console.log(`✨ Fixed export syntax issues in ${totalFixed} files!`);
}

main().catch(console.error);