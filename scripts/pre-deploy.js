#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Running pre-deployment checks...\n');

// 1. Run all build checks
console.log('1️⃣  Running build checks...');
try {
  execSync('node scripts/build-check.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build checks failed');
  process.exit(1);
}

// 2. Run actual build
console.log('\n2️⃣  Running production build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Production build failed');
  process.exit(1);
}

// 3. Check for common deployment issues
console.log('\n3️⃣  Checking for deployment issues...');

// Check for environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingEnvVars);
  console.log('These will need to be set in Railway');
}

console.log('\n✅ Pre-deployment checks passed!');
console.log('You can now safely deploy to Railway');