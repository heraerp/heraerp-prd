#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the remaining furniture production files with syntax errors
const filesToFix = [
  'src/app/furniture/production/orders/page.tsx',
  'src/app/furniture/production/page.tsx', 
  'src/app/furniture/production/planning/page.tsx'
];

function fixOrdersPage(content) {
  // Fix the compressed getCustomerName function
  content = content.replace(
    /const getCustomerName = \(customerId: string\) => \{ const customer = entities\?\.\find\(e => e\.id === customerId && e\.entity_type === 'customer'\) return customer\?\.\entity_name \|\| 'Unknown Customer' \}/g,
    `const getCustomerName = (customerId: string) => {
    const customer = entities?.find(e => e.id === customerId && e.entity_type === 'customer')
    return customer?.entity_name || 'Unknown Customer'
  }`
  );

  // Fix compressed useState and variable declarations
  content = content.replace(
    /const \[searchTerm, setSearchTerm\] = useState\(''\) \/\/ Load production orders from universal_transactions const/g,
    `const [searchTerm, setSearchTerm] = useState('')
  
  // Load production orders from universal_transactions
  const`
  );

  return content;
}

function fixProductionPage(content) {
  // Fix the missing newline after export declaration
  content = content.replace(
    /export const dynamic = 'force-dynamic' import React, \{ useState, useEffect \}/g,
    `export const dynamic = 'force-dynamic'

import React, { useState, useEffect }`
  );

  // Fix compressed imports
  content = content.replace(
    /from 'react'\nimport \{ Card \}\nfrom '@\/components\/ui\/card'/g,
    `from 'react'
import { Card } from '@/components/ui/card'`
  );

  return content;
}

function fixPlanningPage(content) {
  // Same fix as production page
  content = content.replace(
    /export const dynamic = 'force-dynamic' import React, \{ useState, useEffect \}/g,
    `export const dynamic = 'force-dynamic'

import React, { useState, useEffect }`
  );

  return content;
}

// Process each file
filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  if (file.includes('orders/page.tsx')) {
    content = fixOrdersPage(content);
  } else if (file.includes('production/page.tsx')) {
    content = fixProductionPage(content);
  } else if (file.includes('planning/page.tsx')) {
    content = fixPlanningPage(content);
  }
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed syntax errors in ${file}`);
  } else {
    console.log(`ℹ️  No changes needed for ${file}`);
  }
});

console.log('\n✨ Remaining furniture production syntax fixes complete!');