#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const oldImports = [
  "import { useAuth } from '@/contexts/auth-context'",
  'import { useAuth } from "@/contexts/auth-context"'
];
const newImport = "import { useAuth } from '@/components/auth/DualAuthProvider'";

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    for (const oldImport of oldImports) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        updated = true;
      }
    }
    
    if (updated) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

async function findAndUpdateFiles(dir) {
  let updatedCount = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && 
        !entry.name.startsWith('.') && 
        entry.name !== 'node_modules' &&
        entry.name !== '.next') {
      updatedCount += await findAndUpdateFiles(fullPath);
    } else if (entry.isFile() && 
               (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (await updateFile(fullPath)) {
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

async function main() {
  console.log('🔍 Searching for files with old auth import...');
  const srcPath = path.join(process.cwd(), 'src');
  const count = await findAndUpdateFiles(srcPath);
  console.log(`\n✨ Updated ${count} files!`);
}

main().catch(console.error);