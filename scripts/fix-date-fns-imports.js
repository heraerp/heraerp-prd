#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map date-fns functions to our safe versions
const functionMap = {
  'format': 'formatDate',
  'addMinutes': 'addMinutesSafe',
  'parse': 'parseDateSafe',
  'isToday': 'isTodaySafe',
  'isYesterday': 'isYesterdaySafe',
  'differenceInHours': 'differenceInHoursSafe',
  'differenceInMinutes': 'differenceInMinutesSafe'
};

let filesUpdated = 0;
let totalErrors = 0;

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

function processFile(filePath) {
  // Skip our own date-utils file
  if (filePath.endsWith('date-utils.ts')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file imports from date-fns
    if (content.includes("from 'date-fns'")) {
      console.log(`\nProcessing: ${filePath}`);
      
      // Extract the import statement
      const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*'date-fns'/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(s => s.trim());
        const safeFunctions = [];
        const remainingFunctions = [];
        
        // Separate functions we have safe versions for
        imports.forEach(func => {
          if (functionMap[func]) {
            safeFunctions.push(func);
          } else {
            remainingFunctions.push(func);
          }
        });
        
        if (safeFunctions.length > 0) {
          // Build the new import statements
          let newImports = '';
          
          // Import our safe functions
          const safeImports = safeFunctions.map(func => functionMap[func]).join(', ');
          newImports += `import { ${safeImports} } from '@/lib/date-utils'\n`;
          
          // Keep remaining date-fns imports if any
          if (remainingFunctions.length > 0) {
            newImports += `import { ${remainingFunctions.join(', ')} } from 'date-fns'\n`;
          }
          
          // Replace the original import
          content = content.replace(
            /import\s*{[^}]+}\s*from\s*'date-fns'\n?/,
            newImports
          );
          
          // Replace function calls
          safeFunctions.forEach(func => {
            const safeFunc = functionMap[func];
            // Use word boundaries to avoid partial matches
            const regex = new RegExp(`\\b${func}\\(`, 'g');
            content = content.replace(regex, `${safeFunc}(`);
          });
          
          modified = true;
        }
      }
      
      // Handle dynamic imports
      const dynamicImportMatch = content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*require\('date-fns'\)/g);
      if (dynamicImportMatch) {
        console.log('  Found dynamic import - adding safe import');
        
        // Add safe import at the top of the file
        const importStatement = `import { formatDate, addMinutesSafe, parseDateSafe, isTodaySafe, isYesterdaySafe, differenceInHoursSafe, differenceInMinutesSafe } from '@/lib/date-utils'\n`;
        
        // Add after 'use client' if present
        if (content.startsWith("'use client'")) {
          content = content.replace("'use client'\n", `'use client'\n\n${importStatement}`);
        } else {
          content = importStatement + content;
        }
        
        // Remove the dynamic require
        content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*require\('date-fns'\)/g, '');
        
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        filesUpdated++;
        console.log(`  ✓ Updated with safe date functions`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    totalErrors++;
  }
}

// Process src directory
console.log('Fixing date-fns imports to use safe wrappers...\n');
processDirectory(path.join(__dirname, '..', 'src'));

console.log('\n=== Summary ===');
console.log(`Files updated: ${filesUpdated}`);
console.log(`Errors: ${totalErrors}`);

if (filesUpdated > 0) {
  console.log('\n✓ Date-fns imports have been updated to use safe wrappers');
  console.log('  These wrappers handle both server-side and client-side rendering');
}