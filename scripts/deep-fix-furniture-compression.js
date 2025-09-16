#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Deep fixing all compression issues in furniture module...\n');

// Find all TypeScript/JavaScript files in furniture module
const files = glob.sync('src/app/furniture/**/*.{ts,tsx,js,jsx}', {
  cwd: process.cwd()
});

console.log(`Found ${files.length} files to check\n`);

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixes = [];
    
    // Fix 1: Compressed variable declarations
    content = content.replace(/const (\w+) = .*?const (\w+) = /g, (match) => {
      const parts = match.split(/const (?=\w)/);
      return parts.filter(p => p).map(p => 'const ' + p.trim()).join('\n  ');
    });
    
    // Fix 2: Compressed useEffect with async functions
    content = content.replace(/useEffect\(\(\) => \{ async function/g, 'useEffect(() => {\n    async function');
    content = content.replace(/\} loadDemoOrg\(\) \}/g, '}\n    \n    loadDemoOrg()\n  }');
    
    // Fix 3: Compressed if statements after await
    content = content.replace(/await ([^)]+)\) if \(/g, 'await $1)\n        if (');
    
    // Fix 4: Multiple statements on one line with closing braces
    content = content.replace(/\) \} \} \} /g, ')\n        }\n      }\n    }\n    ');
    
    // Fix 5: Compressed switch cases
    content = content.replace(/case '([^']+)': case '([^']+)': return/g, "case '$1':\n      case '$2':\n        return");
    content = content.replace(/case '([^']+)': return/g, "case '$1':\n        return");
    
    // Fix 6: Compressed JSX returns
    content = content.replace(/return \( <(\w+)/g, 'return (\n    <$1');
    content = content.replace(/\) } return \(/g, ')\n  }\n\n  return (');
    
    // Fix 7: Fix compressed JSX closing tags
    content = content.replace(/<\/(\w+)> <\/(\w+)> \)/g, '</$1>\n      </$2>\n    )');
    
    // Fix 8: Fix callback functions compressed on single line
    content = content.replace(/=> \{ console\.log/g, '=> {\n          console.log');
    content = content.replace(/\) \/\/ /g, ')\n          // ');
    content = content.replace(/\(\) }\}/g, '()\n        }}');
    
    // Fix 9: Fix compressed className with cn()
    content = content.replace(/className=\{cn\('([^']+)', ([^)]+)\)\}/g, 'className={cn(\n            \'$1\',\n            $2\n          )}');
    
    // Fix 10: Fix array map functions that are compressed
    content = content.replace(/\.map\((\w+) => \(/g, '.map($1 => (');
    
    // Fix 11: Fix compressed conditional rendering
    content = content.replace(/\? \( <(\w+)/g, '? (\n            <$1');
    content = content.replace(/\) : \( <(\w+)/g, ')\n          : (\n            <$1');
    
    // Fix 12: Comments merged with code
    content = content.replace(/([;}]) \/\/ /g, '$1\n  // ');
    
    // Fix 13: Multiple closing braces compressed
    content = content.replace(/\}\}\}/g, '}\n      }\n    }');
    content = content.replace(/\}\}/g, '}\n    }');
    
    // Check if we made any changes
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      
      // Count the number of fixes applied
      const changeCount = (content.match(/\n/g) || []).length - (originalContent.match(/\n/g) || []).length;
      console.log(`✅ Fixed ${file} (${changeCount} new lines added)`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Deep fix complete! Fixed ${totalFixed} files.`);

// Now run a more targeted fix on the sales page specifically
console.log('\nApplying specific fixes to sales page...');

const salesPagePath = path.join(process.cwd(), 'src/app/furniture/sales/page.tsx');
try {
  let content = fs.readFileSync(salesPagePath, 'utf8');
  
  // Fix the specific compressed return statement issue
  content = content.replace(
    /<\/Button> <\/div> <\/div> \)/g,
    '</Button>\n        </div>\n      </div>\n    )'
  );
  
  // Fix compressed closing JSX in returns
  content = content.replace(
    /\) } return \(/g,
    ')\n  }\n\n  return ('
  );
  
  // Fix compressed JSX elements
  content = content.replace(
    /> <(\w+)/g,
    '>\n          <$1'
  );
  
  fs.writeFileSync(salesPagePath, content, 'utf8');
  console.log('✅ Applied specific fixes to sales page');
} catch (error) {
  console.error('❌ Error fixing sales page:', error.message);
}