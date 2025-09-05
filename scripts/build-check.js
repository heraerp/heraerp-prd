#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Running build checks...\n');

// Check for common Next.js 15 issues
console.log('1️⃣  Checking for useSearchParams without Suspense...');
try {
  execSync('node scripts/fix-use-search-params.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ useSearchParams check failed');
  process.exit(1);
}

// Check for toast import issues
console.log('\n2️⃣  Checking for incorrect toast imports...');
try {
  execSync('node scripts/fix-toast-imports.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Toast import check failed');
  process.exit(1);
}

// Check for missing dependencies
console.log('\n3️⃣  Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const requiredDeps = [
  '@opentelemetry/api',
  '@opentelemetry/sdk-node',
  '@opentelemetry/auto-instrumentations-node'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]);
if (missingDeps.length > 0) {
  console.error('❌ Missing required dependencies:', missingDeps);
  console.log('Run: npm install', missingDeps.join(' '));
  process.exit(1);
}

// Run type checking
console.log('\n4️⃣  Running TypeScript check...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ TypeScript check failed');
  process.exit(1);
}

console.log('\n✅ All checks passed!');