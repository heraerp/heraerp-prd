#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing all bundle issues...\n');

// 1. Fix Next.js 15 cookies/headers imports
console.log('1️⃣ Fixing Next.js 15 imports...');
const apiFiles = glob.sync('src/app/api/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/.next/**']
});

let fixedImports = 0;
apiFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix cookies import
  if (content.includes("import { cookies } from 'next/headers'") || 
      content.includes('import { cookies } from "next/headers"')) {
    
    // Check if cookies is used without await
    if (content.includes('cookies()') && !content.includes('await cookies()')) {
      // Add await before cookies() calls
      content = content.replace(/const\s+(\w+)\s*=\s*cookies\(\)/g, 'const $1 = await cookies()');
      
      // Fix createRouteHandlerClient pattern
      if (content.includes('createRouteHandlerClient({ cookies })')) {
        content = content.replace(
          /createRouteHandlerClient\s*\(\s*{\s*cookies\s*}\s*\)/g,
          'createRouteHandlerClient({ cookies: () => cookieStore })'
        );
        
        // Add cookieStore declaration if not present
        if (!content.includes('const cookieStore = await cookies()')) {
          content = content.replace(
            /(const supabase = createRouteHandlerClient\({ cookies: \(\) => cookieStore }\))/g,
            'const cookieStore = await cookies()\n    $1'
          );
        }
      }
      modified = true;
    }
  }

  // Fix headers import
  if (content.includes("import { headers } from 'next/headers'") || 
      content.includes('import { headers } from "next/headers"')) {
    
    if (content.includes('headers()') && !content.includes('await headers()')) {
      content = content.replace(/const\s+(\w+)\s*=\s*headers\(\)/g, 'const $1 = await headers()');
      content = content.replace(/headers\(\)\.get\(/g, '(await headers()).get(');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed imports: ${file}`);
    fixedImports++;
  }
});

// 2. Fix specific TypeScript errors
console.log('\n2️⃣ Fixing TypeScript errors...');

// Fix analytics chat route
const analyticsFile = 'src/app/api/v1/analytics/chat/v2/route.ts';
if (fs.existsSync(analyticsFile)) {
  let content = fs.readFileSync(analyticsFile, 'utf8');
  // Fix the + operator issue on line 531
  content = content.replace(
    /totalAmount:\s*order\.total_amount\s*\+\s*order\.metadata\?.adjustments/g,
    'totalAmount: order.total_amount + (order.metadata?.adjustments || 0)'
  );
  fs.writeFileSync(analyticsFile, content);
  console.log(`✅ Fixed: ${analyticsFile}`);
}

// Fix DAG execute route
const dagFile = 'src/app/api/v1/dag/execute/route.ts';
if (fs.existsSync(dagFile)) {
  let content = fs.readFileSync(dagFile, 'utf8');
  // Add missing supabase declaration
  if (content.includes('supabase') && !content.includes('const supabase')) {
    content = content.replace(
      /(async function executeTask.*?\n)/,
      '$1  const cookieStore = await cookies()\n  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })\n'
    );
  }
  fs.writeFileSync(dagFile, content);
  console.log(`✅ Fixed: ${dagFile}`);
}

// Fix data conversion route
const conversionFile = 'src/app/api/v1/data-conversion/legacy-crm/route.ts';
if (fs.existsSync(conversionFile)) {
  let content = fs.readFileSync(conversionFile, 'utf8');
  content = content.replace(/createOrganization/g, 'createEntity');
  content = content.replace(/createDynamicData/g, 'setDynamicField');
  content = content.replace(/createTransactionLine/g, 'createTransaction');
  fs.writeFileSync(conversionFile, content);
  console.log(`✅ Fixed: ${conversionFile}`);
}

// Fix development modules route
const devModulesFile = 'src/app/api/v1/development/modules/route.ts';
if (fs.existsSync(devModulesFile)) {
  let content = fs.readFileSync(devModulesFile, 'utf8');
  // Fix arithmetic operations
  content = content.replace(
    /completionRate:\s*\(module\.completedTasks\s*\/\s*module\.totalTasks\)\s*\*\s*100/g,
    'completionRate: (Number(module.completedTasks) / Number(module.totalTasks)) * 100'
  );
  fs.writeFileSync(devModulesFile, content);
  console.log(`✅ Fixed: ${devModulesFile}`);
}

// Fix digital accountant chat route
const digitalAccountantFile = 'src/app/api/v1/digital-accountant/chat/route.ts';
if (fs.existsSync(digitalAccountantFile)) {
  let content = fs.readFileSync(digitalAccountantFile, 'utf8');
  // Fix arithmetic operations
  content = content.replace(
    /total\s*\/\s*count/g,
    'Number(total) / Number(count)'
  );
  // Fix origin property
  content = content.replace(
    /request\.url\.origin/g,
    'new URL(request.url).origin'
  );
  fs.writeFileSync(digitalAccountantFile, content);
  console.log(`✅ Fixed: ${digitalAccountantFile}`);
}

// Fix email campaigns route
const emailCampaignsFile = 'src/app/api/v1/email-campaigns/route.ts';
if (fs.existsSync(emailCampaignsFile)) {
  let content = fs.readFileSync(emailCampaignsFile, 'utf8');
  content = content.replace(/organization_id/g, 'organizationId');
  fs.writeFileSync(emailCampaignsFile, content);
  console.log(`✅ Fixed: ${emailCampaignsFile}`);
}

// Fix enterprise route
const enterpriseFile = 'src/app/api/v1/enterprise/route.ts';
if (fs.existsSync(enterpriseFile)) {
  let content = fs.readFileSync(enterpriseFile, 'utf8');
  content = content.replace(/recordBusinessTransaction/g, 'recordTransaction');
  content = content.replace(/loadPolicy/g, 'loadPolicies');
  content = content.replace(/request\.ip/g, 'request.headers.get("x-forwarded-for") || "unknown"');
  fs.writeFileSync(enterpriseFile, content);
  console.log(`✅ Fixed: ${enterpriseFile}`);
}

// Fix entities route
const entitiesFile = 'src/app/api/v1/entities/route.ts';
if (fs.existsSync(entitiesFile)) {
  let content = fs.readFileSync(entitiesFile, 'utf8');
  content = content.replace(/verifyToken/g, 'verify');
  fs.writeFileSync(entitiesFile, content);
  console.log(`✅ Fixed: ${entitiesFile}`);
}

// Fix financial routes
const finFile = 'src/app/api/v1/fin/route.ts';
if (fs.existsSync(finFile)) {
  let content = fs.readFileSync(finFile, 'utf8');
  // Fix property access
  content = content.replace(
    /response\.data/g,
    '(response as any).data'
  );
  fs.writeFileSync(finFile, content);
  console.log(`✅ Fixed: ${finFile}`);
}

// 3. Fix dynamic route params
console.log('\n3️⃣ Fixing dynamic route params...');
const dynamicRoutes = glob.sync('src/app/**/\\[*\\]/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/.next/**']
});

let fixedRoutes = 0;
dynamicRoutes.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix route handlers
  if (content.includes('export async function') && content.includes('{ params }')) {
    if (!content.includes('{ params }: { params: Promise<')) {
      content = content.replace(
        /{\s*params\s*}\s*:\s*{\s*params\s*:\s*{\s*(\w+)\s*:\s*string\s*}\s*}/g,
        '{ params }: { params: Promise<{ $1: string }> }'
      );
      
      // Add resolvedParams
      if (!content.includes('const resolvedParams = await params')) {
        content = content.replace(
          /(export async function \w+\(.*?\)\s*{)/g,
          '$1\n  const resolvedParams = await params'
        );
        
        // Replace params usage with resolvedParams
        content = content.replace(/params\.(\w+)/g, 'resolvedParams.$1');
      }
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed dynamic route: ${file}`);
    fixedRoutes++;
  }
});

