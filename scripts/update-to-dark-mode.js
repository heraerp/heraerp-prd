#!/usr/bin/env node

/**
 * Script to update all pages to use dark mode consistently
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color replacements for dark mode
const replacements = [
  // Background colors
  { from: /bg-white(?!\/)/g, to: 'bg-gray-900' },
  { from: /bg-gray-50(?!\/)/g, to: 'bg-gray-900' },
  { from: /bg-gray-100(?!\/)/g, to: 'bg-gray-800' },
  { from: /bg-gray-200(?!\/)/g, to: 'bg-gray-700' },
  
  // Gradient colors
  { from: /from-white(?!\/)/g, to: 'from-gray-900' },
  { from: /to-white(?!\/)/g, to: 'to-gray-900' },
  { from: /from-gray-50(?!\/)/g, to: 'from-gray-900' },
  { from: /to-gray-50(?!\/)/g, to: 'to-gray-900' },
  
  // Text colors for dark backgrounds
  { from: /text-gray-900(?!\/)/g, to: 'text-gray-100' },
  { from: /text-gray-800(?!\/)/g, to: 'text-gray-200' },
  { from: /text-black(?!\/)/g, to: 'text-white' },
  
  // Border colors
  { from: /border-gray-200(?!\/)/g, to: 'border-gray-700' },
  { from: /border-gray-300(?!\/)/g, to: 'border-gray-600' },
  
  // Remove explicit dark: variants (since we're always dark)
  { from: /dark:bg-gray-900/g, to: 'bg-gray-900' },
  { from: /dark:bg-gray-800/g, to: 'bg-gray-800' },
  { from: /dark:text-white/g, to: 'text-white' },
  { from: /dark:text-gray-100/g, to: 'text-gray-100' },
];

// Files to update
const patterns = [
  'src/app/**/page.tsx',
  'src/app/**/layout.tsx',
  'src/components/**/*.tsx',
];

let totalFiles = 0;
let updatedFiles = 0;

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changesMade = false;

    // Apply replacements
    replacements.forEach(({ from, to }) => {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        changesMade = true;
        content = newContent;
      }
    });

    // Special case: ensure min-h-screen has dark background
    if (content.includes('min-h-screen') && !content.includes('min-h-screen bg-')) {
      content = content.replace(/min-h-screen/g, 'min-h-screen bg-gray-900');
      changesMade = true;
    }

    if (changesMade) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
      updatedFiles++;
    }
    
    totalFiles++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🌙 Converting to Dark Mode...\n');

// Process each pattern
patterns.forEach(pattern => {
  const files = glob.sync(pattern);
  files.forEach(updateFile);
});

console.log(`\n📊 Summary:`);
console.log(`   Total files processed: ${totalFiles}`);
console.log(`   Files updated: ${updatedFiles}`);
console.log('\n✅ Dark mode conversion complete!');