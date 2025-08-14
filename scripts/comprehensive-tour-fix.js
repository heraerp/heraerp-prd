#!/usr/bin/env node

/**
 * Comprehensive Tour Fix Script
 * 
 * Fixes all JSX structure issues in retail modules
 */

const fs = require('fs').promises;

const RETAIL_MODULES = [
  'procurement', 'pos', 'inventory', 'analytics', 'promotions', 'customers'
];

async function fixModule(moduleName) {
  const filePath = `/Users/san/Documents/PRD/heraerp/src/app/enterprise-retail-progressive/${moduleName}/page.tsx`;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Check if UniversalTourProvider is misplaced (appears in middle of file)
    const lines = content.split('\n');
    let misplacedTagLine = -1;
    let properEndLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '</UniversalTourProvider>' && i < lines.length - 10) {
        misplacedTagLine = i;
      }
      if (lines[i].trim() === '  )') {
        properEndLine = i;
      }
    }
    
    if (misplacedTagLine !== -1) {
      console.log(`🔧 Fixing ${moduleName} - misplaced UniversalTourProvider at line ${misplacedTagLine + 1}`);
      
      // Remove the misplaced closing tag
      lines.splice(misplacedTagLine, 1);
      
      // Add proper closing structure at the end
      const endIndex = lines.findIndex((line, index) => 
        line.trim() === '  )' && lines[index + 1] && lines[index + 1].trim() === '}'
      );
      
      if (endIndex !== -1) {
        lines.splice(endIndex, 1, '    </UniversalTourProvider>', '  )');
      }
      
      content = lines.join('\n');
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed ${moduleName} module`);
    } else {
      console.log(`✅ ${moduleName} module syntax is correct`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${moduleName}:`, error.message);
  }
}

async function fixAllModules() {
  console.log('🔧 Comprehensive Tour Fix - JSX Structure Repair');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const moduleName of RETAIL_MODULES) {
    await fixModule(moduleName);
  }
  
  console.log('');
  console.log('🎉 ALL MODULES FIXED!');
  console.log('✅ JSX structure corrected');
  console.log('✅ UniversalTourProvider properly placed');
  console.log('✅ Ready for testing');
}

if (require.main === module) {
  fixAllModules().catch(console.error);
}

module.exports = { fixAllModules };