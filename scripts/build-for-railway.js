#!/usr/bin/env node

/**
 * Build script for Railway deployment that skips TypeScript checks
 */

const { execSync } = require('child_process');

console.log('🚀 Building for Railway deployment...');

// Set temporary build-time environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key';

// Disable TypeScript checks for deployment
process.env.SKIP_TYPE_CHECK = 'true';

try {
  // Clear cache
  console.log('🧹 Clearing cache...');
  execSync('node scripts/clear-browser-cache.js', { stdio: 'inherit' });
  
  // Inject version
  console.log('📝 Injecting build version...');
  execSync('node scripts/inject-build-version.js', { stdio: 'inherit' });
  
  // Run Next.js build with TypeScript checks disabled
  console.log('🏗️ Building Next.js app (TypeScript checks disabled)...');
  execSync('next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      TSC_COMPILE_ON_ERROR: 'true'
    }
  });
  
  console.log('✅ Railway build completed successfully');
} catch (error) {
  console.error('❌ Railway build failed:', error.message);
  process.exit(1);
}