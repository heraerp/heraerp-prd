#!/usr/bin/env node

/**
 * Railway Build Script
 * Temporarily moves problematic packages during build to avoid Deno detection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Railway-specific build...');

try {
  // Temporarily rename packages directory to avoid Deno detection
  const packagesDir = path.join(__dirname, '..', 'packages');
  const packagesBackup = path.join(__dirname, '..', 'packages_backup');
  
  if (fs.existsSync(packagesDir)) {
    console.log('📦 Temporarily moving packages directory...');
    fs.renameSync(packagesDir, packagesBackup);
  }
  
  // Run the normal build process
  console.log('🔨 Running build process...');
  execSync('npm run quality:pre-build && node scripts/clear-browser-cache.js && node scripts/inject-build-version.js && npx next build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  // Restore packages directory
  if (fs.existsSync(packagesBackup)) {
    console.log('📦 Restoring packages directory...');
    fs.renameSync(packagesBackup, packagesDir);
  }
  
  console.log('✅ Railway build completed successfully!');
  
} catch (error) {
  // Restore packages directory even if build fails
  const packagesBackup = path.join(__dirname, '..', 'packages_backup');
  const packagesDir = path.join(__dirname, '..', 'packages');
  
  if (fs.existsSync(packagesBackup)) {
    console.log('📦 Restoring packages directory after error...');
    fs.renameSync(packagesBackup, packagesDir);
  }
  
  console.error('❌ Railway build failed:', error.message);
  process.exit(1);
}