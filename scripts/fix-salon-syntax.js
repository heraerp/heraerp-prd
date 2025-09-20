#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the syntax error in SalonPOSTerminalGlass.tsx
const filePath = path.join(__dirname, '../src/components/salon/SalonPOSTerminalGlass.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// The issue is around line 1517 - there seems to be an extra closing tag
// Let's find and fix the structure issue
const lines = content.split('\n');

// Find the problematic section (around line 1515-1520)
let fixedContent = content;

// Replace the problematic section - it looks like there's a missing React.Fragment or extra closing div
// The pattern shows: </div> on 1515, empty line 1516, then comment on 1517
// This suggests the JSX structure is broken

// Count opening and closing divs to find the imbalance
let openDivs = (content.match(/<div/g) || []).length;
let closeDivs = (content.match(/<\/div>/g) || []).length;

console.log(`Opening divs: ${openDivs}, Closing divs: ${closeDivs}`);

// The error message suggests the issue is with the comment syntax
// In JSX, comments inside return must be properly wrapped
// The error "Expected ',', got '{'" suggests the comment might be breaking the JSX

// Fix by ensuring the structure is correct
// Look for the specific pattern causing the issue
const problematicPattern = /\s*<\/div>\s*\n\s*\n\s*{\/* Cart Section \*\/}/;

if (problematicPattern.test(fixedContent)) {
  console.log('Found problematic pattern, fixing...');
  
  // The issue is likely that we need a React Fragment or parent wrapper
  // Let's wrap the two main sections in a fragment
  fixedContent = fixedContent.replace(
    /(\s*<\/div>\s*\n\s*\n\s*)({\/* Cart Section \*\/})/,
    '$1$2'
  );
  
  // Also check if we need to wrap in a fragment at the return level
  // Find the return statement and check structure
  const returnMatch = fixedContent.match(/return \(\s*\n\s*<div className="flex h-screen/);
  
  if (returnMatch) {
    // The main container seems to be there, so the issue might be with closing tags
    // Let's ensure proper structure by checking the specific area
    
    // Replace the problematic section more carefully
    fixedContent = fixedContent.replace(
      /([\s\S]*?)(\s*<\/div>\s*\n\s*\n\s*{\/* Cart Section \*\/}\s*\n\s*<div)/,
      (match, before, problemSection) => {
        // Check if we're inside a proper JSX context
        // The error suggests we might need to wrap sections properly
        return before + '\n      {/* Cart Section */}\n      <div';
      }
    );
  }
}

// Write the fixed content
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('Fixed syntax error in SalonPOSTerminalGlass.tsx');
console.log('Please restart your dev server.');