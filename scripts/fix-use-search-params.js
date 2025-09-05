#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .tsx files in the app directory
const appDir = path.join(__dirname, '..', 'src', 'app');

// Function to check if a file uses useSearchParams without proper Suspense
function checkAndFixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file uses useSearchParams
  if (!content.includes('useSearchParams')) {
    return false;
  }

  // Check if it's already wrapped in Suspense properly
  if (content.includes('function') && content.includes('Content') && content.includes('<Suspense')) {
    console.log(`✓ Already fixed: ${filePath}`);
    return false;
  }

  // Skip if it's not a page file
  if (!filePath.endsWith('/page.tsx')) {
    return false;
  }

  console.log(`🔧 Fixing: ${filePath}`);

  // Extract the default export function name
  const defaultExportMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (!defaultExportMatch) {
    console.log(`⚠️  No default export found in ${filePath}`);
    return false;
  }

  const componentName = defaultExportMatch[1];
  const contentComponentName = componentName.replace('Page', 'Content');

  // Check if Suspense is imported
  let newContent = content;
  if (!content.includes('Suspense')) {
    // Add Suspense to imports
    if (content.includes("from 'react'")) {
      newContent = newContent.replace(
        /import\s+React(?:,\s*{([^}]*)})?\s+from\s+'react'/,
        (match, imports) => {
          if (imports) {
            return `import React, { ${imports}, Suspense } from 'react'`;
          } else {
            return `import React, { Suspense } from 'react'`;
          }
        }
      );
    } else if (content.match(/import\s*{([^}]*)}.*from\s*['"]react['"]/)) {
      newContent = newContent.replace(
        /import\s*{([^}]*)}.*from\s*['"]react['"]/,
        (match, imports) => {
          return `import { ${imports}, Suspense } from 'react'`;
        }
      );
    }
  }

  // Check if Loader2 is imported for the loading state
  const hasLoader = content.includes('Loader2');

  // Replace the export default function
  const functionBodyMatch = content.match(new RegExp(`export\\s+default\\s+function\\s+${componentName}\\s*\\([^)]*\\)\\s*{([\\s\\S]*)}`));
  if (!functionBodyMatch) {
    console.log(`⚠️  Could not parse function body for ${filePath}`);
    return false;
  }

  // Extract the function body
  let functionBody = functionBodyMatch[1];
  
  // Find the last return statement position
  let returnIndex = functionBody.lastIndexOf('return');
  if (returnIndex === -1) {
    console.log(`⚠️  No return statement found in ${filePath}`);
    return false;
  }

  // Extract everything before the return
  const beforeReturn = functionBody.substring(0, returnIndex);
  
  // Extract the return statement and JSX
  const returnPart = functionBody.substring(returnIndex);

  // Create the new component structure
  const newComponent = `function ${contentComponentName}() {
${beforeReturn}
${returnPart}
}

export default function ${componentName}() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            ${hasLoader ? '<Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />' : '<div className="w-8 h-8 mx-auto">Loading...</div>'}
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <${contentComponentName} />
    </Suspense>
  )
}`;

  // Replace the old export with the new structure
  newContent = newContent.replace(
    new RegExp(`export\\s+default\\s+function\\s+${componentName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*}`),
    newComponent
  );

  // Write the fixed content back
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Fixed: ${filePath}`);
  return true;
}

// Find all page.tsx files
const files = glob.sync(path.join(appDir, '**/page.tsx'));

console.log(`Found ${files.length} page files to check...`);

let fixedCount = 0;
files.forEach(file => {
  if (checkAndFixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);