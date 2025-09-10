#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Runs critical checks before allowing deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛡️  Running pre-deployment validation...\n');

let hasErrors = false;

// 1. Check for TypeScript errors
console.log('1. Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed\n');
} catch (error) {
  console.error('❌ TypeScript errors found. Fix these before deploying.\n');
  hasErrors = true;
}

// 2. Check for critical imports
console.log('2. Checking for problematic imports...');
const problematicPatterns = [
  { pattern: /from\s+['"]@\/lib\/auth\/universal-api-auth['"]/, name: 'non-existent auth module' },
  { pattern: /UniversalApiClient/, name: 'UniversalApiClient (should be universalApi)' },
  { pattern: /Edit2|Grid3X3/, name: 'incorrect Lucide icon names' },
  { pattern: /parent_entity_id|child_entity_id/, name: 'wrong column names' },
  { pattern: /transaction_number/, name: 'transaction_number (should be transaction_code)' }
];

function checkFilesForPatterns(dir) {
  const files = fs.readdirSync(dir);
  let foundIssues = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      foundIssues = foundIssues.concat(checkFilesForPatterns(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      problematicPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(content)) {
          foundIssues.push(`${filePath}: ${name}`);
        }
      });
    }
  });
  
  return foundIssues;
}

const srcPath = path.join(process.cwd(), 'src');
if (fs.existsSync(srcPath)) {
  const issues = checkFilesForPatterns(srcPath);
  if (issues.length > 0) {
    console.error('❌ Found problematic patterns:');
    issues.forEach(issue => console.error(`   - ${issue}`));
    hasErrors = true;
  } else {
    console.log('✅ No problematic imports found\n');
  }
}

// 3. Check for ESLint errors
console.log('3. Running ESLint...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ ESLint check passed\n');
} catch (error) {
  console.error('❌ ESLint errors found. Fix these before deploying.\n');
  hasErrors = true;
}

// 4. Test build
console.log('4. Testing production build...');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key'
    }
  });
  console.log('✅ Build succeeded\n');
} catch (error) {
  console.error('❌ Build failed. Cannot deploy with build errors.\n');
  hasErrors = true;
}

// 5. Verify build artifacts
console.log('5. Verifying build artifacts...');
try {
  execSync('node scripts/verify-next-build.js', { stdio: 'inherit' });
  console.log('✅ Build artifacts verified\n');
} catch (error) {
  console.error('❌ Build artifacts missing or invalid.\n');
  hasErrors = true;
}

// Final result
if (hasErrors) {
  console.error('\n❌ Pre-deployment validation FAILED');
  console.error('Fix all issues above before deploying to production.\n');
  process.exit(1);
} else {
  console.log('\n✅ Pre-deployment validation PASSED');
  console.log('Safe to deploy!\n');
  process.exit(0);
}