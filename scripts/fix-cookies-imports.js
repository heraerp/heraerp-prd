#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Next.js 15 cookies imports...');

// Find all TypeScript files in src/app/api
const files = glob.sync('src/app/api/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/.next/**']
});

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Check if file imports cookies from next/headers
  if (content.includes("import { cookies } from 'next/headers'") || 
      content.includes('import { cookies, headers } from "next/headers"') ||
      content.includes("import { headers, cookies } from 'next/headers'")) {
    
    // Check if cookieStore is already defined
    if (!content.includes('const cookieStore = await cookies()')) {
      // Find where cookies is used in createRouteHandlerClient
      const regex = /createRouteHandlerClient\s*\(\s*{\s*cookies:\s*\(\)\s*=>\s*cookieStore\s*}\s*\)/g;
      const regex2 = /createRouteHandlerClient\s*\(\s*{\s*cookies\s*}\s*\)/g;
      
      if (regex.test(content)) {
        // Add await cookies() before usage
        content = content.replace(
          /(const supabase = createRouteHandlerClient\s*\(\s*{\s*cookies:\s*\(\)\s*=>\s*cookieStore\s*}\s*\))/g,
          'const cookieStore = await cookies()\n    $1'
        );
        modified = true;
      } else if (regex2.test(content)) {
        // Replace { cookies } with the proper pattern
        content = content.replace(
          /createRouteHandlerClient\s*\(\s*{\s*cookies\s*}\s*\)/g,
          'createRouteHandlerClient({ cookies: () => cookieStore })'
        );
        // Add await cookies() before usage
        content = content.replace(
          /(const supabase = createRouteHandlerClient\s*\(\s*{\s*cookies:\s*\(\)\s*=>\s*cookieStore\s*}\s*\))/g,
          'const cookieStore = await cookies()\n    $1'
        );
        modified = true;
      }
      
      // Also handle cases where cookies() is called directly
      if (content.includes('cookies()') && !content.includes('await cookies()')) {
        // Replace cookies() with await cookies() where it's not already awaited
        content = content.replace(/(?<!await\s+)cookies\(\)/g, 'await cookies()');
        modified = true;
      }
    }
  }

  // Fix headers import too
  if (content.includes("import { headers } from 'next/headers'")) {
    // Find direct headers() calls
    if (content.includes('headers()') && !content.includes('await headers()')) {
      content = content.replace(/(?<!await\s+)headers\(\)/g, 'await headers()');
      modified = true;
    }
    
    // Find headers().get pattern and fix it
    const headerGetRegex = /const\s+(\w+)\s*=\s*headers\(\)\.get\(/g;
    if (headerGetRegex.test(content)) {
      content = content.replace(
        /const\s+(\w+)\s*=\s*headers\(\)\.get\(/g,
        'const headerStore = await headers()\n    const $1 = headerStore.get('
      );
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files with Next.js 15 cookies/headers imports`);