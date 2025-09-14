const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Next.js 15 API changes...');

// Fix patterns
const fixes = [
  // Fix cookies import
  {
    pattern: /import\s*{\s*cookies\s*}\s*from\s*['"]next\/headers['"]/g,
    replacement: "import { cookies } from 'next/headers'"
  },
  // Fix headers import
  {
    pattern: /import\s*{\s*headers\s*}\s*from\s*['"]next\/headers['"]/g,
    replacement: "import { headers } from 'next/headers'"
  },
  // Fix cookies() call
  {
    pattern: /cookies\(\)\.get/g,
    replacement: "(await cookies()).get"
  },
  {
    pattern: /cookies\(\)\.set/g,
    replacement: "(await cookies()).set"
  },
  // Fix headers() call
  {
    pattern: /headers\(\)\.get/g,
    replacement: "(await headers()).get"
  },
  // Fix async function declarations for route handlers
  {
    pattern: /export\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g,
    replacement: "export async function $1("
  }
];

// Find all TypeScript files in API routes
const apiFiles = glob.sync('src/app/api/**/*.ts', {
  ignore: ['**/node_modules/**']
});

let fixedCount = 0;

apiFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  fixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content);
    fixedCount++;
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files with Next.js 15 API changes`);