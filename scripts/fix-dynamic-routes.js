#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Next.js 15 dynamic route params...');

// Find all route files with dynamic segments
const routeFiles = glob.sync('src/app/**/\\[*\\]/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/.next/**']
});

let fixedCount = 0;

routeFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix route handlers
  content = content.replace(
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*request:\s*NextRequest,?\s*{\s*params\s*}\s*:\s*{\s*params:\s*{[^}]+}\s*}\s*\)/g,
    (match, method) => {
      const paramsMatch = match.match(/params:\s*({[^}]+})/);
      if (paramsMatch) {
        modified = true;
        return `export async function ${method}(
  request: NextRequest,
  { params }: { params: Promise<${paramsMatch[1]}> }
)`;
      }
      return match;
    }
  );

  // Fix inside function to await params
  if (modified) {
    // Add await for params
    content = content.replace(
      /(export\s+async\s+function\s+(?:GET|POST|PUT|DELETE|PATCH)[^{]+{)/g,
      (match) => {
        return match + '\n  const resolvedParams = await params;';
      }
    );

    // Replace params usage with resolvedParams
    content = content.replace(/params\./g, 'resolvedParams.');
  }

  // Fix page components
  content = content.replace(
    /export\s+default\s+(?:async\s+)?function\s+\w+\s*\(\s*{\s*params\s*}\s*:\s*{\s*params:\s*{[^}]+}\s*}\s*\)/g,
    (match) => {
      const paramsMatch = match.match(/params:\s*({[^}]+})/);
      if (paramsMatch) {
        modified = true;
        const isAsync = match.includes('async');
        const funcMatch = match.match(/function\s+(\w+)/);
        const funcName = funcMatch ? funcMatch[1] : 'Page';
        return `export default ${isAsync ? 'async ' : ''}function ${funcName}({
  params
}: {
  params: Promise<${paramsMatch[1]}>
})`;
      }
      return match;
    }
  );

  // For page components, add await at the beginning
  if (content.includes('params: Promise<') && content.includes('export default')) {
    content = content.replace(
      /(export\s+default\s+(?:async\s+)?function[^{]+{\s*)/g,
      (match) => {
        if (!content.includes('const resolvedParams = await params')) {
          return match + '\n  const resolvedParams = await params;\n';
        }
        return match;
      }
    );

    // Replace params usage with resolvedParams in page components
    content = content.replace(/params\./g, 'resolvedParams.');
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files with Next.js 15 dynamic route param changes`);