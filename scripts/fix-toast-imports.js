#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .tsx files
const srcDir = path.join(__dirname, '..', 'src');

function fixToastImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file imports toast incorrectly
  if (content.includes("import { toast } from '@/components/ui/use-toast'")) {
    console.log(`🔧 Fixing toast import in: ${filePath}`);
    
    // Replace the import
    content = content.replace(
      "import { toast } from '@/components/ui/use-toast'",
      "import { useToast } from '@/components/ui/use-toast'"
    );

    // Find the component/function where toast is used
    // This is a simple approach - look for function declarations
    const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|\w+\s*=>))\s*{/g);
    
    if (functionMatches) {
      // Add useToast hook after other hooks
      const hookPattern = /const\s+(?:{[^}]+}|\w+)\s*=\s*use\w+\([^)]*\)/g;
      let lastHookMatch = null;
      let match;
      
      while ((match = hookPattern.exec(content)) !== null) {
        lastHookMatch = match;
      }
      
      if (lastHookMatch && !content.includes('const { toast } = useToast()')) {
        const insertPosition = lastHookMatch.index + lastHookMatch[0].length;
        content = content.slice(0, insertPosition) + '\n  const { toast } = useToast()' + content.slice(insertPosition);
      }
    }

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Find all TypeScript files
const files = glob.sync(path.join(srcDir, '**/*.tsx'));

console.log(`Found ${files.length} files to check...`);

let fixedCount = 0;
files.forEach(file => {
  if (fixToastImports(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);