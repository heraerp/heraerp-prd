#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Fix all the syntax issues more comprehensively
    
    // 1. Fix 'use client' on same line as anything else
    content = content.replace(/^'use client'\s*(.+)$/gm, "'use client'\n\n$1");
    
    // 2. Fix import followed immediately by interface, export, or const
    content = content.replace(/\)\s*interface\s+/g, ")\n\ninterface ");
    content = content.replace(/\)\s*export\s+/g, ")\n\nexport ");
    content = content.replace(/\)\s*const\s+/g, ")\n\nconst ");
    content = content.replace(/'\s*interface\s+/g, "'\n\ninterface ");
    content = content.replace(/'\s*export\s+/g, "'\n\nexport ");
    
    // 3. Fix } followed by export or interface
    content = content.replace(/\}\s*export\s+/g, "}\n\nexport ");
    content = content.replace(/\}\s*interface\s+/g, "}\n\ninterface ");
    
    // 4. Fix ] followed by export
    content = content.replace(/\]\s*export\s+/g, "]\n\nexport ");
    
    // 5. Fix import ending without newline before other statements
    content = content.replace(/from\s+['"][^'"]+['"]\s*interface/g, (match) => {
      const parts = match.split('interface');
      return parts[0] + '\n\ninterface';
    });
    
    content = content.replace(/from\s+['"][^'"]+['"]\s*export/g, (match) => {
      const parts = match.split('export');
      return parts[0] + '\n\nexport';
    });
    
    // 6. Fix multiple interfaces on same line
    content = content.replace(/\}\s*interface/g, "}\n\ninterface");
    
    // 7. Clean up any excessive newlines (more than 3)
    content = content.replace(/\n{4,}/g, '\n\n\n');
    
    if (content !== originalContent) {
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
  console.log('🔧 Comprehensive Fix for Furniture Module Syntax Issues\n');
  
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
  
  // Run check again to verify
  console.log('\n🔍 Verifying fixes...\n');
  const { exec } = require('child_process');
  exec('node scripts/check-furniture-syntax.js', (error, stdout, stderr) => {
    if (stdout.includes('All furniture files have proper syntax!')) {
      console.log('✅ All syntax issues have been resolved!');
    } else {
      console.log('⚠️  Some issues may remain. Please check the output above.');
    }
  });
}

main().catch(console.error);