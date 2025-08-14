#!/usr/bin/env node

/**
 * Update Tour Imports Script
 * Updates all retail modules to use SimpleTourProvider for immediate compatibility
 */

const fs = require('fs').promises;

const ALL_RETAIL_MODULES = [
  'merchandising', 'planning', 'procurement', 'pos', 
  'inventory', 'analytics', 'promotions', 'customers'
];

async function updateModuleImports(moduleName) {
  const filePath = `/Users/san/Documents/PRD/heraerp/src/app/enterprise-retail-progressive/${moduleName}/page.tsx`;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Update the import statement
    const oldImport = "import { UniversalTourProvider, TourElement } from '@/components/tours/UniversalTourProvider'";
    const newImport = "import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'";
    
    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated ${moduleName} import to SimpleTourProvider`);
    } else {
      console.log(`⚠️  ${moduleName} doesn't have the expected import pattern`);
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${moduleName}:`, error.message);
  }
}

async function updateAllImports() {
  console.log('🔄 Updating Tour Imports to SimpleTourProvider');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const moduleName of ALL_RETAIL_MODULES) {
    await updateModuleImports(moduleName);
  }
  
  console.log('');
  console.log('✅ All imports updated!');
  console.log('🚀 Ready for build testing');
}

if (require.main === module) {
  updateAllImports().catch(console.error);
}

module.exports = { updateAllImports };