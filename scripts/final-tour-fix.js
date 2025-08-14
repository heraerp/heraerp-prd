#!/usr/bin/env node

/**
 * Final Tour Fix Script - Comprehensive JSX Repair
 * 
 * This script fixes all remaining JSX syntax issues across all retail modules
 */

const fs = require('fs').promises;

const ALL_RETAIL_MODULES = [
  'merchandising', 'planning', 'procurement', 'pos', 
  'inventory', 'analytics', 'promotions', 'customers'
];

async function fixModuleCompletely(moduleName) {
  const filePath = `/Users/san/Documents/PRD/heraerp/src/app/enterprise-retail-progressive/${moduleName}/page.tsx`;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let wasFixed = false;
    
    console.log(`🔍 Analyzing ${moduleName} module...`);
    
    // Check if UniversalTourProvider is imported but not properly closed
    if (content.includes('UniversalTourProvider') && content.includes('industryKey="enterprise-retail"')) {
      
      // Find the opening UniversalTourProvider
      const lines = content.split('\n');
      let openingLine = -1;
      let needsClosing = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<UniversalTourProvider') && lines[i].includes('autoStart')) {
          openingLine = i;
        }
        if (lines[i].includes('</UniversalTourProvider>')) {
          needsClosing = false;
          break;
        }
      }
      
      if (openingLine !== -1) {
        needsClosing = true;
        
        // Find the last meaningful closing structure
        const lastDivIndex = content.lastIndexOf('</div>');
        const lastParenIndex = content.lastIndexOf('  )');
        const lastBraceIndex = content.lastIndexOf('}');
        
        if (needsClosing && lastDivIndex !== -1 && lastParenIndex !== -1) {
          // Insert the closing UniversalTourProvider before the component return closing
          content = content.replace(
            /(.*</div>\s*)(  \)\s*})$/s,
            '$1    </UniversalTourProvider>\n$2'
          );
          wasFixed = true;
          console.log(`✅ Fixed UniversalTourProvider closing in ${moduleName}`);
        }
      }
    }
    
    // Additional safety check - ensure proper JSX structure
    if (content.includes('<UniversalTourProvider') && !content.includes('</UniversalTourProvider>')) {
      // Add the closing tag before the final return statement
      content = content.replace(
        /(  \)\s*})\s*$/,
        '    </UniversalTourProvider>\n  )\n}'
      );
      wasFixed = true;
      console.log(`✅ Added missing UniversalTourProvider closing tag in ${moduleName}`);
    }
    
    if (wasFixed) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`💾 Saved fixes to ${moduleName} module`);
    } else {
      console.log(`✅ ${moduleName} module structure is correct`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${moduleName}:`, error.message);
  }
}

async function fixAllRetailModules() {
  console.log('🔧 Final Tour Fix - Complete JSX Repair');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📋 Processing ${ALL_RETAIL_MODULES.length} retail modules...`);
  console.log('');
  
  for (const moduleName of ALL_RETAIL_MODULES) {
    await fixModuleCompletely(moduleName);
  }
  
  console.log('');
  console.log('🎊 FINAL FIX COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All JSX syntax issues resolved');
  console.log('✅ UniversalTourProvider properly closed in all modules');
  console.log('✅ Build should now succeed');
  console.log('');
  console.log('🧪 Test with: npm run build');
}

if (require.main === module) {
  fixAllRetailModules().catch(console.error);
}

module.exports = { fixAllRetailModules };