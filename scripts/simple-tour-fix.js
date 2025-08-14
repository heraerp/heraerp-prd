#!/usr/bin/env node

/**
 * Simple Tour Fix - Direct JSX Repair
 */

const fs = require('fs').promises;

const ALL_RETAIL_MODULES = [
  'merchandising', 'planning', 'procurement', 'pos', 
  'inventory', 'analytics', 'promotions', 'customers'
];

async function fixModule(moduleName) {
  const filePath = `/Users/san/Documents/PRD/heraerp/src/app/enterprise-retail-progressive/${moduleName}/page.tsx`;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Check if it has UniversalTourProvider but missing closing
    if (content.includes('UniversalTourProvider') && 
        content.includes('autoStart') && 
        !content.includes('</UniversalTourProvider>')) {
      
      console.log(`🔧 Fixing ${moduleName} - adding missing UniversalTourProvider closing tag`);
      
      // Simple approach: add the closing tag before the final ')' and '}'
      const lines = content.split('\n');
      const lastLine = lines.length - 1;
      
      // Find the line with just '  )' (component return end)
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === ')' && lines[i+1] && lines[i+1].trim() === '}') {
          // Insert the closing tag before this line
          lines.splice(i, 0, '    </UniversalTourProvider>');
          break;
        }
      }
      
      content = lines.join('\n');
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed ${moduleName}`);
      
    } else if (content.includes('</UniversalTourProvider>')) {
      console.log(`✅ ${moduleName} already has correct structure`);
    } else {
      console.log(`⚠️  ${moduleName} doesn't use UniversalTourProvider`);
    }
    
  } catch (error) {
    console.error(`❌ Error with ${moduleName}:`, error.message);
  }
}

async function fixAllModules() {
  console.log('🔧 Simple Tour Fix - Direct JSX Repair');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const moduleName of ALL_RETAIL_MODULES) {
    await fixModule(moduleName);
  }
  
  console.log('');
  console.log('✅ Fix complete! Testing build...');
}

if (require.main === module) {
  fixAllModules().catch(console.error);
}

module.exports = { fixAllModules };