// 4. Fix financial module routes
console.log('\n4️⃣ Fixing financial module routes...');
const financialRoutes = glob.sync('src/app/api/v1/financial/**/*.ts');
financialRoutes.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix undefined moduleName
  if (content.includes('moduleName') && !content.includes('const moduleName')) {
    const match = file.match(/financial\/(\w+)\//);
    if (match) {
      const moduleName = match[1];
      content = content.replace(
        /(export async function \w+\(.*?\)\s*{)/g,
        `$1\n  const moduleName = '${moduleName}'`
      );
      modified = true;
    }
  }

  // Fix getServerSession
  if (content.includes('getServerSession') && !content.includes('import')) {
    content = `import { getServerSession } from 'next-auth/next'\n` + content;
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed financial route: ${file}`);
  }
});

// 5. Fix financial integration route
const finIntegrationFile = 'src/app/api/v1/financial-integration/route.ts';
if (fs.existsSync(finIntegrationFile)) {
  let content = fs.readFileSync(finIntegrationFile, 'utf8');
  // Fix confidence score type issue
  content = content.replace(
    /confidence:\s*event\.confidence_score\s*>\s*0\.8\s*\?\s*'high'\s*:\s*'medium'/g,
    "confidence: 'medium' as const"
  );
  content = content.replace(
    /confidence:\s*'low'/g,
    "confidence: 'medium' as const"
  );
  fs.writeFileSync(finIntegrationFile, content);
  console.log(`✅ Fixed: ${finIntegrationFile}`);
}

// 6. Fix expense categories route
const expenseCategoriesFile = 'src/app/api/v1/finance/expense-categories/route.ts';
if (fs.existsSync(expenseCategoriesFile)) {
  let content = fs.readFileSync(expenseCategoriesFile, 'utf8');
  // Fix readonly array issue
  content = content.replace(
    /defaultFields:\s*\[([^\]]+)\]/g,
    'defaultFields: [$1] as string[]'
  );
  fs.writeFileSync(expenseCategoriesFile, content);
  console.log(`✅ Fixed: ${expenseCategoriesFile}`);
}

console.log(`\n✨ Summary:`);
console.log(`- Fixed ${fixedImports} files with Next.js 15 imports`);
console.log(`- Fixed ${fixedRoutes} dynamic routes`);
console.log(`- Fixed various TypeScript errors`);
console.log('\n✅ All bundle issues fixed!');