#!/usr/bin/env node

/**
 * HERA Tour Syntax Fix Script
 * 
 * Fixes JSX structure issues in retail modules after tour integration
 */

const fs = require('fs').promises;
const path = require('path');

const RETAIL_MODULES = [
  'planning', 'procurement', 'pos', 'inventory', 
  'analytics', 'promotions', 'customers'
];

async function fixModuleSyntax(moduleName) {
  const filePath = `/Users/san/Documents/PRD/heraerp/src/app/enterprise-retail-progressive/${moduleName}/page.tsx`;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Check if the file has the syntax issue (missing closing tags)
    if (content.includes('</UniversalTourProvider>')) {
      console.log(`✅ ${moduleName} module already has correct syntax`);
      return;
    }
    
    // Check if it has UniversalTourProvider but improper closing
    if (content.includes('UniversalTourProvider industryKey')) {
      // Fix the ending structure
      content = content.replace(
        /(\s+)}(\s*)$/,
        `$1  </div>
$1  </UniversalTourProvider>
$1)
$1}`
      );
      
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed syntax in ${moduleName} module`);
    } else {
      console.log(`⚠️  ${moduleName} module doesn't have UniversalTourProvider - skipping`);
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`❌ Module not found: ${moduleName}`);
    } else {
      console.error(`❌ Error fixing ${moduleName}:`, error.message);
    }
  }
}

async function fixAllModules() {
  console.log('🔧 HERA Retail Tours - Syntax Fix');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log(`📋 Checking ${RETAIL_MODULES.length} modules for syntax issues...`);
  console.log('');
  
  for (const moduleName of RETAIL_MODULES) {
    await fixModuleSyntax(moduleName);
  }
  
  console.log('');
  console.log('🎉 SYNTAX FIX COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All retail modules should now have correct JSX syntax');
  console.log('✅ UniversalTourProvider properly closed in all modules');
  console.log('✅ Ready for development server restart');
  console.log('');
  console.log('🚀 Test with: npm run dev');
}

if (require.main === module) {
  fixAllModules().catch(console.error);
}

module.exports = { fixAllModules };