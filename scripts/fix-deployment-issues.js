#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🛠️  Fixing common deployment issues...\n');

let fixCount = 0;

// 1. Fix formatCurrency typo in document-viewer
const docViewerPath = path.join(__dirname, '..', 'src', 'app', 'finance', 'document-viewer', 'page.tsx');
if (fs.existsSync(docViewerPath)) {
  let content = fs.readFileSync(docViewerPath, 'utf8');
  if (content.includes('.formatDate(amount)')) {
    content = content.replace('.formatDate(amount)', '.format(amount)');
    fs.writeFileSync(docViewerPath, content);
    console.log('✓ Fixed formatCurrency typo in document-viewer');
    fixCount++;
  }
}

// 2. Force dynamic rendering on problematic pages
const problematicPages = [
  'src/app/restaurant/tables/page.tsx',
  'src/app/finance/document-viewer/page.tsx',
  'src/app/enterprise/whatsapp/page.tsx',
  'src/app/whatsapp-desktop/page.tsx',
  'src/app/readiness-dashboard/page.tsx'
];

problematicPages.forEach(pagePath => {
  const fullPath = path.join(__dirname, '..', pagePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if dynamic export already exists
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      // Add after 'use client'
      if (content.includes("'use client'")) {
        content = content.replace(
          "'use client'",
          `'use client'\n\n// Force dynamic rendering to avoid build issues\nexport const dynamic = 'force-dynamic'`
        );
      } else {
        // Add at the beginning
        content = `// Force dynamic rendering to avoid build issues\nexport const dynamic = 'force-dynamic'\n\n${content}`;
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`✓ Added dynamic rendering to ${path.basename(pagePath)}`);
      fixCount++;
    }
  }
});

// 3. Fix TypeScript errors in route handlers
const fixRouteHandlers = () => {
  // Fix finance documents route
  const financeDocRoute = path.join(__dirname, '..', 'src', 'app', 'api', 'v1', 'finance', 'documents', '[id]', 'route.ts');
  if (fs.existsSync(financeDocRoute)) {
    let content = fs.readFileSync(financeDocRoute, 'utf8');
    
    // Fix params type
    if (content.includes('{ params: { id: string } }')) {
      content = content.replace(
        /\{ params: \{ id: string \} \}/g,
        '{ params: Promise<{ id: string }> }'
      );
      
      // Update function to handle promise
      content = content.replace(
        /export async function GET\(request: NextRequest, \{ params \}\)/g,
        'export async function GET(request: NextRequest, { params: paramsPromise })'
      );
      
      // Add await for params
      if (!content.includes('const params = await paramsPromise')) {
        content = content.replace(
          /export async function GET\(request: NextRequest, \{ params: paramsPromise \}\) \{/g,
          'export async function GET(request: NextRequest, { params: paramsPromise }) {\n  const params = await paramsPromise;'
        );
      }
      
      fs.writeFileSync(financeDocRoute, content);
      console.log('✓ Fixed finance documents route handler');
      fixCount++;
    }
  }
  
  // Fix furniture documents route
  const furnitureDocRoute = path.join(__dirname, '..', 'src', 'app', 'api', 'v1', 'furniture', 'documents', '[id]', 'route.ts');
  if (fs.existsSync(furnitureDocRoute)) {
    let content = fs.readFileSync(furnitureDocRoute, 'utf8');
    
    // Fix params type
    if (content.includes('{ params: { id: string } }')) {
      content = content.replace(
        /\{ params: \{ id: string \} \}/g,
        '{ params: Promise<{ id: string }> }'
      );
      
      // Update function to handle promise
      content = content.replace(
        /export async function DELETE\(request: NextRequest, \{ params \}\)/g,
        'export async function DELETE(request: NextRequest, { params: paramsPromise })'
      );
      
      // Add await for params
      if (!content.includes('const params = await paramsPromise')) {
        content = content.replace(
          /export async function DELETE\(request: NextRequest, \{ params: paramsPromise \}\) \{/g,
          'export async function DELETE(request: NextRequest, { params: paramsPromise }) {\n  const params = await paramsPromise;'
        );
      }
      
      fs.writeFileSync(furnitureDocRoute, content);
      console.log('✓ Fixed furniture documents route handler');
      fixCount++;
    }
  }
};

fixRouteHandlers();

// 4. Clear Next.js cache
const nextCacheDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('🗑️  Clearing Next.js cache...');
  const rimraf = require('rimraf');
  try {
    rimraf.sync(nextCacheDir);
    console.log('✓ Next.js cache cleared');
  } catch (err) {
    console.log('⚠️  Could not clear Next.js cache:', err.message);
  }
}

console.log(`\n✅ Fixed ${fixCount} issues`);
console.log('\n📦 Now run: npm run build');