#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Lighter blue shade for sidebar (lighter than #050a30)
const SIDEBAR_COLOR = '#0a1a4a'; // Lighter shade than #050a30

async function updateSidebarColor(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Replace the deep blue #050a30 with lighter shade in sidebar files
    if (content.includes('bg-[#050a30]')) {
      content = content.replace(/bg-\[#050a30\]/g, `bg-[${SIDEBAR_COLOR}]`);
      updated = true;
    }
    
    if (updated) {
      await fs.writeFile(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Updating sidebar to lighter blue shade...');
  console.log(`Old color: #050a30 (Deep Blue)`);
  console.log(`New color: ${SIDEBAR_COLOR} (Lighter Blue)`);
  console.log('');
  
  // Target sidebar and layout files
  const sidebarFiles = [
    './src/components/furniture/FurnitureDarkSidebar.tsx',
    './src/components/furniture/FurnitureDarkLayout.tsx',
    './src/app/furniture/layout.tsx'
  ];
  
  let updatedCount = 0;
  
  for (const file of sidebarFiles) {
    try {
      const updated = await updateSidebarColor(file);
      if (updated) {
        updatedCount++;
        console.log(`✓ Updated: ${file}`);
      } else {
        console.log(`⚪ No changes needed: ${file}`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\nCompleted! Updated ${updatedCount} files.`);
}

main().catch(console.error);